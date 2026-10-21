(function () {
  if (!window.BG || window.BG.arcadeLoaded) return;
  const games = window.BG.GAMES, S = window.BG.S;
  const rect = (c, x, y, w, h, color, radius = 12) => { c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, radius); c.fill(); };
  const circle = (c, x, y, r, color) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  const text = (c, value, x, y, size = 20, color = '#fff') => { c.fillStyle = color; c.font = `800 ${size}px system-ui,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(value), x, y); };
  const random = seed => { let n = (seed | 0) || 1; return () => ((n = (Math.imul(n, 1664525) + 1013904223) | 0) >>> 0) / 4294967296; };
  const shuffle = (values, seed) => { const a = values.slice(), rnd = random(seed); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gridHit = (X, Y, ox, oy, size, count) => { const c = Math.floor((X - ox) / size), r = Math.floor((Y - oy) / size); return c >= 0 && c < count && r >= 0 && r < count ? r * count + c : -1; };

  // Drag a marble and release it. The entire physics result is deterministic,
  // so the Firebase match can reconstruct the same board from its move log.
  const marbleStart = () => {
    const stones = [];
    for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
      stones.push({ x: 110 + col * 72, y: 205 + row * 95, p: 0, alive: true });
      stones.push({ x: 306 + col * 72, y: 205 + row * 95, p: 1, alive: true });
    }
    return { stones, t: 0, n: 0, last: null };
  };
  // 물리 엔진(physics.js)으로 결정적 시뮬레이션. 같은 수면 모든 기기에서 같은 결과.
  const marblePower = mag => Math.min(17, Math.max(3, mag / 8));
  const marbleSim = (stones, move) => {
    const mag = Math.sqrt(move.dx * move.dx + move.dy * move.dy), pw = marblePower(mag);
    return window.Phys.simulate(stones, { i: move.i, vx: move.dx / mag * pw, vy: move.dy / mag * pw }, { r: 19, min: 31, max: 529 });
  };
  const marbleStep = (stones, move) => {
    const active = stones[move.i], mag = Math.sqrt(move.dx * move.dx + move.dy * move.dy);
    if (!active || !active.alive || !mag) return { stones };
    const rec = marbleSim(stones, move);
    return { stones: rec.bodies.map((b, k) => ({ x: b.x, y: b.y, p: stones[k].p, alive: b.alive })), rec };
  };
  games.push({ id:'marbles', name:'알까기', tag:'실시간 액션', color:'#AE7743', sides:['파랑','빨강'], sideColor:['#3182F6','#F04452'], turnSec:45,
    desc:'내 알을 누르고 상대 쪽으로 끌어 놓으세요. 각도와 세기로 상대 알을 판 밖으로 밀어내면 승리!', keys:'알을 드래그해서 발사',
    init:marbleStart, turn:s=>s.t, legal:s=>s.stones.map((o,i)=>o.alive&&o.p===s.t?i:-1).filter(i=>i>=0),
    apply(s,m){ if (!m || !this.legal(s).includes(m.i) || !Number.isFinite(m.dx) || !Number.isFinite(m.dy) || Math.sqrt(m.dx*m.dx+m.dy*m.dy)<10) return s;
      const r=marbleStep(s.stones,m); return { stones:r.stones, rec:r.rec, from:s.stones, t:1-s.t, n:s.n+1, last:m.i }; },
    preview(s,m){ const mag=Math.sqrt(m.dx*m.dx+m.dy*m.dy); if(!mag) return null; return marbleSim(s.stones,m); }, power:marblePower,
    result(s){ const count=[0,0]; s.stones.forEach(o=>{if(o.alive)count[o.p]++;}); if(!count[0]||!count[1]||s.n>=60) return {w:count[0]===count[1]?-1:count[0]>count[1]?0:1,why:`남은 알 ${count[0]} : ${count[1]}`}; return null; },
    dragStart(s,X,Y){ let hit=null,dist=30; s.stones.forEach((o,i)=>{const d=Math.hypot(X-o.x,Y-o.y);if(o.alive&&o.p===s.t&&d<dist){dist=d;hit=i;}});return hit; },
    dragEnd(s,X,Y,v){const d=v.ui.drag;if(!d)return null; const dx=X-d.x,dy=Y-d.y; return Math.hypot(dx,dy)>=10?{i:d.i,dx:Math.round(dx),dy:Math.round(dy)}:null; },
    hover(){return-1;},
    draw(c,s,v){rect(c,0,0,S,S,'#59391E',22);rect(c,21,21,518,518,'#CF9B5F',20);rect(c,31,31,498,498,'#E5B977',10);
      c.strokeStyle='#9C6D3D';c.lineWidth=3;c.setLineDash([10,12]);c.strokeRect(47,47,466,466);c.setLineDash([]);
      circle(c,280,280,84,'#FFFFFF22');text(c,'알까기',280,280,35,'#9B6C3D');
      s.stones.forEach((o,i)=>{if(!o.alive)return;c.save();c.shadowColor='#3A241B88';c.shadowBlur=10;c.shadowOffsetY=5;circle(c,o.x,o.y,19,o.p===0?'#3182F6':'#F04452');c.restore();circle(c,o.x-5,o.y-7,5,'#FFFFFF99');if(s.last===i){c.strokeStyle='#FFE177';c.lineWidth=3;c.beginPath();c.arc(o.x,o.y,23,0,7);c.stroke();}});
      if(v.ui?.drag){const d=v.ui.drag,o=s.stones[d.i];if(o?.alive){c.strokeStyle='#FFF5B6';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(o.x,o.y);c.lineTo(d.tx,d.ty);c.stroke();circle(c,d.tx,d.ty,7,'#FFF5B6');}}
      text(c,'드래그하여 조준 · 놓으면 발사',280,535,15,'#422A18');},
    extra(s){return [0,1].map(p=>s.stones.filter(o=>o.alive&&o.p===p).length+'개 남음');}
  });

  const handValue = hand => { let total=hand.reduce((v,c)=>v+Math.min(10,c%13+1),0), aces=hand.filter(c=>c%13===0).length;while(aces--&&total+10<=21)total+=10;return total; };
  games.push({id:'blackjack',name:'블랙잭 대결',tag:'카드',color:'#13775E',sides:['선공','후공'],sideColor:['#3182F6','#F04452'],
    desc:'카드를 더 받거나 멈추세요. 21에 가깝게 맞히고 상대보다 높은 점수를 만들면 승리합니다.',keys:'카드 받기 · 멈추기',
    init(seed){const deck=shuffle(Array.from({length:52},(_,i)=>i),seed||1);return {deck:deck.slice(4),hands:[deck.slice(0,2),deck.slice(2,4)],stood:[false,false],t:0,n:0,last:''};},
    turn:s=>s.t,legal:s=>s.stood[s.t]?[]:['hit','stand'],
    apply(s,m){if(!this.legal(s).includes(m))return s;const deck=s.deck.slice(),hands=s.hands.map(a=>a.slice()),stood=s.stood.slice(),me=s.t;
      if(m==='hit'&&deck.length){hands[me].push(deck.shift());if(handValue(hands[me])>=21)stood[me]=true;}else stood[me]=true;
      if(!deck.length)stood[0]=stood[1]=true;
      return {deck,hands,stood,t:stood[1-me]?me:1-me,n:s.n+1,last:(me===0?'선공':'후공')+(m==='hit'?' 카드 받기':' 멈추기')};},
    result(s){if(!s.stood.every(Boolean))return null;const value=s.hands.map(handValue),score=value.map(n=>n>21?-1:n);return {w:score[0]===score[1]?-1:score[0]>score[1]?0:1,why:`${value[0]} : ${value[1]}`};},
    hit(s,X,Y){if(Y<430||Y>510)return null;const m=X<280?'hit':'stand';return this.legal(s).includes(m)?{move:m}:null;},hover(s,X,Y){return Y>=430&&Y<=510?(X<280?0:1):-1;},
    draw(c,s,v){rect(c,0,0,S,S,'#0D5647',22);rect(c,16,16,528,528,'#14745B',22);text(c,'BLACKJACK 21',280,35,25,'#FFE8A7');
      s.hands.forEach((hand,p)=>{const y=p===0?90:260;text(c,(p===0?'선공':'후공')+' · '+handValue(hand)+(s.stood[p]?' · 멈춤':''),280,y-19,18,'#D9F8E9');hand.forEach((card,i)=>{const x=46+i*62;rect(c,x,y,54,88,'#FFFFFF',8);const val=card%13+1,suit=['♠','♥','♣','♦'][card/13|0];text(c,(['A','2','3','4','5','6','7','8','9','10','J','Q','K'][val-1])+suit,x+27,y+44,19,card/13===1||card/13===3?'#D74152':'#1B2633');});});
      rect(c,38,430,224,80,v.myTurn?'#FFBD43':'#7CA598',15);rect(c,298,430,224,80,v.myTurn?'#3182F6':'#7CA598',15);text(c,'카드 받기',150,470,22,'#192C2B');text(c,'멈추기',410,470,22);text(c,s.last||'21을 넘기지 마세요',280,535,14,'#D9F8E9');},
    extra:s=>s.hands.map((hand,i)=>handValue(hand)+'점'+(s.stood[i]?' · 멈춤':''))
  });

  games.push({id:'memory',name:'메모리 카드',tag:'기억력',color:'#7855C3',sides:['보라','주황'],sideColor:['#8554D4','#EF8F36'],
    desc:'카드 두 장을 뒤집어 같은 그림을 찾으세요. 맞히면 한 번 더, 틀리면 상대 차례입니다.',keys:'카드 두 장 선택',
    init(seed){return {cards:shuffle(Array.from({length:16},(_,i)=>i%8),seed||1),matched:Array(16).fill(false),score:[0,0],t:0,n:0,last:[]};},
    turn:s=>s.t,legal:s=>{const ids=s.matched.map((v,i)=>v?-1:i).filter(i=>i>=0),pairs=[];for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++)pairs.push([ids[a],ids[b]]);return pairs;},
    apply(s,m){if(!Array.isArray(m)||m.length!==2||m[0]===m[1]||m.some(i=>!Number.isInteger(i)||i<0||i>=16||s.matched[i]))return s;const matched=s.matched.slice(),score=s.score.slice(),same=s.cards[m[0]]===s.cards[m[1]];if(same){matched[m[0]]=matched[m[1]]=true;score[s.t]++;}return {...s,matched,score,t:same?s.t:1-s.t,n:s.n+1,last:m};},
    result(s){if(s.matched.some(v=>!v))return null;return {w:s.score[0]===s.score[1]?-1:s.score[0]>s.score[1]?0:1,why:`짝 ${s.score[0]} : ${s.score[1]}`};},
    hit(s,X,Y,v){const i=gridHit(X,Y,44,72,118,4);if(i<0||s.matched[i])return null;if(v.sel<0)return {sel:i};if(v.sel===i)return {sel:-1};return {move:[v.sel,i]};},
    hover(s,X,Y){return gridHit(X,Y,44,72,118,4);},
    draw(c,s,v){rect(c,0,0,S,S,'#251D45',22);text(c,'MEMORY MATCH',280,35,26,'#E3D7FF');const symbols=['★','◆','●','▲','♥','☀','✿','☁'];
      for(let i=0;i<16;i++){const x=44+(i%4)*118,y=72+(i/4|0)*118,show=s.matched[i]||s.last.includes(i)||v.sel===i;rect(c,x,y,104,104,show?'#F4EFFF':'#6652A4',15);text(c,show?symbols[s.cards[i]]:'?',x+52,y+52,43,show?'#6845A7':'#D8CBFF');if(v.sel===i){c.strokeStyle='#FFC342';c.lineWidth=5;c.strokeRect(x+3,y+3,98,98);}}
      text(c,`보라 ${s.score[0]} : ${s.score[1]} 주황`,280,540,17,'#E3D7FF');},extra:s=>s.score.map(n=>n+'쌍')
  });

  games.push({id:'mines',name:'지뢰찾기 대결',tag:'운과 판단',color:'#386D9B',sides:['파랑','빨강'],sideColor:['#3182F6','#F04452'],
    desc:'36칸 중 지뢰를 피해 보석을 찾으세요. 안전한 칸은 1점, 보석은 3점, 지뢰는 -2점!',keys:'숨은 칸 선택',
    init(seed){const bag=shuffle(Array.from({length:36},(_,i)=>i<7?-2:i<16?3:1),seed||1);return {bag,open:Array(36).fill(false),score:[0,0],t:0,n:0,last:-1};},
    turn:s=>s.t,legal:s=>s.open.map((v,i)=>v?-1:i).filter(i=>i>=0),
    apply(s,m){if(!this.legal(s).includes(m))return s;const open=s.open.slice(),score=s.score.slice();open[m]=true;score[s.t]+=s.bag[m];return {...s,open,score,t:1-s.t,n:s.n+1,last:m};},
    result(s){if(s.open.some((v,i)=>!v&&s.bag[i]>0))return null;return {w:s.score[0]===s.score[1]?-1:s.score[0]>s.score[1]?0:1,why:`탐사 점수 ${s.score[0]} : ${s.score[1]}`};},
    hit(s,X,Y){const i=gridHit(X,Y,42,55,79,6);return this.legal(s).includes(i)?{move:i}:null;},hover(s,X,Y){return gridHit(X,Y,42,55,79,6);},
    draw(c,s,v){rect(c,0,0,S,S,'#173447',22);text(c,'보물 지뢰찾기',280,28,25,'#D8F4FF');for(let i=0;i<36;i++){const x=42+(i%6)*79,y=55+(i/6|0)*79,open=s.open[i];rect(c,x,y,69,69,open?'#E9F5F9':'#347B9B',10);text(c,open?(s.bag[i]<0?'✹':s.bag[i]===3?'◆':'·'):'?',x+34,y+34,29,open?(s.bag[i]<0?'#D64858':s.bag[i]===3?'#E6A31F':'#6E8B9B'):'#D8F4FF');if(v.myTurn&&v.hover===i&&!open){c.strokeStyle='#FFDC82';c.lineWidth=4;c.strokeRect(x+2,y+2,65,65);}}
      text(c,`파랑 ${s.score[0]}점   빨강 ${s.score[1]}점`,280,540,17,'#D8F4FF');},extra:s=>s.score.map(n=>n+'점')
  });

  const bingoLines=[];for(let r=0;r<5;r++)bingoLines.push(Array.from({length:5},(_,c)=>r*5+c));for(let c=0;c<5;c++)bingoLines.push(Array.from({length:5},(_,r)=>r*5+c));bingoLines.push([0,6,12,18,24],[4,8,12,16,20]);
  const lineScores=claimed=>{const score=[0,0],completed=[];bingoLines.forEach((line,i)=>{const p=claimed[line[0]];if(p&&line.every(k=>claimed[k]===p)){score[p-1]+=5;completed.push(i);}});claimed.forEach((p,i)=>{if(p)score[p-1]+=i===12?2:1;});return {score,completed};};
  games.push({id:'bingo',name:'빙고 배틀',tag:'캐주얼',color:'#D1697F',sides:['핑크','파랑'],sideColor:['#EF6B91','#418EEB'],
    desc:'숫자를 번갈아 차지하세요. 한 줄을 내 색으로 채우면 5점! 중앙 칸에는 보너스가 있습니다.',keys:'빈 칸 선택',
    init(seed){return {numbers:shuffle(Array.from({length:25},(_,i)=>i+1),seed||1),claimed:Array(25).fill(0),t:0,n:0,last:-1};},
    turn:s=>s.t,legal:s=>s.claimed.map((p,i)=>p?-1:i).filter(i=>i>=0),
    apply(s,m){if(!this.legal(s).includes(m))return s;const claimed=s.claimed.slice();claimed[m]=s.t+1;return {...s,claimed,t:1-s.t,n:s.n+1,last:m};},
    result(s){if(s.n<25)return null;const a=lineScores(s.claimed).score;return {w:a[0]===a[1]?-1:a[0]>a[1]?0:1,why:`빙고 점수 ${a[0]} : ${a[1]}`};},
    hit(s,X,Y){const i=gridHit(X,Y,50,59,92,5);return this.legal(s).includes(i)?{move:i}:null;},hover(s,X,Y){return gridHit(X,Y,50,59,92,5);},
    draw(c,s,v){rect(c,0,0,S,S,'#543749',22);text(c,'BINGO BATTLE',280,29,25,'#FFEAF2');const tally=lineScores(s.claimed);for(let i=0;i<25;i++){const x=50+(i%5)*92,y=59+(i/5|0)*92,p=s.claimed[i];rect(c,x,y,84,84,p===1?'#EA6995':p===2?'#4A94EF':'#FFF8F1',15);text(c,s.numbers[i],x+42,y+42,27,p?'#fff':'#5B4751');if(v.myTurn&&v.hover===i&&!p){c.strokeStyle='#FFD566';c.lineWidth=4;c.strokeRect(x+3,y+3,78,78);}}
      text(c,`핑크 ${tally.score[0]} : ${tally.score[1]} 파랑`,280,537,17,'#FFEAF2');},extra:s=>lineScores(s.claimed).score.map(n=>n+'점')
  });

  window.BG.arcadeLoaded = true;
})();
