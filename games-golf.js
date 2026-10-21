// 미니골프 v2 — 6홀 코스 (모래 · 연못 · 경사로 · 범퍼 · 풍차)
// 물리는 결정적(+ − × ÷ √만 사용). 풍차는 64단계 회전을 상수 곱으로 돌려서 모든 기기에서 같은 결과가 나온다.
(function () {
  const BG = window.BG;
  if (!BG || BG.golfLoaded || !BG.art) return;
  const K = BG.art, C = K.C, S = BG.S, G = BG.GAMES;
  const { fill, stroke, dot, ring, txt, tex } = K;
  const P2 = [C.red, C.blue], PL = ["#FF8A7A", "#7FB2EE"];
  const say = (me, t) => me + "|" + t;
  const GX0 = 40, GY0 = 48, GX1 = 520, GY1 = 516, BR = 8, CUP = 11, MAXS = 6, FW = GX1 - GX0, FH = GY1 - GY0;
  const WTH = 0.02454369260617026, WC = 0.9996988186962042, WS = 0.024541228522912288, ARM = 4, HUB = 15, TICK = 1000 / 60;
  const HOLES = [
    { name: "워밍업", par: 2, tee: [280, 474], cup: [280, 120], walls: [[40, 300, 130, 22], [390, 300, 130, 22]], bump: [[280, 292, 24]] },
    { name: "모래 언덕", par: 3, tee: [110, 474], cup: [452, 116], walls: [[40, 252, 340, 24]], sand: [[380, 160, 140, 74], [190, 360, 150, 70]], bump: [[470, 340, 18]] },
    { name: "풍차", par: 3, tee: [280, 480], cup: [280, 108], walls: [[40, 262, 150, 50], [370, 262, 150, 50]], mill: { c: [280, 287], L: 84 } },
    { name: "호수", par: 3, tee: [280, 484], cup: [280, 108], water: [[130, 190, 300, 150]], bump: [[86, 265, 16], [474, 265, 16]] },
    { name: "경사로", par: 3, tee: [460, 484], cup: [112, 116], walls: [[40, 404, 300, 20]], slope: [[40, 172, 480, 170, 0.07, 0]], bump: [[300, 256, 20]] },
    { name: "지그재그", par: 4, tee: [300, 486], cup: [404, 104], walls: [[40, 362, 330, 22], [190, 210, 330, 22]], sand: [[40, 262, 120, 80]], water: [[432, 262, 88, 78]], bump: [[120, 136, 18]] }
  ];
  const r2 = v => Math.round(v * 100) / 100;
  const inR = (r, x, y) => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3];
  const millAt = w => { let ux = 1, uy = 0; for (let k = 0; k < w % 64; k++) { const nx = ux * WC - uy * WS, ny = ux * WS + uy * WC; ux = nx; uy = ny; } return [ux, uy]; };
  function golfSim(H, x, y, dx, dy, p, w, maxT) {
    const L = Math.sqrt(dx * dx + dy * dy), sp = 1.2 + p * 0.12, SUB = 4, x0 = x, y0 = y; let vx = dx / L * sp, vy = dy / L * sp, end = "", slow = 0;
    let [ax, ay] = H.mill ? millAt(w || 0) : [1, 0]; const frames = [[r2(x), r2(y)]], lim = maxT || 1500;
    for (let tick = 0; tick < lim && !end; tick++) {
      for (let k = 0; k < SUB && !end; k++) {
        x += vx / SUB; y += vy / SUB;
        if (x < GX0 + BR) { x = 2 * (GX0 + BR) - x; vx = -vx * .8; } else if (x > GX1 - BR) { x = 2 * (GX1 - BR) - x; vx = -vx * .8; }
        if (y < GY0 + BR) { y = 2 * (GY0 + BR) - y; vy = -vy * .8; } else if (y > GY1 - BR) { y = 2 * (GY1 - BR) - y; vy = -vy * .8; }
        for (const wl of H.walls || []) { const cx = Math.max(wl[0], Math.min(x, wl[0] + wl[2])), cy = Math.max(wl[1], Math.min(y, wl[1] + wl[3])), ex = x - cx, ey = y - cy, d2 = ex * ex + ey * ey;
          if (d2 >= BR * BR || d2 === 0) continue; const d = Math.sqrt(d2), nx = ex / d, ny = ey / d; x = cx + nx * BR; y = cy + ny * BR; const vn = vx * nx + vy * ny; if (vn < 0) { vx -= 1.8 * vn * nx; vy -= 1.8 * vn * ny; } }
        for (const b of H.bump || []) { const ex = x - b[0], ey = y - b[1], d2 = ex * ex + ey * ey, R = b[2] + BR; if (d2 >= R * R || d2 === 0) continue;
          const d = Math.sqrt(d2), nx = ex / d, ny = ey / d; x = b[0] + nx * R; y = b[1] + ny * R; const vn = vx * nx + vy * ny; if (vn < 0) { vx -= 2 * vn * nx; vy -= 2 * vn * ny; } }
        if (H.mill) { const c = H.mill.c, px = x - c[0], py = y - c[1];
          const hd2 = px * px + py * py, HR = HUB + BR; if (hd2 < HR * HR && hd2 > 0) { const d = Math.sqrt(hd2), nx = px / d, ny = py / d; x = c[0] + nx * HR; y = c[1] + ny * HR; const vn = vx * nx + vy * ny; if (vn < 0) { vx -= 1.8 * vn * nx; vy -= 1.8 * vn * ny; } }
          const A = [[ax, ay], [-ay, ax], [-ax, -ay], [ay, -ax]];
          for (const [ux, uy] of A) { const qx = x - c[0], qy = y - c[1]; let t = qx * ux + qy * uy; if (t < 0) t = 0; else if (t > H.mill.L) t = H.mill.L;
            const ex = qx - ux * t, ey = qy - uy * t, d2 = ex * ex + ey * ey, R = BR + ARM; if (d2 >= R * R || d2 === 0) continue;
            const d = Math.sqrt(d2), nx = ex / d, ny = ey / d; x = c[0] + ux * t + nx * R; y = c[1] + uy * t + ny * R;
            const avx = -uy * WTH * t, avy = ux * WTH * t, rvx = vx - avx, rvy = vy - avy, vn = rvx * nx + rvy * ny; if (vn < 0) { vx -= 1.8 * vn * nx; vy -= 1.8 * vn * ny; } } }
        for (const r of H.water || []) if (inR(r, x, y)) end = "water";
        const ux = x - H.cup[0], uy = y - H.cup[1], cd2 = ux * ux + uy * uy;
        if (!end && cd2 < CUP * CUP && vx * vx + vy * vy < 25) { end = "cup"; x = H.cup[0]; y = H.cup[1]; }
        else if (!end && cd2 < (CUP + 8) * (CUP + 8) && vx * vx + vy * vy < 9) { vx -= ux * .04; vy -= uy * .04; }
      }
      if (H.mill) { const nx = ax * WC - ay * WS, ny = ax * WS + ay * WC; ax = nx; ay = ny; }
      frames.push([r2(x), r2(y)]); if (end) break;
      let onSlope = false; for (const s of H.slope || []) if (inR(s, x, y)) { vx += s[4]; vy += s[5]; onSlope = true; }
      const sand = (H.sand || []).some(r => inR(r, x, y)), s2 = vx * vx + vy * vy;
      if (s2 === 0) { if (!onSlope) break; continue; }
      const v = Math.sqrt(s2), nv = v * (1 - (sand ? .075 : .016)) - (sand ? .1 : .035);
      if (nv <= .03) { vx = vy = 0; if (!onSlope) break; } else { vx *= nv / v; vy *= nv / v; }
      if (v < .3) { if (++slow > 90) break; } else slow = 0;
    }
    if (end === "water") return { x: x0, y: y0, end, frames, wx: r2(x), wy: r2(y) };
    return { x: r2(x), y: r2(y), end, frames };
  }

  // ---------- 그림 ----------
  const bgCache = {};
  const rrect = (x, X, Y, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); };
  function wall3d(x, X, Y, w, h) {
    x.save(); x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 8; x.shadowOffsetX = 3; x.shadowOffsetY = 6; fill(x, X, Y, w, h, 5, "#5A3A22"); x.restore();
    const g = x.createLinearGradient(0, Y, 0, Y + h); g.addColorStop(0, "#B07B4C"); g.addColorStop(1, "#7E5432"); fill(x, X, Y - 4, w, h, 5, g);
    x.save(); rrect(x, X, Y - 4, w, h, 5); x.clip(); x.strokeStyle = "rgba(60,35,15,.25)"; x.lineWidth = 1; for (let k = X + 14; k < X + w; k += 18) { x.beginPath(); x.moveTo(k, Y - 4); x.lineTo(k - 6, Y + h); x.stroke(); } x.restore();
    fill(x, X + 3, Y - 3, w - 6, 3, 2, "rgba(255,230,190,.45)");
  }
  function paintCourse(x, H) {
    fill(x, 0, 0, S, S, 22, "#203A1C"); tex(x, 0, 0, S, S, 22);
    const R = K.rnd(H.name.length * 97 + H.par); for (let i = 0; i < 260; i++) { x.fillStyle = R() < .5 ? "rgba(0,0,0,.12)" : "rgba(140,190,90,.08)"; x.beginPath(); x.arc(R() * S, R() * S, 1 + R() * 3, 0, Math.PI * 2); x.fill(); }
    x.save(); x.shadowColor = "rgba(0,0,0,.55)"; x.shadowBlur = 22; x.shadowOffsetY = 10; fill(x, GX0 - 14, GY0 - 14, FW + 28, FH + 28, 18, "#3E2816"); x.restore();
    const wg = x.createLinearGradient(GX0 - 14, GY0 - 14, GX1 + 14, GY1 + 14); wg.addColorStop(0, "#A06B3E"); wg.addColorStop(.5, "#7A4E2C"); wg.addColorStop(1, "#5C3A20"); fill(x, GX0 - 13, GY0 - 13, FW + 26, FH + 26, 17, wg);
    stroke(x, GX0 - 12.5, GY0 - 12.5, FW + 25, FH + 25, 17, "rgba(255,225,180,.28)", 1);
    const fg = x.createRadialGradient(S / 2, S / 2 - 40, 40, S / 2, S / 2, 380); fg.addColorStop(0, "#74C26C"); fg.addColorStop(1, "#3F8D44"); fill(x, GX0, GY0, FW, FH, 6, fg);
    x.save(); rrect(x, GX0, GY0, FW, FH, 6); x.clip();
    x.save(); x.translate(S / 2, S / 2); x.rotate(-Math.PI / 4); for (let i = -12; i < 12; i++) if (i % 2) { x.fillStyle = "rgba(255,255,255,.055)"; x.fillRect(i * 34, -420, 34, 840); } x.restore();
    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => { const X = dx > 0 ? GX0 : dx < 0 ? GX1 - 14 : GX0, Y = dy > 0 ? GY0 : dy < 0 ? GY1 - 14 : GY0, w = dx ? 14 : FW, h = dy ? 14 : FH, g = x.createLinearGradient(X + (dx < 0 ? 14 : 0), Y + (dy < 0 ? 14 : 0), X + (dx > 0 ? 14 : 0), Y + (dy > 0 ? 14 : 0)); g.addColorStop(0, "rgba(0,0,0,.22)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(X, Y, w, h); });
    (H.slope || []).forEach(s => { fill(x, s[0], s[1], s[2], s[3], 0, "rgba(255,255,190,.06)"); x.strokeStyle = "rgba(255,255,220,.16)"; x.setLineDash([6, 6]); x.lineWidth = 1.5; x.strokeRect(s[0] + 1, s[1] + 1, s[2] - 2, s[3] - 2); x.setLineDash([]); });
    x.restore(); tex(x, GX0, GY0, FW, FH, 6);
    (H.sand || []).forEach(r => { x.save(); x.shadowColor = "rgba(90,60,20,.35)"; x.shadowBlur = 6; fill(x, r[0], r[1], r[2], r[3], 26, "#E6D29C"); x.restore(); const sg = x.createRadialGradient(r[0] + r[2] / 2, r[1] + r[3] / 2, 4, r[0] + r[2] / 2, r[1] + r[3] / 2, Math.max(r[2], r[3]) * .7); sg.addColorStop(0, "rgba(255,250,225,.5)"); sg.addColorStop(1, "rgba(160,120,60,.25)"); fill(x, r[0], r[1], r[2], r[3], 26, sg);
      x.save(); rrect(x, r[0], r[1], r[2], r[3], 26); x.clip(); const Rs = K.rnd(r[0] + r[1]); for (let i = 0; i < r[2] * r[3] / 60; i++) { x.fillStyle = Rs() < .5 ? "rgba(140,105,50,.28)" : "rgba(255,255,240,.5)"; x.fillRect(r[0] + Rs() * r[2], r[1] + Rs() * r[3], 1.4, 1.4); } x.strokeStyle = "rgba(150,115,60,.25)"; x.lineWidth = 1; for (let k = 0; k < 4; k++) { x.beginPath(); x.ellipse(r[0] + r[2] / 2, r[1] + r[3] / 2, r[2] * (.15 + k * .11), r[3] * (.15 + k * .11), 0, 0, Math.PI * 2); x.stroke(); } x.restore(); });
    (H.water || []).forEach(r => { fill(x, r[0] - 4, r[1] - 4, r[2] + 8, r[3] + 8, 28, "#8A7A5A"); const g = x.createLinearGradient(r[0], r[1], r[0] + r[2], r[1] + r[3]); g.addColorStop(0, "#4FA3DE"); g.addColorStop(1, "#1D5E9C"); fill(x, r[0], r[1], r[2], r[3], 24, g); stroke(x, r[0] + 2, r[1] + 2, r[2] - 4, r[3] - 4, 22, "rgba(255,255,255,.3)", 2); });
    (H.walls || []).forEach(wl => wall3d(x, wl[0], wl[1], wl[2], wl[3]));
    (H.bump || []).forEach(b => { x.save(); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 8; x.shadowOffsetY = 5; dot(x, b[0], b[1], b[2], "#B8322A"); x.restore(); const g = x.createRadialGradient(b[0] - b[2] * .35, b[1] - b[2] * .4, 2, b[0], b[1], b[2]); g.addColorStop(0, "#FF8A78"); g.addColorStop(1, "#C93A2F"); dot(x, b[0], b[1], b[2], g); dot(x, b[0], b[1], b[2] * .55, "#FBF7EF"); ring(x, b[0], b[1], b[2] * .55, "rgba(0,0,0,.12)", 1.5); dot(x, b[0], b[1], b[2] * .2, "#C93A2F"); });
    if (H.mill) { const c = H.mill.c; x.save(); x.globalAlpha = .25; dot(x, c[0] + 4, c[1] + 6, H.mill.L * .45, "#000"); x.restore(); }
    fill(x, H.tee[0] - 18, H.tee[1] - 7, 36, 14, 4, "#2F6F36"); stroke(x, H.tee[0] - 18, H.tee[1] - 7, 36, 14, 4, "rgba(255,255,255,.35)", 1.5);
    dot(x, H.cup[0], H.cup[1], CUP + 5, "rgba(255,255,255,.22)"); const cg = x.createRadialGradient(H.cup[0] - 3, H.cup[1] - 3, 1, H.cup[0], H.cup[1], CUP); cg.addColorStop(0, "#000"); cg.addColorStop(.8, "#141210"); cg.addColorStop(1, "#3A3530"); dot(x, H.cup[0], H.cup[1], CUP, cg);
  }
  const course = i => { if (bgCache[i]) return bgCache[i]; const c = document.createElement("canvas"); c.width = c.height = 1120; const x = c.getContext("2d"); x.setTransform(2, 0, 0, 2, 0, 0); paintCourse(x, HOLES[i]); return (bgCache[i] = c); };
  function liveLayer(x, H, now, ang) {
    (H.water || []).forEach(r => { x.save(); rrect(x, r[0], r[1], r[2], r[3], 24); x.clip(); x.strokeStyle = "rgba(255,255,255,.22)"; x.lineWidth = 1.5;
      for (let k = 0; k < 5; k++) { const ph = ((now / 2400 + k / 5) % 1), cx = r[0] + r[2] * (.2 + .6 * ((k * 37) % 10) / 10), cy = r[1] + r[3] * (.25 + .5 * ((k * 53) % 10) / 10); x.globalAlpha = 1 - ph; x.beginPath(); x.ellipse(cx, cy, 6 + ph * 34, 3 + ph * 14, 0, 0, Math.PI * 2); x.stroke(); } x.restore(); });
    (H.slope || []).forEach(s => { x.save(); x.beginPath(); x.rect(s[0], s[1], s[2], s[3]); x.clip(); x.strokeStyle = "rgba(255,255,220,.28)"; x.lineWidth = 3; x.lineCap = "round"; const dir = s[4] > 0 ? 1 : -1, off = (now / 30) % 60;
      for (let yy = s[1] + 30; yy < s[1] + s[3]; yy += 56) for (let xx = s[0] - 60 + (dir > 0 ? off : 60 - off); xx < s[0] + s[2] + 60; xx += 60) { x.beginPath(); x.moveTo(xx - 6 * dir, yy - 9); x.lineTo(xx + 4 * dir, yy); x.lineTo(xx - 6 * dir, yy + 9); x.stroke(); } x.restore(); });
    if (H.mill) { const c = H.mill.c, L = H.mill.L; for (let q = 0; q < 4; q++) { const a = ang + q * Math.PI / 2; x.save(); x.translate(c[0], c[1]); x.rotate(a);
        x.save(); x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 6; x.shadowOffsetX = 3; x.shadowOffsetY = 5; fill(x, 0, -ARM, L, ARM * 2, 3, "#6B4428"); x.restore();
        fill(x, 22, ARM, L - 24, 15, 2, "rgba(251,247,239,.92)"); x.strokeStyle = "rgba(120,80,40,.55)"; x.lineWidth = 1; for (let k = 32; k < L; k += 12) { x.beginPath(); x.moveTo(k, ARM); x.lineTo(k, ARM + 15); x.stroke(); } x.strokeRect(22, ARM, L - 24, 15);
        fill(x, 0, -ARM + 1, L, 2, 1, "rgba(255,225,180,.45)"); x.restore(); }
      dot(x, c[0], c[1], HUB, "#5A3A22"); const hg = x.createRadialGradient(c[0] - 4, c[1] - 4, 1, c[0], c[1], HUB); hg.addColorStop(0, "#C9955E"); hg.addColorStop(1, "#7A4E2C"); dot(x, c[0], c[1], HUB - 2, hg); dot(x, c[0], c[1], 3.5, "#2A1A0E"); }
  }
  const flag = (x, H, now, num) => { const X = H.cup[0], Y = H.cup[1], PH = 58, w = Math.sin(now / 300) * 2.5, w2 = Math.sin(now / 300 + 1.4) * 2.5;
    // 그림자 (해가 왼쪽 위에서 비춘다)
    x.save(); x.globalAlpha = .22; x.fillStyle = "#000"; x.beginPath(); x.moveTo(X + 1, Y + 1); x.lineTo(X + 30, Y - 14); x.lineTo(X + 31, Y - 12); x.lineTo(X + 2, Y + 3); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(X + 30, Y - 14); x.quadraticCurveTo(X + 44, Y - 14 + w * .4, X + 56, Y - 8); x.quadraticCurveTo(X + 44, Y - 4, X + 34, Y - 5); x.closePath(); x.fill(); x.restore();
    // 깃대: 흰색 유리섬유 + 빨간 줄무늬
    const pg = x.createLinearGradient(X - 2, 0, X + 2, 0); pg.addColorStop(0, "#BFC6CE"); pg.addColorStop(.45, "#FFFFFF"); pg.addColorStop(1, "#9AA3AD");
    x.fillStyle = pg; x.fillRect(X - 1.6, Y - PH, 3.2, PH);
    for (let k = 0; k < 4; k++) { x.fillStyle = "#E5483A"; x.fillRect(X - 1.6, Y - PH + 12 + k * 11, 3.2, 4); }
    dot(x, X, Y - PH - 1, 2.8, "#F2C230"); dot(x, X - .8, Y - PH - 1.8, 1, "#FFF3BF");
    // 깃발: 바람에 휘는 천
    const top = Y - PH + 1, bot = Y - PH + 21, tip = X + 30;
    const fg = x.createLinearGradient(X, top, tip, bot); fg.addColorStop(0, "#FF5A47"); fg.addColorStop(.55, "#E5483A"); fg.addColorStop(1, "#B8321F");
    x.fillStyle = fg; x.beginPath(); x.moveTo(X + 1.6, top);
    x.bezierCurveTo(X + 10, top - 2 + w, X + 20, top + 3 - w, tip, top + 9 + w2 * .6);
    x.bezierCurveTo(X + 20, bot - 3 + w, X + 10, bot + 2 - w2, X + 1.6, bot); x.closePath(); x.fill();
    x.save(); x.globalAlpha = .25; x.fillStyle = "#fff"; x.beginPath(); x.moveTo(X + 1.6, top); x.bezierCurveTo(X + 10, top - 2 + w, X + 18, top + 2 - w, X + 24, top + 6); x.lineTo(X + 1.6, top + 6); x.closePath(); x.fill(); x.restore();
    if (num) txt(x, num, X + 12, top + 10 + w * .3, 10, "#FFFFFF", 900); };
  const ball = (x, X, Y, p, a, sc) => { if (a <= 0) return; const r = BR * (sc || 1); x.save(); x.globalAlpha = a; x.beginPath(); x.ellipse(X + 3, Y + 4, r, r * .8, 0, 0, Math.PI * 2); x.fillStyle = "rgba(0,0,0,.32)"; x.fill();
    const g = x.createRadialGradient(X - r * .35, Y - r * .4, r * .1, X, Y, r); g.addColorStop(0, "#FFFFFF"); g.addColorStop(1, "#D9DEE5"); dot(x, X, Y, r, g); ring(x, X, Y, r - 1.2, P2[p], 2.4);
    x.fillStyle = "rgba(0,0,0,.08)"; [[-2.5, 1.5], [2, 2.5], [1, -2.5], [-1, -.2]].forEach(([a2, b2]) => { x.beginPath(); x.arc(X + a2 * (sc || 1), Y + b2 * (sc || 1), 1, 0, Math.PI * 2); x.fill(); }); x.restore(); };
  const tot = (s, p) => s.sc[p].reduce((a, b) => a + b, 0) + (s.done ? 0 : s.st[p]);
  const label = (n, par) => n === 1 ? "HOLE IN ONE!" : n - par <= -2 ? "이글!" : n - par === -1 ? "버디!" : n - par === 0 ? "파" : n - par === 1 ? "보기" : n + "타";
  const HOV = { x: 280, y: 200 };
  const nowW = () => Math.floor(Date.now() / TICK) % 64;

  G.push({ id: "minigolf", name: "미니골프", tag: "물리", color: "#3F8A45", sides: ["빨강 공", "파랑 공"], sideColor: [C.red, C.blue], turnSec: 60, aimHover: true,
    desc: "모래·연못·경사로·범퍼·풍차가 있는 6홀 미니골프. 끄는 동안 공이 굴러갈 길이 점으로 끝까지 보여요. 같은 홀을 번갈아 치고 총 타수가 적은 쪽이 승리. 모래는 공이 금방 멈추고, 연못에 빠지면 1벌타 후 친 자리로 돌아와요. 풍차는 날개 틈을 노려 타이밍을 맞추세요. 한 홀 최대 6타.",
    keys: "조준할 곳을 누르고 뒤로 끌어 세기 조절 → 놓으면 샷 · 끄는 동안 예상 경로 표시",
    init(seed) { const T = HOLES[0].tee; return { seed: seed || 1, ho: 0, pos: [T.slice(), T.slice()], hd: [0, 0], st: [0, 0], sc: [[], []], t: 0, n: 0, rec: null, rh: 0, rp: -1, ro: null, rw: 0, re: "", rs: 0, wx: 0, wy: 0, msg: "", win: null, done: false }; },
    turn: s => s.t,
    legal(s) { if (s.done) return []; const c = s.pos[s.t], H = HOLES[s.ho], dx = H.cup[0] - c[0], dy = H.cup[1] - c[1], L = Math.hypot(dx, dy) || 1; return [{ a: "shot", dx: Math.round(dx / L * 1000), dy: Math.round(dy / L * 1000), p: 45, w: 0 }, { a: "shot", dx: Math.round(dx / L * 1000) + 300, dy: Math.round(dy / L * 1000), p: 60, w: 16 }]; },
    apply(s, m) { if (!m || s.done || m.a !== "shot" || !Number.isInteger(m.dx) || !Number.isInteger(m.dy) || (!m.dx && !m.dy) || !(m.p >= 3 && m.p <= 100)) return s;
      const w = Number.isInteger(m.w) && m.w >= 0 && m.w < 64 ? m.w : 0, me = s.t, op = 1 - me; if (s.hd[me]) return s;
      const H = HOLES[s.ho], R = golfSim(H, s.pos[me][0], s.pos[me][1], m.dx, m.dy, Math.round(m.p), w);
      const ns = Object.assign({}, s, { pos: [s.pos[0].slice(), s.pos[1].slice()], hd: s.hd.slice(), st: s.st.slice(), sc: [s.sc[0].slice(), s.sc[1].slice()], n: s.n + 1, rec: R.frames, rh: s.ho, rp: me, ro: s.hd[op] ? null : s.pos[op].slice(), rw: w, re: R.end, wx: R.wx || 0, wy: R.wy || 0 });
      ns.st[me] += R.end === "water" ? 2 : 1; ns.pos[me] = [R.x, R.y]; ns.rs = ns.st[me]; let t;
      if (R.end === "cup") { ns.hd[me] = 1; t = label(ns.st[me], H.par) + " · " + ns.st[me] + "타"; }
      else if (ns.st[me] >= MAXS) { ns.hd[me] = 1; ns.st[me] = MAXS; ns.rs = MAXS; t = (R.end === "water" ? "퐁당! · " : "") + "최대 " + MAXS + "타로 마무리"; }
      else if (R.end === "water") t = "퐁당! 1벌타 · 다음이 " + (ns.st[me] + 1) + "타째";
      else t = ns.st[me] + "타 · 컵까지 " + Math.round(Math.hypot(R.x - H.cup[0], R.y - H.cup[1]) / 10) + "m";
      ns.msg = say(me, t); ns.t = !ns.hd[op] ? op : me;
      if (ns.hd[0] && ns.hd[1]) { ns.sc[0].push(ns.st[0]); ns.sc[1].push(ns.st[1]);
        if (s.ho + 1 >= HOLES.length) { const a = ns.sc[0].reduce((q, v) => q + v, 0), b = ns.sc[1].reduce((q, v) => q + v, 0); ns.done = true; ns.win = a === b ? -1 : a < b ? 0 : 1; ns.why = a + "타 : " + b + "타"; }
        else { const hn = s.ho + 1, T = HOLES[hn].tee; ns.t = ns.st[0] < ns.st[1] ? 0 : ns.st[1] < ns.st[0] ? 1 : hn % 2; ns.ho = hn; ns.pos = [T.slice(), T.slice()]; ns.hd = [0, 0]; ns.st = [0, 0]; } }
      return ns; },
    result: s => s.done ? { w: s.win, why: s.why } : s.n >= 300 ? { w: -1, why: "수 제한" } : null,
    dragStart(s, X, Y, v) { if (s.done || s.hd[v.me] || v.ui.mgAnim) return null; const c = s.pos[v.me]; return Math.hypot(X - c[0], Y - c[1]) > 12 ? "shot" : null; },
    dragEnd(s, X, Y, v) { const d = v.ui.drag; if (!d) return null; const c = s.pos[v.me], ax = d.x - c[0], ay = d.y - c[1], L = Math.sqrt(ax * ax + ay * ay), p = Math.min(100, Math.hypot(X - d.x, Y - d.y) / 1.5);
      if (L < 1 || p < 3) return null; return { a: "shot", dx: Math.round(ax / L * 1000), dy: Math.round(ay / L * 1000), p: Math.round(p), w: nowW() }; },
    hover(s, X, Y) { HOV.x = X; HOV.y = Y; return Math.round(X / 2) * 10000 + Math.round(Y / 2); },
    draw(x, s, v) { const u = v.ui || {}, me = v.me, op = 1 - me, now = Date.now(), thumb = !v.ui || !Object.keys(v.ui).length && !v.myTurn;
      if (u.mgN == null) { u.mgN = s.n; u.mgS = 0; } else if (u.mgN !== s.n) { u.mgN = s.n; u.mgS = now; u.mgFx = 0; }
      const F = s.rec, fi = F && u.mgS ? Math.floor((now - u.mgS) / TICK) : 1e9, anim = !!F && fi < F.length - 1; u.mgAnim = anim;
      const hi = anim ? s.rh : s.ho, H = HOLES[hi];
      if (u.mgHo == null) u.mgHo = s.ho; if (!anim && u.mgHo !== s.ho) { u.mgHo = s.ho; u.mgBan = now; }
      const fxEnd = F && u.mgS ? u.mgS + F.length * TICK : 0, fxAge = now - fxEnd;
      if (!thumb) u.animUntil = now + 40;
      x.drawImage(course(hi), 0, 0, S, S);
      const ang = H.mill ? WTH * (anim ? s.rw + fi : (thumb ? 10 : Math.floor(now / TICK))) : 0;
      liveLayer(x, H, thumb ? 0 : now, ang);
      if (anim) { if (s.ro) ball(x, s.ro[0], s.ro[1], 1 - s.rp, 1);
        for (let k = Math.max(0, fi - 16); k < fi; k++) { const a = (k - fi + 16) / 16; x.save(); x.globalAlpha = a * .35; dot(x, F[k][0], F[k][1], BR * a * .8, "#FFFFFF"); x.restore(); }
        const f = F[fi], last = F.length - 1, toCup = s.re === "cup" && fi > last - 8, toWater = s.re === "water" && fi > last - 8, k2 = toCup || toWater ? (last - fi) / 8 : 1;
        ball(x, f[0], f[1], s.rp, toWater ? k2 : 1, toCup ? .5 + k2 * .5 : 1); }
      else { [op, me].forEach(p => { if (!s.hd[p]) ball(x, s.pos[p][0], s.pos[p][1], p, 1); });
        if (s.re === "water" && F && fxAge >= 0 && fxAge < 900) { const a = 1 - fxAge / 900; x.save(); x.strokeStyle = "rgba(255,255,255," + a + ")"; x.lineWidth = 2.5; for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse(s.wx, s.wy, 6 + fxAge / 18 + k * 9, 3 + fxAge / 40 + k * 4, 0, 0, Math.PI * 2); x.stroke(); } x.restore(); } }
      flag(x, H, thumb ? 0 : now, (anim ? s.rh : s.ho) + 1);
      const mine = v.myTurn && !anim && !s.done && !s.hd[me], dr = u.drag; let power = 0;
      if (mine) { const c = s.pos[me], tx = dr ? dr.x : HOV.x, ty = dr ? dr.y : HOV.y, ax = tx - c[0], ay = ty - c[1], L = Math.hypot(ax, ay);
        if (dr) power = Math.min(100, Math.hypot(dr.tx - dr.x, dr.ty - dr.y) / 1.5);
        if (L > 12) { const dx = ax / L, dy = ay / L;
          if (dr && power >= 3) { const P = golfSim(H, c[0], c[1], Math.round(dx * 1000), Math.round(dy * 1000), Math.round(power), nowW(), 260).frames;
            for (let k = 4; k < P.length; k += 4) { const a = 1 - k / P.length; x.save(); x.globalAlpha = .25 + a * .6; dot(x, P[k][0], P[k][1], 2.6, "#FFFFFF"); x.restore(); } }
          else { x.save(); x.setLineDash([4, 7]); x.strokeStyle = "rgba(255,255,255,.6)"; x.lineWidth = 2; x.beginPath(); x.moveTo(c[0] + dx * (BR + 4), c[1] + dy * (BR + 4)); x.lineTo(c[0] + dx * 70, c[1] + dy * 70); x.stroke(); x.restore(); }
          if (dr) { const col = power > 75 ? "#FF6B5E" : power > 45 ? "#F2C230" : "#5FD38F"; x.save(); x.lineCap = "round"; x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 5; x.beginPath(); x.arc(c[0], c[1], 22, -Math.PI / 2, Math.PI * 1.5); x.stroke(); x.strokeStyle = col; x.beginPath(); x.arc(c[0], c[1], 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * power / 100); x.stroke(); x.restore(); txt(x, Math.round(power) + "%", c[0], c[1] - 34, 12, "#FFFFFF", 900); } }
        if (!dr) { x.save(); x.globalAlpha = .5 + Math.sin(now / 240) * .3; ring(x, c[0], c[1], BR + 6, "#FFFFFF", 2); x.restore(); } }
      fill(x, 10, 8, 250, 30, 10, "rgba(0,0,0,.32)"); txt(x, "HOLE " + (hi + 1) + "/" + HOLES.length, 22, 23, 12, "#F2C230", 900, "left"); txt(x, H.name + " · PAR " + H.par, 98, 23, 13, C.cream, 800, "left");
      fill(x, S - 190, 8, 180, 30, 10, "rgba(0,0,0,.32)"); dot(x, S - 176, 23, 5, P2[me]); txt(x, "나 " + tot(s, me), S - 166, 23, 13, C.cream, 800, "left"); dot(x, S - 96, 23, 5, P2[op]); txt(x, "상대 " + tot(s, op), S - 86, 23, 13, C.cream, 800, "left");
      if (s.msg && !anim) { const [w2, t2] = s.msg.split("|"); txt(x, (+w2 === me ? "나: " : "상대: ") + t2, S / 2, 538, 13, C.cream, 800); }
      else if (!anim) txt(x, s.done ? "" : mine ? "조준할 곳을 누르고 뒤로 끌었다 놓으세요" : s.hd[me] ? "홀 아웃 · 상대를 기다려요" : "상대 차례", S / 2, 538, 12, "rgba(251,247,239,.75)", 700);
      if (!anim && F && fxAge >= 0 && fxAge < 1800 && (s.re === "cup" || s.re === "water") && !thumb) { const a = Math.min(1, (1800 - fxAge) / 400), sc = 1 + Math.max(0, 1 - fxAge / 220) * .5, t2 = s.re === "cup" ? label(s.rs, HOLES[s.rh].par) : "퐁당!";
        if (!u.mgFx) { u.mgFx = 1; try { WJ.sfx(s.re === "cup" ? (s.rs <= HOLES[s.rh].par ? "win" : "coin") : "flip"); } catch (e) {} }
        x.save(); x.globalAlpha = a; x.translate(S / 2, 250); x.scale(sc, sc); x.shadowColor = "rgba(0,0,0,.5)"; x.shadowBlur = 16; txt(x, t2, 0, 0, t2.length > 6 ? 46 : 54, s.re === "cup" ? "#FFD25A" : "#8FD0FF", 900); x.restore(); }
      else if (!anim && u.mgBan && now - u.mgBan < 1600 && !s.done) { const a = Math.min(1, (1600 - (now - u.mgBan)) / 300); x.save(); x.globalAlpha = a; fill(x, 120, 220, 320, 80, 20, "rgba(20,30,20,.78)"); txt(x, "HOLE " + (s.ho + 1), S / 2, 248, 14, "#F2C230", 900); txt(x, HOLES[s.ho].name + " · PAR " + HOLES[s.ho].par, S / 2, 276, 22, C.cream, 900); x.restore(); }
      if (s.done && !anim) { fill(x, 60, 170, 440, 170, 20, "rgba(20,30,20,.86)"); txt(x, "스코어카드", S / 2, 196, 15, "#F2C230", 900);
        const cx = k => 150 + k * 44; HOLES.forEach((h, k) => { txt(x, k + 1, cx(k), 226, 12, "rgba(251,247,239,.6)", 800); }); txt(x, "합계", 446, 226, 12, "rgba(251,247,239,.6)", 800);
        [[me, "나", 262], [op, "상대", 300]].forEach(([p, nm, yy]) => { dot(x, 86, yy, 5, P2[p]); txt(x, nm, 98, yy, 13, C.cream, 800, "left"); s.sc[p].forEach((n, k) => txt(x, n, cx(k), yy, 15, n < HOLES[k].par ? "#FFD25A" : n > HOLES[k].par ? "#FF9A8A" : C.cream, 900)); txt(x, tot(s, p), 446, yy, 16, C.cream, 900); }); } },
    extra: s => [0, 1].map(p => "총 " + tot(s, p) + "타 · " + (s.done ? "완료" : (s.ho + 1) + "번 홀"))
  });

  BG.golfLoaded = true;
})();
