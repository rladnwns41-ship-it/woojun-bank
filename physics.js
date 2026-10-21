// 우준 물리 엔진 — 결정적(deterministic) 2D 원형 강체 시뮬레이션 + 애니메이션 도우미
// 같은 입력이면 어느 브라우저에서도 같은 결과가 나오도록 + - * / sqrt 만 쓴다.
(function () {
  if (window.Phys) return;
  const TICK = 1000 / 60;

  // bodies: [{x, y, alive, ...}] · shot: {i, vx, vy}
  // opt: { r, min, max, sub, mu, drag, e, maxTicks, sample }
  function simulate(bodies, shot, opt) {
    const o = Object.assign({ r: 19, min: 31, max: 529, sub: 6, mu: 0.05, drag: 0.012, e: 0.9, wallFall: true, maxTicks: 720, sample: 1 }, opt || {});
    const B = bodies.map(b => ({ x: b.x, y: b.y, vx: 0, vy: 0, alive: !!b.alive, fall: 0, fx: 0, fy: 0 }));
    const n = B.length, D = o.r * 2, D2 = D * D, dt = 1 / o.sub;
    if (shot && B[shot.i]) { B[shot.i].vx = shot.vx; B[shot.i].vy = shot.vy; }
    const frames = [], hits = [];
    const snap = () => { const f = new Array(n * 3); for (let k = 0; k < n; k++) { const b = B[k]; f[k * 3] = b.x; f[k * 3 + 1] = b.y; f[k * 3 + 2] = b.alive ? 1 : b.fall > 0 ? 1 + b.fall : 0; } frames.push(f); };
    snap();
    let tick = 0;
    for (; tick < o.maxTicks; tick++) {
      let moving = false;
      for (let s = 0; s < o.sub; s++) {
        for (let k = 0; k < n; k++) {
          const b = B[k];
          if (b.fall > 0) { b.x += b.fx * dt; b.y += b.fy * dt; b.fx *= 0.995; b.fy *= 0.995; continue; }
          if (!b.alive) continue;
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (o.wallFall && (b.x < o.min || b.x > o.max || b.y < o.min || b.y > o.max)) { b.alive = false; b.fall = 0.0001; b.fx = b.vx * 0.6; b.fy = b.vy * 0.6; b.vx = b.vy = 0; }
        }
        for (let i = 0; i < n; i++) {
          const a = B[i]; if (!a.alive) continue;
          for (let j = i + 1; j < n; j++) {
            const b = B[j]; if (!b.alive) continue;
            const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
            if (d2 >= D2 || d2 === 0) continue;
            const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, push = (D - d) / 2;
            a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
            const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (rel > 0) {
              const j2 = rel * (1 + o.e) / 2;
              a.vx -= j2 * nx; a.vy -= j2 * ny; b.vx += j2 * nx; b.vy += j2 * ny;
              if (rel > 0.4) hits.push({ t: tick, p: rel, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
            }
          }
        }
      }
      for (let k = 0; k < n; k++) {
        const b = B[k];
        if (b.fall > 0) { b.fall += 1 / 24; if (b.fall >= 1) b.fall = 0; continue; }
        if (!b.alive) continue;
        const sp2 = b.vx * b.vx + b.vy * b.vy;
        if (sp2 === 0) continue;
        const sp = Math.sqrt(sp2), ns = sp * (1 - o.drag) - o.mu;
        if (ns <= 0.02) { b.vx = 0; b.vy = 0; continue; }
        const f = ns / sp; b.vx *= f; b.vy *= f; moving = true;
      }
      if (tick % o.sample === 0) snap();
      if (!moving && !B.some(b => b.fall > 0)) break;
    }
    snap();
    return { bodies: B.map((b, k) => ({ x: Math.round(b.x * 100) / 100, y: Math.round(b.y * 100) / 100, alive: b.alive })), frames, hits, ticks: tick, sample: o.sample };
  }

  // 녹화된 프레임을 시간에 맞춰 보간
  function at(rec, ms) {
    const f = rec.frames, step = TICK * rec.sample, k = ms / step, i = Math.floor(k);
    if (i >= f.length - 1) return { pos: f[f.length - 1], done: true };
    const a = f[i], b = f[i + 1], t = k - i, out = new Array(a.length);
    for (let q = 0; q < a.length; q += 3) { out[q] = a[q] + (b[q] - a[q]) * t; out[q + 1] = a[q + 1] + (b[q + 1] - a[q + 1]) * t; out[q + 2] = b[q + 2]; }
    return { pos: out, done: false };
  }
  const duration = rec => rec.frames.length * TICK * rec.sample;

  // 떨어져 튕기는 낙하 (중력 + 반발). h = 낙하 높이(px), 반환: 현재 위쪽 오프셋(px), done
  function drop(ms, h, e) {
    e = e == null ? 0.32 : e; const g = 0.0042; // px/ms²
    let t = ms, v = Math.sqrt(2 * g * h), first = v / g;
    if (t < first) return { y: h - 0.5 * g * t * t, done: false, bounce: 0 };
    t -= first; let k = 0;
    while (k < 3) { v *= e; const T = 2 * v / g; if (t < T) return { y: v * t - 0.5 * g * t * t, done: false, bounce: k + 1 }; t -= T; k++; }
    return { y: 0, done: true, bounce: 4 };
  }

  // 던져서 굴러 떨어지는 물체(윷·주사위). seed로 궤적이 정해진다.
  function toss(ms, seed, dur) {
    dur = dur || 900; const r = (k => { let x = (seed * 9301 + k * 49297) % 233280; return x / 233280; });
    const t = Math.min(1, ms / dur), up = 120 + r(1) * 60;
    const hop = t < 0.62 ? 4 * up * (t / 0.62) * (1 - t / 0.62) : (() => { const u = (t - 0.62) / 0.38; return 4 * up * 0.18 * u * (1 - u); })();
    const spin = (1 - Math.pow(1 - t, 3)) * (6 + r(2) * 6) * (r(3) < 0.5 ? -1 : 1);
    return { y: -hop, x: (r(4) - 0.5) * 40 * (1 - t), rot: spin, settle: t >= 1, t };
  }

  // 부드러운 감속 이징
  const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

  window.Phys = { TICK, simulate, at, duration, drop, toss, ease };
})();
