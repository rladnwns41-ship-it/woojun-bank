// Two-player additions for the original BG match/replay interface.
// Artwork: OpenMoji contributors, CC BY-SA 4.0; see assets/ATTRIBUTION.md.
(function () {
  'use strict';
  const B=window.BG; if (!B || B.duoLoaded || !B.art) return; B.duoLoaded=true;
  const A=B.art, F="'Pretendard Variable',Pretendard,sans-serif";
  const names=['바퀴벌레','개구리','딱정벌레','박쥐','파리','거미','쥐','전갈'];
  const art=['cockroach','frog','beetle','bat','fly','spider','rat','scorpion'];
  const colors=['#dca66b','#98c885','#d9bfee','#b4a5d4','#a8ced7','#efba9e','#c5c3cc','#e9b365'];
  A.preload([...art,'penguin','detective','hammer'].map(k=>'assets/openmoji/'+k+'.svg'));
  const rng=seed=>{let n=seed|0;return()=>((n=Math.imul(n,1664525)+1013904223|0)>>>0)/4294967296;};
  const shuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const copy=s=>JSON.parse(JSON.stringify(s));
  const sum=a=>a.reduce((x,y)=>x+y,0);
  function rect(x,X,Y,w,h,r,c,edge){x.fillStyle=c;x.beginPath();x.roundRect(X,Y,w,h,r);x.fill();if(edge){x.strokeStyle=edge;x.lineWidth=1;x.stroke();}}
  function text(x,t,X,Y,size=14,c='#263649',weight=700,align='center'){x.fillStyle=c;x.font=weight+' '+size+'px '+F;x.textAlign=align;x.textBaseline='middle';x.fillText(t,X,Y);}
  function asset(x,k,X,Y,w,h=w){const im=A.img('assets/openmoji/'+k+'.svg');if(im)x.drawImage(im,X,Y,w,h);}
  function shadow(x,draw,blur=14,dy=6){x.save();x.shadowColor='#10203130';x.shadowBlur=blur;x.shadowOffsetY=dy;draw();x.restore();}
  function button(x,ui,id,X,Y,w,h,label,bg='#fff',fg='#263649',enabled=true){rect(x,X,Y,w,h,11,enabled?bg:'#ffffff18');text(x,label,X+w/2,Y+h/2,13,enabled?fg:'#a6a8ad');if(enabled)ui.hits.push({id,X,Y,w,h});}
  function hit(ui,X,Y){return(ui.hits||[]).find(b=>X>=b.X&&Y>=b.Y&&X<=b.X+b.w&&Y<=b.Y+b.h)?.id;}
  function backdrop(x,top,bottom){const g=x.createLinearGradient(0,0,560,560);g.addColorStop(0,top);g.addColorStop(1,bottom);rect(x,0,0,560,560,22,g);}
  function capStrip(x,caps,y,label){
    const left=22,width=516,pad=12,slot=(width-pad*2)/8;
    rect(x,left,y,width,51,12,'#ffffff0d');
    x.save();x.beginPath();x.roundRect(left,y,width,51,12);x.clip();
    text(x,label,left+pad,y+9,9,'#dfd4c0',650,'left');
    caps.forEach((n,k)=>{
      const X=left+pad+k*slot+(slot-46)/2;
      asset(x,art[k],X,y+18,24);
      text(x,n+'',X+38,y+30,14,n>=3?'#ffbd8f':'#fff');
    });
    x.restore();
  }
  const poker={id:'cockroach',name:'바퀴벌레 포커',tag:'심리',color:'#54714D',sides:['선공','후공'],sideColor:['#426950','#B27443'],turnSec:90,privateView:true,
    desc:'1:1 블러핑 대결. 손패를 고르고 다른 동물이라고 속여 보세요. 상대가 진실·거짓을 판단해 틀린 쪽이 카드를 받아요. 같은 동물 5장을 모으거나 낼 카드가 없으면 패배.',
    keys:'내 손패 → 주장할 동물 → 상대의 진실·거짓 판단',
    init(seed){const d=shuffle(Array.from({length:64},(_,i)=>i%8),rng(seed));d.splice(0,16);const h=[Array(8).fill(0),Array(8).fill(0)];d.forEach((k,i)=>h[i%2][k]++);return{h,cap:[Array(8).fill(0),Array(8).fill(0)],t:0,phase:'offer',claim:-1,card:-1,from:-1,n:0,msg:'카드를 고르고 어떤 동물인지 주장하세요.',win:null};},
    turn:s=>s.t,
    legal(s){if(s.win)return[];if(s.phase==='judge')return[{a:'judge',yes:true},{a:'judge',yes:false}];const out=[];s.h[s.t].forEach((n,k)=>{if(n)for(let c=0;c<8;c++)out.push({a:'offer',k,c});});return out;},
    apply(s,m){if(s.win||!m||typeof m!=='object')return s;const n=copy(s);if(s.phase==='offer'){if(m.a!=='offer'||!Number.isInteger(m.k)||!Number.isInteger(m.c)||m.k<0||m.k>7||m.c<0||m.c>7||!s.h[s.t][m.k])return s;n.h[s.t][m.k]--;n.card=m.k;n.claim=m.c;n.from=s.t;n.t=1-s.t;n.phase='judge';n.msg='상대가 “'+names[m.c]+'”라고 말했어요. 믿을까요?';}
      else{if(m.a!=='judge'||typeof m.yes!=='boolean')return s;const truthful=s.card===s.claim,loser=m.yes===truthful?s.from:s.t;n.cap[loser][s.card]++;n.t=loser;n.phase='offer';n.msg='정체는 '+names[s.card]+'! '+(loser===s.t?'판단에 실패해 받았어요.':'상대를 잡아내 카드를 돌려줬어요.');if(n.cap[loser][s.card]>=5)n.win={w:1-loser,why:names[s.card]+' 5장 누적'};else if(!sum(n.h[loser]))n.win={w:1-loser,why:'낼 손패가 없어요'};n.card=-1;n.claim=-1;}
      n.n++;return n;},
    result:s=>s.win,
    hit(s,X,Y,v){const h=hit(v.ui,X,Y);if(!h)return null;if(h.startsWith('card:'))return{sel:+h.split(':')[1]};if(h.startsWith('claim:')&&v.sel>=0&&v.myTurn)return{move:{a:'offer',k:v.sel,c:+h.split(':')[1]}};if(h==='truth'||h==='lie')return v.myTurn?{move:{a:'judge',yes:h==='truth'}}:null;return null;},
    draw(x,s,v){const ui=v.ui;ui.hits=[];backdrop(x,'#294c3d','#142c26');x.save();x.strokeStyle='#e7d4a637';x.lineWidth=1;x.beginPath();x.roundRect(12,12,536,536,17);x.stroke();x.restore();text(x,'COCKROACH POKER',25,31,12,'#d6c799',800,'left');text(x,'상대 손패 '+(v.me>=0?sum(s.h[1-v.me]):'?')+'장',25,52,11,'#bfd3c6',600,'left');capStrip(x,v.me<0?Array(8).fill(0):s.cap[1-v.me],72,'상대가 받은 카드');
      const selected=v.sel>=0&&v.me===s.t&&s.phase==='offer'?v.sel:-1,show=s.phase==='judge'?s.claim:selected;
      shadow(x,()=>rect(x,35,151,157,179,14,'#f8f1df','#d2bc8d'));rect(x,44,160,139,161,10,show>=0?colors[show]:'#e8dec6');text(x,show>=0?names[show]:'비밀 카드',113,181,13,'#4a3b2d');if(show>=0)asset(x,art[show],59,196,109);else{asset(x,'cockroach',67,200,91);text(x,'?',113,264,58,'#263d35');}text(x,s.phase==='judge'?'상대의 주장':'선택한 손패',113,310,10,'#594e3d');
      if(s.phase==='offer'){text(x,v.myTurn?'어떤 동물이라고 할까요?':'상대가 카드를 고르고 있어요',214,168,17,'#fff',800,'left');text(x,selected<0?'아래 손패에서 동물을 먼저 골라요.':'진짜 정체: '+names[selected]+' · 다른 이름으로 속여도 돼요',214,193,11,'#c9d8cd',600,'left');names.forEach((name,k)=>button(x,ui,'claim:'+k,214+(k%4)*80,222+Math.floor(k/4)*48,73,39,name,selected>=0?colors[k]:'#ffffff0d','#26372d',selected>=0&&v.myTurn));}
      else{text(x,'“이건 '+names[s.claim]+'예요.”',215,175,21,'#fff',850,'left');text(x,v.me===s.from?'내가 낸 카드: '+names[s.card]:'상대의 표정을 읽고 판단해요.',215,207,12,'#c5d8c9',600,'left');button(x,ui,'truth',214,246,151,52,'진실! 맞아요','#f5e6b9','#314536',v.myTurn);button(x,ui,'lie',376,246,148,52,'거짓! 아니에요','#e3b4a1','#542f2c',v.myTurn);text(x,'틀린 사람이 카드를 가져가요',214,318,11,'#adc2b3',600,'left');}
      rect(x,22,347,516,35,10,'#081d1880');text(x,s.msg,280,365,11,'#e8e1ce',600);capStrip(x,v.me<0?Array(8).fill(0):s.cap[v.me],392,'내가 받은 카드 · 같은 동물 5장이면 패배');text(x,'내 손패',26,455,10,'#bdd0c3',700,'left');
      for(let k=0;k<8;k++){const X=22+k*65,n=v.me>=0?s.h[v.me][k]:0,on=selected===k;shadow(x,()=>rect(x,X,469,59,72,9,n?'#faf4e6':'#ffffff0b',on?'#ffdc7e':null),5,2);if(on){x.strokeStyle='#ffdc7e';x.lineWidth=3;x.stroke();}if(n){asset(x,art[k],X+7,474,45);text(x,n+'장',X+30,528,11,'#4f5449');if(v.myTurn&&s.phase==='offer')ui.hits.push({id:'card:'+k,X,Y:469,w:59,h:72});}else text(x,'—',X+30,503,17,'#82978b');}
    },extra:s=>s.cap.map((a,i)=>'손패 '+sum(s.h[i])+'장 · 받은 카드 '+sum(a)+'장')};
  B.GAMES.push(poker);

  const hexes=[];for(let q=-3;q<=3;q++)for(let r=-3;r<=3;r++)if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=3)hexes.push({q,r,rim:Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))===3});
  const center=hexes.findIndex(h=>h.q===0&&h.r===0),neighbors=hexes.map(h=>hexes.map((b,i)=>Math.max(Math.abs(h.q-b.q),Math.abs(h.r-b.r),Math.abs(h.q+h.r-b.q-b.r))===1?i:-1).filter(i=>i>=0));
  const hp=i=>[280+Math.sqrt(3)*29*(hexes[i].q+hexes[i].r/2),267+43.5*hexes[i].r];
  function hexPath(x,X,Y,R){x.beginPath();for(let k=0;k<6;k++){const a=(k*60-30)*Math.PI/180;x[k?'lineTo':'moveTo'](X+R*Math.cos(a),Y+R*Math.sin(a));}x.closePath();}
  function iceTargets(s){return s.b.map((c,i)=>c&&i!==center&&(s.spin==='any'||s.spin===c)?i:-1).filter(i=>i>=0);}
  const TAU=Math.PI*2, SECTOR=TAU/6;
  const REDUCED_MOTION=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ROLL_MS=REDUCED_MOTION?120:2700, REVEAL_MS=1250;
  const WHEEL_COLORS=['#56bce9','#f1fbff','#56bce9','#f1fbff','#f5ce72','#e6a39b'];
  const WHEEL_LABELS=['파랑','흰색','파랑','흰색','아무거나','쉬어가기'];
  const norm=a=>((a%TAU)+TAU)%TAU;
  const rollAngle=roll=>-Math.PI/2-(roll+.5)*SECTOR;
  function circle(x,X,Y,r,c){x.beginPath();x.arc(X,Y,r,0,TAU);x.fillStyle=c;x.fill();}
  function icePresentation(s,ui,now){
    const sequence=s.rollN||0;
    if(ui.iceSeenRoll==null){
      // Reopening an old room shows the settled result rather than replaying it.
      ui.iceSeenRoll=sequence;ui.iceAngle=s.roll==null?0:rollAngle(s.roll);
    }else if(sequence!==ui.iceSeenRoll){
      const from=ui.iceAngle||0;
      const target=from+TAU*6+norm(rollAngle(s.roll)-from);
      ui.iceSeenRoll=sequence;ui.iceSpin={start:now,from,target,roll:s.roll,by:s.rolledBy};
      ui.icePendingUntil=0;
    }
    const spin=ui.iceSpin;
    if(spin){
      const elapsed=now-spin.start,p=Math.min(1,Math.max(0,elapsed/ROLL_MS));
      ui.iceAngle=REDUCED_MOTION?spin.target:spin.from+(spin.target-spin.from)*(1-Math.pow(1-p,5));
      if(elapsed>=ROLL_MS+REVEAL_MS){ui.iceAngle=spin.target;ui.iceSpin=null;}
      else ui.animUntil=Math.max(ui.animUntil||0,now+100);
    }
    if(ui.icePendingUntil>now)ui.animUntil=Math.max(ui.animUntil||0,now+100);
    return ui.iceSpin;
  }
  function rouletteWheel(x,cx,cy,r,angle,progress,now,mini=false){
    x.save();x.translate(cx,cy);
    const metal=x.createLinearGradient(-r,-r,r,r);
    metal.addColorStop(0,'#f9ffff');metal.addColorStop(.25,'#a8daee');metal.addColorStop(.52,'#edfaff');metal.addColorStop(1,'#3e80a3');
    x.shadowColor=mini?'#154c7730':'#6ae0ff80';x.shadowBlur=mini?8:28;x.shadowOffsetY=mini?3:9;
    circle(x,0,0,r+12,metal);x.shadowColor='transparent';
    circle(x,0,0,r+6,'#174e70');
    if(!mini){
      for(let i=0;i<36;i++){
        const a=i*TAU/36,light=progress<1?norm(a+angle*.35)<1.7:Math.abs(Math.atan2(Math.sin(a+Math.PI/2),Math.cos(a+Math.PI/2)))<.55;
        circle(x,Math.cos(a)*(r+8),Math.sin(a)*(r+8),light?2.1:1.5,light?'#d9fbff':'#427a98');
      }
    }
    x.save();x.rotate(angle);
    for(let i=0;i<6;i++){
      x.beginPath();x.moveTo(0,0);x.arc(0,0,r-3,i*SECTOR,(i+1)*SECTOR);x.closePath();
      const glaze=x.createRadialGradient(0,-r*.3,r*.12,0,0,r);
      glaze.addColorStop(0,i===0||i===2?'#b2ecff':i===4?'#ffe6a5':i===5?'#f8d2c6':'#ffffff');glaze.addColorStop(1,WHEEL_COLORS[i]);
      x.fillStyle=glaze;x.fill();x.strokeStyle='#ffffffb0';x.lineWidth=mini?1:2;x.stroke();
      if(!mini){
        const a=(i+.5)*SECTOR;x.save();x.translate(Math.cos(a)*r*.69,Math.sin(a)*r*.69);x.rotate(a+Math.PI/2);
        text(x,WHEEL_LABELS[i],0,0,i===5?12:14,'#1e5270',850);x.restore();
        // Frost facets give each wedge a physical edge.
        x.strokeStyle='#ffffff80';x.lineWidth=1;x.beginPath();x.arc(0,0,r-10,i*SECTOR+.04,(i+1)*SECTOR-.04);x.stroke();
      }
    }
    x.restore();
    const hub=x.createRadialGradient(-r*.12,-r*.14,2,0,0,r*.3);hub.addColorStop(0,'#ffffff');hub.addColorStop(1,'#a7d6e9');
    circle(x,0,0,mini?r*.27:42,'#2e6d8b');circle(x,0,-1,mini?r*.22:38,hub);
    if(mini)circle(x,0,-1,3,'#397a9c');else{asset(x,'penguin',-24,-31,48,53);text(x,'SPIN',0,25,8,'#367697',900);}
    // Fixed twelve-o'clock pointer; the selected wedge stops under its tip.
    const moving=progress<1&&!REDUCED_MOTION;
    const flick=moving?Math.sin(angle*24)*Math.min(.16,(1-progress)*.5):0;
    x.save();x.translate(0,-r-7);x.rotate(flick);x.shadowColor='#143b5555';x.shadowBlur=5;x.shadowOffsetY=3;
    x.beginPath();x.moveTo(mini?-7:-17,mini?-9:-17);x.lineTo(mini?7:17,mini?-9:-17);x.lineTo(0,mini?10:24);x.closePath();
    x.fillStyle='#ffd96d';x.fill();x.strokeStyle='#fff6cc';x.lineWidth=mini?1:2;x.stroke();x.restore();
    x.restore();
  }
  function rouletteStage(x,s,ui,spin,now){
    const p=Math.min(1,Math.max(0,(now-spin.start)/ROLL_MS)),done=p>=1;
    ui.hits=[];
    x.save();
    const fog=x.createLinearGradient(0,0,0,560);fog.addColorStop(0,'#102d44f5');fog.addColorStop(.5,'#174f6cec');fog.addColorStop(1,'#0b2c45f7');
    rect(x,0,0,560,560,22,fog);
    text(x,'PENGUIN ROULETTE',280,38,13,'#b4efff',850);
    text(x,done?'룰렛 결과':'펭귄의 운명을 돌려요',280,64,19,'#f0fbff',850);
    if(!REDUCED_MOTION){
      for(let i=0;i<26;i++){
        const a=i*2.399+now*.00005,rad=180+Math.sin(now*.001+i)*15;
        const X=280+Math.cos(a)*rad,Y=258+Math.sin(a)*rad;
        x.globalAlpha=.18+(1+Math.sin(now*.004+i))*.22;
        circle(x,X,Y,i%3===0?2:1,'#bcefff');
      }
      x.globalAlpha=1;
    }
    rouletteWheel(x,280,258,149,ui.iceAngle,p,now);
    // A quiet, rate-limited tick slows down with the actual wheel.
    const tick=Math.floor(ui.iceAngle/(TAU/36));
    if(!done&&tick!==spin.tick&&now-(spin.soundAt||0)>100){
      spin.tick=tick;spin.soundAt=now;if(window.WJ&&!document.hidden)window.WJ.sfx('click');
    }
    if(done&&!spin.announced){spin.announced=true;if(window.WJ&&!document.hidden)window.WJ.sfx('bell');}
    shadow(x,()=>rect(x,54,434,452,108,18,'#f5fcfff2','#ffffff66'),18,5);
    if(done){
      const label=s.phase==='spin'&&s.spin!=='skip'?'해당 색 얼음이 없어요':spin.roll===5?'한 번 쉬어가기':spin.roll===4?'원하는 얼음을 깨세요':spin.roll===0||spin.roll===2?'파란 얼음을 깨세요':'하얀 얼음을 깨세요';
      const fg=spin.roll===5?'#9b645c':spin.roll===4?'#8c6820':'#205d7d';
      text(x,'결과 확정',280,453,10,'#7193a5',750);
      text(x,label,280,478,23,fg,900);
      text(x,s.msg,280,503,11,'#5e7d90',650);
      text(x,'눌러서 계속  ·  잠시 후 자동으로 닫혀요',280,526,10,'#8ca6b4',600);
      ui.hits.push({id:'close-spin',X:54,Y:434,w:452,h:108});
    }else{
      text(x,'어떤 얼음이 나올까요?',280,461,21,'#275b78',850);
      text(x,'파랑 · 흰색 · 아무거나 · 쉬어가기',280,488,12,'#6e8b9b',650);
      rect(x,128,513,304,5,3,'#d5e7ee');rect(x,128,513,Math.max(5,304*p),5,3,'#6bbbd9');
    }
    x.restore();
  }
  const ice={id:'penguin',name:'펭귄 얼음 깨기',tag:'캐주얼',color:'#5D9AB6',sides:['파랑','노랑'],sideColor:['#3182F6','#FFC342'],turnSec:60,ui:true,
    desc:'1:1 얼음 깨기. 룰렛에 나온 색의 얼음 한 칸을 깨세요. 테두리와 연결이 끊긴 얼음은 함께 떨어져요. 가운데 펭귄을 떨어뜨린 사람이 패배!',keys:'룰렛 클릭 또는 Space → 결과 확인 → 표시된 색의 얼음 깨기',
    init(seed){const r=rng(seed);return{b:hexes.map((h,i)=>i===center?'white':r()<.5?'blue':'white'),t:0,phase:'spin',seed:seed|0,n:0,spin:'any',last:[],msg:'얼음 위 펭귄을 지켜 주세요!',win:null};},turn:s=>s.t,
    legal:s=>s.win?[]:s.phase==='spin'?[{a:'spin'}]:iceTargets(s).map(i=>({a:'break',i})),
    apply(s,m){if(s.win||!m||typeof m!=='object')return s;const n=copy(s);if(s.phase==='spin'){if(m.a!=='spin')return s;const r=rng((s.seed+Math.imul(s.n+1,7919))|0),roll=Math.floor(r()*6);n.spin=['blue','white','blue','white','any','skip'][roll];n.roll=roll;n.n++;n.rollN=n.n;n.rolledBy=s.t;n.last=[];n.phase='break';if(n.spin==='skip'||!iceTargets(n).length){n.phase='spin';n.t=1-s.t;n.msg=n.spin==='skip'?'쉬어 가기! 상대 차례예요.':'해당 색 얼음이 없어 차례를 넘겨요.';}else n.msg=(n.spin==='blue'?'파란 얼음':n.spin==='white'?'하얀 얼음':'원하는 얼음')+' 한 칸을 깨세요.';return n;}
      if(m.a!=='break'||!iceTargets(s).includes(m.i))return s;n.b[m.i]=null;const supported=new Set(),todo=[];hexes.forEach((h,i)=>{if(h.rim&&n.b[i]){supported.add(i);todo.push(i);}});while(todo.length){const i=todo.pop();neighbors[i].forEach(j=>{if(n.b[j]&&!supported.has(j)){supported.add(j);todo.push(j);}});}n.last=[m.i];n.b.forEach((c,i)=>{if(c&&!supported.has(i)){n.b[i]=null;n.last.push(i);}});if(!n.b[center])n.win={w:1-s.t,why:'펭귄이 떨어졌어요!'};n.t=1-s.t;n.phase='spin';n.n++;n.msg=n.last.length+'칸의 얼음이 떨어졌어요. '+(n.win?'펭귄도 풍덩!':'다음 룰렛을 돌려 주세요.');return n;},result:s=>s.win,
    hit(s,X,Y,v){
      const now=Date.now(),spin=icePresentation(s,v.ui,now),id=hit(v.ui,X,Y);
      if(spin){if(now-spin.start>=ROLL_MS&&id==='close-spin'){v.ui.iceAngle=spin.target;v.ui.iceSpin=null;return{ui:true};}return null;}
      if(!v.myTurn||v.ui.icePendingUntil>now)return null;
      if(s.phase==='spin'){if(id!=='spin')return null;v.ui.icePendingUntil=now+2000;v.ui.animUntil=now+2000;return{move:{a:'spin'}};}
      const i=hexes.findIndex((_,i)=>{const[a,b]=hp(i);return Math.hypot(a-X,b-Y)<27;});return iceTargets(s).includes(i)?{move:{a:'break',i}}:null;
    },
    key(s,code,v){
      if(code!=='Space'&&code!=='Enter')return null;
      const now=Date.now(),spin=icePresentation(s,v.ui,now);
      if(spin){if(now-spin.start>=ROLL_MS){v.ui.iceAngle=spin.target;v.ui.iceSpin=null;return{ui:true};}return null;}
      if(!v.myTurn||s.phase!=='spin'||v.ui.icePendingUntil>now)return null;
      v.ui.icePendingUntil=now+2000;v.ui.animUntil=now+2000;return{move:{a:'spin'}};
    },
    hover(s,X,Y){return hexes.findIndex((_,i)=>{const[a,b]=hp(i);return Math.hypot(a-X,b-Y)<27;});},
    draw(x,s,v){const now=Date.now(),spin=icePresentation(s,v.ui,now);v.ui.hits=[];backdrop(x,'#e7f6fc','#a8d0df');text(x,'PENGUIN ON THIN ICE',24,31,12,'#3f6a80',850,'left');text(x,s.b.filter(Boolean).length+' / 37 ICE BLOCKS',24,52,10,'#6c91a1',650,'left');
      x.save();x.fillStyle='#e8f6fb';for(let i=0;i<22;i++){x.beginPath();x.arc((i*137+37)%560,(i*97+90)%560,1.5+i%3,0,Math.PI*2);x.fill();}x.restore();
      shadow(x,()=>{x.fillStyle='#528ba8';x.beginPath();x.ellipse(280,288,221,192,0,0,7);x.fill();},23,13);const rim=x.createLinearGradient(90,100,470,440);rim.addColorStop(0,'#fff');rim.addColorStop(.5,'#c8dfec');rim.addColorStop(1,'#78a7c3');x.fillStyle=rim;x.beginPath();x.ellipse(280,269,220,190,0,0,7);x.fill();x.fillStyle='#2c6e91';x.beginPath();x.ellipse(280,269,188,161,0,0,7);x.fill();x.strokeStyle='#b9d7e6';x.lineWidth=4;x.stroke();
      hexes.forEach((h,i)=>{const[X,Y]=hp(i),c=s.b[i];if(!c){hexPath(x,X,Y+2,27);x.fillStyle='#205b7d';x.fill();return;}hexPath(x,X,Y+6,28);x.fillStyle=c==='blue'?'#388fc1':'#adcbdc';x.fill();hexPath(x,X,Y,27);const g=x.createLinearGradient(X-20,Y-24,X+18,Y+24);g.addColorStop(0,c==='blue'?'#b3efff':'#fff');g.addColorStop(1,c==='blue'?'#53b4df':'#dfedf7');x.fillStyle=g;x.fill();x.strokeStyle='#ffffffb0';x.lineWidth=1.5;x.stroke();x.strokeStyle=c==='blue'?'#e7fbff70':'#b4d3e650';x.beginPath();x.moveTo(X-12,Y-14);x.lineTo(X+4,Y-4);x.lineTo(X,Y+12);x.stroke();if(s.phase==='break'&&v.myTurn&&iceTargets(s).includes(i)){x.fillStyle='#ffffffb0';x.beginPath();x.arc(X,Y,3,0,7);x.fill();if(v.hover===i){hexPath(x,X,Y,27);x.strokeStyle='#f1bb48';x.lineWidth=4;x.stroke();}}});
      if(s.b[center]){x.save();x.shadowColor='#153e6b66';x.shadowBlur=12;x.shadowOffsetY=6;asset(x,'penguin',235,190,90,100);x.restore();}else asset(x,'penguin',252,333,65);
      rect(x,22,438,516,99,16,'#ffffffdc');text(x,s.msg,280,454,11,'#264b63',750);if(s.phase==='spin'){button(x,v.ui,'spin',44,477,341,43,v.ui.icePendingUntil>now?'룰렛 준비 중…':v.myTurn?'룰렛 돌리기':'상대 차례 · 잠시 기다려 주세요','#2f6b91','#fff',v.myTurn);}else{text(x,s.spin==='blue'?'파란 얼음':s.spin==='white'?'하얀 얼음':'아무 얼음',59,486,20,'#2f617e',850,'left');text(x,'한 칸을 눌러 주세요 · 중앙 펭귄은 누를 수 없어요',59,510,10,'#6b8798',600,'left');asset(x,'hammer',351,466,48);}
      rouletteWheel(x,473,493,29,v.ui.iceAngle,1,now,true);
      if(s.phase==='spin'&&v.myTurn&&!(v.ui.icePendingUntil>now))v.ui.hits.push({id:'spin',X:432,Y:447,w:83,h:86});
      if(spin)rouletteStage(x,s,v.ui,spin,now);
    },extra:s=>['남은 얼음 '+s.b.filter(Boolean).length+'칸','남은 얼음 '+s.b.filter(Boolean).length+'칸']};
  B.GAMES.push(ice);

  const words='사과 바다 달 학교 고양이 기차 병원 우주 왕관 연필 빵 사막 시계 눈사람 피아노 산 강아지 소방관 다리 나무 숲 로봇 구름 배 무지개 열쇠 택시 영화 비행기 축구 별 꿀벌 얼음 초콜릿 고래 전화 지도 병 거울 용 눈 꽃 책 성 우산 모래 잠수함 풍선 금 은행 화산 말 기사 카드 망원경 사진 왕자 용암 자석 마법사 도서관 고추 토끼 빛 음악 왕 얼룩말 소금 달걀 공룡 안경 모자 태양 물 연못 경찰관 나비 의자 종이 지구 자동차 오리 지갑 펭귄 섬 바람 야구 밤 호랑이 꿈 진주 칼 마이크 번개 케이크 눈물 거북이 날개 시소 비밀 파도 그림자 정원 노래 항구 비둘기 보석 사자 요리사 커피 시장 왕비 쌀 구두 단추 치즈 하늘 수박 눈꽃 다람쥐 편지 신호등 주사위 약속 감자 왕국 동굴 코끼리 손목 숟가락 축제 거미 석탄 거품 얼음물 운동장 통나무 사슴 해적 달빛 문어 유리 종 기린 포도'.split(' ');
  const remaining=(s,k)=>s.keys[k].filter((c,i)=>c==='g'&&!s.found[i]).length;
  function nextCode(n){n.left--;n.guesses=0;if(n.left<=0){n.sudden=true;n.phase='guess';n.t=remaining(n,1-n.t)>0?n.t:1-n.t;n.msg='마지막 추리! 힌트 없이 남은 요원을 찾아요. 한 번이라도 틀리면 실패.';return;}const next=1-n.giver;n.giver=remaining(n,next)>0?next:n.giver;n.t=n.giver;n.phase='hint';n.msg='역할을 바꿔 새로운 힌트를 주세요.';}
  const codes={id:'codenames',name:'코드네임 듀엣',tag:'추리',color:'#638879',sides:['요원 A','요원 B'],sideColor:['#3C7461','#B78748'],turnSec:180,friendlyOnly:true,coop:true,privateView:true,anyTime:true,
    desc:'공식 2인용 듀엣 방식의 협동 게임. 서로 다른 비밀 정답표를 보고 한 단어+숫자로 힌트를 주세요. 9턴 안에 요원 15명을 찾고, 암살자를 피하세요. 마지막 추리까지 지원해요. 친선 전용.',keys:'힌트 입력 → 상대가 단어 선택 → 추리 끝내기로 역할 교대',
    init(seed){const r=rng(seed),pairs=shuffle([...[['g','g'],['g','g'],['g','g']],['g','a'],...Array.from({length:5},()=>['g','n']),['a','g'],...Array.from({length:5},()=>['n','g']),['a','a'],['a','n'],['n','a'],...Array.from({length:7},()=>['n','n'])],r);return{words:shuffle(words.slice(),r).slice(0,25),keys:[pairs.map(p=>p[0]),pairs.map(p=>p[1])],found:Array(25).fill(false),miss:[Array(25).fill(false),Array(25).fill(false)],t:0,giver:0,phase:'hint',left:9,clue:'',count:0,guesses:0,sudden:false,n:0,win:null,msg:'내 정답표의 초록 단어를 연결하는 힌트를 주세요.'};},turn:s=>s.t,
    legal(s){if(s.win||s.phase==='hint')return[];return s.words.map((_,i)=>!s.found[i]&&!s.miss[s.t][i]?{a:'guess',i,by:s.t}:null).filter(Boolean).concat(s.guesses&&!s.sudden?[{a:'end'}]:[]);},
    free(s,m,me){return s.sudden&&m?.a==='guess'&&m.by===me;},
    apply(s,m){if(s.win||!m||typeof m!=='object')return s;const n=copy(s);if(s.phase==='hint'){const w=typeof m.word==='string'?m.word.trim():'';if(m.a!=='hint'||!/^[\p{L}\p{N}]{1,20}$/u.test(w)||!Number.isInteger(m.count)||m.count<1||m.count>9||s.words.some((word,i)=>!s.found[i]&&(word.includes(w)||w.includes(word))))return s;n.clue=w;n.count=m.count;n.phase='guess';n.t=1-s.giver;n.guesses=0;n.msg='“'+w+' · '+m.count+'” 어떤 단어들을 뜻할까요?';}
      else if(m.a==='end'){if(!s.guesses||s.sudden)return s;nextCode(n);}
      else{if(m.a!=='guess'||!Number.isInteger(m.i)||m.i<0||m.i>=25||!Number.isInteger(m.by)||m.by<0||m.by>1||!s.sudden&&m.by!==s.t||s.found[m.i]||s.miss[m.by][m.i])return s;const key=s.keys[1-m.by][m.i];n.t=m.by;n.guesses++;if(key==='a'){n.win={w:-1,coop:true,success:false,why:'암살자를 만났어요 · '+s.words[m.i]};n.msg=n.win.why;}else if(key==='g'){n.found[m.i]=true;n.msg=s.words[m.i]+' · 요원을 찾았어요! 계속 추리하거나 턴을 끝내세요.';if(n.found.filter(Boolean).length===15)n.win={w:-1,coop:true,success:true,why:'요원 15명 전원 구출!'};}else{n.miss[m.by][m.i]=true;n.msg=s.words[m.i]+' · 일반 시민이었어요.';if(s.sudden)n.win={w:-1,coop:true,success:false,why:'마지막 추리에서 시민을 골랐어요'};else nextCode(n);}}
      n.n++;return n;},result:s=>s.win,
    hit(s,X,Y,v){const h=hit(v.ui,X,Y);if(h==='key'){v.ui.keyOpen=!(v.ui.keyOpen??(s.phase==='hint'&&s.t===v.me));return{ui:true};}if(h==='end')return{move:{a:'end'}};if(h?.startsWith('word:')&&v.me>=0&&(v.myTurn||s.sudden))return{move:{a:'guess',i:+h.split(':')[1],by:v.me}};return null;},
    draw(x,s,v){const ui=v.ui;ui.hits=[];const phase=s.giver+':'+s.phase+':'+s.sudden;if(ui.codePhase!==phase){delete ui.keyOpen;ui.codePhase=phase;}backdrop(x,'#efe9da','#d7d9c4');text(x,'CODENAMES / DUET',24,30,12,'#4e6b5d',850,'left');text(x,'TWO AGENTS. ONE MISSION.',24,51,9,'#8b927f',750,'left');asset(x,'detective',480,61,53);text(x,'구출 '+s.found.filter(Boolean).length+' / 15',28,92,21,'#2d5747',850,'left');text(x,s.sudden?'마지막 추리':s.left+'턴 남음',445,100,14,'#6a7258');
      const reveal=v.me>=0&&(ui.keyOpen??(s.phase==='hint'&&s.t===v.me)),own=v.me>=0?s.keys[v.me]:null;
      s.words.forEach((word,i)=>{const X=23+(i%5)*104,Y=133+Math.floor(i/5)*57,c=s.found[i]?'#477e66':reveal?(own[i]==='g'?'#d0e6c4':own[i]==='a'?'#39473f':'#fcf5df'):'#fcf7e9',fg=s.found[i]||reveal&&own[i]==='a'?'#fff':'#354b40';shadow(x,()=>rect(x,X,Y,98,49,7,c,'#b9baa380'),5,3);text(x,word,X+49,Y+23,word.length>4?12:15,fg,800);if(s.found[i])text(x,'요원 확인',X+49,Y+39,8,'#d6ecd9',600);else if(v.me>=0&&s.miss[v.me][i])text(x,'시민 · 내 추리 제외',X+49,Y+39,7,'#ae8063',650);if(!s.found[i]&&v.me>=0&&!s.miss[v.me][i]&&s.phase==='guess'&&(v.myTurn||s.sudden))ui.hits.push({id:'word:'+i,X,Y,w:98,h:49});});
      rect(x,23,429,514,85,13,'#ffffffa8');if(s.phase==='hint'){text(x,v.myTurn?'내 정답표를 보고 힌트를 보내세요':'상대가 힌트를 생각하고 있어요',39,450,15,'#335d4c',800,'left');text(x,'초록=상대가 찾을 요원 · 검정=암살자 · 상대의 표는 달라요',39,476,10,'#71816d',600,'left');text(x,'힌트 입력란은 대국 정보 아래에 있어요',39,496,10,'#71816d',600,'left');}
      else{text(x,s.sudden?'힌트 없이 마지막으로 추리하세요':'“'+s.clue+'”  '+s.count,39,450,20,'#2c5c48',850,'left');text(x,'추리할 때는 상대 정답표가 기준이에요',39,478,11,'#77816c',600,'left');button(x,ui,'end',354,451,166,43,'추리 끝내기','#3d725d','#fff',v.myTurn&&s.guesses>0&&!s.sudden);}
      text(x,s.sudden?'한 번이라도 틀리면 임무 실패':'두 명이 함께 15명을 찾으면 성공 · 친선 협동',25,535,10,'#6f7e69',650,'left');if(v.me>=0)button(x,ui,'key',403,522,134,25,reveal?'내 정답표 닫기':'내 정답표 보기','#ffffff70','#4c6657',true);
    },extra:s=>[0,1].map(k=>'남은 내 힌트 요원 '+remaining(s,k)+'명')};
  B.GAMES.push(codes);
})();
