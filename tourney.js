// 우준은행 토너먼트 — 접속자 초대 → 수락하면 참가 보너스 → 대진표 → 대국마다 둘 다 준비 완료하면 시작 → 최종 우승자가 상금
// 모든 로그인 페이지에서 돌아간다(wj-ui.js가 불러옴). 진행은 접속 중인 아무 브라우저나 트랜잭션으로 한 단계씩 밀어 준다.
(function () {
  if (window.WJT) return;
  // 매주 목요일(한국 시간) 20시부터 접속자 2명 이상이면 자동으로 열린다. 주마다 한 번.
  const ENTRY = 50000, INVITE_MS = 5 * 60000, READY_MS = 60000, AUTO_MIN = 2, STALE_MS = 180000, OPEN_DAY = 4, OPEN_HOUR = 19;
  const PRIZE_MIN = 100000000, PRIZE_MAX = 1000000000, PRIZE_STEP = 10000000;
  const randPrize = () => PRIZE_MIN + Math.floor(Math.random() * ((PRIZE_MAX - PRIZE_MIN) / PRIZE_STEP + 1)) * PRIZE_STEP;
  const kst = t => new Date(t + 9 * 3600000);
  const weekKey = t => { const d = kst(t), back = (d.getUTCDay() - OPEN_DAY + 7) % 7; return new Date(d.getTime() - back * 86400000).toISOString().slice(0, 10); };
  const isOpenTime = t => { const d = kst(t); return d.getUTCDay() === OPEN_DAY && d.getUTCHours() >= OPEN_HOUR; };
  const nextOpen = t => { const d = kst(t); let add = (OPEN_DAY - d.getUTCDay() + 7) % 7; const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + add, OPEN_HOUR) - 9 * 3600000; return base > t ? base : base + 7 * 86400000; };
  const GAMES = { uno: "우노", minigolf: "미니골프", omok: "오목", othello: "오델로", connect4: "사목", checkers: "체커", pool: "포켓볼", indian: "인디언 포커", baseball: "숫자야구", chicken: "치킨 차차차" };
  const POOL = Object.keys(GAMES);
  const roundName = n => n <= 2 ? "결승" : n + "강";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let force = 0, db = null, me = null, myName = "", off = 0, T = null, online = {}, lastKey = "", prevW = {}, seenInvite = "", ticking = false;
  const now = () => Date.now() + off;
  const F = n => window.WJ ? WJ.fmt(n) : String(n);
  const toast = (m, icon) => { try { WJUI.toast(m, { icon: icon || "🏆", html: true, ms: 4200 }); } catch (e) {} };
  const tx = f => db.ref("tourney/cur").transaction(f).catch(() => ({ committed: false }));
  const curRound = c => (c && c.r && c.r[c.ri || 0]) || [];
  const myMatch = c => { const R = curRound(c); for (let i = 0; i < R.length; i++) if (R[i] && (R[i].a === me || R[i].b === me)) return [R[i], i]; return [null, -1]; };
  const nameOf = (c, k) => (c && c.p && c.p[k] && c.p[k].n) || "?";
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mk = (a, b) => ({ a: a || "", b: b || "", dl: now() + READY_MS });
  const active = c => !!c && (c.st === "invite" || c.st === "play");

  // ---------- 열기 ----------
  async function open(forced) {
    const ids = Object.keys(online), wk = weekKey(now());
    const p = {}; ids.forEach(k => { p[k] = { n: online[k].n || "?", s: "inv" }; });
    const g = POOL[Math.floor(Math.random() * POOL.length)], prize = randPrize();
    const res = await tx(c => { if (active(c)) return; if (forced) { if (c && (c.ts || 0) >= force) return; } else if ((c && c.week === wk && !(c.st === "cancel" && (c.n || 0) < 2)) || !isOpenTime(now())) return; return { id: "t" + now().toString(36), week: forced ? "dev-" + now().toString(36) : wk, dev: !!forced, g, prize, st: "invite", ts: now(), until: now() + INVITE_MS, by: me, p, ri: 0 }; });
    return res.committed;
  }
  function maybeAuto() { const t = now();
    if (force && t - force < 600000 && (!T || (T.ts || 0) < force)) { if (Object.keys(online).length >= 1) open(true); return; } if (!isOpenTime(t) || Object.keys(online).length < AUTO_MIN) return; if (!T || (!active(T) && (T.week !== weekKey(t) || (T.st === "cancel" && (T.n || 0) < 2 && t - (T.fin || 0) > 600000)))) open(); }

  // ---------- 모집 마감 → 대진표 ----------
  function seed(c) {
    const ids = shuffle(Object.keys(c.p || {}).filter(k => c.p[k].s === "in"));
    Object.keys(c.p || {}).forEach(k => { if (c.p[k].s === "inv") c.p[k].s = "late"; });
    c.n = ids.length;
    if (ids.length < 2) { c.st = "cancel"; c.fin = now(); c.why = ids.length ? "참가자가 1명뿐이라 취소됐어요" : "참가자가 없어 취소됐어요"; return c; }
    let size = 2; while (size < ids.length) size *= 2;
    const half = size / 2, R = []; for (let i = 0; i < half; i++) R.push(mk(ids[i], ids[i + half]));
    c.size = size; c.prize = c.prize || randPrize(); c.st = "play"; c.r = [R]; c.ri = 0; return c;
  }

  // ---------- 진행 ----------
  async function advance() {
    const R = curRound(T), id = T.id, rooms = {};
    await Promise.all(R.map(async (m, i) => { if (m && m.room && !m.w) { const s = await db.ref("tables/" + m.room).once("value").catch(() => null); rooms[i] = s ? s.val() : undefined; } }));
    // 방치된 대국은 추첨으로 끝낸다
    for (const i in rooms) { const r = rooms[i]; if (r && r.st === "play" && now() > (r.dl || 0) + STALE_MS) await db.ref("tables/" + R[i].room).transaction(x => { if (!x || x.st !== "play" || now() < (x.dl || 0) + STALE_MS) return; x.st = "done"; x.win = Math.random() < .5 ? x.h : x.gu; x.why = "장시간 응답 없음 · 추첨"; x.fin = now(); return x; }).catch(() => {}); }
    // 둘 다 준비 완료 → 대국방 만들기 (당사자 브라우저만)
    for (let i = 0; i < R.length; i++) { const m = R[i], acc = (m && m.acc) || {};
      if (!m || m.w || m.room || !m.b || !(acc[m.a] === true && acc[m.b] === true) || (me !== m.a && me !== m.b)) continue;
      const ref = db.ref("tables").push(), t0 = now(), first = Math.random() < .5;
      await ref.set({ g: T.g, stake: 0, h: m.a, hn: nameOf(T, m.a), gu: m.b, gn: nameOf(T, m.b), st: "play", invite: true, p0: first ? m.a : m.b, seed: Math.floor(Math.random() * 2e9), dl: t0 + 90000, m: [], ts: t0, tid: id, tr: roundName(R.length * 2) }).catch(() => {});
      const res = await tx(c => { if (!c || c.id !== id) return; const x = curRound(c)[i]; if (!x || x.room || x.w) return; x.room = ref.key; return c; });
      if (!res.committed) ref.remove().catch(() => {});
    }
    const t = now(), stale = (m, i) => !m.w && (!m.b || !m.a || (m.acc && (m.acc[m.a] === false || m.acc[m.b] === false)) || (!m.room && t > m.dl && !(m.acc && m.acc[m.a] === true && m.acc[m.b] === true)) || (m.room && (rooms[i] === null || (rooms[i] && rooms[i].st === "done"))));
    if (!R.some(stale) && !R.every(m => m && m.w)) return;
    let payTo = null, payAmt = 0, token = Math.random().toString(36).slice(2);
    const res = await tx(c => {
      payTo = null; if (!c || c.id !== id || c.st !== "play") return; const RR = curRound(c);
      RR.forEach((m, i) => { if (!m || m.w) return; const acc = m.acc || {};
        if (!m.a && !m.b) { m.w = "x"; m.why = "공석"; return; }
        if (!m.b || !m.a) { m.w = m.a || m.b; m.why = "부전승"; return; }
        if (!m.room) { const ra = acc[m.a] === true, rb = acc[m.b] === true; if (ra && rb) return;
          if (acc[m.a] === false || acc[m.b] === false || now() > m.dl) { if (ra) { m.w = m.a; m.why = "상대 불참"; } else if (rb) { m.w = m.b; m.why = "상대 불참"; } else { m.w = "x"; m.why = "둘 다 불참"; } } return; }
        const r = rooms[i]; if (r === null) { m.room = null; return; } if (!r || r.st !== "done") return;
        if (r.win === "draw") { m.dr = (m.dr || 0) + 1; if (m.dr >= 2) { m.w = Math.random() < .5 ? m.a : m.b; m.why = "무승부 2번 · 추첨"; } else { m.room = null; m.why = "무승부 · 재경기"; } return; }
        m.w = r.win; m.why = r.why || "승리"; });
      if (!RR.every(m => m && m.w)) return c;
      const wins = RR.map(m => m.w);
      if (RR.length === 1) { const w = wins[0]; c.fin = now(); if (w === "x") { c.st = "cancel"; c.why = "결승 진출자가 모두 불참했어요"; return c; } c.st = "done"; c.champ = w; c.champN = nameOf(c, w); c.paid = token; payTo = w; payAmt = c.prize || 0; return c; }
      const NR = []; for (let j = 0; j < RR.length; j += 2) { let a = wins[j] === "x" ? "" : wins[j], b = wins[j + 1] === "x" ? "" : wins[j + 1]; if (!a && b) { a = b; b = ""; } NR.push(a ? mk(a, b) : { a: "", b: "", w: "x", why: "공석" }); }
      if (NR.every(m => !m.a)) { c.st = "cancel"; c.fin = now(); c.why = "남은 참가자가 없어요"; return c; }
      c.r.push(NR); c.ri = c.r.length - 1; return c;
    });
    if (res.committed && payTo && res.snapshot && res.snapshot.val() && res.snapshot.val().paid === token) {
      const v = res.snapshot.val();
      await WJ.addCash(payTo, payAmt, true); WJ.log(payTo, "game", { text: "토너먼트 우승 · " + (GAMES[v.g] || v.g), amount: payAmt });
      db.ref("tourney/hist").push({ g: v.g, champ: payTo, champN: v.champN || "", prize: payAmt, n: v.n || 0, fin: v.fin || now() }).catch(() => {});
    }
  }
  async function tick() {
    if (ticking || !db) return; ticking = true;
    try {
      if (!active(T)) maybeAuto();
      else if (T.st === "invite") {
        const add = Object.keys(online).filter(k => !(T.p || {})[k]);
        if (now() >= T.until) await tx(c => { if (!c || c.id !== T.id || c.st !== "invite" || now() < c.until) return; return seed(c); });
        else if (add.length) await tx(c => { if (!c || c.id !== T.id || c.st !== "invite") return; c.p = c.p || {}; add.forEach(k => { if (!c.p[k]) c.p[k] = { n: (online[k] && online[k].n) || "?", s: "inv" }; }); return c; });
      } else if (T.st === "play") await advance();
    } catch (e) {} finally { ticking = false; }
  }

  // ---------- 내 응답 ----------
  async function join() {
    if (!T || T.st !== "invite") return; const id = T.id; let ok = false;
    const res = await tx(c => { ok = false; if (!c || c.id !== id || c.st !== "invite") return; c.p = c.p || {}; const p = c.p[me]; if (p && p.s !== "inv") return; c.p[me] = { n: myName || (p && p.n) || "?", s: "in" }; ok = true; return c; });
    if (res.committed && ok) { await WJ.addCash(me, ENTRY, true); WJ.log(me, "game", { text: "토너먼트 참가 보너스", amount: ENTRY }); WJ.sfx("coin"); toast("토너먼트 참가 완료 · <b>+" + F(ENTRY) + "준</b>", "🎟️"); }
  }
  async function decline() { if (!T || T.st !== "invite") return; const id = T.id; await tx(c => { if (!c || c.id !== id || c.st !== "invite") return; c.p = c.p || {}; const p = c.p[me]; if (p && p.s !== "inv") return; c.p[me] = { n: myName || (p && p.n) || "?", s: "out" }; return c; }); }
  async function respond(yes) {
    if (!T || T.st !== "play") return; const id = T.id;
    await tx(c => { if (!c || c.id !== id || c.st !== "play") return; const [m] = myMatch(c); if (!m || m.w || m.room) return; m.acc = m.acc || {}; if (m.acc[me] != null) return; m.acc[me] = !!yes; return c; });
    if (yes) WJ.sfx("click"); setTimeout(tick, 300);
  }

  // ---------- 화면 (모달 · 하단 칩) ----------
  const onRoomPage = room => /games\.dc\.html$/.test(location.pathname) && new URLSearchParams(location.search).get("room") === room;
  function view() {
    if (!T || !me || /tournament\.dc\.html$/.test(location.pathname)) return null;
    const t = now(), g = GAMES[T.g] || T.g;
    if (T.st === "invite" && T.p && T.p[me] && T.p[me].s === "inv" && t < T.until) {
      const n = Object.keys(T.p).filter(k => T.p[k].s === "in").length;
      return { kind: "modal", eyebrow: "목요일 토너먼트 초대", title: g + " 토너먼트에 참가하세요", body: "수락하면 바로 <b>" + F(ENTRY) + "준</b> · 우승 상금 <b>" + F(T.prize || 0) + "준</b> · 지금 " + n + "명 참가", sec: Math.ceil((T.until - t) / 1000), total: INVITE_MS / 1000, no: ["decline", "거절"], yes: ["join", "수락하고 5만준 받기"] };
    }
    if (T.st === "play") {
      const [m] = myMatch(T); if (!m || m.w || !m.a || !m.b) return null;
      const opp = nameOf(T, m.a === me ? m.b : m.a), acc = m.acc || {}, rn = roundName(curRound(T).length * 2);
      if (m.room) return onRoomPage(m.room) ? null : { kind: "chip", text: rn + " · " + esc(opp) + "님과 대국 중", act: ["enter", "대국 입장"] };
      if (acc[me] == null && t < m.dl) return { kind: "modal", eyebrow: g + " 토너먼트 · " + rn, title: esc(opp) + "님과 대국할 준비 됐나요?", body: "둘 다 준비하면 바로 시작해요. 시간 안에 안 누르면 상대가 올라가요.", sec: Math.ceil((m.dl - t) / 1000), total: READY_MS / 1000, no: ["forfeit", "기권"], yes: ["ready", "준비 완료"] };
      if (acc[me] === true) return { kind: "chip", text: rn + " · " + esc(opp) + "님 준비 기다리는 중 · " + Math.max(0, Math.ceil((m.dl - t) / 1000)) + "초", act: ["view", "대진표"] };
    }
    return null;
  }
  const btn = (act, label, primary) => '<button data-wjt="' + act + '" style="height:42px;border:0;border-radius:14px;font:inherit;font-size:15px;font-weight:700;cursor:pointer;background:' + (primary ? "#3182F6" : "#F2F4F6") + ";color:" + (primary ? "#fff" : "#4E5968") + '">' + label + "</button>";
  function html(v) {
    const FONT = "font-family:'Pretendard Variable',Pretendard,system-ui,sans-serif;letter-spacing:-0.2px";
    if (v.kind === "chip") return '<div style="position:fixed;left:16px;bottom:16px;z-index:99970;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 32px);background:#191F28;color:#fff;border-radius:16px;padding:10px 10px 10px 16px;box-shadow:0 12px 32px rgba(0,0,0,.25);' + FONT + '"><span style="width:8px;height:8px;border-radius:50%;background:#F04452;flex:none;animation:wjblink 1.4s infinite"></span><span style="font-size:14px;font-weight:700;min-width:0">' + v.text + '</span><button data-wjt="' + v.act[0] + '" style="flex:none;height:36px;border:0;border-radius:10px;padding:0 14px;background:#3182F6;color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer">' + v.act[1] + "</button></div>";
    const pct = Math.max(0, Math.min(100, v.sec / v.total * 100)), hot = v.sec <= 10;
    // 화면을 막지 않는 왼쪽 아래 카드
    return '<div role="status" style="position:fixed;left:16px;bottom:16px;z-index:99970;width:min(360px,calc(100vw - 32px));background:#fff;border-radius:20px;padding:16px 16px 14px;box-shadow:0 16px 40px rgba(0,27,55,.22),0 0 0 1px rgba(0,27,55,.06);color:#191F28;' + FONT + '">'
      + '<div style="display:flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:50%;background:' + (hot ? "#F04452" : "#3182F6") + ';flex:none;animation:wjblink 1.4s infinite"></span><span style="flex:1;min-width:0;font-size:12px;font-weight:800;color:#3182F6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + v.eyebrow + '</span><span style="flex:none;font-size:12px;font-weight:800;color:' + (hot ? "#F04452" : "#8B95A1") + '">' + (v.sec > 0 ? v.sec + "초" : "처리 중") + '</span><a href="tournament.dc.html" style="flex:none;font-size:12px;font-weight:700;color:#8B95A1;text-decoration:none">대진표</a></div>'
      + '<div style="font-size:16px;font-weight:800;margin-top:8px;letter-spacing:-.4px;line-height:1.4">' + v.title + '</div><div style="font-size:12px;color:#6B7684;line-height:1.55;margin-top:4px">' + v.body + "</div>"
      + '<div style="height:4px;border-radius:4px;background:#F2F4F6;margin-top:12px;overflow:hidden"><div style="height:100%;width:' + pct.toFixed(1) + '%;background:' + (hot ? "#F04452" : "#3182F6") + ';transition:width 1s linear"></div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1.7fr;gap:6px;margin-top:12px">' + btn(v.no[0], v.no[1], false) + btn(v.yes[0], v.yes[1], true) + "</div></div>";
  }
  function render() {
    if (!document.body || !me) return;
    let el = document.getElementById("wj-tour"); if (!el) { el = document.createElement("div"); el.id = "wj-tour"; document.body.appendChild(el); el.addEventListener("click", onClick); }
    const v = view(), key = v ? JSON.stringify(v) : ""; if (key === lastKey) return; lastKey = key; el.innerHTML = v ? html(v) : "";
  }
  function onClick(e) {
    const b = e.target.closest("[data-wjt]"); if (!b) return; const a = b.dataset.wjt; b.disabled = true;
    if (a === "join") join(); else if (a === "decline") decline(); else if (a === "ready") respond(true); else if (a === "forfeit") { if (confirm("기권하면 상대가 다음 라운드로 올라가요. 기권할까요?")) respond(false); else b.disabled = false; }
    else if (a === "enter") { const [m] = myMatch(T); if (m && m.room) location.href = "games.dc.html?room=" + m.room; }
    else if (a === "view") location.href = "tournament.dc.html";
  }
  // 상태가 바뀔 때 알림 (초대 · 라운드 결과 · 우승)
  function notice(c) {
    if (!c || !me) return;
    if (c.st === "invite" && c.p && c.p[me] && c.p[me].s === "inv" && seenInvite !== c.id) { seenInvite = c.id; try { WJ.sfx("bell"); if (document.hidden) { WJUI.blink("● 토너먼트 초대!"); WJUI.notify("우준은행 토너먼트", (GAMES[c.g] || c.g) + " 토너먼트에 초대됐어요. 수락하면 5만준!"); } } catch (e) {} }
    (c.r || []).forEach((R, ri) => (R || []).forEach((m, i) => { if (!m || (m.a !== me && m.b !== me)) return; const k = c.id + ":" + ri + ":" + i;
      if (m.room && !m.w && !prevW[k + "r"]) { prevW[k + "r"] = 1; if (!onRoomPage(m.room)) { try { WJ.sfx("bell"); if (document.hidden) { WJUI.blink("● 대국 시작!"); WJUI.notify("우준은행 토너먼트", "대국이 시작됐어요. 지금 입장하세요!"); } } catch (e) {} } }
      if (m.w && !prevW[k]) { prevW[k] = 1; if (!prevW._init) return; if (c.st === "done" && c.champ === me) return; if (m.w === me) toast(m.b ? "<b>" + roundName(R.length * 2) + " 승리!</b> 다음 라운드로 올라가요" : "부전승으로 다음 라운드에 올라가요", "🎉"); else toast(roundName(R.length * 2) + "에서 탈락했어요 · " + esc(m.why || ""), "🥲"); }
    }));
    if (c.st === "done" && c.champ === me && !prevW[c.id + "champ"]) { prevW[c.id + "champ"] = 1; if (prevW._init) { try { WJ.sfx("win"); WJ.confetti(1.4); } catch (e) {} toast("<b>토너먼트 우승!</b> 상금 +" + F(c.prize || 0) + "준", "🏆"); } }
    prevW._init = 1;
  }
  async function boot() {
    while (!window.WJ) await new Promise(r => setTimeout(r, 60));
    await WJ.authReady; me = WJ.uid(); if (!me) return; db = await WJ.ready;
    db.ref("users/" + me + "/name").on("value", s => { myName = s.val() || ""; });
    WJ.presence(me).catch(() => {});
    db.ref(".info/serverTimeOffset").on("value", s => { off = s.val() || 0; });
    db.ref("online").on("value", s => { online = WJ.liveOnline ? WJ.liveOnline(s.val()) : (s.val() || {}); });
    db.ref("tourney/force").on("value", s => { force = s.val() || 0; setTimeout(tick, 300); }, () => {});
    db.ref("tourney/cur").on("value", s => { T = s.val(); notice(T); render(); try { window.dispatchEvent(new CustomEvent("wj-tourney", { detail: T })); } catch (e) {} }, () => {});
    setInterval(render, 1000); setInterval(tick, 3000); setTimeout(tick, 1500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  window.WJT = { ENTRY, GAMES, PRIZE_MIN, PRIZE_MAX, nextOpen, isOpenTime, weekKey, roundName, join, decline, respond, state: () => T, me: () => me, now, online: () => online, curRound, myMatch, nameOf };
})();
