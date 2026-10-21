// 회사 주식 공통 (거래소 · 회사 탭이 같이 씀): 주가 · 매수 · 매도
(function () {
  if (window.WJC) return;
  const SHARES = 10000, FLOAT = 5000, TFEE = .01;
  const SA_VOL = { "코인·테마": 3 };
  const h2 = (a, b) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663); n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; };
  const noise = (s, x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f), a = h2(s, i) * 2 - 1, b = h2(s, i + 1) * 2 - 1; return a + (b - a) * u; };
  const seedOf = id => { let h = 2166136261; for (const ch of String(id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 1000000; };
  const ic = {};
  function secIdx(sec) { const W = window.WJ; if (!W) return 0; const k = sec + ":" + Math.floor(Date.now() / 15000); if (k in ic) return ic[k]; const L = W.STOCKS.filter(s => s.sector === sec), t = W.now(); return (ic[k] = L.length ? L.reduce((a, s) => a + W.change(s.i, t), 0) / L.length : 0); }
  const net = c => (c.fund || 0) - (c.loan || 0);
  const striking = c => !!(c && c.strike && c.strike.on > Date.now());
  // 주가 = 순자산 ÷ 1만 주 × 업종 분위기 × 회사 고유 변동 × 파업 할인 × 펀드 성과 배율
  // 펀드 성과 배율: 펀드 기준가(시작 1,000) 비율의 제곱 → 펀드가 +20%면 주가 +44%, −30%면 −51%
  function fundMul(c, at) { const W = window.WJ, pf = c && c.pf; if (!W || !pf || !(pf.units > 1e-9)) return 1; const tt = W.now ? W.now() : (at || Date.now()); let v = pf.cash || 0; Object.keys(pf.h || {}).forEach(k => { v += (pf.h[k].q || 0) * W.price(+k.slice(1), at || tt); }); const r = v / pf.units / 1000; return Math.max(.1, Math.min(6, r * r)); }
  function priceOf(id, c, at) { const t = (at || Date.now()) / 1000, s = seedOf(id), vol = SA_VOL[c.sector] || 1;
    const wave = 1 + (.12 * noise(s, t / 1800) + .05 * noise(s + 1, t / 240) + .015 * noise(s + 2, t / 30)) * vol;
    const mood = Math.max(.2, 1 + secIdx(c.sector || "IT·전자") / 100 * 3 * vol) * (striking(c) ? .7 : 1);
    return Math.max(100, Math.round(Math.max(0, net(c)) / SHARES * mood * Math.max(.3, wave) * fundMul(c, at) / 10) * 10); }
  const issued = c => Object.values(c.sh || {}).reduce((a, b) => a + (b || 0), 0);
  async function buy(id, c, q) { const W = window.WJ, me = W.uid(), db = await W.ready, p = priceOf(id, c), cost = p * q, fee = Math.ceil(cost * TFEE);
    if (!(await W.addCash(me, -(cost + fee)))) return { err: "현금이 부족해요 (" + W.fmt(cost + fee) + "준)" };
    let err = ""; const r = await db.ref("companies/" + id).transaction(x => { err = ""; if (!x || !x.ipo) { err = "상장된 회사가 아니에요"; return; } if (issued(x) + q > FLOAT) { err = "남은 주식이 " + (FLOAT - issued(x)) + "주뿐이에요"; return; } x.sh = x.sh || {}; x.sha = x.sha || {}; const q0 = x.sh[me] || 0; x.sha[me] = Math.round(((x.sha[me] || p) * q0 + p * q * (1 + TFEE)) / (q0 + q)); x.sh[me] = q0 + q; x.fund = (x.fund || 0) + cost; return x; }).catch(() => ({ committed: false }));
    if (!r.committed) { await W.addCash(me, cost + fee, true); return { err: err || "사지 못했어요" }; }
    W.log(me, "buy", { stock: c.name + " (회사)", qty: q, price: p }); db.ref("companyLog/" + id).push({ text: ((await db.ref("users/" + me + "/name").once("value")).val() || "?") + "님 " + q + "주 매수", amount: cost, ts: Date.now() }).catch(() => {});
    return { ok: true, p }; }
  async function sell(id, c, q) { const W = window.WJ, me = W.uid(), db = await W.ready, p = priceOf(id, c), pay = p * q; let err = "";
    const r = await db.ref("companies/" + id).transaction(x => { err = ""; if (!x) return; const own = (x.sh || {})[me] || 0; if (own < q) { err = "보유 주식이 부족해요"; return; } if ((x.fund || 0) < pay) { err = "회사에 돈이 없어 팔 수 없어요"; return; } x.sh[me] = own - q; if (!x.sh[me]) { delete x.sh[me]; if (x.sha) delete x.sha[me]; } x.fund -= pay; return x; }).catch(() => ({ committed: false }));
    if (!r.committed) return { err: err || "팔지 못했어요" };
    const got = pay - Math.ceil(pay * TFEE); await W.addCash(me, got, true); W.log(me, "sell", { stock: c.name + " (회사)", qty: q, price: p });
    db.ref("companyLog/" + id).push({ text: "주주 " + q + "주 매도", amount: -pay, ts: Date.now() }).catch(() => {});
    return { ok: true, p, got }; }
  // ---------- 거래소 연동: 상장한 증권사를 일반 종목처럼(번호 10000+) 보이게 한다 ----------
  const BASE = 10000, cos = {}, map = {}, rev = {}; let vlist = [];
  const vIdx = id => { let h = 2166136261; for (const ch of String(id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } let i = BASE + ((h >>> 0) % 89000); while (map[i] && map[i] !== id) i++; return i; };
  function rebuild() { vlist = Object.keys(cos).filter(k => cos[k] && cos[k].ipo).sort((a, b) => (cos[a].ipo.ts || 0) - (cos[b].ipo.ts || 0)).map(k => { const i = rev[k] || vIdx(k); map[i] = k; rev[k] = i; return { i, cid: k, name: cos[k].name, code: "F" + String(i).slice(-4), sector: "친구 증권사", v: true }; }); }
  const vPrice = (i, t) => { const id = map[i], x = id && cos[id]; return x ? priceOf(id, x, t) : 100; };
  const dayStart = t => { const D = 864e5, K = 9 * 36e5; return Math.floor((t + K) / D) * D - K; };
  function patch() { const W = window.WJ; if (!W || !W.ready) return false; if (W._vPatched) return true; W._vPatched = true;
    const wrap = (k, f) => { const o = W[k]; if (typeof o !== "function") return; W[k] = function (i) { return i >= BASE ? f.apply(null, arguments) : o.apply(W, arguments); }; };
    wrap("price", (i, t) => vPrice(i, t || Date.now())); wrap("open", i => vPrice(i, dayStart(W.now ? W.now() : Date.now())));
    wrap("prevClose", (i, t) => vPrice(i, dayStart(t || Date.now()) - 1)); wrap("change", (i, t) => { const p = vPrice(i, t || Date.now()), o = vPrice(i, dayStart(t || Date.now()) - 1); return (p - o) / o * 100; });
    wrap("limits", (i, t) => { const o = vPrice(i, dayStart(t || Date.now())); return { up: Math.round(o * 1.3), dn: Math.round(o * .7) }; }); wrap("limitState", () => 0);
    W.stockAt = i => i >= BASE ? (vlist.find(s => s.i === i) || { i, name: "상장 폐지", code: "-", sector: "친구 증권사", v: true }) : W.STOCKS[i];
    W.ready.then(db => db.ref("companies").on("value", s => { const v = s.val() || {}; Object.keys(cos).forEach(k => delete cos[k]); Object.assign(cos, v); rebuild(); }, () => {})).catch(() => {});
    return true; }
  if (!patch()) { const iv = setInterval(() => { if (patch()) clearInterval(iv); }, 30); }
  window.WJC = { fundMul, BASE, vstocks: () => vlist, cidOf: i => map[i], co: id => cos[id], SHARES, FLOAT, TFEE, priceOf, buy, sell, issued, secIdx, net };
})();
