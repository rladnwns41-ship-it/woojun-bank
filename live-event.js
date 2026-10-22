/* 우준은행 실시간 질문 이벤트. 기존 화면과 분리된 Shadow DOM을 사용한다. */
(function () {
  "use strict";
  if (window.WJLiveEvent) return;
  window.WJLiveEvent = { version: "20261022-question-window" };
  const W = window.WJ;
  if (!W) return;
  const isAdminPage = /(?:^|\/)admin\.dc\.html$/.test(location.pathname);
  const style = `
    :host{font-family:'Pretendard Variable',Pretendard,system-ui,sans-serif;color:#191f28;font-size:14px;line-height:1.5;letter-spacing:-.2px}
    *{box-sizing:border-box} [hidden]{display:none!important} button,input,textarea,select{font:inherit} button{cursor:pointer;border:0;border-radius:11px;background:#eef2f7;color:#344054;padding:10px 14px;font-weight:700}button:hover{filter:brightness(.96)}button:disabled{cursor:wait;opacity:.5}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #8ebfff;outline-offset:2px}
    .primary{background:#3182f6;color:white}.danger{background:#fff0f2;color:#d92d4c}.muted{color:#6b7684;font-size:12px}.row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.spread{justify-content:space-between}.stack{display:flex;flex-direction:column;gap:12px}.pill{font-size:11px;font-weight:800;border-radius:30px;background:#e8f3ff;color:#1765ce;padding:4px 9px}.hot{background:#fff1e6;color:#b54708}
    h2,h3,p{margin:0}h2{font-size:20px}h3{font-size:16px}input:not([type=checkbox]):not([type=radio]),textarea,select{width:100%;padding:11px;border:1px solid #dbe1e8;border-radius:10px;background:white;color:#191f28;min-width:0}textarea{resize:vertical}label{display:block}input[type=checkbox]{width:18px;height:18px;flex:none;accent-color:#3182f6}.box{padding:14px;background:#f7f9fc;border-radius:13px}.wrap{white-space:pre-wrap;overflow-wrap:anywhere}.error{color:#d92d4c;font-size:13px;min-height:20px}
    .panel{position:fixed;inset:0;z-index:99980;width:400px;height:fit-content;max-width:calc(100vw - 24px);max-height:calc(100dvh - 32px);margin:auto;padding:0;background:white;color:#191f28;border:1px solid #e4e9f1;border-radius:16px;box-shadow:0 16px 56px #19294326,0 2px 8px #1929430d;overflow:hidden;animation:window-in .16s ease-out}
    .head{padding:13px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #edf0f4}.heading{flex:1;min-width:0;display:flex;align-items:center;gap:8px}.heading b{font-size:15px}.event-label{font-size:9px;letter-spacing:.6px;font-weight:800;color:#3182f6;background:#edf4ff;padding:3px 6px;border-radius:5px}.window-actions{display:flex;align-items:center;gap:3px}.window-action{width:28px;height:28px;display:grid;place-items:center;padding:0;border:0;border-radius:8px;background:transparent;color:#8591a4}.window-action:hover{background:#f1f4f8;color:#344054}.window-action svg{width:16px;height:16px;display:block;pointer-events:none}
    .content{padding:18px;max-height:calc(100dvh - 98px);overflow:auto;overscroll-behavior:contain}.content.stack{gap:16px}.connection{font-size:12px;color:#b54708}.panel .round{gap:16px}.question-block{display:flex;flex-direction:column;gap:10px}.panel .question{font-size:20px;line-height:1.5;letter-spacing:-.5px}.panel .pill{font-size:11px;background:#f2f4f7;color:#4e5968;padding:3px 8px}.panel .timer{font-variant-numeric:tabular-nums}.panel .form form{gap:10px}.panel .option{padding:11px 12px;align-items:center;transition:border-color .12s,background .12s}.panel .option:has(input:checked){border-color:#3182f6;background:#f3f8ff}.panel .option input{margin:0}.panel .consent{font-size:12px;margin:4px 0;line-height:1.55}.panel .consent input{margin:1px 0 0}.form-actions{display:flex;gap:8px}.form-actions .primary{flex:1}.form-actions button{padding:11px 16px}.form-actions .skip{background:#f2f4f7;color:#6b7684}.error:empty{display:none}.panel.minimized .content{display:none}.panel.minimized .head{border-bottom:0}.responses{border-top:1px solid #edf0f4;padding-top:14px}.responses summary{display:flex;align-items:center;gap:7px;cursor:pointer;list-style:none;color:#6b7684;font-size:12px}.responses summary::-webkit-details-marker{display:none}.responses summary svg{width:14px;height:14px;transition:transform .15s}.responses[open] summary svg{transform:rotate(180deg)}.responses .count{margin-left:auto}.responses .answers{margin-top:12px}.panel .answer{font-size:12px;padding:10px}.panel .notice{border-radius:10px;padding:11px 12px;font-size:13px}.notice-title{display:block;font-size:10px;letter-spacing:.5px;font-weight:800;margin-bottom:4px}.notice-text{white-space:pre-wrap;overflow-wrap:anywhere}
    @keyframes window-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){.panel{animation:none}}
    .question{font-size:21px;font-weight:800;line-height:1.45}.answers{display:flex;flex-direction:column;gap:8px}.answer{border-radius:12px;padding:12px;background:#f4f6f9}.answer.hot{background:#fff1e6;color:#823f05}.answer b{font-size:13px}.answer .wrap{margin-top:4px}.option{display:flex;gap:9px;align-items:flex-start;padding:11px;border:1px solid #e4e7ec;border-radius:10px;cursor:pointer}.option input{margin-top:4px;flex:none;width:18px;height:18px;accent-color:#3182f6}.option span{overflow-wrap:anywhere}.consent{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#4e5968}.notice{background:#e8f3ff;border-radius:12px;padding:12px;color:#1b64da}
    .admin{max-width:1280px;margin:20px auto;padding:22px;background:white;border:1px solid #e1e7ee;border-radius:22px}.admin summary{cursor:pointer;list-style:none}.admin summary::-webkit-details-marker{display:none}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.formlabel{font-size:13px;font-weight:700;margin-bottom:5px}.choice{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.choice label{display:flex;align-items:center;gap:4px;font-size:12px;white-space:nowrap}.adminfeed{max-height:250px;overflow:auto}.adminstatus{color:#1765ce;min-height:21px}.small{padding:5px 9px;font-size:12px}
    @media(max-width:700px){.grid{grid-template-columns:1fr}.admin{margin:12px;padding:16px}.question{font-size:19px}}
  `;
  let db, ev = {}, key = null, host, root, adminHost, admin, unsubscribe = [], clock, generation = 0;
  let seen = new Set(), roundID = null, noticeID = null, formSignature = "", busy = false, connected = false, returnFocus;
  const notifications = new Map();
  const $ = (sel, where = root) => where.querySelector(sel);
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
  const safeStore = { get(k) { try { return localStorage.getItem(k) || ""; } catch (_) { return ""; } }, set(k,v) { try { localStorage.setItem(k,v); } catch (_) {} } };
  const time = at => new Date(at).toLocaleTimeString("ko-KR", {timeZone:"Asia/Seoul", hour:"2-digit", minute:"2-digit", second:"2-digit"});
  let serverOffset = 0;
  const currentTime = () => Date.now() + serverOffset;
  const isOpen = () => !!ev.id && ev.open && (!ev.deadline || currentTime() < ev.deadline);
  const mine = () => ev.answers && ev.answers[key];
  const eligible = () => ev.target === "all" || ev.target === key;
  // 표시 위치·애니메이션·자동 닫힘·개수 제한은 기존 WJUI.toast를 그대로 사용한다.
  function clearAlerts(group) {
    for (const [handle, meta] of notifications) {
      if (meta.group !== group) continue;
      handle?.close?.(); clearTimeout(meta.timer); notifications.delete(handle);
    }
  }
  function flash(message, hot, opt = {}) {
    if (!root) return;
    if (opt.group) clearAlerts(opt.group);
    const group = opt.group || "answer", id = ev.id, notice = ev.noticeId;
    const text = message + (group === "question" ? " · 눌러서 " + (opt.action || "내용 보기") : "");
    const handle = window.WJUI.toast(text, {
      icon: hot ? "🔥" : group === "notice" ? "📣" : group === "question" ? "❓" : "💬",
      ...(group === "question" ? { ms: 8000 } : {}),
      onClick: () => {
        if (!root) return;
        if (group !== "notice" && ev.id !== id || group === "notice" && ev.noticeId !== notice) {
          window.WJUI.toast("새 공지나 질문으로 바뀌었어요. 현재 내용을 보여 드릴게요.");
        }
        openPanel(true);
      }
    });
    if (handle) {
      const timer = setTimeout(() => notifications.delete(handle), group === "question" ? 9500 : 4700);
      notifications.set(handle, {group, timer});
    }
  }
  function announceOnce(kind, id, message, opt) {
    const storageKey = "wj_event_alerts_v2_" + key, marker = kind + ":" + id;
    let shown = [];
    try { shown = JSON.parse(sessionStorage.getItem(storageKey) || "[]"); if (!Array.isArray(shown)) shown = []; } catch (_) {}
    if (shown.includes(marker)) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(shown.concat(marker).slice(-60))); } catch (_) {}
    flash(message, false, opt);
  }
  function createPublic() {
    host = document.createElement("div"); host.id = "wj-live-event";
    root = host.attachShadow({mode:"open"});
    root.innerHTML = `<style>${style}</style>
      <dialog class="panel" aria-label="질문 이벤트" aria-modal="false"><div class="head"><div class="heading"><b>질문 이벤트</b><span class="event-label">EVENT</span></div><div class="window-actions"><button type="button" class="window-action minimize" aria-label="이벤트 접기" aria-expanded="true" title="접기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 12h14"/></svg></button><button type="button" class="window-action collapse" aria-label="이벤트 닫기" title="닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div></div>
      <div class="content stack"><p class="connection" role="status" hidden></p><div class="notice" hidden><span class="notice-title">공지</span><div class="notice-text"></div></div><div class="round stack" hidden><div class="question-block"><div class="row spread"><span class="pill target"></span><span class="muted timer"></span></div><h2 class="question wrap"></h2></div><div class="form"></div><div class="error" role="status"></div><details class="responses"><summary><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg><span>공개 답변 보기</span><span class="count"></span></summary><div class="answers"></div></details></div><p class="muted empty">다음 질문을 기다리고 있어요.</p></div></dialog>`;
    document.body.appendChild(host);
    $(".collapse").onclick = () => openPanel(false);
    $(".minimize").onclick = () => {
      const folded = $(".panel").classList.toggle("minimized");
      $(".minimize").setAttribute("aria-expanded", String(!folded));
      $(".minimize").setAttribute("aria-label", folded ? "이벤트 펼치기" : "이벤트 접기");
      $(".minimize").title = folded ? "펼치기" : "접기";
    };
    $(".panel").addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); openPanel(false); } });
    $(".panel").addEventListener("close", () => { if (returnFocus?.isConnected) returnFocus.focus(); });


  }
  function openPanel(open) {
    if (!root) return;
    const dialog = $(".panel");
    if (open) {
      dialog.classList.remove("minimized");
      $(".minimize").setAttribute("aria-expanded", "true");
      $(".minimize").setAttribute("aria-label", "이벤트 접기"); $(".minimize").title = "접기";
      if (!dialog.open) { returnFocus = root.activeElement || document.activeElement; dialog.show(); }
    }
    else if (!open && dialog.open) dialog.close();
  }
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
    if (mine()) { box.appendChild(el("p", mine().skipped ? "이번 질문을 패스했어요." : "답변을 공개했어요.", "muted")); return; }
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
    consent.append(check, el("span", "내 닉네임과 답변이 모두에게 공개되는 데 동의해요.")); form.appendChild(consent);
    const row = el("div", null, "form-actions"), submit = el("button", "답변 제출", "primary"), skip = el("button", "패스", "skip");
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
    $(".connection").hidden = connected;
    $(".connection").textContent = connected ? "" : "연결을 다시 시도하고 있어요. 잠시 후 제출해 주세요.";
    $(".timer").textContent = !ev.id ? "" : !isOpen() ? "마감" : ev.deadline ? Math.max(0,Math.ceil((ev.deadline-currentTime())/1000)) + "초 남음" : "시간 제한 없음";
    renderForm();
    if (admin) updateAdminStatus();
  }
  function onEvent(value) {
    const oldID = roundID;
    ev = value || {};
    $(".notice").hidden = !ev.notice; $(".notice-text").textContent = ev.notice || "";
    $(".round").hidden = !ev.id; $(".empty").hidden = !!ev.id;
    $(".question").textContent = ev.question || "";
    $(".target").textContent = ev.target === "all" ? "전체 참가자" : "🎯 " + (ev.targetName || "지목된 참가자");
    $(".count").textContent = Object.keys(ev.answers || {}).length + "명 응답";
    if (ev.id !== oldID) {
      seen = new Set(Object.keys(ev.answers || {})); roundID = ev.id || "";
      $(".responses").open = false;
      clearAlerts("question"); clearAlerts("answer");
      openPanel(false);
      if (ev.id && isOpen()) announceOnce("question", ev.id, "질문 이벤트 · " + ev.targetName + "\n" + ev.question, {group:"question", action:eligible() && !mine() ? "답변하기" : "내용 보기"});
    } else {
      Object.entries(ev.answers || {}).forEach(([uid,a]) => {
        if (!seen.has(uid)) flash((a.highlight ? "주목 답변 · " : "") + a.name + " — " + ev.question + " → " + a.text, a.highlight);
      });
      // 삭제된 답변을 다시 허용해도 새 답변으로 알림이 간다.
      seen = new Set(Object.keys(ev.answers || {}));
    }
    if (ev.notice && noticeID !== ev.noticeId) announceOnce("notice", ev.noticeId || ev.notice, "공지 · " + ev.notice, {group:"notice"});
    if (!ev.notice) clearAlerts("notice");
    if (!ev.id || !isOpen()) clearAlerts("question");
    if (!ev.id && !ev.notice) openPanel(false);
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
      <div class="grid"><div class="stack"><div class="box stack"><h3>전체 공지</h3><textarea class="noticeinput" rows="2" maxlength="500" aria-label="전체 공지" placeholder="알림으로 보낼 공지 (최대 500자)"></textarea><div class="row"><button type="button" class="primary savenotice">공지 올리기</button><button type="button" class="clearnotice">공지 내리기</button></div></div>
      <div class="box stack"><h3>랜덤 질문함</h3><p class="muted">한 줄에 질문 하나. 선택지는 | 로 구분하고, 강조할 선택지는 앞에 ! 를 붙이세요. 예: 질문 | 선택1 | !선택2<br>질문만 쓰면 주관식이에요. 랜덤 뽑기는 질문함을 한 바퀴 돌 때까지 중복되지 않아요.</p><textarea class="pool" rows="6" aria-label="랜덤 질문함"></textarea><button type="button" class="draw">🎲 질문 랜덤 뽑기</button><span class="muted poolstatus"></span></div></div>
      <div class="stack"><div class="box stack"><h3>질문 올리기</h3><label><span class="formlabel">질문</span><textarea class="questioninput" rows="2" maxlength="300" placeholder="직접 입력하거나 왼쪽에서 랜덤으로 뽑으세요" aria-label="올릴 질문"></textarea></label><div class="choices stack"></div><p class="muted">선택지 2~4개를 쓰거나 전부 비우세요. 강조를 체크한 선택지는 답변 시 주목 알림이 떠요.</p>
      <label><span class="formlabel">답변할 참가자</span><select class="targetselect" aria-label="답변할 참가자"><option value="random">🎯 접속자 중 랜덤 1명</option><option value="all">👥 모두에게 질문</option></select></label><label><span class="formlabel">제한 시간 (초, 0이면 무제한)</span><input class="seconds" type="number" min="0" max="3600" value="60" aria-label="제한 시간"></label><button type="button" class="primary publish">지금 질문 올리기 · 전체 알림</button><p class="muted">질문은 알림으로 도착하고, 참가자가 ‘답변하기’를 누르면 답변창이 열려요. 새 질문을 올리면 이전 질문과 답변 목록이 교체돼요. 참가자는 공개 안내를 확인하고 제출하거나 패스할 수 있어요.</p></div>
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
    unsubscribe.forEach(fn=>fn());unsubscribe=[];clearInterval(clock);
    for (const [handle, meta] of notifications) { handle?.close?.(); clearTimeout(meta.timer); }
    notifications.clear(); returnFocus=null;
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
    // 관리자/로그인 화면도 같은 공통 알림 코드를 사용한다.
    if (!document.querySelector('link[href*="wj-ui.css"]')) {
      const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "wj-ui.css"; document.head.appendChild(css);
    }
    if (!window.WJUI?.toast) await new Promise((resolve, reject) => {
      const script = document.createElement("script"); script.src = "wj-ui.js?v=20261022-native-toast";
      script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
    });
    window.WJLiveEvent.active = () => !!root && !!(ev.id || ev.notice);
    window.WJLiveEvent.open = () => openPanel(true);
    W.auth().onAuthStateChanged(authChanged);
  }
  boot().catch(e=>console.warn("이벤트 초기화 실패",e));
})();
