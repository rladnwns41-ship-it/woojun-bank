// 미니골프 v3 — 같은 대국은 같은 시드의 랜덤 가든 코스, 대기 중에도 장애물 애니메이션
// 물리는 결정적(+ − × ÷ √만 사용). 풍차는 64단계 회전을 상수 곱으로 돌려서 모든 기기에서 같은 결과가 나온다.
(function () {
  const BG = window.BG;
  if (!BG || BG.golfLoaded || !BG.art) return;
  const K = BG.art, C = K.C, S = BG.S, G = BG.GAMES;
  const { fill, stroke, dot, ring, txt, tex } = K;
  // Kenney / Tower Defense (Top-Down), Creative Commons Zero (CC0).
  // https://kenney.nl/assets/tower-defense-top-down
  // https://creativecommons.org/publicdomain/zero/1.0/
  // Embedded original PNGs: towerDefense_tile130, 131, 134, 135, 136.
  // 코스 생성·이미지·충돌·잔디 그림은 이 기존 골프 파일 안에서 처리한다.
  const Course = (() => {
    const SPRITES = {"tree": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpERUFENUEzODU1NzYxMUU2QjMzNkQ2MTk5MTAxNjJCRiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpERUFENUEzOTU1NzYxMUU2QjMzNkQ2MTk5MTAxNjJCRiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkRFQUQ1QTM2NTU3NjExRTZCMzM2RDYxOTkxMDE2MkJGIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkRFQUQ1QTM3NTU3NjExRTZCMzM2RDYxOTkxMDE2MkJGIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+X4ZpiwAACzpJREFUeNpiYEADinNC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", "bush": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpERUFENUEzQzU1NzYxMUU2QjMzNkQ2MTk5MTAxNjJCRiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpERUIzRTlGRDU1NzYxMUU2QjMzNkQ2MTk5MTAxNjJCRiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkRFQUQ1QTNBNTU3NjExRTZCMzM2RDYxOTkxMDE2MkJGIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkRFQUQ1QTNCNTU3NjExRTZCMzM2RDYxOTkxMDE2MkJGIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+AXPPWgAABnxJREFUeNpi/P//PwM+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", "grass": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpERUJFQkY4RTU1NzYxMUU2QjMzNkQ2MTk5MTAxNjJCRiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpERUJFQkY4RjU1NzYxMUU2QjMzNkQ2MTk5MTAxNjJCRiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkRFQjNFQTA2NTU3NjExRTZCMzM2RDYxOTkxMDE2MkJGIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkRFQjNFQTA3NTU3NjExRTZCMzM2RDYxOTkxMDE2MkJGIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+2nigwAAAC3dJREFUeNpi/P//PwNe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", "rock": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpERUJFQkY5MjU1NzYxMUU2QjMzNkQ2MTk5MTAxNjJCRiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpERUJFQkY5MzU1NzYxMUU2QjMzNkQ2MTk5MTAxNjJCRiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkRFQkVCRjkwNTU3NjExRTZCMzM2RDYxOTkxMDE2MkJGIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkRFQkVCRjkxNTU3NjExRTZCMzM2RDYxOTkxMDE2MkJGIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+26I3HgAABx1JREFUeNpi/P//PwM+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", "rock2": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpERUJFQkY5NjU1NzYxMUU2QjMzNkQ2MTk5MTAxNjJCRiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpERUJFQkY5NzU1NzYxMUU2QjMzNkQ2MTk5MTAxNjJCRiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkRFQkVCRjk0NTU3NjExRTZCMzM2RDYxOTkxMDE2MkJGIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkRFQkVCRjk1NTU3NjExRTZCMzM2RDYxOTkxMDE2MkJGIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+N15QxgAACkZJREFUeNpi/P//PwNe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"};
    const images = {}; let revision = 0;
    const ready = Promise.all(Object.entries(SPRITES).map(([name,src]) => new Promise(resolve => {
      const im = images[name] = new Image(); im.onload = im.onerror = () => { revision++; resolve(); }; im.src = src;
    })));
    const cache = new Map(), CELL = 108, O = 64;
    // Every route is connected; each cell is 108px wide, with a clear line around hazards.
    const ROUTES = [
      [[0,3],[0,2],[0,1],[1,1],[2,1],[3,1],[3,0]],
      [[0,3],[1,3],[1,2],[1,1],[2,1],[3,1],[3,0]],
      [[0,3],[0,2],[1,2],[2,2],[2,1],[2,0],[3,0]],
      [[0,3],[1,3],[2,3],[2,2],[2,1],[1,1],[0,1],[0,0]],
      [[1,3],[1,2],[0,2],[0,1],[0,0],[1,0],[2,0],[3,0]],
      [[0,3],[0,2],[0,1],[0,0],[1,0],[2,0],[3,0],[3,1]],
      [[0,3],[1,3],[2,3],[3,3],[3,2],[3,1],[2,1],[2,0]],
      [[0,3],[1,3],[1,2],[2,2],[3,2],[3,1],[3,0]],
      [[0,3],[0,2],[1,2],[1,1],[1,0],[2,0],[3,0]],
      [[0,3],[1,3],[2,3],[2,2],[2,1],[2,0],[3,0]],
      [[0,3],[0,2],[0,1],[1,1],[2,1],[2,2],[3,2],[3,3]],
      [[0,3],[0,2],[1,2],[2,2],[3,2],[3,1],[3,0]]
    ];
    const THEMES = [
      {name:"에메랄드 가든",bg:"#275e4c",grass:"#8aca72",stripe:"#92d37b",edge:"#e0dfc4",pond:"#49b9c5"},
      {name:"라군 파크",bg:"#265b55",grass:"#7acb8d",stripe:"#83d296",edge:"#d5e4d4",pond:"#57bfd0"},
      {name:"선샤인 그로브",bg:"#3a6247",grass:"#a2ce72",stripe:"#abd57b",edge:"#e9dfbd",pond:"#5dbbc4"}
    ];
    const center = c => [O+c[0]*CELL+CELL/2,O+c[1]*CELL+CELL/2];
    function round(seed) {
      const id = seed|0; if(cache.has(id))return cache.get(id);
      const r=K.rnd(id), order=ROUTES.map((_,i)=>i);
      for(let i=order.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
      const theme=THEMES[Math.floor(r()*THEMES.length)], out=[];
      for(let h=0;h<6;h++) {
        const rot=Math.floor(r()*4), mirror=r()<.5;
        let cells=ROUTES[order[h]].map(([x,y])=>{if(mirror)x=3-x;for(let k=0;k<rot;k++)[x,y]=[3-y,x];return[x,y];});
        if(r()<.5)cells.reverse();
        const set=new Set(cells.map(c=>c.join(','))), edges=[];
        for(const [cx,cy] of cells){const x=O+cx*CELL,y=O+cy*CELL;
          if(!set.has(cx+','+(cy-1)))edges.push([x,y,x+CELL,y,0,1]);
          if(!set.has((cx+1)+','+cy))edges.push([x+CELL,y,x+CELL,y+CELL,-1,0]);
          if(!set.has(cx+','+(cy+1)))edges.push([x+CELL,y+CELL,x,y+CELL,0,-1]);
          if(!set.has((cx-1)+','+cy))edges.push([x,y+CELL,x,y,1,0]);
        }
        const tee=center(cells[0]), cup=center(cells.at(-1));
        // Tee / cup jitter stays far from walls and every hazard.
        tee[0]+=Math.floor(r()*17)-8;tee[1]+=Math.floor(r()*17)-8;
        cup[0]+=Math.floor(r()*17)-8;cup[1]+=Math.floor(r()*17)-8;
        const H={key:id+":"+h,seed:Math.floor(r()*2e9),theme,cells,edges,tee,cup,walls:[],bump:[],sand:[],water:[],slope:[],par:cells.length>7?4:3};
        const mi=2+Math.floor(r()*(cells.length-4)), mc=center(cells[mi]);
        if(h===0||h===3)H.mill={c:mc,L:36};
        const mids=cells.map((c,i)=>({c,i})).filter(o=>o.i>0&&o.i<cells.length-1&&(!H.mill||Math.abs(o.i-mi)>0));
        const pick=mids[Math.floor(r()*mids.length)], p=center(pick.c), vertical=cells[pick.i-1][0]===cells[pick.i+1][0];
        if(h%3===1)H.sand.push([p[0]-36,p[1]-36,72,72]);
        else if(h%3===2)H.water.push(vertical?[p[0]+6,p[1]-36,34,72]:[p[0]-36,p[1]+6,72,34]);
        else if(!H.mill)H.bump.push([p[0]+18,p[1],15]);
        if(h===4){const q=center(cells[2]);H.slope.push([q[0]-40,q[1]-40,80,80,vertical?.025:0,vertical?0:.025]);}
        const kinds=H.mill?"윈드밀":H.sand.length?"샌드 벤드":H.water.length?"워터 커브":"가든 루프";
        H.name=kinds+" "+(1+Math.floor(r()*90));out.push(H);
      }
      if(cache.size>=8)cache.delete(cache.keys().next().value);cache.set(id,out);return out;
    }
    function contains(H,x,y){return H.cells.some(([cx,cy])=>x>=O+cx*CELL&&x<=O+(cx+1)*CELL&&y>=O+cy*CELL&&y<=O+(cy+1)*CELL);}
    function bounce(H,x,y,vx,vy,R) {
      for(const e of H.edges){const dx=e[2]-e[0],dy=e[3]-e[1],l2=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((x-e[0])*dx+(y-e[1])*dy)/l2));
        const qx=e[0]+dx*t,qy=e[1]+dy*t,ex=x-qx,ey=y-qy,d2=ex*ex+ey*ey;if(d2>=R*R)continue;
        const d=Math.sqrt(d2),inside=contains(H,x,y),nx=d&&inside?ex/d:e[4],ny=d&&inside?ey/d:e[5];
        x=qx+nx*R;y=qy+ny*R;const v=vx*nx+vy*ny;if(v<0){vx-=1.8*v*nx;vy-=1.8*v*ny;}
      }
      return [x,y,vx,vy];
    }
    function path(x,H){x.beginPath();H.cells.forEach(([cx,cy])=>x.rect(O+cx*CELL,O+cy*CELL,CELL,CELL));}
    function sprite(x,name,X,Y,w,rot=0){const im=images[name];if(!im?.complete||!im.naturalWidth)return;
      x.save();x.translate(X,Y);x.rotate(rot);x.shadowColor="#123e4c44";x.shadowBlur=5;x.shadowOffsetY=4;x.drawImage(im,-w/2,-w/2,w,w);x.restore();}
    function paint(x,H){const t=H.theme,r=K.rnd(H.seed);
      fill(x,0,0,560,560,22,t.bg);
      // Soft garden ground, flowers and the occasional pond outside the playable course.
      for(let i=0;i<850;i++){const X=r()*560,Y=44+r()*474;if(contains(H,X,Y))continue;dot(x,X,Y,.5+r()*1.4,r()<.5?"#8ac18622":"#112f2833");}
      for(let cy=0;cy<4;cy++)for(let cx=0;cx<4;cx++)if(!H.cells.some(c=>c[0]===cx&&c[1]===cy)){
        const X=O+cx*CELL+54,Y=O+cy*CELL+54;
        if(r()<.35){fill(x,X-36,Y-31,72,62,22,"#1b4e4c");fill(x,X-31,Y-27,62,52,20,t.pond);stroke(x,X-26,Y-22,52,42,16,"#aff0d777",1);dot(x,X-14,Y+6,7,"#97c76a");}
        else{sprite(x,"tree",X-12,Y-10,60,r()*6);sprite(x,"bush",X+29,Y+26,27,r()*6);}
      }
      // Course curb: its inner edge is exactly the physics boundary.
      x.save();x.lineCap="round";x.lineJoin="round";x.shadowColor="#122d3377";x.shadowBlur=7;x.shadowOffsetY=5;
      for(const e of H.edges){x.strokeStyle="#849c78";x.lineWidth=17;x.beginPath();x.moveTo(e[0]-e[4]*5,e[1]-e[5]*5);x.lineTo(e[2]-e[4]*5,e[3]-e[5]*5);x.stroke();}x.restore();
      x.save();path(x,H);x.clip();x.fillStyle=t.grass;x.fillRect(0,0,560,560);
      for(let i=0;i<16;i++){x.fillStyle=i%2?t.stripe:t.grass;x.fillRect(0,48+i*30,560,30);}
      const g=x.createLinearGradient(0,64,560,496);g.addColorStop(0,"#f8ffdf20");g.addColorStop(1,"#215e3814");x.fillStyle=g;x.fillRect(0,0,560,560);
      for(let i=0;i<1400;i++){x.fillStyle=r()<.5?"#245d3822":"#ffffff22";x.fillRect(r()*560,r()*560,.7,.7);}x.restore();
      for(const e of H.edges){x.strokeStyle=t.edge;x.lineWidth=9;x.lineCap="butt";x.beginPath();x.moveTo(e[0]-e[4]*5,e[1]-e[5]*5);x.lineTo(e[2]-e[4]*5,e[3]-e[5]*5);x.stroke();
        const dx=e[2]-e[0],dy=e[3]-e[1],L=Math.hypot(dx,dy);x.strokeStyle="#64776b44";x.lineWidth=1;
        for(let k=18;k<L;k+=18){const X=e[0]+dx*k/L-e[4]*5,Y=e[1]+dy*k/L-e[5]*5;x.beginPath();x.moveTo(X-e[4]*4,Y-e[5]*4);x.lineTo(X+e[4]*4,Y+e[5]*4);x.stroke();}}
      for(const a of H.sand){fill(x,...a,0,"#c4a86e");fill(x,a[0]+2,a[1]+2,a[2]-4,a[3]-4,0,"#e9d296");x.save();x.beginPath();x.rect(...a);x.clip();for(let k=0;k<7;k++){x.strokeStyle="#b99c5b55";x.lineWidth=1;x.beginPath();x.ellipse(a[0]+a[2]/2,a[1]+a[3]/2,12+k*8,7+k*6,0,0,7);x.stroke();}x.restore();}
      for(const a of H.water){fill(x,a[0]-3,a[1]-3,a[2]+6,a[3]+6,0,"#e0d9b9");const g=x.createLinearGradient(a[0],a[1],a[0],a[1]+a[3]);g.addColorStop(0,"#64ced4");g.addColorStop(1,"#2b9fac");fill(x,...a,0,g);}
      for(const a of H.slope){fill(x,a[0],a[1],a[2],a[3],0,"#d0e8a877");}
      for(const b of H.bump){dot(x,b[0]+2,b[1]+4,b[2]+2,"#396e4a66");dot(x,b[0],b[1],b[2],"#f3b26e");ring(x,b[0],b[1],b[2]-4,"#fff1ce",3);dot(x,b[0]-3,b[1]-4,3,"#fff8e4");}
      // Keep decorative sprites entirely off the playing surface.
      for(let i=0;i<65;i++){const X=18+r()*524,Y=58+r()*450,w=10+r()*18;
        if([[-w,-w],[w,w],[-w,w],[w,-w],[0,0]].some(([a,b])=>contains(H,X+a,Y+b)))continue;
        sprite(x,i%4===0?"rock":i%3===0?"bush":"grass",X,Y,w,r()*6);
        if(i%3===0){dot(x,X+5,Y-5,1.8,"#f6db9a");dot(x,X+8,Y-2,1.8,"#edb6a1");}}
      ring(x,H.tee[0],H.tee[1],26,"#f6ffe277",1.5);txt(x,"TEE",H.tee[0],H.tee[1]+35,8,"#2e6947",900);
      dot(x,H.cup[0],H.cup[1],27,"#b3dd8b");dot(x,H.cup[0],H.cup[1],15,"#dce7c1");dot(x,H.cup[0],H.cup[1],11,"#19392f");
    }
    return {round,contains,bounce,paint,ready,get revision(){return revision;}};
  })();
  const P2 = [C.red, C.blue], PL = ["#FF8A7A", "#7FB2EE"];
  const say = (me, t) => me + "|" + t;
  const GX0 = 40, GY0 = 48, GX1 = 520, GY1 = 516, BR = 8, CUP = 11, MAXS = 6, FW = GX1 - GX0, FH = GY1 - GY0;
  const WTH = 0.02454369260617026, WC = 0.9996988186962042, WS = 0.024541228522912288, ARM = 4, HUB = 15, TICK = 1000 / 60;
  const HOLES = [
    { name: "워밍업", par: 2, tee: [280, 474], cup: [280, 120], walls: [[40, 300, 130, 22], [390, 300, 130, 22]], bump: [[280, 292, 24]] },
    { name: "모래 언덕", par: 3, tee: [110, 474], cup: [452, 116], walls: [[40, 252, 340, 24]], sand: [[380, 160, 140, 74], [190, 360, 150, 70]], bump: [[470, 340, 18]] },
    { name: "풍차", par: 3, tee: [280, 480], cup: [280, 108], walls: [[40, 262, 150, 50], [370, 262, 150, 50]], mill: { c: [280, 287], L: 84 } },
    { name: "호수", par: 3, tee: [280, 484], cup: [280, 108], water: [[130, 190, 300, 150]], bump: [[86, 265, 16], [474, 265, 16]] },
    { name: "경사로", par: 3, tee: [460, 484], cup: [112, 116], walls: [[40, 404, 300, 20]], slope: [[40, 172, 480, 170, 0.07, 0]], bump: [[300, 256, 20]] },
    { name: "지그재그", par: 4, tee: [300, 486], cup: [404, 104], walls: [[40, 362, 330, 22], [190, 210, 330, 22]], sand: [[40, 262, 120, 80]], water: [[432, 262, 88, 78]], bump: [[120, 136, 18]] }
  ];
  const holes = s => s.cv >= 3 && Course ? Course.round(s.seed) : HOLES;
  const hole = (s, i = s.ho) => holes(s)[i];
  const r2 = v => Math.round(v * 100) / 100;
  const inR = (r, x, y) => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3];
  const millAt = w => { let ux = 1, uy = 0; for (let k = 0; k < w % 64; k++) { const nx = ux * WC - uy * WS, ny = ux * WS + uy * WC; ux = nx; uy = ny; } return [ux, uy]; };
  function golfSim(H, x, y, dx, dy, p, w, maxT) {
    const L = Math.sqrt(dx * dx + dy * dy), sp = 1.2 + p * 0.12, SUB = 4, x0 = x, y0 = y; let vx = dx / L * sp, vy = dy / L * sp, end = "", slow = 0;
    let [ax, ay] = H.mill ? millAt(w || 0) : [1, 0]; const frames = [[r2(x), r2(y)]], lim = maxT || 1500;
    for (let tick = 0; tick < lim && !end; tick++) {
      for (let k = 0; k < SUB && !end; k++) {
        x += vx / SUB; y += vy / SUB;
        if (H.cells) [x, y, vx, vy] = Course.bounce(H, x, y, vx, vy, BR);
        else { if (x < GX0 + BR) { x = 2 * (GX0 + BR) - x; vx = -vx * .8; } else if (x > GX1 - BR) { x = 2 * (GX1 - BR) - x; vx = -vx * .8; }
        if (y < GY0 + BR) { y = 2 * (GY0 + BR) - y; vy = -vy * .8; } else if (y > GY1 - BR) { y = 2 * (GY1 - BR) - y; vy = -vy * .8; } }
        for (const wl of H.walls || []) { const cx = Math.max(wl[0], Math.min(x, wl[0] + wl[2])), cy = Math.max(wl[1], Math.min(y, wl[1] + wl[3])), ex = x - cx, ey = y - cy, d2 = ex * ex + ey * ey;
          if (d2 >= BR * BR || d2 === 0) continue; const d = Math.sqrt(d2), nx = ex / d, ny = ey / d; x = cx + nx * BR; y = cy + ny * BR; const vn = vx * nx + vy * ny; if (vn < 0) { vx -= 1.8 * vn * nx; vy -= 1.8 * vn * ny; } }
        for (const b of H.bump || []) { const ex = x - b[0], ey = y - b[1], d2 = ex * ex + ey * ey, R = b[2] + BR; if (d2 >= R * R || d2 === 0) continue;
          const d = Math.sqrt(d2), nx = ex / d, ny = ey / d; x = b[0] + nx * R; y = b[1] + ny * R; const vn = vx * nx + vy * ny; if (vn < 0) { vx -= 2 * vn * nx; vy -= 2 * vn * ny; } }
        if (H.mill) { const c = H.mill.c, px = x - c[0], py = y - c[1];
          const hd2 = px * px + py * py, HR = HUB + BR; if (hd2 < HR * HR && hd2 > 0) { const d = Math.sqrt(hd2), nx = px / d, ny = py / d; x = c[0] + nx * HR; y = c[1] + ny * HR; const vn = vx * nx + vy * ny; if (vn < 0) { vx -= 1.8 * vn * nx; vy -= 1.8 * vn * ny; } }
          const A = [[ax, ay], [-ay, ax], [-ax, -ay], [ay, -ax]];
          for (const [ux, uy] of A) { const qx = x - c[0], qy = y - c[1]; let t = qx * ux + qy * uy; if (t < 0) t = 0; else if (t > H.mill.L) t = H.mill.L;
            const ex = qx - ux * t, ey = qy - uy * t, d2 = ex * ex + ey * ey, R = BR + ARM; if (d2 >= R * R || d2 === 0) continue;
            const d = Math.sqrt(d2), nx = ex / d, ny = ey / d; x = c[0] + ux * t + nx * R; y = c[1] + uy * t + ny * R;
            const avx = -uy * WTH * t, avy = ux * WTH * t, rvx = vx - avx, rvy = vy - avy, vn = rvx * nx + rvy * ny; if (vn < 0) { vx -= 1.8 * vn * nx; vy -= 1.8 * vn * ny; } } }
        for (const r of H.water || []) if (inR(r, x, y)) end = "water";
        const ux = x - H.cup[0], uy = y - H.cup[1], cd2 = ux * ux + uy * uy;
        if (!end && cd2 < CUP * CUP && vx * vx + vy * vy < 25) { end = "cup"; x = H.cup[0]; y = H.cup[1]; }
        else if (!end && cd2 < (CUP + 8) * (CUP + 8) && vx * vx + vy * vy < 9) { vx -= ux * .04; vy -= uy * .04; }
      }
      if (H.mill) { const nx = ax * WC - ay * WS, ny = ax * WS + ay * WC; ax = nx; ay = ny; }
      frames.push([r2(x), r2(y)]); if (end) break;
      let onSlope = false; for (const s of H.slope || []) if (inR(s, x, y)) { vx += s[4]; vy += s[5]; onSlope = true; }
      const sand = (H.sand || []).some(r => inR(r, x, y)), s2 = vx * vx + vy * vy;
      if (s2 === 0) { if (!onSlope) break; continue; }
      const v = Math.sqrt(s2), nv = v * (1 - (sand ? .075 : .016)) - (sand ? .1 : .035);
      if (nv <= .03) { vx = vy = 0; if (!onSlope) break; } else { vx *= nv / v; vy *= nv / v; }
      if (v < .3) { if (++slow > 90) break; } else slow = 0;
    }
    if (end === "water") return { x: x0, y: y0, end, frames, wx: r2(x), wy: r2(y) };
    return { x: r2(x), y: r2(y), end, frames };
  }

  // ---------- 그림 ----------
  const bgCache = {};
  const rrect = (x, X, Y, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); };
  function wall3d(x, X, Y, w, h) {
    x.save(); x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 8; x.shadowOffsetX = 3; x.shadowOffsetY = 6; fill(x, X, Y, w, h, 5, "#5A3A22"); x.restore();
    const g = x.createLinearGradient(0, Y, 0, Y + h); g.addColorStop(0, "#B07B4C"); g.addColorStop(1, "#7E5432"); fill(x, X, Y - 4, w, h, 5, g);
    x.save(); rrect(x, X, Y - 4, w, h, 5); x.clip(); x.strokeStyle = "rgba(60,35,15,.25)"; x.lineWidth = 1; for (let k = X + 14; k < X + w; k += 18) { x.beginPath(); x.moveTo(k, Y - 4); x.lineTo(k - 6, Y + h); x.stroke(); } x.restore();
    fill(x, X + 3, Y - 3, w - 6, 3, 2, "rgba(255,230,190,.45)");
  }
  function paintCourse(x, H) {
    fill(x, 0, 0, S, S, 22, "#203A1C"); tex(x, 0, 0, S, S, 22);
    const R = K.rnd(H.name.length * 97 + H.par); for (let i = 0; i < 260; i++) { x.fillStyle = R() < .5 ? "rgba(0,0,0,.12)" : "rgba(140,190,90,.08)"; x.beginPath(); x.arc(R() * S, R() * S, 1 + R() * 3, 0, Math.PI * 2); x.fill(); }
    x.save(); x.shadowColor = "rgba(0,0,0,.55)"; x.shadowBlur = 22; x.shadowOffsetY = 10; fill(x, GX0 - 14, GY0 - 14, FW + 28, FH + 28, 18, "#3E2816"); x.restore();
    const wg = x.createLinearGradient(GX0 - 14, GY0 - 14, GX1 + 14, GY1 + 14); wg.addColorStop(0, "#A06B3E"); wg.addColorStop(.5, "#7A4E2C"); wg.addColorStop(1, "#5C3A20"); fill(x, GX0 - 13, GY0 - 13, FW + 26, FH + 26, 17, wg);
    stroke(x, GX0 - 12.5, GY0 - 12.5, FW + 25, FH + 25, 17, "rgba(255,225,180,.28)", 1);
    const fg = x.createRadialGradient(S / 2, S / 2 - 40, 40, S / 2, S / 2, 380); fg.addColorStop(0, "#74C26C"); fg.addColorStop(1, "#3F8D44"); fill(x, GX0, GY0, FW, FH, 6, fg);
    x.save(); rrect(x, GX0, GY0, FW, FH, 6); x.clip();
    x.save(); x.translate(S / 2, S / 2); x.rotate(-Math.PI / 4); for (let i = -12; i < 12; i++) if (i % 2) { x.fillStyle = "rgba(255,255,255,.055)"; x.fillRect(i * 34, -420, 34, 840); } x.restore();
    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => { const X = dx > 0 ? GX0 : dx < 0 ? GX1 - 14 : GX0, Y = dy > 0 ? GY0 : dy < 0 ? GY1 - 14 : GY0, w = dx ? 14 : FW, h = dy ? 14 : FH, g = x.createLinearGradient(X + (dx < 0 ? 14 : 0), Y + (dy < 0 ? 14 : 0), X + (dx > 0 ? 14 : 0), Y + (dy > 0 ? 14 : 0)); g.addColorStop(0, "rgba(0,0,0,.22)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(X, Y, w, h); });
    (H.slope || []).forEach(s => { fill(x, s[0], s[1], s[2], s[3], 0, "rgba(255,255,190,.06)"); x.strokeStyle = "rgba(255,255,220,.16)"; x.setLineDash([6, 6]); x.lineWidth = 1.5; x.strokeRect(s[0] + 1, s[1] + 1, s[2] - 2, s[3] - 2); x.setLineDash([]); });
    x.restore(); tex(x, GX0, GY0, FW, FH, 6);
    (H.sand || []).forEach(r => { x.save(); x.shadowColor = "rgba(90,60,20,.35)"; x.shadowBlur = 6; fill(x, r[0], r[1], r[2], r[3], 26, "#E6D29C"); x.restore(); const sg = x.createRadialGradient(r[0] + r[2] / 2, r[1] + r[3] / 2, 4, r[0] + r[2] / 2, r[1] + r[3] / 2, Math.max(r[2], r[3]) * .7); sg.addColorStop(0, "rgba(255,250,225,.5)"); sg.addColorStop(1, "rgba(160,120,60,.25)"); fill(x, r[0], r[1], r[2], r[3], 26, sg);
      x.save(); rrect(x, r[0], r[1], r[2], r[3], 26); x.clip(); const Rs = K.rnd(r[0] + r[1]); for (let i = 0; i < r[2] * r[3] / 60; i++) { x.fillStyle = Rs() < .5 ? "rgba(140,105,50,.28)" : "rgba(255,255,240,.5)"; x.fillRect(r[0] + Rs() * r[2], r[1] + Rs() * r[3], 1.4, 1.4); } x.strokeStyle = "rgba(150,115,60,.25)"; x.lineWidth = 1; for (let k = 0; k < 4; k++) { x.beginPath(); x.ellipse(r[0] + r[2] / 2, r[1] + r[3] / 2, r[2] * (.15 + k * .11), r[3] * (.15 + k * .11), 0, 0, Math.PI * 2); x.stroke(); } x.restore(); });
    (H.water || []).forEach(r => { fill(x, r[0] - 4, r[1] - 4, r[2] + 8, r[3] + 8, 28, "#8A7A5A"); const g = x.createLinearGradient(r[0], r[1], r[0] + r[2], r[1] + r[3]); g.addColorStop(0, "#4FA3DE"); g.addColorStop(1, "#1D5E9C"); fill(x, r[0], r[1], r[2], r[3], 24, g); stroke(x, r[0] + 2, r[1] + 2, r[2] - 4, r[3] - 4, 22, "rgba(255,255,255,.3)", 2); });
    (H.walls || []).forEach(wl => wall3d(x, wl[0], wl[1], wl[2], wl[3]));
    (H.bump || []).forEach(b => { x.save(); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 8; x.shadowOffsetY = 5; dot(x, b[0], b[1], b[2], "#B8322A"); x.restore(); const g = x.createRadialGradient(b[0] - b[2] * .35, b[1] - b[2] * .4, 2, b[0], b[1], b[2]); g.addColorStop(0, "#FF8A78"); g.addColorStop(1, "#C93A2F"); dot(x, b[0], b[1], b[2], g); dot(x, b[0], b[1], b[2] * .55, "#FBF7EF"); ring(x, b[0], b[1], b[2] * .55, "rgba(0,0,0,.12)", 1.5); dot(x, b[0], b[1], b[2] * .2, "#C93A2F"); });
    if (H.mill) { const c = H.mill.c; x.save(); x.globalAlpha = .25; dot(x, c[0] + 4, c[1] + 6, H.mill.L * .45, "#000"); x.restore(); }
    fill(x, H.tee[0] - 18, H.tee[1] - 7, 36, 14, 4, "#2F6F36"); stroke(x, H.tee[0] - 18, H.tee[1] - 7, 36, 14, 4, "rgba(255,255,255,.35)", 1.5);
    dot(x, H.cup[0], H.cup[1], CUP + 5, "rgba(255,255,255,.22)"); const cg = x.createRadialGradient(H.cup[0] - 3, H.cup[1] - 3, 1, H.cup[0], H.cup[1], CUP); cg.addColorStop(0, "#000"); cg.addColorStop(.8, "#141210"); cg.addColorStop(1, "#3A3530"); dot(x, H.cup[0], H.cup[1], CUP, cg);
  }
  const course = H => {
    const key = (H.key || H.name) + ":" + (Course?.revision || 0);
    if (bgCache[key]) return bgCache[key];
    if (Object.keys(bgCache).length >= 8) delete bgCache[Object.keys(bgCache)[0]];
    const c = document.createElement("canvas"); c.width = c.height = 1120;
    const x = c.getContext("2d"); x.setTransform(2, 0, 0, 2, 0, 0);
    if (H.cells) Course.paint(x, H); else paintCourse(x, H);
    return (bgCache[key] = c);
  };
  function liveLayer(x, H, now, ang) {
    (H.water || []).forEach(r => { x.save(); rrect(x, r[0], r[1], r[2], r[3], H.cells ? 0 : 24); x.clip(); x.strokeStyle = "rgba(255,255,255,.22)"; x.lineWidth = 1.5;
      for (let k = 0; k < 5; k++) { const ph = ((now / 2400 + k / 5) % 1), cx = r[0] + r[2] * (.2 + .6 * ((k * 37) % 10) / 10), cy = r[1] + r[3] * (.25 + .5 * ((k * 53) % 10) / 10); x.globalAlpha = 1 - ph; x.beginPath(); x.ellipse(cx, cy, 6 + ph * 34, 3 + ph * 14, 0, 0, Math.PI * 2); x.stroke(); } x.restore(); });
    (H.slope || []).forEach(s => { x.save(); x.beginPath(); x.rect(s[0], s[1], s[2], s[3]); x.clip(); x.strokeStyle = "rgba(255,255,220,.28)"; x.lineWidth = 3; x.lineCap = "round"; const dir = s[4] > 0 ? 1 : -1, off = (now / 30) % 60;
      for (let yy = s[1] + 30; yy < s[1] + s[3]; yy += 56) for (let xx = s[0] - 60 + (dir > 0 ? off : 60 - off); xx < s[0] + s[2] + 60; xx += 60) { x.beginPath(); x.moveTo(xx - 6 * dir, yy - 9); x.lineTo(xx + 4 * dir, yy); x.lineTo(xx - 6 * dir, yy + 9); x.stroke(); } x.restore(); });
    if (H.mill) { const c = H.mill.c, L = H.mill.L; for (let q = 0; q < 4; q++) { const a = ang + q * Math.PI / 2; x.save(); x.translate(c[0], c[1]); x.rotate(a);
        x.save(); x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 6; x.shadowOffsetX = 3; x.shadowOffsetY = 5; fill(x, 0, -ARM, L, ARM * 2, 3, "#6B4428"); x.restore();
        if (H.cells) { fill(x, 8, -ARM, L - 8, ARM * 2, 2, "#fff1cd"); x.strokeStyle="#9b7a5155"; x.lineWidth=1; for(let k=12;k<L;k+=6){x.beginPath();x.moveTo(k,-ARM);x.lineTo(k,ARM);x.stroke();} }
        else { fill(x, 22, ARM, L - 24, 15, 2, "rgba(251,247,239,.92)"); x.strokeStyle = "rgba(120,80,40,.55)"; x.lineWidth = 1; for (let k = 32; k < L; k += 12) { x.beginPath(); x.moveTo(k, ARM); x.lineTo(k, ARM + 15); x.stroke(); } x.strokeRect(22, ARM, L - 24, 15); }
        fill(x, 0, -ARM + 1, L, 2, 1, "rgba(255,225,180,.45)"); x.restore(); }
      dot(x, c[0], c[1], HUB, "#5A3A22"); const hg = x.createRadialGradient(c[0] - 4, c[1] - 4, 1, c[0], c[1], HUB); hg.addColorStop(0, "#C9955E"); hg.addColorStop(1, "#7A4E2C"); dot(x, c[0], c[1], HUB - 2, hg); dot(x, c[0], c[1], 3.5, "#2A1A0E"); }
  }
  const flag = (x, H, now, num) => { const X = H.cup[0], Y = H.cup[1], PH = 58, w = Math.sin(now / 300) * 2.5, w2 = Math.sin(now / 300 + 1.4) * 2.5;
    // 그림자 (해가 왼쪽 위에서 비춘다)
    x.save(); x.globalAlpha = .22; x.fillStyle = "#000"; x.beginPath(); x.moveTo(X + 1, Y + 1); x.lineTo(X + 30, Y - 14); x.lineTo(X + 31, Y - 12); x.lineTo(X + 2, Y + 3); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(X + 30, Y - 14); x.quadraticCurveTo(X + 44, Y - 14 + w * .4, X + 56, Y - 8); x.quadraticCurveTo(X + 44, Y - 4, X + 34, Y - 5); x.closePath(); x.fill(); x.restore();
    // 깃대: 흰색 유리섬유 + 빨간 줄무늬
    const pg = x.createLinearGradient(X - 2, 0, X + 2, 0); pg.addColorStop(0, "#BFC6CE"); pg.addColorStop(.45, "#FFFFFF"); pg.addColorStop(1, "#9AA3AD");
    x.fillStyle = pg; x.fillRect(X - 1.6, Y - PH, 3.2, PH);
    for (let k = 0; k < 4; k++) { x.fillStyle = "#E5483A"; x.fillRect(X - 1.6, Y - PH + 12 + k * 11, 3.2, 4); }
    dot(x, X, Y - PH - 1, 2.8, "#F2C230"); dot(x, X - .8, Y - PH - 1.8, 1, "#FFF3BF");
    // 깃발: 바람에 휘는 천
    const top = Y - PH + 1, bot = Y - PH + 21, tip = X + 30;
    const fg = x.createLinearGradient(X, top, tip, bot); fg.addColorStop(0, "#FF5A47"); fg.addColorStop(.55, "#E5483A"); fg.addColorStop(1, "#B8321F");
    x.fillStyle = fg; x.beginPath(); x.moveTo(X + 1.6, top);
    x.bezierCurveTo(X + 10, top - 2 + w, X + 20, top + 3 - w, tip, top + 9 + w2 * .6);
    x.bezierCurveTo(X + 20, bot - 3 + w, X + 10, bot + 2 - w2, X + 1.6, bot); x.closePath(); x.fill();
    x.save(); x.globalAlpha = .25; x.fillStyle = "#fff"; x.beginPath(); x.moveTo(X + 1.6, top); x.bezierCurveTo(X + 10, top - 2 + w, X + 18, top + 2 - w, X + 24, top + 6); x.lineTo(X + 1.6, top + 6); x.closePath(); x.fill(); x.restore();
    if (num) txt(x, num, X + 12, top + 10 + w * .3, 10, "#FFFFFF", 900); };
  const ball = (x, X, Y, p, a, sc) => { if (a <= 0) return; const r = BR * (sc || 1); x.save(); x.globalAlpha = a; x.beginPath(); x.ellipse(X + 3, Y + 4, r, r * .8, 0, 0, Math.PI * 2); x.fillStyle = "rgba(0,0,0,.32)"; x.fill();
    const g = x.createRadialGradient(X - r * .35, Y - r * .4, r * .1, X, Y, r); g.addColorStop(0, "#FFFFFF"); g.addColorStop(1, "#D9DEE5"); dot(x, X, Y, r, g); ring(x, X, Y, r - 1.2, P2[p], 2.4);
    x.fillStyle = "rgba(0,0,0,.08)"; [[-2.5, 1.5], [2, 2.5], [1, -2.5], [-1, -.2]].forEach(([a2, b2]) => { x.beginPath(); x.arc(X + a2 * (sc || 1), Y + b2 * (sc || 1), 1, 0, Math.PI * 2); x.fill(); }); x.restore(); };
  const tot = (s, p) => s.sc[p].reduce((a, b) => a + b, 0) + (s.done ? 0 : s.st[p]);
  const label = (n, par) => n === 1 ? "HOLE IN ONE!" : n - par <= -2 ? "이글!" : n - par === -1 ? "버디!" : n - par === 0 ? "파" : n - par === 1 ? "보기" : n + "타";
  const HOV = { x: 280, y: 200 };
  const nowW = () => Math.floor(Date.now() / TICK) % 64;

  G.push({ id: "minigolf", name: "미니골프", tag: "물리", color: "#34876A", rulesVersion: 3, continuous: true, assetsReady: Course.ready, course: s => hole(s), sides: ["빨강 공", "파랑 공"], sideColor: [C.red, C.blue], turnSec: 60, aimHover: true,
    desc: "매 대국 새로 구성되는 6홀 가든 미니골프. 두 참가자는 같은 코스로 겨뤄요. 풍차는 조준 전부터 계속 회전해요. 끄는 동안 공이 굴러갈 길이 점으로 끝까지 보여요. 같은 홀을 번갈아 치고 총 타수가 적은 쪽이 승리. 모래는 공이 금방 멈추고, 연못에 빠지면 1벌타 후 친 자리로 돌아와요. 풍차는 날개 틈을 노려 타이밍을 맞추세요. 한 홀 최대 6타.",
    keys: "조준할 곳을 누르고 뒤로 끌어 세기 조절 → 놓으면 샷 · 끄는 동안 예상 경로 표시",
    init(seed, version = 3) { const cv = version >= 3 && Course ? 3 : 1, T = hole({seed:seed || 1, cv}, 0).tee; return { seed: seed || 1, cv, ho: 0, pos: [T.slice(), T.slice()], hd: [0, 0], st: [0, 0], sc: [[], []], t: 0, n: 0, rec: null, rh: 0, rp: -1, ro: null, rw: 0, re: "", rs: 0, wx: 0, wy: 0, msg: "", win: null, done: false }; },
    turn: s => s.t,
    legal(s) { if (s.done) return []; const c = s.pos[s.t], H = hole(s), dx = H.cup[0] - c[0], dy = H.cup[1] - c[1], L = Math.hypot(dx, dy) || 1; return [{ a: "shot", dx: Math.round(dx / L * 1000), dy: Math.round(dy / L * 1000), p: 45, w: 0, cv: s.cv || 1 }, { a: "shot", dx: Math.round(dx / L * 1000) + 300, dy: Math.round(dy / L * 1000), p: 60, w: 16, cv: s.cv || 1 }]; },
    apply(s, m) { if (!m || s.done || m.a !== "shot" || !Number.isInteger(m.dx) || !Number.isInteger(m.dy) || (!m.dx && !m.dy) || !(m.p >= 3 && m.p <= 100)) return s;
      const w = Number.isInteger(m.w) && m.w >= 0 && m.w < 64 ? m.w : 0, me = s.t, op = 1 - me; if (s.hd[me]) return s;
      const H = hole(s), R = golfSim(H, s.pos[me][0], s.pos[me][1], m.dx, m.dy, Math.round(m.p), w);
      const ns = Object.assign({}, s, { pos: [s.pos[0].slice(), s.pos[1].slice()], hd: s.hd.slice(), st: s.st.slice(), sc: [s.sc[0].slice(), s.sc[1].slice()], n: s.n + 1, rec: R.frames, rh: s.ho, rp: me, ro: s.hd[op] ? null : s.pos[op].slice(), rw: w, re: R.end, wx: R.wx || 0, wy: R.wy || 0 });
      ns.st[me] += R.end === "water" ? 2 : 1; ns.pos[me] = [R.x, R.y]; ns.rs = ns.st[me]; let t;
      if (R.end === "cup") { ns.hd[me] = 1; t = label(ns.st[me], H.par) + " · " + ns.st[me] + "타"; }
      else if (ns.st[me] >= MAXS) { ns.hd[me] = 1; ns.st[me] = MAXS; ns.rs = MAXS; t = (R.end === "water" ? "퐁당! · " : "") + "최대 " + MAXS + "타로 마무리"; }
      else if (R.end === "water") t = "퐁당! 1벌타 · 다음이 " + (ns.st[me] + 1) + "타째";
      else t = ns.st[me] + "타 · 컵까지 " + Math.round(Math.hypot(R.x - H.cup[0], R.y - H.cup[1]) / 10) + "m";
      ns.msg = say(me, t); ns.t = !ns.hd[op] ? op : me;
      if (ns.hd[0] && ns.hd[1]) { ns.sc[0].push(ns.st[0]); ns.sc[1].push(ns.st[1]);
        if (s.ho + 1 >= HOLES.length) { const a = ns.sc[0].reduce((q, v) => q + v, 0), b = ns.sc[1].reduce((q, v) => q + v, 0); ns.done = true; ns.win = a === b ? -1 : a < b ? 0 : 1; ns.why = a + "타 : " + b + "타"; }
        else { const hn = s.ho + 1, T = hole(s, hn).tee; ns.t = ns.st[0] < ns.st[1] ? 0 : ns.st[1] < ns.st[0] ? 1 : hn % 2; ns.ho = hn; ns.pos = [T.slice(), T.slice()]; ns.hd = [0, 0]; ns.st = [0, 0]; } }
      return ns; },
    result: s => s.done ? { w: s.win, why: s.why } : s.n >= 300 ? { w: -1, why: "수 제한" } : null,
    dragStart(s, X, Y, v) { if (s.done || s.hd[v.me] || v.ui.mgAnim) return null; const c = s.pos[v.me]; return Math.hypot(X - c[0], Y - c[1]) > 12 ? "shot" : null; },
    dragEnd(s, X, Y, v) { const d = v.ui.drag; if (!d) return null; const c = s.pos[v.me], ax = d.x - c[0], ay = d.y - c[1], L = Math.sqrt(ax * ax + ay * ay), p = Math.min(100, Math.hypot(X - d.x, Y - d.y) / 1.5);
      if (L < 1 || p < 3) return null; return { a: "shot", dx: Math.round(ax / L * 1000), dy: Math.round(ay / L * 1000), p: Math.round(p), w: nowW(), cv: s.cv || 1 }; },
    hover(s, X, Y) { HOV.x = X; HOV.y = Y; return Math.round(X / 2) * 10000 + Math.round(Y / 2); },
    draw(x, s, v) { const u = v.ui || {}, me = v.me, op = 1 - me, now = Date.now(), thumb = v.preview === true;
      if (u.mgN == null) { u.mgN = s.n; u.mgS = 0; } else if (u.mgN !== s.n) { u.mgN = s.n; u.mgS = now; u.mgFx = 0; }
      const F = s.rec, fi = F && u.mgS ? Math.floor((now - u.mgS) / TICK) : 1e9, anim = !!F && fi < F.length - 1; u.mgAnim = anim;
      const hi = anim ? s.rh : s.ho, H = hole(s, hi);
      if (u.mgHo == null) u.mgHo = s.ho; if (!anim && u.mgHo !== s.ho) { u.mgHo = s.ho; u.mgBan = now; }
      const fxEnd = F && u.mgS ? u.mgS + F.length * TICK : 0, fxAge = now - fxEnd;
      x.drawImage(course(H), 0, 0, S, S);
      const phase = anim ? s.rw + fi : (thumb ? 10 : nowW());
      const ang = H.mill ? (phase % 64) * WTH : 0;
      liveLayer(x, H, thumb ? 0 : now, ang);
      if (anim) { if (s.ro) ball(x, s.ro[0], s.ro[1], 1 - s.rp, 1);
        for (let k = Math.max(0, fi - 16); k < fi; k++) { const a = (k - fi + 16) / 16; x.save(); x.globalAlpha = a * .35; dot(x, F[k][0], F[k][1], BR * a * .8, "#FFFFFF"); x.restore(); }
        const f = F[fi], last = F.length - 1, toCup = s.re === "cup" && fi > last - 8, toWater = s.re === "water" && fi > last - 8, k2 = toCup || toWater ? (last - fi) / 8 : 1;
        ball(x, f[0], f[1], s.rp, toWater ? k2 : 1, toCup ? .5 + k2 * .5 : 1); }
      else { [op, me].forEach(p => { if (!s.hd[p]) ball(x, s.pos[p][0], s.pos[p][1], p, 1); });
        if (s.re === "water" && F && fxAge >= 0 && fxAge < 900) { const a = 1 - fxAge / 900; x.save(); x.strokeStyle = "rgba(255,255,255," + a + ")"; x.lineWidth = 2.5; for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse(s.wx, s.wy, 6 + fxAge / 18 + k * 9, 3 + fxAge / 40 + k * 4, 0, 0, Math.PI * 2); x.stroke(); } x.restore(); } }
      flag(x, H, thumb ? 0 : now, (anim ? s.rh : s.ho) + 1);
      const mine = v.myTurn && !anim && !s.done && !s.hd[me], dr = u.drag; let power = 0;
      if (mine) { const c = s.pos[me], tx = dr ? dr.x : HOV.x, ty = dr ? dr.y : HOV.y, ax = tx - c[0], ay = ty - c[1], L = Math.hypot(ax, ay);
        if (dr) power = Math.min(100, Math.hypot(dr.tx - dr.x, dr.ty - dr.y) / 1.5);
        if (L > 12) { const dx = ax / L, dy = ay / L;
          if (dr && power >= 3) { const P = golfSim(H, c[0], c[1], Math.round(dx * 1000), Math.round(dy * 1000), Math.round(power), nowW(), 260).frames;
            for (let k = 4; k < P.length; k += 4) { const a = 1 - k / P.length; x.save(); x.globalAlpha = .25 + a * .6; dot(x, P[k][0], P[k][1], 2.6, "#FFFFFF"); x.restore(); } }
          else { x.save(); x.setLineDash([4, 7]); x.strokeStyle = "rgba(255,255,255,.6)"; x.lineWidth = 2; x.beginPath(); x.moveTo(c[0] + dx * (BR + 4), c[1] + dy * (BR + 4)); x.lineTo(c[0] + dx * 70, c[1] + dy * 70); x.stroke(); x.restore(); }
          if (dr) { const col = power > 75 ? "#FF6B5E" : power > 45 ? "#F2C230" : "#5FD38F"; x.save(); x.lineCap = "round"; x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 5; x.beginPath(); x.arc(c[0], c[1], 22, -Math.PI / 2, Math.PI * 1.5); x.stroke(); x.strokeStyle = col; x.beginPath(); x.arc(c[0], c[1], 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * power / 100); x.stroke(); x.restore(); txt(x, Math.round(power) + "%", c[0], c[1] - 34, 12, "#FFFFFF", 900); } }
        if (!dr) { x.save(); x.globalAlpha = .5 + Math.sin(now / 240) * .3; ring(x, c[0], c[1], BR + 6, "#FFFFFF", 2); x.restore(); } }
      fill(x, 10, 8, 330, 30, 10, "#173e36e8"); txt(x, "HOLE " + (hi + 1) + "/" + HOLES.length, 22, 23, 12, "#F2C230", 900, "left"); txt(x, H.name + " · P" + H.par, 98, 23, 12, C.cream, 800, "left");
      fill(x, S - 190, 522, 180, 28, 10, "#173e36e8"); dot(x, S - 176, 536, 5, P2[me]); txt(x, "나 " + tot(s, me), S - 166, 536, 12, C.cream, 800, "left"); dot(x, S - 96, 536, 5, P2[op]); txt(x, "상대 " + tot(s, op), S - 86, 536, 12, C.cream, 800, "left");
      if (s.msg && !anim) { const [w2, t2] = s.msg.split("|"); txt(x, (+w2 === me ? "나: " : "상대: ") + t2, 180, 537, 11, C.cream, 800); }
      else if (!anim) txt(x, s.done ? "" : mine ? "조준할 곳을 누르고 뒤로 끌었다 놓으세요" : s.hd[me] ? "홀 아웃 · 상대를 기다려요" : "상대 차례", 180, 537, 10, "rgba(251,247,239,.75)", 700);
      if (!anim && F && fxAge >= 0 && fxAge < 1800 && (s.re === "cup" || s.re === "water") && !thumb) { const a = Math.min(1, (1800 - fxAge) / 400), sc = 1 + Math.max(0, 1 - fxAge / 220) * .5, t2 = s.re === "cup" ? label(s.rs, hole(s, s.rh).par) : "퐁당!";
        if (!u.mgFx) { u.mgFx = 1; try { WJ.sfx(s.re === "cup" ? (s.rs <= hole(s, s.rh).par ? "win" : "coin") : "flip"); } catch (e) {} }
        x.save(); x.globalAlpha = a; x.translate(S / 2, 250); x.scale(sc, sc); x.shadowColor = "rgba(0,0,0,.5)"; x.shadowBlur = 16; txt(x, t2, 0, 0, t2.length > 6 ? 46 : 54, s.re === "cup" ? "#FFD25A" : "#8FD0FF", 900); x.restore(); }
      else if (!anim && u.mgBan && now - u.mgBan < 1600 && !s.done) { const a = Math.min(1, (1600 - (now - u.mgBan)) / 300); x.save(); x.globalAlpha = a; fill(x, 120, 220, 320, 80, 20, "rgba(20,30,20,.78)"); txt(x, "HOLE " + (s.ho + 1), S / 2, 248, 14, "#F2C230", 900); txt(x, hole(s).name + " · PAR " + hole(s).par, S / 2, 276, 22, C.cream, 900); x.restore(); }
      if (s.done && !anim) { fill(x, 60, 170, 440, 170, 20, "rgba(20,30,20,.86)"); txt(x, "스코어카드", S / 2, 196, 15, "#F2C230", 900);
        const cx = k => 150 + k * 44; HOLES.forEach((h, k) => { txt(x, k + 1, cx(k), 226, 12, "rgba(251,247,239,.6)", 800); }); txt(x, "합계", 446, 226, 12, "rgba(251,247,239,.6)", 800);
        [[me, "나", 262], [op, "상대", 300]].forEach(([p, nm, yy]) => { dot(x, 86, yy, 5, P2[p]); txt(x, nm, 98, yy, 13, C.cream, 800, "left"); s.sc[p].forEach((n, k) => txt(x, n, cx(k), yy, 15, n < hole(s, k).par ? "#FFD25A" : n > hole(s, k).par ? "#FF9A8A" : C.cream, 900)); txt(x, tot(s, p), 446, yy, 16, C.cream, 900); }); } },
    extra: s => [0, 1].map(p => "총 " + tot(s, p) + "타 · " + (s.done ? "완료" : (s.ho + 1) + "번 홀"))
  });

  BG.golfLoaded = true;
})();
