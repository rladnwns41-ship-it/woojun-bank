/* 보드게임 대기·참가·취소. 모든 진입 경로가 같은 판돈/상태 검사를 사용한다. */
(function () {
  "use strict";
  if (window.WJBoardQueue) return;
  const WAIT_MS = 600000;
  class Queue {
    constructor({db, uid, name, now, stakes, game, linked}) {
      Object.assign(this, {db, uid, name, now, stakes, game, linked});
      this.cancels = new Map();
    }
    validStake(n) { return Number.isSafeInteger(n) && this.stakes.includes(n); }
    fresh(r) { return !!r && r.st === "wait" && !r.gu && this.validStake(r.stake) && !!this.game(r.g) && Number.isFinite(r.ts) && this.now() - r.ts < WAIT_MS && r.ts <= this.now() + 30000; }
    visible(tables) {
      // 예전 버그로 한 사람이 여러 방을 만든 기록도 한 사람의 대기 1건으로 표시한다.
      const hosts = new Set();
      return Object.keys(tables || {}).sort((a,b) => (tables[b].ts - tables[a].ts) || a.localeCompare(b)).filter(id => {
        const r = tables[id]; if (!this.fresh(r) || hosts.has(r.h)) return false;
        hosts.add(r.h); return true;
      });
    }
    async room(id) { return (await this.db.ref("tables/" + id).once("value")).val(); }
    async user() { return (await this.db.ref("users/" + this.uid).once("value")).val(); }
    async userTx(fn) {
      const ref = this.db.ref("users/" + this.uid);
      await ref.once("value");
      return ref.transaction(fn, undefined, false);
    }
    async waits() { return (await this.db.ref("tables").orderByChild("st").equalTo("wait").once("value")).val() || {}; }
    matched(id) { const e = new Error("취소 직전에 상대가 입장했어요. 시작된 대국으로 돌아갑니다."); e.room = id; return e; }
    async clearTicket(id) {
      await this.userTx(u => { if (!u || u.gameWait?.id !== id) return; delete u.gameWait; return u; });
    }
    async refundWait(id, r) {
      if (!r || r.h !== this.uid || r.st !== "cancelled" || !this.validStake(r.stake)) return;
      let credited = false;
      await this.userTx(u => {
        credited = false; if (!u) return;
        if (u.gameWaitRefunds?.[id]) { credited = true; return; }
        u.cash = (u.cash || 0) + r.stake;
        (u.gameWaitRefunds ||= {})[id] = { amount: r.stake, at: this.now() };
        if (u.gameWait?.id === id) delete u.gameWait;
        credited = true; return u;
      });
      if (!credited) throw new Error("취소는 반영됐지만 환불을 확인하지 못했어요. 다시 접속하면 재처리합니다.");
      // 지갑의 환불 영수증이 먼저 확정된다. 재시도/다른 탭에서도 중복 환불되지 않는다.
      await this.db.ref("tables/" + id + "/waitRefunded").set(true);
    }
    async cancel(id) {
      if (this.cancels.has(id)) return this.cancels.get(id);
      const task = this.cancelOne(id); this.cancels.set(id, task);
      try { return await task; } finally { this.cancels.delete(id); }
    }
    async cancelOne(id) {
      const ref = this.db.ref("tables/" + id), before = await this.room(id);
      if (!before) return {status:"missing"};
      if (before.h !== this.uid) throw new Error("내가 만든 대기만 취소할 수 있어요.");
      const res = await ref.transaction(r => {
        if (!r || r.h !== this.uid || r.st !== "wait" || r.gu) return;
        r.st = "cancelled"; r.fin = this.now(); r.why = "대기 취소"; return r;
      }, undefined, false);
      const r = res.snapshot.val();
      if (r?.st === "play" || r?.st === "done") return {status:"matched", room:id};
      if (r?.st === "cancelled" && r.h === this.uid) { await this.refundWait(id, r); return {status:"cancelled", room:id}; }
      return {status:"missing"};
    }
    async refundMissingTicket(ticket) {
      if (!ticket || !this.validStake(ticket.stake)) return;
      await this.userTx(u => {
        if (!u || u.gameWait?.id !== ticket.id) return;
        if (!u.gameWaitRefunds?.[ticket.id]) {
          u.cash = (u.cash || 0) + ticket.stake;
          (u.gameWaitRefunds ||= {})[ticket.id] = {amount:ticket.stake, at:this.now()};
        }
        delete u.gameWait; return u;
      });
    }
    async cancelAll(except = null) {
      const waits = await this.waits();
      for (const id of Object.keys(waits)) {
        if (id === except || waits[id].h !== this.uid) continue;
        const result = await this.cancel(id);
        if (result.status === "matched") throw this.matched(id);
      }
      const u = await this.user(), ticket = u?.gameWait;
      if (ticket && ticket.id !== except) {
        const r = await this.room(ticket.id);
        if (r?.st === "play" || r?.st === "done") {
          if (r.st === "play") throw this.matched(ticket.id);
          await this.clearTicket(ticket.id);
        } else if (r?.st === "cancelled") await this.refundWait(ticket.id, r);
        else if (!r) {
          if (this.now() - ticket.at < 60000) throw new Error("다른 창에서 대기를 만드는 중이에요. 잠시 후 다시 시도하세요.");
          await this.refundMissingTicket(ticket);
        }
      }
    }
    async recover(keep = null) {
      const u = await this.user(), ticket = u?.gameWait;
      if (!keep && ticket) { const r = await this.room(ticket.id); if (this.fresh(r) || r?.st === "play") keep = ticket.id; }
      await this.cancelAll(keep);
      const cancelled = (await this.db.ref("tables").orderByChild("st").equalTo("cancelled").once("value")).val() || {};
      for (const [id,r] of Object.entries(cancelled)) if (r.h === this.uid && !r.waitRefunded) await this.refundWait(id,r);
      for (const [id,hold] of Object.entries(u?.gameJoinHolds || {})) {
        if (hold.state !== "held") continue;
        const r = await this.room(id);
        if (r && r.gu === this.uid && (r.st === "play" || r.st === "done")) continue;
        if (!r || r.st !== "wait" || !this.fresh(r)) await this.releaseJoin(id, hold.token);
      }
      return keep;
    }
    async create(gid, stake, invite = false) {
      if (!this.game(gid) || !this.validStake(stake)) throw new Error("게임 또는 판돈이 올바르지 않아요.");
      const waits = await this.waits();
      const own = Object.keys(waits).filter(id => {
        const r = waits[id]; return this.fresh(r) && r.h === this.uid && r.g === gid && r.stake === stake && !!r.invite === invite;
      }).sort((a,b) => waits[b].ts - waits[a].ts)[0];
      if (own) { await this.cancelAll(own); return own; }
      await this.cancelAll();
      const ref = this.db.ref("tables").push(), id = ref.key, at = this.now();
      // 차감과 대기 예약을 같은 지갑 트랜잭션에서 처리해 다른 탭의 중복 생성도 막는다.
      const claim = await this.userTx(u => {
        if (!u || u.gameWait || (u.cash || 0) < stake) return;
        u.cash = (u.cash || 0) - stake; u.gameWait = {id, stake, at}; return u;
      });
      if (!claim.committed) {
        const u = claim.snapshot.val(), other = u?.gameWait;
        if (other) {
          const r = await this.room(other.id);
          if (r?.h === this.uid && this.fresh(r) && r.g === gid && r.stake === stake && !!r.invite === invite) return other.id;
          if (r?.st === "play") throw this.matched(other.id);
          throw new Error("대기 요청을 처리 중이에요. 잠시 후 다시 시도하세요.");
        }
        throw new Error("현금이 부족해요.");
      }
      const room = {g:gid, stake, h:this.uid, hn:this.name(), st:"wait", invite, ts:at};
      try { await ref.set(room); return id; }
      catch (e) {
        // 전송 응답만 유실된 경우 이미 생성된 방을 확인하고 재사용한다.
        let actual; try { actual = await this.room(id); } catch (_) { throw new Error("연결을 확인해 주세요. 같은 요청을 다시 누르면 대기를 복구합니다."); }
        if (actual) return id;
        await this.refundMissingTicket({id,stake,at}); throw e;
      }
    }
    async holdJoin(id, stake, token) {
      const res = await this.userTx(u => {
        if (!u || (u.cash || 0) < stake || u.gameJoinHolds?.[id]?.state === "held") return;
        u.cash = (u.cash || 0) - stake;
        (u.gameJoinHolds ||= {})[id] = {state:"held", amount:stake, token, at:this.now()}; return u;
      });
      if (!res.committed) throw new Error(res.snapshot.val()?.gameJoinHolds?.[id]?.state === "held" ? "이미 이 방의 참가 요청을 처리 중이에요." : "현금이 부족해요.");
    }
    async releaseJoin(id, token) {
      await this.userTx(u => {
        const h = u?.gameJoinHolds?.[id]; if (!h || h.state !== "held" || h.token !== token) return;
        u.cash = (u.cash || 0) + h.amount; h.state = "refunded"; return u;
      });
    }
    async join(id, selectedStake) {
      const r0 = await this.room(id);
      if (r0?.gu === this.uid && (r0.st === "play" || r0.st === "done")) return true;
      if (!this.fresh(r0)) throw new Error("취소되었거나 이미 시작된 대국이에요.");
      if (r0.h === this.uid) throw new Error("내 대기방이에요.");
      if (!this.validStake(selectedStake) || r0.stake !== selectedStake) throw new Error("선택한 판돈과 이 방의 판돈이 같아야 참가할 수 있어요.");
      if (r0.stake > 0 && await this.linked(this.uid,r0.h)) throw new Error("같은 기기에서 쓴 계정끼리는 돈 걸린 대국을 할 수 없어요.");
      await this.cancelAll();
      const token = this.uid + ":" + this.now() + ":" + Math.random();
      await this.holdJoin(id,r0.stake,token);
      let result;
      try {
        result = await this.db.ref("tables/" + id).transaction(r => {
          if (!this.fresh(r) || r.h !== r0.h || r.g !== r0.g || r.stake !== selectedStake) return;
          r.gu = this.uid; r.gn = this.name(); r.st = "play";
          r.p0 = Math.random() < .5 ? r.h : this.uid; r.seed = Math.floor(Math.random()*2e9);
          r.dl = this.now() + (this.game(r.g).turnSec || 30)*1000 + 3000; r.m = []; return r;
        }, undefined, false);
      } catch (e) {
        let actual; try { actual = await this.room(id); } catch (_) { throw new Error("참가 결과를 확인 중이에요. 연결 후 다시 접속하면 복구합니다."); }
        if (actual?.gu === this.uid && (actual.st === "play" || actual.st === "done")) return true;
        await this.releaseJoin(id,token); throw e;
      }
      const r = result.snapshot.val();
      if (result.committed || r?.gu === this.uid && (r.st === "play" || r.st === "done")) return true;
      await this.releaseJoin(id,token);
      throw new Error("상대가 취소했거나 다른 참가자가 먼저 들어왔어요. 판돈은 환불됐어요.");
    }
  }
  window.WJBoardQueue = {Queue, WAIT_MS};
})();
