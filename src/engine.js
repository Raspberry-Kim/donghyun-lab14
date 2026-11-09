/* 동현큐 엔진: 1981년 오락실 게임 「큐(Qix)」의 뼈대만 따른 선 긋기 게임.
   판은 80×56칸. 플레이어는 칸의 모서리 점 위를 다닌다. 테두리(점령한 땅의 경계)를 따라 걷다가 X(빠르게)·Z(느리게)를 누른 채 안쪽으로 들어가면 선을 긋고,
   다시 테두리에 닿으면 선 안쪽 가운데 '큐'가 없는 쪽이 점령된다. 큐(떠도는 선 묶음)가 긋는 선에 닿거나, 테두리를 타고 도는 슈슈(스파크)가 플레이어와 만나거나,
   긋다가 멈춰 도화선이 따라붙으면 목숨 하나를 잃는다. 목표(기본 75%)만큼 점령하면 다음 단계.
   난수는 씨앗으로 돌려 같은 입력이면 같은 판이 된다(저장·시험용). 화면 그리기는 render.js. */
(function(root){
'use strict';
const GW=80, GH=56, CELL=5, OX=40, OY=34, W=480, H=340, TARGET=75;
const MODES=[
  {id:1,key:'basic',name:'기본',desc:'큐 하나와 슈슈 둘. 목표 75%. 처음이라면 이것으로.',qix:1,sparx:2,sparxEvery:900,qixSpd:1.0,target:75},
  {id:2,key:'swarm',name:'빌런 떼',desc:'슈슈가 넷에서 시작하고 7.5초마다 하나씩 더 온다. 테두리에 오래 서 있지 말자.',qix:1,sparx:4,sparxEvery:450,qixSpd:1.0,target:75},
  {id:3,key:'twin',name:'쌍둥이 큐',desc:'큐가 둘. 선 하나로 둘을 갈라놓으면 그 판은 바로 끝나고 보너스.',qix:2,sparx:2,sparxEvery:900,qixSpd:1.0,target:75},
  {id:4,key:'fast',name:'빠른 큐',desc:'큐가 1.6배 빠르고 모양을 더 자주 바꾼다. 느린 선은 위험하다.',qix:1,sparx:2,sparxEvery:900,qixSpd:1.6,target:75},
  {id:5,key:'greedy',name:'욕심쟁이',desc:'목표가 90%. 큐를 구석으로 몰아넣어야 끝난다.',qix:1,sparx:2,sparxEvery:900,qixSpd:1.0,target:90}
];
const LEVELS=9;
const SCORE={cell:1,slowMul:2,fastMul:1,bonusPerPct:100,split:5000};
const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};

/* ---------- 난수 ---------- */
function rng(S){ S.rs=(Math.imul(S.rs,1664525)+1013904223)>>>0; return S.rs/4294967296; }
function ri(S,a,b){ return a+Math.floor(rng(S)*(b-a+1)); }

/* ---------- 판 ---------- */
const idx=(x,y)=>y*GW+x;
function inField(x,y){ return x>=0&&y>=0&&x<GW&&y<GH; }
function filled(S,x,y){ return !inField(x,y)||S.cells[idx(x,y)]>0; }
/* 점 (x,y)가 테두리 위인가: 둘레 4칸 가운데 찬 칸과 빈 칸이 둘 다 있다 */
function onBorder(S,x,y){ let f=0,e=0; for(const [cx,cy] of [[x-1,y-1],[x,y-1],[x-1,y],[x,y]]){ if(filled(S,cx,cy)) f++; else e++; } return f>0&&e>0; }
/* 점 p에서 q로 가는 모서리의 양쪽 칸 */
function sideCells(p,q){ if(q.y===p.y){ const x=Math.min(p.x,q.x); return [[x,p.y-1],[x,p.y]]; } const y=Math.min(p.y,q.y); return [[p.x-1,y],[p.x,y]]; }
function edgeKey(p,q){ if(q.y===p.y) return 'h'+Math.min(p.x,q.x)+','+p.y; return 'v'+p.x+','+Math.min(p.y,q.y); }
function isBorderEdge(S,p,q){ const [a,b]=sideCells(p,q); return filled(S,a[0],a[1])!==filled(S,b[0],b[1]); }
function isInnerEdge(S,p,q){ const [a,b]=sideCells(p,q); return !filled(S,a[0],a[1])&&!filled(S,b[0],b[1]); }
function isTrailEdge(S,p,q){ return S.trailEdges.indexOf(edgeKey(p,q))>=0; }
function walkable(S,p,q){ if(q.x<0||q.y<0||q.x>GW||q.y>GH) return false; return isBorderEdge(S,p,q)||isTrailEdge(S,p,q); }
const pk=(x,y)=>x+','+y;

function newGame(cfg){
  cfg=cfg||{};
  const mode=MODES.find(m=>m.id===(cfg.mode||1))||MODES[0];
  const S={modeI:MODES.indexOf(mode),level:cfg.level||1,lives:cfg.lives===undefined?3:cfg.lives,score:0,time:0,status:'play',rs:(cfg.seed||7)>>>0,
    cells:null,claimed:0,player:null,trail:[],trailEdges:[],drawing:0,qix:[],sparx:[],fuse:null,events:[],msg:'',msgT:0,inv:0,sparxT:0,stillT:0,levelsDone:0,shake:0,fx:[],pct:0,target:mode.target,hits:0};
  loadLevel(S); return S;
}
function modeOf(S){ return MODES[S.modeI]; }
function diff(S){ const L=S.level-1, m=modeOf(S); return {qixSpd:m.qixSpd*(1+L*0.09),sparxSpd:Math.max(2,5-Math.floor(L/2)),sparxN:m.sparx+Math.floor(L/3),sparxEvery:Math.max(240,m.sparxEvery-L*50),fuseDelay:Math.max(24,42-L*2)}; }
function loadLevel(S){
  const m=modeOf(S), d=diff(S);
  S.cells=new Uint8Array(GW*GH); S.claimed=0; S.pct=0; S.target=m.target; S.trail=[]; S.trailEdges=[]; S.drawing=0; S.fuse=null; S.fx=[]; S.inv=60; S.sparxT=d.sparxEvery; S.stillT=0; S.shake=0;
  S.player={x:GW/2,y:GH,dir:'left',moveT:0};
  S.qix=[]; for(let i=0;i<m.qix;i++){ const a=rng(S)*Math.PI*2; S.qix.push({x:GW*(0.35+0.3*i)+rng(S)*6,y:GH*0.45+rng(S)*6,vx:Math.cos(a)*0.25*d.qixSpd,vy:Math.sin(a)*0.25*d.qixSpd,ang:rng(S)*Math.PI,dang:(rng(S)-0.5)*0.08,len:11,hist:[],hue:i,wT:0}); }
  S.sparx=[]; for(let i=0;i<d.sparxN;i++) spawnSparx(S,i%2?1:-1);
  S.events.push({t:'level'});
}
function spawnSparx(S,side){ /* 위쪽 테두리 가운데(그 자리가 점령됐으면 가장 가까운 테두리 점)에서 나와 양쪽으로 돈다 */
  const q=nearestBorder(S,GW/2,0); S.sparx.push({x:q.x,y:q.y,px:q.x-side,py:q.y,t:0,spd:diff(S).sparxSpd,born:0}); S.events.push({t:'sparx'}); }

/* ---------- 플레이어 ---------- */
function tryMove(S,k){
  const p=S.player, d=diff(S);
  let dir=null; for(const nm of ['up','down','left','right']) if(k[nm]){ dir=nm; if(nm===p.dir) break; }
  const fast=k.fast, slow=k.slow, hold=fast||slow;
  if(!dir){ if(S.drawing) S.stillT++; return; }
  const [dx,dy]=DIRS[dir]; const q={x:p.x+dx,y:p.y+dy};
  if(q.x<0||q.y<0||q.x>GW||q.y>GH) { if(S.drawing) S.stillT++; return; }
  if(!S.drawing){
    const period=2; if(++p.moveT<period) return; p.moveT=0;
    if(isBorderEdge(S,p,q)){ p.x=q.x; p.y=q.y; p.dir=dir; return; }
    if(hold&&isInnerEdge(S,p,q)){ /* 선 긋기 시작 */
      S.drawing=slow&&!fast?1:2; S.trail=[{x:p.x,y:p.y}]; S.trailEdges=[]; S.stillT=0; S.fuse=null;
      S.trailEdges.push(edgeKey(p,q)); p.x=q.x; p.y=q.y; p.dir=dir; S.trail.push({x:p.x,y:p.y}); S.events.push({t:'draw'}); return; }
    return;
  }
  /* 긋는 중: 단추를 떼면 멈춘다(도화선이 탄다) */
  if(!hold){ S.stillT++; return; }
  const period=S.drawing===1?4:2; if(++p.moveT<period) return; p.moveT=0;
  if(isTrailEdge(S,p,q)||S.trail.some(t=>t.x===q.x&&t.y===q.y)){ S.stillT++; return; } /* 제 선은 못 넘는다 */
  if(!isInnerEdge(S,p,q)){ S.stillT++; return; }
  S.trailEdges.push(edgeKey(p,q)); p.x=q.x; p.y=q.y; p.dir=dir; S.trail.push({x:p.x,y:p.y}); S.stillT=0;
  if(onBorder(S,q.x,q.y)) closeTrail(S);
}

/* ---------- 선 닫기: 큐가 없는 쪽을 점령 ---------- */
function floodFrom(S,cx,cy,mark,val){
  const stack=[[cx,cy]]; let n=0; mark[idx(cx,cy)]=val;
  while(stack.length){ const [x,y]=stack.pop(); n++;
    const nb=[[x+1,y,'v'+(x+1)+','+y],[x-1,y,'v'+x+','+y],[x,y+1,'h'+x+','+(y+1)],[x,y-1,'h'+x+','+y]];
    for(const [nx,ny,ek] of nb){ if(!inField(nx,ny)||S.cells[idx(nx,ny)]>0||mark[idx(nx,ny)]) continue; if(S.trailEdges.indexOf(ek)>=0) continue; mark[idx(nx,ny)]=val; stack.push([nx,ny]); } }
  return n;
}
function closeTrail(S){
  const mark=new Uint8Array(GW*GH); let regions=0; const sizes=[];
  for(const q of S.qix){ const cx=Math.max(0,Math.min(GW-1,Math.floor(q.x))), cy=Math.max(0,Math.min(GH-1,Math.floor(q.y))); if(S.cells[idx(cx,cy)]>0||mark[idx(cx,cy)]){ continue; } regions++; sizes.push(floodFrom(S,cx,cy,mark,regions)); }
  const val=S.drawing===1?1:2, mul=S.drawing===1?SCORE.slowMul:SCORE.fastMul; let got=0;
  if(S.qix.length>1&&regions>1){ /* 쌍둥이 큐를 갈라놓았다: 판 끝 + 보너스 */
    for(let i=0;i<GW*GH;i++) if(S.cells[i]===0){ S.cells[i]=val; got++; }
    S.score+=SCORE.split; S.events.push({t:'split'});
  } else {
    for(let i=0;i<GW*GH;i++) if(S.cells[i]===0&&!mark[i]){ S.cells[i]=val; got++; }
  }
  S.claimed+=got; S.score+=got*SCORE.cell*mul; S.pct=Math.round(S.claimed/(GW*GH)*1000)/10;
  addFx(S,'claim',S.trail.slice(),val);
  S.trail=[]; S.trailEdges=[]; S.drawing=0; S.fuse=null; S.stillT=0;
  fixSparx(S);
  S.events.push({t:'claim',cells:got,slow:val===1,pct:S.pct});
  if(S.pct>=S.target||regions>1&&S.qix.length>1) levelClear(S);
}
function levelClear(S){
  const bonus=Math.max(0,Math.floor(S.pct-S.target))*SCORE.bonusPerPct; S.score+=bonus; S.levelsDone++;
  S.status=S.level>=LEVELS?'win':'clear'; S.events.push({t:S.status==='win'?'win':'clear',bonus,pct:S.pct});
}
function nextLevel(S){ if(S.status!=='clear') return; S.level++; S.status='play'; loadLevel(S); }

/* ---------- 큐 ---------- */
function qixPoints(q,n){ const out=[]; const c=Math.cos(q.ang), s=Math.sin(q.ang); for(let i=0;i<n;i++){ const t=-0.5+i/(n-1); out.push([q.x+c*q.len*t,q.y+s*q.len*t]); } return out; }
function qixFree(S,q){ for(const [x,y] of qixPoints(q,5)){ if(filled(S,Math.floor(x),Math.floor(y))) return false; } return true; }
function stepQix(S){
  const d=diff(S), m=modeOf(S);
  for(const q of S.qix){
    q.wT++; if(q.wT>(m.key==='fast'?18:30)){ q.wT=0; const a=rng(S)*Math.PI*2, sp=(0.18+rng(S)*0.16)*d.qixSpd; q.vx=Math.cos(a)*sp; q.vy=Math.sin(a)*sp; q.dang=(rng(S)-0.5)*0.1; }
    q.hist.unshift({x:q.x,y:q.y,ang:q.ang}); if(q.hist.length>7) q.hist.pop();
    const tryQ={...q,x:q.x+q.vx,y:q.y+q.vy,ang:q.ang+q.dang};
    if(qixFree(S,tryQ)){ q.x=tryQ.x; q.y=tryQ.y; q.ang=tryQ.ang; }
    else { let ok=false; for(const [fx,fy] of [[-1,1],[1,-1],[-1,-1]]){ const t2={...q,x:q.x+q.vx*fx,y:q.y+q.vy*fy,ang:q.ang+q.dang}; if(qixFree(S,t2)){ q.vx*=fx; q.vy*=fy; q.x=t2.x; q.y=t2.y; q.ang=t2.ang; ok=true; break; } }
      if(!ok){ /* 끼었다: 각도만 바꾸거나 제자리 */ const t3={...q,ang:q.ang+0.3}; if(qixFree(S,t3)) q.ang=t3.ang; else if(q.len>4){ q.len-=1; } } }
    if(q.len<11&&qixFree(S,{...q,len:q.len+1})) q.len+=1;
    /* 긋는 선·플레이어에 닿았나 */
    if(S.drawing&&S.inv<=0){ for(const [x,y] of qixPoints(q,9)){ const gx=Math.round(x), gy=Math.round(y); if(Math.abs(x-gx)<0.45&&Math.abs(y-gy)<0.45&&S.trail.some(t=>t.x===gx&&t.y===gy)){ hit(S,'qix'); return; } } }
  }
}

/* ---------- 슈슈(스파크): 테두리와 긋는 선을 타고 돈다 ---------- */
function stepSparx(S){
  const p=S.player;
  for(const s of S.sparx){
    s.born++; if(++s.t<s.spd) continue; s.t=0;
    const cur={x:s.x,y:s.y}; const cands=[];
    for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]){ const q={x:s.x+dx,y:s.y+dy}; if(q.x===s.px&&q.y===s.py) continue; if(walkable(S,cur,q)) cands.push(q); }
    let q=null;
    if(cands.length){ const sdx=s.x-s.px, sdy=s.y-s.py; q=cands.find(c=>c.x-s.x===sdx&&c.y-s.y===sdy)||cands[ri(S,0,cands.length-1)]; }
    else if(walkable(S,cur,{x:s.px,y:s.py})) q={x:s.px,y:s.py};
    else { /* 점령으로 길이 사라졌다: 가장 가까운 테두리 점으로 */ q=nearestBorder(S,s.x,s.y); s.px=q.x; s.py=q.y; }
    if(q){ s.px=s.x; s.py=s.y; s.x=q.x; s.y=q.y; }
  }
  if(S.inv<=0){ for(const s of S.sparx){ if((s.x===p.x&&s.y===p.y)||(s.px===p.x&&s.py===p.y&&p.px===s.x&&p.py===s.y)){ hit(S,'sparx'); return; } } }
}
/* 점령이나 선 소멸로 길을 잃은 슈슈는 가장 가까운 테두리 점으로 옮긴다 */
function fixSparx(S){ for(const s of S.sparx){ if(onBorder(S,s.x,s.y)||S.trail.some(t=>t.x===s.x&&t.y===s.y)) continue; const q=nearestBorder(S,s.x,s.y); s.px=s.x; s.py=s.y; s.x=q.x; s.y=q.y; } }
function nearestBorder(S,x,y){ let best=null,bd=1e9; for(let yy=0;yy<=GH;yy++) for(let xx=0;xx<=GW;xx++){ if(!onBorder(S,xx,yy)) continue; const d=(xx-x)*(xx-x)+(yy-y)*(yy-y); if(d<bd){ bd=d; best={x:xx,y:yy}; } } return best||{x:GW/2,y:0}; }

