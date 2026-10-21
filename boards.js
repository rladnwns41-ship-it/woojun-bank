(function () {
  if (window.BG) return;
  const S = 560;
  const INK = "#191F28";
  const rr = (x, X, Y, w, h, r, c) => { x.fillStyle = c; x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); x.fill(); };
  const cir = (x, X, Y, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(X, Y, r, 0, 7); x.fill(); };
  const stone = (x, X, Y, r, black) => {
    x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = r * .5; x.shadowOffsetY = r * .18;
    const g = x.createRadialGradient(X - r * .35, Y - r * .4, r * .1, X, Y, r);
    if (black) { g.addColorStop(0, "#5B6573"); g.addColorStop(.45, "#20262F"); g.addColorStop(1, "#0A0D12"); }
    else { g.addColorStop(0, "#FFFFFF"); g.addColorStop(.6, "#F1F3F6"); g.addColorStop(1, "#C9CFD8"); }
    x.fillStyle = g; x.beginPath(); x.arc(X, Y, r, 0, 7); x.fill(); x.restore();
  };
  const disc = (x, X, Y, r, c1, c2) => { x.save(); x.shadowColor = "rgba(0,0,0,.3)"; x.shadowBlur = 6; x.shadowOffsetY = 3; const g = x.createRadialGradient(X - r * .3, Y - r * .35, r * .1, X, Y, r); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.beginPath(); x.arc(X, Y, r, 0, 7); x.fill(); x.restore(); x.strokeStyle = "rgba(0,0,0,.15)"; x.lineWidth = 2; x.beginPath(); x.arc(X, Y, r * .72, 0, 7); x.stroke(); };
  const wood = (x, c1, c2) => { const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, c1); g.addColorStop(1, c2); rr(x, 0, 0, S, S, 22, g); x.save(); x.globalAlpha = .07; x.strokeStyle = "#3A2410"; for (let i = 0; i < 40; i++) { x.lineWidth = 1 + (i % 3); x.beginPath(); x.moveTo(0, i * 15 + Math.sin(i) * 6); x.bezierCurveTo(S * .3, i * 15 + 8, S * .7, i * 15 - 8, S, i * 15 + Math.cos(i) * 6); x.stroke(); } x.restore(); };
  const label = (x, s, X, Y, size, c, al) => { x.fillStyle = c; x.font = "800 " + size + "px 'Pretendard Variable',Pretendard,sans-serif"; x.textAlign = al || "center"; x.textBaseline = "middle"; x.fillText(s, X, Y); };
  const G = [];

  // ---------------- 오목 ----------------
  G.push({ id: "omok", name: "오목", tag: "전략", color: "#C8964E", sides: ["흑", "백"], sideColor: ["#191F28", "#E5E8EB"],
    desc: "15×15 바둑판에서 가로·세로·대각선으로 다섯 개를 먼저 이으면 승리. 흑이 먼저 둡니다.",
    init: () => ({ b: Array(225).fill(0), t: 0, last: -1, n: 0, win: null }),
    turn: s => s.t, legal: s => s.b.map((v, i) => v ? -1 : i).filter(i => i >= 0),
    apply(s, m) { const b = s.b.slice(); b[m] = s.t + 1; const n = { b, t: 1 - s.t, last: m, n: s.n + 1, win: null }; const r = m / 15 | 0, c = m % 15;
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) { const line = [m]; for (const sg of [1, -1]) { let rr2 = r + dr * sg, cc = c + dc * sg; while (rr2 >= 0 && rr2 < 15 && cc >= 0 && cc < 15 && b[rr2 * 15 + cc] === s.t + 1) { line.push(rr2 * 15 + cc); rr2 += dr * sg; cc += dc * sg; } } if (line.length >= 5) n.win = { w: s.t, line }; } return n; },
    result: s => s.win ? { w: s.win.w, why: "오목 완성" } : s.n >= 225 ? { w: -1, why: "판이 가득 참" } : null,
    hit(s, X, Y) { const step = (S - 60) / 14, c = Math.round((X - 30) / step), r = Math.round((Y - 30) / step); if (r < 0 || c < 0 || r > 14 || c > 14) return null; const i = r * 15 + c; return s.b[i] ? null : { move: i }; },
    hover(s, X, Y) { const step = (S - 60) / 14, c = Math.round((X - 30) / step), r = Math.round((Y - 30) / step); return r >= 0 && c >= 0 && r < 15 && c < 15 && !s.b[r * 15 + c] ? r * 15 + c : -1; },
    draw(x, s, v) { wood(x, "#E9C48A", "#C8964E"); const step = (S - 60) / 14, P = i => [30 + (i % 15) * step, 30 + (i / 15 | 0) * step];
      x.strokeStyle = "rgba(60,36,16,.75)"; x.lineWidth = 1.2; for (let i = 0; i < 15; i++) { x.beginPath(); x.moveTo(30, 30 + i * step); x.lineTo(S - 30, 30 + i * step); x.stroke(); x.beginPath(); x.moveTo(30 + i * step, 30); x.lineTo(30 + i * step, S - 30); x.stroke(); }
      [3, 7, 11].forEach(a => [3, 7, 11].forEach(b => cir(x, 30 + a * step, 30 + b * step, 4, "rgba(60,36,16,.85)")));
      s.b.forEach((c, i) => { if (!c) return; const [X, Y] = P(i); stone(x, X, Y, step * .46, c === 1); });
      if (s.last >= 0) { const [X, Y] = P(s.last); cir(x, X, Y, 5, s.b[s.last] === 1 ? "#F04452" : "#F04452"); }
      if (v.hover >= 0 && v.myTurn) { const [X, Y] = P(v.hover); x.globalAlpha = .45; stone(x, X, Y, step * .46, v.me === 0); x.globalAlpha = 1; }
      if (s.win) { x.strokeStyle = "#F04452"; x.lineWidth = 5; x.lineCap = "round"; const L = s.win.line.map(P).sort((a, b) => a[0] - b[0] || a[1] - b[1]); x.beginPath(); x.moveTo(L[0][0], L[0][1]); x.lineTo(L[L.length - 1][0], L[L.length - 1][1]); x.stroke(); } }
  });

  // ---------------- 체스 ----------------
  const Rw = i => i >> 3, Fl = i => i & 7, OB = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;
  const KN = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]], KG = [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  function attacked(b, sq, by) { const r = Rw(sq), f = Fl(sq), pd = by === "w" ? 1 : -1;
    for (const df of [-1, 1]) if (OB(r + pd, f + df) && b[(r + pd) * 8 + f + df] === by + "P") return true;
    for (const [dr, df] of KN) if (OB(r + dr, f + df) && b[(r + dr) * 8 + f + df] === by + "N") return true;
    for (const [dr, df] of KG) if (OB(r + dr, f + df) && b[(r + dr) * 8 + f + df] === by + "K") return true;
    for (const [dr, df] of KG) { const ps = dr && df ? "BQ" : "RQ"; let a = r + dr, c = f + df; while (OB(a, c)) { const p = b[a * 8 + c]; if (p) { if (p[0] === by && ps.includes(p[1])) return true; break; } a += dr; c += df; } }
    return false; }
  function pseudo(s) { const { b, t } = s, o = t === "w" ? "b" : "w", M = [];
    for (let i = 0; i < 64; i++) { const p = b[i]; if (!p || p[0] !== t) continue; const r = Rw(i), f = Fl(i), k = p[1], add = to => M.push([i, to]);
      if (k === "P") { const d = t === "w" ? -1 : 1, sr = t === "w" ? 6 : 1; if (OB(r + d, f) && !b[(r + d) * 8 + f]) { add((r + d) * 8 + f); if (r === sr && !b[(r + 2 * d) * 8 + f]) add((r + 2 * d) * 8 + f); } for (const df of [-1, 1]) if (OB(r + d, f + df)) { const to = (r + d) * 8 + f + df; if ((b[to] && b[to][0] === o) || to === s.ep) add(to); } }
      else if (k === "N" || k === "K") { for (const [dr, df] of k === "N" ? KN : KG) if (OB(r + dr, f + df)) { const to = (r + dr) * 8 + f + df; if (!b[to] || b[to][0] === o) add(to); }
        if (k === "K" && i === (t === "w" ? 60 : 4) && !attacked(b, i, o)) { if (s.c[t + "K"] && !b[i + 1] && !b[i + 2] && b[i + 3] === t + "R" && !attacked(b, i + 1, o) && !attacked(b, i + 2, o)) add(i + 2); if (s.c[t + "Q"] && !b[i - 1] && !b[i - 2] && !b[i - 3] && b[i - 4] === t + "R" && !attacked(b, i - 1, o) && !attacked(b, i - 2, o)) add(i - 2); } }
      else { const D = k === "R" ? KG.slice(4) : k === "B" ? KG.slice(0, 4) : KG; for (const [dr, df] of D) { let a = r + dr, c = f + df; while (OB(a, c)) { const to = a * 8 + c; if (b[to]) { if (b[to][0] === o) add(to); break; } add(to); a += dr; c += df; } } } }
    return M; }
  function chApply(s, m) { const [fr, to] = m, b = s.b.slice(), p = b[fr], t = s.t, o = t === "w" ? "b" : "w", c = Object.assign({}, s.c); let ep = -1, cap = b[to];
    if (p[1] === "P" && to === s.ep) { const ci = to + (t === "w" ? 8 : -8); cap = b[ci]; b[ci] = null; }
    if (p[1] === "P" && Math.abs(to - fr) === 16) ep = (to + fr) / 2;
    b[to] = p; b[fr] = null; if (p[1] === "P" && (Rw(to) === 0 || Rw(to) === 7)) b[to] = t + "Q";
    if (p[1] === "K") { c[t + "K"] = 0; c[t + "Q"] = 0; if (to - fr === 2) { b[fr + 1] = b[fr + 3]; b[fr + 3] = null; } if (fr - to === 2) { b[fr - 1] = b[fr - 4]; b[fr - 4] = null; } }
    [[56, "wQ"], [63, "wK"], [0, "bQ"], [7, "bK"]].forEach(([q, k]) => { if (fr === q || to === q) c[k] = 0; });
    const caps = { w: (s.caps || { w: [] }).w.slice(), b: (s.caps || { b: [] }).b.slice() }; if (cap) caps[t].push(cap[1]);
    return { b, t: o, c, ep, last: [fr, to], caps, n: (s.n || 0) + 1 }; }
  const chLegal = s => pseudo(s).filter(m => { const n = chApply(s, m), k = n.b.indexOf(s.t + "K"); return !attacked(n.b, k, n.t); });
  const GLY = { K: "\u265A", Q: "\u265B", R: "\u265C", B: "\u265D", N: "\u265E", P: "\u265F" };
  const piece = (x, p, X, Y, sz) => { x.save(); x.font = sz + "px 'Segoe UI Symbol','Noto Sans Symbols 2','DejaVu Sans','Arial Unicode MS',serif"; x.textAlign = "center"; x.textBaseline = "middle"; const gch = GLY[p[1]] + "\uFE0E"; x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 6; x.shadowOffsetY = 3; x.lineJoin = "round"; if (p[0] === "w") { x.lineWidth = 4; x.strokeStyle = "#2B2118"; x.strokeText(gch, X, Y + 2); x.shadowColor = "transparent"; x.fillStyle = "#FFFDF7"; x.fillText(gch, X, Y + 2); } else { x.lineWidth = 3; x.strokeStyle = "#F5E9D6"; x.strokeText(gch, X, Y + 2); x.shadowColor = "transparent"; x.fillStyle = "#1A1410"; x.fillText(gch, X, Y + 2); } x.restore(); };
  G.push({ id: "chess", name: "체스", tag: "전략", color: "#A97B50", sides: ["백", "흑"], sideColor: ["#FFFFFF", "#191F28"],
    desc: "정식 규칙 체스. 캐슬링·앙파상·승진(퀸) 지원. 체크메이트로 승리, 스테일메이트는 무승부.",
    init: () => { const b = Array(64).fill(null), bk = "RNBQKBNR"; for (let i = 0; i < 8; i++) { b[i] = "b" + bk[i]; b[8 + i] = "bP"; b[48 + i] = "wP"; b[56 + i] = "w" + bk[i]; } return { b, t: "w", c: { wK: 1, wQ: 1, bK: 1, bQ: 1 }, ep: -1, last: null, caps: { w: [], b: [] }, n: 0 }; },
    turn: s => s.t === "w" ? 0 : 1, legal: chLegal, apply: chApply,
    result(s) { const L = chLegal(s); if (!L.length) { const k = s.b.indexOf(s.t + "K"); return attacked(s.b, k, s.t === "w" ? "b" : "w") ? { w: s.t === "w" ? 1 : 0, why: "체크메이트" } : { w: -1, why: "스테일메이트" }; } if (s.n >= 300) return { w: -1, why: "수 제한" }; if (s.b.filter(Boolean).length === 2) return { w: -1, why: "기물 부족" }; return null; },
    sq(v, X, Y) { const cs = (S - 40) / 8, c = Math.floor((X - 20) / cs), r = Math.floor((Y - 20) / cs); if (r < 0 || c < 0 || r > 7 || c > 7) return -1; const i = r * 8 + c; return v.me === 1 ? 63 - i : i; },
    hit(s, X, Y, v) { const i = this.sq(v, X, Y); if (i < 0) return null; const mine = v.me === 0 ? "w" : "b"; if (v.sel >= 0 && chLegal(s).some(m => m[0] === v.sel && m[1] === i)) return { move: [v.sel, i] }; if (s.b[i] && s.b[i][0] === mine) return { sel: i }; return { sel: -1 }; },
    hover(s, X, Y, v) { return this.sq(v, X, Y); },
    draw(x, s, v) { rr(x, 0, 0, S, S, 22, "#3B2A1C"); const cs = (S - 40) / 8, flip = v.me === 1, P = i => { const d = flip ? 63 - i : i; return [20 + Fl(d) * cs, 20 + Rw(d) * cs]; };
      const tg = v.sel >= 0 ? chLegal(s).filter(m => m[0] === v.sel).map(m => m[1]) : [], chk = (() => { const k = s.b.indexOf(s.t + "K"); return attacked(s.b, k, s.t === "w" ? "b" : "w") ? k : -1; })();
      for (let i = 0; i < 64; i++) { const [X, Y] = P(i), light = (Rw(i) + Fl(i)) % 2 === 0; x.fillStyle = light ? "#EED7B4" : "#B48558"; x.fillRect(X, Y, cs, cs); if (s.last && (s.last[0] === i || s.last[1] === i)) { x.fillStyle = "rgba(255,204,0,.42)"; x.fillRect(X, Y, cs, cs); } if (i === v.sel) { x.fillStyle = "rgba(49,130,246,.45)"; x.fillRect(X, Y, cs, cs); } if (i === chk) { const g = x.createRadialGradient(X + cs / 2, Y + cs / 2, 4, X + cs / 2, Y + cs / 2, cs * .7); g.addColorStop(0, "rgba(240,68,82,.95)"); g.addColorStop(1, "rgba(240,68,82,0)"); x.fillStyle = g; x.fillRect(X, Y, cs, cs); } }
      x.fillStyle = "rgba(255,255,255,.55)"; x.font = "700 11px 'Pretendard Variable',sans-serif"; for (let k = 0; k < 8; k++) { x.textAlign = "center"; x.fillText("abcdefgh"[flip ? 7 - k : k], 20 + k * cs + cs / 2, S - 8); x.fillText(String(flip ? k + 1 : 8 - k), 10, 20 + k * cs + cs / 2); }
      for (let i = 0; i < 64; i++) if (s.b[i]) { const [X, Y] = P(i); piece(x, s.b[i], X + cs / 2, Y + cs / 2, cs * .8); }
      tg.forEach(i => { const [X, Y] = P(i); if (s.b[i]) { x.strokeStyle = "rgba(25,31,40,.45)"; x.lineWidth = 5; x.beginPath(); x.arc(X + cs / 2, Y + cs / 2, cs * .44, 0, 7); x.stroke(); } else cir(x, X + cs / 2, Y + cs / 2, cs * .15, "rgba(25,31,40,.35)"); }); },
    extra(s) { const val = { P: 1, N: 3, B: 3, R: 5, Q: 9 }, sm = a => a.reduce((t, k) => t + (val[k] || 0), 0); return ["잡은 기물 " + ((s.caps && s.caps.w.length) || 0) + " (" + sm((s.caps && s.caps.w) || []) + "점)", "잡은 기물 " + ((s.caps && s.caps.b.length) || 0) + " (" + sm((s.caps && s.caps.b) || []) + "점)"]; }
  });

  // ---------------- 오델로 ----------------
  const OD = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const flips = (b, i, me) => { const r = i >> 3, c = i & 7, out = []; if (b[i]) return out; for (const [dr, dc] of OD) { const run = []; let a = r + dr, d = c + dc; while (OB(a, d) && b[a * 8 + d] === 3 - me) { run.push(a * 8 + d); a += dr; d += dc; } if (run.length && OB(a, d) && b[a * 8 + d] === me) out.push(...run); } return out; };
  const odMoves = (b, me) => { const M = []; for (let i = 0; i < 64; i++) if (flips(b, i, me).length) M.push(i); return M; };
  G.push({ id: "othello", name: "오델로", tag: "전략", color: "#0E8A55", sides: ["흑", "백"], sideColor: ["#191F28", "#FFFFFF"],
    desc: "상대 돌을 내 돌 사이에 끼워 뒤집기. 둘 곳이 없으면 자동으로 패스. 끝났을 때 돌이 많은 쪽이 승리.",
    init: () => { const b = Array(64).fill(0); b[27] = b[36] = 2; b[28] = b[35] = 1; return { b, t: 0, last: -1, fl: [], n: 0 }; },
    turn: s => s.t, legal(s) { const M = odMoves(s.b, s.t + 1); return M.length ? M : odMoves(s.b, 2 - s.t).length ? ["pass"] : []; },
    apply(s, m) { if (m === "pass") return Object.assign({}, s, { t: 1 - s.t, last: -1, fl: [], pass: true }); const b = s.b.slice(), f = flips(b, m, s.t + 1); b[m] = s.t + 1; f.forEach(i => b[i] = s.t + 1); return { b, t: 1 - s.t, last: m, fl: f, n: s.n + 1 }; },
    result(s) { if (odMoves(s.b, 1).length || odMoves(s.b, 2).length) return null; const a = s.b.filter(v => v === 1).length, b2 = s.b.filter(v => v === 2).length; return { w: a === b2 ? -1 : a > b2 ? 0 : 1, why: a + " : " + b2 }; },
    hit(s, X, Y) { const cs = (S - 40) / 8, c = Math.floor((X - 20) / cs), r = Math.floor((Y - 20) / cs); if (!OB(r, c)) return null; const i = r * 8 + c; return flips(s.b, i, s.t + 1).length ? { move: i } : null; },
    hover(s, X, Y) { const cs = (S - 40) / 8, c = Math.floor((X - 20) / cs), r = Math.floor((Y - 20) / cs); return OB(r, c) ? r * 8 + c : -1; },
    draw(x, s, v) { rr(x, 0, 0, S, S, 22, "#0B5E3B"); const cs = (S - 40) / 8; rr(x, 16, 16, S - 32, S - 32, 12, "#13854F"); x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 2; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(20 + i * cs, 20); x.lineTo(20 + i * cs, S - 20); x.stroke(); x.beginPath(); x.moveTo(20, 20 + i * cs); x.lineTo(S - 20, 20 + i * cs); x.stroke(); }
      [[2, 2], [2, 6], [6, 2], [6, 6]].forEach(([a, b]) => cir(x, 20 + a * cs, 20 + b * cs, 5, "rgba(0,0,0,.4)"));
      s.b.forEach((c, i) => { if (!c) return; const X = 20 + (i & 7) * cs + cs / 2, Y = 20 + (i >> 3) * cs + cs / 2; stone(x, X, Y, cs * .4, c === 1); if (s.fl && s.fl.includes(i)) { x.strokeStyle = "rgba(255,204,0,.7)"; x.lineWidth = 3; x.beginPath(); x.arc(X, Y, cs * .43, 0, 7); x.stroke(); } });
      if (s.last >= 0) cir(x, 20 + (s.last & 7) * cs + cs / 2, 20 + (s.last >> 3) * cs + cs / 2, 5, "#F04452");
      if (v.myTurn) odMoves(s.b, s.t + 1).forEach(i => { const X = 20 + (i & 7) * cs + cs / 2, Y = 20 + (i >> 3) * cs + cs / 2; if (i === v.hover) { x.globalAlpha = .5; stone(x, X, Y, cs * .4, v.me === 0); x.globalAlpha = 1; } else cir(x, X, Y, 7, "rgba(255,255,255,.35)"); }); },
    extra(s) { return ["돌 " + s.b.filter(v => v === 1).length + "개", "돌 " + s.b.filter(v => v === 2).length + "개"]; }
  });

  // ---------------- 사목 ----------------
  G.push({ id: "connect4", name: "사목", tag: "캐주얼", color: "#2563EB", sides: ["빨강", "노랑"], sideColor: ["#F04452", "#FFC342"],
    desc: "칸을 골라 원판을 떨어뜨려요. 가로·세로·대각선으로 4개를 먼저 이으면 승리.",
    init: () => ({ b: Array(42).fill(0), t: 0, last: -1, n: 0, win: null }),
    turn: s => s.t, legal: s => [0, 1, 2, 3, 4, 5, 6].filter(c => !s.b[c]),
    apply(s, c) { const b = s.b.slice(); let r = 5; while (b[r * 7 + c]) r--; const i = r * 7 + c; b[i] = s.t + 1; const n = { b, t: 1 - s.t, last: i, n: s.n + 1, win: null, dropAt: Date.now() };
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) { const line = [i]; for (const sg of [1, -1]) { let a = r + dr * sg, d = c + dc * sg; while (a >= 0 && a < 6 && d >= 0 && d < 7 && b[a * 7 + d] === s.t + 1) { line.push(a * 7 + d); a += dr * sg; d += dc * sg; } } if (line.length >= 4) n.win = { w: s.t, line }; } return n; },
    result: s => s.win ? { w: s.win.w, why: "4개 연결" } : s.n >= 42 ? { w: -1, why: "판이 가득 참" } : null,
    hit(s, X) { const c = Math.floor((X - 20) / ((S - 40) / 7)); return c >= 0 && c < 7 && !s.b[c] ? { move: c } : null; },
    hover(s, X) { const c = Math.floor((X - 20) / ((S - 40) / 7)); return c >= 0 && c < 7 ? c : -1; },
    draw(x, s, v) { rr(x, 0, 0, S, S, 22, "#EEF3FB"); const cs = (S - 40) / 7, oy = 90; rr(x, 14, oy - 6, S - 28, cs * 6 + 12, 22, "#2563EB");
      if (v.myTurn && v.hover >= 0 && !s.b[v.hover]) disc(x, 20 + v.hover * cs + cs / 2, 44, cs * .38, v.me === 0 ? "#FF8A9A" : "#FFE08A", v.me === 0 ? "#D92C3F" : "#E5A400");
      const dp = s.dropAt ? Math.min(1, (Date.now() - s.dropAt) / 350) : 1;
      for (let i = 0; i < 42; i++) { const r = i / 7 | 0, c = i % 7, X = 20 + c * cs + cs / 2, Y = oy + r * cs + cs / 2; cir(x, X, Y, cs * .38, "#163D99"); const p = s.b[i]; if (!p) continue; let yy = Y; if (i === s.last && dp < 1) yy = 44 + (Y - 44) * dp * dp; disc(x, X, yy, cs * .38, p === 1 ? "#FF8A9A" : "#FFE08A", p === 1 ? "#D92C3F" : "#E5A400"); }
      if (s.win) s.win.line.forEach(i => { x.strokeStyle = "#fff"; x.lineWidth = 4; x.beginPath(); x.arc(20 + (i % 7) * cs + cs / 2, oy + (i / 7 | 0) * cs + cs / 2, cs * .3, 0, 7); x.stroke(); }); }
  });

  // ---------------- 체커 ----------------
  function ckMoves(s) { const B = s.b, me = s.t, own = v => me === 0 ? (v === 1 || v === 2) : (v === 3 || v === 4), opp = v => v && !own(v), J = [], M = [];
    for (let i = 0; i < 64; i++) { const v = B[i]; if (!own(v)) continue; const king = v === 2 || v === 4, dirs = king ? [-1, 1] : [me === 0 ? -1 : 1];
      const dfs = (pos, b, path) => { let ext = false; const r = pos >> 3, f = pos & 7; for (const dr of dirs) for (const df of [-1, 1]) { const tr = r + 2 * dr, tf = f + 2 * df; if (!OB(tr, tf)) continue; const mid = (r + dr) * 8 + f + df, to = tr * 8 + tf; if (opp(b[mid]) && !b[to]) { const nb = b.slice(); nb[to] = nb[pos]; nb[pos] = 0; nb[mid] = 0; ext = true; dfs(to, nb, path.concat(to)); } } if (!ext && path.length > 1) J.push(path); };
      dfs(i, B, [i]); for (const dr of dirs) for (const df of [-1, 1]) { const r = (i >> 3) + dr, f = (i & 7) + df; if (OB(r, f) && !B[r * 8 + f]) M.push([i, r * 8 + f]); } }
    return J.length ? J : M; }
  G.push({ id: "checkers", name: "체커", tag: "전략", color: "#B91C1C", sides: ["빨강", "검정"], sideColor: ["#E5383B", "#191F28"],
    desc: "대각선으로 전진하며 상대 말을 뛰어넘어 잡기. 잡을 수 있으면 반드시 잡아야 하고 연속 점프 가능. 끝줄에 닿으면 킹.",
    init: () => { const b = Array(64).fill(0); for (let i = 0; i < 64; i++) if (((i >> 3) + (i & 7)) % 2) { if ((i >> 3) < 3) b[i] = 3; if ((i >> 3) > 4) b[i] = 1; } return { b, t: 0, last: null, n: 0 }; },
    turn: s => s.t, legal: ckMoves,
    apply(s, path) { const b = s.b.slice(); let p = b[path[0]]; b[path[0]] = 0; for (let k = 1; k < path.length; k++) { const a = path[k - 1], c = path[k]; if (Math.abs((c >> 3) - (a >> 3)) === 2) b[(a + c) / 2] = 0; } const end = path[path.length - 1]; if (p === 1 && (end >> 3) === 0) p = 2; if (p === 3 && (end >> 3) === 7) p = 4; b[end] = p; return { b, t: 1 - s.t, last: path, n: s.n + 1 }; },
    result(s) { if (!ckMoves(s).length) return { w: 1 - s.t, why: "더 움직일 수 없음" }; if (s.n >= 200) return { w: -1, why: "수 제한" }; return null; },
    sq(v, X, Y) { const cs = (S - 40) / 8, c = Math.floor((X - 20) / cs), r = Math.floor((Y - 20) / cs); if (!OB(r, c)) return -1; const i = r * 8 + c; return v.me === 1 ? 63 - i : i; },
    hit(s, X, Y, v) { const i = this.sq(v, X, Y); if (i < 0) return null; const L = ckMoves(s); if (v.sel >= 0) { const m = L.find(p => p[0] === v.sel && p[p.length - 1] === i); if (m) return { move: m }; } if (L.some(p => p[0] === i)) return { sel: i }; return { sel: -1 }; },
    hover(s, X, Y, v) { return this.sq(v, X, Y); },
    draw(x, s, v) { rr(x, 0, 0, S, S, 22, "#2B1D12"); const cs = (S - 40) / 8, flip = v.me === 1, P = i => { const d = flip ? 63 - i : i; return [20 + (d & 7) * cs, 20 + (d >> 3) * cs]; }; const L = ckMoves(s), movable = new Set(L.map(p => p[0])), tg = v.sel >= 0 ? L.filter(p => p[0] === v.sel).map(p => p[p.length - 1]) : [];
      for (let i = 0; i < 64; i++) { const [X, Y] = P(i); x.fillStyle = ((i >> 3) + (i & 7)) % 2 ? "#6B4426" : "#E9D3B0"; x.fillRect(X, Y, cs, cs); if (s.last && s.last.includes(i)) { x.fillStyle = "rgba(255,204,0,.3)"; x.fillRect(X, Y, cs, cs); } if (i === v.sel) { x.fillStyle = "rgba(49,130,246,.5)"; x.fillRect(X, Y, cs, cs); } }
      s.b.forEach((p, i) => { if (!p) return; const [X, Y] = P(i), red = p <= 2; disc(x, X + cs / 2, Y + cs / 2, cs * .38, red ? "#FF6B7A" : "#4E5968", red ? "#B91C2C" : "#0F1621"); if (p === 2 || p === 4) { x.fillStyle = "#FFC342"; x.font = "900 " + (cs * .38) + "px 'Pretendard Variable',sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("K", X + cs / 2, Y + cs / 2 + 1); } if (v.myTurn && movable.has(i) && v.sel < 0) { x.strokeStyle = "rgba(255,255,255,.7)"; x.lineWidth = 2; x.beginPath(); x.arc(X + cs / 2, Y + cs / 2, cs * .44, 0, 7); x.stroke(); } });
      tg.forEach(i => { const [X, Y] = P(i); cir(x, X + cs / 2, Y + cs / 2, cs * .16, "rgba(255,255,255,.75)"); }); },
    extra(s) { return ["남은 말 " + s.b.filter(v => v === 1 || v === 2).length, "남은 말 " + s.b.filter(v => v === 3 || v === 4).length]; }
  });

  // ---------------- 도트 앤 박스 ----------------
  const DN = 5;
  const boxDone = (L, r, c) => L[r * DN + c] && L[(r + 1) * DN + c] && L[30 + r * (DN + 1) + c] && L[30 + r * (DN + 1) + c + 1];
  G.push({ id: "dots", name: "도트 앤 박스", tag: "캐주얼", color: "#8B5CF6", sides: ["파랑", "빨강"], sideColor: ["#3182F6", "#F04452"],
    desc: "점 사이에 선을 하나씩 그어요. 네 번째 선을 그어 상자를 닫으면 내 칸이 되고 한 번 더. 상자를 많이 차지한 쪽이 승리.",
    init: () => ({ L: Array(60).fill(0), bx: Array(25).fill(0), t: 0, last: -1, n: 0 }),
    turn: s => s.t, legal: s => s.L.map((v, i) => v ? -1 : i).filter(i => i >= 0),
    apply(s, m) { const L = s.L.slice(), bx = s.bx.slice(); L[m] = s.t + 1; let got = 0; for (let r = 0; r < DN; r++) for (let c = 0; c < DN; c++) if (!bx[r * DN + c] && boxDone(L, r, c)) { bx[r * DN + c] = s.t + 1; got++; } return { L, bx, t: got ? s.t : 1 - s.t, last: m, n: s.n + 1, again: !!got }; },
    result(s) { if (s.L.some(v => !v)) return null; const a = s.bx.filter(v => v === 1).length, b = s.bx.filter(v => v === 2).length; return { w: a === b ? -1 : a > b ? 0 : 1, why: a + " : " + b }; },
    geo() { const o = 70, st = (S - 140) / DN; return { o, st }; },
    near(X, Y) { const { o, st } = this.geo(); let best = -1, bd = 22; for (let r = 0; r <= DN; r++) for (let c = 0; c < DN; c++) { const d = Math.hypot(X - (o + c * st + st / 2), Y - (o + r * st)); if (d < bd) { bd = d; best = r * DN + c; } } for (let r = 0; r < DN; r++) for (let c = 0; c <= DN; c++) { const d = Math.hypot(X - (o + c * st), Y - (o + r * st + st / 2)); if (d < bd) { bd = d; best = 30 + r * (DN + 1) + c; } } return best; },
    hit(s, X, Y) { const i = this.near(X, Y); return i >= 0 && !s.L[i] ? { move: i } : null; },
    hover(s, X, Y) { return this.near(X, Y); },
    draw(x, s, v) { rr(x, 0, 0, S, S, 22, "#FFFFFF"); const { o, st } = this.geo(), C = ["", "#3182F6", "#F04452"], CB = ["", "rgba(49,130,246,.16)", "rgba(240,68,82,.16)"];
      s.bx.forEach((b, i) => { if (b) { rr(x, o + (i % DN) * st + 6, o + (i / DN | 0) * st + 6, st - 12, st - 12, 10, CB[b]); label(x, b === 1 ? "B" : "R", o + (i % DN) * st + st / 2, o + (i / DN | 0) * st + st / 2, 22, C[b]); } });
      const seg = (i, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = "round"; x.beginPath(); if (i < 30) { const r = i / DN | 0, c = i % DN; x.moveTo(o + c * st, o + r * st); x.lineTo(o + (c + 1) * st, o + r * st); } else { const k = i - 30, r = k / (DN + 1) | 0, c = k % (DN + 1); x.moveTo(o + c * st, o + r * st); x.lineTo(o + c * st, o + (r + 1) * st); } x.stroke(); };
      for (let i = 0; i < 60; i++) seg(i, "#EEF1F5", 6);
      if (v.myTurn && v.hover >= 0 && !s.L[v.hover]) seg(v.hover, v.me === 0 ? "rgba(49,130,246,.45)" : "rgba(240,68,82,.45)", 8);
      s.L.forEach((p, i) => p && seg(i, C[p], i === s.last ? 9 : 7));
      for (let r = 0; r <= DN; r++) for (let c = 0; c <= DN; c++) cir(x, o + c * st, o + r * st, 7, INK);
      if (s.again) label(x, "상자 획득! 한 번 더", S / 2, 34, 18, "#E07B00"); },
    extra(s) { return ["상자 " + s.bx.filter(v => v === 1).length, "상자 " + s.bx.filter(v => v === 2).length]; }
  });

  // ---------------- 틱택토 울티밋 ----------------
  const T3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const t3w = a => { for (const [p, q, r] of T3) if (a[p] && a[p] !== 3 && a[p] === a[q] && a[q] === a[r]) return a[p]; return 0; };
  G.push({ id: "ultimate", name: "울티밋 틱택토", tag: "두뇌", color: "#0EA5E9", sides: ["O", "X"], sideColor: ["#3182F6", "#F04452"],
    desc: "작은 틱택토 9개로 이루어진 큰 판. 내가 둔 칸 위치가 상대가 둘 작은 판을 정해요. 작은 판 3개를 한 줄로 먼저 차지하면 승리.",
    init: () => ({ c: Array(81).fill(0), big: Array(9).fill(0), t: 0, nx: -1, last: -1, n: 0 }),
    turn: s => s.t,
    legal(s) { const M = []; for (let i = 0; i < 81; i++) { const B = i / 9 | 0; if (s.c[i] || s.big[B]) continue; if (s.nx >= 0 && s.nx !== B) continue; M.push(i); } return M; },
    apply(s, m) { const c = s.c.slice(), big = s.big.slice(), B = m / 9 | 0, k = m % 9; c[m] = s.t + 1; const sub = c.slice(B * 9, B * 9 + 9); const w = t3w(sub); if (w) big[B] = w; else if (sub.every(v => v)) big[B] = 3; const nx = big[k] ? -1 : k; return { c, big, t: 1 - s.t, nx, last: m, n: s.n + 1 }; },
    result(s) { const w = t3w(s.big); if (w) return { w: w - 1, why: "큰 판 한 줄" }; if (s.big.every(v => v)) { const a = s.big.filter(v => v === 1).length, b = s.big.filter(v => v === 2).length; return { w: a === b ? -1 : a > b ? 0 : 1, why: "작은 판 " + a + " : " + b }; } return null; },
    cell(X, Y) { const o = 20, B = (S - 40) / 3, cs = B / 3; const bc = Math.floor((X - o) / B), br = Math.floor((Y - o) / B); if (bc < 0 || br < 0 || bc > 2 || br > 2) return -1; const lx = X - o - bc * B, ly = Y - o - br * B, c = Math.floor(lx / cs), r = Math.floor(ly / cs); return (br * 3 + bc) * 9 + r * 3 + c; },
    hit(s, X, Y) { const i = this.cell(X, Y); return i >= 0 && this.legal(s).includes(i) ? { move: i } : null; },
    hover(s, X, Y) { return this.cell(X, Y); },
    draw(x, s, v) { rr(x, 0, 0, S, S, 22, "#FFFFFF"); const o = 20, B = (S - 40) / 3, cs = B / 3, L = new Set(this.legal(s)), C = ["", "#3182F6", "#F04452"];
      for (let b = 0; b < 9; b++) { const X = o + (b % 3) * B, Y = o + (b / 3 | 0) * B, active = v.myTurn && [...L].some(i => (i / 9 | 0) === b); rr(x, X + 6, Y + 6, B - 12, B - 12, 14, active ? "#E8F3FF" : "#F7F8FA");
        x.strokeStyle = "#D1D6DB"; x.lineWidth = 2; for (let k = 1; k < 3; k++) { x.beginPath(); x.moveTo(X + 10 + k * (B - 20) / 3, Y + 12); x.lineTo(X + 10 + k * (B - 20) / 3, Y + B - 12); x.stroke(); x.beginPath(); x.moveTo(X + 12, Y + 10 + k * (B - 20) / 3); x.lineTo(X + B - 12, Y + 10 + k * (B - 20) / 3); x.stroke(); }
        for (let k = 0; k < 9; k++) { const i = b * 9 + k, p = s.c[i], cx = X + 10 + (k % 3) * (B - 20) / 3 + (B - 20) / 6, cy = Y + 10 + (k / 3 | 0) * (B - 20) / 3 + (B - 20) / 6; if (p) { x.globalAlpha = s.big[b] ? .25 : 1; label(x, p === 1 ? "O" : "X", cx, cy + 1, 26, C[p]); x.globalAlpha = 1; } if (i === s.last) cir(x, cx + 14, cy - 14, 3.5, "#FFB020"); if (v.myTurn && i === v.hover && L.has(i)) { x.globalAlpha = .35; label(x, v.me === 0 ? "O" : "X", cx, cy + 1, 26, C[v.me + 1]); x.globalAlpha = 1; } }
        if (s.big[b] === 1 || s.big[b] === 2) label(x, s.big[b] === 1 ? "O" : "X", X + B / 2, Y + B / 2 + 4, 120, C[s.big[b]]); }
      x.strokeStyle = INK; x.lineWidth = 5; x.lineCap = "round"; for (let k = 1; k < 3; k++) { x.beginPath(); x.moveTo(o + k * B, o + 4); x.lineTo(o + k * B, S - o - 4); x.stroke(); x.beginPath(); x.moveTo(o + 4, o + k * B); x.lineTo(S - o - 4, o + k * B); x.stroke(); } },
    extra(s) { return ["작은 판 " + s.big.filter(v => v === 1).length, "작은 판 " + s.big.filter(v => v === 2).length]; }
  });


  // ---------------- 바둑 9x9 ----------------
  const GN = 9, gNb = i => { const r = i / GN | 0, c = i % GN, o = []; if (r) o.push(i - GN); if (r < GN - 1) o.push(i + GN); if (c) o.push(i - 1); if (c < GN - 1) o.push(i + 1); return o; };
  const gGroup = (b, i) => { const col = b[i], st = [i], seen = new Set([i]); let lib = 0; const libs = new Set(); while (st.length) { const k = st.pop(); for (const n of gNb(k)) { if (!b[n]) libs.add(n); else if (b[n] === col && !seen.has(n)) { seen.add(n); st.push(n); } } } return { stones: [...seen], libs: libs.size }; };
  const gPlay = (s, m) => { const b = s.b.slice(), me = s.t + 1, op = 3 - me; b[m] = me; let cap = []; for (const n of gNb(m)) if (b[n] === op) { const g = gGroup(b, n); if (!g.libs) { g.stones.forEach(k => b[k] = 0); cap = cap.concat(g.stones); } } const mine = gGroup(b, m); if (!mine.libs) return null; return { b, cap, single: cap.length === 1 && mine.stones.length === 1 && mine.libs === 1 }; };
  const gScore = b => { const sc = [0, 0], seen = new Set(), terr = Array(81).fill(0); b.forEach((v, i) => { if (v) sc[v - 1]++; }); for (let i = 0; i < 81; i++) { if (b[i] || seen.has(i)) continue; const reg = [], st = [i], bord = new Set(); seen.add(i); while (st.length) { const k = st.pop(); reg.push(k); for (const n of gNb(k)) { if (b[n]) bord.add(b[n]); else if (!seen.has(n)) { seen.add(n); st.push(n); } } } if (bord.size === 1) { const o = [...bord][0]; sc[o - 1] += reg.length; reg.forEach(k => terr[k] = o); } } sc[1] += 6.5; return { sc, terr }; };
  G.push({ id: "baduk", name: "바둑 9×9", tag: "전략", color: "#D9A75F", sides: ["흑", "백"], sideColor: ["#191F28", "#E5E8EB"],
    desc: "작은 9줄 바둑. 상대 돌을 둘러싸 잡고 집을 넓히세요. 두 사람이 연속 패스하면 끝, 돌과 집을 합쳐 많은 쪽이 승리(백 덤 6.5). 패 규칙 적용.",
    init: () => ({ b: Array(81).fill(0), t: 0, ko: -1, pass: 0, caps: [0, 0], last: -1, n: 0 }),
    turn: s => s.t,
    legal(s) { const M = ["pass"]; for (let i = 0; i < 81; i++) if (!s.b[i] && i !== s.ko && gPlay(s, i)) M.push(i); return M; },
    apply(s, m) { if (m === "pass") return Object.assign({}, s, { t: 1 - s.t, ko: -1, pass: s.pass + 1, last: -1, passed: s.t, n: s.n + 1 }); const r = gPlay(s, m), caps = s.caps.slice(); caps[s.t] += r.cap.length; return { b: r.b, t: 1 - s.t, ko: r.single ? r.cap[0] : -1, pass: 0, caps, last: m, n: s.n + 1, passed: -1 }; },
    result(s) { if (s.pass < 2 && s.n < 220) return null; const { sc } = gScore(s.b); return { w: sc[0] > sc[1] ? 0 : 1, why: "흑 " + sc[0] + " : 백 " + sc[1] }; },
    pt(X, Y) { const st = 440 / 8, c = Math.round((X - 60) / st), r = Math.round((Y - 50) / st); return r >= 0 && c >= 0 && r < 9 && c < 9 && Math.hypot(X - 60 - c * st, Y - 50 - r * st) < st * .48 ? r * 9 + c : -1; },
    hit(s, X, Y) { if (X > 380 && Y > 508) return { move: "pass" }; const i = this.pt(X, Y); return i >= 0 && !s.b[i] && i !== s.ko && gPlay(s, i) ? { move: i } : null; },
    hover(s, X, Y) { return X > 380 && Y > 508 ? 999 : this.pt(X, Y); },
    draw(x, s, v) { wood(x, "#EBC88E", "#C9965A"); const st = 440 / 8, P = i => [60 + (i % 9) * st, 50 + (i / 9 | 0) * st];
      x.strokeStyle = "rgba(50,30,12,.8)"; x.lineWidth = 1.4; for (let k = 0; k < 9; k++) { x.beginPath(); x.moveTo(60, 50 + k * st); x.lineTo(500, 50 + k * st); x.stroke(); x.beginPath(); x.moveTo(60 + k * st, 50); x.lineTo(60 + k * st, 490); x.stroke(); }
      [20, 24, 56, 60, 40].forEach(i => { const [X, Y] = P(i); cir(x, X, Y, 4.5, "rgba(50,30,12,.9)"); });
      const fin = s.pass >= 2 || s.n >= 220, sc = fin ? gScore(s.b) : null;
      s.b.forEach((c, i) => { if (!c) return; const [X, Y] = P(i); stone(x, X, Y, st * .47, c === 1); });
      if (sc) sc.terr.forEach((o, i) => { if (!o) return; const [X, Y] = P(i); rr(x, X - 7, Y - 7, 14, 14, 3, o === 1 ? "#191F28" : "#FFFFFF"); });
      if (s.last >= 0) { const [X, Y] = P(s.last); x.strokeStyle = s.b[s.last] === 1 ? "#fff" : "#191F28"; x.lineWidth = 2.5; x.beginPath(); x.arc(X, Y, st * .2, 0, 7); x.stroke(); }
      if (s.ko >= 0) { const [X, Y] = P(s.ko); x.strokeStyle = "#F04452"; x.lineWidth = 2; x.strokeRect(X - 8, Y - 8, 16, 16); }
      if (v.myTurn && v.hover >= 0 && v.hover < 81 && !s.b[v.hover]) { const [X, Y] = P(v.hover); x.globalAlpha = .45; stone(x, X, Y, st * .47, v.me === 0); x.globalAlpha = 1; }
      rr(x, 388, 512, 150, 36, 18, v.myTurn ? (v.hover === 999 ? "#191F28" : "rgba(25,31,40,.75)") : "rgba(25,31,40,.25)"); label(x, "패스", 463, 530, 15, "#fff");
      if (s.passed >= 0 && s.passed !== undefined && !fin) label(x, (s.passed === v.me ? "내가" : "상대가") + " 패스했어요", 160, 530, 15, "#5A3618", "center"); },
    extra(s) { return ["잡은 돌 " + s.caps[0], "잡은 돌 " + s.caps[1] + " · 덤 6.5"]; }
  });

  // ---------------- 장기 ----------------
  const JR = 10, JC = 9, jIn = (r, c) => r >= 0 && r < JR && c >= 0 && c < JC;
  const PAL = [[0, 3], [0, 5], [1, 4], [2, 3], [2, 5], [7, 3], [7, 5], [8, 4], [9, 3], [9, 5]];
  const inPal = (r, c) => c >= 3 && c <= 5 && (r <= 2 || r >= 7);
  const palLines = [[[0, 3], [1, 4], [2, 5]], [[0, 5], [1, 4], [2, 3]], [[7, 3], [8, 4], [9, 5]], [[7, 5], [8, 4], [9, 3]]];
  const diagSteps = (r, c) => { const o = []; for (const L of palLines) { const k = L.findIndex(p => p[0] === r && p[1] === c); if (k < 0) continue; if (k > 0) o.push(L.slice(0, k).reverse()); if (k < 2) o.push(L.slice(k + 1)); } return o; };
  function jMoves(b, side) { const M = [], op = side === "g" ? "r" : "g", fw = side === "g" ? -1 : 1;
    for (let i = 0; i < 90; i++) { const p = b[i]; if (!p || p[0] !== side) continue; const r = i / JC | 0, c = i % JC, k = p[1], add = (rr2, cc) => { const t = b[rr2 * JC + cc]; if (!t || t[0] === op) M.push([i, rr2 * JC + cc]); };
      if (k === "K" || k === "A") { for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = r + dr, d = c + dc; if (jIn(a, d) && inPal(a, d) && ((a <= 2) === (r <= 2))) add(a, d); } for (const L of diagSteps(r, c)) add(L[0][0], L[0][1]); }
      else if (k === "R") { for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let a = r + dr, d = c + dc; while (jIn(a, d)) { const t = b[a * JC + d]; if (t) { if (t[0] === op) M.push([i, a * JC + d]); break; } M.push([i, a * JC + d]); a += dr; d += dc; } } for (const L of diagSteps(r, c)) for (const [a, d] of L) { const t = b[a * JC + d]; if (t) { if (t[0] === op) M.push([i, a * JC + d]); break; } M.push([i, a * JC + d]); } }
      else if (k === "C") { const ray = pts => { let jumped = false; for (const [a, d] of pts) { const t = b[a * JC + d]; if (!jumped) { if (t) { if (t[1] === "C") return; jumped = true; } continue; } if (t) { if (t[0] === op && t[1] !== "C") M.push([i, a * JC + d]); return; } M.push([i, a * JC + d]); } };
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const pts = []; let a = r + dr, d = c + dc; while (jIn(a, d)) { pts.push([a, d]); a += dr; d += dc; } ray(pts); } for (const L of diagSteps(r, c)) ray(L); }
      else if (k === "H") { for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!jIn(r + dr, c + dc) || b[(r + dr) * JC + c + dc]) continue; for (const s2 of [-1, 1]) { const a = r + dr * 2 + (dr ? 0 : s2), d = c + dc * 2 + (dc ? 0 : s2); if (jIn(a, d)) add(a, d); } } }
      else if (k === "E") { for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!jIn(r + dr, c + dc) || b[(r + dr) * JC + c + dc]) continue; for (const s2 of [-1, 1]) { const m1r = r + dr + (dr ? s2 * 0 : s2), m1c = c + dc + (dc ? 0 : 0); const ddr = dr || s2, ddc = dc || s2; const a1 = r + dr + ddr, d1 = c + dc + ddc, a2 = a1 + ddr, d2 = d1 + ddc; if (!jIn(a2, d2) || b[a1 * JC + d1]) continue; add(a2, d2); } } }
      else if (k === "P") { for (const [dr, dc] of [[fw, 0], [0, 1], [0, -1]]) { const a = r + dr, d = c + dc; if (jIn(a, d)) add(a, d); } for (const L of diagSteps(r, c)) { const [a, d] = L[0]; if (a - r === fw) add(a, d); } } }
    return M; }
  const HAN = { g: { K: "楚", A: "士", R: "車", C: "包", H: "馬", E: "象", P: "卒" }, r: { K: "漢", A: "士", R: "車", C: "包", H: "馬", E: "象", P: "兵" } };
  G.push({ id: "janggi", name: "장기", tag: "전략", color: "#C2410C", sides: ["초", "한"], sideColor: ["#0E8A55", "#D92C3F"],
    desc: "한국 장기. 궁성 대각선, 포의 넘어가기, 마·상 멱 규칙까지 그대로. 상대 궁(楚·漢)을 잡으면 승리. 초가 먼저 둡니다.",
    init: () => { const b = Array(90).fill(null), back = "RHEA AEHR"; for (let c = 0; c < 9; c++) { if (back[c] !== " ") { b[c] = "r" + back[c]; b[81 + c] = "g" + back[c]; } } b[13] = "rK"; b[76] = "gK"; b[19] = b[25] = "rC"; b[64] = b[70] = "gC"; [0, 2, 4, 6, 8].forEach(c => { b[27 + c] = "rP"; b[54 + c] = "gP"; }); return { b, t: 0, last: null, n: 0, caps: [[], []] }; },
    turn: s => s.t, legal: s => jMoves(s.b, s.t === 0 ? "g" : "r"),
    apply(s, [fr, to]) { const b = s.b.slice(), caps = [s.caps[0].slice(), s.caps[1].slice()]; if (b[to]) caps[s.t].push(b[to][1]); const kill = b[to] && b[to][1] === "K"; b[to] = b[fr]; b[fr] = null; return { b, t: 1 - s.t, last: [fr, to], n: s.n + 1, caps, kill: kill ? s.t : -1 }; },
    result(s) { if (s.kill >= 0) return { w: s.kill, why: "궁을 잡음" }; if (!jMoves(s.b, s.t === 0 ? "g" : "r").length) return { w: 1 - s.t, why: "둘 수가 없음" }; if (s.n >= 300) { const v = { R: 13, C: 7, H: 5, E: 3, A: 3, P: 2 }; const sc = [0, 1].map(k => s.caps[k].reduce((t, p) => t + (v[p] || 0), 0)); return { w: sc[0] === sc[1] ? -1 : sc[0] > sc[1] ? 0 : 1, why: "수 제한 · 점수 " + sc[0] + " : " + sc[1] }; } return null; },
    geo() { return { ox: 50, oy: 34, sx: 460 / 8, sy: 492 / 9 }; },
    P(i, me) { const { ox, oy, sx, sy } = this.geo(); let r = i / JC | 0, c = i % JC; if (me === 1) { r = 9 - r; c = 8 - c; } return [ox + c * sx, oy + r * sy]; },
    at(X, Y, me) { const { ox, oy, sx, sy } = this.geo(); let c = Math.round((X - ox) / sx), r = Math.round((Y - oy) / sy); if (!jIn(r, c)) return -1; if (me === 1) { r = 9 - r; c = 8 - c; } return r * JC + c; },
    hit(s, X, Y, v) { const i = this.at(X, Y, v.me); if (i < 0) return null; const side = v.me === 0 ? "g" : "r"; if (v.sel >= 0 && this.legal(s).some(m => m[0] === v.sel && m[1] === i)) return { move: [v.sel, i] }; if (s.b[i] && s.b[i][0] === side) return { sel: i }; return { sel: -1 }; },
    hover(s, X, Y, v) { return this.at(X, Y, v.me); },
    draw(x, s, v) { wood(x, "#F0C987", "#D7A45E"); const me = v.me; x.strokeStyle = "rgba(60,30,10,.8)"; x.lineWidth = 1.5;
      for (let r = 0; r < 10; r++) { const [a, y] = this.P(r * 9, 0), [b2] = this.P(r * 9 + 8, 0); x.beginPath(); x.moveTo(a, y); x.lineTo(b2, y); x.stroke(); } for (let c = 0; c < 9; c++) { const [X, y1] = this.P(c, 0), [, y2] = this.P(81 + c, 0); x.beginPath(); x.moveTo(X, y1); x.lineTo(X, y2); x.stroke(); }
      palLines.forEach(L => { const a = this.P(L[0][0] * 9 + L[0][1], 0), b2 = this.P(L[2][0] * 9 + L[2][1], 0); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b2[0], b2[1]); x.stroke(); });
      const L = v.sel >= 0 ? this.legal(s).filter(m => m[0] === v.sel).map(m => m[1]) : [];
      if (s.last) s.last.forEach(i => { const [X, Y] = this.P(i, me); cir(x, X, Y, 26, "rgba(255,190,0,.28)"); });
      s.b.forEach((p, i) => { if (!p) return; const [X, Y] = this.P(i, me), big = p[1] === "K" ? 27 : p[1] === "P" || p[1] === "A" ? 18 : 23;
        x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 6; x.shadowOffsetY = 3; x.beginPath(); for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4; x.lineTo(X + Math.cos(a) * big, Y + Math.sin(a) * big); } x.closePath(); const g = x.createLinearGradient(X, Y - big, X, Y + big); g.addColorStop(0, "#FFF8EA"); g.addColorStop(1, "#E9D6B4"); x.fillStyle = g; x.fill(); x.restore();
        x.strokeStyle = p[0] === "g" ? "#0E8A55" : "#D92C3F"; x.lineWidth = i === v.sel ? 4 : 2; x.stroke();
        x.fillStyle = p[0] === "g" ? "#0B6B42" : "#C0192C"; x.font = "900 " + Math.round(big * 1.05) + "px 'Noto Serif KR','Noto Serif CJK KR','Batang',serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(HAN[p[0]][p[1]], X, Y + 1); });
      L.forEach(i => { const [X, Y] = this.P(i, me); if (s.b[i]) { x.strokeStyle = "rgba(240,68,82,.85)"; x.lineWidth = 4; x.beginPath(); x.arc(X, Y, 28, 0, 7); x.stroke(); } else cir(x, X, Y, 8, "rgba(49,130,246,.75)"); }); },
    extra(s) { return ["잡은 기물 " + s.caps[0].length, "잡은 기물 " + s.caps[1].length]; }
  });

  // ---------------- 헥스 ----------------
  const HN = 11, HR = 17.5, HW = Math.sqrt(3) * HR;
  const hC = (r, c) => [S / 2 - (HN - 1) * HW * .75 + c * HW + r * HW / 2, S / 2 - (HN - 1) * HR * .75 + r * HR * 1.5];
  const hNb = i => { const r = i / HN | 0, c = i % HN, o = []; for (const [dr, dc] of [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]]) { const a = r + dr, d = c + dc; if (a >= 0 && a < HN && d >= 0 && d < HN) o.push(a * HN + d); } return o; };
  const hWin = (b, p) => { const st = [], seen = new Set(); for (let k = 0; k < HN; k++) { const i = p === 1 ? k : k * HN; if (b[i] === p) { st.push(i); seen.add(i); } } const par = {}; while (st.length) { const i = st.pop(), r = i / HN | 0, c = i % HN; if ((p === 1 && r === HN - 1) || (p === 2 && c === HN - 1)) { const path = [i]; let q = i; while (par[q] != null) { q = par[q]; path.push(q); } return path; } for (const n of hNb(i)) if (b[n] === p && !seen.has(n)) { seen.add(n); par[n] = i; st.push(n); } } return null; };
  const hex = (x, X, Y, R, fill, stroke) => { x.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; x.lineTo(X + Math.cos(a) * R, Y + Math.sin(a) * R); } x.closePath(); x.fillStyle = fill; x.fill(); if (stroke) { x.strokeStyle = stroke; x.lineWidth = 1.5; x.stroke(); } };
  G.push({ id: "hex", name: "헥스", tag: "두뇌", color: "#E5383B", sides: ["빨강", "파랑"], sideColor: ["#F04452", "#3182F6"],
    desc: "육각형 판에 돌을 하나씩. 빨강은 위아래, 파랑은 좌우 변을 먼저 이으면 승리. 무승부가 절대 없는 수학자들의 게임.",
    init: () => ({ b: Array(HN * HN).fill(0), t: 0, last: -1, n: 0, path: null }),
    turn: s => s.t, legal: s => s.b.map((v, i) => v ? -1 : i).filter(i => i >= 0),
    apply(s, m) { const b = s.b.slice(); b[m] = s.t + 1; return { b, t: 1 - s.t, last: m, n: s.n + 1, path: hWin(b, s.t + 1), by: s.t }; },
    result: s => s.path ? { w: s.by, why: s.by === 0 ? "위아래 연결" : "좌우 연결" } : null,
    near(X, Y) { let best = -1, bd = HR; for (let i = 0; i < HN * HN; i++) { const [cx, cy] = hC(i / HN | 0, i % HN), d = Math.hypot(X - cx, Y - cy); if (d < bd) { bd = d; best = i; } } return best; },
    hit(s, X, Y) { const i = this.near(X, Y); return i >= 0 && !s.b[i] ? { move: i } : null; }, hover(s, X, Y) { return this.near(X, Y); },
    draw(x, s, v) { rr(x, 0, 0, S, S, 22, "#FFFFFF"); const corner = (r, c) => hC(r, c);
      const [a] = [0]; const t0 = corner(0, 0), t1 = corner(0, HN - 1), b0 = corner(HN - 1, 0), b1 = corner(HN - 1, HN - 1), pad = HR * 1.6;
      x.lineWidth = 10; x.lineCap = "round"; x.strokeStyle = "#F04452"; x.beginPath(); x.moveTo(t0[0] - pad * .5, t0[1] - pad); x.lineTo(t1[0] + pad * .5, t1[1] - pad); x.stroke(); x.beginPath(); x.moveTo(b0[0] - pad * .5, b0[1] + pad); x.lineTo(b1[0] + pad * .5, b1[1] + pad); x.stroke();
      x.strokeStyle = "#3182F6"; x.beginPath(); x.moveTo(t0[0] - pad, t0[1]); x.lineTo(b0[0] - pad, b0[1]); x.stroke(); x.beginPath(); x.moveTo(t1[0] + pad, t1[1]); x.lineTo(b1[0] + pad, b1[1]); x.stroke();
      const path = new Set(s.path || []);
      for (let i = 0; i < HN * HN; i++) { const [cx, cy] = hC(i / HN | 0, i % HN), p = s.b[i]; hex(x, cx, cy, HR - 1, p === 1 ? "#F04452" : p === 2 ? "#3182F6" : (v.myTurn && v.hover === i ? (v.me === 0 ? "#FFD6DC" : "#CFE2FF") : "#F2F4F6"), "#FFFFFF"); if (p) cir(x, cx - 4, cy - 5, 4, "rgba(255,255,255,.35)"); if (path.has(i)) cir(x, cx, cy, 5, "#FFC342"); if (i === s.last) { x.strokeStyle = "#191F28"; x.lineWidth = 2.5; x.beginPath(); x.arc(cx, cy, 7, 0, 7); x.stroke(); } } }
  });

  // ---------------- 쿼리도 ----------------
  const QN = 9;
  const qBlocked = (W, a, b) => { const ar = a / QN | 0, ac = a % QN, br = b / QN | 0, bc = b % QN; if (ar === br) { const c = Math.min(ac, bc); return W.some(w => w[2] === "v" && w[1] === c && (w[0] === ar || w[0] === ar - 1)); } const r = Math.min(ar, br); return W.some(w => w[2] === "h" && w[0] === r && (w[1] === ac || w[1] === ac - 1)); };
  const qNb = (W, i) => { const r = i / QN | 0, c = i % QN, o = []; for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const a = r + dr, d = c + dc; if (a >= 0 && a < QN && d >= 0 && d < QN && !qBlocked(W, i, a * QN + d)) o.push(a * QN + d); } return o; };
  const qPath = (W, from, goal) => { const seen = new Set([from]), q = [from]; while (q.length) { const i = q.shift(); if ((i / QN | 0) === goal) return true; for (const n of qNb(W, i)) if (!seen.has(n)) { seen.add(n); q.push(n); } } return false; };
  const qPawn = s => { const me = s.pos[s.t], op = s.pos[1 - s.t], o = []; for (const n of qNb(s.W, me)) { if (n !== op) { o.push(n); continue; } const dr = (n / QN | 0) - (me / QN | 0), dc = n % QN - me % QN, jr = (n / QN | 0) + dr, jc = n % QN + dc, j = jr * QN + jc; if (jr >= 0 && jr < QN && jc >= 0 && jc < QN && !qBlocked(s.W, n, j)) o.push(j); else for (const m of qNb(s.W, n)) if (m !== me && !o.includes(m)) o.push(m); } return o; };
  const qWallOk = (s, w) => { const [r, c, o] = w; if (s.left[s.t] <= 0) return false; for (const x of s.W) { if (x[0] === r && x[1] === c) return false; if (x[2] === o && o === "h" && x[0] === r && Math.abs(x[1] - c) === 1) return false; if (x[2] === o && o === "v" && x[1] === c && Math.abs(x[0] - r) === 1) return false; } const W2 = s.W.concat([w]); return qPath(W2, s.pos[0], 0) && qPath(W2, s.pos[1], QN - 1); };
  G.push({ id: "quoridor", name: "쿼리도", tag: "전략", color: "#7C3AED", sides: ["파랑", "빨강"], sideColor: ["#3182F6", "#F04452"],
    desc: "내 말을 반대편 끝줄까지 먼저 보내면 승리. 한 턴에 말을 한 칸 움직이거나 벽을 하나 세워 상대를 막아요. 벽은 10개, 길을 완전히 막을 수는 없어요.",
    init: () => ({ pos: [8 * QN + 4, 4], W: [], left: [10, 10], t: 0, last: null, n: 0 }),
    turn: s => s.t,
    legal(s) { const M = qPawn(s).map(p => ({ p })); if (s.left[s.t] > 0) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) for (const o of ["h", "v"]) if (qWallOk(s, [r, c, o])) M.push({ w: [r, c, o] }); return M; },
    apply(s, m) { const pos = s.pos.slice(), left = s.left.slice(); let W = s.W; if (m.p != null) pos[s.t] = m.p; else { W = W.concat([m.w]); left[s.t]--; } return { pos, W, left, t: 1 - s.t, last: m, n: s.n + 1 }; },
    result(s) { if ((s.pos[0] / QN | 0) === 0) return { w: 0, why: "도착" }; if ((s.pos[1] / QN | 0) === QN - 1) return { w: 1, why: "도착" }; if (s.n >= 250) return { w: -1, why: "수 제한" }; return null; },
    g() { return { o: 34, cs: 54, gap: 0 }; },
    fl(r, c, me) { return me === 1 ? [8 - r, 8 - c] : [r, c]; },
    pick(X, Y, me) { const { o, cs } = this.g(), fx = (X - o) / cs, fy = (Y - o) / cs; const cx = Math.floor(fx), cy = Math.floor(fy), dx = fx - cx, dy = fy - cy;
      if (cx < 0 || cy < 0 || cx > 8 || cy > 8) return null;
      const nearV = (dx < .14 && cx > 0) ? cx - 1 : (dx > .86 && cx < 8) ? cx : null, nearH = (dy < .14 && cy > 0) ? cy - 1 : (dy > .86 && cy < 8) ? cy : null;
      if (nearH != null && (nearV == null || Math.min(dy, 1 - dy) <= Math.min(dx, 1 - dx))) { let c = Math.min(7, Math.max(0, dx < .5 ? cx - 1 : cx)); let r = nearH; if (me === 1) { r = 7 - r; c = 7 - c; } return { w: [r, c, "h"] }; }
      if (nearV != null) { let r = Math.min(7, Math.max(0, dy < .5 ? cy - 1 : cy)); let c = nearV; if (me === 1) { r = 7 - r; c = 7 - c; } return { w: [r, c, "v"] }; }
      const [r, c] = this.fl(cy, cx, me); return { p: r * QN + c }; },
    hit(s, X, Y, v) { const m = this.pick(X, Y, v.me); if (!m) return null; if (m.p != null) return qPawn(s).includes(m.p) ? { move: m } : null; return qWallOk(s, m.w) ? { move: m } : null; },
    hover(s, X, Y, v) { const m = this.pick(X, Y, v.me); return m ? JSON.stringify(m) : -1; },
    draw(x, s, v) { rr(x, 0, 0, S, S, 22, "#2A1F3D"); const { o, cs } = this.g(), me = v.me, P = (i) => { const [r, c] = this.fl(i / QN | 0, i % QN, me); return [o + c * cs, o + r * cs]; };
      const goalMe = me === 0 ? 0 : 8; const L = v.myTurn ? qPawn(s) : [];
      for (let i = 0; i < 81; i++) { const [X, Y] = P(i), r = i / QN | 0; rr(x, X + 4, Y + 4, cs - 8, cs - 8, 9, r === 0 ? "#3B3360" : r === 8 ? "#4A2740" : "#3A2F55"); if (L.includes(i)) cir(x, X + cs / 2, Y + cs / 2, 9, "rgba(255,255,255,.55)"); }
      const wall = (w, col) => { let [r, c, ori] = w; if (me === 1) { r = 7 - r; c = 7 - c; } if (ori === "h") rr(x, o + c * cs + 2, o + (r + 1) * cs - 5, cs * 2 - 4, 10, 5, col); else rr(x, o + (c + 1) * cs - 5, o + r * cs + 2, 10, cs * 2 - 4, 5, col); };
      s.W.forEach(w => wall(w, "#FFC342"));
      if (v.myTurn && typeof v.hover === "string") { const m = JSON.parse(v.hover); if (m.w && qWallOk(s, m.w)) wall(m.w, "rgba(255,195,66,.5)"); }
      [0, 1].forEach(p => { const [X, Y] = P(s.pos[p]); disc(x, X + cs / 2, Y + cs / 2, cs * .34, p === 0 ? "#8EC0FF" : "#FF9AAE", p === 0 ? "#1B64DA" : "#C0192C"); });
      label(x, "끝줄 = 골", S / 2, me === 0 ? 18 : S - 14, 12, "rgba(255,255,255,.5)"); },
    extra(s) { return ["남은 벽 " + s.left[0], "남은 벽 " + s.left[1]]; }
  });


  // ---------------- 공용 ----------------
  const RNG = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const shuf = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const btn = (x, ui, id, X, Y, w, hgt, txt, bg, fg, on) => { rr(x, X, Y, w, hgt, 12, on === false ? "rgba(0,0,0,.18)" : bg); label(x, txt, X + w / 2, Y + hgt / 2 + 1, 15, on === false ? "rgba(255,255,255,.45)" : fg); (ui.hits = ui.hits || []).push({ id, X, Y, w, h: hgt }); };
  const hitUI = (ui, X, Y) => { const h2 = (ui.hits || []).slice().reverse().find(b => X >= b.X && X <= b.X + b.w && Y >= b.Y && Y <= b.Y + b.h); return h2 ? h2.id : null; };

  // ---------------- 할리갈리 ----------------
  const EMO_IMG = {};
  const emo = (code) => { let im = EMO_IMG[code]; if (!im) { im = EMO_IMG[code] = new Image(); im.crossOrigin = "anonymous"; im.src = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/" + code + ".svg"; } return im.complete && im.naturalWidth ? im : null; };
  const FRU = [["바나나", "#FFE066", "#E8A800", "1f34c"], ["딸기", "#FF6B81", "#C9184A", "1f353"], ["청사과", "#A9E34B", "#3A9A16", "1f34f"], ["포도", "#B197FC", "#5F3DC4", "1f347"], ["오렌지", "#FFA94D", "#E8590C", "1f34a"]];
  const fruit = (x, f, X, Y, r) => { const [, c1, c2] = FRU[f]; x.save(); x.translate(X, Y); { const im = emo(FRU[f][3]); if (im) { x.shadowColor = "rgba(0,0,0,.22)"; x.shadowBlur = 6; x.shadowOffsetY = 3; x.drawImage(im, -r * 1.2, -r * 1.2, r * 2.4, r * 2.4); x.restore(); return; } } x.shadowColor = "rgba(0,0,0,.18)"; x.shadowBlur = 4; x.shadowOffsetY = 2;
    if (f === 0) { x.rotate(-.6); const g = x.createLinearGradient(0, -r, 0, r); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.beginPath(); x.arc(0, -r * .2, r, .25, Math.PI - .25); x.arc(0, -r * .75, r * .95, Math.PI - .5, .5, true); x.closePath(); x.fill(); cir(x, r * .93, r * .05, r * .1, "#6B4A12"); }
    else if (f === 1) { const g = x.createRadialGradient(-r * .3, -r * .2, r * .1, 0, 0, r * 1.1); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.beginPath(); x.moveTo(0, r); x.bezierCurveTo(-r * 1.25, r * .15, -r * .9, -r * .85, 0, -r * .55); x.bezierCurveTo(r * .9, -r * .85, r * 1.25, r * .15, 0, r); x.fill(); x.shadowColor = "transparent"; [[-.35, -.15], [0, -.2], [.35, -.15], [-.2, .2], [.2, .2], [0, .5]].forEach(([a, b]) => cir(x, a * r, b * r, r * .07, "#FFEC99")); x.fillStyle = "#37B24D"; for (let k = -1; k <= 1; k++) { x.beginPath(); x.ellipse(k * r * .28, -r * .62, r * .3, r * .12, k * .5, 0, 7); x.fill(); } }
    else { const g = x.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r); g.addColorStop(0, "#FFFFFF"); g.addColorStop(.28, c1); g.addColorStop(1, c2); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); x.shadowColor = "transparent";
      if (f === 2) { x.strokeStyle = "rgba(255,255,255,.6)"; x.lineWidth = 1.6; x.beginPath(); x.arc(0, 0, r * .72, 0, 7); x.stroke(); for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(k * 1.047) * r * .72, Math.sin(k * 1.047) * r * .72); x.stroke(); } }
      if (f === 3) { x.fillStyle = "#37B24D"; x.beginPath(); x.ellipse(r * .35, -r * .95, r * .38, r * .14, -.5, 0, 7); x.fill(); x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, r * .6, -2.2, -1.2); x.stroke(); }
      if (f === 4) { cir(x, 0, -r * .82, r * .12, "#5C3A1A"); x.fillStyle = "#37B24D"; x.beginPath(); x.ellipse(r * .32, -r * .9, r * .34, r * .13, .4, 0, 7); x.fill(); for (let k = 0; k < 7; k++) cir(x, Math.cos(k) * r * .5, Math.sin(k * 1.7) * r * .5, 1.2, "rgba(255,255,255,.35)"); } }
    x.restore(); };
  const HPIP = { 1: [[.5, .5]], 2: [[.5, .3], [.5, .7]], 3: [[.3, .25], [.5, .5], [.7, .75]], 4: [[.3, .3], [.7, .3], [.3, .7], [.7, .7]], 5: [[.28, .22], [.72, .22], [.5, .5], [.28, .78], [.72, .78]] };
  const hgCard = (x, c, X, Y, w, hgt, rot) => { x.save(); x.translate(X + w / 2, Y + hgt / 2); x.rotate(rot || 0); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 14; x.shadowOffsetY = 6; rr(x, -w / 2, -hgt / 2, w, hgt, 14, "#FFFDF6"); x.shadowColor = "transparent"; x.strokeStyle = "#EFE6CF"; x.lineWidth = 2; x.beginPath(); if (x.roundRect) x.roundRect(-w / 2 + 6, -hgt / 2 + 6, w - 12, hgt - 12, 10); x.stroke(); HPIP[c.n].forEach(([a, b]) => fruit(x, c.f, -w / 2 + a * w, -hgt / 2 + b * hgt, c.n === 1 ? w * .3 : c.n === 2 ? w * .22 : w * .17)); x.restore(); };
  const hgBack = (x, X, Y, w, hgt, n) => { for (let k = Math.min(3, n) - 1; k >= 0; k--) { x.save(); x.shadowColor = "rgba(0,0,0,.3)"; x.shadowBlur = 8; x.shadowOffsetY = 4; rr(x, X + k * 3, Y + k * 3, w, hgt, 14, k ? "#1B4FA8" : "#2563EB"); x.restore(); } if (!n) return; rr(x, X + 8, Y + 8, w - 16, hgt - 16, 10, "rgba(255,255,255,.12)"); label(x, "HALLI", X + w / 2, Y + hgt / 2 - 10, 16, "#fff"); label(x, "GALLI", X + w / 2, Y + hgt / 2 + 10, 16, "#FFC342"); };
  const hgSum = s => { const t = [0, 0, 0, 0, 0]; s.pile.forEach(p => { const c = p[p.length - 1]; if (c) t[c.f] += c.n; }); return t; };
  G.push({ id: "halligalli", name: "할리갈리", tag: "순발력", color: "#F59F00", sides: ["나", "상대"], sideColor: ["#3182F6", "#F04452"], turnSec: 12, anyTime: true,
    desc: "5종류의 과일 카드를 번갈아 뒤집다가, 펼쳐진 카드 중 한 과일이 정확히 5개가 되는 순간 종을 먼저 치세요! 맞히면 깔린 카드를 모두 가져가고, 틀리면 상대에게 1장. 카드가 떨어지면 패배.",
    keys: "Enter 뒤집기 · Space 종 치기",
    init(seed) { const rnd = RNG(seed || 1), d = []; const cnt = { 1: 5, 2: 3, 3: 3, 4: 2, 5: 1 }; for (let f = 0; f < 5; f++) for (const n in cnt) for (let k = 0; k < cnt[n]; k++) d.push({ f, n: +n }); shuf(d, rnd); return { d: [d.slice(0, 35), d.slice(35)], pile: [[], []], t: 0, n: 0, msg: "", lose: null, rots: [0, 0] }; },
    turn: s => s.t, legal: () => ["flip"], free: (s, m, mi) => m && m.a === "ring" && m.p === mi,
    apply(s, m) { const d = [s.d[0].slice(), s.d[1].slice()], pile = [s.pile[0].slice(), s.pile[1].slice()], ns = { d, pile, t: s.t, n: s.n + 1, msg: "", lose: null, rots: s.rots.slice(), by: -1 };
      if (m === "flip") { if (!d[s.t].length) { ns.lose = s.t; return ns; } const c = d[s.t].shift(); pile[s.t].push(c); ns.rots[s.t] = ((s.n * 37) % 15 - 7) / 60; ns.t = 1 - s.t; if (!d[ns.t].length && !pile[ns.t].length) ns.lose = ns.t; return ns; }
      const p = m.p, ok = hgSum(s).includes(5); ns.by = p;
      if (ok) { const all = pile[0].concat(pile[1]); d[p].push(...all); ns.pile = [[], []]; ns.msg = (p) + "|정답! 카드 " + all.length + "장 획득"; ns.t = p; ns.ok = true; }
      else { if (d[p].length) d[1 - p].push(d[p].shift()); ns.msg = p + "|땡! 상대에게 1장"; ns.ok = false; if (!d[p].length && !pile[p].length) ns.lose = p; }
      return ns; },
    result(s) { if (s.lose != null) return { w: 1 - s.lose, why: "상대 카드 소진" }; if (s.n >= 500) { const a = s.d[0].length + s.pile[0].length, b2 = s.d[1].length + s.pile[1].length; return { w: a === b2 ? -1 : a > b2 ? 0 : 1, why: "카드 " + a + " : " + b2 }; } return null; },
    hit(s, X, Y, v) { if (Math.hypot(X - 440, Y - 280) < 80) return { move: { a: "ring", p: v.me } }; if (v.myTurn && X > 50 && X < 180 && Y > 360 && Y < 530) return { move: "flip" }; return null; },
    key(s, code, v) { if (code === "Space") return { move: { a: "ring", p: v.me } }; if (code === "Enter" && v.myTurn) return { move: "flip" }; return null; },
    hover(s, X, Y) { return Math.hypot(X - 440, Y - 280) < 80 ? 1 : (X > 50 && X < 180 && Y > 360 && Y < 530) ? 2 : -1; },
    draw(x, s, v) { const me = v.me, op = 1 - me; const g = x.createRadialGradient(S / 2, S / 2, 40, S / 2, S / 2, S * .75); g.addColorStop(0, "#2B9A66"); g.addColorStop(1, "#13573A"); rr(x, 0, 0, S, S, 22, g);
      x.strokeStyle = "rgba(255,255,255,.08)"; x.lineWidth = 2; x.beginPath(); x.arc(S / 2, S / 2, 220, 0, 7); x.stroke();
      const W2 = 116, H2 = 160;
      hgBack(x, 60, 30, W2, H2, s.d[op].length); label(x, s.d[op].length + "장", 118, 206, 14, "rgba(255,255,255,.8)");
      const ot = s.pile[op][s.pile[op].length - 1]; if (ot) hgCard(x, ot, 200, 30, W2, H2, s.rots[op]); else { x.strokeStyle = "rgba(255,255,255,.25)"; x.setLineDash([6, 6]); x.strokeRect(200, 30, W2, H2); x.setLineDash([]); }
      hgBack(x, 60, 368, W2, H2, s.d[me].length); label(x, s.d[me].length + "장", 118, 544, 14, "rgba(255,255,255,.8)");
      if (v.myTurn) { x.strokeStyle = v.hover === 2 ? "#FFC342" : "rgba(255,195,66,.6)"; x.lineWidth = 4; x.beginPath(); if (x.roundRect) x.roundRect(56, 364, W2 + 12, H2 + 12, 16); x.stroke(); label(x, "눌러서 뒤집기", 118, 352, 13, "#FFC342"); }
      const mt = s.pile[me][s.pile[me].length - 1]; if (mt) hgCard(x, mt, 200, 368, W2, H2, s.rots[me]); else { x.strokeStyle = "rgba(255,255,255,.25)"; x.setLineDash([6, 6]); x.strokeRect(200, 368, W2, H2); x.setLineDash([]); }
      label(x, "바닥 " + (s.pile[0].length + s.pile[1].length) + "장", 258, 280, 15, "rgba(255,255,255,.75)");
    },
    extra(s) { return ["카드 " + (s.d[0].length + s.pile[0].length) + "장", "카드 " + (s.d[1].length + s.pile[1].length) + "장"]; }
  });

  // ---------------- 루미큐브 클래식 ----------------
  const RT = id => id >= 104 ? { j: true, id } : { id, c: ((id % 52) / 13) | 0, n: id % 13 + 1 };
  const rkSet = ids => { const tiles = ids.map(RT); if (tiles.length < 3) return null; const J = tiles.filter(t => t.j), R = tiles.filter(t => !t.j), nj = J.length;
    if (R.length && tiles.length <= 4 && R.every(t => t.n === R[0].n) && new Set(R.map(t => t.c)).size === R.length) return { v: R[0].n * tiles.length, ord: R.sort((a, b) => a.c - b.c).concat(J).map(t => t.id) };
    if (!R.length || !R.every(t => t.c === R[0].c) || tiles.length > 13) return null; const ns = R.map(t => t.n).sort((a, b) => a - b); for (let k = 1; k < ns.length; k++) if (ns[k] === ns[k - 1]) return null;
    let lo = ns[0], hi = ns[ns.length - 1]; const gap = hi - lo + 1 - ns.length; if (gap > nj) return null; let ex = nj - gap; while (ex > 0 && hi < 13) { hi++; ex--; } while (ex > 0 && lo > 1) { lo--; ex--; } if (ex) return null;
    const by = {}; R.forEach(t => by[t.n] = t.id); const js = J.map(t => t.id), ord = []; let v = 0; for (let n = lo; n <= hi; n++) { ord.push(by[n] != null ? by[n] : js.shift()); v += n; } return { v, ord }; };
  const rkSort = (ids, mode) => ids.slice().sort((a, b) => { const A = RT(a), B = RT(b); if (A.j || B.j) return (A.j ? 1 : 0) - (B.j ? 1 : 0); return mode === "num" ? A.n - B.n || A.c - B.c : A.c - B.c || A.n - B.n; });
  G.push({ id: "rummikub", name: "루미큐브 클래식", tag: "두뇌", color: "#E8590C", sides: ["나", "상대"], sideColor: ["#3182F6", "#F04452"], turnSec: 90,
    desc: "같은 색 연속 숫자(런) 또는 같은 숫자 다른 색(그룹)을 3개 이상 만들어 타일을 털어내세요. 첫 등록은 30점 이상. 이후엔 바닥 조합을 자유롭게 쪼개고 합칠 수 있어요. 손패를 먼저 비우면 승리.",
    keys: "타일 클릭으로 선택 · + 칸에 붙이기 · 새 조합 · 완료",
    init(seed) { const rnd = RNG(seed || 1), ids = shuf(Array.from({ length: 106 }, (_, i) => i), rnd); return { hand: [ids.slice(0, 14), ids.slice(14, 28)], pool: ids.slice(28), board: [], open: [false, false], t: 0, n: 0, passes: 0, msg: "" }; },
    turn: s => s.t, legal: () => [],
    check(s, board, me) { const old = new Set([].concat(...s.board)), now = [].concat(...board), used = now.filter(i => !old.has(i)); if (now.length !== new Set(now).size) return "중복 타일"; for (const i of old) if (!now.includes(i)) return "바닥 타일은 손패로 가져올 수 없어요"; if (used.some(i => !s.hand[me].includes(i))) return "잘못된 타일"; if (!used.length) return "타일을 하나 이상 내려놓으세요"; for (const st of board) if (!rkSet(st)) return "올바르지 않은 조합이 있어요"; if (!s.open[me]) { const oldK = s.board.map(st => st.slice().sort().join()), newK = board.map(st => st.slice().sort().join()); if (oldK.some(k => !newK.includes(k))) return "첫 등록 전에는 바닥을 바꿀 수 없어요"; const val = board.filter(st => st.every(i => used.includes(i))).reduce((t, st) => t + rkSet(st).v, 0); if (val < 30) return "첫 등록은 30점 이상 (지금 " + val + "점)"; } return null; },
    apply(s, m) { const hand = [s.hand[0].slice(), s.hand[1].slice()], pool = s.pool.slice(), me = s.t, ns = { hand, pool, board: s.board, open: s.open.slice(), t: 1 - me, n: s.n + 1, passes: s.passes, msg: "" };
      if (m.a === "play" && !this.check(s, m.board, me)) { const used = [].concat(...m.board).filter(i => ![].concat(...s.board).includes(i)); hand[me] = hand[me].filter(i => !used.includes(i)); ns.board = m.board.map(st => rkSet(st).ord); ns.open[me] = true; ns.passes = 0; ns.msg = me + "|" + used.length + "장 내려놓음"; ns.played = used; return ns; }
      if (pool.length) { hand[me].push(pool.pop()); ns.passes = 0; ns.msg = me + "|1장 뽑음"; } else { ns.passes++; ns.msg = me + "|패스"; } return ns; },
    result(s) { if (!s.hand[0].length) return { w: 0, why: "손패를 다 털었어요" }; if (!s.hand[1].length) return { w: 1, why: "손패를 다 털었어요" }; if (!s.pool.length && s.passes >= 2) { const v = h2 => h2.reduce((t, i) => t + (RT(i).j ? 30 : RT(i).n), 0), a = v(s.hand[0]), b2 = v(s.hand[1]); return { w: a === b2 ? -1 : a < b2 ? 0 : 1, why: "남은 점수 " + a + " : " + b2 }; } return null; },
    ui(s, v) { const u = v.ui; if (u.n !== s.n) { u.n = s.n; u.board = s.board.map(st => st.slice()); u.hand = s.hand[v.me].slice(); u.sel = []; u.err = ""; u.sort = u.sort || "color"; } return u; },
    moveSel(u, target) { const sel = u.sel; if (!sel.length) return; u.board = u.board.map(st => st.filter(i => !sel.includes(i))); u.hand = u.hand.filter(i => !sel.includes(i)); if (target === "new") u.board.push(sel.slice()); else u.board[target] = (u.board[target] || []).concat(sel); u.board = u.board.filter(st => st.length); u.sel = []; },
    hit(s, X, Y, v) { const u = this.ui(s, v), id = hitUI(u, X, Y); if (!id || !v.myTurn) return null; const [k, a2] = id.split(":");
      if (k === "t") { const i = +a2, mineOrig = s.hand[v.me].includes(i); if (!mineOrig && !s.open[v.me]) { u.err = "첫 등록 전에는 바닥 타일을 옮길 수 없어요"; return { ui: 1 }; } u.sel = u.sel.includes(i) ? u.sel.filter(z => z !== i) : u.sel.concat(i); u.err = ""; return { ui: 1 }; }
      if (k === "plus") { this.moveSel(u, +a2); return { ui: 1 }; } if (k === "new") { this.moveSel(u, "new"); return { ui: 1 }; }
      if (k === "rack") { const back = u.sel.filter(i => s.hand[v.me].includes(i)); if (back.length) { u.board = u.board.map(st => st.filter(i => !back.includes(i))).filter(st => st.length); u.hand = u.hand.concat(back.filter(i => !u.hand.includes(i))); u.sel = []; } return { ui: 1 }; }
      if (k === "undo") { u.n = -1; this.ui(s, v); return { ui: 1 }; } if (k === "sort") { u.sort = u.sort === "color" ? "num" : "color"; return { ui: 1 }; }
      if (k === "done") { const changed = u.hand.length < s.hand[v.me].length; if (!changed) return { move: { a: "draw" } }; const e = this.check(s, u.board, v.me); if (e) { u.err = e; return { ui: 1 }; } return { move: { a: "play", board: u.board } }; } return null; },
    hover() { return -1; },
    draw() {},
    extra(s) { return ["손패 " + s.hand[0].length + "장" + (s.open[0] ? "" : " · 등록 전"), "손패 " + s.hand[1].length + "장" + (s.open[1] ? "" : " · 등록 전")]; }
  });

  // ---------------- 다빈치 코드 ----------------
  const DV = id => ({ c: id / 12 | 0, n: id % 12 });
  const dvIns = (h2, id, open) => { const a2 = h2.concat([{ id, open }]); return a2.sort((p, q) => (DV(p.id).n * 2 + DV(p.id).c) - (DV(q.id).n * 2 + DV(q.id).c)); };
  G.push({ id: "davinci", name: "다빈치 코드", tag: "추리", color: "#5F3DC4", sides: ["나", "상대"], sideColor: ["#3182F6", "#F04452"], turnSec: 60,
    desc: "흑·백 0~11 숫자 타일이 작은 수부터 정렬돼 있어요. 상대의 숨은 타일을 골라 숫자를 맞히세요. 맞히면 계속 도전하거나 멈출 수 있고, 틀리면 내가 뽑은 타일이 공개돼요. 상대 타일을 모두 밝히면 승리.",
    keys: "상대 타일 선택 → 숫자 선택",
    init(seed) { const rnd = RNG(seed || 1), ids = shuf(Array.from({ length: 24 }, (_, i) => i), rnd); let h0 = [], h1 = []; ids.slice(0, 4).forEach(i => h0 = dvIns(h0, i, false)); ids.slice(4, 8).forEach(i => h1 = dvIns(h1, i, false)); const pool = ids.slice(8); return { h: [h0, h1], pool, pend: pool.pop(), t: 0, n: 0, streak: 0, msg: "", win: null }; },
    turn: s => s.t, legal: () => [],
    pass(ns) { ns.t = 1 - ns.t; ns.streak = 0; ns.pend = ns.pool.length ? ns.pool.pop() : null; },
    apply(s, m) { const me = s.t, op = 1 - me, ns = { h: [s.h[0].map(o => Object.assign({}, o)), s.h[1].map(o => Object.assign({}, o))], pool: s.pool.slice(), pend: s.pend, t: me, n: s.n + 1, streak: s.streak, msg: "", win: null };
      if (m.a === "guess") { const tile = ns.h[op][m.i]; if (!tile || tile.open) return ns; if (DV(tile.id).n === m.n) { tile.open = true; ns.streak++; ns.msg = me + "|" + m.n + " 정답!"; if (ns.h[op].every(o => o.open)) ns.win = me; } else { ns.msg = me + "|" + m.n + " 땡!"; if (ns.pend != null) { ns.h[me] = dvIns(ns.h[me], ns.pend, true); ns.pend = null; } else { const hid = ns.h[me].find(o => !o.open); if (hid) hid.open = true; } if (ns.h[me].every(o => o.open)) ns.win = op; this.pass(ns); } return ns; }
      if (m.a === "stop" && s.streak > 0) { if (ns.pend != null) ns.h[me] = dvIns(ns.h[me], ns.pend, false); ns.pend = null; ns.msg = me + "|멈춤"; this.pass(ns); } return ns; },
    result: s => s.win != null ? { w: s.win, why: "모든 타일 해독" } : null,
    hit(s, X, Y, v) { const u = v.ui, id = hitUI(u, X, Y); if (!id || !v.myTurn) return null; const [k, a2] = id.split(":"); if (k === "o") { u.pick = +a2; return { ui: 1 }; } if (k === "n" && u.pick != null) { const i = u.pick; u.pick = null; return { move: { a: "guess", i, n: +a2 } }; } if (k === "stop") return { move: { a: "stop" } }; return null; },
    hover() { return -1; },
    draw() {},
    extra(s) { return ["숨은 타일 " + s.h[0].filter(o => !o.open).length, "숨은 타일 " + s.h[1].filter(o => !o.open).length]; }
  });

  // ---------------- 꼬치의 달인 ----------------
  const ING = [["고기"], ["브로콜리"], ["버섯"], ["새우"], ["파프리카"], ["양파"]];
  const kbTarget = (seed, round) => { const rnd = RNG((seed || 1) * 31 + round * 977), len = Math.min(8, 4 + Math.floor(round / 2)); return { seq: Array.from({ length: len }, () => Math.floor(rnd() * 6)), rev: round >= 2 && rnd() < .4 }; };
  G.push({ id: "kebab", name: "꼬치의 달인", tag: "순발력", color: "#D9480F", sides: ["나", "상대"], sideColor: ["#3182F6", "#F04452"], turnSec: 999, anyTime: true,
    desc: "주문서와 똑같은 순서로 재료를 꼬치에 먼저 끼운 사람이 1점! '거꾸로' 주문은 반대 순서로. 틀리면 꼬치를 처음부터 다시. 먼저 5점을 따면 승리.",
    keys: "1~6 재료 · Backspace 빼기",
    init(seed) { return { seed: seed || 1, round: 0, sc: [0, 0], t: 0, n: 0, msg: "", win: null }; },
    turn: s => s.t, legal: () => [], free: (s, m, mi) => m && m.a === "done" && m.p === mi,
    apply(s, m) { if (m.a !== "done" || m.k !== s.round) return s; const sc = s.sc.slice(); sc[m.p]++; return { seed: s.seed, round: s.round + 1, sc, t: s.t, n: s.n + 1, msg: m.p + "|주문 완성! +1점", win: sc[m.p] >= 5 ? m.p : null }; },
    result: s => s.win != null ? { w: s.win, why: "5점 선취" } : null,
    want(s) { const t = kbTarget(s.seed, s.round); return t.rev ? t.seq.slice().reverse() : t.seq; },
    push(s, v, k) { const u = v.ui; if (u.r !== s.round) { u.r = s.round; u.seq = []; } const want = this.want(s); if (u.seq.length >= want.length) return null; if (want[u.seq.length] !== k) { u.seq = []; u.bad = Date.now(); return { ui: 1 }; } u.seq = u.seq.concat(k); if (u.seq.length === want.length) return { move: { a: "done", p: v.me, k: s.round } }; return { ui: 1 }; },
    hit(s, X, Y, v) { if (s.win != null) return null; const id = hitUI(v.ui, X, Y); if (!id) return null; if (id === "back") { const u = v.ui; u.seq = (u.seq || []).slice(0, -1); return { ui: 1 }; } return this.push(s, v, +id.split(":")[1]); },
    key(s, code, v) { if (s.win != null) return null; if (/^Digit[1-6]$/.test(code)) return this.push(s, v, +code.slice(5) - 1); if (code === "Backspace") { v.ui.seq = (v.ui.seq || []).slice(0, -1); return { ui: 1 }; } return null; },
    hover() { return -1; },
    draw() {},
    extra(s) { return [s.sc[0] + "점", s.sc[1] + "점"]; }
  });

  // ---------------- 미니 4목 ----------------
  G.push({ id:"neon4",name:"네온 4목",tag:"속전속결",color:"#754BCE",sides:["핑크","시안"],sideColor:["#FA4FA1","#42D8F4"],
    desc:"5×5 판에서 가로·세로·대각선 네 칸을 먼저 이으세요. 짧고 치열한 전략 대국.",
    init:()=>({b:Array(25).fill(0),t:0,n:0,last:-1,win:null}),turn:s=>s.t,legal:s=>s.b.map((v,i)=>v?-1:i).filter(i=>i>=0),
    apply(s,m){const b=s.b.slice();b[m]=s.t+1;const r=m/5|0,c=m%5;let win=null;for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){const line=[m];for(const sign of [-1,1]){let y=r+dr*sign,x=c+dc*sign;while(y>=0&&y<5&&x>=0&&x<5&&b[y*5+x]===s.t+1){line.push(y*5+x);y+=dr*sign;x+=dc*sign;}}if(line.length>=4)win={w:s.t,line};}return{b,t:1-s.t,n:s.n+1,last:m,win};},
    result:s=>s.win?{w:s.win.w,why:"네 칸 연결"}:s.n===25?{w:-1,why:"무승부"}:null,
    hit(s,X,Y){const cs=92,c=Math.floor((X-50)/cs),r=Math.floor((Y-50)/cs),i=r*5+c;return r>=0&&r<5&&c>=0&&c<5&&!s.b[i]?{move:i}:null;},
    hover(s,X,Y){const cs=92,c=Math.floor((X-50)/cs),r=Math.floor((Y-50)/cs);return r>=0&&r<5&&c>=0&&c<5&&!s.b[r*5+c]?r*5+c:-1;},
    draw(){}
  });

  // ---------------- 21 레이스 ----------------
  G.push({id:"race21",name:"21 레이스",tag:"심리전",color:"#E58A36",sides:["선공","후공"],sideColor:["#FF9E4A","#65B8FF"],
    desc:"한 번에 1~3칸 전진! 숫자 21에 정확히 도착하면 승리하는 빠른 수 싸움.",
    init:()=>({pos:0,t:0,n:0,last:0}),turn:s=>s.t,legal:s=>[1,2,3].filter(n=>s.pos+n<=21),
    apply(s,m){return{pos:s.pos+m,t:1-s.t,n:s.n+1,last:m};},result:s=>s.pos===21?{w:1-s.t,why:"21 도착!"}:null,
    hit(s,X,Y){if(Y<390||Y>495)return null;const m=Math.floor((X-60)/150)+1;return m>=1&&m<=3&&s.pos+m<=21?{move:m}:null;},
    hover(s,X,Y){if(Y<390||Y>495)return-1;const m=Math.floor((X-60)/150)+1;return m>=1&&m<=3&&s.pos+m<=21?m:-1;},
    draw(){},extra:s=>[s.pos+"칸",(21-s.pos)+"칸 남음"]
  });

  // ---------------- 보석 드래프트 ----------------
  G.push({id:"gemdraft",name:"보석 드래프트",tag:"두뇌",color:"#399C95",sides:["청록","보라"],sideColor:["#30B9AA","#AF79E8"],
    desc:"한 번에 보석 하나씩 가져가세요. 높은 점수 보석을 선점하고 마지막 합계로 승부!",
    init:seed=>{const rnd=RNG(seed||1),g=Array.from({length:25},()=>1+Math.floor(rnd()*5));return{g,t:0,n:0,score:[0,0],last:-1};},turn:s=>s.t,legal:s=>s.g.map((v,i)=>v<0?-1:i).filter(i=>i>=0),
    apply(s,m){const g=s.g.slice(),score=s.score.slice();score[s.t]+=g[m];g[m]=-1;return{g,t:1-s.t,n:s.n+1,score,last:m};},
    result:s=>s.n===25?{w:s.score[0]===s.score[1]?-1:s.score[0]>s.score[1]?0:1,why:"보석 합계"}:null,
    hit(s,X,Y){const c=Math.floor((X-50)/92),r=Math.floor((Y-68)/92),i=r*5+c;return c>=0&&c<5&&r>=0&&r<5&&s.g[i]>=0?{move:i}:null;},
    hover(s,X,Y){const c=Math.floor((X-50)/92),r=Math.floor((Y-68)/92),i=r*5+c;return c>=0&&c<5&&r>=0&&r<5&&s.g[i]>=0?i:-1;},
    draw(){},extra:s=>[s.score[0]+"점",s.score[1]+"점"]
  });

  // ================= 실물 보드게임 아트 (공통 키트 + 판 그리기) =================
  const ART_ = (() => {
    const C = { ink: "#2A2520", ink2: "#6A5F52", mute: "#9A8E7E", paper: "#F4EEE3", paper2: "#E8DFCF", edge: "#CDBFA8", red: "#B5402E", redD: "#8C2F20", blue: "#2F5B86", blueD: "#203F5E", gold: "#C9952E", goldD: "#986F1C", green: "#2F6B4F", greenD: "#224D39", felt: "#2D5A46", navy: "#26364B", walnut: "#5E4129", cream: "#FBF7EF" };
    const F = "'Pretendard Variable',Pretendard,system-ui,sans-serif";
    const path = (x, X, Y, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); };
    const fill = (x, X, Y, w, h, r, c) => { path(x, X, Y, w, h, r); x.fillStyle = c; x.fill(); };
    const stroke = (x, X, Y, w, h, r, c, lw) => { path(x, X, Y, w, h, r); x.strokeStyle = c; x.lineWidth = lw || 1; x.stroke(); };
    const dot = (x, X, Y, r, c) => { x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.fillStyle = c; x.fill(); };
    const ring = (x, X, Y, r, c, lw) => { x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.strokeStyle = c; x.lineWidth = lw || 2; x.stroke(); };
    const txt = (x, s, X, Y, size, c, w, al) => { x.fillStyle = c; x.font = (w || 700) + " " + size + "px " + F; x.textAlign = al || "center"; x.textBaseline = "middle"; x.fillText(String(s), X, Y); };
    const rnd = seed => { let n = seed | 0 || 1; return () => ((n = (Math.imul(n, 1664525) + 1013904223) | 0) >>> 0) / 4294967296; };
    let grain = null;
    const noise = () => { if (grain) return grain; const c = document.createElement("canvas"); c.width = c.height = 140; const g = c.getContext("2d"), r = rnd(9); for (let i = 0; i < 2600; i++) { g.fillStyle = r() < .5 ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.05)"; g.fillRect(r() * 140, r() * 140, 1 + r() * 1.4, 1 + r() * 1.4); } return (grain = c); };
    const tex = (x, X, Y, w, h, r) => { x.save(); path(x, X, Y, w, h, r); x.clip(); x.fillStyle = x.createPattern(noise(), "repeat"); x.fillRect(X, Y, w, h); x.restore(); };
    const woodGrain = (x, X, Y, w, h, r, base, dark, seed) => { fill(x, X, Y, w, h, r, base); x.save(); path(x, X, Y, w, h, r); x.clip(); const R = rnd(seed || 3); x.strokeStyle = dark; for (let i = 0; i < h / 7; i++) { x.globalAlpha = .04 + R() * .07; x.lineWidth = .8 + R() * 1.6; const y0 = Y + i * 7 + R() * 4; x.beginPath(); x.moveTo(X - 10, y0); for (let k = 0; k <= 6; k++) x.lineTo(X + k * w / 6, y0 + Math.sin(k * 1.3 + i * .7) * (2 + R() * 3)); x.stroke(); } x.restore(); tex(x, X, Y, w, h, r); };
    const table = (x, c) => { fill(x, 0, 0, S, S, 22, c || C.felt); tex(x, 0, 0, S, S, 22); };
    const sheet = (x, X, Y, w, h, r, c) => { x.save(); x.shadowColor = "rgba(30,20,10,.22)"; x.shadowBlur = 5; x.shadowOffsetY = 2; fill(x, X, Y, w, h, r, c || C.paper); x.restore(); tex(x, X, Y, w, h, r); };
    const token = (x, X, Y, r, c, d) => { x.save(); x.shadowColor = "rgba(30,20,10,.32)"; x.shadowBlur = r * .35; x.shadowOffsetY = r * .14; dot(x, X, Y, r, d || c); x.restore(); dot(x, X, Y - r * .06, r * .93, c); ring(x, X, Y - r * .06, r * .66, "rgba(0,0,0,.14)", Math.max(1, r * .07)); x.save(); x.beginPath(); x.arc(X, Y - r * .06, r * .8, Math.PI * 1.1, Math.PI * 1.5); x.strokeStyle = "rgba(255,255,255,.3)"; x.lineWidth = Math.max(1, r * .1); x.lineCap = "round"; x.stroke(); x.restore(); };
    const goStone = (x, X, Y, r, black) => { x.save(); x.shadowColor = "rgba(20,12,4,.4)"; x.shadowBlur = r * .3; x.shadowOffsetY = r * .16; dot(x, X, Y, r, black ? "#1F1D1B" : "#F3F0E8"); x.restore(); if (!black) ring(x, X, Y, r - .6, "#CFC7B8", 1.2); x.save(); x.beginPath(); x.arc(X - r * .1, Y - r * .1, r * .62, Math.PI * 1.05, Math.PI * 1.6); x.strokeStyle = black ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.9)"; x.lineWidth = r * .14; x.lineCap = "round"; x.stroke(); x.restore(); };
    const button = (x, ui, id, X, Y, w, h, label, kind, on, size) => { const dis = on === false, dark = !dis && kind && kind !== "plain"; const bg = dis ? C.paper2 : kind === "primary" ? C.ink : kind === "red" ? C.red : kind === "blue" ? C.blue : kind === "gold" ? C.gold : C.paper; x.save(); if (!dis) { x.shadowColor = "rgba(0,0,0,.25)"; x.shadowOffsetY = 2; } fill(x, X, Y, w, h, 10, bg); x.restore(); if (!dark) stroke(x, X + .5, Y + .5, w - 1, h - 1, 10, dis ? "rgba(0,0,0,.08)" : C.edge, 1); txt(x, label, X + w / 2, Y + h / 2 + 1, size || 15, dis ? C.mute : dark ? C.cream : C.ink, 700); if (ui && !dis) (ui.hits = ui.hits || []).push({ id, X, Y, w, h }); };
    const pill = (x, label, X, Y, c, fg, size) => { const fs = size || 13; x.font = "700 " + fs + "px " + F; const w = x.measureText(label).width + 26, h = fs + 17; fill(x, X - w / 2, Y - h / 2, w, h, h / 2, c || C.ink); txt(x, label, X, Y + 1, fs, fg || C.cream, 700); };
    const oMark = (x, X, Y, r, c, lw) => ring(x, X, Y, r, c, lw);
    const xMark = (x, X, Y, r, c, lw) => { x.save(); x.strokeStyle = c; x.lineWidth = lw; x.lineCap = "round"; x.beginPath(); x.moveTo(X - r, Y - r); x.lineTo(X + r, Y + r); x.moveTo(X + r, Y - r); x.lineTo(X - r, Y + r); x.stroke(); x.restore(); };
    const crown = (x, X, Y, w, c) => { x.beginPath(); x.moveTo(X - w, Y + w * .5); x.lineTo(X - w, Y - w * .3); x.lineTo(X - w * .5, Y + w * .05); x.lineTo(X, Y - w * .6); x.lineTo(X + w * .5, Y + w * .05); x.lineTo(X + w, Y - w * .3); x.lineTo(X + w, Y + w * .5); x.closePath(); x.fillStyle = c; x.fill(); };
    const IMG = {}; const pending = () => Object.values(IMG).filter(im => !im.complete).length; const img = url => { let im = IMG[url]; if (!im) { im = IMG[url] = new Image(); im.crossOrigin = "anonymous"; im.src = url; } return im.complete && im.naturalWidth ? im : null; };
    const preload = urls => Promise.all(urls.map(u => new Promise(res => { img(u); const im = IMG[u]; if (im.complete) return res(); im.addEventListener("load", res); im.addEventListener("error", res); setTimeout(res, 5000); })));
    const K = { img, preload, pending, C, F, path, fill, stroke, dot, ring, txt, rnd, tex, woodGrain, table, sheet, token, goStone, button, pill, oMark, xMark, crown, hitUI };
    const D = {}, BOARD = "#DDB57A", GRAIN = "#7A5326";

    D.omok = function (x, s, v) { woodGrain(x, 0, 0, S, S, 22, BOARD, GRAIN, 11); const st = (S - 60) / 14, P = i => [30 + (i % 15) * st, 30 + (i / 15 | 0) * st];
      x.strokeStyle = "rgba(52,32,12,.7)"; x.lineWidth = 1.1; for (let i = 0; i < 15; i++) { x.beginPath(); x.moveTo(30, 30 + i * st); x.lineTo(S - 30, 30 + i * st); x.stroke(); x.beginPath(); x.moveTo(30 + i * st, 30); x.lineTo(30 + i * st, S - 30); x.stroke(); }
      x.lineWidth = 2; x.strokeRect(30, 30, S - 60, S - 60);
      [3, 7, 11].forEach(a => [3, 7, 11].forEach(b => dot(x, 30 + a * st, 30 + b * st, 3.4, "rgba(52,32,12,.85)")));
      s.b.forEach((c, i) => { if (c) { const [X, Y] = P(i); goStone(x, X, Y, st * .46, c === 1); } });
      if (s.last >= 0) { const [X, Y] = P(s.last); ring(x, X, Y, st * .17, s.b[s.last] === 1 ? "#F3F0E8" : "#1F1D1B", 2); }
      if (v.hover >= 0 && v.myTurn && !s.b[v.hover]) { const [X, Y] = P(v.hover); x.globalAlpha = .42; goStone(x, X, Y, st * .46, v.me === 0); x.globalAlpha = 1; }
      if (s.win) { const L = s.win.line.map(P).sort((a, b) => a[0] - b[0] || a[1] - b[1]); x.save(); x.strokeStyle = C.red; x.globalAlpha = .85; x.lineWidth = 4; x.lineCap = "round"; x.beginPath(); x.moveTo(L[0][0], L[0][1]); x.lineTo(L[L.length - 1][0], L[L.length - 1][1]); x.stroke(); x.restore(); } };

    D.chess = function (x, s, v) { woodGrain(x, 0, 0, S, S, 22, C.walnut, "#1E120A", 5); const cs = (S - 40) / 8, flip = v.me === 1, P = i => { const d = flip ? 63 - i : i; return [20 + Fl(d) * cs, 20 + Rw(d) * cs]; };
      const tg = v.sel >= 0 ? chLegal(s).filter(m => m[0] === v.sel).map(m => m[1]) : [], k = s.b.indexOf(s.t + "K"), chk = k >= 0 && attacked(s.b, k, s.t === "w" ? "b" : "w") ? k : -1;
      for (let i = 0; i < 64; i++) { const [X, Y] = P(i), light = (Rw(i) + Fl(i)) % 2 === 0; x.fillStyle = light ? "#EADBC0" : "#B08559"; x.fillRect(X, Y, cs, cs); if (s.last && (s.last[0] === i || s.last[1] === i)) { x.fillStyle = "rgba(201,149,46,.4)"; x.fillRect(X, Y, cs, cs); } if (i === v.sel) { x.fillStyle = "rgba(47,91,134,.42)"; x.fillRect(X, Y, cs, cs); } if (i === chk) { x.fillStyle = "rgba(181,64,46,.6)"; x.fillRect(X, Y, cs, cs); } }
      tex(x, 20, 20, S - 40, S - 40, 0); x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 1.5; x.strokeRect(20, 20, S - 40, S - 40);
      for (let q = 0; q < 8; q++) { const fr = flip ? 7 - q : q, rk = flip ? q + 1 : 8 - q; txt(x, "abcdefgh"[fr], 20 + q * cs + cs - 7, S - 20 - 8, 10, q % 2 === 0 ? "#EADBC0" : "#8A6440", 700); txt(x, rk, 27, 20 + q * cs + 9, 10, q % 2 === 0 ? "#8A6440" : "#EADBC0", 700); }
      for (let i = 0; i < 64; i++) if (s.b[i]) { const [X, Y] = P(i); piece(x, s.b[i], X + cs / 2, Y + cs / 2, cs * .78); }
      tg.forEach(i => { const [X, Y] = P(i); if (s.b[i]) ring(x, X + cs / 2, Y + cs / 2, cs * .44, "rgba(42,37,32,.5)", 4); else dot(x, X + cs / 2, Y + cs / 2, cs * .13, "rgba(42,37,32,.32)"); }); };

    D.othello = function (x, s, v) { woodGrain(x, 0, 0, S, S, 22, C.walnut, "#1E120A", 7); const cs = (S - 40) / 8; fill(x, 18, 18, S - 36, S - 36, 4, "#2F6B4F"); tex(x, 18, 18, S - 36, S - 36, 4);
      x.strokeStyle = "rgba(0,0,0,.38)"; x.lineWidth = 1.5; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(20 + i * cs, 20); x.lineTo(20 + i * cs, S - 20); x.stroke(); x.beginPath(); x.moveTo(20, 20 + i * cs); x.lineTo(S - 20, 20 + i * cs); x.stroke(); }
      [[2, 2], [2, 6], [6, 2], [6, 6]].forEach(([a, b]) => dot(x, 20 + a * cs, 20 + b * cs, 4, "rgba(0,0,0,.45)"));
      const C0 = ["", "#232120", "#F1EDE4"], C1 = ["", "#0E0D0C", "#C9C1B2"];
      s.b.forEach((c, i) => { if (!c) return; token(x, 20 + (i & 7) * cs + cs / 2, 20 + (i >> 3) * cs + cs / 2, cs * .4, C0[c], C1[c]); });
      if (s.last >= 0) { const X = 20 + (s.last & 7) * cs + cs / 2, Y = 20 + (s.last >> 3) * cs + cs / 2 - 2; dot(x, X, Y, 4, s.b[s.last] === 1 ? "#F1EDE4" : "#232120"); }
      if (v.myTurn) odMoves(s.b, s.t + 1).forEach(i => { const X = 20 + (i & 7) * cs + cs / 2, Y = 20 + (i >> 3) * cs + cs / 2; if (i === v.hover) { x.globalAlpha = .45; token(x, X, Y, cs * .4, C0[v.me + 1], C1[v.me + 1]); x.globalAlpha = 1; } else dot(x, X, Y, 5, "rgba(0,0,0,.3)"); }); };

    D.connect4 = function (x, s, v) { fill(x, 0, 0, S, S, 22, C.paper); tex(x, 0, 0, S, S, 22); const cs = (S - 40) / 7, oy = 90;
      fill(x, 22, oy + cs * 6 - 4, 18, 470 - oy - cs * 6 + 70, 4, "#203F5E"); fill(x, S - 40, oy + cs * 6 - 4, 18, 470 - oy - cs * 6 + 70, 4, "#203F5E");
      x.save(); x.shadowColor = "rgba(30,20,10,.3)"; x.shadowBlur = 10; x.shadowOffsetY = 4; fill(x, 14, oy - 6, S - 28, cs * 6 + 12, 16, C.blue); x.restore(); tex(x, 14, oy - 6, S - 28, cs * 6 + 12, 16);
      if (v.myTurn && v.hover >= 0 && !s.b[v.hover]) token(x, 20 + v.hover * cs + cs / 2, 44, cs * .38, v.me === 0 ? C.red : "#D9A63A", v.me === 0 ? C.redD : "#A97E22");
      const ui = v.ui || {}, now = Date.now(); if (s.last >= 0 && ui.c4N !== s.n) { ui.c4N = s.n; ui.c4S = now; ui.c4B = 0; }
      for (let i = 0; i < 42; i++) { const r = i / 7 | 0, c = i % 7, X = 20 + c * cs + cs / 2, Y = oy + r * cs + cs / 2; dot(x, X, Y, cs * .38, "#E3D9C7"); ring(x, X, Y, cs * .38, "rgba(0,0,0,.18)", 2); const p = s.b[i]; if (!p) continue; let yy = Y; if (i === s.last && window.Phys && ui.c4S) { const d = Phys.drop(now - ui.c4S, Y - 44); if (!d.done) { yy = Y - d.y; ui.animUntil = now + 60; if (d.bounce > ui.c4B) { ui.c4B = d.bounce; if (d.bounce === 1) try { WJ.sfx("click"); } catch (e) {} } } } token(x, X, yy, cs * .37, p === 1 ? C.red : "#D9A63A", p === 1 ? C.redD : "#A97E22"); }
      if (s.win) s.win.line.forEach(i => ring(x, 20 + (i % 7) * cs + cs / 2, oy + (i / 7 | 0) * cs + cs / 2 - 2, cs * .22, C.cream, 3)); };

    const checker = (x, X, Y, r, red) => { token(x, X, Y, r, red ? C.red : "#2B2826", red ? C.redD : "#121110"); ring(x, X, Y - r * .06, r * .48, red ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.12)", 1.5); };
    D.checkers = function (x, s, v) { woodGrain(x, 0, 0, S, S, 22, C.walnut, "#1E120A", 8); const cs = (S - 40) / 8, flip = v.me === 1, P = i => { const d = flip ? 63 - i : i; return [20 + (d & 7) * cs, 20 + (d >> 3) * cs]; }; const L = ckMoves(s), movable = new Set(L.map(p => p[0])), tg = v.sel >= 0 ? L.filter(p => p[0] === v.sel).map(p => p[p.length - 1]) : [];
      for (let i = 0; i < 64; i++) { const [X, Y] = P(i); x.fillStyle = ((i >> 3) + (i & 7)) % 2 ? "#7A5434" : "#E7D5B5"; x.fillRect(X, Y, cs, cs); if (s.last && s.last.includes(i)) { x.fillStyle = "rgba(201,149,46,.35)"; x.fillRect(X, Y, cs, cs); } if (i === v.sel) { x.fillStyle = "rgba(47,91,134,.45)"; x.fillRect(X, Y, cs, cs); } }
      tex(x, 20, 20, S - 40, S - 40, 0);
      s.b.forEach((p, i) => { if (!p) return; const [X, Y] = P(i), cx = X + cs / 2, cy = Y + cs / 2; checker(x, cx, cy, cs * .38, p <= 2); if (p === 2 || p === 4) crown(x, cx, cy - 2, cs * .16, C.gold); if (v.myTurn && movable.has(i) && v.sel < 0) ring(x, cx, cy, cs * .45, "rgba(251,247,239,.7)", 1.5); });
      tg.forEach(i => { const [X, Y] = P(i); dot(x, X + cs / 2, Y + cs / 2, cs * .12, "rgba(251,247,239,.8)"); }); };

    D.dots = function (x, s, v) { fill(x, 0, 0, S, S, 22, C.paper); tex(x, 0, 0, S, S, 22); const { o, st } = this.geo(), PC = ["", C.blue, C.red], PT = ["", "rgba(47,91,134,.15)", "rgba(181,64,46,.15)"];
      s.bx.forEach((b, i) => { if (!b) return; const X = o + (i % DN) * st, Y = o + (i / DN | 0) * st; fill(x, X + 6, Y + 6, st - 12, st - 12, 6, PT[b]); dot(x, X + st / 2, Y + st / 2, 8, PC[b]); });
      const seg = (i, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = "round"; x.beginPath(); if (i < 30) { const r = i / DN | 0, c = i % DN; x.moveTo(o + c * st, o + r * st); x.lineTo(o + (c + 1) * st, o + r * st); } else { const k = i - 30, r = k / (DN + 1) | 0, c = k % (DN + 1); x.moveTo(o + c * st, o + r * st); x.lineTo(o + c * st, o + (r + 1) * st); } x.stroke(); };
      x.setLineDash([2, 9]); for (let i = 0; i < 60; i++) if (!s.L[i]) seg(i, "rgba(42,37,32,.25)", 2); x.setLineDash([]);
      if (v.myTurn && v.hover >= 0 && !s.L[v.hover]) { x.globalAlpha = .4; seg(v.hover, PC[v.me + 1], 6); x.globalAlpha = 1; }
      s.L.forEach((p, i) => p && seg(i, PC[p], i === s.last ? 7 : 5));
      for (let r = 0; r <= DN; r++) for (let c = 0; c <= DN; c++) dot(x, o + c * st, o + r * st, 5.5, C.ink);
      if (s.again) pill(x, "상자를 닫았어요 · 한 번 더", S / 2, 34, C.gold, C.cream); };

    D.ultimate = function (x, s, v) { fill(x, 0, 0, S, S, 22, C.paper); tex(x, 0, 0, S, S, 22); const o = 20, B = (S - 40) / 3, L = new Set(this.legal(s)), PC = ["", C.blue, C.red];
      const mark = (p, X, Y, r, lw) => p === 1 ? oMark(x, X, Y, r, PC[1], lw) : xMark(x, X, Y, r * .8, PC[2], lw);
      for (let b = 0; b < 9; b++) { const X = o + (b % 3) * B, Y = o + (b / 3 | 0) * B, active = v.myTurn && [...L].some(i => (i / 9 | 0) === b); if (active) fill(x, X + 8, Y + 8, B - 16, B - 16, 10, "rgba(201,149,46,.18)");
        x.strokeStyle = C.edge; x.lineWidth = 2; x.lineCap = "round"; for (let k = 1; k < 3; k++) { x.beginPath(); x.moveTo(X + 10 + k * (B - 20) / 3, Y + 14); x.lineTo(X + 10 + k * (B - 20) / 3, Y + B - 14); x.stroke(); x.beginPath(); x.moveTo(X + 14, Y + 10 + k * (B - 20) / 3); x.lineTo(X + B - 14, Y + 10 + k * (B - 20) / 3); x.stroke(); }
        for (let k = 0; k < 9; k++) { const i = b * 9 + k, p = s.c[i], cx = X + 10 + (k % 3) * (B - 20) / 3 + (B - 20) / 6, cy = Y + 10 + (k / 3 | 0) * (B - 20) / 3 + (B - 20) / 6; if (p) { x.globalAlpha = s.big[b] ? .22 : 1; mark(p, cx, cy, 13, 3.5); x.globalAlpha = 1; } if (i === s.last) dot(x, cx + 15, cy - 15, 3, C.ink2); if (v.myTurn && i === v.hover && L.has(i)) { x.globalAlpha = .3; mark(v.me + 1, cx, cy, 13, 3.5); x.globalAlpha = 1; } }
        if (s.big[b] === 1 || s.big[b] === 2) mark(s.big[b], X + B / 2, Y + B / 2, B * .32, 9); }
      x.strokeStyle = C.ink; x.lineWidth = 4; x.lineCap = "round"; for (let k = 1; k < 3; k++) { x.beginPath(); x.moveTo(o + k * B, o + 6); x.lineTo(o + k * B, S - o - 6); x.stroke(); x.beginPath(); x.moveTo(o + 6, o + k * B); x.lineTo(S - o - 6, o + k * B); x.stroke(); } };

    D.baduk = function (x, s, v) { woodGrain(x, 0, 0, S, S, 22, BOARD, GRAIN, 13); const st = 440 / 8, P = i => [60 + (i % 9) * st, 50 + (i / 9 | 0) * st];
      x.strokeStyle = "rgba(52,32,12,.75)"; x.lineWidth = 1.3; for (let k = 0; k < 9; k++) { x.beginPath(); x.moveTo(60, 50 + k * st); x.lineTo(500, 50 + k * st); x.stroke(); x.beginPath(); x.moveTo(60 + k * st, 50); x.lineTo(60 + k * st, 490); x.stroke(); } x.lineWidth = 2; x.strokeRect(60, 50, 440, 440);
      [20, 24, 56, 60, 40].forEach(i => { const [X, Y] = P(i); dot(x, X, Y, 4, "rgba(52,32,12,.9)"); });
      const fin = s.pass >= 2 || s.n >= 220, sc = fin ? gScore(s.b) : null;
      s.b.forEach((c, i) => { if (!c) return; const [X, Y] = P(i); goStone(x, X, Y, st * .47, c === 1); });
      if (sc) sc.terr.forEach((o2, i) => { if (!o2) return; const [X, Y] = P(i); fill(x, X - 6, Y - 6, 12, 12, 2, o2 === 1 ? "#1F1D1B" : "#F3F0E8"); });
      if (s.last >= 0) { const [X, Y] = P(s.last); ring(x, X, Y, st * .18, s.b[s.last] === 1 ? "#F3F0E8" : "#1F1D1B", 2.2); }
      if (s.ko >= 0) { const [X, Y] = P(s.ko); x.strokeStyle = C.red; x.lineWidth = 2; x.strokeRect(X - 7, Y - 7, 14, 14); }
      if (v.myTurn && v.hover >= 0 && v.hover < 81 && !s.b[v.hover]) { const [X, Y] = P(v.hover); x.globalAlpha = .42; goStone(x, X, Y, st * .47, v.me === 0); x.globalAlpha = 1; }
      button(x, null, "pass", 388, 512, 150, 36, "패스", v.hover === 999 && v.myTurn ? "primary" : "plain", v.myTurn);
      if (s.passed >= 0 && s.passed !== undefined && !fin) txt(x, (s.passed === v.me ? "내가" : "상대가") + " 패스했어요", 160, 530, 14, "#4A3218", 700); };

    const octa = (x, X, Y, R) => { x.beginPath(); for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4; x.lineTo(X + Math.cos(a) * R, Y + Math.sin(a) * R); } x.closePath(); };
    D.janggi = function (x, s, v) { woodGrain(x, 0, 0, S, S, 22, "#E2BF86", "#8A5B2A", 17); const me = v.me; x.strokeStyle = "rgba(60,32,10,.78)"; x.lineWidth = 1.4;
      for (let r = 0; r < 10; r++) { const [a, y] = this.P(r * 9, 0), [b2] = this.P(r * 9 + 8, 0); x.beginPath(); x.moveTo(a, y); x.lineTo(b2, y); x.stroke(); } for (let c = 0; c < 9; c++) { const [X, y1] = this.P(c, 0), [, y2] = this.P(81 + c, 0); x.beginPath(); x.moveTo(X, y1); x.lineTo(X, y2); x.stroke(); }
      palLines.forEach(L => { const a = this.P(L[0][0] * 9 + L[0][1], 0), b2 = this.P(L[2][0] * 9 + L[2][1], 0); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b2[0], b2[1]); x.stroke(); });
      const L = v.sel >= 0 ? this.legal(s).filter(m => m[0] === v.sel).map(m => m[1]) : [];
      if (s.last) { const [X, Y] = this.P(s.last[0], me); dot(x, X, Y, 6, "rgba(152,111,28,.55)"); }
      s.b.forEach((p, i) => { if (!p) return; const [X, Y] = this.P(i, me), R = p[1] === "K" ? 27 : p[1] === "P" || p[1] === "A" ? 18 : 23, col = p[0] === "g" ? C.green : C.red;
        x.save(); x.shadowColor = "rgba(30,15,5,.38)"; x.shadowBlur = 5; x.shadowOffsetY = 3; octa(x, X, Y, R); x.fillStyle = "#F1E4C8"; x.fill(); x.restore();
        octa(x, X, Y, R); x.strokeStyle = s.last && s.last[1] === i ? C.goldD : "#8A6A45"; x.lineWidth = s.last && s.last[1] === i ? 3 : 1.5; x.stroke(); octa(x, X, Y, R * .8); x.strokeStyle = col; x.globalAlpha = .55; x.lineWidth = 1.2; x.stroke(); x.globalAlpha = 1;
        if (i === v.sel) { octa(x, X, Y, R + 4); x.strokeStyle = C.blue; x.lineWidth = 3; x.stroke(); }
        x.fillStyle = col; x.font = "900 " + Math.round(R * 1.02) + "px 'Noto Serif KR','Noto Serif CJK KR','Batang',serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(HAN[p[0]][p[1]], X, Y + 1); });
      L.forEach(i => { const [X, Y] = this.P(i, me); if (s.b[i]) ring(x, X, Y, 29, C.red, 3); else dot(x, X, Y, 7, "rgba(47,91,134,.75)"); }); };

    D.hex = function (x, s, v) { fill(x, 0, 0, S, S, 22, C.paper); tex(x, 0, 0, S, S, 22); const t0 = hC(0, 0), t1 = hC(0, HN - 1), b0 = hC(HN - 1, 0), b1 = hC(HN - 1, HN - 1), pad = HR * 1.6;
      x.lineWidth = 8; x.lineCap = "round"; x.strokeStyle = C.red; x.beginPath(); x.moveTo(t0[0] - pad * .5, t0[1] - pad); x.lineTo(t1[0] + pad * .5, t1[1] - pad); x.stroke(); x.beginPath(); x.moveTo(b0[0] - pad * .5, b0[1] + pad); x.lineTo(b1[0] + pad * .5, b1[1] + pad); x.stroke();
      x.strokeStyle = C.blue; x.beginPath(); x.moveTo(t0[0] - pad, t0[1]); x.lineTo(b0[0] - pad, b0[1]); x.stroke(); x.beginPath(); x.moveTo(t1[0] + pad, t1[1]); x.lineTo(b1[0] + pad, b1[1]); x.stroke();
      const pth = new Set(s.path || []);
      for (let i = 0; i < HN * HN; i++) { const [cx, cy] = hC(i / HN | 0, i % HN), p = s.b[i]; hex(x, cx, cy, HR - 1, p === 1 ? C.red : p === 2 ? C.blue : (v.myTurn && v.hover === i ? (v.me === 0 ? "#E5C2B9" : "#BFD0E0") : "#E3D8C5"), C.paper); if (pth.has(i)) dot(x, cx, cy, 4.5, "#F0D58A"); if (i === s.last) ring(x, cx, cy, 6, C.cream, 2); } };

    D.quoridor = function (x, s, v) { woodGrain(x, 0, 0, S, S, 22, C.walnut, "#1E120A", 21); const { o, cs } = this.g(), me = v.me, P = i => { const [r, c] = this.fl(i / QN | 0, i % QN, me); return [o + c * cs, o + r * cs]; };
      const L = v.myTurn ? qPawn(s) : [];
      for (let i = 0; i < 81; i++) { const [X, Y] = P(i), r = i / QN | 0; fill(x, X + 4, Y + 4, cs - 8, cs - 8, 5, r === 0 ? "#86745F" : r === 8 ? "#94634A" : "#8C6844"); if (L.includes(i)) dot(x, X + cs / 2, Y + cs / 2, 7, "rgba(251,247,239,.6)"); }
      tex(x, o, o, cs * 9, cs * 9, 4);
      const wall = (w, a) => { let [r, c, ori] = w; if (me === 1) { r = 7 - r; c = 7 - c; } x.save(); x.globalAlpha = a; x.shadowColor = "rgba(0,0,0,.35)"; x.shadowOffsetY = 2; x.shadowBlur = 3; if (ori === "h") fill(x, o + c * cs + 3, o + (r + 1) * cs - 4, cs * 2 - 6, 8, 3, "#E3C48F"); else fill(x, o + (c + 1) * cs - 4, o + r * cs + 3, 8, cs * 2 - 6, 3, "#E3C48F"); x.restore(); };
      s.W.forEach(w => wall(w, 1));
      if (v.myTurn && typeof v.hover === "string") { const m = JSON.parse(v.hover); if (m.w && qWallOk(s, m.w)) wall(m.w, .5); }
      [0, 1].forEach(p => { const [X, Y] = P(s.pos[p]); token(x, X + cs / 2, Y + cs / 2, cs * .32, p === 0 ? C.blue : C.red, p === 0 ? C.blueD : C.redD); });
      txt(x, me === 0 ? "↑ 위쪽 끝줄이 목표" : "↓ 아래쪽 끝줄이 목표", S / 2, me === 0 ? 17 : S - 15, 12, "rgba(251,247,239,.6)", 700); };

    const fruitArt = (x, f, X, Y, r) => { x.save(); x.translate(X, Y);
      if (f === 0) { x.rotate(-.5); x.beginPath(); x.arc(0, -r * .35, r, .35, Math.PI - .35); x.arc(0, -r * 1.05, r * 1.05, Math.PI - .55, .55, true); x.closePath(); x.fillStyle = "#E8C23A"; x.fill(); x.strokeStyle = "#A9861E"; x.lineWidth = 1.2; x.stroke(); dot(x, r * .9, r * .02, r * .1, "#5B4320"); dot(x, -r * .9, r * .02, r * .1, "#5B4320"); }
      else if (f === 1) { x.beginPath(); x.moveTo(0, r); x.bezierCurveTo(-r * 1.15, r * .1, -r * .85, -r * .8, 0, -r * .5); x.bezierCurveTo(r * .85, -r * .8, r * 1.15, r * .1, 0, r); x.fillStyle = "#C8452F"; x.fill(); [[-.35, -.15], [0, -.22], [.35, -.15], [-.18, .2], [.18, .2], [0, .52]].forEach(([a, b]) => dot(x, a * r, b * r, r * .06, "#F2D48A")); x.fillStyle = "#4E7A34"; for (let k = -1; k <= 1; k++) { x.beginPath(); x.ellipse(k * r * .26, -r * .6, r * .28, r * .1, k * .5, 0, 7); x.fill(); } }
      else if (f === 2) { dot(x, 0, 0, r * .92, "#7DA43B"); dot(x, -r * .3, -r * .3, r * .22, "rgba(255,255,255,.18)"); x.strokeStyle = "#5B4320"; x.lineWidth = r * .12; x.lineCap = "round"; x.beginPath(); x.moveTo(0, -r * .7); x.lineTo(r * .1, -r * 1.05); x.stroke(); x.fillStyle = "#4E7A34"; x.beginPath(); x.ellipse(r * .35, -r * .9, r * .3, r * .12, -.4, 0, 7); x.fill(); }
      else if (f === 3) { const pts = [[-.42, -.4], [0, -.45], [.42, -.4], [-.22, 0], [.22, 0], [0, .4]]; pts.forEach(([a, b]) => dot(x, a * r, b * r, r * .32, "#6E4D8C")); pts.forEach(([a, b]) => dot(x, a * r - r * .1, b * r - r * .1, r * .08, "rgba(255,255,255,.25)")); x.fillStyle = "#4E7A34"; x.beginPath(); x.ellipse(r * .2, -r * .92, r * .32, r * .12, .3, 0, 7); x.fill(); }
      else { dot(x, 0, 0, r * .92, "#E08A2C"); for (let k = 0; k < 7; k++) dot(x, Math.cos(k * 2.3) * r * .5, Math.sin(k * 1.7) * r * .5, 1.2, "rgba(255,255,255,.3)"); dot(x, 0, -r * .78, r * .1, "#5B4320"); x.fillStyle = "#4E7A34"; x.beginPath(); x.ellipse(r * .3, -r * .88, r * .3, r * .11, .4, 0, 7); x.fill(); }
      x.restore(); };
    const hgCard2 = (x, c, X, Y, w, h, rot) => { x.save(); x.translate(X + w / 2, Y + h / 2); x.rotate(rot || 0); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 10; x.shadowOffsetY = 4; fill(x, -w / 2, -h / 2, w, h, 10, C.cream); x.restore(); x.save(); x.translate(X + w / 2, Y + h / 2); x.rotate(rot || 0); stroke(x, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 7, C.edge, 1.2); HPIP[c.n].forEach(([a, b]) => fruitArt(x, c.f, -w / 2 + a * w, -h / 2 + b * h, c.n === 1 ? w * .28 : c.n === 2 ? w * .2 : w * .15)); x.restore(); };
    const hgBack2 = (x, X, Y, w, h, n) => { for (let k = Math.min(3, n) - 1; k >= 0; k--) { x.save(); x.shadowColor = "rgba(0,0,0,.3)"; x.shadowBlur = 6; x.shadowOffsetY = 3; fill(x, X + k * 3, Y + k * 3, w, h, 10, k ? "#1E2C3E" : C.navy); x.restore(); } if (!n) return; stroke(x, X + 7, Y + 7, w - 14, h - 14, 7, "rgba(251,247,239,.5)", 1.2); stroke(x, X + 11, Y + 11, w - 22, h - 22, 5, "rgba(251,247,239,.22)", 1); txt(x, "할리", X + w / 2, Y + h / 2 - 11, 17, C.cream, 800); txt(x, "갈리", X + w / 2, Y + h / 2 + 11, 17, "#E3B65A", 800); };
    D.halligalli = function (x, s, v) { const me = v.me, op = 1 - me, W2 = 116, H2 = 160; table(x, C.felt);
      const slot = (X, Y) => { x.save(); x.setLineDash([6, 6]); stroke(x, X, Y, W2, H2, 10, "rgba(251,247,239,.25)", 1.5); x.restore(); };
      hgBack2(x, 60, 30, W2, H2, s.d[op].length); txt(x, "상대 " + s.d[op].length + "장", 118, 208, 13, "rgba(251,247,239,.8)", 700);
      const ui = v.ui || {}, hnow = Date.now(), L0 = s.pile[0].length, L1 = s.pile[1].length;
      if (!ui.hgL) ui.hgL = [L0, L1]; [0, 1].forEach(p => { const L = p ? L1 : L0; if (L > ui.hgL[p]) { ui.hgA = ui.hgA || {}; ui.hgA[p] = hnow; } }); ui.hgL = [L0, L1];
      const slide = p => { const t0 = ui.hgA && ui.hgA[p]; if (!t0 || !window.Phys) return 1; const k = (hnow - t0) / 240; if (k < 1) ui.animUntil = hnow + 60; return Phys.ease(k); };
      const hgDraw = (card, p, Y) => { const k = slide(p); if (k >= 1) return hgCard2(x, card, 200, Y, W2, H2, s.rots[p]); const X = 60 + (200 - 60) * k; x.save(); const cx = X + W2 / 2, sx = Math.abs(Math.cos(Math.PI * (1 - k))); x.translate(cx, Y + H2 / 2 - Math.sin(Math.PI * k) * 18); x.scale(Math.max(.05, sx), 1); x.translate(-cx, -(Y + H2 / 2)); if (k < .5) hgBack2(x, X, Y, W2, H2, 1); else hgCard2(x, card, X, Y, W2, H2, s.rots[p] * k); x.restore(); };
      const ot = s.pile[op][s.pile[op].length - 1]; if (ot) hgDraw(ot, op, 30); else slot(200, 30);
      hgBack2(x, 60, 368, W2, H2, s.d[me].length); txt(x, "내 카드 " + s.d[me].length + "장", 118, 546, 13, "rgba(251,247,239,.8)", 700);
      if (v.myTurn) { stroke(x, 54, 362, W2 + 14, H2 + 14, 13, v.hover === 2 ? "#E3B65A" : "rgba(227,182,90,.6)", 3); txt(x, "눌러서 뒤집기", 118, 350, 13, "#E3B65A", 700); }
      const mt = s.pile[me][s.pile[me].length - 1]; if (mt) hgDraw(mt, me, 368); else slot(200, 368);
      txt(x, "바닥 " + (s.pile[0].length + s.pile[1].length) + "장", 258, 280, 14, "rgba(251,247,239,.75)", 700);
      const BX = 440, BY = 280, hov = v.hover === 1, bell = K.img("https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/1f6ce.svg");
      if (bell) { const sz = 170, dy = hov ? 3 : 0;
        x.save(); x.fillStyle = "rgba(0,0,0,.28)"; x.beginPath(); x.ellipse(BX, BY + 50, 84, 15, 0, 0, 7); x.fill(); x.fillStyle = "rgba(0,0,0,.18)"; x.beginPath(); x.ellipse(BX, BY + 50, 96, 20, 0, 0, 7); x.fill(); x.restore();
        x.save(); x.translate(BX, BY + 52); x.scale(1, hov ? .97 : 1); x.drawImage(bell, -sz / 2, -sz * .86 + dy, sz, sz); x.restore();
        if (hov) { x.save(); x.strokeStyle = "rgba(251,247,239,.55)"; x.lineWidth = 2.5; x.lineCap = "round"; [[-70, -70, -86, -86], [70, -70, 86, -86], [0, -98, 0, -116]].forEach(([a1, b1, a2, b2]) => { x.beginPath(); x.moveTo(BX + a1, BY + b1); x.lineTo(BX + a2, BY + b2); x.stroke(); }); x.restore(); }
      } else {
      x.save(); x.shadowColor = "rgba(0,0,0,.5)"; x.shadowBlur = 18; x.shadowOffsetY = 10; x.fillStyle = "#1E1915"; x.beginPath(); x.ellipse(BX, BY + 44, 80, 25, 0, 0, 7); x.fill(); x.restore();
      x.fillStyle = "#2E2621"; x.beginPath(); x.ellipse(BX, BY + 38, 78, 22, 0, 0, 7); x.fill(); x.fillStyle = "#3D332C"; x.beginPath(); x.ellipse(BX, BY + 35, 74, 19, 0, 0, 7); x.fill();
      const dy = hov ? 2 : 0, chrome = (x0, x1) => { const g = x.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, "#6F757C"); g.addColorStop(.22, "#C9CED3"); g.addColorStop(.36, "#F7F8F9"); g.addColorStop(.55, "#AEB4BA"); g.addColorStop(.85, "#7E848B"); g.addColorStop(1, "#5D6268"); return g; };
      x.fillStyle = chrome(BX - 62, BX + 62); x.beginPath(); x.moveTo(BX - 62, BY + 32 + dy); x.bezierCurveTo(BX - 62, BY - 52 + dy, BX + 62, BY - 52 + dy, BX + 62, BY + 32 + dy); x.ellipse(BX, BY + 32 + dy, 62, 10, 0, 0, Math.PI); x.fill();
      x.fillStyle = "#8C9298"; x.beginPath(); x.ellipse(BX, BY + 32 + dy, 62, 10, 0, 0, Math.PI); x.ellipse(BX, BY + 30 + dy, 62, 8, 0, Math.PI, 0, true); x.fill();
      x.save(); x.globalAlpha = .75; x.strokeStyle = "#FFFFFF"; x.lineWidth = 5; x.lineCap = "round"; x.beginPath(); x.moveTo(BX - 34, BY + 18 + dy); x.bezierCurveTo(BX - 38, BY - 14 + dy, BX - 22, BY - 30 + dy, BX - 6, BY - 34 + dy); x.stroke(); x.restore();
      x.fillStyle = chrome(BX - 6, BX + 6); x.fillRect(BX - 5, BY - 54 + dy * 2, 10, 18);
      x.fillStyle = chrome(BX - 15, BX + 15); x.beginPath(); x.ellipse(BX, BY - 55 + dy * 2, 15, 6, 0, 0, 7); x.fill(); x.strokeStyle = "rgba(0,0,0,.25)"; x.lineWidth = 1; x.stroke();
      }
      txt(x, "스페이스로 종 치기", BX, BY + 80, 12, "rgba(251,247,239,.7)", 700);
      if (s.msg) { const [who, t] = s.msg.split("|"); pill(x, (+who === me ? "내가 " : "상대가 ") + t.split("!")[0] + "!", 435, 156, s.ok ? C.gold : C.red, C.cream, 14); } };

    const RC2 = ["#2A2520", "#B5402E", "#2F5B86", "#C2741A"];
    const rkTile2 = (x, id, X, Y, w, h, sel) => { const t = RT(id); if (sel) Y -= 8; x.save(); x.shadowColor = "rgba(0,0,0,.3)"; x.shadowBlur = 3; x.shadowOffsetY = 2; fill(x, X, Y, w, h, 5, "#F6F0E2"); x.restore(); x.fillStyle = "rgba(0,0,0,.07)"; x.fillRect(X + 2, Y + h - 4, w - 4, 2);
      if (sel) stroke(x, X - 1.5, Y - 1.5, w + 3, h + 3, 6, C.blue, 3);
      if (t.j) txt(x, "★", X + w / 2, Y + h * .45, w * .55, id === 104 ? C.red : C.ink, 900); else { txt(x, t.n, X + w / 2, Y + h * .42, w * .56, RC2[t.c], 800); dot(x, X + w / 2, Y + h * .77, w * .06, RC2[t.c]); } };
    D.rummikub = function (x, s, v) { const u = this.ui(s, v); u.hits = []; table(x, C.felt);
      txt(x, "상대 손패 " + s.hand[1 - v.me].length + "장 · 남은 타일 " + s.pool.length, 20, 22, 13, "rgba(251,247,239,.75)", 700, "left");
      if (s.msg) { const [w2, t] = s.msg.split("|"); txt(x, (+w2 === v.me ? "나: " : "상대: ") + t, S - 20, 22, 13, "#E3B65A", 700, "right"); }
      const TW = 26, TH = 36; let cx = 16, cy = 40; const board = v.myTurn ? u.board : s.board;
      board.forEach((st, si) => { const wSet = st.length * (TW + 2) + (v.myTurn ? 22 : 0); if (cx + wSet > S - 12) { cx = 16; cy += TH + 18; } fill(x, cx - 4, cy - 4, wSet + 6, TH + 8, 8, rkSet(st) ? "rgba(0,0,0,.16)" : "rgba(181,64,46,.5)");
        st.forEach((id, k) => { rkTile2(x, id, cx + k * (TW + 2), cy, TW, TH, u.sel.includes(id)); u.hits.push({ id: "t:" + id, X: cx + k * (TW + 2), Y: cy, w: TW, h: TH }); });
        if (v.myTurn) { const px = cx + st.length * (TW + 2); fill(x, px + 1, cy + 6, 18, TH - 12, 5, u.sel.length ? C.gold : "rgba(255,255,255,.14)"); txt(x, "+", px + 10, cy + TH / 2, 15, u.sel.length ? C.cream : "rgba(255,255,255,.5)", 800); u.hits.push({ id: "plus:" + si, X: px, Y: cy, w: 20, h: TH }); }
        cx += wSet + 14; });
      if (!board.length) txt(x, "아직 바닥에 조합이 없어요", S / 2, 180, 15, "rgba(251,247,239,.5)", 700);
      const rack = rkSort(v.myTurn ? u.hand : s.hand[v.me], u.sort || "color"), RW = 32, RH = 44; x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 8; x.shadowOffsetY = 3; fill(x, 8, 380, S - 16, 118, 12, "#B88A55"); x.restore(); woodGrain(x, 8, 380, S - 16, 118, 12, "#B88A55", "#6E4A22", 4); fill(x, 8, 380, S - 16, 6, 3, "rgba(255,255,255,.18)"); u.hits.push({ id: "rack", X: 8, Y: 380, w: S - 16, h: 118 });
      rack.forEach((id, k) => { const X = 16 + (k % 16) * (RW + 1.5), Y = 392 + Math.floor(k / 16) * (RH + 8); rkTile2(x, id, X, Y, RW, RH, u.sel.includes(id)); u.hits.push({ id: "t:" + id, X, Y, w: RW, h: RH }); });
      const on = v.myTurn, changed = on && u.hand.length < s.hand[v.me].length;
      button(x, u, "new", 10, 510, 128, 40, "새 조합 (" + u.sel.length + ")", "gold", on && u.sel.length > 0); button(x, u, "undo", 146, 510, 100, 40, "되돌리기", "plain", on); button(x, u, "sort", 254, 510, 100, 40, u.sort === "num" ? "색깔순" : "숫자순", "plain", true);
      button(x, u, "done", 362, 510, 188, 40, on ? (changed ? "완료" : "1장 뽑고 넘기기") : "상대 차례", changed ? "blue" : "primary", on);
      if (u.err && on) pill(x, u.err, S / 2, 348, C.red, C.cream, 14);
      if (!s.open[v.me] && on) txt(x, "첫 등록은 내 타일만으로 30점 이상", S / 2, 372, 12, "rgba(251,247,239,.65)", 700); };

    const dvTile2 = (x, X, Y, w, h, c, num, open, sel, mine) => { x.save(); x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 6; x.shadowOffsetY = 3; fill(x, X, Y, w, h, 7, c === 0 ? "#22201E" : "#F1ECE2"); x.restore(); fill(x, X, Y + h - 5, w, 5, 2, c === 0 ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.08)");
      if (num != null) txt(x, num, X + w / 2, Y + h / 2, w * .52, c === 0 ? C.cream : C.ink, 800); else stroke(x, X + 6, Y + 6, w - 12, h - 12, 4, c === 0 ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.12)", 1.5);
      if (open) { fill(x, X + w / 2 - 15, Y + h + 5, 30, 15, 7.5, C.red); txt(x, mine ? "공개" : "정답", X + w / 2, Y + h + 12.5, 9, C.cream, 800); }
      if (sel) stroke(x, X - 3, Y - 3, w + 6, h + 6, 9, "#E3B65A", 3.5); };
    D.davinci = function (x, s, v) { const u = v.ui; u.hits = []; if (u.n !== s.n) { u.n = s.n; if (u.pick != null && s.h[1 - v.me][u.pick] && s.h[1 - v.me][u.pick].open) u.pick = null; } table(x, C.navy);
      const me = v.me, op = 1 - me, oh = s.h[op], mh = s.h[me], tw = Math.min(46, (S - 40) / Math.max(oh.length, mh.length, 1) - 6), th = tw * 1.45;
      txt(x, "상대의 코드", S / 2, 26, 13, "rgba(251,247,239,.6)", 700);
      const ox = S / 2 - (oh.length * (tw + 6) - 6) / 2; oh.forEach((o2, i) => { const X = ox + i * (tw + 6); dvTile2(x, X, 44, tw, th, DV(o2.id).c, o2.open ? DV(o2.id).n : null, o2.open, u.pick === i, false); if (!o2.open) u.hits.push({ id: "o:" + i, X, Y: 44, w: tw, h: th }); });
      const my0 = S - th - 46, mx = S / 2 - (mh.length * (tw + 6) - 6) / 2; txt(x, "나의 코드", S / 2, my0 - 16, 13, "rgba(251,247,239,.6)", 700); mh.forEach((o2, i) => dvTile2(x, mx + i * (tw + 6), my0, tw, th, DV(o2.id).c, DV(o2.id).n, o2.open, false, true));
      if (s.pend != null) { const mine = s.t === me; txt(x, mine ? "뽑은 타일" : "상대가 뽑은 타일", 70, 222, 12, "rgba(251,247,239,.6)", 700); dvTile2(x, 44, 236, 52, 76, DV(s.pend).c, mine ? DV(s.pend).n : null, false, false, true); }
      if (v.myTurn && u.pick != null) { txt(x, "이 타일의 숫자는?", S / 2 + 30, 214, 15, "#E3B65A", 800); for (let n = 0; n < 12; n++) button(x, u, "n:" + n, 140 + (n % 6) * 58, 232 + Math.floor(n / 6) * 54, 50, 46, String(n), "plain", true, 18); }
      else if (v.myTurn) txt(x, s.streak ? "맞혔어요. 더 도전하거나 멈추세요" : "상대 타일 하나를 고르세요", S / 2 + 30, 270, 16, "#E3B65A", 800);
      else txt(x, "상대가 추리하는 중", S / 2 + 30, 270, 16, "rgba(251,247,239,.6)", 700);
      if (v.myTurn && s.streak > 0) button(x, u, "stop", S - 150, 330, 130, 40, "멈추기", "blue", true);
      if (s.msg) { const [w2, t] = s.msg.split("|"); pill(x, (+w2 === me ? "나: " : "상대: ") + t, S - 105, 177, t.includes("정답") ? C.green : t.includes("땡") ? C.red : "rgba(255,255,255,.18)", C.cream); } };

    const ingArt = (x, k, X, Y, r) => { x.save(); x.translate(X, Y); x.shadowColor = "rgba(0,0,0,.22)"; x.shadowBlur = 3; x.shadowOffsetY = 2;
      if (k === 0) { fill(x, -r, -r * .75, r * 2, r * 1.5, r * .35, "#8A4B2A"); x.shadowColor = "transparent"; x.strokeStyle = "#5C2F18"; x.lineWidth = 2.5; x.lineCap = "round"; for (let q = -1; q <= 1; q++) { x.beginPath(); x.moveTo(-r * .6 + q * r * .45, -r * .5); x.lineTo(-r * .2 + q * r * .45, r * .5); x.stroke(); } }
      else if (k === 1) { fill(x, -r * .22, 0, r * .44, r * .95, 3, "#A7C27A"); x.shadowColor = "transparent"; [[-.45, -.25], [.45, -.25], [0, -.55], [0, -.05]].forEach(([a, b]) => dot(x, a * r, b * r, r * .45, "#4E7A34")); }
      else if (k === 2) { x.beginPath(); x.arc(0, 0, r, Math.PI, 0); x.closePath(); x.fillStyle = "#A87A4C"; x.fill(); x.shadowColor = "transparent"; fill(x, -r * .3, 0, r * .6, r * .85, 4, "#EFE3CC"); dot(x, -r * .4, -r * .45, r * .12, "#EFE3CC"); dot(x, r * .3, -r * .6, r * .1, "#EFE3CC"); }
      else if (k === 3) { x.lineWidth = r * .6; x.strokeStyle = "#E07B39"; x.lineCap = "round"; x.beginPath(); x.arc(0, 0, r * .68, -.2, Math.PI + .8); x.stroke(); x.shadowColor = "transparent"; x.strokeStyle = "rgba(255,240,220,.6)"; x.lineWidth = 1.5; for (let q = 0; q < 4; q++) { const a = .2 + q * .85; x.beginPath(); x.moveTo(Math.cos(a) * r * .4, Math.sin(a) * r * .4); x.lineTo(Math.cos(a) * r * .96, Math.sin(a) * r * .96); x.stroke(); } }
      else if (k === 4) { fill(x, -r * .85, -r * .65, r * 1.7, r * 1.45, r * .45, "#C8452F"); x.shadowColor = "transparent"; fill(x, -r * .1, -r * .95, r * .2, r * .35, 2, "#4E7A34"); fill(x, -r * .55, -r * .4, r * .22, r * .8, 3, "rgba(255,255,255,.2)"); }
      else { x.beginPath(); x.ellipse(0, 0, r * .95, r * .8, 0, 0, 7); x.fillStyle = "#9B6A9E"; x.fill(); x.shadowColor = "transparent"; x.strokeStyle = "rgba(255,255,255,.45)"; x.lineWidth = 1.5; for (let q = 1; q <= 2; q++) { x.beginPath(); x.ellipse(0, 0, r * .95 * q / 3, r * .8 * q / 3, 0, 0, 7); x.stroke(); } }
      x.restore(); };
    const stick = (x, X, Y, len, seq, r, mark) => { x.strokeStyle = "#C9A26B"; x.lineWidth = 5; x.lineCap = "round"; x.beginPath(); x.moveTo(X - 18, Y); x.lineTo(X + len + 18, Y); x.stroke(); dot(x, X + len + 22, Y, 4, "#9C7A45"); const st = len / Math.max(1, seq.length); seq.forEach((k, i) => { ingArt(x, k, X + st * i + st / 2, Y, r); if (mark && mark[i]) ring(x, X + st * i + st / 2, Y, r + 6, mark[i], 2.5); }); };
    D.kebab = function (x, s, v) { const u = v.ui; u.hits = []; if (u.r !== s.round) { u.r = s.round; u.seq = []; } fill(x, 0, 0, S, S, 22, "#EBE1CF"); tex(x, 0, 0, S, S, 22);
      const t = kbTarget(s.seed, s.round); sheet(x, 20, 18, S - 40, 150, 14, C.cream); txt(x, "주문서 " + (s.round + 1) + "번", 44, 42, 14, C.mute, 700, "left"); if (t.rev) pill(x, "거꾸로 끼우기", S - 96, 42, C.red, C.cream);
      stick(x, 60, 108, S - 150, t.seq, 22);
      txt(x, "내 꼬치", 44, 206, 14, C.mute, 700, "left"); fill(x, 20, 220, S - 40, 110, 14, Date.now() - (u.bad || 0) < 400 ? "#F2D6CF" : "rgba(255,255,255,.45)");
      const want = this.want(s), seq = u.seq || []; stick(x, 60, 275, S - 150, seq, 22, seq.map(() => C.green));
      for (let i = seq.length; i < want.length; i++) { const st = (S - 150) / want.length; x.save(); x.setLineDash([4, 4]); ring(x, 60 + st * i + st / 2, 275, 20, "rgba(42,37,32,.2)", 2); x.restore(); }
      ING.forEach(([nm], k) => { const X = 20 + (k % 3) * 176, Y = 350 + Math.floor(k / 3) * 92; sheet(x, X, Y, 168, 84, 12, C.cream); ingArt(x, k, X + 44, Y + 42, 22); txt(x, nm, X + 112, Y + 36, 16, C.ink, 800); txt(x, k + 1, X + 112, Y + 58, 12, C.mute, 700); u.hits.push({ id: "i:" + k, X, Y, w: 168, h: 84 }); });
      button(x, u, "back", S - 116, 230, 84, 32, "빼기", "plain", true, 13);
      if (s.msg) { const [w2, m] = s.msg.split("|"); pill(x, (+w2 === v.me ? "내가 " : "상대가 ") + m, S / 2, 191, +w2 === v.me ? C.green : C.red, C.cream); } };

    D.neon4 = function (x, s, v) { woodGrain(x, 0, 0, S, S, 22, BOARD, GRAIN, 23); for (let i = 0; i < 25; i++) { const X = 50 + (i % 5) * 92, Y = 50 + (i / 5 | 0) * 92, p = s.b[i]; fill(x, X + 6, Y + 6, 80, 80, 12, "rgba(70,40,15,.14)"); stroke(x, X + 6.5, Y + 6.5, 79, 79, 12, "rgba(70,40,15,.18)", 1); if (p) goStone(x, X + 46, Y + 46, 31, p === 1); else if (v.myTurn && v.hover === i) { x.globalAlpha = .4; goStone(x, X + 46, Y + 46, 31, v.me === 0); x.globalAlpha = 1; } if (i === s.last && p) ring(x, X + 46, Y + 46, 10, p === 1 ? "#F3F0E8" : "#1F1D1B", 2.2); }
      if (s.win) s.win.line.forEach(i => ring(x, 96 + (i % 5) * 92, 96 + (i / 5 | 0) * 92, 37, C.red, 3)); };

    D.race21 = function (x, s, v) { fill(x, 0, 0, S, S, 22, C.paper); tex(x, 0, 0, S, S, 22); txt(x, "21 레이스", S / 2, 50, 26, C.ink, 900); txt(x, "한 번에 1~3칸 · 21에 먼저 도착하면 승리", S / 2, 86, 14, C.mute, 700);
      for (let i = 1; i <= 21; i++) { const X = 33 + (i - 1) % 7 * 72, Y = 128 + ((i - 1) / 7 | 0) * 72, past = i <= s.pos; if (past) fill(x, X, Y, 61, 61, 10, C.gold); else sheet(x, X, Y, 61, 61, 10, C.cream); if (i === 21 && !past) stroke(x, X + 1, Y + 1, 59, 59, 9, C.red, 2); txt(x, i, X + 30, Y + 31, 22, past ? C.cream : i === 21 ? C.red : C.ink2, 800); if (i === s.pos) { token(x, X + 48, Y + 13, 9, C.ink, "#000"); } }
      for (let m = 1; m <= 3; m++) { const X = 60 + (m - 1) * 150, on = s.pos + m <= 21, hov = v.myTurn && v.hover === m; x.save(); if (!on) x.globalAlpha = .35; x.shadowColor = "rgba(0,0,0,.2)"; x.shadowOffsetY = 3; fill(x, X, 390, 130, 105, 14, hov ? C.ink : C.cream); x.restore(); x.save(); if (!on) x.globalAlpha = .35; if (!hov) stroke(x, X + .5, 390.5, 129, 104, 14, C.edge, 1); txt(x, "+" + m, X + 65, 442, 36, hov ? C.cream : C.ink, 900); x.restore(); }
      txt(x, "지금 " + s.pos + "칸 · 남은 거리 " + (21 - s.pos), S / 2, 530, 15, C.ink2, 700); };

    const GEM = ["", "#8FB3C9", "#4F937D", "#D2A94A", "#B85555", "#7D62A8"];
    const gem = (x, X, Y, r, c) => { const pts = [[-.6, -.55], [.6, -.55], [1, -.1], [0, .95], [-1, -.1]]; x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 5; x.shadowOffsetY = 3; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(X + a * r, Y + b * r) : x.moveTo(X + a * r, Y + b * r)); x.closePath(); x.fillStyle = c; x.fill(); x.restore();
      x.beginPath(); x.moveTo(X - .6 * r, Y - .55 * r); x.lineTo(X + .6 * r, Y - .55 * r); x.lineTo(X + r, Y - .1 * r); x.lineTo(X - r, Y - .1 * r); x.closePath(); x.fillStyle = "rgba(255,255,255,.28)"; x.fill();
      x.beginPath(); x.moveTo(X, Y + .95 * r); x.lineTo(X + r, Y - .1 * r); x.lineTo(X + .25 * r, Y - .1 * r); x.closePath(); x.fillStyle = "rgba(0,0,0,.16)"; x.fill();
      x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 1; x.beginPath(); x.moveTo(X - .25 * r, Y - .1 * r); x.lineTo(X, Y + .95 * r); x.lineTo(X + .25 * r, Y - .1 * r); x.stroke(); };
    D.gemdraft = function (x, s, v) { table(x, "#22303F"); for (let i = 0; i < 25; i++) { const X = 50 + (i % 5) * 92, Y = 68 + (i / 5 | 0) * 92, n = s.g[i]; fill(x, X, Y, 84, 84, 12, "#2E4155"); stroke(x, X + .5, Y + .5, 83, 83, 12, "rgba(0,0,0,.3)", 1); if (n > 0) { gem(x, X + 42, Y + 36, 24, GEM[n]); txt(x, n + "점", X + 42, Y + 71, 12, "rgba(251,247,239,.85)", 800); } else dot(x, X + 42, Y + 42, 3, "rgba(255,255,255,.18)"); if (i === s.last) ring(x, X + 42, Y + 42, 6, "rgba(227,182,90,.7)", 2); if (v.myTurn && v.hover === i && n > 0) stroke(x, X + 2, Y + 2, 80, 80, 11, "#E3B65A", 3); }
      txt(x, "청록 " + s.score[0] + "점 · 보라 " + s.score[1] + "점", S / 2, 32, 15, "rgba(251,247,239,.85)", 700); };

    G.forEach(g => { if (D[g.id]) g.draw = D[g.id]; });
    const SIDE = { connect4: ["#B5402E", "#D9A63A"], checkers: ["#B5402E", "#2B2826"], dots: ["#2F5B86", "#B5402E"], ultimate: ["#2F5B86", "#B5402E"], hex: ["#B5402E", "#2F5B86"], quoridor: ["#2F5B86", "#B5402E"], halligalli: ["#2F5B86", "#B5402E"], rummikub: ["#2F5B86", "#B5402E"], davinci: ["#2F5B86", "#B5402E"], kebab: ["#2F5B86", "#B5402E"], neon4: ["#1F1D1B", "#F3F0E8"], gemdraft: ["#3F8F86", "#7D62A8"], race21: ["#C9952E", "#2F5B86"], janggi: ["#2F6B4F", "#B5402E"] };
    G.forEach(g => { if (SIDE[g.id]) g.sideColor = SIDE[g.id]; });
    const n4 = G.find(g => g.id === "neon4"); if (n4) Object.assign(n4, { name: "미니 4목", tag: "속전속결", color: "#9C7142", sides: ["흑", "백"], desc: "5×5 판에서 가로·세로·대각선으로 네 칸을 먼저 이으면 승리. 짧고 치열한 대국." });
    return K;
  })();

  window.BG = { S, GAMES: G, TURN: 60, art: ART_ };
})();
