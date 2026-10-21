(function () {
  const BG = window.BG;
  if (!BG || BG.artLoaded || !BG.art) return;
  const K = BG.art, C = K.C, S = BG.S;
  const { fill, stroke, dot, ring, txt, tex, woodGrain, table, sheet, token, goStone, pill } = K;
  const game = id => BG.GAMES.find(g => g.id === id);

  // 알까기: 바둑판 위의 흑백 알
  Object.assign(game('marbles'), { sides: ['흑', '백'], sideColor: ['#1F1D1B', '#F3F0E8'] });
  let mBoard = null;
  const marbleBoard = () => { if (mBoard) return mBoard; const cv = document.createElement('canvas'); cv.width = cv.height = S * 2; const c = cv.getContext('2d'); c.scale(2, 2);
    woodGrain(c, 0, 0, S, S, 22, '#C99A60', '#6E4A22', 31);
    c.save(); c.shadowColor = 'rgba(30,15,5,.35)'; c.shadowBlur = 10; c.shadowOffsetY = 4; fill(c, 31, 31, 498, 498, 6, '#DDB57A'); c.restore();
    woodGrain(c, 31, 31, 498, 498, 6, '#DDB57A', '#7A5326', 32);
    const st = 466 / 18; c.strokeStyle = 'rgba(52,32,12,.55)'; c.lineWidth = 1;
    for (let i = 0; i < 19; i++) { c.beginPath(); c.moveTo(47, 47 + i * st); c.lineTo(513, 47 + i * st); c.stroke(); c.beginPath(); c.moveTo(47 + i * st, 47); c.lineTo(47 + i * st, 513); c.stroke(); }
    [3, 9, 15].forEach(a => [3, 9, 15].forEach(b => dot(c, 47 + a * st, 47 + b * st, 3, 'rgba(52,32,12,.75)')));
    return (mBoard = cv); };
  game('marbles').draw = function (c, s, v) {
    const ui = v.ui || {}, P = window.Phys, now = Date.now();
    c.drawImage(marbleBoard(), 0, 0, S, S);
    let pos = null, cols = s.stones;
    if (s.rec && P) {
      if (ui.mN !== s.n) { ui.mN = s.n; ui.mStart = now; ui.mHit = 0; }
      const el = now - ui.mStart;
      if (el < P.duration(s.rec)) {
        pos = P.at(s.rec, el).pos; ui.animUntil = now + 60; cols = s.from || s.stones;
        while (ui.mHit < s.rec.hits.length && s.rec.hits[ui.mHit].t * P.TICK <= el) { const h = s.rec.hits[ui.mHit++]; if (ui.mHit < 6) try { WJ.sfx(h.p > 4 ? 'flip' : 'click'); } catch (e) {} }
      }
    }
    const draw1 = (x, y, p, sc, al, mark) => { c.save(); c.globalAlpha = al; if (sc !== 1) { c.translate(x, y); c.scale(sc, sc); c.translate(-x, -y); } goStone(c, x, y, 19, p === 0); c.restore(); if (mark) ring(c, x, y, 7, p === 0 ? '#F3F0E8' : '#1F1D1B', 2); };
    if (pos) {
      cols.forEach((o, k) => { const f = pos[k * 3 + 2]; if (!f) return; const x = pos[k * 3], y = pos[k * 3 + 1]; if (f > 1) { const q = f - 1; draw1(x, y + q * 10, o.p, 1 - q * .55, 1 - q, false); } else draw1(x, y, o.p, 1, 1, false); });
    } else s.stones.forEach((o, k) => { if (o.alive) draw1(o.x, o.y, o.p, 1, 1, s.last === k); });
    if (!pos && ui.drag) { const d = ui.drag, o = s.stones[d.i]; if (o && o.alive) {
      const dx = d.tx - d.x, dy = d.ty - d.y, m = Math.sqrt(dx * dx + dy * dy), g = this;
      if (m >= 10 && g.preview) {
        const key = d.i + ':' + Math.round(dx) + ':' + Math.round(dy);
        if (ui.pvKey !== key) { ui.pvKey = key; ui.pv = g.preview(s, { i: d.i, dx: Math.round(dx), dy: Math.round(dy) }); }
        const pv = ui.pv;
        if (pv) {
          const firstHit = pv.hits.length ? pv.hits[0].t : 1e9, lim = Math.min(pv.frames.length - 1, Math.round(Math.min(firstHit + 1, 70) / pv.sample));
          c.save(); c.setLineDash([3, 7]); c.lineCap = 'round'; c.strokeStyle = 'rgba(42,37,32,.55)'; c.lineWidth = 3; c.beginPath();
          for (let q = 0; q <= lim; q++) { const f = pv.frames[q]; q ? c.lineTo(f[d.i * 3], f[d.i * 3 + 1]) : c.moveTo(f[d.i * 3], f[d.i * 3 + 1]); } c.stroke(); c.restore();
          const fe = pv.frames[lim]; c.save(); c.globalAlpha = .35; goStone(c, fe[d.i * 3], fe[d.i * 3 + 1], 19, o.p === 0); c.restore();
          if (pv.hits.length) { const ft = Math.min(pv.frames.length - 1, Math.round((firstHit + 24) / pv.sample)), f0 = pv.frames[Math.round(firstHit / pv.sample)] || fe, f1 = pv.frames[ft];
            s.stones.forEach((b, k) => { if (k === d.i || !b.alive) return; const x0 = f0[k * 3], y0 = f0[k * 3 + 1], x1 = f1[k * 3], y1 = f1[k * 3 + 1], mv = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)); if (mv < 6) return;
              const ux = (x1 - x0) / mv, uy = (y1 - y0) / mv, L = Math.min(70, mv); c.save(); c.strokeStyle = b.p === o.p ? 'rgba(181,64,46,.75)' : 'rgba(47,107,79,.85)'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0 + ux * 22, y0 + uy * 22); c.lineTo(x0 + ux * (22 + L), y0 + uy * (22 + L)); c.stroke();
              const hx = x0 + ux * (22 + L), hy = y0 + uy * (22 + L); c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx - ux * 9 - uy * 6, hy - uy * 9 + ux * 6); c.lineTo(hx - ux * 9 + uy * 6, hy - uy * 9 - ux * 6); c.closePath(); c.fillStyle = c.strokeStyle; c.fill(); c.restore(); });
          }
        }
      }
      const pw = g.power ? (g.power(m) - 3) / 14 : 0;
      fill(c, S / 2 - 90, 8, 180, 12, 6, 'rgba(42,37,32,.25)'); fill(c, S / 2 - 90, 8, 180 * Math.max(0, Math.min(1, pw)), 12, 6, pw > .8 ? C.red : pw > .5 ? C.gold : C.ink);
      txt(c, '세기 ' + Math.round(Math.max(0, pw) * 100) + '%', S / 2 + 100, 14, 11, C.ink, 800, 'left');
    } }
  };

  // 카드 (Vector Playing Cards, public domain)
  const CARD_URL = n => 'https://cdn.jsdelivr.net/gh/hayeah/playing-cards-assets@master/svg-cards/' + ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'][n % 13] + '_of_' + ['spades', 'hearts', 'clubs', 'diamonds'][n / 13 | 0] + '.svg';
  for (let n = 0; n < 52; n++) K.img(CARD_URL(n));
  const suit = n => ['♠', '♥', '♣', '♦'][n / 13 | 0];
  const rank = n => ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][n % 13];
  const card = (c, n, x, y, w = 76, h = 110, rot = 0) => {
    c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot);
    c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 10; c.shadowOffsetY = 4; fill(c, -w / 2, -h / 2, w, h, 6, '#FFFFFF'); c.shadowColor = 'transparent';
    const im = K.img(CARD_URL(n));
    if (im) { c.save(); K.path(c, -w / 2, -h / 2, w, h, 6); c.clip(); c.drawImage(im, -w / 2 - 1, -h / 2 - 1, w + 2, h + 2); c.restore(); }
    else { const ink = (n / 13 | 0) % 2 ? '#C0392B' : '#1A1A1A'; txt(c, rank(n), -w / 2 + 10, -h / 2 + 14, 15, ink, 800, 'left'); txt(c, suit(n), 0, 6, 36, ink, 700); }
    stroke(c, -w / 2 + .5, -h / 2 + .5, w - 1, h - 1, 6, 'rgba(0,0,0,.18)', 1); c.restore();
  };
  const hv = hand => { let t = hand.reduce((v, n) => v + Math.min(10, n % 13 + 1), 0), a = hand.filter(n => n % 13 === 0).length; while (a-- && t + 10 <= 21) t += 10; return t; };
  game('blackjack').draw = (c, s, v) => {
    table(c, '#1F5A43');
    stroke(c, 14, 14, S - 28, S - 28, 16, 'rgba(251,247,239,.14)', 1.5);
    c.save(); c.strokeStyle = 'rgba(251,247,239,.16)'; c.lineWidth = 1.5; c.setLineDash([3, 6]); c.beginPath(); c.moveTo(40, 232); c.lineTo(520, 232); c.stroke(); c.restore();
    const me = v.me, rows = [[1 - me, 56, '상대'], [me, 252, '나']];
    rows.forEach(([p, y, who]) => { const hand = s.hands[p], t = hv(hand), bust = t > 21;
      txt(c, who + ' · ' + (p === 0 ? '선공' : '후공'), 40, y - 18, 13, 'rgba(251,247,239,.75)', 700, 'left');
      const step = Math.min(64, 330 / Math.max(1, hand.length)); hand.forEach((n, i) => card(c, n, 40 + i * step, y, 76, 110, ((i * 37 + p * 11) % 9 - 4) / 160));
      c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 6; c.shadowOffsetY = 3; dot(c, 470, y + 55, 38, bust ? C.red : t === 21 ? C.gold : C.cream); c.restore();
      ring(c, 470, y + 55, 31, bust || t === 21 ? 'rgba(251,247,239,.5)' : C.edge, 1.5);
      txt(c, t, 470, y + 52, 26, bust || t === 21 ? C.cream : C.ink, 900); txt(c, bust ? '버스트' : t === 21 ? '블랙잭' : s.stood[p] ? '멈춤' : '점', 470, y + 74, 10, bust || t === 21 ? C.cream : C.mute, 800);
    });
    const on = v.myTurn;
    K.button(c, null, 'hit', 34, 430, 237, 80, '카드 받기', 'gold', on, 22);
    K.button(c, null, 'stand', 289, 430, 237, 80, '멈추기', 'plain', on, 22);
    if (on && v.hover === 0) stroke(c, 32, 428, 241, 84, 12, C.cream, 2); if (on && v.hover === 1) stroke(c, 287, 428, 241, 84, 12, C.cream, 2);
    txt(c, s.last || '21에 가깝게, 넘기면 버스트', 280, 535, 13, 'rgba(251,247,239,.7)', 700);
  };

  // 메모리 카드: 도형 그림
  const SC = ['#C9952E', '#2F5B86', '#B5402E', '#2F6B4F', '#B85A6E', '#D07A2A', '#7D62A8', '#26364B'];
  const shape = (c, k, X, Y, r) => { c.save(); c.fillStyle = SC[k]; c.beginPath();
    if (k === 0) { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; c.lineTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr); } }
    else if (k === 1) { c.moveTo(X, Y - r); c.lineTo(X + r * .75, Y); c.lineTo(X, Y + r); c.lineTo(X - r * .75, Y); }
    else if (k === 2) c.arc(X, Y, r * .82, 0, 7);
    else if (k === 3) { c.moveTo(X, Y - r * .9); c.lineTo(X + r, Y + r * .75); c.lineTo(X - r, Y + r * .75); }
    else if (k === 4) { c.moveTo(X, Y + r * .85); c.bezierCurveTo(X - r * 1.3, Y - r * .1, X - r * .6, Y - r * 1.1, X, Y - r * .4); c.bezierCurveTo(X + r * .6, Y - r * 1.1, X + r * 1.3, Y - r * .1, X, Y + r * .85); }
    else if (k === 5) { c.arc(X, Y, r * .5, 0, 7); c.fill(); c.strokeStyle = SC[k]; c.lineWidth = r * .16; c.lineCap = 'round'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.moveTo(X + Math.cos(a) * r * .7, Y + Math.sin(a) * r * .7); c.lineTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); } c.stroke(); c.restore(); return; }
    else if (k === 6) { for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; c.moveTo(X + Math.cos(a) * r * .5 + r * .38, Y + Math.sin(a) * r * .5); c.arc(X + Math.cos(a) * r * .5, Y + Math.sin(a) * r * .5, r * .38, 0, 7); } c.fill(); dot(c, X, Y, r * .25, C.cream); c.restore(); return; }
    else { c.arc(X, Y, r * .85, Math.PI * .28, Math.PI * 1.72); c.arc(X + r * .38, Y - r * .05, r * .62, Math.PI * 1.6, Math.PI * .4, true); }
    c.closePath(); c.fill(); c.restore(); };
  game('memory').draw = (c, s, v) => {
    table(c, C.navy);
    for (let i = 0; i < 16; i++) { const x = 44 + (i % 4) * 118, y = 72 + (i / 4 | 0) * 118, show = s.matched[i] || s.last.includes(i) || v.sel === i;
      c.save(); if (s.matched[i]) c.globalAlpha = .55; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 8; c.shadowOffsetY = 4; fill(c, x, y, 104, 104, 10, show ? C.cream : '#8C3B2E'); c.restore();
      c.save(); if (s.matched[i]) c.globalAlpha = .55;
      if (show) { stroke(c, x + 6, y + 6, 92, 92, 6, C.edge, 1); shape(c, s.cards[i], x + 52, y + 52, 30); }
      else { stroke(c, x + 7, y + 7, 90, 90, 6, 'rgba(251,247,239,.55)', 1.2); c.save(); K.path(c, x + 11, y + 11, 82, 82, 4); c.clip(); c.strokeStyle = 'rgba(251,247,239,.12)'; c.lineWidth = 1.5; for (let k = -90; k < 100; k += 10) { c.beginPath(); c.moveTo(x + k, y); c.lineTo(x + k + 104, y + 104); c.stroke(); } c.restore(); c.save(); c.translate(x + 52, y + 52); c.rotate(Math.PI / 4); fill(c, -12, -12, 24, 24, 3, C.cream); c.restore(); }
      c.restore();
      if (v.sel === i) stroke(c, x - 2, y - 2, 108, 108, 12, '#E3B65A', 4);
    }
    txt(c, '같은 그림 두 장을 찾으세요', 280, 36, 14, 'rgba(251,247,239,.7)', 700);
  };

  // 보물 지뢰찾기
  game('mines').draw = (c, s, v) => {
    table(c, '#33505F');
    for (let i = 0; i < 36; i++) { const x = 42 + (i % 6) * 79, y = 55 + (i / 6 | 0) * 79, open = s.open[i], val = s.bag[i];
      if (!open) { c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowOffsetY = 3; c.shadowBlur = 3; fill(c, x, y, 69, 69, 8, '#D9CDB6'); c.restore(); fill(c, x, y + 63, 69, 6, 3, 'rgba(0,0,0,.12)'); tex(c, x, y, 69, 69, 8); if (s.last === i) ring(c, x + 34, y + 34, 5, C.ink2, 2); }
      else { fill(c, x, y, 69, 69, 8, val < 0 ? '#E9CFC6' : val === 3 ? '#F3E6C4' : '#EFE8DA'); stroke(c, x + .5, y + .5, 68, 68, 8, 'rgba(0,0,0,.12)', 1);
        if (val < 0) { c.strokeStyle = C.ink; c.lineWidth = 3; c.lineCap = 'round'; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; c.beginPath(); c.moveTo(x + 34 - Math.cos(a) * 20, y + 34 - Math.sin(a) * 20); c.lineTo(x + 34 + Math.cos(a) * 20, y + 34 + Math.sin(a) * 20); c.stroke(); } dot(c, x + 34, y + 34, 13, C.ink); dot(c, x + 30, y + 30, 3.5, 'rgba(255,255,255,.5)'); }
        else if (val === 3) { c.beginPath(); c.moveTo(x + 22, y + 24); c.lineTo(x + 47, y + 24); c.lineTo(x + 55, y + 32); c.lineTo(x + 34, y + 54); c.lineTo(x + 14, y + 32); c.closePath(); c.fillStyle = C.gold; c.fill(); c.beginPath(); c.moveTo(x + 22, y + 24); c.lineTo(x + 47, y + 24); c.lineTo(x + 55, y + 32); c.lineTo(x + 14, y + 32); c.closePath(); c.fillStyle = 'rgba(255,255,255,.3)'; c.fill(); txt(c, '+3', x + 58, y + 60, 10, C.goldD, 800, 'right'); }
        else dot(c, x + 34, y + 34, 4, C.mute);
        if (val < 0) txt(c, '-2', x + 58, y + 60, 10, C.red, 800, 'right'); }
      if (v.myTurn && v.hover === i && !open) stroke(c, x + 2, y + 2, 65, 65, 7, C.ink, 2.5);
    }
    txt(c, '보석 +3 · 빈 칸 +1 · 지뢰 -2', 280, 28, 13, 'rgba(251,247,239,.75)', 700);
  };

  // 빙고
  const lines = []; for (let r = 0; r < 5; r++) lines.push(Array.from({ length: 5 }, (_, k) => r * 5 + k)); for (let k = 0; k < 5; k++) lines.push(Array.from({ length: 5 }, (_, r) => r * 5 + k)); lines.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
  const PC = ['', '#B5402E', '#2F5B86'];
  game('bingo').sideColor = ['#B5402E', '#2F5B86']; game('bingo').sides = ['빨강', '파랑'];
  game('bingo').draw = (c, s, v) => {
    table(c, C.navy); sheet(c, 22, 15, 516, 532, 12, C.cream);
    txt(c, '빙고', 280, 37, 17, C.ink2, 800);
    for (let i = 0; i < 25; i++) { const x = 50 + (i % 5) * 92, y = 59 + (i / 5 | 0) * 92, p = s.claimed[i];
      stroke(c, x + .5, y + .5, 83, 83, 6, C.edge, 1.2);
      if (i === 12 && !p) { c.save(); c.globalAlpha = .35; c.fillStyle = C.gold; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 14 : 32; c.lineTo(x + 42 + Math.cos(a) * rr, y + 42 + Math.sin(a) * rr); } c.fill(); c.restore(); }
      if (p) { c.save(); c.globalAlpha = .88; dot(c, x + 42, y + 42, 33, PC[p]); c.restore(); }
      txt(c, s.numbers[i], x + 42, y + 43, 28, p ? C.cream : C.ink, 800);
      if (v.myTurn && v.hover === i && !p) { c.save(); c.globalAlpha = .25; dot(c, x + 42, y + 42, 33, PC[v.me + 1]); c.restore(); }
      if (s.last === i) dot(c, x + 72, y + 12, 3.5, C.ink2);
    }
    lines.forEach(L => { const p = s.claimed[L[0]]; if (!p || !L.every(k => s.claimed[k] === p)) return; const a = L[0], b = L[4]; c.save(); c.strokeStyle = PC[p]; c.globalAlpha = .55; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(92 + (a % 5) * 92, 101 + (a / 5 | 0) * 92); c.lineTo(92 + (b % 5) * 92, 101 + (b / 5 | 0) * 92); c.stroke(); c.restore(); });
  };
  BG.artLoaded = true;
})();
