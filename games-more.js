// 추가 보드게임: 치킨 차차차 · 라쿠카라차
(function () {
  const BG = window.BG;
  if (!BG || BG.moreLoaded || !BG.art) return;
  const K = BG.art, C = K.C, S = BG.S, G = BG.GAMES;
  const { fill, stroke, dot, ring, txt, tex, table, sheet, token, button, pill, hitUI } = K;
  const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const P2 = [C.red, C.blue], P2D = [C.redD, C.blueD];
  const say = (me, t) => me + "|" + t;

  // ================= 치킨 차차차 =================
  // 그림 12종 = 모양 3 × 색 4. 트랙 24칸에 각 그림이 두 번, 가운데 뒤집힌 타일 12장에 한 번씩.
  const MC = [C.red, C.blue, C.gold, C.green];
  const motif = (x, m, X, Y, r) => { const c = MC[Math.floor(m / 3)], sh = m % 3; x.fillStyle = c; x.beginPath();
    if (sh === 0) x.arc(X, Y, r, 0, Math.PI * 2);
    else if (sh === 1) { x.moveTo(X, Y - r * 1.05); x.lineTo(X + r * 1.05, Y + r * .8); x.lineTo(X - r * 1.05, Y + r * .8); x.closePath(); }
    else { x.moveTo(X, Y - r * 1.15); x.lineTo(X + r * 1.05, Y); x.lineTo(X, Y + r * 1.15); x.lineTo(X - r * 1.05, Y); x.closePath(); }
    x.fill(); };
  const CX = 280, CY = 256, TR = 214;
  const tPos = i => { const a = -Math.PI / 2 + i * Math.PI * 2 / 24; return [CX + Math.cos(a) * TR, CY + Math.sin(a) * TR]; };
  const cPos = k => [CX + ((k % 4) - 1.5) * 66, CY + (Math.floor(k / 4) - 1) * 70];
  const octa = (x, X, Y, r) => { x.beginPath(); for (let q = 0; q < 8; q++) { const a = Math.PI / 8 + q * Math.PI / 4; q ? x.lineTo(X + Math.cos(a) * r, Y + Math.sin(a) * r) : x.moveTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); } x.closePath(); };
  const chicken = (x, X, Y, p, fe, glow) => {
    if (glow) { x.save(); x.globalAlpha = .35; dot(x, X, Y, 26, P2[p]); x.restore(); }
    dot(x, X - 4, Y - 16, 5, "#D9342B"); dot(x, X + 3, Y - 17, 5, "#D9342B");
    token(x, X, Y, 17, P2[p], P2D[p]);
    x.fillStyle = "#F2A93B"; x.beginPath(); x.moveTo(X + 13, Y - 3); x.lineTo(X + 23, Y + 1); x.lineTo(X + 13, Y + 5); x.closePath(); x.fill();
    dot(x, X + 6, Y - 5, 2.6, C.cream); dot(x, X + 6.6, Y - 5, 1.3, C.ink);
    dot(x, X - 15, Y - 13, 9, C.cream); ring(x, X - 15, Y - 13, 9, C.ink, 1.5); txt(x, fe, X - 15, Y - 12, 11, C.ink, 900);
  };
  G.push({ id: "chicken", name: "치킨 차차차", tag: "기억력", color: "#C9952E", sides: ["빨강 닭", "파랑 닭"], sideColor: [C.red, C.blue], turnSec: 25,
    desc: "가운데 타일을 뒤집어 내 닭 바로 앞 칸과 같은 그림이면 한 칸 전진하고 계속, 틀리면 차례가 넘어가요. 상대 닭 바로 뒤에서 그 다음 칸 그림을 맞히면 추월해서 꼬리 깃털을 모두 빼앗고 승리!",
    keys: "가운데 타일 클릭",
    init(seed) { const r = K.rnd(seed || 1); r(); const base = [...Array(12).keys()]; return { track: shuffle(base.concat(base), r), center: shuffle(base, r), pos: [0, 12], fe: [1, 1], t: 0, up: [], miss: -1, n: 0, msg: "", win: null }; },
    turn: s => s.t,
    target(s, me) { const op = 1 - me, ahead = (s.pos[me] + 1) % 24, over = ahead === s.pos[op]; return { to: over ? (ahead + 1) % 24 : ahead, over }; },
    legal(s) { if (s.win != null) return []; const M = []; for (let k = 0; k < 12; k++) if (!s.up.includes(k)) M.push({ a: "flip", k }); return M; },
    apply(s, m) { if (!m || m.a !== "flip" || s.win != null || !(m.k >= 0 && m.k < 12) || s.up.includes(m.k)) return s;
      const me = s.t, op = 1 - me, { to, over } = this.target(s, me), ns = Object.assign({}, s, { pos: s.pos.slice(), fe: s.fe.slice(), up: s.up.slice(), n: s.n + 1, miss: -1 });
      if (s.center[m.k] !== s.track[to]) { ns.miss = m.k; ns.up = []; ns.t = op; ns.msg = say(me, "꽝! 타일을 모두 덮어요"); return ns; }
      ns.pos[me] = to; ns.up.push(m.k);
      if (over) { ns.fe[me] += ns.fe[op]; ns.fe[op] = 0; ns.msg = say(me, "추월! 깃털을 빼앗았어요"); if (!ns.fe[op]) ns.win = me; return ns; }
      if (ns.up.length >= 12) ns.up = [];
      ns.msg = say(me, "딩동! 한 칸 전진 · 계속"); return ns; },
    result: s => s.win != null ? { w: s.win, why: "꼬리 깃털 모두 획득" } : s.n >= 400 ? { w: -1, why: "수 제한" } : null,
    near(X, Y) { for (let k = 0; k < 12; k++) { const [cx, cy] = cPos(k); if (Math.hypot(X - cx, Y - cy) < 31) return k; } return -1; },
    hit(s, X, Y, v) { if (!v.myTurn) return null; const k = this.near(X, Y); return k >= 0 && !s.up.includes(k) ? { move: { a: "flip", k } } : null; },
    hover(s, X, Y) { return this.near(X, Y); },
    draw(x, s, v) { const me = v.me, op = 1 - me; table(x, "#5E7F45");
      x.save(); x.globalAlpha = .18; ring(x, CX, CY, TR, C.cream, 54); x.restore();
      const nx = s.win == null ? this.target(s, s.t).to : -1;
      for (let i = 0; i < 24; i++) { const [X, Y] = tPos(i); x.save(); x.shadowColor = "rgba(0,0,0,.3)"; x.shadowBlur = 5; x.shadowOffsetY = 2; x.beginPath(); x.ellipse(X, Y, 23, 26, 0, 0, Math.PI * 2); x.fillStyle = C.cream; x.fill(); x.restore(); motif(x, s.track[i], X, Y + 1, 10);
        if (i === nx) { x.save(); x.setLineDash([4, 3]); x.beginPath(); x.ellipse(X, Y, 28, 31, 0, 0, Math.PI * 2); x.strokeStyle = P2[s.t]; x.lineWidth = 3; x.stroke(); x.restore(); } }
      for (let k = 0; k < 12; k++) { const [X, Y] = cPos(k), open = s.up.includes(k) || s.miss === k, hov = v.myTurn && v.hover === k && !open;
        x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 8; x.shadowOffsetY = 3; octa(x, X, Y - (hov ? 3 : 0), 29); x.fillStyle = open ? C.cream : "#7A5232"; x.fill(); x.restore();
        if (open) { motif(x, s.center[k], X, Y, 13); if (s.miss === k) { octa(x, X, Y, 29); x.strokeStyle = C.red; x.lineWidth = 3; x.stroke(); } }
        else { octa(x, X, Y - (hov ? 3 : 0), 22); x.strokeStyle = "rgba(251,247,239,.35)"; x.lineWidth = 1.5; x.stroke(); txt(x, "?", X, Y + 1 - (hov ? 3 : 0), 18, "rgba(251,247,239,.75)", 900); } }
      [op, me].forEach(p => { const [X, Y] = tPos(s.pos[p]); chicken(x, X, Y, p, s.fe[p], s.t === p && s.win == null); });
      const tip = s.win != null ? "" : v.myTurn ? "점선 칸과 같은 그림을 찾아 뒤집으세요" : "상대가 타일을 고르는 중";
      if (s.msg) { const [w2, t] = s.msg.split("|"); pill(x, (+w2 === me ? "나: " : "상대: ") + t, CX, 516, t.includes("꽝") ? "rgba(0,0,0,.35)" : C.ink, C.cream, 14); }
      if (tip) txt(x, tip, CX, 546, 12, "rgba(251,247,239,.75)", 700); },
    extra: s => s.fe.map(f => "깃털 " + f + "개")
  });

  // ================= 라쿠카라차 =================
  // 5×5 부엌 미로. 칸 사이 벽은 고정벽 + 색깔 회전벽(ㄱ자) 4개. 차례마다 회전벽 하나를 90° 돌리면 바퀴벌레가 가운데에서 출발해 마구 달려요.
  // 바퀴벌레가 내 색 덫(모서리)에 빠지면 1마리 포획. 5마리를 먼저 잡으면 승리.
  const N = 5, CS = 72, OX = 100, OY = 34, GOAL = 5;
  const ROT = [[1, 1], [4, 1], [1, 4], [4, 4]], RC = [C.red, C.blue, C.gold, C.green], RN = ["빨강", "파랑", "노랑", "초록"];
  const TRAP = { "h0,0": 0, "h4,0": 1, "h4,5": 0, "h0,5": 1 };
  const FIXED = new Set(["v1,2", "v4,2", "h2,1", "h1,4", "h3,4", "v2,3", "v3,3"]);
  const edge = (c, r, d) => d === 0 ? "h" + c + "," + r : d === 2 ? "h" + c + "," + (r + 1) : d === 3 ? "v" + c + "," + r : "v" + (c + 1) + "," + r;
  const arms = (i, o) => { const [vx, vy] = ROT[i], A = ["v" + vx + "," + (vy - 1), "h" + vx + "," + vy, "v" + vx + "," + vy, "h" + (vx - 1) + "," + vy]; return [A[o], A[(o + 1) % 4]]; };
  const armSet = rot => { const w = new Set(); rot.forEach((o, i) => arms(i, o).forEach(e => w.add(e))); return w; };
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const cell = (c, r) => [OX + c * CS + CS / 2, OY + r * CS + CS / 2];
  function run(rot, rnd) {
    const W = armSet(rot); let c = 2, r = 2, d = Math.floor(rnd() * 4), moves = 0; const path = [[c, r]];
    for (let it = 0; it < 400 && moves < 110; it++) {
      if (rnd() < .12) { d = (d + (rnd() < .5 ? 1 : 3)) % 4; continue; }
      const e = edge(c, r, d);
      if (e in TRAP) { const [X, Y] = cell(c, r); path.push([c + DX[d] * .75, r + DY[d] * .75]); return { path, got: TRAP[e], X, Y }; }
      const bound = (e[0] === "h" && (e.endsWith(",0") || e.endsWith("," + N))) || (e[0] === "v" && (e.startsWith("v0,") || e.startsWith("v" + N + ",")));
      if (bound || FIXED.has(e) || W.has(e)) { const q = rnd(); d = (d + (q < .45 ? 3 : q < .9 ? 1 : 2)) % 4; continue; }
      c += DX[d]; r += DY[d]; moves++; path.push([c, r]);
    }
    return { path, got: -1 };
  }
  const line = (x, e, col, lw) => { const k = e[0], [a, b] = e.slice(1).split(",").map(Number); x.strokeStyle = col; x.lineWidth = lw; x.lineCap = "round"; x.beginPath(); if (k === "h") { x.moveTo(OX + a * CS + 3, OY + b * CS); x.lineTo(OX + (a + 1) * CS - 3, OY + b * CS); } else { x.moveTo(OX + a * CS, OY + b * CS + 3); x.lineTo(OX + a * CS, OY + (b + 1) * CS - 3); } x.stroke(); };
  const roach = (x, X, Y, ang) => { x.save(); x.translate(X, Y); x.rotate(ang); x.strokeStyle = "#2A1A0E"; x.lineWidth = 1.6; x.lineCap = "round";
    for (const s of [-1, 1]) for (const k of [-6, 0, 6]) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 3, s * 11); x.stroke(); }
    x.beginPath(); x.moveTo(13, -2); x.quadraticCurveTo(20, -8, 25, -12); x.moveTo(13, 2); x.quadraticCurveTo(20, 8, 25, 12); x.stroke();
    x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 5; x.shadowOffsetY = 2; x.beginPath(); x.ellipse(0, 0, 13, 8, 0, 0, Math.PI * 2); x.fillStyle = "#6B3E1E"; x.fill(); x.shadowColor = "transparent";
    x.beginPath(); x.ellipse(11, 0, 5, 5, 0, 0, Math.PI * 2); x.fillStyle = "#3D2412"; x.fill(); x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 1; x.beginPath(); x.moveTo(-12, 0); x.lineTo(7, 0); x.stroke(); x.restore(); };
  const STEP = 38, ROT_MS = 320, CHOV = { x: -1, y: -1 }, RCD = [C.redD, C.blueD, C.goldD, C.greenD];
  const seg3 = (x, X1, Y1, X2, Y2, top, side, lw) => { x.save(); x.lineCap = "round"; x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 6; x.shadowOffsetX = 2; x.shadowOffsetY = 4; x.strokeStyle = side; x.lineWidth = lw; x.beginPath(); x.moveTo(X1, Y1 + 2); x.lineTo(X2, Y2 + 2); x.stroke(); x.restore();
    x.save(); x.lineCap = "round"; x.strokeStyle = top; x.lineWidth = lw - 2; x.beginPath(); x.moveTo(X1, Y1 - 1); x.lineTo(X2, Y2 - 1); x.stroke(); x.strokeStyle = "rgba(255,255,255,.3)"; x.lineWidth = 1.5; const hz = Math.abs(Y2 - Y1) < Math.abs(X2 - X1); x.beginPath(); x.moveTo(X1 - (hz ? 0 : lw / 4), Y1 - 1 - (hz ? lw / 4 : 0)); x.lineTo(X2 - (hz ? 0 : lw / 4), Y2 - 1 - (hz ? lw / 4 : 0)); x.stroke(); x.restore(); };
  const edgeXY = e => { const [a, b] = e.slice(1).split(",").map(Number), X = OX + a * CS, Y = OY + b * CS; return e[0] === "h" ? [X, Y, X + CS, Y] : [X, Y, X, Y + CS]; };
  let cuBgC = null;
  const cuBg = () => { if (cuBgC) return cuBgC; const c = document.createElement("canvas"); c.width = c.height = 1120; const x = c.getContext("2d"); x.setTransform(2, 0, 0, 2, 0, 0);
    fill(x, 0, 0, S, S, 22, "#3A2A1E"); tex(x, 0, 0, S, S, 22);
    x.save(); x.shadowColor = "rgba(0,0,0,.55)"; x.shadowBlur = 22; x.shadowOffsetY = 10; fill(x, OX - 16, OY - 16, N * CS + 32, N * CS + 32, 16, "#2A1C12"); x.restore();
    fill(x, OX - 2, OY - 2, N * CS + 4, N * CS + 4, 4, "#BFAE90");
    for (let r = 0; r < N; r++) for (let c2 = 0; c2 < N; c2++) { const X = OX + c2 * CS + 1.5, Y = OY + r * CS + 1.5; fill(x, X, Y, CS - 3, CS - 3, 7, (r + c2) % 2 ? "#ECE1CB" : "#F8F2E5"); const g = x.createLinearGradient(X, Y, X + CS, Y + CS); g.addColorStop(0, "rgba(255,255,255,.45)"); g.addColorStop(.5, "rgba(255,255,255,0)"); fill(x, X, Y, CS - 3, CS - 3, 7, g); }
    tex(x, OX, OY, N * CS, N * CS, 0);
    Object.keys(TRAP).forEach(e => { const p = TRAP[e], [a, b] = e.slice(1).split(",").map(Number), top = b === 0, X = OX + a * CS + CS / 2, Y = OY + b * CS + (top ? -8 : 8), W2 = 60, H2 = 34, bx = X - W2 / 2, by = Y - H2 / 2;
      x.save(); x.shadowColor = "rgba(0,0,0,.5)"; x.shadowBlur = 10; x.shadowOffsetY = 5; fill(x, bx, by + 3, W2, H2, 9, P2D[p]); x.restore();
      const bgd = x.createLinearGradient(0, by, 0, by + H2); bgd.addColorStop(0, p ? "#5C8BBF" : "#D9604B"); bgd.addColorStop(1, P2[p]); fill(x, bx, by, W2, H2, 9, bgd);
      fill(x, bx + 3, by + 2, W2 - 6, 4, 3, "rgba(255,255,255,.35)");
      const oy = top ? by + H2 - 14 : by + 2, og = x.createLinearGradient(0, oy, 0, oy + 12); og.addColorStop(top ? 1 : 0, "#000"); og.addColorStop(top ? 0 : 1, "#3A2418"); fill(x, bx + 8, oy, W2 - 16, 12, 5, og);
      x.strokeStyle = "rgba(255,255,255,.18)"; x.lineWidth = 1; for (let k = 0; k < 3; k++) { const yy = top ? by + 8 + k * 4 : by + H2 - 8 - k * 4; x.beginPath(); x.moveTo(bx + 10, yy); x.lineTo(bx + W2 - 10, yy); x.stroke(); }
      txt(x, "덫", X, top ? by + 11 : by + H2 - 11, 10, "rgba(255,255,255,.85)", 900); });
    for (let a = 0; a < N; a++) ["h" + a + ",0", "h" + a + "," + N, "v0," + a, "v" + N + "," + a].forEach(e => { if (e in TRAP) return; const [X1, Y1, X2, Y2] = edgeXY(e); seg3(x, X1, Y1, X2, Y2, "#7A5232", "#4A3020", 10); });
    FIXED.forEach(e => { const [X1, Y1, X2, Y2] = edgeXY(e); seg3(x, X1, Y1, X2, Y2, "#4F453C", "#26201B", 9); });
    return (cuBgC = c); };
  const cuRotorAt = (X, Y) => { for (let i = 0; i < 4; i++) { const [vx, vy] = ROT[i]; if (Math.hypot(X - (OX + vx * CS), Y - (OY + vy * CS)) < 26) return i; } return -1; };
  const cuRotor = (x, X, Y, deg, i, hot, now) => { [deg, deg + 90].forEach(g => { const r = g * Math.PI / 180; seg3(x, X, Y, X + Math.cos(r) * CS, Y + Math.sin(r) * CS, RC[i], RCD[i], 10); });
    if (hot) { x.save(); x.globalAlpha = .5 + Math.sin(now / 160) * .25; ring(x, X, Y, 20, C.cream, 3); x.restore(); }
    x.save(); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 6; x.shadowOffsetY = 3; dot(x, X, Y, 13, RCD[i]); x.restore(); dot(x, X, Y - 1, 12, RC[i]); ring(x, X, Y - 1, 12, C.cream, 2); txt(x, "↻", X, Y, 13, "#fff", 900); };
  const cuRoach = (x, X, Y, ang, moving, now, sc) => { x.save(); x.translate(X, Y); x.rotate(ang); x.scale(sc * 1.05, sc * 1.05); x.lineCap = "round"; x.lineJoin = "round";
    x.save(); x.globalAlpha = .3; x.beginPath(); x.ellipse(-1, 3, 17, 9, 0, 0, Math.PI * 2); x.fillStyle = "#000"; x.fill(); x.restore();
    x.strokeStyle = "#3B1E0C"; x.lineWidth = 1.6;
    [[6, 1.2, -.5], [0, 1, 0], [-7, 1.25, .45]].forEach(([k, len, bend], q) => [-1, 1].forEach(sd => { const w = moving ? Math.sin(now / 32 + q * 2.1 + (sd > 0 ? Math.PI : 0)) * .35 : 0, a1 = sd * (Math.PI / 2 - .35 + bend * .6 + w), kx = k + Math.cos(a1) * 8 * len, ky = Math.sin(a1) * 8 * len, a2 = a1 - sd * (.9 + bend * .4), fx = kx + Math.cos(a2) * 9 * len, fy = ky + Math.sin(a2) * 9 * len;
      x.beginPath(); x.moveTo(k, sd * 3.5); x.lineTo(kx, ky); x.lineTo(fx, fy); x.stroke(); dot(x, kx, ky, .9, "#3B1E0C"); }));
    x.strokeStyle = "#5A2E12"; x.lineWidth = 1; const aw = moving ? Math.sin(now / 80) * 2.5 : Math.sin(now / 700) * 1.2;
    [-1, 1].forEach(sd => { x.beginPath(); x.moveTo(15, sd * 2); x.bezierCurveTo(24, sd * (4 + aw), 30, sd * (12 - aw), 36, sd * (20 + aw)); x.stroke(); x.beginPath(); x.moveTo(-15, sd * 2); x.lineTo(-21, sd * (5 + aw * .3)); x.stroke(); });
    const bg = x.createLinearGradient(0, -8, 0, 8); bg.addColorStop(0, "#A2582A"); bg.addColorStop(.45, "#7A3C18"); bg.addColorStop(1, "#4A220C");
    x.beginPath(); x.moveTo(-16, 0); x.bezierCurveTo(-16, -8, 2, -9, 8, -6.5); x.lineTo(8, 6.5); x.bezierCurveTo(2, 9, -16, 8, -16, 0); x.closePath(); x.fillStyle = bg; x.fill();
    x.strokeStyle = "rgba(30,12,4,.55)"; x.lineWidth = 1; x.beginPath(); x.moveTo(-15, 0); x.lineTo(7, 0); x.stroke();
    x.beginPath(); x.moveTo(-14, -1); x.bezierCurveTo(-10, -6, 0, -7, 6, -5); x.strokeStyle = "rgba(255,210,160,.35)"; x.lineWidth = 1.4; x.stroke();
    const pg = x.createRadialGradient(10, -2, 1, 11, 0, 8); pg.addColorStop(0, "#C08048"); pg.addColorStop(1, "#5E2E10"); x.beginPath(); x.ellipse(11, 0, 6.5, 7.5, 0, 0, Math.PI * 2); x.fillStyle = pg; x.fill();
    x.beginPath(); x.ellipse(11, 0, 3.8, 4.6, 0, 0, Math.PI * 2); x.fillStyle = "rgba(40,16,4,.55)"; x.fill();
    x.beginPath(); x.ellipse(15.5, 0, 2.6, 3.4, 0, 0, Math.PI * 2); x.fillStyle = "#2A1206"; x.fill(); dot(x, 16, -2, .9, "#E8D2B0"); dot(x, 16, 2, .9, "#E8D2B0");
    x.restore(); };
  G.push({ id: "cucaracha", aimHover: true, name: "라쿠카라차", tag: "운·전략", color: "#8A5A2B", sides: ["빨강 덫", "파랑 덫"], sideColor: [C.red, C.blue], turnSec: 30,
    desc: "부엌 미로의 색깔 회전벽 하나를 돌리면 바퀴벌레가 가운데에서 출발해 마구 달려요. 내 색 덫(모서리)으로 길을 열고 상대 덫은 막으세요. 바퀴벌레 5마리를 먼저 잡으면 승리.",
    keys: "회전벽 클릭(시계 방향) · 아래 ↺ ↻ 버튼",
    init(seed) { const r = K.rnd(seed || 1); r(); return { seed: seed || 1, rot: ROT.map(() => Math.floor(r() * 4)), sc: [0, 0], t: 0, n: 0, path: null, got: -1, msg: "", win: null }; },
    turn: s => s.t,
    legal(s) { if (s.win != null) return []; const M = []; for (let i = 0; i < 4; i++) M.push({ r: i, d: 1 }, { r: i, d: -1 }); return M; },
    apply(s, m) { if (!m || s.win != null || !(m.r >= 0 && m.r < 4) || (m.d !== 1 && m.d !== -1)) return s;
      const me = s.t, op = 1 - me, rot = s.rot.slice(); rot[m.r] = (rot[m.r] + (m.d > 0 ? 1 : 3)) % 4;
      const rnd = K.rnd((s.seed || 7) * 131 + s.n * 7919 + 5); rnd(); const res = run(rot, rnd), sc = s.sc.slice();
      if (res.got >= 0) sc[res.got]++;
      const who = res.got < 0 ? "바퀴벌레가 숨어버렸어요" : (res.got === me ? "내 덫에 쏙!" : "상대 덫에 빠졌어요");
      return { seed: s.seed, rot, sc, t: op, n: s.n + 1, path: res.path, got: res.got, msg: say(me, RN[m.r] + " 벽 " + (m.d > 0 ? "↻" : "↺") + " · " + who), win: sc[res.got] >= GOAL ? res.got : null }; },
    result: s => s.win != null ? { w: s.win, why: "바퀴벌레 " + GOAL + "마리 포획" } : s.n >= 120 ? { w: s.sc[0] === s.sc[1] ? -1 : s.sc[0] > s.sc[1] ? 0 : 1, why: "포획 " + s.sc[0] + " : " + s.sc[1] } : null,
    hit(s, X, Y, v) { if (!v.myTurn) return null; const id = hitUI(v.ui, X, Y); if (!id) return null; const [, i, d] = id.split(":"); return { move: { r: +i, d: +d } }; },
    hover(s, X, Y) { CHOV.x = X; CHOV.y = Y; return Math.round(X / 4) * 1000 + Math.round(Y / 4); },
    draw(x, s, v) { const u = v.ui || {}, me = v.me, op = 1 - me, now = Date.now(); u.hits = [];
      if (u.lcN == null) { u.lcN = s.n; u.lcS = 0; u.rotFrom = s.rot.slice(); u.rotTo = s.rot.slice(); }
      else if (u.lcN !== s.n) { u.lcN = s.n; u.lcS = now; u.rotFrom = (u.rotTo || s.rot).slice(); u.rotTo = s.rot.slice(); u.capFx = 0; }
      const P = s.path || [], rotT = u.lcS ? Math.min(1, (now - u.lcS) / ROT_MS) : 1, eT = 1 - Math.pow(1 - rotT, 3);
      const el = u.lcS ? now - u.lcS - ROT_MS : 1e9, f = Math.max(0, Math.min(Math.max(0, P.length - 1), el / STEP)), running = !!u.lcS && P.length > 1 && f < P.length - 1, anim = !!u.lcS && (rotT < 1 || running);
      const done = u.lcS ? el - (P.length - 1) * STEP : 1e9;
      if (anim || done < 1500) u.animUntil = now + 60;
      x.drawImage(cuBg(), 0, 0, S, S);
      if (P.length > 1) { x.save(); x.globalAlpha = .22; x.strokeStyle = "#6B3E1E"; x.lineWidth = 3; x.setLineDash([2, 7]); x.lineCap = "round"; x.beginPath(); const lim = Math.floor(f); for (let k = 0; k <= lim; k++) { const [X, Y] = cell(P[k][0], P[k][1]); k ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke(); x.restore(); }
      const can = v.myTurn && !anim && s.win == null, hovR = can ? cuRotorAt(CHOV.x, CHOV.y) : -1;
      s.rot.forEach((o, i) => { const [vx, vy] = ROT[i], X = OX + vx * CS, Y = OY + vy * CS, from = u.rotFrom ? u.rotFrom[i] : o; let deg = (o - 1) * 90;
        if (from !== o && rotT < 1) { const d = ((o - from + 4) % 4) === 1 ? 90 : -90; deg = (from - 1) * 90 + d * eT; }
        if (hovR === i) { x.save(); x.globalAlpha = .38; x.setLineDash([6, 6]); [deg + 90, deg + 180].forEach(g => { const r = g * Math.PI / 180; x.strokeStyle = RC[i]; x.lineWidth = 6; x.lineCap = "round"; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(r) * CS, Y + Math.sin(r) * CS); x.stroke(); }); x.restore(); }
        cuRotor(x, X, Y, deg, i, hovR === i, now);
        if (can) u.hits.push({ id: "r:" + i + ":1", X: X - 24, Y: Y - 24, w: 48, h: 48 }); });
      let rx, ry, ang = -Math.PI / 2, sc = 1, moving = running;
      if (P.length) { const k = Math.floor(f), t = f - k, A2 = P[k], B2 = P[Math.min(P.length - 1, k + 1)], [X1, Y1] = cell(A2[0], A2[1]), [X2, Y2] = cell(B2[0], B2[1]); rx = X1 + (X2 - X1) * t; ry = Y1 + (Y2 - Y1) * t;
        ang = k + 1 < P.length ? Math.atan2(Y2 - Y1, X2 - X1) : (u.lcAng == null ? -Math.PI / 2 : u.lcAng); u.lcAng = ang;
        if (!running && s.got >= 0 && P.length > 1) sc = done < 0 ? 1 : Math.max(0, 1 - done / 380); }
      else [rx, ry] = cell(2, 2);
      if (sc > 0) cuRoach(x, rx, ry, ang, moving, now, sc);
      if (!running && P.length > 1 && done >= 0 && done < 1500 && u.lcS) { const fx = done / 1500, L = P[P.length - 1], [X, Y] = cell(L[0], L[1]);
        if (!u.capFx) { u.capFx = 1; try { WJ.sfx(s.got < 0 ? "flip" : s.got === me ? "coin" : "lose"); } catch (e) {} }
        if (s.got >= 0) { x.save(); x.globalAlpha = 1 - fx; ring(x, X, Y, 12 + fx * 40, P2[s.got], 4); x.restore(); }
        x.save(); x.globalAlpha = Math.min(1, (1 - fx) * 2.5); const lab = s.got < 0 ? "숨어버렸다…" : s.got === me ? "내 덫에 쏙! +1" : "상대 덫에 쏙!"; pill(x, lab, Math.min(400, Math.max(160, X)), Math.max(60, Y - 30 - fx * 18), s.got < 0 ? "rgba(0,0,0,.55)" : P2[s.got], C.cream, 14); x.restore(); }
      [[me, 46, "나"], [op, 514, "상대"]].forEach(([p, X, lab]) => { const on = s.t === p && s.win == null;
        fill(x, X - 38, 70, 76, 270, 16, on ? "rgba(251,247,239,.12)" : "rgba(0,0,0,.2)"); if (on) stroke(x, X - 37.5, 70.5, 75, 269, 16, P2[p], 2);
        txt(x, lab, X, 92, 13, C.cream, 800); txt(x, s.sc[p], X, 124, 30, P2[p] === C.red ? "#FF9A8A" : "#8FC0EE", 900); txt(x, "/ " + GOAL + "마리", X, 150, 11, "rgba(251,247,239,.6)", 700);
        for (let q = 0; q < GOAL; q++) { x.save(); x.globalAlpha = q < s.sc[p] ? 1 : .2; cuRoach(x, X - 4, 186 + q * 32, -Math.PI / 2, false, 0, .78); x.restore(); } });
      for (let i = 0; i < 4; i++) { const X = 26 + i * 130, on = can;
        dot(x, X + 8, 432, 6, RC[i]); txt(x, RN[i] + " 벽", X + 20, 432, 12, C.cream, 700, "left");
        [[-1, "↺", X], [1, "↻", X + 62]].forEach(([d, g, bx]) => { x.save(); if (on) { x.shadowColor = "rgba(0,0,0,.3)"; x.shadowOffsetY = 3; } fill(x, bx, 448, 56, 42, 12, on ? RC[i] : "rgba(255,255,255,.08)"); x.restore(); if (on) fill(x, bx + 2, 450, 52, 6, 4, "rgba(255,255,255,.22)"); txt(x, g, bx + 28, 470, 20, on ? "#fff" : "rgba(251,247,239,.35)", 900); if (on) u.hits.push({ id: "r:" + i + ":" + d, X: bx, Y: 448, w: 56, h: 42 }); }); }
      if (s.msg && !anim && !(done >= 0 && done < 1500)) { const [w2, t] = s.msg.split("|"); pill(x, (+w2 === me ? "나: " : "상대: ") + t, S / 2, 518, s.got < 0 ? "rgba(0,0,0,.35)" : P2[s.got], C.cream, 13); }
      else if (running) pill(x, "바퀴벌레가 달리는 중…", S / 2, 518, "rgba(0,0,0,.35)", C.cream, 13);
      txt(x, s.win != null ? "" : can ? (hovR >= 0 ? RN[hovR] + " 벽을 시계 방향으로 돌려요 · 점선이 바뀔 위치" : "회전벽 가운데를 누르거나 아래 버튼으로 돌리세요") : "상대 차례", S / 2, 548, 12, "rgba(251,247,239,.7)", 700); },
    extra: s => s.sc.map(c => "포획 " + c + " / " + GOAL)
  });

  // ================= 포켓볼 (8볼) =================
  // 결정적 물리(+ − × ÷ √만 사용)라 모든 기기에서 같은 결과. 수는 {조준 방향, 세기}만 저장한다.
  const PX0 = 150, PX1 = 410, PY0 = 40, PY1 = 520, PCX = (PX0 + PX1) / 2, PMID = (PY0 + PY1) / 2, BR = 10, BD = BR * 2;
  const FOOT = [PCX, PY0 + 120], HEAD = [PCX, PY1 - 120];
  const POCK = [[PX0 - 4, PY0 - 4, 17], [PX1 + 4, PY0 - 4, 17], [PX0 - 8, PMID, 15], [PX1 + 8, PMID, 15], [PX0 - 4, PY1 + 4, 17], [PX1 + 4, PY1 + 4, 17]];
  const BCOL = ["#F7F3EA", "#F2C230", "#2156C9", "#D33A2C", "#6B3FA0", "#F08A24", "#1F8A4C", "#8E2B2B", "#151515"];
  const bcol = id => BCOL[id > 8 ? id - 8 : id];
  const btype = id => id === 0 ? -1 : id === 8 ? 8 : id < 8 ? 0 : 1;
  const GN = ["단색", "줄무늬"];
  const pocketAt = (x, y) => {
    if (x - PX0 + (y - PY0) < 34 && x < PX0 + 26 && y < PY0 + 26) return 0;
    if (PX1 - x + (y - PY0) < 34 && x > PX1 - 26 && y < PY0 + 26) return 1;
    if (x - PX0 + (PY1 - y) < 34 && x < PX0 + 26 && y > PY1 - 26) return 4;
    if (PX1 - x + (PY1 - y) < 34 && x > PX1 - 26 && y > PY1 - 26) return 5;
    if (x < PX0 + BR + 0.5 && y > PMID - 14 && y < PMID + 14) return 2;
    if (x > PX1 - BR - 0.5 && y > PMID - 14 && y < PMID + 14) return 3;
    return -1;
  };
  function poolSim(b0, dx, dy, p) {
    const B = b0.map(o => ({ x: o[0], y: o[1], vx: 0, vy: 0, on: !!o[2], f: 0, px: 0, py: 0 })), L = Math.sqrt(dx * dx + dy * dy), sp = 2 + p * 0.27;
    B[0].vx = dx / L * sp; B[0].vy = dy / L * sp;
    const frames = [], pots = [], n = B.length, SUB = 4; let first = null, rails = 0;
    const snap = () => { const f = new Array(n * 3); for (let k = 0; k < n; k++) { const o = B[k]; f[k * 3] = o.x; f[k * 3 + 1] = o.y; f[k * 3 + 2] = o.on ? 1 : o.f > 0 ? o.f / 10 : 0; } frames.push(f); };
    snap();
    for (let tick = 0; tick < 1500; tick++) {
      let moving = false;
      for (let s = 0; s < SUB; s++) {
        for (let k = 0; k < n; k++) { const o = B[k]; if (!o.on) continue; o.x += o.vx / SUB; o.y += o.vy / SUB;
          const pk = pocketAt(o.x, o.y); if (pk >= 0) { o.on = false; o.f = 10; o.px = POCK[pk][0]; o.py = POCK[pk][1]; o.vx = o.vy = 0; pots.push(k); continue; }
          if (o.x < PX0 + BR) { o.x = 2 * (PX0 + BR) - o.x; o.vx = -o.vx * 0.78; rails++; } else if (o.x > PX1 - BR) { o.x = 2 * (PX1 - BR) - o.x; o.vx = -o.vx * 0.78; rails++; }
          if (o.y < PY0 + BR) { o.y = 2 * (PY0 + BR) - o.y; o.vy = -o.vy * 0.78; rails++; } else if (o.y > PY1 - BR) { o.y = 2 * (PY1 - BR) - o.y; o.vy = -o.vy * 0.78; rails++; } }
        for (let i = 0; i < n; i++) { const a = B[i]; if (!a.on) continue;
          for (let j = i + 1; j < n; j++) { const c = B[j]; if (!c.on) continue; const ddx = c.x - a.x, ddy = c.y - a.y, d2 = ddx * ddx + ddy * ddy; if (d2 >= BD * BD || d2 === 0) continue;
            const d = Math.sqrt(d2), nx = ddx / d, ny = ddy / d, push = (BD - d) / 2; a.x -= nx * push; a.y -= ny * push; c.x += nx * push; c.y += ny * push;
            const rel = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny; if (rel > 0) { const jj = rel * 1.95 / 2; a.vx -= jj * nx; a.vy -= jj * ny; c.vx += jj * nx; c.vy += jj * ny; if (first === null && i === 0) first = j; } } }
      }
      for (let k = 0; k < n; k++) { const o = B[k];
        if (o.f > 0) { o.x += (o.px - o.x) * 0.3; o.y += (o.py - o.y) * 0.3; o.f--; moving = true; continue; }
        if (!o.on) continue; const s2 = o.vx * o.vx + o.vy * o.vy; if (s2 === 0) continue;
        const v = Math.sqrt(s2), nv = v * (1 - 0.018) - 0.03; if (nv <= 0.03) { o.vx = o.vy = 0; continue; } o.vx *= nv / v; o.vy *= nv / v; moving = true; }
      snap(); if (!moving) break;
    }
    const r2 = v => Math.round(v * 100) / 100;
    return { b: B.map(o => [r2(o.x), r2(o.y), o.on ? 1 : 0]), frames, pots, first, rails };
  }
  const freeSpot = (b, x, y, skip) => b.every((o, k) => k === skip || !o[2] || (o[0] - x) * (o[0] - x) + (o[1] - y) * (o[1] - y) >= BD * BD);
  const inTable = (x, y) => x >= PX0 + BR && x <= PX1 - BR && y >= PY0 + BR && y <= PY1 - BR;
  const poolLeft = (s, p) => s.grp[p] == null ? 7 : s.b.filter((o, k) => o[2] && btype(k) === s.grp[p]).length;
  const HOV = { x: PCX, y: PY0 + 60 };
  const drawBall = (x, id, X, Y, r, a) => { if (a <= 0) return; x.save(); x.globalAlpha = Math.min(1, a * 1.4); if (a < 1) { x.translate(X, Y); x.scale(.55 + a * .45, .55 + a * .45); x.translate(-X, -Y); }
    x.beginPath(); x.ellipse(X + 2, Y + 3, r, r * .9, 0, 0, Math.PI * 2); x.fillStyle = "rgba(0,0,0,.35)"; x.fill();
    x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.fillStyle = id > 8 ? BCOL[0] : bcol(id); x.fill();
    if (id > 8) { x.save(); x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.clip(); x.fillStyle = bcol(id); x.fillRect(X - r, Y - r * .55, r * 2, r * 1.1); x.restore(); }
    if (id > 0) { dot(x, X, Y, r * .46, "#FBF7EF"); txt(x, id, X, Y + .5, r * .62, "#1B1714", 900); }
    const hl = x.createRadialGradient(X - r * .38, Y - r * .42, r * .05, X - r * .2, Y - r * .2, r * 1.05); hl.addColorStop(0, "rgba(255,255,255,.75)"); hl.addColorStop(.25, "rgba(255,255,255,.12)"); hl.addColorStop(1, "rgba(255,255,255,0)");
    x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.fillStyle = hl; x.fill();
    const sh = x.createRadialGradient(X, Y, r * .55, X, Y, r); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,.32)"); x.fillStyle = sh; x.fill(); x.restore(); };
  const wrap = (x, str, X, Y, w, size, col) => { x.font = "700 " + size + "px 'Pretendard Variable',Pretendard,sans-serif"; const words = String(str).split(" "); let line = "", yy = Y; words.forEach(wd => { const t2 = line ? line + " " + wd : wd; if (x.measureText(t2).width > w && line) { txt(x, line, X, yy, size, col, 700); line = wd; yy += size * 1.35; } else line = t2; }); if (line) txt(x, line, X, yy, size, col, 700); };
  let poolBgC = null;
  const poolBg = () => { if (poolBgC) return poolBgC; const c = document.createElement("canvas"); c.width = c.height = 1120; const x = c.getContext("2d"); x.setTransform(2, 0, 0, 2, 0, 0);
      fill(x, 0, 0, S, S, 22, "#211A15"); tex(x, 0, 0, S, S, 22);
      x.save(); x.shadowColor = "rgba(0,0,0,.55)"; x.shadowBlur = 24; x.shadowOffsetY = 10; fill(x, PX0 - 26, PY0 - 26, PX1 - PX0 + 52, PY1 - PY0 + 52, 20, "#4A2814"); x.restore();
      const wg = x.createLinearGradient(PX0 - 26, 0, PX1 + 26, 0); wg.addColorStop(0, "#5A3219"); wg.addColorStop(.5, "#7A4626"); wg.addColorStop(1, "#5A3219"); fill(x, PX0 - 24, PY0 - 24, PX1 - PX0 + 48, PY1 - PY0 + 48, 18, wg);
      stroke(x, PX0 - 23.5, PY0 - 23.5, PX1 - PX0 + 47, PY1 - PY0 + 47, 18, "rgba(255,220,170,.18)", 1);
      fill(x, PX0 - 9, PY0 - 9, PX1 - PX0 + 18, PY1 - PY0 + 18, 6, "#16583A");
      const fg = x.createRadialGradient(PCX, PMID, 30, PCX, PMID, 330); fg.addColorStop(0, "#2F9561"); fg.addColorStop(1, "#1C6E45"); fill(x, PX0, PY0, PX1 - PX0, PY1 - PY0, 2, fg); tex(x, PX0, PY0, PX1 - PX0, PY1 - PY0, 2);
      for (let k = 1; k < 4; k++) { const dx2 = PX0 + (PX1 - PX0) * k / 4; dot(x, dx2, PY0 - 16, 2.2, "#F3E6C8"); dot(x, dx2, PY1 + 16, 2.2, "#F3E6C8"); }
      for (let k = 1; k < 8; k++) { if (k === 4) continue; const dy2 = PY0 + (PY1 - PY0) * k / 8; dot(x, PX0 - 16, dy2, 2.2, "#F3E6C8"); dot(x, PX1 + 16, dy2, 2.2, "#F3E6C8"); }
      x.save(); x.strokeStyle = "rgba(255,255,255,.12)"; x.lineWidth = 1; x.beginPath(); x.moveTo(PX0, HEAD[1]); x.lineTo(PX1, HEAD[1]); x.stroke(); x.restore(); dot(x, FOOT[0], FOOT[1], 2, "rgba(255,255,255,.3)"); dot(x, HEAD[0], HEAD[1], 2, "rgba(255,255,255,.3)");
      POCK.forEach(([X, Y, r]) => { dot(x, X, Y, r + 3, "#2A1A10"); const pg = x.createRadialGradient(X, Y, 2, X, Y, r); pg.addColorStop(0, "#000"); pg.addColorStop(1, "#14100D"); x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.fillStyle = pg; x.fill(); });
    return (poolBgC = c); };
  G.push({ id: "pool", aimHover: true, name: "포켓볼", tag: "당구", color: "#1F6B42", sides: ["선공", "후공"], sideColor: [C.red, C.blue], turnSec: 45,
    desc: "8볼 포켓볼. 먼저 넣은 공의 무늬(단색·줄무늬)가 내 공이 돼요. 내 공 7개를 다 넣고 8번 공을 넣으면 승리. 흰 공이 빠지거나 상대 공을 먼저 맞히면 파울, 상대가 흰 공을 원하는 곳에 놓아요.",
    keys: "조준할 곳을 누르고 뒤로 끌어 세기 조절 → 놓으면 샷",
    init(seed) { const r = K.rnd(seed || 1); r(); const rest = shuffle([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15], r), order = [];
      const backL = rest.findIndex(i => i < 8), sL = rest.splice(backL, 1)[0], backR = rest.findIndex(i => i > 8), sR = rest.splice(backR, 1)[0];
      const b = [...Array(16)].map(() => [0, 0, 1]); b[0] = [HEAD[0], HEAD[1], 1]; let q = 0;
      for (let row = 0; row < 5; row++) for (let i = 0; i <= row; i++) { const X = FOOT[0] + (i - row / 2) * (BD + .4), Y = FOOT[1] - row * (BD * .866 + .4); let id;
        if (row === 2 && i === 1) id = 8; else if (row === 4 && i === 0) id = sL; else if (row === 4 && i === 4) id = sR; else id = rest[q++]; order.push(id); b[id] = [Math.round(X * 100) / 100, Math.round(Y * 100) / 100, 1]; }
      return { seed: seed || 1, b, t: 0, n: 0, grp: [null, null], brk: true, bih: false, msg: "", win: null, why: "" }; },
    turn: s => s.t,
    legal(s) { if (s.win != null) return []; if (s.bih) return [{ a: "place", x: HEAD[0], y: HEAD[1] }]; return [{ a: "shot", dx: 0, dy: -1000, p: 92 }, { a: "shot", dx: 60, dy: -1000, p: 85 }, { a: "shot", dx: -90, dy: -1000, p: 70 }]; },
    apply(s, m) { if (!m || s.win != null) return s; const me = s.t, op = 1 - me;
      if (m.a === "place") { if (!s.bih || !inTable(m.x, m.y) || !freeSpot(s.b, m.x, m.y, 0)) return s; const b = s.b.map(o => o.slice()); b[0] = [m.x, m.y, 1]; return Object.assign({}, s, { b, bih: false, n: s.n + 1, msg: "", rec: null }); }
      if (m.a !== "shot" || s.bih || !Number.isInteger(m.dx) || !Number.isInteger(m.dy) || (!m.dx && !m.dy) || !(m.p >= 3 && m.p <= 100)) return s;
      const R = poolSim(s.b, m.dx, m.dy, Math.round(m.p)), b = R.b, grp = s.grp.slice(), clear = s.grp[me] != null && poolLeft(s, me) === 0;
      let foul = "";
      if (R.first == null) foul = "공을 못 맞혔어요";
      else if (!s.brk) { const ft = btype(R.first); if (grp[me] == null ? ft === 8 : clear ? ft !== 8 : ft !== grp[me]) foul = ft === 8 ? "8번을 먼저 맞혔어요" : "상대 공을 먼저 맞혔어요"; }
      if (R.pots.includes(0)) foul = "흰 공이 빠졌어요";
      const ns = { seed: s.seed, b, t: me, n: s.n + 1, grp, brk: false, bih: false, msg: "", win: null, why: "", rec: R.frames };
      if (R.pots.includes(8)) {
        if (s.brk) { let y = FOOT[1]; while (!freeSpot(b, FOOT[0], y, 8) && y > PY0 + BR) y -= 2; b[8] = [FOOT[0], y, 1]; }
        else { if (foul || !clear) { ns.win = op; ns.why = foul ? "8번과 함께 파울" : "8번 공을 일찍 넣음"; ns.msg = say(me, ns.why); } else { ns.win = me; ns.why = "8번 공 성공"; ns.msg = say(me, "8번 공 성공! 승리"); } return ns; }
      }
      const obj = R.pots.filter(id => id !== 0 && id !== 8);
      if (!s.brk && !foul && grp[me] == null && obj.length) { grp[me] = btype(obj[0]); grp[op] = 1 - grp[me]; }
      const good = !foul && obj.some(id => grp[me] == null || btype(id) === grp[me]);
      if (foul) { ns.t = op; ns.bih = true; if (!b[0][2]) b[0] = [HEAD[0], HEAD[1], 0]; ns.msg = say(me, "파울 · " + foul); }
      else if (good) ns.msg = say(me, obj.length + "개 성공 · 한 번 더");
      else { ns.t = op; ns.msg = say(me, obj.length ? "상대 공만 들어갔어요" : "들어간 공이 없어요"); }
      return ns; },
    result: s => s.win != null ? { w: s.win, why: s.why } : s.n >= 300 ? { w: -1, why: "수 제한" } : null,
    dragStart(s, X, Y, v) { if (s.win != null || (v.ui.animUntil || 0) > Date.now()) return null; if (s.bih) return inTable(X, Y) ? "place" : null; const c = s.b[0]; return Math.hypot(X - c[0], Y - c[1]) > 14 ? "shot" : null; },
    dragEnd(s, X, Y, v) { const d = v.ui.drag; if (!d) return null;
      if (d.i === "place") { const x2 = Math.round(Math.min(PX1 - BR, Math.max(PX0 + BR, X))), y2 = Math.round(Math.min(PY1 - BR, Math.max(PY0 + BR, Y))); return freeSpot(s.b, x2, y2, 0) ? { a: "place", x: x2, y: y2 } : null; }
      const c = s.b[0], ax = d.x - c[0], ay = d.y - c[1], L = Math.sqrt(ax * ax + ay * ay), p = Math.min(100, Math.hypot(X - d.x, Y - d.y) / 1.5);
      if (L < 1 || p < 4) return null; return { a: "shot", dx: Math.round(ax / L * 1000), dy: Math.round(ay / L * 1000), p: Math.round(p) }; },
    hover(s, X, Y) { HOV.x = X; HOV.y = Y; return Math.round(X / 2) * 10000 + Math.round(Y / 2); },
    draw(x, s, v) { const u = v.ui || {}, me = v.me, op = 1 - me, now = Date.now();
      if (u.plN == null) { u.plN = s.n; u.plS = 0; } else if (u.plN !== s.n) { u.plN = s.n; u.plS = now; }
      const F = s.rec, fi = F && u.plS ? Math.floor((now - u.plS) / (1000 / 60)) : 1e9, anim = !!F && fi < F.length - 1; if (anim) u.animUntil = now + 40;
      const pos = k => anim ? [F[fi][k * 3], F[fi][k * 3 + 1], F[fi][k * 3 + 2]] : s.b[k];
      x.drawImage(poolBg(), 0, 0, S, S);
      const mine = v.myTurn && !anim && s.win == null, dr = u.drag;
      if (mine && !s.bih && s.b[0][2]) { const c = s.b[0], tx = dr && dr.i === "shot" ? dr.x : HOV.x, ty = dr && dr.i === "shot" ? dr.y : HOV.y, ax = tx - c[0], ay = ty - c[1], L = Math.hypot(ax, ay);
        if (L > 14) { const dx = ax / L, dy = ay / L; let tb = 1e9, hitId = -1;
          for (let k = 1; k < 16; k++) { const o = s.b[k]; if (!o[2]) continue; const ox = o[0] - c[0], oy = o[1] - c[1], pr = ox * dx + oy * dy; if (pr <= 0) continue; const pp = ox * ox + oy * oy - pr * pr; if (pp >= BD * BD) continue; const t2 = pr - Math.sqrt(BD * BD - pp); if (t2 < tb) { tb = t2; hitId = k; } }
          const tw = Math.min(dx > 0 ? (PX1 - BR - c[0]) / dx : dx < 0 ? (PX0 + BR - c[0]) / dx : 1e9, dy > 0 ? (PY1 - BR - c[1]) / dy : dy < 0 ? (PY0 + BR - c[1]) / dy : 1e9), te = Math.min(tb, tw), gx = c[0] + dx * te, gy = c[1] + dy * te;
          x.save(); x.setLineDash([5, 5]); x.strokeStyle = "rgba(255,255,255,.55)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(c[0] + dx * BR, c[1] + dy * BR); x.lineTo(gx, gy); x.stroke(); x.setLineDash([]);
          ring(x, gx, gy, BR, "rgba(255,255,255,.6)", 1.5);
          if (hitId > 0) { const o = s.b[hitId], nx = o[0] - gx, ny = o[1] - gy, nl = Math.hypot(nx, ny) || 1; x.strokeStyle = "rgba(255,255,255,.75)"; x.lineWidth = 2; x.beginPath(); x.moveTo(o[0], o[1]); x.lineTo(o[0] + nx / nl * 44, o[1] + ny / nl * 44); x.stroke();
            const okHit = s.brk || (s.grp[me] == null ? btype(hitId) !== 8 : poolLeft(s, me) === 0 ? hitId === 8 : btype(hitId) === s.grp[me]); if (!okHit) ring(x, o[0], o[1], BR + 3, "#FF6B5E", 2); }
          x.restore(); u.aimDir = [dx, dy]; } else u.aimDir = null; }
      for (let k = 15; k >= 0; k--) { const p = pos(k); if (!p) continue; if (k === 0 && s.bih && !anim && mine) continue; drawBall(x, k, p[0], p[1], BR, p[2]); }
      if (mine && s.bih) { const hx = dr && dr.i === "place" ? dr.tx : HOV.x, hy = dr && dr.i === "place" ? dr.ty : HOV.y, ok = inTable(hx, hy) && freeSpot(s.b, hx, hy, 0); x.save(); x.globalAlpha = ok ? .9 : .4; drawBall(x, 0, Math.min(PX1 - BR, Math.max(PX0 + BR, hx)), Math.min(PY1 - BR, Math.max(PY0 + BR, hy)), BR, 1); x.restore(); }
      let power = 0; if (mine && !s.bih && dr && dr.i === "shot") power = Math.min(100, Math.hypot(dr.tx - dr.x, dr.ty - dr.y) / 1.5);
      if (mine && !s.bih && u.aimDir && s.b[0][2]) { const c = s.b[0], [dx, dy] = u.aimDir, back = BR + 5 + power * .55, sx = c[0] - dx * back, sy = c[1] - dy * back, ex = sx - dx * 320, ey = sy - dy * 320;
        x.save(); x.lineCap = "round"; x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 8; x.shadowOffsetY = 4;
        const cg = x.createLinearGradient(sx, sy, ex, ey); cg.addColorStop(0, "#5A8FD8"); cg.addColorStop(.02, "#F5F0E6"); cg.addColorStop(.05, "#E9CFA3"); cg.addColorStop(.62, "#D8B07A"); cg.addColorStop(.66, "#1D1410"); cg.addColorStop(.7, "#6B2E1E"); cg.addColorStop(1, "#2B1810");
        x.strokeStyle = cg; x.lineWidth = 7; x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.stroke(); x.restore(); }
      const panel = (X, p, label) => { const on = s.t === p && s.win == null, g2 = s.grp[p];
        fill(x, X, 40, 110, 230, 14, on ? "rgba(251,247,239,.12)" : "rgba(0,0,0,.18)"); if (on) stroke(x, X + .5, 40.5, 109, 229, 14, P2[p], 2);
        dot(x, X + 18, 62, 6, P2[p]); txt(x, label, X + 30, 62, 14, C.cream, 800, "left");
        txt(x, g2 == null ? "공 미정" : GN[g2] + " · " + poolLeft(s, p) + "개 남음", X + 12, 86, 11, "rgba(251,247,239,.7)", 700, "left");
        const ids = g2 == null ? [] : (g2 === 0 ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15]).concat(8);
        ids.forEach((id, k) => { const bx = X + 20 + (k % 3) * 35, by = 118 + Math.floor(k / 3) * 34, onT = s.b[id][2]; x.save(); x.globalAlpha = onT ? 1 : .22; drawBall(x, id, bx, by, 12, 1); x.restore(); });
        if (on) txt(x, p === me ? "내 차례" : "상대 차례", X + 55, 252, 12, P2[p], 800); };
      panel(8, me, "나"); panel(442, op, "상대");
      fill(x, 8, 290, 110, 230, 14, "rgba(0,0,0,.18)");
      if (s.msg) { const [w2, t2] = s.msg.split("|"); txt(x, +w2 === me ? "내 샷" : "상대 샷", 63, 312, 11, "rgba(251,247,239,.55)", 700); wrap(x, t2, 63, 336, 100, 13, t2.includes("파울") || t2.includes("일찍") ? "#FF8A7A" : C.cream); }
      else txt(x, s.brk ? "브레이크 샷" : "", 63, 312, 12, "rgba(251,247,239,.7)", 700);
      if (mine) wrap(x, s.bih ? "흰 공을 놓을 곳을 누르세요" : "조준할 곳을 누르고 뒤로 끌었다 놓으세요", 63, 440, 100, 11, "rgba(251,247,239,.65)");
      fill(x, 442, 290, 110, 230, 14, "rgba(0,0,0,.18)"); txt(x, "세기", 497, 312, 11, "rgba(251,247,239,.55)", 700);
      fill(x, 483, 328, 28, 170, 8, "rgba(0,0,0,.35)"); if (power > 0) { const h2 = 166 * power / 100, pg2 = x.createLinearGradient(0, 496, 0, 330); pg2.addColorStop(0, "#3FBF7F"); pg2.addColorStop(.6, "#F2C230"); pg2.addColorStop(1, "#E5483A"); fill(x, 485, 496 - h2, 24, h2, 6, pg2); }
      txt(x, Math.round(power) + "%", 497, 510, 11, C.cream, 800); },
    extra: s => [0, 1].map(p => s.grp[p] == null ? "공 미정" : GN[s.grp[p]] + " " + poolLeft(s, p) + "개 남음")
  });

  BG.moreLoaded = true;
})();
