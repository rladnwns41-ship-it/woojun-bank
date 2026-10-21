// 추가 보드게임: 우노
(function () {
  const BG = window.BG;
  if (!BG || BG.unoLoaded || !BG.art) return;
  const K = BG.art, C = K.C, S = BG.S, G = BG.GAMES;
  const { fill, stroke, dot, ring, txt, tex, table, button, pill, hitUI } = K;
  const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const say = (me, t) => me + "|" + t;
  const P2 = [C.red, C.blue];

  // ================= 우노 (2인) =================
  // 카드 = 색 * 16 + 값. 색 0~3, 4 = 와일드. 값 0~9 숫자, 10 건너뛰기, 11 방향 바꾸기(2인은 건너뛰기), 12 +2, 13 와일드, 14 와일드 +4
  const UC = ["#D8393B", "#E9A800", "#2E9B5A", "#2D6CC4"], UN = ["빨강", "노랑", "초록", "파랑"];
  const cc = k => k >> 4, cv = k => k & 15;
  const LAB = v => v < 10 ? String(v) : v === 10 ? "⊘" : v === 11 ? "⇄" : v === 12 ? "+2" : v === 13 ? "W" : "+4";
  const FULL = (() => { const d = []; for (let c = 0; c < 4; c++) { d.push(c * 16); for (let v = 1; v <= 12; v++) d.push(c * 16 + v, c * 16 + v); } for (let i = 0; i < 4; i++) d.push(77, 78); return d; })();
  const topOf = s => s.pile[s.pile.length - 1];
  const okCard = (s, k) => cc(k) === 4 || cc(k) === s.col || cv(k) === cv(topOf(s));
  function deal(ns, p, n) {
    for (let i = 0; i < n; i++) {
      if (!ns.dk.length) { const top = ns.pile.pop(); ns.dk = shuffle(ns.pile, K.rnd(ns.seed * 31 + ns.n * 7 + i + 1)); ns.pile = [top]; if (!ns.dk.length) break; }
      ns.h[p].push(ns.dk.pop());
    }
  }
  const bestCol = h => { const n = [0, 0, 0, 0]; h.forEach(k => { if (cc(k) < 4) n[cc(k)]++; }); return n.indexOf(Math.max(...n)); };
  const ucard = (x, k, X, Y, w, h, dim) => {
    x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 8; x.shadowOffsetY = 3; fill(x, X, Y, w, h, w * .14, "#FBF7EF"); x.restore();
    const c = cc(k), v = cv(k), pad = w * .08, iw = w - pad * 2, ih = h - pad * 2;
    if (c === 4) { fill(x, X + pad, Y + pad, iw, ih, w * .1, "#1B1714"); const cx = X + w / 2, cy = Y + h / 2, r = w * .3; for (let q = 0; q < 4; q++) { x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, r, q * Math.PI / 2 - Math.PI / 2, (q + 1) * Math.PI / 2 - Math.PI / 2); x.closePath(); x.fillStyle = UC[q]; x.fill(); } if (v === 14) txt(x, "+4", cx, cy + 1, w * .26, "#fff", 900); }
    else { fill(x, X + pad, Y + pad, iw, ih, w * .1, UC[c]); x.save(); x.translate(X + w / 2, Y + h / 2); x.rotate(-.5); x.beginPath(); x.ellipse(0, 0, iw * .42, ih * .4, 0, 0, Math.PI * 2); x.fillStyle = "#FBF7EF"; x.fill(); x.restore(); txt(x, LAB(v), X + w / 2, Y + h / 2 + 1, w * (v >= 10 ? .3 : .38), UC[c], 900); }
    txt(x, LAB(v), X + pad + w * .12, Y + pad + w * .13, w * .17, "#fff", 900); txt(x, LAB(v), X + w - pad - w * .12, Y + h - pad - w * .13, w * .17, "#fff", 900);
    if (dim) fill(x, X, Y, w, h, w * .14, "rgba(20,16,12,.38)");
  };
  const uback = (x, X, Y, w, h) => { x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 6; x.shadowOffsetY = 2; fill(x, X, Y, w, h, w * .14, "#FBF7EF"); x.restore(); fill(x, X + w * .07, Y + w * .07, w * .86, h - w * .14, w * .1, "#1B1714"); x.save(); x.translate(X + w / 2, Y + h / 2); x.rotate(-.5); x.beginPath(); x.ellipse(0, 0, w * .34, h * .3, 0, 0, Math.PI * 2); x.fillStyle = UC[0]; x.fill(); x.restore(); txt(x, "UNO", X + w / 2, Y + h / 2 + 1, w * .22, "#F2C230", 900); };
  const HY = 400, HW = 62, HH = 92;
  G.push({ id: "uno", name: "우노", tag: "카드", color: "#C9302C", sides: ["선", "후"], sideColor: [C.red, C.blue], turnSec: 30,
    desc: "같은 색이나 같은 숫자 카드를 내세요. 낼 카드가 없으면 한 장 뽑고, 뽑은 카드가 맞으면 바로 낼 수 있어요. 건너뛰기·방향 바꾸기는 한 번 더, +2·+4는 상대가 카드를 받고 쉬어요. 손패를 먼저 다 내면 승리.",
    keys: "카드 클릭 · 와일드는 색 고르기",
    init(seed) { const r = K.rnd(seed || 1); r(); const dk = shuffle(FULL, r), h = [[], []]; for (let i = 0; i < 7; i++) { h[0].push(dk.pop()); h[1].push(dk.pop()); }
      const at = dk.findIndex(k => cc(k) < 4 && cv(k) < 10), top = dk.splice(at, 1)[0];
      return { seed: seed || 1, dk, pile: [top], h, col: cc(top), t: 0, n: 0, drew: -1, msg: "", win: null }; },
    turn: s => s.t,
    legal(s) { if (s.win != null) return []; const me = s.t, M = []; s.h[me].forEach((k, i) => { if ((s.drew < 0 || i === s.drew) && okCard(s, k)) M.push(cc(k) === 4 ? { a: "play", i, col: bestCol(s.h[me]) } : { a: "play", i }); }); M.push(s.drew < 0 ? { a: "draw" } : { a: "pass" }); return M; },
    apply(s, m) { if (!m || s.win != null) return s; const me = s.t, op = 1 - me;
      const ns = Object.assign({}, s, { dk: s.dk.slice(), pile: s.pile.slice(), h: [s.h[0].slice(), s.h[1].slice()], n: s.n + 1, drew: -1 });
      if (m.a === "play") { const i = m.i; if (!Number.isInteger(i) || (s.drew >= 0 && i !== s.drew)) return s; const k = ns.h[me][i]; if (k == null || !okCard(s, k)) return s; if (cc(k) === 4 && !(m.col >= 0 && m.col < 4)) return s;
        ns.h[me].splice(i, 1); ns.pile.push(k); ns.col = cc(k) === 4 ? m.col : cc(k); const v = cv(k); let t = "";
        if (v === 10 || v === 11) { ns.t = me; t = (v === 10 ? "건너뛰기" : "방향 바꾸기") + " · 한 번 더"; }
        else if (v === 12) { deal(ns, op, 2); ns.t = me; t = "+2 · 상대가 2장 받고 쉬어요"; }
        else if (v === 14) { deal(ns, op, 4); ns.t = me; t = "+4 · " + UN[m.col] + " · 상대가 4장 받고 쉬어요"; }
        else { ns.t = op; t = v === 13 ? "와일드 · " + UN[m.col] : UN[ns.col] + " " + v; }
        if (!ns.h[me].length) { ns.win = me; t = "마지막 카드! 승리"; } else if (ns.h[me].length === 1) t = "UNO! · " + t;
        ns.msg = say(me, t); return ns; }
      if (m.a === "draw") { if (s.drew >= 0) return s; deal(ns, me, 1); const k = ns.h[me][ns.h[me].length - 1]; if (k != null && okCard(ns, k)) { ns.drew = ns.h[me].length - 1; ns.t = me; ns.msg = say(me, "1장 뽑음 · 낼 수 있어요"); } else { ns.t = op; ns.msg = say(me, "1장 뽑고 넘김"); } return ns; }
      if (m.a === "pass") { if (s.drew < 0) return s; ns.t = op; ns.msg = say(me, "넘김"); return ns; }
      return s; },
    result: s => s.win != null ? { w: s.win, why: "카드를 모두 냄" } : s.n >= 600 ? { w: s.h[0].length === s.h[1].length ? -1 : s.h[0].length < s.h[1].length ? 0 : 1, why: "수 제한 · 카드 수 비교" } : null,
    hit(s, X, Y, v) { if (!v.myTurn || s.win != null) return null; const u = v.ui, id = hitUI(u, X, Y); if (!id) return null; const me = v.me;
      if (id.startsWith("col:")) { const i = u.wild; u.wild = null; return i == null ? { ui: true } : { move: { a: "play", i, col: +id.slice(4) } }; }
      if (id === "x") { u.wild = null; return { ui: true }; }
      if (id === "draw") return s.drew < 0 ? { move: { a: "draw" } } : null;
      if (id === "pass") return { move: { a: "pass" } };
      if (id.startsWith("c:")) { const i = +id.slice(2), k = s.h[me][i]; if (k == null || (s.drew >= 0 && i !== s.drew) || !okCard(s, k)) return null; if (cc(k) === 4) { u.wild = i; return { ui: true }; } return { move: { a: "play", i } }; }
      return null; },
    hover() { return -1; },
    draw(x, s, v) { const u = v.ui || {}, me = v.me, op = 1 - me; u.hits = []; if (u.unoN !== s.n) { u.unoN = s.n; u.wild = null; }
      table(x, "#7A2622");
      const oh = s.h[op].length, ostep = Math.min(28, 400 / Math.max(1, oh)), ow = 44, ox = (S - (ostep * (oh - 1) + ow)) / 2;
      for (let i = 0; i < oh; i++) uback(x, ox + i * ostep, 18, ow, 64);
      txt(x, "상대 · " + oh + "장" + (oh === 1 ? " · UNO!" : ""), S / 2, 98, 13, s.t === op && s.win == null ? "#FFD27A" : "rgba(251,247,239,.75)", 800);
      const mine = v.myTurn && s.win == null;
      for (let q = Math.min(3, Math.ceil(s.dk.length / 20)); q >= 0; q--) uback(x, 170 + q * 2, 124 + q * 2, 80, 118);
      if (mine && s.drew < 0) u.hits.push({ id: "draw", X: 170, Y: 124, w: 86, h: 124 });
      txt(x, s.dk.length + "장", 210, 256, 11, "rgba(251,247,239,.6)", 700);
      const t = topOf(s); ucard(x, t, 310, 124, 80, 118);
      x.save(); x.shadowColor = UC[s.col]; x.shadowBlur = 18; stroke(x, 306, 120, 88, 126, 14, UC[s.col], 4); x.restore();
      txt(x, "현재 색 · " + UN[s.col], 350, 256, 11, "rgba(251,247,239,.75)", 800);
      if (mine) { if (s.drew < 0) button(x, u, "draw", S / 2 - 75, 276, 150, 40, "카드 뽑기", "gold", true, 14); else button(x, u, "pass", S / 2 - 75, 276, 150, 40, "넘기기", "plain", true, 14); }
      if (s.msg) { const [w2, m2] = s.msg.split("|"); pill(x, (+w2 === me ? "나: " : "상대: ") + m2, S / 2, 346, "rgba(0,0,0,.35)", C.cream, 13); }
      const h = s.h[me], n = h.length, step = n > 1 ? Math.min(66, (S - 40 - HW) / (n - 1)) : 0, hx = (S - (step * (n - 1) + HW)) / 2;
      h.forEach((k, i) => { const can = mine && (s.drew < 0 || i === s.drew) && okCard(s, k), X = hx + i * step, Y = HY - (can ? 12 : 0) - (u.wild === i ? 10 : 0); ucard(x, k, X, Y, HW, HH, mine && !can); if (u.wild === i) stroke(x, X - 2, Y - 2, HW + 4, HH + 4, 10, "#FFD27A", 3); if (mine) u.hits.push({ id: "c:" + i, X, Y, w: HW, h: HH + 12 }); });
      txt(x, s.win != null ? "" : mine ? (s.drew >= 0 ? "뽑은 카드를 내거나 넘기세요" : "낼 카드를 고르세요 · 없으면 뽑기") : "상대 차례", S / 2, 530, 12, "rgba(251,247,239,.7)", 700);
      if (mine && u.wild != null) { u.hits = []; fill(x, 0, 0, S, S, 22, "rgba(20,16,12,.55)"); fill(x, 90, 150, 380, 200, 18, C.cream); txt(x, "어떤 색으로 바꿀까요?", S / 2, 186, 17, C.ink, 800);
        UC.forEach((c, q) => { const X = 112 + q * 86; fill(x, X, 214, 76, 76, 14, c); txt(x, UN[q], X + 38, 252, 14, "#fff", 800); u.hits.push({ id: "col:" + q, X, Y: 214, w: 76, h: 76 }); });
        txt(x, "취소", S / 2, 324, 13, C.ink2, 700); u.hits.push({ id: "x", X: S / 2 - 40, Y: 310, w: 80, h: 28 }); } },
    extra: s => s.h.map(h => h.length + "장" + (h.length === 1 ? " · UNO!" : ""))
  });

  BG.unoLoaded = true;
})();
