// 우준은행 공통 UI — 탭 글리치·스크램블, 네온 인디케이터, 페이지 전환, 토스트, Ctrl+K 빠른 이동, 출석 보상, 알림
(function () {
  if (window.WJUI) return;
  const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const KST_DAY = (off = 0) => new Date(Date.now() + 9 * 3600000 - off * 86400000).toISOString().slice(0, 10);
  const PAGES = [["trade.dc.html", "거래소", "📈"], ["bank.dc.html", "내 계좌", "💳"], ["games.dc.html", "보드게임", "🎲"], ["tournament.dc.html", "토너먼트", "🏆"], ["estate.html", "부동산", "🏠"], ["company.dc.html", "회사", "🏢"], ["coin.dc.html", "코인", "🪙"], ["ranking.dc.html", "랭킹", "🏆"], ["hack.dc.html", "해킹", "💻"], ["lotto.dc.html", "복권", "🎫"]];
  const GAMES = [["cockroach", "바퀴벌레 포커"], ["codenames", "코드네임"], ["penguin", "펭귄 얼음 깨기"], ["marbles", "알까기"], ["omok", "오목"], ["chess", "체스"], ["othello", "오델로"], ["connect4", "사목"], ["blackjack", "블랙잭 대결"], ["memory", "메모리 카드"], ["mines", "지뢰찾기 대결"], ["bingo", "빙고 배틀"], ["halligalli", "할리갈리"], ["janggi", "장기"], ["baduk", "바둑 9×9"], ["checkers", "체커"], ["dots", "도트 앤 박스"], ["ultimate", "울티밋 틱택토"], ["hex", "헥스"], ["quoridor", "쿼리도"], ["rummikub", "루미큐브 클래식"], ["davinci", "다빈치 코드"], ["kebab", "꼬치의 달인"], ["neon4", "미니 4목"], ["race21", "21 레이스"], ["gemdraft", "보석 드래프트"], ["yut", "윷놀이"], ["marble", "월드 마블"], ["battleship", "배틀쉽"], ["indian", "인디언 포커"], ["baseball", "숫자야구"], ["chicken", "치킨 차차차"], ["cucaracha", "라쿠카라차"], ["pool", "포켓볼"], ["uno", "우노"], ["minigolf", "미니골프"]];
  const file = href => (href || "").split("?")[0].split("#")[0].split("/").pop() || "index.html";
  const here = () => file(location.pathname);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- 토스트 ----------
  let wrap = null;
  function toast(msg, opt) {
    opt = opt || {};
    if (!document.body) return;
    if (!wrap || !wrap.isConnected) { wrap = document.createElement("div"); wrap.className = "wj-toasts"; document.body.appendChild(wrap); }
    const el = document.createElement("div"); el.className = "wj-toast-w"; el.setAttribute("role", "status");
    el.innerHTML = '<div class="wj-toast">' + (opt.icon ? '<span class="ic">' + esc(opt.icon) + "</span>" : "") + "<span>" + (opt.html ? msg : esc(msg)) + "</span></div>";
    wrap.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
    const outOf = n => { if (n.dataset.out) return; n.dataset.out = 1; n.classList.add("fade"); setTimeout(() => { n.classList.remove("in"); n.classList.add("out"); }, 700); setTimeout(() => n.remove(), 1050); };
    // 기존 토스트를 클릭 가능한 알림으로도 사용한다. 일반 알림의 표시는 그대로다.
    if (typeof opt.onClick === "function") {
      el.style.pointerEvents = "auto"; el.style.cursor = "pointer";
      el.setAttribute("role", "button"); el.setAttribute("tabindex", "0");
      el.setAttribute("aria-label", opt.label || el.textContent);
      const activate = () => { opt.onClick(); outOf(el); };
      el.addEventListener("click", activate);
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); } });
    }
    const live = [...wrap.children].filter(c => !c.dataset.out); if (live.length > 4) outOf(live[0]);
    setTimeout(() => outOf(el), opt.ms || 3200);
    return { close: () => outOf(el) };
  }

  // ---------- 페이지 전환 ----------
  function go(href) {
    try { sessionStorage.setItem("wj_trans", "1"); } catch (e) {}
    try { window.WJ && WJ.sfx("click"); } catch (e) {}
    location.href = href;
  }
  function enterFx() {
    let flag = null; try { flag = sessionStorage.getItem("wj_trans"); sessionStorage.removeItem("wj_trans"); } catch (e) {}
    if (!flag || RM) return;
    const root = document.getElementById("dc-root"); if (!root) return;
    root.classList.add("wj-enter"); setTimeout(() => root.classList.remove("wj-enter"), 400);
  }
  // 뒤로 가기로 돌아왔을 때 전환 막이 남지 않게
  window.addEventListener("pageshow", e => { if (e.persisted) { const v = document.getElementById("wj-veil"); v && v.remove(); } });

  // Tabler Icons v3.19.0 · MIT · Copyright (c) Paweł Kuna. Bundled to avoid CDN fallback.
  const TABLER = {"trade.dc.html": "chart-candle", "bank.dc.html": "wallet", "games.dc.html": "dice-5", "tournament.dc.html": "tournament", "estate.html": "building-estate", "company.dc.html": "building-skyscraper", "coin.dc.html": "coin", "ranking.dc.html": "trophy", "hack.dc.html": "terminal-2", "lotto.dc.html": "ticket"};
  const TAB_SVG = {"chart-candle": "<!--\ntags: [statistics, diagram, graph, rhythm, data, analysis]\ncategory: Charts\nversion: \"1.0\"\nunicode: \"ea5a\"\n-->\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"20\"\n  height=\"20\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M4 6m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z\" />\n  <path d=\"M6 4l0 2\" />\n  <path d=\"M6 11l0 9\" />\n  <path d=\"M10 14m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z\" />\n  <path d=\"M12 4l0 10\" />\n  <path d=\"M12 19l0 1\" />\n  <path d=\"M16 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z\" />\n  <path d=\"M18 4l0 1\" />\n  <path d=\"M18 11l0 9\" />\n</svg>\n", "wallet": "<!--\ntags: [money, pay, banknote, coin, payment, bank]\nversion: \"1.2\"\nunicode: \"eb75\"\n-->\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"20\"\n  height=\"20\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12\" />\n  <path d=\"M20 12v4h-4a2 2 0 0 1 0 -4h4\" />\n</svg>\n", "dice-5": "<!--\ntags: [game, boardgame, roll, throw, cube, numbers, gambling]\nversion: \"1.60\"\nunicode: \"f08f\"\ncategory: Games\n-->\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"20\"\n  height=\"20\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M3 3m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z\" />\n  <circle cx=\"8.5\" cy=\"8.5\" r=\".5\" fill=\"currentColor\" />\n  <circle cx=\"15.5\" cy=\"8.5\" r=\".5\" fill=\"currentColor\" />\n  <circle cx=\"15.5\" cy=\"15.5\" r=\".5\" fill=\"currentColor\" />\n  <circle cx=\"8.5\" cy=\"15.5\" r=\".5\" fill=\"currentColor\" />\n  <circle cx=\"12\" cy=\"12\" r=\".5\" fill=\"currentColor\" />\n</svg>\n", "tournament": "<!--\ntags: [competition, competitor, sport, game, play, champion]\nversion: \"1.19\"\nunicode: \"ecd0\"\ncategory: Sport\n-->\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"20\"\n  height=\"20\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M4 4m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\" />\n  <path d=\"M20 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\" />\n  <path d=\"M4 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\" />\n  <path d=\"M4 20m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\" />\n  <path d=\"M6 12h3a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-3\" />\n  <path d=\"M6 4h7a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-2\" />\n  <path d=\"M14 10h4\" />\n</svg>\n", "building-estate": "<!--\ntags: [office, property, work, architecture]\ncategory: Buildings\nunicode: \"f5a5\"\nversion: \"1.110\"\n-->\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"20\"\n  height=\"20\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M3 21h18\" />\n  <path d=\"M19 21v-4\" />\n  <path d=\"M19 17a2 2 0 0 0 2 -2v-2a2 2 0 1 0 -4 0v2a2 2 0 0 0 2 2z\" />\n  <path d=\"M14 21v-14a3 3 0 0 0 -3 -3h-4a3 3 0 0 0 -3 3v14\" />\n  <path d=\"M9 17v4\" />\n  <path d=\"M8 13h2\" />\n  <path d=\"M8 9h2\" />\n</svg>\n", "building-skyscraper": "<!--\ntags: [city, urban, office, workplace, corporation, hotel, apartments]\ncategory: Buildings\nversion: \"1.8\"\nunicode: \"ec39\"\n-->\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"20\"\n  height=\"20\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M3 21l18 0\" />\n  <path d=\"M5 21v-14l8 -4v18\" />\n  <path d=\"M19 21v-10l-6 -4\" />\n  <path d=\"M9 9l0 .01\" />\n  <path d=\"M9 12l0 .01\" />\n  <path d=\"M9 15l0 .01\" />\n  <path d=\"M9 18l0 .01\" />\n</svg>\n", "coin": "<!--\ntags: [money, earn, salary, change, dollar]\nversion: \"1.3\"\ncategory: E-commerce\nunicode: \"eb82\"\n-->\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"20\"\n  height=\"20\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0\" />\n  <path d=\"M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1\" />\n  <path d=\"M12 7v10\" />\n</svg>\n", "trophy": "<!--\ntags: [success, win, prize, winner]\nversion: \"1.0\"\nunicode: \"eb45\"\n-->\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"20\"\n  height=\"20\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M8 21l8 0\" />\n  <path d=\"M12 17l0 4\" />\n  <path d=\"M7 4l10 0\" />\n  <path d=\"M17 4v8a5 5 0 0 1 -10 0v-8\" />\n  <path d=\"M5 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\" />\n  <path d=\"M19 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\" />\n</svg>\n", "terminal-2": "<!--\ntags: [console, command, git, command line, command prompt]\nversion: \"1.7\"\nunicode: \"ebef\"\n-->\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"20\"\n  height=\"20\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M8 9l3 3l-3 3\" />\n  <path d=\"M13 15l3 0\" />\n  <path d=\"M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z\" />\n</svg>\n", "ticket": "<!--\ntags: [cinema, event, theatre, entry, fine, coupon, pass]\nversion: \"1.0\"\nunicode: \"eb3d\"\n-->\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"20\"\n  height=\"20\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M15 5l0 2\" />\n  <path d=\"M15 11l0 2\" />\n  <path d=\"M15 17l0 2\" />\n  <path d=\"M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-3a2 2 0 0 0 0 -4v-3a2 2 0 0 1 2 -2\" />\n</svg>\n"};
  let nav = null, active = null;
  function glitch(a) {
    a.classList.remove("wj-hit"); void a.offsetWidth; a.classList.add("wj-hit");
    setTimeout(() => a.classList.remove("wj-hit"), 650);
  }
  function setupNav(n) {
    nav = n;
    [...n.querySelectorAll("a")].forEach(a => {
      const href = file(a.getAttribute("href")), txt = a.textContent.trim(), ico = TABLER[href];
      a.dataset.wjText = txt;
      a.classList.add("wj-tab", "wj-t-" + (ico || "none"));
      if (href === here()) { a.classList.add("wj-on"); active = a; }
      const chars = [...txt].map((ch, i) => '<span class="wj-ch" style="--i:' + i + '">' + (ch === " " ? "&nbsp;" : esc(ch)) + "</span>").join("");
      a.innerHTML = (ico ? '<span class="wj-ico wj-web">' + TAB_SVG[ico] + "</span>" : "") + '<span class="wj-txt">' + chars + "</span>";
    });
    if (active && !RM) setTimeout(() => glitch(active), 150);
  }
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("header nav a");
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = a.getAttribute("href"); if (!href || href[0] === "#") return;
    e.preventDefault(); glitch(a);
    if (file(href) === here()) return;
    go(href);
  }, true);

  // ---------- 출석 보상 ----------
  let dailyTried = false;
  async function claimDaily(manual) {
    const W = window.WJ; if (!W) return;
    try {
      await W.authReady; const uid = W.uid(); if (!uid) return;
      const db = await W.ready, day = KST_DAY(), yday = KST_DAY(1);
      let reward = 0, streak = 0, already = false;
      // 서버 값을 먼저 읽어 둔다. 캐시가 빈 상태로 거래를 돌리면 null이 화면에 잠깐 전달되어 로그아웃되는 문제가 있었다.
      const snap = await db.ref("users/" + uid).once("value");
      if (!snap.exists()) return;
      const d0 = snap.val().daily || {}; const mul = await W.boost(uid).catch(() => 1);
      if (d0.day === day) { if (manual) toast("오늘 출석 보상은 이미 받았어요", { icon: "📅" }); return; }
      const r = await db.ref("users/" + uid).transaction(u => {
        if (!u) return u;
        if (u.banned) return;
        const d = u.daily || {};
        if (d.day === day) { already = true; return; }
        already = false; streak = d.day === yday ? (d.streak || 0) + 1 : 1;
        reward = Math.round((3000 + Math.min(streak - 1, 6) * 1000) * mul / 100) * 100;
        u.daily = { day, streak, total: (d.total || 0) + 1 };
        u.cash = (u.cash || 0) + reward;
        return u;
      }, undefined, false); // applyLocally=false: 서버 확정 전 값으로 화면 이벤트를 만들지 않음
      if (r.committed && reward > 0 && !already) {
        W.log(uid, "daily", { amount: reward, text: "출석 보상 · " + streak + "일 연속" });
        try { W.sfx("coin"); } catch (e) {}
        toast("출석 보상 <b>+" + W.fmt(reward) + "준</b> · " + streak + "일 연속", { icon: "🎁", html: true, ms: 3600 });
      } else if (manual) toast(already ? "오늘 출석 보상은 이미 받았어요" : "출석 보상을 받지 못했어요", { icon: "📅" });
    } catch (e) { if (manual) toast("연결을 확인해 주세요", { icon: "⚠️" }); }
  }

  // ---------- 주급: 한국 시간 월요일 시작 주마다 50만준 ----------
  const WEEKLY = 500000;
  const KST_WEEK = () => { const d = new Date(Date.now() + 9 * 3600000), wd = (d.getUTCDay() + 6) % 7; return new Date(d.getTime() - wd * 86400000).toISOString().slice(0, 10); };
  async function claimWeekly() {
    const W = window.WJ; if (!W) return;
    try {
      await W.authReady; const uid = W.uid(); if (!uid) return;
      const db = await W.ready, wk = KST_WEEK();
      const snap = await db.ref("users/" + uid).once("value"); if (!snap.exists() || (snap.val().weekly || {}).wk === wk) return;
      let paid = false; const pay = Math.round(WEEKLY * (await W.boost(uid).catch(() => 1)) / 10000) * 10000;
      const r = await db.ref("users/" + uid).transaction(u => { if (!u || u.banned) return; if ((u.weekly || {}).wk === wk) { paid = false; return; } paid = true; u.weekly = { wk, n: ((u.weekly || {}).n || 0) + 1 }; u.cash = (u.cash || 0) + pay; return u; }, undefined, false);
      if (r.committed && paid) { W.log(uid, "daily", { amount: pay, text: "주급 · " + wk + " 주" }); try { W.sfx("coin"); } catch (e) {} toast("이번 주 주급 <b>+" + W.fmt(pay) + "준</b>", { icon: "💰", html: true, ms: 4200 }); }
    } catch (e) {}
  }

  // ---------- 브라우저 알림 · 탭 제목 깜빡임 ----------
  let blinkT = null, baseTitle = "";
  function blink(text) {
    if (blinkT) return; baseTitle = document.title; let on = false;
    blinkT = setInterval(() => { on = !on; document.title = on ? text : baseTitle; }, 900);
    const stop = () => { if (!document.hidden) { clearInterval(blinkT); blinkT = null; document.title = baseTitle; document.removeEventListener("visibilitychange", stop); window.removeEventListener("focus", stop); } };
    document.addEventListener("visibilitychange", stop); window.addEventListener("focus", stop);
  }
  function askNotify() { try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {}); } catch (e) {} }
  function notify(title, body) {
    try { if ("Notification" in window && Notification.permission === "granted") { const n = new Notification(title, { body, tag: "wj-turn", renotify: true }); n.onclick = () => { window.focus(); n.close(); }; } } catch (e) {}
  }

  // ---------- 빠른 이동 ----------
  let back = null;
  function items() {
    const W = window.WJ, out = [];
    PAGES.filter(p => !W || !W.tabOn || W.tabOn(tabKey(p[0]))).forEach(([h, n, em], i) => out.push({ g: "페이지", em, t: n, s: "Alt+" + (i + 1), run: () => go(h) }));
    out.push({ g: "바로 하기", em: "🎁", t: "출석 보상 받기", s: "하루 한 번", run: () => claimDaily(true) });
    out.push({ g: "바로 하기", em: "💰", t: "주급 받기", s: "매주", run: () => claimWeekly() });
    out.push({ g: "바로 하기", em: localStorage.getItem("wj_mute") === "1" ? "🔈" : "🔇", t: localStorage.getItem("wj_mute") === "1" ? "소리 켜기" : "소리 끄기", s: "", run: () => { const m = localStorage.getItem("wj_mute") === "1"; localStorage.setItem("wj_mute", m ? "0" : "1"); toast(m ? "소리를 켰어요" : "소리를 껐어요", { icon: m ? "🔊" : "🔇" }); } });
    out.push({ g: "바로 하기", em: "🔔", t: "내 차례 알림 허용", s: "", run: () => { askNotify(); toast("브라우저 알림 권한을 요청했어요", { icon: "🔔" }); } });
    if (window.WJLiveEvent?.active?.()) out.push({ g: "바로 하기", em: "❓", t: "질문 이벤트 확인", s: "진행 중인 질문 · 공지", run: () => window.WJLiveEvent.open() });
    if (W) out.push({ g: "바로 하기", em: "🚪", t: "로그아웃", s: "", run: () => W.logout() });
    GAMES.forEach(([id, n]) => out.push({ g: "보드게임", em: "🎲", t: n, s: "게임", run: () => go("games.dc.html?focus=" + id) }));
    if (W) { const t = W.now(); W.STOCKS.forEach(s => { const c = W.change(s.i, t); out.push({ g: "종목", em: s.name[0], t: s.name, s: W.fmt(W.price(s.i, t)) + " · " + W.pct(c), sc: c >= 0 ? "#F04452" : "#3182F6", run: () => { localStorage.setItem("wj_sel", s.i); here() === "trade.dc.html" ? location.reload() : go("trade.dc.html"); } }); }); }
    return out;
  }
  function openPalette() {
    if (back) return;
    const all = items(); let list = all, sel = 0;
    back = document.createElement("div"); back.className = "wj-cmd-back";
    back.innerHTML = '<div class="wj-cmd" role="dialog" aria-label="빠른 이동"><input placeholder="페이지, 게임, 종목 검색…" aria-label="검색"><ul></ul><div class="foot"><span><kbd>↑↓</kbd> 이동</span><span><kbd>Enter</kbd> 선택</span><span><kbd>Esc</kbd> 닫기</span></div></div>';
    document.body.appendChild(back);
    const inp = back.querySelector("input"), ul = back.querySelector("ul");
    const render = () => {
      if (!list.length) { ul.innerHTML = '<div class="empty">찾는 항목이 없어요</div>'; return; }
      let g = "", html = "";
      list.slice(0, 60).forEach((it, i) => { if (it.g !== g) { g = it.g; html += '<div class="grp">' + esc(g) + "</div>"; } html += '<li data-i="' + i + '" class="' + (i === sel ? "on" : "") + '"><span class="em">' + esc(it.em) + '</span><span class="t">' + esc(it.t) + '</span><span class="s"' + (it.sc ? ' style="color:' + it.sc + '"' : "") + ">" + esc(it.s) + "</span></li>"; });
      ul.innerHTML = html; const on = ul.querySelector("li.on"); on && on.scrollIntoView({ block: "nearest" });
    };
    const pick = i => { const it = list[i]; close(); it && it.run(); };
    inp.addEventListener("input", () => { const q = inp.value.trim().toLowerCase(); list = q ? all.filter(it => (it.t + " " + it.g).toLowerCase().includes(q)) : all; sel = 0; render(); });
    inp.addEventListener("keydown", e => {
      const n = Math.min(list.length, 60);
      if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, n); render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + n) % Math.max(1, n); render(); }
      else if (e.key === "Enter") { e.preventDefault(); pick(sel); }
      else if (e.key === "Escape") close();
    });
    ul.addEventListener("mousemove", e => { const li = e.target.closest("li"); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; render(); } });
    ul.addEventListener("click", e => { const li = e.target.closest("li"); if (li) pick(+li.dataset.i); });
    back.addEventListener("mousedown", e => { if (e.target === back) close(); });
    render(); setTimeout(() => inp.focus(), 10);
  }
  function close() { if (back) { back.remove(); back = null; } }
  document.addEventListener("keydown", e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || "") || (e.target && e.target.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); back ? close() : openPalette(); return; }
    if (!nav) return;
    if (e.key === "/" && !typing && !back) { e.preventDefault(); openPalette(); return; }
    if (e.altKey && !e.ctrlKey && !e.metaKey && /^Digit[1-9]$/.test(e.code)) { e.preventDefault(); const p = PAGES[+e.code.slice(5) - 1]; if (p && (!window.WJ || !WJ.tabOn || WJ.tabOn(tabKey(p[0]))) && file(p[0]) !== here()) go(p[0]); }
  });

  // ---------- 관리자가 끈 탭 ----------
  const tabKey = f => (f || "").replace(/\.dc\.html$/, "").replace(/\.html$/, "");
  const TAB_KEYS = ["trade", "bank", "games", "tournament", "estate", "company", "coin", "ranking", "hack", "lotto"];
  function applyTabs() {
    const W = window.WJ; if (!W || !W.tabOn) return;
    document.querySelectorAll("header nav a").forEach(a => { const k = tabKey(file(a.getAttribute("href"))); if (TAB_KEYS.includes(k)) a.style.display = W.tabOn(k) ? "" : "none"; });
    const k = tabKey(here()), old = document.getElementById("wj-closed");
    if (!TAB_KEYS.includes(k) || W.tabOn(k)) { old && old.remove(); return; }
    if (old) return;
    const alt = PAGES.find(p => W.tabOn(tabKey(p[0])) && tabKey(p[0]) !== k), name = (PAGES.find(p => tabKey(p[0]) === k) || [0, "이 탭"])[1];
    const el = document.createElement("div"); el.id = "wj-closed";
    el.style.cssText = "position:fixed;inset:0;z-index:99990;background:#F2F4F6;display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Pretendard Variable',Pretendard,system-ui,sans-serif";
    el.innerHTML = '<div style="max-width:400px;width:100%;background:#fff;border-radius:22px;padding:32px;text-align:center"><div style="font-size:22px;font-weight:800;color:#191F28">' + esc(name) + ' 탭이 잠시 닫혔어요</div><div style="font-size:14px;color:#6B7684;margin-top:10px;line-height:1.6">관리자가 이 탭을 꺼 뒀어요. 다시 열리면 바로 쓸 수 있어요.</div>' + (alt ? '<a href="' + alt[0] + '" style="display:inline-flex;align-items:center;justify-content:center;margin-top:20px;height:48px;padding:0 20px;border-radius:14px;background:#3182F6;color:#fff;font-weight:800;font-size:15px;text-decoration:none">' + esc(alt[1]) + '(으)로 가기</a>' : "") + "</div>";
    document.body.appendChild(el);
  }
  window.addEventListener("wj-config", applyTabs);

  // ---------- 시작 ----------
  function boot() {
    let tries = 0;
    const iv = setInterval(() => {
      tries++;
      const n = document.querySelector("header nav");
      if (n || tries > 120) {
        clearInterval(iv); enterFx();
        if (!n) return;
        setupNav(n); applyTabs();
        const fab = document.createElement("button"); fab.className = "wj-fab"; fab.type = "button"; fab.setAttribute("aria-label", "빠른 이동 (Ctrl+K)");
        fab.innerHTML = "<span>빠른 이동</span><kbd>Ctrl K</kbd>"; fab.addEventListener("click", openPalette); document.body.appendChild(fab);
        if (!dailyTried) { dailyTried = true; (async () => { while (!window.WJ) await new Promise(r => setTimeout(r, 60)); setTimeout(() => claimDaily(false), 900); setTimeout(claimWeekly, 2200); })(); }
      }
    }, 80);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  // 토너먼트 초대 · 대국 준비 알림은 모든 페이지에서
  if (!window.WJT && !document.querySelector('script[src*="tourney.js"]')) { const ts = document.createElement("script"); ts.src = "tourney.js"; (document.head || document.documentElement).appendChild(ts); }

  window.WJUI = { claimWeekly, toast, go, blink, notify, askNotify, openPalette, claimDaily };
})();
