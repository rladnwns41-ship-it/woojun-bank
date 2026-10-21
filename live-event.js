/* 우준은행 실시간 질문 이벤트. 기존 화면과 분리된 Shadow DOM을 사용한다. */
(function () {
  "use strict";
  if (window.WJLiveEvent) return;
  window.WJLiveEvent = { version: "20261022" };
  const W = window.WJ;
  if (!W) return;
  const isAdminPage = /(?:^|\/)admin\.dc\.html$/.test(location.pathname);
  const style = `
    :host{font-family:'Pretendard Variable',Pretendard,system-ui,sans-serif;color:#191f28;font-size:14px;line-height:1.5;letter-spacing:-.2px}
    *{box-sizing:border-box} [hidden]{display:none!important} button,input,textarea,select{font:inherit} button{cursor:pointer;border:0;border-radius:11px;background:#eef2f7;color:#344054;padding:10px 14px;font-weight:700}button:hover{filter:brightness(.96)}button:disabled{cursor:wait;opacity:.5}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #8ebfff;outline-offset:2px}
    .primary{background:#3182f6;color:white}.danger{background:#fff0f2;color:#d92d4c}.muted{color:#6b7684;font-size:12px}.row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.spread{justify-content:space-between}.stack{display:flex;flex-direction:column;gap:12px}.pill{font-size:11px;font-weight:800;border-radius:30px;background:#e8f3ff;color:#1765ce;padding:4px 9px}.hot{background:#fff1e6;color:#b54708}
    h2,h3,p{margin:0}h2{font-size:20px}h3{font-size:16px}input:not([type=checkbox]):not([type=radio]),textarea,select{width:100%;padding:11px;border:1px solid #dbe1e8;border-radius:10px;background:white;color:#191f28;min-width:0}textarea{resize:vertical}label{display:block}input[type=checkbox]{width:18px;height:18px;flex:none;accent-color:#3182f6}.box{padding:14px;background:#f7f9fc;border-radius:13px}.wrap{white-space:pre-wrap;overflow-wrap:anywhere}.error{color:#d92d4c;font-size:13px;min-height:20px}
    .dock{position:fixed;bottom:22px;right:22px;z-index:100050;max-width:calc(100vw - 24px)}.launcher{background:#191f28;color:white;box-shadow:0 5px 25px #0002;max-width:min(420px,calc(100vw - 24px));display:flex;gap:10px;align-items:center;text-align:left}.launcher span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .panel{width:430px;max-width:calc(100vw - 24px);background:white;border:1px solid #e4e7ec;box-shadow:0 12px 60px #19294330;border-radius:22px;overflow:hidden;margin-bottom:10px}.head{padding:16px 18px;border-bottom:1px solid #edf0f4}.head button{padding:4px 10px;font-size:20px}.content{padding:18px;max-height:min(67vh,650px);overflow:auto;overscroll-behavior:contain}.question{font-size:21px;font-weight:800;line-height:1.45}.answers{display:flex;flex-direction:column;gap:8px}.answer{border-radius:12px;padding:12px;background:#f4f6f9}.answer.hot{background:#fff1e6;color:#823f05}.answer b{font-size:13px}.answer .wrap{margin-top:4px}.option{display:flex;gap:9px;align-items:flex-start;padding:11px;border:1px solid #e4e7ec;border-radius:10px;cursor:pointer}.option input{margin-top:4px;flex:none;width:18px;height:18px;accent-color:#3182f6}.option span{overflow-wrap:anywhere}.consent{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#4e5968}.notice{background:#e8f3ff;border-radius:12px;padding:12px;color:#1b64da}.flash{position:fixed;top:76px;left:50%;transform:translateX(-50%);z-index:100060;width:max-content;max-width:min(560px,calc(100vw - 24px));padding:15px 20px;border-radius:15px;background:#191f28;color:white;box-shadow:0 8px 28px #0002;pointer-events:none}.flash.hot{background:#8b3c08;color:white}
    .admin{max-width:1280px;margin:20px auto;padding:22px;background:white;border:1px solid #e1e7ee;border-radius:22px}.admin summary{cursor:pointer;list-style:none}.admin summary::-webkit-details-marker{display:none}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.formlabel{font-size:13px;font-weight:700;margin-bottom:5px}.choice{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.choice label{display:flex;align-items:center;gap:4px;font-size:12px;white-space:nowrap}.adminfeed{max-height:250px;overflow:auto}.adminstatus{color:#1765ce;min-height:21px}.small{padding:5px 9px;font-size:12px}
    @media(max-width:700px){.dock{right:12px;bottom:calc(80px + env(safe-area-inset-bottom,0px))}.panel{width:calc(100vw - 24px)}.content{max-height:55vh}.grid{grid-template-columns:1fr}.admin{margin:12px;padding:16px}.flash{top:66px}.question{font-size:19px}}
  `;
  let db, ev = {}, key = null, host, root, adminHost, admin, unsubscribe = [], clock, generation = 0;
  let seen = new Set(), roundID = null, noticeID = null, formSignature = "", busy = false, connected = false, hideTimer;
  const $ = (sel, where = root) => where.querySelector(sel);
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
  const safeStore = { get(k) { try { return localStorage.getItem(k) || ""; } catch (_) { return ""; } }, set(k,v) { try { localStorage.setItem(k,v); } catch (_) {} } };
  const time = at => new Date(at).toLocaleTimeString("ko-KR", {timeZone:"Asia/Seoul", hour:"2-digit", minute:"2-digit", second:"2-digit"});
  let serverOffset = 0;
  const currentTime = () => Date.now() + serverOffset;
  const isOpen = () => !!ev.id && ev.open && (!ev.deadline || currentTime() < ev.deadline);
  const mine = () => ev.answers && ev.answers[key];
  const eligible = () => ev.target === "all" || ev.target === key;
  function flash(message, hot) {
    if (!root) return;
    const n = $(".flash"); n.textContent = message; n.classList.toggle("hot", !!hot); n.hidden = false;
    clearTimeout(hideTimer); hideTimer = setTimeout(() => { n.hidden = true; }, 8500);
  }
  function createPublic() {
    host = document.createElement("div"); host.id = "wj-live-event";
    root = host.attachShadow({mode:"open"});
    root.innerHTML = `<style>${style}</style><div class="flash wrap" role="status" hidden></div><div class="dock" hidden>
      <section class="panel" aria-label="실시간 질문 이벤트" hidden><div class="head row spread"><div><b>질문 이벤트</b> <span class="pill">LIVE</span><div class="muted connection"></div></div><button type="button" class="collapse" aria-label="이벤트 접기">×</button></div>
      <div class="content stack"><div class="notice wrap" hidden></div><div class="round stack" hidden><div class="row spread"><span class="pill target"></span><span class="muted timer"></span></div><h2 class="question wrap"></h2><div class="form"></div><div class="error" role="status"></div><div class="row spread"><h3>실시간 공개 답변</h3><span class="muted count"></span></div><div class="answers"></div></div><p class="muted empty">다음 질문을 기다리고 있어요.</p></div></section>
      <button type="button" class="launcher" aria-expanded="false"><span>📣</span><span class="launchlabel">질문 이벤트</span></button></div>`;
    document.body.appendChild(host);
    $(".launcher").onclick = () => openPanel($(".panel").hidden);
    $(".collapse").onclick = () => openPanel(false);
  }
  function openPanel(open) { $(".panel").hidden = !open; $(".launcher").setAttribute("aria-expanded", String(open)); }
  function makeFeed(container, moderation) {
    container.replaceChildren();
    const entries = Object.entries(ev.answers || {}).sort((a,b) => b[1].at - a[1].at || a[0].localeCompare(b[0]));
    if (!entries.length) { container.appendChild(el("p", "아직 답변이 없어요.", "muted")); return; }
    entries.forEach(([uid,a]) => {
      const card = el("div", null, "answer" + (a.highlight ? " hot" : ""));
      const top = el("div", null, "row spread"); top.appendChild(el("b", (a.highlight ? "🔥 " : "") + a.name)); top.appendChild(el("span", time(a.at), "muted"));
      card.append(top, el("div", a.text, "wrap"));
      if (moderation) { const del = el("button", "답변 삭제", "danger small"); del.type = "button"; del.onclick = () => adminCall({action:"deleteAnswer",id:ev.id,key:uid}); card.appendChild(del); }
      container.appendChild(card);
    });
  }
  function renderForm() {
    const signature = [ev.id, isOpen(), eligible(), !!mine(), key].join("/");
    if (signature === formSignature) return;
    formSignature = signature;
    const box = $(".form"); box.replaceChildren(); $(".error").textContent = "";
    if (mine()) { box.appendChild(el("p", mine().skipped ? "이번 질문을 패스했어요." : "답변이 공개됐어요. 아래에서 확인하세요.", "muted")); return; }
    if (!isOpen()) { box.appendChild(el("p", "질문이 마감됐어요. 공개된 답변은 계속 볼 수 있어요.", "muted")); return; }
    if (!eligible()) { box.appendChild(el("p", ev.targetName + " 님의 차례예요. 답변을 함께 기다려 주세요.", "muted")); return; }
    const form = el("form", null, "stack");
    if (ev.choices && ev.choices.length) {
      ev.choices.forEach((text, i) => {
        const label = el("label", null, "option"), input = document.createElement("input");
        input.type = "radio"; input.name = "choice"; input.value = String(i); input.required = true;
        label.append(input, el("span", text)); form.appendChild(label);
      });
    } else {
      const text = document.createElement("textarea"); text.name = "text"; text.rows = 3; text.maxLength = 200; text.required = true; text.placeholder = "답변을 입력하세요 (최대 200자)"; text.setAttribute("aria-label", "공개할 답변"); form.appendChild(text);
    }
    const consent = el("label", null, "consent"), check = document.createElement("input"); check.type = "checkbox"; check.name = "consent"; check.required = true;
    consent.append(check, el("span", "제출하면 내 닉네임과 답변이 접속자 모두에게 공개됩니다. 확인했어요.")); form.appendChild(consent);
    const row = el("div", null, "row"), submit = el("button", "답변 공개하기", "primary"), skip = el("button", "패스하기");
    submit.type = "submit"; skip.type = "button";
    row.append(submit, skip); form.appendChild(row); box.appendChild(form);
    const submitAnswer = async skipped => {
      if (busy) return;
      const data = new FormData(form), id = ev.id;
      const payload = skipped ? {id, skip:true} : {id, consent:data.get("consent") === "on", text:String(data.get("text") || ""), choice:data.has("choice") ? Number(data.get("choice")) : -1};
      busy = true; submit.disabled = skip.disabled = true; $(".error").textContent = "전송 중…";
      try { await W.api("event/answer", payload); if (ev.id === id) $(".error").textContent = "접수됐어요."; }
      catch (e) { if (ev.id === id) $(".error").textContent = e.message || "전송하지 못했어요. 다시 시도해 주세요."; }
      finally { busy = false; submit.disabled = skip.disabled = false; }
    };
    form.onsubmit = e => { e.preventDefault(); submitAnswer(false); }; skip.onclick = () => submitAnswer(true);
  }
  function tick() {
    if (!root) return;
    $(".connection").textContent = connected ? "실시간 연결됨" : "연결 재시도 중 · 제출 시 연결이 필요해요";
    $(".timer").textContent = !ev.id ? "" : !isOpen() ? "마감" : ev.deadline ? Math.max(0,Math.ceil((ev.deadline-currentTime())/1000)) + "초 남음" : "시간 제한 없음";
    renderForm();
    if (admin) updateAdminStatus();
  }
  function onEvent(value) {
    const first = roundID === null, oldID = roundID;
    ev = value || {};
    $(".dock").hidden = !ev.id && !ev.notice;
    $(".notice").hidden = !ev.notice; $(".notice").textContent = ev.notice || "";
    $(".round").hidden = !ev.id; $(".empty").hidden = !!ev.id;
    $(".question").textContent = ev.question || "";
    $(".target").textContent = ev.target === "all" ? "전체 참가자" : "🎯 " + (ev.targetName || "지목된 참가자");
    $(".count").textContent = Object.keys(ev.answers || {}).length + "명 응답";
    $(".launchlabel").textContent = ev.question ? "질문 이벤트 · " + ev.question : "공지 · " + ev.notice;
    if (ev.id !== oldID) {
      seen = new Set(Object.keys(ev.answers || {})); roundID = ev.id || "";
      if (ev.id && isOpen()) { if (!isAdminPage) openPanel(true); if (!first) flash("📣 " + ev.targetName + " · " + ev.question); }
    } else {
      Object.entries(ev.answers || {}).forEach(([uid,a]) => {
        if (!seen.has(uid)) flash((a.highlight ? "🔥 주목 답변 · " : "💬 ") + a.name + " — " + ev.question + " → " + a.text, a.highlight);
      });
      // 삭제된 답변을 다시 허용해도 새 답변으로 알림이 간다.
      seen = new Set(Object.keys(ev.answers || {}));
    }
    if (ev.notice && noticeID !== ev.noticeId) { if (!isAdminPage) openPanel(true); if (!first) flash("📣 공지 · " + ev.notice); }
    noticeID = ev.noticeId || "";
    makeFeed($(".answers"), false); tick();
    if (admin) { makeFeed($(".adminfeed", admin), true); updateAdminStatus(); }
  }
  const initialPool = "한 달 동안 한 종목만 산다면? | 주식 | 코인 | 현금\n수익 100%가 났다! 다음 행동은? | 전부 매도 | 절반 매도 | !전 재산 추가 매수\n내 투자 습관을 한 문장으로 말한다면?";
  let onlinePeople = {}, lastPool = "", remaining = [];
  function createAdmin() {
    adminHost = document.createElement("div"); adminHost.id = "wj-live-event-admin";
    admin = adminHost.attachShadow({mode:"open"});
    admin.innerHTML = `<style>${style}</style><details class="admin" open><summary class="row spread"><h2>📣 실시간 질문 이벤트 관리</h2><span class="pill">질문 · 랜덤 지목 · 전체 공개</span></summary>
      <div class="grid"><div class="stack"><div class="box stack"><h3>전체 공지</h3><textarea class="noticeinput" rows="2" maxlength="500" aria-label="전체 공지" placeholder="모든 탭에 띄울 공지 (최대 500자)"></textarea><div class="row"><button type="button" class="primary savenotice">공지 올리기</button><button type="button" class="clearnotice">공지 내리기</button></div></div>
      <div class="box stack"><h3>랜덤 질문함</h3><p class="muted">한 줄에 질문 하나. 선택지는 | 로 구분하고, 강조할 선택지는 앞에 ! 를 붙이세요. 예: 질문 | 선택1 | !선택2<br>질문만 쓰면 주관식이에요. 랜덤 뽑기는 질문함을 한 바퀴 돌 때까지 중복되지 않아요.</p><textarea class="pool" rows="6" aria-label="랜덤 질문함"></textarea><button type="button" class="draw">🎲 질문 랜덤 뽑기</button><span class="muted poolstatus"></span></div></div>
      <div class="stack"><div class="box stack"><h3>질문 올리기</h3><label><span class="formlabel">질문</span><textarea class="questioninput" rows="2" maxlength="300" placeholder="직접 입력하거나 왼쪽에서 랜덤으로 뽑으세요" aria-label="올릴 질문"></textarea></label><div class="choices stack"></div><p class="muted">선택지 2~4개를 쓰거나 전부 비우세요. 강조를 체크한 선택지는 답변 시 주목 알림이 떠요.</p>
      <label><span class="formlabel">답변할 참가자</span><select class="targetselect" aria-label="답변할 참가자"><option value="random">🎯 접속자 중 랜덤 1명</option><option value="all">👥 모두에게 질문</option></select></label><label><span class="formlabel">제한 시간 (초, 0이면 무제한)</span><input class="seconds" type="number" min="0" max="3600" value="60" aria-label="제한 시간"></label><button type="button" class="primary publish">지금 질문 올리기 · 전체 알림</button><p class="muted">새 질문을 올리면 이전 질문과 답변 목록이 교체돼요. 참가자는 공개 안내를 확인하고 제출하거나 패스할 수 있어요.</p></div>
      <div class="box stack"><h3>진행 상황</h3><div class="eventstatus wrap"></div><div class="row"><button type="button" class="closeevent">질문 마감</button><button type="button" class="danger clearevent">질문·답변 내리기</button></div><div class="adminfeed answers"></div></div></div></div><div class="adminstatus wrap" role="status"></div></details>`;
    document.body.prepend(adminHost);
    for (let i=0;i<4;i++) {
      const row = el("div",null,"choice"), input = document.createElement("input"); input.className="choiceinput";input.maxLength=80;input.placeholder="선택지 " +(i+1);input.setAttribute("aria-label",input.placeholder);
      const label = el("label"), check = document.createElement("input");check.type="checkbox";check.className="highlightinput";check.setAttribute("aria-label", "선택지 "+(i+1)+" 강조");label.append(check,el("span","강조"));row.append(input,label);$(".choices",admin).appendChild(row);
    }
    $(".noticeinput",admin).value=ev.notice || "";
    $(".pool",admin).value=safeStore.get("wj_event_pool_v1") || initialPool;
    $(".pool",admin).oninput=e=>safeStore.set("wj_event_pool_v1",e.target.value);
    $(".savenotice",admin).onclick=()=>adminCall({action:"notice",notice:$(".noticeinput",admin).value});
    $(".clearnotice",admin).onclick=()=>adminCall({action:"notice",notice:""});
    $(".draw",admin).onclick=drawQuestion;
    $(".publish",admin).onclick=publish;
    $(".closeevent",admin).onclick=()=>adminCall({action:"close",id:ev.id || ""});
    $(".clearevent",admin).onclick=()=>{if(confirm("현재 질문과 공개 답변을 내릴까요?"))adminCall({action:"clear",id:ev.id || ""});};
    subscribe(db.ref("online"), snap=>{onlinePeople=snap.val() || {};updatePeople();});
    makeFeed($(".adminfeed",admin),true);updateAdminStatus();
  }
  function randomIndex(n) {
    const x=new Uint32Array(1), max=Math.floor(4294967296/n)*n;
    do {crypto.getRandomValues(x);} while(x[0]>=max);
    return x[0]%n;
  }
  function drawQuestion() {
    const source=$(".pool",admin).value;
    const lines=source.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    if(!lines.length)return adminMessage("질문함에 질문을 넣어 주세요.");
    if(lastPool!==source || !remaining.length){lastPool=source;remaining=Array.from(new Set(lines));}
    const line=remaining.splice(randomIndex(remaining.length),1)[0], parts=line.split("|").map(s=>s.trim()), q=parts.shift();
    if(!q || q.length>300 || parts.length===1 || parts.length>4 || parts.some(s=>!s.replace(/^!/,"").trim() || s.replace(/^!/,"").trim().length>80))return adminMessage("질문 형식을 확인하세요. 선택지는 없거나 2~4개, 선택지마다 80자까지예요.");
    $(".questioninput",admin).value=q;
    admin.querySelectorAll(".choice").forEach((row,i)=>{const s=parts[i] || "";$(".choiceinput",row).value=s.replace(/^!/,"").trim();$(".highlightinput",row).checked=s.startsWith("!");});
    $(".poolstatus",admin).textContent="이번 순서에 남은 질문: "+remaining.length+"개";
    adminMessage("질문을 뽑았어요. 내용을 확인하고 ‘지금 질문 올리기’를 누르세요.");
  }
  function updatePeople() {
    if(!admin)return;
    const select=$(".targetselect",admin), selected=select.value;
    while(select.options.length>2)select.remove(2);
    Object.entries(onlinePeople).filter(([k,p])=>k!==key && p.t>currentTime()-90000).sort((a,b)=>String(a[1].n).localeCompare(String(b[1].n))).forEach(([k,p])=>{const o=document.createElement("option");o.value=k;o.textContent=p.n+" (직접 지목)";select.appendChild(o);});
    if(Array.from(select.options).some(o=>o.value===selected))select.value=selected;
  }
  function updateAdminStatus() {
    $(".eventstatus",admin).textContent=ev.id ? (isOpen()?"진행 중":"마감")+" · "+ev.targetName+" · 응답 "+Object.keys(ev.answers || {}).length+"명\n"+ev.question : "진행 중인 질문이 없어요.";
  }
  function adminMessage(text) { if(admin)$(".adminstatus",admin).textContent=text; }
  let adminBusy=false;
  async function adminCall(payload) {
    if(adminBusy)return;
    adminBusy=true;const buttons=Array.from(admin.querySelectorAll("button"));buttons.forEach(b=>b.disabled=true);adminMessage("처리 중…");
    try {const result=await W.api("admin/event",payload);adminMessage(payload.action==="publish"?"질문을 올렸어요 · "+result.targetName:"반영했어요.");return result;}
    catch(e){adminMessage(e.message || "요청하지 못했어요.");}
    finally{adminBusy=false;buttons.forEach(b=>b.disabled=false);}
  }
  function publish() {
    const question=$(".questioninput",admin).value.trim(), choices=[],highlights=[];
    admin.querySelectorAll(".choice").forEach(row=>{const s=$(".choiceinput",row).value.trim();if(s){if($(".highlightinput",row).checked)highlights.push(choices.length);choices.push(s);}});
    const seconds=Number($(".seconds",admin).value);
    if(!question)return adminMessage("질문을 적어 주세요.");
    if(choices.length===1)return adminMessage("선택지를 2~4개 쓰거나 전부 비워 주세요.");
    if(!Number.isInteger(seconds) || seconds<0 || seconds>3600)return adminMessage("시간 제한은 0~3600초로 적어 주세요.");
    adminCall({action:"publish",question,choices,highlights,target:$(".targetselect",admin).value,seconds});
  }
  function subscribe(ref, fn) {
    ref.on("value",fn,e=>{if(root)flash("이벤트 연결 오류 · "+(e.message || "새로고침해 주세요"));});
    unsubscribe.push(()=>ref.off("value",fn));
  }
  function cleanup() {
    unsubscribe.forEach(fn=>fn());unsubscribe=[];clearInterval(clock);clearTimeout(hideTimer);
    if(host)host.remove();if(adminHost)adminHost.remove();host=root=adminHost=admin=null;ev={};key=null;roundID=null;noticeID=null;formSignature="";seen=new Set();busy=false;adminBusy=false;
  }
  async function authChanged(user) {
    const token=++generation;cleanup();if(!user)return;
    try {
      await W.authReady;
      if(token!==generation || W.auth().currentUser?.uid!==user.uid)return;
      key=W.uid() || await W.activateAccount(user);
      if(token!==generation || !key)return;
      createPublic();
      subscribe(db.ref(".info/serverTimeOffset"),s=>{serverOffset=s.val() || 0;});
      subscribe(db.ref(".info/connected"),s=>{connected=!!s.val();tick();});
      subscribe(db.ref("config/liveEvent"),s=>onEvent(s.val()));
      clock=setInterval(tick,1000);
      if(isAdminPage){const allowed=(await db.ref("admin/authorizedUids/"+user.uid).once("value")).val();if(token===generation && allowed===true)createAdmin();}
    } catch(e){if(token===generation && root)flash("이벤트를 연결하지 못했어요 · "+e.message);}
  }
  async function boot() {
    db=await W.ready;
    if(document.readyState==="loading")await new Promise(resolve=>document.addEventListener("DOMContentLoaded",resolve,{once:true}));
    W.auth().onAuthStateChanged(authChanged);
  }
  boot().catch(e=>console.warn("이벤트 초기화 실패",e));
})();