/* ---------- 도화선 ---------- */
function stepFuse(S){
  if(!S.drawing){ S.fuse=null; return; }
  const d=diff(S);
  if(S.stillT>=d.fuseDelay){ if(!S.fuse){ S.fuse={i:0,t:0}; S.events.push({t:'fuse'}); } S.fuse.t++; if(S.fuse.t>=3){ S.fuse.t=0; S.fuse.i++; } if(S.fuse.i>=S.trail.length-1&&S.inv<=0){ hit(S,'fuse'); } }
  else if(S.fuse){ /* 다시 움직이면 도화선은 그 자리에서 멎는다 */ }
}

/* ---------- 맞음 ---------- */
function hit(S,by){
  S.hits++; S.events.push({t:'hit',by}); S.shake=8;
  if(S.drawing){ const start=S.trail[0]; addFx(S,'burn',S.trail.slice(),0); S.player.x=start.x; S.player.y=start.y; }
  S.trail=[]; S.trailEdges=[]; S.drawing=0; S.fuse=null; S.stillT=0; S.inv=120; fixSparx(S);
  if(S.lives!==Infinity){ S.lives--; if(S.lives<=0){ S.lives=0; S.status='over'; S.events.push({t:'over'}); return; } }
  S.events.push({t:'respawn'});
}

