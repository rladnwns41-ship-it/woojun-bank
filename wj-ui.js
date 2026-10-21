// 우준은행 공통 UI — 탭 글리치·스크램블, 네온 인디케이터, 페이지 전환, 토스트, Ctrl+K 빠른 이동, 출석 보상, 알림
(function () {
  if (window.WJUI) return;
  const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const KST_DAY = (off = 0) => new Date(Date.now() + 9 * 3600000 - off * 86400000).toISOString().slice(0, 10);
  const PAGES = [["trade.dc.html", "거래소", "📈"], ["bank.dc.html", "내 계좌", "💳"], ["games.dc.html", "보드게임", "🎲"], ["tournament.dc.html", "토너먼트", "🏆"], ["estate.html", "부동산", "🏠"], ["company.dc.html", "회사", "🏢"], ["coin.dc.html", "코인", "🪙"], ["ranking.dc.html", "랭킹", "🏆"], ["hack.dc.html", "해킹", "💻"], ["lotto.dc.html", "복권", "🎫"]];
  const GAMES = [["marbles", "알까기"], ["omok", "오목"], ["chess", "체스"], ["othello", "오델로"], ["connect4", "사목"], ["blackjack", "블랙잭 대결"], ["memory", "메모리 카드"], ["mines", "지뢰찾기 대결"], ["bingo", "빙고 배틀"], ["halligalli", "할리갈리"], ["janggi", "장기"], ["baduk", "바둑 9×9"], ["checkers", "체커"], ["dots", "도트 앤 박스"], ["ultimate", "울티밋 틱택토"], ["hex", "헥스"], ["quoridor", "쿼리도"], ["rummikub", "루미큐브 클래식"], ["davinci", "다빈치 코드"], ["kebab", "꼬치의 달인"], ["neon4", "미니 4목"], ["race21", "21 레이스"], ["gemdraft", "보석 드래프트"], ["yut", "윷놀이"], ["marble", "월드 마블"], ["battleship", "배틀쉽"], ["indian", "인디언 포커"], ["baseball", "숫자야구"], ["chicken", "치킨 차차차"], ["cucaracha", "라쿠카라차"], ["pool", "포켓볼"], ["uno", "우노"], ["minigolf", "미니골프"]];
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
    const live = [...wrap.children].filter(c => !c.dataset.out); if (live.length > 4) outOf(live[0]);
    setTimeout(() => outOf(el), opt.ms || 3200);
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

  // ---------- 탭: 픽셀 아이콘 + 글자 애니메이션 ----------
  // 16x16 pixel sprites. "." = transparent. layers animate separately.
  const PAL = { K:"#191F28", W:"#FFFFFF",
    B:"#7C6CF2", b:"#5B4BD6", S:"#B6F27A", s:"#5FB83A", R:"#F04452", Y:"#FFC342", D:"#3D3A55",
    O:"#B07A00", G:"#FFC93C", g:"#E8A400", H:"#FFF3BF", P:"#F7A8B8", C:"#FFE066", c:"#D99A00",
    U:"#F04452", u:"#C9283A", L:"#3182F6", l:"#1B64DA", A:"#00B76A", T:"#E8F3FF", t:"#B9D6FF", M:"#8B95A1" };
  const SPR = {
    game: { base: [
      "................",
      "...KKKKKKKKKK...",
      "..KBBBBBBBBBBK..",
      "..KBDDDDDDDDBK..",
      "..KBDSSSSSSDBK..",
      "..KBDSSSSSSDBK..",
      "..KBDSSSSSSDBK..",
      "..KBDSSSSSSDBK..",
      "..KBDDDDDDDDBK..",
      "..KBBBBBBBBBBK..",
      "..KBBKBBBBBBBK..",
      "..KBKKKBBBBRBK..",
      "..KBBKBBBRBBBK..",
      "..KBBBBBBBBBBK..",
      "..KbbbbbbbbbbK..",
      "...KKKKKKKKKK..."],
      layers: { blink: [
      "................","................","................","................",
      ".....W..........",
      "......sss.......",
      ".....s...s......",
      "................","................","................","................",
      "................","................","................","................","................"] } },
    pig: { base: [
      "................",
      "................",
      "................",
      "....OO....OO....",
      "...OGGO..OGGO...",
      "..OGGGGOOKKGGO..",
      ".OGHHGGGGGGGGGO.",
      ".OGHKGGGGGGGGGGO",
      "OOgGGGGGGGGGGGGO",
      "OPPOGGGGGGGGGGgO",
      "OPKPOGGGGGGGGGgO",
      ".OPPOGGGGGGGGggO",
      "..OOgGGGGGGGggO.",
      "...OgggggggggO..",
      "...OgO.OO..OgO..",
      "...OO......OO..."],
      layers: { coin: [
      "..........CC....",
      ".........CccC...",
      ".........CccC...",
      "..........CC....",
      "................","................","................","................","................","................","................","................","................","................","................","................"] } },
    chart: { base: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "KKKKKKKKKKKKKKKK",
      "................"],
      layers: { b1: [
      "","","","","","","","","","",
      ".LL.............",".LL.............",".LL.............",".ll.............","",""],
      b2: ["","","","","","","",
      "....UU..........","....UU..........","....UU..........","....UU..........","....UU..........","....UU..........","....uu..........","",""],
      b3: ["","","","","","","","","",
      ".......LL.......",".......LL.......",".......LL.......",".......LL.......",".......ll.......","",""],
      b4: ["","","","",
      "..........UU....","..........UU....","..........UU....","..........UU....","..........UU....","..........UU....","..........UU....","..........UU....","..........UU....","..........uu....","",""],
      arrow: [
      "..........AAAAA.",".............AA.","............A.A.","...........A..A.","..........A.....","","","","","","","","","","",""] } },
    trophy: { base: [
      "................",
      "...KKKKKKKKKK...",
      ".KKKGGGGGGGGKKK.",
      "KGKOGHGGGGGGOKGK",
      "KGKOGHGGGGGGOKGK",
      "KGKOGHGGGGGgOKGK",
      ".KKOGGGGGGGgOKK.",
      "...KOGGGGGgOK...",
      "....KOGGGgOK....",
      ".....KOggOK.....",
      "......KGGK......",
      "......KggK......",
      "....KKKKKKKK....",
      "....KGGGGGGK....",
      "...KKKKKKKKKK...",
      "................"],
      layers: { shine: [
      "","","",
      "........W.......",
      ".......W........",
      "......W.........",
      "","","","","","","","","",""] } },
    rec: { base: [
      "................",
      ".....KKKKKK.....",
      "...KKKYYYYKKK...",
      "...KWKKKKKKWK...",
      "...KWWWWWWWWK...",
      "...KWLLLLLWWK...",
      "...KWWWWWWWWK...",
      "...KWLLLLWWWK...",
      "...KWWWWWWWWK...",
      "...KWUUUUUWWK...",
      "...KWWWWWWWWK...",
      "...KWLLLWWWWK...",
      "...KWWWWWWWWK...",
      "...KWWWWWWWWK...",
      "...KKKKKKKKKK...",
      "................"],
      layers: {} },
    bracket: { base: [
      "..KKK......KKK..",
      "..KUUK....KLLK..",
      "...KUUK..KLLK...",
      "....KUUKKLLK....",
      ".....KUULLK.....",
      "......KKKK......",
      ".....KGGGGK.....",
      "....KGGHGGGK....",
      "...KGGGYGGGgK...",
      "...KGGYYYGGgK...",
      "...KGYYYYYGgK...",
      "...KGGYGYGGgK...",
      "....KGGGGGgK....",
      ".....KggggK.....",
      "......KKKK......",
      "................"],
      layers: { shine: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "......W.........",
      ".....W.W........",
      "......W.........",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"] } },
    building: { base: [
      "................",
      "....KKKKKKKK....",
      "....KMMMMMMK....",
      "....KMTMMTMK....",
      "....KMMMMMMK....",
      "....KMTMMTMK..KK",
      ".KKKKMMMMMMKKKLK",
      ".KLLKMTMMTMKLLLK",
      ".KLLKMMMMMMKLTLK",
      ".KLTKMTMMTMKLLLK",
      ".KLLKMMMMMMKLTLK",
      ".KLTKMMKKMMKLLLK",
      ".KLLKMMKYKMKLLLK",
      ".KLLKMMKKMMKLLLK",
      "KKKKKKKKKKKKKKKK",
      "................"],
      layers: { lit: [
      "","","",
      "......Y.........",
      "","",
      "",
      ".........Y......",
      "","","","","","","",""] } },
    house: { base: [
      "................",
      ".......KK..KKK..",
      "......KUUK.KMK..",
      ".....KUUUUKKMK..",
      "....KUUPUUUKMK..",
      "...KUUPUUUUUKK..",
      "..KUUUUUUUUUUK..",
      ".KKKKKKKKKKKKKK.",
      "..KWWWWWWWWWWK..",
      "..KWLLWWWWLLWK..",
      "..KWLLWKKWLLWK..",
      "..KWWWWOOWWWWK..",
      "..KWWWWOOWWWWK..",
      "..KWWWWOOWWWWK..",
      "AAAAAAAAAAAAAAAA",
      "................"],
      layers: { lit: [
      "............M...",
      "...........M.M..",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "....YY....YY....",
      "....YY....YY....",
      "................",
      "................",
      "................",
      "................",
      "................"] } },
    coin: { base: [
      "................",
      ".....KKKKKK.....",
      "...KKGGGGGGKK...",
      "..KGGHHGGGGGgK..",
      "..KGHGGGGGGGgK..",
      ".KGHGGKGGKGGGgK.",
      ".KGGGGKGGKGGGgK.",
      ".KGGGGKKKKGGGgK.",
      ".KGGGKKGGKKGGgK.",
      ".KGGGKGGGGKGGgK.",
      ".KGGGGGGGGGGGgK.",
      "..KGGGGGGGGGggK.",
      "..KgGGGGGGGggK..",
      "...KKggggggKK...",
      ".....KKKKKK.....",
      "................"],
      layers: { spark: [
      "..............W.",
      ".............WWW",
      "..............W.",
      "","","","","","","","","","","","",""] } },
    ticket: { base: [
      "................",
      "................",
      "................",
      ".KKKKKKKKKKKKKK.",
      ".KUUUUUUUUUUUUK.",
      ".KUHHUUUUUUUuUK.",
      "KUUHUUMMMMMMuUUK",
      ".UUUUUMMMMMMuUU.",
      ".UUUUUMMMMMMuUU.",
      "KUUUUUMMMMMMuUUK",
      ".KUUUUUUUUUUuUK.",
      ".KuuuuuuuuuuuuK.",
      ".KKKKKKKKKKKKKK.",
      "................",
      "................",
      "................"],
      layers: { star: [
      "","","","","","","",
      ".......Y........",
      "......YYY.......",
      ".......Y........",
      "","","","","",""] } },
    term: { base: [
      "................",
      ".KKKKKKKKKKKKKK.",
      ".KMMMMMMMMMMMMK.",
      ".KKKKKKKKKKKKKK.",
      ".KDDDDDDDDDDDDK.",
      ".KDDDDDDDDDDDDK.",
      ".KDDDDDDDDDDDDK.",
      ".KDDDDDDDDDDDDK.",
      ".KDDDDDDDDDDDDK.",
      ".KDDDDDDDDDDDDK.",
      ".KDDDDDDDDDDDDK.",
      ".KKKKKKKKKKKKKK.",
      "......KKKK......",
      "....KKKKKKKK....",
      "................",
      "................"],
      layers: { code: [
      "","","","",
      "...AA...........",
      "....AA..........",
      "...AA...AAAA....",
      "................",
      "...AAAAA........",
      "...AAA..AAA.....",
      "","","","","",""] } },
    chat: { base: [
      "................",
      "..KKKKKKKKKKKK..",
      ".KTTTTTTTTTTTTK.",
      "KTWWWWWWWWWWWWTK",
      "KTWWWWWWWWWWWWTK",
      "KTWWWWWWWWWWWWTK",
      "KTWWWWWWWWWWWWTK",
      "KTWWWWWWWWWWWWTK",
      "KTWWWWWWWWWWWWTK",
      ".KttttttttttttK.",
      "..KKKKKtKKKKKK..",
      "......KtK.......",
      ".......KK.......",
      "................",
      "................",
      "................"],
      layers: { d1: ["","","","","",
      "....LL..........","....LL..........","","","","","","","","",""],
      d2: ["","","","","",
      ".......LL.......",".......LL.......","","","","","","","","",""],
      d3: ["","","","","",
      "..........LL....","..........LL....","","","","","","","","",""] } }
  };
  function grid2rects(g){ let out=""; g.forEach((row,y)=>{ let x=0; while(x<row.length){ const ch=row[x]; if(ch==="."||!PAL[ch]){x++;continue;} let w=1; while(row[x+w]===ch) w++; out+=`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${PAL[ch]}"/>`; x+=w; } }); return out; }
  function spriteSvg(id){ const s=SPR[id]; let h=grid2rects(s.base); for(const k in s.layers) h+=`<g class="l-${k}">`+grid2rects(s.layers[k])+"</g>"; return `<svg viewBox="0 0 16 16" width="20" height="20" shape-rendering="crispEdges" aria-hidden="true">${h}</svg>`; }

  const TAB_ICON = { "trade.dc.html": "chart", "bank.dc.html": "pig", "games.dc.html": "game", "tournament.dc.html": "bracket", "estate.html": "house", "company.dc.html": "building", "coin.dc.html": "coin", "ranking.dc.html": "trophy", "hack.dc.html": "term", "lotto.dc.html": "ticket" };
  // 탭 아이콘: Tabler Icons (MIT) SVG를 CDN에서 받아 인라인으로 넣는다. 실패하면 픽셀 아이콘 그대로
  const TABLER = { "trade.dc.html": "chart-candle", "bank.dc.html": "wallet", "games.dc.html": "dice-5", "tournament.dc.html": "tournament", "estate.html": "building-estate", "company.dc.html": "building-skyscraper", "coin.dc.html": "coin", "ranking.dc.html": "trophy", "hack.dc.html": "terminal-2", "lotto.dc.html": "ticket" };
  const ICON_CDN = "https://cdn.jsdelivr.net/npm/@tabler/icons@3.19.0/icons/outline/";
  function webIcon(name) {
    const key = "wj-ti-" + name; let c = null; try { c = localStorage.getItem(key); } catch (e) {}
    if (c) return Promise.resolve(c);
    return fetch(ICON_CDN + name + ".svg").then(r => r.ok ? r.text() : null).then(t => { if (!t || !/^\s*<svg/.test(t)) return null; t = t.replace(/width="24"/, 'width="20"').replace(/height="24"/, 'height="20"').replace(/stroke-width="2"/, 'stroke-width="1.9"'); try { localStorage.setItem(key, t); } catch (e) {} return t; }).catch(() => null);
  }
  if (!document.getElementById("wj-web-ico")) { const st = document.createElement("style"); st.id = "wj-web-ico"; st.textContent = ".wj-ico.wj-web svg{display:block;width:20px;height:20px}.wj-ico.wj-web *{animation:none!important}"; (document.head || document.documentElement).appendChild(st); }
  let nav = null, active = null;
  function glitch(a) {
    a.classList.remove("wj-hit"); void a.offsetWidth; a.classList.add("wj-hit");
    setTimeout(() => a.classList.remove("wj-hit"), 650);
  }
  function setupNav(n) {
    nav = n;
    [...n.querySelectorAll("a")].forEach(a => {
      const href = file(a.getAttribute("href")), txt = a.textContent.trim(), ico = TAB_ICON[href];
      a.dataset.wjText = txt;
      a.classList.add("wj-tab", "wj-t-" + (ico || "none"));
      if (href === here()) { a.classList.add("wj-on"); active = a; }
      const chars = [...txt].map((ch, i) => '<span class="wj-ch" style="--i:' + i + '">' + (ch === " " ? "&nbsp;" : esc(ch)) + "</span>").join("");
      a.innerHTML = (ico ? '<span class="wj-ico">' + spriteSvg(ico) + "</span>" : "") + '<span class="wj-txt">' + chars + "</span>";
      const tb = TABLER[href]; if (tb) webIcon(tb).then(svg => { const el = a.querySelector(".wj-ico"); if (svg && el) { el.innerHTML = svg; el.classList.add("wj-web"); } });
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
