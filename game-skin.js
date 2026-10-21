// 보드게임 썸네일 · 미리보기 렌더러 — 각 게임의 실제 판 그림으로 썸네일을 만든다
(function () {
  const BG = window.BG;
  if (!BG || BG.thumb) return;
  const S = BG.S;
  const rng = seed => { let n = seed | 0 || 1; return () => ((n = (Math.imul(n, 1664525) + 1013904223) | 0) >>> 0) / 4294967296; };
  const STEPS = { omok: 11, chess: 8, othello: 12, connect4: 11, checkers: 10, dots: 18, ultimate: 12, baduk: 14, janggi: 8, hex: 16, quoridor: 6, halligalli: 6, rummikub: 4, davinci: 4, kebab: 6, neon4: 9, race21: 5, gemdraft: 9, marbles: 0, blackjack: 3, memory: 6, mines: 9, bingo: 9, yut: 14, marble: 9, battleship: 14, mancala: 7, indian: 2, baseball: 0, chicken: 7, cucaracha: 3, pool: 1 };
  const cache = {};
  function midState(g) {
    let s; try { s = g.init(1234567); } catch (e) { return null; }
    const r = rng(g.id.length * 977 + 31), n = STEPS[g.id] ?? 6;
    for (let k = 0; k < n; k++) {
      try {
        if (g.result && g.result(s)) break;
        const L = (g.legal && g.legal(s)) || []; if (!L.length) break;
        const m = L[Math.floor(r() * L.length)], next = g.apply(s, m);
        if (!next || (g.result && g.result(next))) break; s = next;
      } catch (e) { break; }
    }
    if (g.id === "baseball" && s) { try { s = g.apply(g.apply(g.apply(s, "123"), "456"), "785"); } catch (e) {} }
    return s;
  }
  function boardCanvas(id, size) {
    const g = BG.GAMES.find(x => x.id === id); if (!g) return null;
    const c = document.createElement("canvas"); c.width = c.height = size;
    const x = c.getContext("2d"); x.setTransform(size / S, 0, 0, size / S, 0, 0);
    const s = midState(g) || g.init(1);
    try { g.draw(x, s, { me: 0, sel: -1, hover: -1, myTurn: false, ui: {} }); } catch (e) { console.warn("draw", id, e); }
    return c;
  }
  function preview(id, size = 560) { const c = boardCanvas(id, size); return c ? c.toDataURL("image/png") : ""; }
  const hex = h => { h = (h || "#3182F6").replace("#", ""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const mix = (a, b, t) => "rgb(" + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",") + ")";
  function thumb(id) {
    if (cache[id]) return cache[id];
    const g = BG.GAMES.find(x => x.id === id); if (!g) return "";
    const W = 720, H = 534, c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"), F = "'Pretendard Variable',Pretendard,sans-serif";
    x.fillStyle = mix(hex(g.color), [42, 37, 32], .42); x.fillRect(0, 0, W, H);
    if (BG.art) BG.art.tex(x, 0, 0, W, H, 0);
    const b = boardCanvas(id, 720), bs = 400, cx = W * .66, cy = H * .57;
    x.save(); x.translate(cx, cy); x.rotate(-0.06);
    x.shadowColor = "rgba(0,0,0,.42)"; x.shadowBlur = 30; x.shadowOffsetY = 18;
    x.fillStyle = "#000"; x.beginPath(); x.roundRect(-bs / 2, -bs / 2, bs, bs, 20); x.fill();
    x.shadowColor = "transparent"; x.beginPath(); x.roundRect(-bs / 2, -bs / 2, bs, bs, 20); x.clip();
    b && x.drawImage(b, -bs / 2, -bs / 2, bs, bs);
    x.restore();
    x.fillStyle = "#FBF7EF"; x.textBaseline = "top"; x.textAlign = "left";
    const words = g.name.split(" "), lines = words.length > 1 && g.name.length > 4 ? [words.slice(0, -1).join(" "), words[words.length - 1]] : [g.name];
    let fs = 72; const fit = () => { x.font = "900 " + fs + "px " + F; return Math.max(...lines.map(l => x.measureText(l).width)); };
    while (fit() > 230 && fs > 40) fs -= 2;
    lines.forEach((l, i) => x.fillText(l, 34, 34 + i * fs * 1.08));
    x.fillStyle = "rgba(251,247,239,.72)"; x.font = "700 26px " + F; x.fillText(g.tag, 36, 50 + lines.length * fs * 1.08);
    const url = c.toDataURL("image/jpeg", .88); if (!BG.art || !BG.art.pending()) cache[id] = url; return url;
  }
  if (BG.art) setTimeout(() => { const t = setInterval(() => { if (!BG.art.pending()) { clearInterval(t); window.dispatchEvent(new Event("bg-assets")); } }, 300); }, 0);
  BG.thumb = thumb; BG.preview = preview; BG.midState = midState;
})();
