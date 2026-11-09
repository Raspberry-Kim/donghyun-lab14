// 규칙 봇: 테두리에서 안쪽으로 작은 직사각형을 반복해 그어 땅을 떼어 낸다. 멈춤·값 깨짐이 없는지, 끝까지 가는지 본다.
const E=require('../src/engine.js').Engine; const assert=require('assert');
const OPP={up:'down',down:'up',left:'right',right:'left'}, PERP={up:['left','right'],down:['left','right'],left:['up','down'],right:['up','down']};
function play(modeId,seed,maxFrames,opt={}){
  const S=E.newGame({mode:modeId,seed,lives:opt.lives===undefined?Infinity:opt.lives,level:opt.level||1});
  const k={left:false,right:false,up:false,down:false,fast:false,slow:false};
  let frames=0, plan=null, walk={dir:'left',n:0}, claims=0, hits=0, slowUse=0, maxTrail=0;
  const rng=()=>{ seed=(Math.imul(seed,1103515245)+12345)>>>0; return seed/4294967296; };
  const clr=()=>{ k.left=k.right=k.up=k.down=k.fast=k.slow=false; };
  while((S.status==='play'||S.status==='clear')&&frames<maxFrames){
    if(S.status==='clear'){ E.nextLevel(S); plan=null; continue; }
    clr(); const p=S.player, pt={x:p.x,y:p.y};
    if(!S.drawing){
      plan=null;
      /* 안쪽으로 들어갈 수 있는 방향이 있나 */
      const dirs=['up','down','left','right'].filter(d=>{ const q={x:p.x+(d==='right')-(d==='left'),y:p.y+(d==='down')-(d==='up')}; return q.x>=0&&q.y>=0&&q.x<=E.GW&&q.y<=E.GH&&E.isInnerEdge(S,pt,q); });
      if(dirs.length&&walk.n<=0){ const d=dirs[Math.floor(rng()*dirs.length)]; const n=4+Math.floor(rng()*10); const slow=rng()<0.3; plan={d,n,perp:PERP[d][Math.floor(rng()*2)],m:4+Math.floor(rng()*12),phase:0,stuck:0}; k[d]=true; if(slow){ k.slow=true; slowUse++; } else k.fast=true; walk.n=10+Math.floor(rng()*30); }
      else { /* 테두리 걷기 */ walk.n--; const q={x:p.x+(walk.dir==='right')-(walk.dir==='left'),y:p.y+(walk.dir==='down')-(walk.dir==='up')}; if(!(q.x>=0&&q.y>=0&&q.x<=E.GW&&q.y<=E.GH&&E.isBorderEdge(S,pt,q))){ const c=['up','down','left','right'].filter(d=>{ const q2={x:p.x+(d==='right')-(d==='left'),y:p.y+(d==='down')-(d==='up')}; return d!==OPP[walk.dir]&&q2.x>=0&&q2.y>=0&&q2.x<=E.GW&&q2.y<=E.GH&&E.isBorderEdge(S,pt,q2); }); walk.dir=c.length?c[Math.floor(rng()*c.length)]:OPP[walk.dir]; } k[walk.dir]=true; }
    } else {
      if(!plan){ plan={d:p.dir,n:6,perp:PERP[p.dir][0],m:6,phase:0,stuck:0}; }
      const hold=S.drawing===1?'slow':'fast'; k[hold]=true;
      const len=S.trail.length; maxTrail=Math.max(maxTrail,len);
      let d;
      if(plan.phase===0){ d=plan.d; if(len>plan.n) plan.phase=1; }
      if(plan.phase===1){ d=plan.perp; if(len>plan.n+plan.m) plan.phase=2; }
      if(plan.phase===2){ d=OPP[plan.d]; }
      /* 막히면 다른 방향 */
      const q={x:p.x+(d==='right')-(d==='left'),y:p.y+(d==='down')-(d==='up')};
      const ok=q.x>=0&&q.y>=0&&q.x<=E.GW&&q.y<=E.GH&&(E.isInnerEdge(S,pt,q)||E.isBorderEdge(S,pt,q))&&!S.trail.some(t=>t.x===q.x&&t.y===q.y);
      if(!ok){ plan.stuck++; const alts=['up','down','left','right'].filter(a=>{ const q2={x:p.x+(a==='right')-(a==='left'),y:p.y+(a==='down')-(a==='up')}; return q2.x>=0&&q2.y>=0&&q2.x<=E.GW&&q2.y<=E.GH&&E.isInnerEdge(S,pt,q2)&&!S.trail.some(t=>t.x===q2.x&&t.y===q2.y); }); d=alts.length?alts[Math.floor(rng()*alts.length)]:d; if(plan.phase<2) plan.phase++; }
      k[d]=true;
    }
    const c0=S.claimed, h0=S.hits; E.step(S,k); if(S.claimed>c0) claims++; if(S.hits>h0) hits++;
    frames++;
    // 불변식
    assert.ok(Number.isInteger(S.player.x)&&S.player.x>=0&&S.player.x<=E.GW&&Number.isInteger(S.player.y)&&S.player.y>=0&&S.player.y<=E.GH,'플레이어 위치 '+JSON.stringify(S.player));
    assert.ok(S.pct>=0&&S.pct<=100&&Number.isFinite(S.score),'점령·점수');
    if(!S.drawing&&S.status==='play') assert.ok(E.onBorder(S,S.player.x,S.player.y),'안 긋는 동안 플레이어는 테두리 위 '+JSON.stringify(S.player)+' f'+frames);
    for(const q of S.qix) assert.ok(Number.isFinite(q.x)&&Number.isFinite(q.y),'큐 좌표');
    if(S.status==='play') for(const s of S.sparx) assert.ok(E.onBorder(S,s.x,s.y)||S.trail.some(t=>t.x===s.x&&t.y===s.y),'슈슈는 테두리나 선 위 '+JSON.stringify(s)+' f'+frames);
  }
  return {status:S.status,frames,level:S.level,levelsDone:S.levelsDone,score:S.score,claims,hits,slowUse,maxTrail,pct:S.pct};
}
if(require.main===module){
  const results=[]; let okAll=true;
  for(const m of [1,2,3,4,5]){ const r=play(m,11+m,60*60*40); results.push({mode:m,...r}); console.log(JSON.stringify({mode:m,...r})); if(r.status!=='win'){ okAll=false; } }
  const r6=play(1,99,60*60*10,{lives:3}); console.log(JSON.stringify({mode:'1 목숨3',...r6}));
  assert.ok(r6.status==='over'||r6.status==='win'||r6.status==='play');
  console.log(okAll?'봇 완주: 다섯 방식 모두 9단계 끝까지':'봇: 완주하지 못한 방식이 있다'); if(!okAll) process.exit(1);
}
module.exports={play};
