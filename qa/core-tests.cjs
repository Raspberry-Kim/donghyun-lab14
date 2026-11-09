// 엔진 핵심 시험: node qa/core-tests.cjs
const E=require('../src/engine.js').Engine; const assert=require('assert'); let n=0; const ok=t=>{ n++; console.log('ok',t); };
const K=(o={})=>({left:false,right:false,up:false,down:false,fast:false,slow:false,...o});
const run=(S,k,f)=>{ for(let i=0;i<f&&S.status==='play';i++) E.step(S,k); };
const noQix=S=>{ for(const q of S.qix){ q.x=2;q.y=2;q.vx=0;q.vy=0;q.len=1;q.dang=0;q.wT=-1e9; } }; /* 큐를 왼쪽 위 구석에 세운다 */
const noSparx=S=>{ S.sparx=[]; S.sparxT=1e9; };

// 1) 새 판
let S=E.newGame({mode:1,seed:5});
assert.strictEqual(S.cells.length,80*56); assert.strictEqual(S.claimed,0); assert.strictEqual(S.lives,3); assert.strictEqual(S.target,75);
assert.deepStrictEqual([S.player.x,S.player.y],[40,56]); assert.strictEqual(S.qix.length,1); assert.strictEqual(S.sparx.length,2);
assert.ok(E.onBorder(S,0,0)&&E.onBorder(S,40,56)&&!E.onBorder(S,40,28)); ok('새 판: 80×56 · 목숨 3 · 목표 75 · 아래 가운데서 시작 · 테두리 판정');
// 2) 테두리 걷기: 2프레임에 한 점, 안쪽으로는 단추 없이 못 들어간다
S=E.newGame({mode:1,seed:5}); noQix(S); noSparx(S);
run(S,K({left:true}),20); assert.strictEqual(S.player.x,30); assert.strictEqual(S.drawing,0);
run(S,K({up:true}),20); assert.deepStrictEqual([S.player.x,S.player.y,S.drawing],[30,56,0]); ok('테두리: 2프레임에 한 점 · 단추 없이는 안쪽으로 못 간다');
// 3) 빠른 선 2프레임 · 느린 선 4프레임 · 시작 때의 단추가 속도를 정한다
S=E.newGame({mode:1,seed:5}); noQix(S); noSparx(S);
run(S,K({up:true,fast:true}),20); assert.strictEqual(S.drawing,2); assert.strictEqual(S.player.y,46); assert.strictEqual(S.trail.length,11);
run(S,K({up:true,slow:true}),20); assert.strictEqual(S.drawing,2); assert.strictEqual(S.player.y,36); /* 도중에 Z로 바꿔도 빠른 선 그대로 */
S=E.newGame({mode:1,seed:5}); noQix(S); noSparx(S);
run(S,K({up:true,slow:true}),40); assert.strictEqual(S.drawing,1); assert.strictEqual(S.player.y,46); ok('선 속도: 빠른 2프레임 · 느린 4프레임 · 시작 단추 고정');
// 4) 단추를 떼면 멈추고, 멈춘 채 두면 도화선이 붙어 맞는다
S=E.newGame({mode:1,seed:5}); noQix(S); noSparx(S);
run(S,K({up:true,fast:true}),20); const y0=S.player.y; run(S,K({up:true}),10); assert.strictEqual(S.player.y,y0,'단추를 떼면 멈춤');
run(S,K({}),E.diff(S).fuseDelay); assert.ok(S.fuse,'도화선 붙음'); S.events.length=0;
run(S,K({}),200); assert.ok(S.events.some(e=>e.t==='hit'&&e.by==='fuse')); assert.strictEqual(S.lives,2); assert.deepStrictEqual([S.player.x,S.player.y,S.drawing],[40,56,0],'선 시작점으로 돌아감'); ok('도화선: 멈추면 붙고 닿으면 목숨 −1 · 시작점으로');
// 5) 닫으면 큐가 없는 쪽이 점령 · 느린 선 2배 점수
S=E.newGame({mode:1,seed:5}); noQix(S); noSparx(S); /* 큐는 왼쪽 위 */
run(S,K({up:true,fast:true}),20); run(S,K({right:true,fast:true}),40); run(S,K({down:true,fast:true}),40);
assert.strictEqual(S.drawing,0); assert.strictEqual(S.claimed,20*10); assert.strictEqual(S.score,200); assert.ok(S.cells[55*80+50]===2&&S.cells[55*80+30]===0); assert.strictEqual(S.pct,4.5);
S=E.newGame({mode:1,seed:5}); noQix(S); noSparx(S);
run(S,K({up:true,slow:true}),40); run(S,K({right:true,slow:true}),80); run(S,K({down:true,slow:true}),80);
assert.strictEqual(S.claimed,200); assert.strictEqual(S.score,400); assert.strictEqual(S.cells[55*80+50],1); ok('점령: 큐 없는 쪽 · 빠른 선 1점/칸 · 느린 선 2점/칸');
// 6) 큐 쪽을 가로지르면 큐가 든 큰 땅은 남는다(작은 쪽만 점령)
S=E.newGame({mode:1,seed:5}); noSparx(S); for(const q of S.qix){ q.x=40;q.y=28;q.vx=0;q.vy=0;q.len=1;q.dang=0; }
run(S,K({up:true,fast:true}),20); run(S,K({left:true,fast:true}),40); run(S,K({down:true,fast:true}),40);
assert.strictEqual(S.claimed,200); assert.strictEqual(S.cells[50*80+40],0,'큐 자리는 비어 있다'); ok('큐가 든 땅은 남는다');
// 7) 제 선은 못 넘는다 · 점령한 땅 쪽으로는 선이 안 그어진다
S=E.newGame({mode:1,seed:5}); noQix(S); noSparx(S);
run(S,K({up:true,fast:true}),20); run(S,K({right:true,fast:true}),10); run(S,K({down:true,fast:true}),4); run(S,K({left:true,fast:true}),10); run(S,K({up:true,fast:true}),10);
assert.strictEqual(S.drawing,2); const tl=S.trail.length; run(S,K({up:true,fast:true}),10); assert.strictEqual(S.trail.length,tl,'제 선 앞에서 멈춤'); ok('선은 제 선을 못 넘는다');
// 8) 슈슈가 플레이어와 만나면 목숨 −1 · 무적 동안은 안 맞음
S=E.newGame({mode:1,seed:5}); noQix(S); S.sparxT=1e9; S.inv=0; S.sparx=[{x:41,y:56,px:42,py:56,t:0,spd:2,born:0}]; S.events.length=0;
run(S,K({}),4); assert.ok(S.events.some(e=>e.t==='hit'&&e.by==='sparx')); assert.strictEqual(S.lives,2); assert.ok(S.inv>0);
S.sparx=[{x:41,y:56,px:42,py:56,t:0,spd:2,born:0}]; S.events.length=0; run(S,K({}),4); assert.ok(!S.events.some(e=>e.t==='hit'),'무적'); ok('슈슈: 만나면 목숨 −1 · 무적 중 안 맞음');
// 9) 큐가 긋는 선에 닿으면 목숨 −1 · 테두리 위 플레이어는 안전
S=E.newGame({mode:1,seed:5}); noSparx(S); S.inv=0; for(const q of S.qix){ q.x=40;q.y=50;q.vx=0;q.vy=0;q.len=1;q.dang=0;q.wT=-1e9; }
S.events.length=0; run(S,K({}),30); assert.ok(!S.events.some(e=>e.t==='hit'),'테두리 위는 안전');
run(S,K({up:true,fast:true}),20); assert.ok(S.events.some(e=>e.t==='hit'&&e.by==='qix')); assert.strictEqual(S.lives,2); ok('큐: 긋는 선에 닿으면 목숨 −1 · 테두리는 안전');
// 10) 목숨 0 → 끝 · 무한 목숨은 안 준다
S=E.newGame({mode:1,seed:5,lives:1}); E.hit(S,'test'); assert.strictEqual(S.status,'over');
S=E.newGame({mode:1,seed:5,lives:Infinity}); E.hit(S,'test'); E.hit(S,'test'); assert.strictEqual(S.lives,Infinity); assert.strictEqual(S.status,'play'); ok('목숨: 0이면 끝 · 무한은 줄지 않음');
// 11) 목표를 채우면 clear · 보너스 (pct−목표)×100 · 다음 단계 · 9단계면 win
S=E.newGame({mode:1,seed:5}); noQix(S); noSparx(S);
run(S,K({up:true,fast:true}),112); run(S,K({right:true,fast:true}),80); /* 세로로 가르고 오른쪽 테두리까지: 큐 왼쪽 → 오른쪽 40×56 절반 점령 */
assert.strictEqual(S.pct,50);
run(S,K({up:true,fast:true}),112); assert.strictEqual(S.player.y,0); run(S,K({left:true,fast:true}),40); /* 빈 땅은 왼쪽 40칸: 위 테두리를 왼쪽으로 걷는다(단추를 눌러도 테두리 걷기) */
assert.deepStrictEqual([S.player.x,S.player.y],[20,0]); run(S,K({down:true,fast:true}),112); assert.strictEqual(S.player.y,56); assert.strictEqual(S.pct,75); assert.strictEqual(S.status,'clear');
const ev=S.events.find(e=>e.t==='clear'); assert.strictEqual(ev.bonus,0); const sc=S.score; E.nextLevel(S); assert.strictEqual(S.level,2); assert.strictEqual(S.claimed,0); assert.strictEqual(S.score,sc);
S=E.newGame({mode:1,seed:5,level:9}); noQix(S); noSparx(S); run(S,K({up:true,fast:true}),112); run(S,K({right:true,fast:true}),80); run(S,K({up:true,fast:true}),112); run(S,K({left:true,fast:true}),60); run(S,K({down:true,fast:true}),112);
assert.strictEqual(S.pct,87.5); assert.strictEqual(S.status,'win'); assert.strictEqual(S.events.find(e=>e.t==='win').bonus,1200); ok('단계: 목표 → clear · 보너스 · 다음 단계 · 9단계면 win');
// 12) 쌍둥이 큐를 갈라놓으면 전부 점령 + 5,000
S=E.newGame({mode:3,seed:5}); noSparx(S); assert.strictEqual(S.qix.length,2);
S.qix[0].x=10;S.qix[0].y=28;S.qix[1].x=70;S.qix[1].y=28; for(const q of S.qix){ q.vx=0;q.vy=0;q.len=1;q.dang=0;q.wT=-1e9; }
run(S,K({up:true,fast:true}),112); assert.strictEqual(S.status,'clear'); assert.strictEqual(S.pct,100); assert.ok(S.events.some(e=>e.t==='split')); assert.ok(S.score>=5000+80*56); ok('쌍둥이 큐: 갈라놓으면 100% · 보너스 5,000');
// 13) 방식·단계 수치
assert.strictEqual(E.newGame({mode:2,seed:1}).sparx.length,4); assert.strictEqual(E.newGame({mode:5,seed:1}).target,90);
const d1=E.diff({modeI:3,level:1}), d9=E.diff({modeI:0,level:9}); assert.ok(Math.abs(d1.qixSpd-1.6)<1e-9); assert.ok(d9.qixSpd>1.7&&d9.sparxN===4&&d9.sparxSpd===2&&d9.fuseDelay===26); ok('방식·단계 수치: 빌런 떼 4 · 욕심쟁이 90 · 빠른 큐 160% · 9단계');
// 14) 슈슈 추가 타이머 · 점령한 땅 안에 슈슈가 남지 않는다
S=E.newGame({mode:2,seed:5}); noQix(S); const n0=S.sparx.length; run(S,K({}),E.diff(S).sparxEvery+1); assert.strictEqual(S.sparx.length,n0+1);
S=E.newGame({mode:1,seed:5}); noQix(S); S.sparx=[{x:60,y:56,px:61,py:56,t:0,spd:1e9,born:0}]; S.sparxT=1e9;
run(S,K({up:true,fast:true}),20); run(S,K({right:true,fast:true}),80); /* 오른쪽 아래 40×10 점령 → 슈슈(60,56)는 땅 속 */
assert.ok(S.claimed>0); assert.ok(E.onBorder(S,S.sparx[0].x,S.sparx[0].y),'슈슈가 테두리로 옮겨짐'); ok('슈슈: 추가 타이머 · 점령되면 테두리로 옮김');
// 15) 큐는 빈 땅 안에만 있다(1000프레임)
S=E.newGame({mode:4,seed:9}); noSparx(S); run(S,K({up:true,fast:true}),20); run(S,K({right:true,fast:true}),80);
for(let i=0;i<1000;i++){ E.step(S,K({})); for(const q of S.qix) assert.ok(!E.filled(S,Math.floor(q.x),Math.floor(q.y)),'큐가 땅 속 '+JSON.stringify(q)); } ok('큐는 빈 땅 안에만 머문다');
// 16) 저장 직렬화: cells를 배열로 바꿔 되살려도 같은 판
S=E.newGame({mode:1,seed:5}); noSparx(S); run(S,K({up:true,fast:true}),20); run(S,K({right:true,fast:true}),80);
const j=JSON.parse(JSON.stringify(S,(k,v)=>k==='cells'?Array.from(v):v)); j.cells=new Uint8Array(j.cells); j.events=[];
const a=JSON.stringify(S,(k,v)=>k==='events'?[]:k==='cells'?Array.from(v):v), b=JSON.stringify(j,(k,v)=>k==='events'?[]:k==='cells'?Array.from(v):v); assert.strictEqual(a,b);
run(S,K({left:true}),30); run(j,K({left:true}),30); assert.strictEqual(S.player.x,j.player.x); assert.strictEqual(S.qix[0].x,j.qix[0].x); ok('저장 직렬화 왕복 후 같은 진행');
console.log(`핵심 시험 ${n}개 통과`);