/* ---------- 효과 ---------- */
function addFx(S,k,pts,val){ S.fx.push({k,pts,val,t:0}); }

/* ---------- 한 프레임 ---------- */
function step(S,k){
  if(S.status!=='play') return;
  S.time++; if(S.inv>0) S.inv--; if(S.msgT>0) S.msgT--; if(S.shake>0) S.shake--;
  const p=S.player; p.px=p.x; p.py=p.y;
  tryMove(S,k);
  if(S.status!=='play') return;
  stepFuse(S); if(S.status!=='play') return;
  stepQix(S); if(S.status!=='play') return;
  stepSparx(S); if(S.status!=='play') return;
  const d=diff(S); if(--S.sparxT<=0){ S.sparxT=d.sparxEvery; spawnSparx(S,S.sparx.length%2?1:-1); }
  for(const f of S.fx) f.t++; S.fx=S.fx.filter(f=>f.t<40);
}

root.Engine={GW,GH,CELL,OX,OY,W,H,TARGET,MODES,LEVELS,SCORE,newGame,step,nextLevel,modeOf,diff,onBorder,isBorderEdge,isInnerEdge,isTrailEdge,walkable,filled,closeTrail,qixPoints,spawnSparx,hit,pk};
})(typeof window!=='undefined'?window:(typeof module!=='undefined'?module.exports:this));
