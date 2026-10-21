// 추가 보드게임: 윷놀이 · 월드 마블 · 배틀쉽 · 인디언 포커 · 숫자야구
(function () {
  const BG = window.BG;
  if (!BG || BG.extraLoaded || !BG.art) return;
  const K = BG.art, C = K.C, S = BG.S, G = BG.GAMES;
  const { fill, stroke, dot, ring, txt, tex, woodGrain, table, sheet, token, button, pill, hitUI } = K;
  const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const P2 = [C.red, C.blue], P2D = [C.redD, C.blueD];

  // ================= 윷놀이 =================
  const YN = ["", "도", "개", "걸", "윷", "모"];
  const yNode = i => { const L = [120, 50], R = [440, 370], st = 64, lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], ctr = [280, 210];
    if (i === 0) return [440, 370]; if (i <= 5) return [440, 370 - st * i]; if (i <= 10) return [440 - st * (i - 5), 50]; if (i <= 15) return [120, 50 + st * (i - 10)]; if (i <= 19) return [120 + st * (i - 15), 370];
    if (i === 22) return ctr; if (i === 20 || i === 21) return lerp([440, 50], ctr, (i - 19) / 3); if (i === 23 || i === 24) return lerp(ctr, [120, 370], (i - 22) / 3); if (i === 25 || i === 26) return lerp([120, 50], ctr, (i - 24) / 3); return lerp(ctr, [440, 370], (i - 26) / 3); };
  const OUT = [...Array(19)].map((_, i) => i + 1).concat(0), D1 = [20, 21, 22, 23, 24, 15, 16, 17, 18, 19, 0], D2 = [25, 26, 22, 27, 28, 0];
  const yRoute = p => p === -1 ? OUT : p === 5 ? D1 : p === 10 ? D2 : p === 22 ? [27, 28, 0] : [20, 21, 23, 24].includes(p) ? D1.slice(D1.indexOf(p) + 1) : [25, 26, 27, 28].includes(p) ? D2.slice(D2.indexOf(p) + 1) : OUT.slice(p);
  const yDest = (p, n) => { const r = yRoute(p); if (n > r.length) return 99; const d = r[n - 1]; return d === 0 ? 99 : d; };
  const yMovers = (s, me) => { const seen = new Set(), out = []; s.pc[me].forEach((p, i) => { if (p === 99) return; const key = p === -1 ? "h" : p; if (seen.has(key)) return; seen.add(key); out.push(i); }); return out; };
  G.push({ id: "yut", name: "윷놀이", tag: "전통", color: "#B5402E", sides: ["빨강", "파랑"], sideColor: [C.red, C.blue], turnSec: 40,
    desc: "윷을 던져 도·개·걸·윷·모만큼 말을 옮겨요. 윷과 모, 상대 말을 잡으면 한 번 더. 같은 자리 내 말은 업고 가요. 말 4개를 먼저 모두 내보내면 승리.",
    keys: "윷 던지기 → 결과 고르고 말 선택",
    init: seed => ({ seed: seed || 1, pc: [[-1, -1, -1, -1], [-1, -1, -1, -1]], t: 0, n: 0, pend: [], ph: "throw", lt: 0, msg: "", win: null }),
    turn: s => s.t,
    legal(s) { if (s.win != null) return []; if (s.ph === "throw") return ["throw"]; const M = []; [...new Set(s.pend)].forEach(v => { const k = s.pend.indexOf(v); yMovers(s, s.t).forEach(p => M.push({ a: "move", p, k })); }); return M; },
    apply(s, m) { const me = s.t, op = 1 - me, ns = { seed: s.seed, pc: [s.pc[0].slice(), s.pc[1].slice()], t: me, n: s.n + 1, pend: s.pend.slice(), ph: s.ph, lt: s.lt, msg: "", win: null };
      if (m === "throw") { if (s.ph !== "throw") return s; const r = K.rnd(s.seed * 31 + s.n * 7919 + 17); r(); let f = 0; for (let k = 0; k < 4; k++) if (r() < .5) f++; const v = f === 0 ? 5 : f; ns.pend.push(v); ns.lt = v; ns.tn = ns.n; ns.ph = v >= 4 ? "throw" : "move"; ns.msg = me + "|" + YN[v] + (v >= 4 ? "! 한 번 더" : ""); return ns; }
      if (!m || m.a !== "move" || s.ph !== "move" || s.pend[m.k] == null) return s; const pos = s.pc[me][m.p]; if (pos == null || pos === 99) return s;
      const v = s.pend[m.k], d = yDest(pos, v), grp = pos === -1 ? [m.p] : s.pc[me].map((p, i) => p === pos ? i : -1).filter(i => i >= 0);
      grp.forEach(i => ns.pc[me][i] = d); ns.pend.splice(m.k, 1); let cap = 0;
      if (d !== 99) ns.pc[op] = ns.pc[op].map(p => p === d ? (cap++, -1) : p);
      ns.msg = me + "|" + (cap ? "잡았다! 한 번 더" : d === 99 ? "골인" : YN[v] + " 이동") + (grp.length > 1 ? " · 업어서 " + grp.length + "개" : "");
      if (ns.pc[me].every(p => p === 99)) { ns.win = me; return ns; }
      if (cap) ns.ph = "throw"; else if (ns.pend.length) ns.ph = "move"; else { ns.ph = "throw"; ns.t = op; }
      return ns; },
    result(s) { if (s.win != null) return { w: s.win, why: "말 4개 모두 골인" }; if (s.n >= 500) { const a = s.pc[0].filter(p => p === 99).length, b = s.pc[1].filter(p => p === 99).length; return { w: a === b ? -1 : a > b ? 0 : 1, why: "골인 " + a + " : " + b }; } return null; },
    homeHit(X, Y) { return Y > 404 && Y < 446 && X > 40 && X < 230; },
    pick(s, X, Y, me) { if (this.homeHit(X, Y)) { const i = s.pc[me].indexOf(-1); return i >= 0 ? i : null; } for (let n = 0; n < 29; n++) { const [nx, ny] = yNode(n); if (Math.hypot(X - nx, Y - ny) < 24) { const i = s.pc[me].indexOf(n); return i >= 0 ? i : null; } } return null; },
    hit(s, X, Y, v) { const u = v.ui; const id = hitUI(u, X, Y); if (!v.myTurn) return null; if (id === "throw") return { move: "throw" }; if (id && id.startsWith("k:")) { u.k = +id.slice(2); return { ui: 1 }; } if (s.ph !== "move") return null; const p = this.pick(s, X, Y, v.me); if (p == null) return null; const k = Math.min(u.k || 0, s.pend.length - 1); u.k = 0; return { move: { a: "move", p, k } }; },
    hover(s, X, Y, v) { const p = this.pick(s, X, Y, v.me); return p == null ? -1 : p; },
    draw(x, s, v) { const u = v.ui; u.hits = []; const me = v.me, op = 1 - me; fill(x, 0, 0, S, S, 22, "#E9DFCC"); tex(x, 0, 0, S, S, 22);
      sheet(x, 84, 16, 392, 388, 14, C.cream);
      x.strokeStyle = C.ink; x.lineWidth = 2; x.strokeRect(120, 50, 320, 320); x.beginPath(); x.moveTo(440, 50); x.lineTo(120, 370); x.moveTo(120, 50); x.lineTo(440, 370); x.stroke();
      for (let n = 0; n < 29; n++) { const [X, Y] = yNode(n), big = [0, 5, 10, 15, 22].includes(n); dot(x, X, Y, big ? 20 : 13, big ? "#E6DAC3" : C.cream); ring(x, X, Y, big ? 20 : 13, C.ink, 2); if (big) ring(x, X, Y, 14, C.ink, 1.2); }
      txt(x, "출발", 440, 398, 12, C.ink2, 800);
      const k = Math.min(u.k || 0, Math.max(0, s.pend.length - 1));
      if (v.myTurn && s.ph === "move" && v.hover >= 0 && s.pend.length) { const d = yDest(s.pc[me][v.hover], s.pend[k]); if (d !== 99) { const [X, Y] = yNode(d); x.save(); x.setLineDash([4, 4]); ring(x, X, Y, 22, P2[me], 3); x.restore(); } else pill(x, "골인", 440, 340, P2[me], C.cream); }
      [0, 1].forEach(p => { const at = {}; s.pc[p].forEach(q => { if (q >= 0 && q !== 99) at[q] = (at[q] || 0) + 1; }); Object.keys(at).forEach(q => { const [X, Y] = yNode(+q); token(x, X, Y, 15, P2[p], P2D[p]); if (at[q] > 1) { dot(x, X + 12, Y - 12, 9, C.ink); txt(x, at[q], X + 12, Y - 11, 11, C.cream, 800); } }); });
      const home = (p, X0, step, r) => s.pc[p].forEach((q, i) => { const X = X0 + i * step; if (q === -1) token(x, X, 425, r, P2[p], P2D[p]); else { ring(x, X, 425, r - 1, q === 99 ? P2[p] : "rgba(42,37,32,.2)", 2); if (q === 99) txt(x, "✓", X, 426, r, P2[p], 900); } });
      txt(x, "내 말", 24, 425, 12, C.ink2, 800, "left"); home(me, 80, 40, 15); if (v.myTurn && s.ph === "move" && v.hover === s.pc[me].indexOf(-1) && s.pc[me].includes(-1)) stroke(x, 60, 405, 160, 40, 10, P2[me], 2);
      txt(x, "상대", 536, 425, 12, C.ink2, 800, "right"); home(op, 360, 34, 12);
      const lt = s.lt || 0, flats = lt === 5 ? 0 : lt, now = Date.now(); if (s.tn != null && u.yT !== s.tn) { u.yT = s.tn; u.yS = now; }
      const yEl = u.yS ? now - u.yS : 1e9, yAnim = window.Phys && yEl < 950; if (yAnim) u.animUntil = now + 60;
      for (let i = 0; i < 4; i++) { let X = 30 + i * 30, Y = 466, flat = lt && i < flats; const tz = yAnim ? Phys.toss(yEl, (s.tn || 0) * 4 + i + 1, 900) : null;
        if (tz && !tz.settle) { flat = Math.floor(tz.rot * 2) % 2 === 0; x.save(); x.translate(X + 11 + tz.x, Y + 38 + tz.y); x.rotate(tz.rot * .6); x.translate(-(X + 11), -(Y + 38)); }
        else x.save();
        x.save(); x.shadowColor = "rgba(0,0,0,.25)"; x.shadowOffsetY = 2; fill(x, X, Y, 22, 76, 11, flat ? "#F3E9D2" : "#A9783F"); x.restore(); if (flat) for (let q = 0; q < 3; q++) { const yy = Y + 18 + q * 20; x.strokeStyle = C.ink; x.lineWidth = 1.6; x.beginPath(); x.moveTo(X + 6, yy - 4); x.lineTo(X + 16, yy + 4); x.moveTo(X + 16, yy - 4); x.lineTo(X + 6, yy + 4); x.stroke(); } else { x.strokeStyle = "rgba(0,0,0,.18)"; x.lineWidth = 1; x.beginPath(); x.moveTo(X + 11, Y + 6); x.lineTo(X + 11, Y + 70); x.stroke(); } x.restore(); }
      if (lt && !yAnim) txt(x, YN[lt], 86, 553, 13, C.ink, 800);
      s.pend.forEach((pv, i) => { const X = 160 + i * 52; if (v.myTurn) button(x, u, "k:" + i, X, 476, 46, 46, YN[pv], i === k && s.ph === "move" ? "primary" : "plain", true, 16); else { fill(x, X, 476, 46, 46, 10, "rgba(42,37,32,.12)"); txt(x, YN[pv], X + 23, 500, 16, C.ink2, 800); } });
      if (!s.pend.length) txt(x, s.t === me ? "윷을 던지세요" : "상대 차례", 160, 500, 14, C.mute, 700, "left");
      button(x, u, "throw", 388, 468, 152, 64, "윷 던지기", "red", v.myTurn && s.ph === "throw", 18);
      if (s.msg) { const [w2, t] = s.msg.split("|"); pill(x, (+w2 === me ? "나: " : "상대: ") + t, 280, 210, C.ink, C.cream, 14); } },
    extra: s => s.pc.map(a => "골인 " + a.filter(p => p === 99).length + " · 판 위 " + a.filter(p => p >= 0 && p !== 99).length)
  });

  // ================= 월드 마블 =================
  const MT = [["출발"], ["타이베이", 50], ["마닐라", 50], ["황금열쇠"], ["방콕", 70], ["싱가포르", 80], ["무인도"], ["카이로", 100], ["이스탄불", 100], ["아테네", 120], ["코펜하겐", 120], ["스톡홀름", 140], ["복지기금"], ["베른", 160], ["베를린", 160], ["황금열쇠"], ["오타와", 180], ["상파울루", 200], ["세금"], ["시드니", 220], ["하와이", 220], ["뉴욕", 260], ["런던", 280], ["서울", 300]];
  const MG = ["#C9952E", "#2F6B4F", "#2F5B86", "#B5402E"];
  const MCC = { 1: "tw", 2: "ph", 4: "th", 5: "sg", 7: "eg", 8: "tr", 9: "gr", 10: "dk", 11: "se", 13: "ch", 14: "de", 16: "ca", 17: "br", 19: "au", 20: "us", 21: "us", 22: "gb", 23: "kr" };
  const FLAG = i => "https://flagcdn.com/w80/" + MCC[i] + ".png"; Object.keys(MCC).forEach(i => K.img(FLAG(i)));
  const mPos = i => i <= 6 ? [480 - 80 * i, 480] : i <= 12 ? [0, 480 - 80 * (i - 6)] : i <= 18 ? [80 * (i - 12), 0] : [480, 80 * (i - 18)];
  const mRent = (s, i) => Math.round(MT[i][1] * (.25 + s.lv[i] * .45)), mUp = i => Math.round(MT[i][1] * .6);
  const mAssets = (s, p) => s.cash[p] + s.own.reduce((t, o, i) => o === p + 1 ? t + Math.round(MT[i][1] * (1 + s.lv[i] * .6)) : t, 0);
  const mEnd = ns => { if (ns.again) { ns.dbl++; ns.msg += " · 더블! 한 번 더"; } else { ns.dbl = 0; ns.t = 1 - ns.t; ns.turns++; } ns.again = false; ns.ph = "roll"; return ns; };
  G.push({ id: "marble", name: "월드 마블", tag: "보드", color: "#2F5B86", sides: ["빨강", "파랑"], sideColor: [C.red, C.blue], turnSec: 40,
    desc: "주사위를 굴려 세계 도시를 사고 건물을 올리세요. 상대 땅에 서면 통행료를 내요. 더블이면 한 번 더, 무인도는 쉬어 가요. 상대를 파산시키거나 20바퀴 뒤 자산이 많으면 승리.",
    keys: "주사위 굴리기 · 구입 / 통과",
    init: seed => ({ seed: seed || 1, cash: [1500, 1500], pos: [0, 0], own: Array(24).fill(0), lv: Array(24).fill(0), fund: 0, t: 0, n: 0, ph: "roll", dice: [0, 0], dbl: 0, again: false, jail: [0, 0], msg: "", turns: 0, win: null }),
    turn: s => s.t,
    legal: s => s.win != null ? [] : s.ph === "roll" ? ["roll"] : [{ a: "buy" }, { a: "skip" }],
    apply(s, m) { const me = s.t, op = 1 - me, ns = Object.assign({}, s, { cash: s.cash.slice(), pos: s.pos.slice(), own: s.own.slice(), lv: s.lv.slice(), jail: s.jail.slice(), n: s.n + 1, msg: "" });
      const pay = (amt, to) => { if (ns.cash[me] < amt) { if (to === "op") ns.cash[op] += ns.cash[me]; ns.cash[me] = 0; ns.win = op; ns.msg = me + "|파산"; return false; } ns.cash[me] -= amt; if (to === "op") ns.cash[op] += amt; else if (to === "fund") ns.fund += amt; return true; };
      if (m === "roll") { if (s.ph !== "roll") return s; const r = K.rnd(s.seed * 13 + s.n * 7717 + 5); r(); const a = 1 + Math.floor(r() * 6), b = 1 + Math.floor(r() * 6); ns.dice = [a, b]; ns.rn = ns.n;
        if (s.jail[me] > 0) { if (a !== b) { ns.jail[me]--; ns.msg = me + "|무인도에서 쉬는 중"; ns.again = false; return mEnd(ns); } ns.jail[me] = 0; }
        ns.again = a === b && s.dbl < 2; let np = s.pos[me] + a + b; if (np >= 24) { np -= 24; ns.cash[me] += 200; } ns.pos[me] = np; const tile = MT[np]; ns.msg = me + "|" + tile[0];
        if (np === 6) { ns.jail[me] = 2; ns.again = false; ns.msg = me + "|무인도에 갇혔어요"; }
        else if (np === 12) { ns.cash[me] += ns.fund; ns.msg = me + "|복지기금 " + ns.fund + " 받음"; ns.fund = 0; }
        else if (np === 18) { if (!pay(150, "fund")) return ns; ns.msg = me + "|세금 150"; }
        else if (np === 3 || np === 15) { const q = r(); if (q < .3) { ns.cash[me] += 150; ns.msg = me + "|황금열쇠: 복권 당첨 +150"; } else if (q < .55) { if (!pay(100, "fund")) return ns; ns.msg = me + "|황금열쇠: 과속 벌금 -100"; } else if (q < .8) { const g = Math.min(80, ns.cash[op]); ns.cash[op] -= g; ns.cash[me] += g; ns.msg = me + "|황금열쇠: 생일 축하금 +" + g; } else { ns.pos[me] = 0; ns.cash[me] += 200; ns.msg = me + "|황금열쇠: 출발지로 +200"; } }
        else if (tile[1]) { const o = ns.own[np]; if (!o) { if (ns.cash[me] >= tile[1]) { ns.ph = "buy"; return ns; } } else if (o === me + 1) { if (ns.lv[np] < 2 && ns.cash[me] >= mUp(np)) { ns.ph = "buy"; return ns; } } else { const rent = mRent(ns, np); if (!pay(rent, "op")) return ns; ns.msg = me + "|" + tile[0] + " 통행료 " + rent; } }
        return mEnd(ns); }
      if (s.ph !== "buy" || !m || (m.a !== "buy" && m.a !== "skip")) return s; const i = ns.pos[me];
      if (m.a === "buy") { if (!ns.own[i]) { ns.cash[me] -= MT[i][1]; ns.own[i] = me + 1; ns.msg = me + "|" + MT[i][0] + " 구입"; } else { ns.cash[me] -= mUp(i); ns.lv[i]++; ns.msg = me + "|" + MT[i][0] + (ns.lv[i] === 1 ? " 별장" : " 빌딩") + " 건설"; } } else ns.msg = me + "|통과";
      return mEnd(ns); },
    result(s) { if (s.win != null) return { w: s.win, why: "상대 파산" }; if (s.turns >= 40) { const a = mAssets(s, 0), b = mAssets(s, 1); return { w: a === b ? -1 : a > b ? 0 : 1, why: "자산 " + a + " : " + b }; } return null; },
    hit(s, X, Y, v) { if (!v.myTurn) return null; const id = hitUI(v.ui, X, Y); if (id === "roll") return { move: "roll" }; if (id === "buy" || id === "skip") return { move: { a: id } }; return null; },
    hover(s, X, Y) { for (let i = 0; i < 24; i++) { const [tx, ty] = mPos(i); if (X >= tx && X < tx + 80 && Y >= ty && Y < ty + 80) return i; } return -1; },
    draw(x, s, v) { const u = v.ui; u.hits = []; const me = v.me; table(x, "#22303F");
      const SP = { 0: ["#2F6B4F", "출발", "+200"], 6: ["#8C6A3F", "무인도", "2턴 쉬기"], 12: ["#C9952E", "복지기금", ""], 18: ["#8C2F20", "세금", "-150"] };
      for (let i = 0; i < 24; i++) { const [X0, Y0] = mPos(i), X = X0 + 2, Y = Y0 + 2, W = 76, t = MT[i], o = s.own[i];
        if (SP[i]) { const [bg, nm, sub] = SP[i]; fill(x, X, Y, W, W, 8, bg); tex(x, X, Y, W, W, 8); txt(x, nm, X + 38, Y + 34, nm.length > 3 ? 13 : 16, C.cream, 900); txt(x, i === 12 ? String(s.fund) : sub, X + 38, Y + 54, 11, "rgba(251,247,239,.8)", 700); continue; }
        fill(x, X, Y, W, W, 8, C.cream);
        if (!t[1]) { stroke(x, X + 4, Y + 4, W - 8, W - 8, 6, C.gold, 1.5); K.fill(x, X + 30, Y + 18, 16, 16, 8, "transparent"); ring(x, X + 38, Y + 28, 8, C.goldD, 3); fill(x, X + 36, Y + 34, 4, 18, 1, C.goldD); fill(x, X + 40, Y + 44, 6, 3, 1, C.goldD); fill(x, X + 40, Y + 49, 4, 3, 1, C.goldD); txt(x, "황금열쇠", X + 38, Y + 64, 10, C.goldD, 800); continue; }
        if (o) { fill(x, X, Y, W, W, 8, o === 1 ? "#F1DCD5" : "#D8E2EC"); fill(x, X, Y + W - 18, W, 18, [0, 0, 8, 8], P2[o - 1]); }
        const fl = K.img(FLAG(i)); if (fl) { x.save(); x.shadowColor = "rgba(0,0,0,.2)"; x.shadowBlur = 2; x.shadowOffsetY = 1; K.path(x, X + 21, Y + 8, 34, 23, 3); x.clip(); x.drawImage(fl, X + 21, Y + 8, 34, 23); x.restore(); stroke(x, X + 21, Y + 8, 34, 23, 3, "rgba(0,0,0,.12)", 1); } else fill(x, X + 21, Y + 8, 34, 23, 3, MG[i < 6 ? 0 : i < 12 ? 1 : i < 18 ? 2 : 3]);
        txt(x, t[0], X + 38, Y + 42, t[0].length > 4 ? 11 : 13, C.ink, 800);
        if (o) { for (let k = 0; k <= s.lv[i]; k++) fill(x, X + 38 - s.lv[i] * 6 + k * 12 - 4, Y + W - 13, 8, 8, 2, C.cream); }
        else txt(x, t[1], X + 38, Y + 60, 11, C.mute, 700);
        if (v.hover === i) stroke(x, X, Y, W, W, 8, C.ink, 2); }
      if (s.ph === "buy") { const [X, Y] = mPos(s.pos[s.t]); stroke(x, X + 1, Y + 1, 78, 78, 9, "#E3B65A", 3); }
      [0, 1].forEach(p => { const [X, Y] = mPos(s.pos[p]); token(x, X + 24 + p * 32, Y + 58, 11, P2[p], P2D[p]); });
      fill(x, 90, 90, 380, 380, 14, "rgba(0,0,0,.18)");
      [0, 1].forEach(p => { const X = 104 + p * 180, on = p === s.t; sheet(x, X, 104, 172, 72, 12, on ? C.cream : "#C9C1B3"); token(x, X + 22, 128, 9, P2[p], P2D[p]); txt(x, p === me ? "나" : "상대", X + 38, 128, 13, C.ink2, 800, "left"); if (s.jail[p]) txt(x, "무인도", X + 160, 128, 11, C.red, 800, "right"); else if (on) txt(x, "차례", X + 160, 128, 11, C.ink2, 800, "right"); txt(x, s.cash[p].toLocaleString() + "준", X + 16, 156, 20, C.ink, 900, "left"); });
      const die = (X, Y, n) => { x.save(); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 10; x.shadowOffsetY = 5; fill(x, X, Y, 68, 68, 14, "#FFFFFF"); x.restore(); const g = x.createLinearGradient(X, Y, X, Y + 68); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.1)"); fill(x, X, Y, 68, 68, 14, g); const P = { 1: [[.5, .5]], 2: [[.28, .28], [.72, .72]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.28, .28], [.72, .28], [.28, .72], [.72, .72]], 5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.28, .22], [.72, .22], [.28, .5], [.72, .5], [.28, .78], [.72, .78]] }; (P[n] || []).forEach(([a2, b2]) => dot(x, X + a2 * 68, Y + b2 * 68, n === 1 ? 9 : 6.5, n === 1 ? C.red : "#1F1D1B")); };
      const dnow = Date.now(); if (s.rn != null && u.dT !== s.rn) { u.dT = s.rn; u.dS = dnow; } const dEl = u.dS ? dnow - u.dS : 1e9, dAnim = window.Phys && dEl < 800; if (dAnim) u.animUntil = dnow + 60;
      if (s.dice[0] && dAnim) { [0, 1].forEach(k => { const tz = Phys.toss(dEl, (s.rn || 0) * 2 + k + 7, 760), X0 = k ? 292 : 200; x.save(); x.translate(X0 + 34 + tz.x, 234 + tz.y * .5); x.rotate(tz.rot); x.translate(-(X0 + 34), -234); die(X0, 200, tz.settle ? s.dice[k] : 1 + (Math.floor(dEl / 70) + k * 3) % 6); x.restore(); }); }
      else if (s.dice[0]) { die(200, 200, s.dice[0]); die(292, 200, s.dice[1]); if (s.dice[0] === s.dice[1]) pill(x, "더블", 280, 286, C.gold, C.cream, 12); } else txt(x, "주사위를 굴려 출발하세요", 280, 236, 14, "rgba(251,247,239,.7)", 700);
      if (s.msg) { const [w2, t] = s.msg.split("|"); txt(x, (+w2 === me ? "나 · " : "상대 · ") + t, 280, 314, 14, C.cream, 800); }
      if (s.ph === "buy" && v.myTurn) { const i = s.pos[me], up = !!s.own[i], cost = up ? mUp(i) : MT[i][1]; button(x, u, "buy", 112, 340, 210, 56, (up ? (s.lv[i] ? "빌딩 짓기 " : "별장 짓기 ") : "구입 ") + cost + "준", "gold", true, 15); button(x, u, "skip", 332, 340, 116, 56, "통과", "plain", true, 15); }
      else button(x, u, "roll", 150, 340, 260, 58, v.myTurn ? "주사위 굴리기" : "상대 차례", "red", v.myTurn && s.ph === "roll", 17);
      txt(x, "복지기금 " + s.fund + "준 · " + Math.min(20, (s.turns >> 1) + 1) + " / 20바퀴", 280, 438, 12, "rgba(251,247,239,.6)", 700); },
    extra: s => [0, 1].map(p => "현금 " + s.cash[p] + " · 땅 " + s.own.filter(o => o === p + 1).length)
  });

  // ================= 배틀쉽 =================
  const BN = 8, SHIPS = [4, 3, 3, 2, 2];
  const fleet = r => { const occ = new Set(), out = []; SHIPS.forEach(L => { for (let t = 0; t < 200; t++) { const h = r() < .5, rr = Math.floor(r() * (h ? BN : BN - L + 1)), cc = Math.floor(r() * (h ? BN - L + 1 : BN)), cells = []; for (let k = 0; k < L; k++) cells.push(h ? rr * BN + cc + k : (rr + k) * BN + cc); if (cells.some(c => occ.has(c))) continue; cells.forEach(c => occ.add(c)); out.push(cells); break; } }); return out; };
  G.push({ id: "battleship", name: "배틀쉽", tag: "추리", color: "#26364B", sides: ["내 함대", "상대 함대"], sideColor: [C.blue, C.red], turnSec: 30,
    desc: "8×8 바다에 숨은 상대 함선 5척을 찾아 포격하세요. 명중하면 한 번 더 쏠 수 있어요. 상대 함대를 먼저 모두 격침하면 승리.",
    keys: "상대 해역 칸 선택",
    init(seed) { const r = K.rnd(seed || 1); r(); return { fl: [fleet(r), fleet(r)], sh: [Array(64).fill(0), Array(64).fill(0)], t: 0, n: 0, last: -1, msg: "", win: null }; },
    turn: s => s.t, legal: s => s.win != null ? [] : s.sh[s.t].map((v, i) => v ? -1 : i).filter(i => i >= 0),
    apply(s, m) { const me = s.t, op = 1 - me; if (!Number.isInteger(m) || m < 0 || m > 63 || s.sh[me][m]) return s; const sh = [s.sh[0].slice(), s.sh[1].slice()], ship = s.fl[op].find(c => c.includes(m)); sh[me][m] = ship ? 2 : 1;
      const ns = { fl: s.fl, sh, t: ship ? me : op, n: s.n + 1, last: m, lastBy: me, msg: me + "|" + (ship ? (ship.every(c => sh[me][c] === 2) ? "격침!" : "명중!") : "빗나감"), win: null };
      if (s.fl[op].every(c => c.every(k => sh[me][k] === 2))) ns.win = me; return ns; },
    result: s => s.win != null ? { w: s.win, why: "함대 전멸" } : s.n >= 200 ? { w: -1, why: "수 제한" } : null,
    cell(X, Y) { const c = Math.floor((X - 24) / 50), r = Math.floor((Y - 64) / 50); return c >= 0 && c < BN && r >= 0 && r < BN ? r * BN + c : -1; },
    hit(s, X, Y, v) { const i = this.cell(X, Y); return v.myTurn && i >= 0 && !s.sh[v.me][i] ? { move: i } : null; },
    hover(s, X, Y) { return this.cell(X, Y); },
    draw(x, s, v) { const me = v.me, op = 1 - me; table(x, C.navy);
      txt(x, "상대 해역", 24, 32, 14, "rgba(251,247,239,.85)", 800, "left"); txt(x, "내 함대", 438, 32, 14, "rgba(251,247,239,.85)", 800, "left");
      fill(x, 24, 64, 400, 400, 6, "#35597A"); tex(x, 24, 64, 400, 400, 6);
      for (let k = 0; k < BN; k++) { txt(x, k + 1, 49 + k * 50, 52, 11, "rgba(251,247,239,.5)", 700); txt(x, "가나다라마바사아"[k], 14, 89 + k * 50, 11, "rgba(251,247,239,.5)", 700); }
      x.strokeStyle = "rgba(255,255,255,.12)"; x.lineWidth = 1; for (let k = 0; k <= BN; k++) { x.beginPath(); x.moveTo(24 + k * 50, 64); x.lineTo(24 + k * 50, 464); x.stroke(); x.beginPath(); x.moveTo(24, 64 + k * 50); x.lineTo(424, 64 + k * 50); x.stroke(); }
      s.fl[op].forEach(c => { if (c.every(k => s.sh[me][k] === 2)) { const r0 = Math.min(...c.map(k => k / BN | 0)), c0 = Math.min(...c.map(k => k % BN)), h = c[1] - c[0] === 1; fill(x, 24 + c0 * 50 + 6, 64 + r0 * 50 + 6, h ? c.length * 50 - 12 : 38, h ? 38 : c.length * 50 - 12, 19, "#6E7884"); } });
      s.sh[me].forEach((q, i) => { const X = 24 + (i % BN) * 50 + 25, Y = 64 + (i / BN | 0) * 50 + 25; if (q === 1) { dot(x, X, Y, 6, "rgba(251,247,239,.55)"); } else if (q === 2) { dot(x, X, Y, 14, C.red); dot(x, X, Y, 5, C.redD); } if (i === s.last && s.lastBy === me) ring(x, X, Y, 20, "#E3B65A", 2.5); });
      if (v.myTurn && v.hover >= 0 && !s.sh[me][v.hover]) { const X = 24 + (v.hover % BN) * 50, Y = 64 + (v.hover / BN | 0) * 50; stroke(x, X + 3, Y + 3, 44, 44, 6, "#E3B65A", 2.5); x.strokeStyle = "rgba(227,182,90,.8)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(X + 25, Y + 10); x.lineTo(X + 25, Y + 40); x.moveTo(X + 10, Y + 25); x.lineTo(X + 40, Y + 25); x.stroke(); }
      const mc = 14; fill(x, 438, 64, mc * BN, mc * BN, 4, "#35597A");
      s.fl[me].forEach(c => c.forEach(k => fill(x, 438 + (k % BN) * mc + 1, 64 + (k / BN | 0) * mc + 1, mc - 2, mc - 2, 3, "#9AA3AD")));
      s.sh[op].forEach((q, i) => { if (!q) return; const X = 438 + (i % BN) * mc + mc / 2, Y = 64 + (i / BN | 0) * mc + mc / 2; dot(x, X, Y, q === 2 ? 4 : 2, q === 2 ? C.red : "rgba(251,247,239,.6)"); });
      txt(x, "남은 상대 함선", 438, 202, 12, "rgba(251,247,239,.7)", 700, "left");
      s.fl[op].forEach((c, k) => { const sunk = c.every(q => s.sh[me][q] === 2); for (let q = 0; q < c.length; q++) fill(x, 438 + q * 22, 220 + k * 24, 19, 14, 4, sunk ? "rgba(255,255,255,.15)" : "#9AA3AD"); });
      if (s.msg) { const [w2, t] = s.msg.split("|"); pill(x, (+w2 === me ? "내 포격: " : "상대 포격: ") + t, 224, 500, t === "빗나감" ? "rgba(255,255,255,.16)" : C.red, C.cream, 14); }
      else txt(x, "상대 해역의 칸을 눌러 포격하세요", 224, 500, 14, "rgba(251,247,239,.7)", 700); },
    extra: s => [0, 1].map(p => "격침 " + s.fl[1 - p].filter(c => c.every(k => s.sh[p][k] === 2)).length + " / 5")
  });

  // ================= 인디언 포커 =================
  const ipDeal = (ns, carry) => { if (ns.chips.some(c => c <= 0) || ns.round >= 10 || ns.deck.length < 2) { const a = ns.chips[0], b = ns.chips[1]; ns.win = a === b ? -1 : a > b ? 0 : 1; return ns; } ns.round++; ns.card = [ns.deck.pop(), ns.deck.pop()]; ns.chips = ns.chips.map(c => c - 1); ns.bet = [1, 1]; ns.carry = carry; ns.starter = 1 - ns.starter; ns.t = ns.starter; ns.acts = 0; return ns; };
  G.push({ id: "indian", name: "인디언 포커", tag: "심리전", color: "#7A3B2E", sides: ["나", "상대"], sideColor: [C.blue, C.red], turnSec: 30,
    desc: "내 카드는 나만 못 봐요. 상대 카드와 표정만 보고 레이스·콜·다이를 정하세요. 숫자가 큰 쪽이 판돈을 가져가요. 10을 들고 다이하면 벌칙 5개. 10판 뒤 칩이 많으면 승리.",
    keys: "다이 · 콜 · 레이즈 +2",
    init(seed) { const r = K.rnd(seed || 1); r(); const deck = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], r); const s = { deck, chips: [20, 20], bet: [0, 0], carry: 0, card: [0, 0], t: 0, starter: 1, acts: 0, round: 0, n: 0, msg: "", rev: null, win: null }; return ipDeal(s, 0); },
    turn: s => s.t,
    legal(s) { if (s.win != null) return []; const me = s.t, op = 1 - me, diff = s.bet[op] - s.bet[me], L = ["fold", "call"]; if (s.chips[me] > diff && s.chips[op] > 0) L.push("raise"); return L; },
    apply(s, m) { if (!this.legal(s).includes(m)) return s; const me = s.t, op = 1 - me, ns = Object.assign({}, s, { deck: s.deck.slice(), chips: s.chips.slice(), bet: s.bet.slice(), n: s.n + 1, msg: "" }), diff = s.bet[op] - s.bet[me];
      const settle = (w, why) => { const pot = ns.bet[0] + ns.bet[1] + ns.carry; ns.rev = { c: s.card.slice(), w, why }; if (w < 0) { ns.bet = [0, 0]; return ipDeal(ns, pot); } ns.chips[w] += pot; ns.bet = [0, 0]; return ipDeal(ns, 0); };
      if (m === "raise") { const amt = Math.min(diff + 2, ns.chips[me]); ns.chips[me] -= amt; ns.bet[me] += amt; ns.acts++; ns.t = op; ns.msg = me + "|레이즈 +" + (amt - diff); return ns; }
      if (m === "call") { const pay = Math.min(diff, ns.chips[me]); ns.chips[me] -= pay; ns.bet[me] += pay; if (ns.acts === 0 && diff === 0) { ns.acts++; ns.t = op; ns.msg = me + "|체크"; return ns; } const a = s.card[0], b = s.card[1]; return settle(a === b ? -1 : a > b ? 0 : 1, "승부"); }
      if (s.card[me] === 10) { const pen = Math.min(5, ns.chips[me]); ns.chips[me] -= pen; ns.chips[op] += pen; }
      return settle(op, s.card[me] === 10 ? "10 들고 다이 · 벌칙 5" : "다이"); },
    result: s => s.win != null ? { w: s.win, why: "칩 " + s.chips[0] + " : " + s.chips[1] } : null,
    hit(s, X, Y, v) { if (!v.myTurn) return null; const id = hitUI(v.ui, X, Y); return id ? { move: id } : null; },
    hover() { return -1; },
    draw(x, s, v) { const u = v.ui; u.hits = []; const me = v.me, op = 1 - me; table(x, "#5A2E26");
      const bigCard = (X, Y, n, hidden) => { x.save(); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 12; x.shadowOffsetY = 5; fill(x, X, Y, 100, 140, 10, hidden ? C.navy : C.cream); x.restore(); if (hidden) { stroke(x, X + 7, Y + 7, 86, 126, 6, "rgba(251,247,239,.5)", 1.2); txt(x, "?", X + 50, Y + 72, 52, "rgba(251,247,239,.85)", 900); } else { stroke(x, X + 6, Y + 6, 88, 128, 6, C.edge, 1); txt(x, n, X + 50, Y + 74, 62, n === 10 ? C.red : C.ink, 900); txt(x, n, X + 16, Y + 20, 14, C.ink2, 800); } };
      const chipStack = (X, Y, n) => { const h = Math.min(10, Math.ceil(n / 3)); for (let k = 0; k < h; k++) { x.beginPath(); x.ellipse(X, Y - k * 5, 20, 8, 0, 0, Math.PI * 2); x.fillStyle = k % 2 ? "#E8DFCF" : C.gold; x.fill(); x.strokeStyle = "rgba(0,0,0,.25)"; x.lineWidth = 1; x.stroke(); } txt(x, n, X + 34, Y - 4, 18, C.cream, 900, "left"); };
      txt(x, "상대 카드", 280, 26, 13, "rgba(251,247,239,.7)", 700); bigCard(230, 40, s.card[op], false);
      chipStack(400, 120, s.chips[op]); txt(x, "상대 칩", 400, 150, 11, "rgba(251,247,239,.6)", 700, "left");
      const pot = s.bet[0] + s.bet[1] + s.carry; fill(x, 180, 214, 200, 56, 28, "rgba(0,0,0,.22)"); txt(x, "판돈 " + pot + (s.carry ? " (이월 " + s.carry + ")" : ""), 280, 236, 16, C.cream, 900); txt(x, "상대 " + s.bet[op] + " · 나 " + s.bet[me], 280, 256, 11, "rgba(251,247,239,.65)", 700);
      bigCard(230, 300, s.card[me], true); txt(x, "내 카드는 상대만 볼 수 있어요", 280, 456, 12, "rgba(251,247,239,.6)", 700);
      chipStack(400, 400, s.chips[me]); txt(x, "내 칩", 400, 430, 11, "rgba(251,247,239,.6)", 700, "left");
      txt(x, s.round + " / 10판", 40, 26, 12, "rgba(251,247,239,.6)", 700, "left");
      if (s.rev) { const c = s.rev.c, w = s.rev.w; txt(x, "지난 판", 28, 300, 11, "rgba(251,247,239,.6)", 700, "left"); txt(x, "나 " + c[me] + " · 상대 " + c[op], 28, 322, 15, C.cream, 800, "left"); txt(x, w < 0 ? "무승부 · 이월" : (w === me ? "내가 이김" : "상대가 이김") + " · " + s.rev.why, 28, 344, 12, w === me ? "#E3B65A" : "rgba(251,247,239,.7)", 700, "left"); }
      if (s.msg) { const [w2, t] = s.msg.split("|"); pill(x, (+w2 === me ? "나: " : "상대: ") + t, 280, 196, C.ink, C.cream); }
      const L = v.myTurn ? this.legal(s) : [], diff = s.bet[op] - s.bet[me];
      button(x, u, "fold", 30, 486, 156, 54, "다이", "plain", L.includes("fold"), 17); button(x, u, "call", 202, 486, 156, 54, diff > 0 ? "콜 " + diff : "체크", "primary", L.includes("call"), 17); button(x, u, "raise", 374, 486, 156, 54, "레이즈 +2", "gold", L.includes("raise"), 17);
      if (!v.myTurn && s.win == null) txt(x, "상대가 고민하는 중", 280, 474, 12, "rgba(251,247,239,.6)", 700); },
    extra: s => s.chips.map(c => "칩 " + c + "개")
  });

  // ================= 숫자야구 =================
  const nbScore = (sec, g) => { let st = 0, ba = 0; for (let i = 0; i < 3; i++) { if (+g[i] === sec[i]) st++; else if (sec.includes(+g[i])) ba++; } return [st, ba]; };
  G.push({ id: "baseball", name: "숫자야구", tag: "추리", color: "#2F6B4F", sides: ["선공", "후공"], sideColor: [C.blue, C.red], turnSec: 60,
    desc: "1~9 중 서로 다른 숫자 세 개로 된 상대의 비밀 숫자를 맞혀요. 자리까지 맞으면 스트라이크, 숫자만 맞으면 볼. 3스트라이크를 먼저 만들면 승리.",
    keys: "숫자 3개 입력 → 확인",
    init(seed) { const r = K.rnd(seed || 1); r(); const pick = () => shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], r).slice(0, 3); return { sec: [pick(), pick()], hist: [[], []], t: 0, n: 0, win: null }; },
    turn: s => s.t, legal: () => [],
    apply(s, m) { if (typeof m !== "string" || !/^[1-9]{3}$/.test(m) || new Set(m).size !== 3 || s.win != null) return s; const me = s.t, op = 1 - me, [st, ba] = nbScore(s.sec[op], m), hist = [s.hist[0].slice(), s.hist[1].slice()]; hist[me].push({ g: m, s: st, b: ba });
      return { sec: s.sec, hist, t: op, n: s.n + 1, win: st === 3 ? me : null }; },
    result: s => s.win != null ? { w: s.win, why: "3스트라이크" } : s.n >= 20 ? { w: -1, why: "10번씩 모두 실패" } : null,
    hit(s, X, Y, v) { const u = v.ui; u.cur = u.cur || ""; const id = hitUI(u, X, Y); if (!id || !v.myTurn) return null; if (id === "del") { u.cur = u.cur.slice(0, -1); return { ui: 1 }; } if (id === "ok") { if (u.cur.length !== 3) return null; const g = u.cur; u.cur = ""; return { move: g }; } const d = id.slice(2); if (u.cur.length < 3 && !u.cur.includes(d)) u.cur += d; return { ui: 1 }; },
    key(s, code, v) { const u = v.ui; u.cur = u.cur || ""; if (!v.myTurn) return null; const m = /^(Digit|Numpad)([1-9])$/.exec(code); if (m) { if (u.cur.length < 3 && !u.cur.includes(m[2])) u.cur += m[2]; return { ui: 1 }; } if (code === "Backspace") { u.cur = u.cur.slice(0, -1); return { ui: 1 }; } if (code === "Enter" && u.cur.length === 3) { const g = u.cur; u.cur = ""; return { move: g }; } return null; },
    hover() { return -1; },
    draw(x, s, v) { const u = v.ui; u.hits = []; u.cur = u.cur || ""; const me = v.me, op = 1 - me; fill(x, 0, 0, S, S, 22, "#E9DFCC"); tex(x, 0, 0, S, S, 22);
      txt(x, "내 비밀 숫자", 24, 24, 12, C.ink2, 700, "left"); s.sec[me].forEach((d, i) => { fill(x, 112 + i * 30, 10, 26, 28, 6, C.ink); txt(x, d, 125 + i * 30, 25, 15, C.cream, 900); });
      const col = (X, title, h, mine) => { sheet(x, X, 50, 252, 296, 12, C.cream); txt(x, title, X + 16, 72, 13, C.ink, 800, "left"); h.forEach((e, i) => { const Y = 98 + i * 24; txt(x, i + 1, X + 18, Y, 11, C.mute, 700); txt(x, e.g.split("").join(" "), X + 40, Y, 16, C.ink, 800, "left"); const out = e.s === 0 && e.b === 0; txt(x, out ? "아웃" : e.s + "S " + e.b + "B", X + 236, Y, 14, e.s === 3 ? C.red : out ? C.mute : mine ? C.blue : C.ink2, 800, "right"); }); if (!h.length) txt(x, mine ? "아직 시도하지 않았어요" : "상대가 아직 시도하지 않았어요", X + 126, 200, 12, C.mute, 700); };
      col(20, "내 추리 (상대 숫자)", s.hist[me], true); col(288, "상대 추리 (내 숫자)", s.hist[op], false);
      for (let d = 1; d <= 9; d++) { const k = d - 1; button(x, u, "d:" + d, 24 + (k % 3) * 84, 362 + Math.floor(k / 3) * 62, 76, 54, String(d), "plain", v.myTurn && !u.cur.includes(String(d)) && u.cur.length < 3, 20); }
      for (let k = 0; k < 3; k++) { const X = 300 + k * 80; fill(x, X, 366, 68, 74, 10, C.cream); stroke(x, X + .5, 366.5, 67, 73, 10, k === u.cur.length && v.myTurn ? C.ink : C.edge, k === u.cur.length && v.myTurn ? 2 : 1); if (u.cur[k]) txt(x, u.cur[k], X + 34, 404, 34, C.ink, 900); }
      button(x, u, "del", 300, 456, 108, 50, "지우기", "plain", v.myTurn && u.cur.length > 0); button(x, u, "ok", 420, 456, 120, 50, "확인", "blue", v.myTurn && u.cur.length === 3);
      txt(x, v.myTurn ? "서로 다른 숫자 3개" : "상대가 추리하는 중", 420, 532, 12, C.mute, 700); },
    extra: s => s.hist.map(h => h.length + "번 시도" + (h.length ? " · 최고 " + Math.max(...h.map(e => e.s)) + "S" : ""))
  });

  BG.extraLoaded = true;
})();
