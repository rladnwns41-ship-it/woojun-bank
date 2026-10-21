(function () {
  if (window.WJ) return;
  const cfg = {
    apiKey: "AIzaSyB4ZqXKenJfMwg0WBgtdVYyNv_AAzUbPXM",
    authDomain: "game---6-cde77.firebaseapp.com",
    databaseURL: "https://game---6-cde77-default-rtdb.firebaseio.com",
    projectId: "game---6-cde77",
    storageBucket: "game---6-cde77.firebasestorage.app",
    messagingSenderId: "254412023911",
    appId: "1:254412023911:web:9d415c2943cdc64f7e8cc2",
    measurementId: "G-KCYNVN85G6"
  };
  const V = "10.12.2";
  const load = (src) => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  let _db = null, _auth = null, _accountKey = null;
  const ready = (async () => {
    if (!window.firebase) await load(`https://www.gstatic.com/firebasejs/${V}/firebase-app-compat.js`);
    if (!firebase.database) await load(`https://www.gstatic.com/firebasejs/${V}/firebase-database-compat.js`);
    if (!firebase.auth) await load(`https://www.gstatic.com/firebasejs/${V}/firebase-auth-compat.js`);
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    _db = firebase.database();
    _auth = firebase.auth();
    return _db;
  })();
  // ---------- 브라우저 ID (쿠키 + localStorage, 10년) ----------
  function deviceId() {
    const m = document.cookie.match(/(?:^|; )wj_did=([A-Za-z0-9_-]{16,40})/);
    let id = m ? m[1] : null;
    try { id = id || localStorage.getItem("wj_did"); } catch (e) {}
    if (!id) { const a = new Uint8Array(15); crypto.getRandomValues(a); id = Array.from(a, b => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[b % 56]).join(""); }
    document.cookie = "wj_did=" + id + ";path=/;max-age=315360000;SameSite=Lax" + (location.protocol === "https:" ? ";Secure" : "");
    try { localStorage.setItem("wj_did", id); } catch (e) {}
    return id;
  }
  const DID = deviceId();
  // ---------- 부계 방지: 기기 지문 (쿠키를 지워도 같은 값) ----------
  const FP = (() => { try { const c = document.createElement("canvas"), x = c.getContext("2d"); c.width = 220; c.height = 30; x.textBaseline = "top"; x.font = "16px Arial"; x.fillStyle = "#f60"; x.fillRect(100, 1, 60, 20); x.fillStyle = "#069"; x.fillText("WJ bank ✓ 우준", 2, 4);
    const raw = [navigator.userAgent, navigator.language, (navigator.languages || []).join(","), Intl.DateTimeFormat().resolvedOptions().timeZone, screen.width + "x" + screen.height + "x" + screen.colorDepth, navigator.hardwareConcurrency, navigator.deviceMemory, navigator.platform, navigator.maxTouchPoints, c.toDataURL()].join("|");
    let h1 = 0x811c9dc5, h2 = 0x1234567; for (let i = 0; i < raw.length; i++) { const ch = raw.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 16777619); h2 = Math.imul(h2 ^ ch, 2246822519); }
    return "f" + (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36); } catch (e) { return "f0"; } })();
  function altScreen(owner) {
    const show = () => { document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F2F4F6;font-family:Pretendard,system-ui,sans-serif;padding:24px"><div style="max-width:420px;background:#fff;border-radius:22px;padding:32px;text-align:center"><div style="font-size:22px;font-weight:800;color:#191F28">부계정은 쓸 수 없어요</div><div style="font-size:14px;color:#6B7684;margin-top:10px;line-height:1.6">이 브라우저는 이미 <b>' + String(owner || "다른 계정").replace(/[<>&"]/g, "") + '</b> 계정이 쓰고 있어요.<br>한 사람당 계정 하나만 쓸 수 있어요. 같은 기기를 함께 쓰는 거라면 관리자에게 허용을 요청하세요.</div><a href="index.html" style="display:inline-block;margin-top:18px;color:#3182F6;font-weight:700;font-size:14px">원래 계정으로 로그인</a><div style="font-size:12px;color:#B0B8C1;margin-top:18px;font-family:ui-monospace,monospace">' + DID + '</div></div></div>'; };
    if (document.body) show(); else document.addEventListener("DOMContentLoaded", show);
  }
  // 이 브라우저의 주인 계정. 없으면 null
  async function deviceOwner() { const db = await ready; const s = await db.ref("deviceOwners/" + DID).once("value").catch(() => null); return s ? s.val() : null; }
  // 두 계정이 같은 브라우저를 쓴 적이 있는지 (브라우저 ID만 비교. 기기 지문은 같은 기종이면 겹쳐서 차단에 안 씀)
  async function isLinked(a, b) {
    if (!a || !b || a === b) return false; const db = await ready;
    const [A, B] = await Promise.all([a, b].map(k => db.ref("users/" + k).once("value").then(s => s.val() || {}).catch(() => ({}))));
    if (A.altOk || B.altOk) return false;
    const share = (x, y) => Object.keys(x || {}).some(k => (y || {})[k]);
    return share(A.devices, B.devices);
  }
  function banScreen(why) {
    const show = () => { document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F2F4F6;font-family:Pretendard,system-ui,sans-serif;padding:24px"><div style="max-width:420px;background:#fff;border-radius:22px;padding:32px;text-align:center"><div style="font-size:22px;font-weight:800;color:#191F28">이용이 정지됐어요</div><div style="font-size:14px;color:#6B7684;margin-top:10px;line-height:1.6">' + why + '<br>문의는 관리자에게 해 주세요.</div><div style="font-size:12px;color:#B0B8C1;margin-top:18px;font-family:ui-monospace,monospace">' + DID + '</div></div></div>'; };
    if (document.body) show(); else document.addEventListener("DOMContentLoaded", show);
  }
  const authReady = ready.then(() => new Promise((resolve, reject) => {
    let off = null;
    off = _auth.onAuthStateChanged(async user => {
      if (off) off();
      try {
        const bd = (await _db.ref("bans/devices/" + DID).once("value").catch(() => null));
        if (bd && bd.val()) { banScreen("이 브라우저는 정지됐어요."); if (user) await _auth.signOut(); return; }
        _accountKey = user ? await accountKeyFor(user) : null;
        if (user) {
          const bu = await _db.ref("bans/uids/" + user.uid).once("value").catch(() => null);
          if (bu && bu.val()) { banScreen("이 계정은 정지됐어요."); await _auth.signOut(); _accountKey = null; return; }
          const me = (await _db.ref("users/" + _accountKey).once("value").catch(() => null))?.val() || {};
          const own = await _db.ref("deviceOwners/" + DID).once("value").catch(() => null), ov = own && own.val();
          if (ov && ov.k && ov.k !== _accountKey && !me.altOk) {
            _db.ref("users/" + _accountKey + "/altOf").set({ k: ov.k, n: ov.n || "", t: Date.now() }).catch(() => {});
            altScreen(ov.n); await _auth.signOut(); _accountKey = null; return;
          }
          if (!ov && me.name) _db.ref("deviceOwners/" + DID).transaction(v => v || { k: _accountKey, n: me.name, t: Date.now() }).catch(() => {});
          _db.ref("users/" + _accountKey + "/fps/" + FP).set(Date.now()).catch(() => {});
          _db.ref("users/" + _accountKey + "/devices/" + DID).set({ t: Date.now(), ua: navigator.userAgent.slice(0, 120) }).catch(() => {});
          _db.ref("users/" + _accountKey + "/authUid").set(user.uid).catch(() => {});
          collectLoan(_accountKey).catch(() => {});
        }
        resolve(user);
      } catch (e) { reject(e); }
    }, reject);
  }));
  // ---------- 서버 API (Go 서버) ----------
  async function api(path, body) {
    await ready; const u = _auth.currentUser; if (!u) throw new Error("로그인이 필요해요");
    const tok = await u.getIdToken();
    let r; try { r = await fetch("/api/" + path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok, "X-WJ-Device": DID }, body: JSON.stringify(body || {}) }); }
    catch (e) { throw new Error("서버에 연결하지 못했어요"); }
    let j = {}; try { j = await r.json(); } catch (e) { if (!r.ok) throw new Error("서버가 응답하지 않아요 (" + r.status + ")"); }
    if (!r.ok || j.error) throw new Error(j.error || "요청 실패 (" + r.status + ")");
    return j;
  }
  // ---------- 게스트 ----------
  async function guestLogin() {
    await ready; const ow = await deviceOwner(); if (ow && ow.k) throw new Error("이 브라우저에는 이미 " + (ow.n || "다른") + " 계정이 있어요. 그 계정으로 로그인하세요"); const cred = await _auth.signInAnonymously(); const k = cred.user.uid;
    const snap = await _db.ref("users/" + k).once("value");
    if (!snap.exists()) { const nm = "게스트" + DID.slice(0, 4).toUpperCase(); await _db.ref("users/" + k).set({ name: nm, fps: { [FP]: Date.now() }, cash: START_CASH, loan: 0, createdAt: Date.now(), authUid: k, guest: true }); log(k, "join", { amount: START_CASH }); _db.ref("deviceOwners/" + DID).transaction(v => v || { k, n: nm, t: Date.now() }).catch(() => {}); }
    _accountKey = k; return k;
  }
  function isGuest() { return !!(_auth && _auth.currentUser && _auth.currentUser.isAnonymous); }

  // ---------- stocks ----------
  const SECTORS = ["전체", "IT·전자", "금융", "유통", "식품", "자동차", "바이오", "엔터·게임", "에너지·화학", "중공업", "통신", "코인·테마"];
  const RAW = {
    "IT·전자": ["우준전자", "우준반도체", "도윤테크", "하늘소프트", "별빛디스플레이", "민준모바일", "서연AI", "코딩랩스"],
    "금융": ["우준은행", "도윤증권", "지호캐피탈", "하은생명", "바다카드"],
    "유통": ["도윤마트", "우준백화점", "편의24", "시우홈쇼핑", "새벽배송"],
    "식품": ["맛나식품", "우준라면", "달콤제과", "지우치킨", "초록음료", "한입베이커리"],
    "자동차": ["우준모터스", "질주오토", "번개배터리", "도윤타이어"],
    "바이오": ["생명바이오", "하은제약", "지안헬스", "우준메디"],
    "엔터·게임": ["별빛엔터", "도파민게임즈", "픽셀스튜디오", "우주웹툰", "하이라이브"],
    "에너지·화학": ["태양에너지", "우준화학", "수소파워", "바람풍력"],
    "중공업": ["도윤건설", "우준중공업", "강철조선", "하늘항공"],
    "통신": ["우준텔레콤", "번개5G"],
    "코인·테마": ["도지랑코인", "문샷코인", "김치코인", "로켓밈", "우준코인", "하이퍼토큰", "개미코인", "떡상코인"]
  };
  const VOL = { "IT·전자": 0.9, "금융": 0.6, "유통": 0.7, "식품": 0.65, "자동차": 0.95, "바이오": 1.4, "엔터·게임": 1.25, "에너지·화학": 1.0, "중공업": 0.8, "통신": 0.55, "코인·테마": 2.1 };

  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
  function h2(a, b) { return hash(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663)); }
  function noise(seed, x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); const a = h2(seed, i) * 2 - 1, b = h2(seed, i + 1) * 2 - 1; return a + (b - a) * u; }

  const STOCKS = [];
  let idx = 0;
  for (const sec of Object.keys(RAW)) for (const name of RAW[sec]) {
    const seed = 1000 + idx * 37;
    const r = h2(seed, 1);
    const coin = sec === "코인·테마";
    const base = coin ? Math.round(50 + r * r * 4000) : Math.round((3000 + r * r * 280000) / 10) * 10;
    STOCKS.push({ i: idx, code: String(100000 + Math.floor(h2(seed, 2) * 899999)).slice(0, 6), name, sector: sec, seed, base, vol: VOL[sec] * (0.8 + h2(seed, 3) * 0.5), evP: coin ? 0.32 : 0.13 });
    idx++;
  }
  const EPOCH = 1760000000;
  const OCT = [[21600, 0.33], [3600, 0.15], [600, 0.075], [120, 0.04], [25, 0.018], [5, 0.007]];
  const EW = 300;
  function tickSize(p) { return p < 2000 ? 1 : p < 5000 ? 5 : p < 20000 ? 10 : p < 50000 ? 50 : p < 200000 ? 100 : p < 500000 ? 500 : 1000; }
  function eventAt(s, j) {
    if (h2(s.seed * 7 + 999, j) >= s.evP) return null;
    const start = j * EW + h2(s.seed, j + 5) * EW * 0.6;
    const mag = (h2(s.seed + 3, j) * 2 - 1) * 0.38 * Math.min(s.vol, 1.6);
    return { start, mag };
  }
  function rawLog(s, t) {
    let lp = 0;
    for (let k = 0; k < OCT.length; k++) lp += OCT[k][1] * noise(s.seed * 31 + k, t / OCT[k][0]);
    lp *= s.vol;
    const w = Math.floor(t / EW);
    for (let j = w - 3; j <= w; j++) {
      const e = eventAt(s, j); if (!e) continue;
      const dt = t - e.start; if (dt <= 0) continue;
      lp += e.mag * Math.min(1, dt / 12) * Math.exp(-Math.max(0, dt - 12) / 260);
    }
    return lp;
  }
  const LIMIT = 0.3, rawOpen = {};
  function price(i, t) {
    const s = STOCKS[i];
    // A closed market keeps the last open day's final quote on charts and accounts.
    let kstDay = Math.floor((t + EPOCH + 32400) / 86400);
    let weekday = new Date(kstDay * 86400000).getUTCDay();
    if (weekday === 0 || weekday === 3 || weekday === 6) {
      do { kstDay--; weekday = new Date(kstDay * 86400000).getUTCDay(); } while (weekday === 0 || weekday === 3 || weekday === 6);
      t = kstDay * 86400 - 32400 + 86399 - EPOCH;
    }
    // 상한가·하한가: 전일 종가(기준가) ±30%, 호가 단위로 내림/올림
    const L = bandOf(i, kstDay);
    const p = squash(s.base * Math.exp(rawLog(s, t)), L.base);
    if (p >= L.up) return L.up;
    if (p <= L.dn) return L.dn;
    const ts = tickSize(p);
    return Math.min(L.up, Math.max(L.dn, Math.max(1, Math.round(p / ts) * ts)));
  }
  const closedDay = d => { const w = new Date(d * 86400000).getUTCDay(); return w === 0 || w === 3 || w === 6; };
  const prevTradeDay = d => { d--; while (closedDay(d)) d--; return d; };
  const rawClose = (i, d) => { const s = STOCKS[i]; return s.base * Math.exp(rawLog(s, d * 86400 - 32400 + 86399 - EPOCH)); };
  const band = base => { const u = base * (1 + LIMIT), w = base * (1 - LIMIT); return { base, up: Math.max(1, Math.floor(u / tickSize(u)) * tickSize(u)), dn: Math.max(1, Math.ceil(w / tickSize(w)) * tickSize(w)) }; };
  const bandCache = {}, SQ_K = 0.55, SQ_A = 0.32;
  // 하루 등락을 완만하게 눌러서 상한가·하한가는 큰 호재·악재 때만 닿게 한다
  const squash = (raw, base) => base * Math.exp(SQ_A * Math.tanh(Math.log(raw / base) * SQ_K / SQ_A));
  // 기준가 = 전일 종가. 전일 종가도 그 전날 기준 ±30% 안에서 정해진 값이다.
  function bandOf(i, d) {
    const k = i + ":" + d; if (bandCache[k]) return bandCache[k];
    const d1 = prevTradeDay(d), d2 = prevTradeDay(d1), b2 = band(rawClose(i, d2)), r1 = rawClose(i, d1);
    const q1 = squash(r1, b2.base), t1 = tickSize(q1), c1 = Math.min(b2.up, Math.max(b2.dn, Math.round(q1 / t1) * t1));
    return (bandCache[k] = band(c1));
  }
  const tradeDayOf = t => { let d = Math.floor((t + EPOCH + 32400) / 86400); while (closedDay(d)) d--; return d; };
  // 상한가/하한가 상태: 1 = 상한가, -1 = 하한가, 0 = 보통
  function limits(i, t) { return bandOf(i, tradeDayOf(t == null ? now() : t)); }
  function prevClose(i, t) { return limits(i, t).base; }
  function limitState(i, t) { const L = limits(i, t), p = price(i, t); return p >= L.up ? 1 : p <= L.dn ? -1 : 0; }
  function now() { return Date.now() / 1000 - EPOCH; }
  setInterval(() => { if (_accountKey) collectLoan(_accountKey).catch(() => {}); }, 60000);
  function dayStart() { return Math.floor((Date.now() / 1000 + 32400) / 86400) * 86400 - 32400 - EPOCH; }
  const openCache = {};
  function open(i) { const k = Math.floor(dayStart()) + ":" + i; if (!(k in openCache)) openCache[k] = price(i, dayStart()); return openCache[k]; }
  function change(i, t) { const o = prevClose(i, t); return (price(i, t) - o) / o * 100; }
  // Market calendar uses Korea time for every player, regardless of device timezone.
  // 관리자 config/market: "open" = 요일 상관없이 열기, "closed" = 강제 마감, 없으면 자동(수·토·일 휴장)
  function marketOpen(at) {
    if (!at && CONFIG.market === "open") return true;
    if (!at && CONFIG.market === "closed") return false;
    const kstDay = Math.floor(((at || new Date()).getTime() / 1000 + 32400) / 86400);
    return ![0, 3, 6].includes(new Date(kstDay * 86400000).getUTCDay());
  }
  // 해킹: 한국 시간 월(1)·수(3)요일에만
  const kstWeekday = () => new Date(Math.floor((Date.now() / 1000 + 32400) / 86400) * 86400000).getUTCDay();
  // 관리자 설정 (config): hackEnabled, tax { sell, gain }
  const CONFIG = { hackEnabled: true };
  ready.then(db => db.ref("config").on("value", s => { const c = s.val() || {}; CONFIG.tabs = c.tabs || {}; CONFIG.market = c.market || ""; CONFIG.hackEnabled = c.hackEnabled !== false && CONFIG.tabs.hack !== false; const t = c.tax || {}; TAX.sell = Number.isFinite(t.sell) ? t.sell : 0.003; TAX.gain = Number.isFinite(t.gain) ? t.gain : 0.15; TAX.buy = Number.isFinite(t.buy) ? t.buy : 0.003; CONFIG.loaded = true; try { window.dispatchEvent(new Event("wj-config")); } catch (e) {} }, () => {}));
  const hackDisabled = () => !CONFIG.hackEnabled;
  // 탭 켜짐 여부: trade · bank · games · coin · ranking · hack
  const tabOn = key => !CONFIG.tabs || CONFIG.tabs[key] !== false;
  const hackOpen = () => CONFIG.hackEnabled && [1, 3].includes(kstWeekday());
  // 세금: 매도 금액의 0.2% 거래세 + 수익의 10% 양도소득세
  // 기본값. 관리자 설정(config/tax)이 있으면 그 값으로 바뀐다. buy = 매수 수수료
  const TAX = { sell: 0.003, gain: 0.15, buy: 0.003 };
  const MIN_HOLD = 0; // 보유 시간 제한 없음 (바로 팔 수 있음)
  const taxOf = (gross, pnl, gm) => Math.round(gross * TAX.sell + Math.max(0, pnl) * TAX.gain * (gm || 1));
  function marketStatus() { if (CONFIG.market === "closed") return "장마감 · 관리자가 장을 닫았어요"; return marketOpen() ? (CONFIG.market === "open" ? "거래 가능 · 특별 개장" : "거래 가능") : "장마감 · 수·토·일 휴장"; }

  const GOOD = ["대형 수주 계약 체결", "깜짝 실적 발표", "신제품 사전예약 폭주", "외국인 대량 매수", "정부 지원 수혜주 선정", "글로벌 기업과 협업 발표", "일론 형이 트윗함"];
  const BAD = ["대표 횡령 의혹", "제품 리콜 사태", "공매도 폭탄 투하", "실적 쇼크", "공장 화재 발생", "핵심 인력 대거 이탈", "세무조사 착수"];
  const NEWS_LAG = 45; // 뉴스는 가격이 이미 움직인 뒤 45초 늦게 뜬다
  function news(t, limit) {
    const out = []; const w = Math.floor(t / EW);
    for (let j = w; j >= w - 4; j--) for (const s of STOCKS) {
      const e = eventAt(s, j); if (!e || e.start + NEWS_LAG > t) continue;
      const good = e.mag > 0; const list = good ? GOOD : BAD;
      out.push({ i: s.i, name: s.name, good, at: e.start + NEWS_LAG, mag: e.mag, text: `${s.name}, ${list[Math.floor(h2(s.seed, j * 3) * list.length)]}` });
    }
    out.sort((a, b) => b.at - a.at);
    return out.slice(0, limit || 12);
  }

  // ---------- money ----------
  const START_CASH = 1000000;
  const fmt = (n) => Math.round(n || 0).toLocaleString("ko-KR");
  const signed = (n) => (n > 0 ? "+" : n < 0 ? "-" : "") + fmt(Math.abs(n));
  const pct = (n) => (n > 0 ? "+" : "") + (n || 0).toFixed(2) + "%";
  function holdingsValue(u, t) { let v = 0; const h = (u && u.holdings) || {}; for (const k in h) v += (h[k].q || 0) * price(+k.slice(1), t); return v; }
  function netWorth(u, t) { return (u.cash || 0) + holdingsValue(u, t) - (u.loan || 0) - (u.yLoan || 0); }
  // 청년 대출: 가입 7일 이내 + 순자산 500만준 미만이면 한 번, 최대 300만준을 이자 없이 7일. 기한을 넘기면 일반 대출로 넘어가 연체 이자가 붙는다
  const YOUTH = { days: 7, maxNet: 5e6, max: 3e6, term: 7 * 864e5 };
  function youthState(u, t) { u = u || {}; const age = Date.now() - (u.createdAt || 0), nw = (u.cash || 0) + holdingsValue(u, t || Date.now()) - (u.loan || 0) - (u.yLoan || 0);
    if (u.yLoan > 0) return { ok: false, has: true, why: "청년 대출 이용 중" };
    if (u.yUsed) return { ok: false, why: "청년 대출은 한 번만 받을 수 있어요" };
    if (!u.createdAt || age > YOUTH.days * 864e5) return { ok: false, why: "가입 " + YOUTH.days + "일 이내만 받을 수 있어요" };
    if (nw >= YOUTH.maxNet) return { ok: false, why: "순자산 " + (YOUTH.maxNet / 1e4) + "만준 미만만 받을 수 있어요" };
    return { ok: true, left: YOUTH.days * 864e5 - age }; }

  // ---------- 보이지 않는 균형 조절: 가난할수록 보상 ↑, 부자일수록 ↓ ----------
  function eqTableOf(U, t) { const nets = {}, arr = []; for (const k in U || {}) { const u = U[k]; if (!u || u.banned || typeof u.cash !== "number") continue; const v = Math.max(1, netWorth(u, t)); nets[k] = v; arr.push(v); } arr.sort((a, b) => a - b); const median = Math.max(START_CASH, arr.length ? arr[Math.floor(arr.length / 2)] : START_CASH); return { nets, median }; }
  // 보상 배율 0.6 ~ 1.6
  function eqMul(U, k, t) { const w = eqTableOf(U, t == null ? now() : t), v = w.nets[k] || w.median; return Math.min(1.6, Math.max(0.6, Math.sqrt(w.median / v))); }
  // 양도세 배율 0.7 ~ 1.5 (부자일수록 높음)
  function eqTax(U, k, t) { const w = eqTableOf(U, t == null ? now() : t), v = w.nets[k] || w.median; return Math.min(1.5, Math.max(0.7, Math.sqrt(v / w.median))); }
  // 해킹 확률 보정 −10%p ~ +10%p (나보다 부자를 털 때 유리)
  function eqHack(U, me, target, t) { const w = eqTableOf(U, t == null ? now() : t), a = w.nets[me] || w.median, b = w.nets[target] || w.median; return Math.min(0.1, Math.max(-0.1, 0.06 * Math.log2(b / a))); }
  let eqCache = null, eqAt = 0;
  async function boost(k) { if (!eqCache || Date.now() - eqAt > 180000) { const db = await ready; eqCache = (await db.ref("users").once("value")).val() || {}; eqAt = Date.now(); } return eqMul(eqCache, k); }
  function uid() { return _auth && _auth.currentUser ? _accountKey : null; }
  function requireUser() { const u = uid(); if (!u) { location.href = "index.html"; return null; } return u; }
  async function logout() { _accountKey = null; localStorage.removeItem("wj_uid"); if (_auth) await _auth.signOut(); location.href = "index.html"; }
  async function activateAccount(user) {
    _accountKey = await accountKeyFor(user);
    return _accountKey;
  }
  async function accountKeyFor(user) {
    const db = await ready;
    const own = await db.ref("users/" + user.uid).once("value").catch(() => null);
    if (own && own.exists() && own.val().name && typeof own.val().cash === "number") return user.uid;
    const link = await db.ref("authLinks/" + user.uid).once("value").catch(() => null);
    return (link && link.val()) || user.uid;
  }
  function setAccountKey(key) { _accountKey = key; }
  const keyOf = (name) => name.trim().replace(/[.#$\[\]\/]/g, "_");

  async function addCash(u, delta, allowNeg) {
    const db = await ready; let ok = false;
    const r = await db.ref("users/" + u + "/cash").transaction((c) => {
      if (c === null) return c;
      const n = (c || 0) + delta;
      if (!allowNeg && n < 0) { ok = false; return; }
      ok = true; return n;
    });
    return r.committed && ok;
  }
  // ---------- 대출: 기한 지나면 연체 이자 붙여 자동 상환 ----------
  const DAY = 86400000, LOAN_TERM = 3 * DAY, LOAN_PENALTY = 0.05;
  async function collectLoan(u) {
    const db = await ready; let paid = 0, added = 0;
    const r = await db.ref("users/" + u).transaction(x => {
      paid = 0; added = 0;
      if (x && x.yLoan > 0 && x.yDue && Date.now() > x.yDue) { x.loan = (x.loan || 0) + x.yLoan; x.yLoan = 0; x.yDue = null; if (!x.loanDue) x.loanDue = Date.now(); }
      if (!x || !(x.loan > 0)) return x;
      const now = Date.now();
      if (!x.loanDue) { x.loanDue = now + LOAN_TERM; return x; }
      if (now < x.loanDue) return;
      const from = Math.max(x.loanCharged || x.loanDue, x.loanDue), days = Math.floor((now - from) / DAY) + (x.loanCharged ? 0 : 1);
      if (days > 0) { const nl = Math.round(x.loan * Math.pow(1 + LOAN_PENALTY, days)); added = nl - x.loan; x.loan = nl; x.loanCharged = (x.loanCharged || x.loanDue) + days * DAY; }
      const pay = Math.min(Math.max(0, x.cash || 0), x.loan);
      if (!pay && !added) return;
      x.cash = (x.cash || 0) - pay; x.loan -= pay; paid = pay;
      if (x.loan <= 0) { x.loan = 0; x.loanDue = null; x.loanCharged = null; }
      return x;
    });
    if (r.committed && (paid || added)) {
      log(u, "autorepay", { amount: -paid, text: "대출 기한 초과 · 연체 이자 " + fmt(added) + "준 · 자동 상환 " + fmt(paid) + "준" });
      const msg = "대출 기한이 지나 <b>" + fmt(paid) + "준</b>이 자동으로 빠져나갔어요" + (added ? " (연체 이자 " + fmt(added) + "준)" : "");
      const t = () => { try { WJUI.toast(msg, { icon: "🏦", html: true }); } catch (e) {} };
      setTimeout(t, 1200);
    }
    return { paid, added };
  }
  async function log(u, type, data) { const db = await ready; db.ref("history/" + u).push(Object.assign({ type, ts: Date.now() }, data)); }

  // ---------- sfx ----------
  let ac = null;
  function ctx() { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); return ac; }
  function tone(f, start, dur, type, vol, f2) {
    const c = ctx(); const o = c.createOscillator(); const g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f, c.currentTime + start);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, c.currentTime + start + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, c.currentTime + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination); o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
  }
  function sfx(name) {
    if (localStorage.getItem("wj_mute") === "1") return;
    try {
      if (name === "buy") { tone(520, 0, 0.12, "square", 0.06, 880); tone(880, 0.08, 0.15, "sine", 0.1); }
      else if (name === "win") { [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, k * 0.07, 0.25, "triangle", 0.12)); tone(2093, 0.38, 0.5, "sine", 0.06); }
      else if (name === "lose") { tone(400, 0, 0.35, "sawtooth", 0.06, 120); }
      else if (name === "bell") { tone(1760, 0, 1.4, "sine", 0.22); tone(2640, 0, 0.9, "sine", 0.08); tone(4400, 0, 0.3, "sine", 0.03); }
      else if (name === "click") { tone(1200, 0, 0.04, "square", 0.03); }
      else if (name === "flip") { tone(300, 0, 0.06, "triangle", 0.06, 600); }
      else if (name === "coin") { tone(988, 0, 0.08, "square", 0.05); tone(1319, 0.07, 0.3, "square", 0.05); }
    } catch (e) {}
  }

  // ---------- confetti ----------
  let cv = null, parts = [], raf = 0;
  function confetti(power, colors) {
    if (!cv) { cv = document.createElement("canvas"); cv.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999"; document.body.appendChild(cv); }
    const W = cv.width = innerWidth * devicePixelRatio, H = cv.height = innerHeight * devicePixelRatio;
    const cols = colors || ["#3182F6", "#F04452", "#FFC342", "#00C473", "#8B5CF6"];
    const n = Math.round(120 * (power || 1));
    for (let k = 0; k < n; k++) parts.push({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.55, vx: (Math.random() - 0.5) * 30 * devicePixelRatio, vy: -(10 + Math.random() * 26) * devicePixelRatio, r: (4 + Math.random() * 6) * devicePixelRatio, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, c: cols[k % cols.length], life: 1 });
    if (!raf) loop();
  }
  function loop() {
    const g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter((p) => p.life > 0 && p.y < cv.height + 40);
    for (const p of parts) { p.vy += 0.9 * devicePixelRatio; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.a += p.va; p.life -= 0.006; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.c; g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); g.restore(); }
    raf = parts.length ? requestAnimationFrame(loop) : 0;
    if (!raf) g.clearRect(0, 0, cv.width, cv.height);
  }

  const NPCN = ["도윤", "서준", "하은", "지호", "민서", "예준", "수아", "시우", "지안", "하준", "유나", "건우", "서연", "우진", "채원", "현우", "다은", "준서", "소율", "태윤", "개미왕", "존버맨", "풀매수", "떡상기원", "한강물", "영끌러"];
  const GN = ["로켓 크래시", "우준 슬롯", "지뢰찾기", "플링코", "바카라", "룰렛", "다이스", "림보", "블랙잭", "타워 오르기", "치킨 로드", "행운의 휠", "경마", "키노"];
  function npcAt(k) { const a = h2(777, k), b = h2(778, k), c = h2(779, k); const m = a < 0.45 ? 0 : a < 0.8 ? 1.2 + b * 1.5 : a < 0.96 ? 3 + b * 12 : 20 + b * 180; return { n: NPCN[Math.floor(c * NPCN.length)] + (Math.floor(b * 90) + 10), g: GN[Math.floor(h2(780, k) * GN.length)], b: [10000, 20000, 50000, 100000, 300000, 500000, 1000000][Math.floor(h2(781, k) * 7)], m: Math.round(m * 100) / 100, ts: k * 1300, npc: true }; }
  function npcFeed(n) { const k = Math.floor(Date.now() / 1300); const o = []; for (let j = 0; j < n; j++) o.push(npcAt(k - j)); return o; }
  // 접속 중: 30초마다 하트비트(t). 90초 넘게 소식 없는 항목은 꺼진 것으로 보고 숫자에서 빼고, 5분 넘으면 지운다
  let srvOff = 0, presU = null; const ONLINE_TTL = 90000;
  ready.then(db => db.ref(".info/serverTimeOffset").on("value", s => { srvOff = s.val() || 0; })).catch(() => {});
  const srvNow = () => Date.now() + srvOff;
  function liveOnline(v) { const o = {}, t = srvNow(); Object.keys(v || {}).forEach(k => { const x = v[k]; if (x && x.t && t - x.t < ONLINE_TTL) o[k] = x; }); return o; }
  const onlineCount = v => Object.keys(liveOnline(v)).length;
  async function presence(u) {
    if (!u || presU === u) return; presU = u;
    const db = await ready, r = db.ref("online/" + u), s = await db.ref("users/" + u + "/name").once("value"), n = s.val() || "";
    const beat = () => r.set({ n, g: "", t: srvNow() }).catch(() => {});
    db.ref(".info/connected").on("value", c => { if (c.val()) { r.onDisconnect().remove(); beat(); } });
    setInterval(beat, 30000); document.addEventListener("visibilitychange", () => { if (!document.hidden) beat(); });
    db.ref("online").once("value").then(o => { const v = o.val() || {}, t = srvNow(); Object.keys(v).forEach(k => { if (k !== u && (!v[k] || !v[k].t || t - v[k].t > 300000)) db.ref("online/" + k).remove().catch(() => {}); }); }).catch(() => {});
  }
  window.WJ = { eqMul, eqTax, eqHack, boost, tabOn, MIN_HOLD, FP, deviceOwner, isLinked, CONFIG, hackDisabled, TAX, taxOf, hackOpen, kstWeekday, LIMIT, limitState, limits, prevClose, DID, api, guestLogin, isGuest, collectLoan, LOAN_TERM, LOAN_PENALTY, npcFeed, presence, liveOnline, onlineCount, JP0: 10000000, hk: (i) => "s" + i, ready, authReady, auth: () => _auth, activateAccount, setAccountKey, db: () => _db, STOCKS, SECTORS, price, now, open, change, marketOpen, marketStatus, news, fmt, signed, pct, holdingsValue, netWorth, uid, requireUser, logout, keyOf, addCash, log, sfx, confetti, START_CASH: 1000000, LOAN_LIMIT: 5000000, LOAN_FEE: 0.1, YOUTH, youthState, stockAt: i => STOCKS[i] || { i, name: "?", code: "-", sector: "" } };
})();
