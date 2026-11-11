/* 동현큐 화면 그리기: 480×340. 파스텔 색(시리즈 플레이그라운드의 종이색과 어울리게). 원작의 그림은 쓰지 않는다. */
(function(root){
'use strict';
const E=root.Engine, SP=root.Sprites;
const C={paper:'#f0ede3',hud:'#e5e6da',empty:'#e7ece7',emptyDot:'#cdd8d1',slow:'#a9c9b8',fast:'#b4c7d4',ink:'#344f51',line:'#849b96',trailSlow:'#ad596c',trailFast:'#a47322',player:'#d7ad51',playerIn:'#fff2cb',fuse:'#c45f4f',msg:'#526b65',
  qix:['#c26d7f','#c88962','#b59c47','#5e9b7d','#638fae','#9280ae']};
function px(x){ return E.OX+x*E.CELL; } function py(y){ return E.OY+y*E.CELL; }
/* 판 바깥의 얇은 상아색 프레임. 실제 경계(OX·OY)는 옮기지 않는다. */
function boardFrame(g){
  const x=E.OX,y=E.OY,w=E.GW*E.CELL,h=E.GH*E.CELL;
  g.save(); g.lineWidth=1; g.lineJoin='round';
  g.fillStyle='rgba(45,72,69,.14)'; g.fillRect(x-7,y+3,w+14,h+4);
  g.fillStyle='#536e6b'; g.fillRect(x-7,y-5,w+14,h+11);
  g.fillStyle='#7c9790'; g.fillRect(x-6,y-5,w+12,h+9);
  g.fillStyle='#b7c7b8'; g.fillRect(x-6,y-5,w+12,1); g.fillRect(x-6,y-3,1,h+5);
  g.fillStyle='#526e6c'; g.fillRect(x-4,y+h+2,w+10,2); g.fillRect(x+w+4,y-3,2,h+5);
  g.fillStyle='#d9dfcc'; g.fillRect(x-2,y-2,w+4,h+4);
  /* 작은 황동 모서리. 장식은 플레이어가 걷는 경계 바깥에만 둔다. */
  for(const [sx,sy,dx,dy] of [[x-5,y-4,1,1],[x+w+5,y-4,-1,1],[x-5,y+h+3,1,-1],[x+w+5,y+h+3,-1,-1]]){
    g.strokeStyle='#d6bd85'; g.beginPath(); g.moveTo(sx,sy+dy*10); g.lineTo(sx,sy); g.lineTo(sx+dx*10,sy); g.stroke();
  }
  /* 빈 판: 조용한 제도지. 점령 영역은 아래에서 이 위를 덮는다. */
  const bg=g.createLinearGradient(x,y,x+w,y+h);
  bg.addColorStop(0,'#f1f2e8'); bg.addColorStop(1,'#e0e8e2'); g.fillStyle=bg; g.fillRect(x,y,w,h);
  g.strokeStyle='rgba(69,103,97,.045)'; g.lineWidth=1; g.beginPath();
  for(let k=4;k<E.GW;k+=4){g.moveTo(px(k)+.5,y);g.lineTo(px(k)+.5,y+h);}
  for(let k=4;k<E.GH;k+=4){g.moveTo(x,py(k)+.5);g.lineTo(x+w,py(k)+.5);} g.stroke();
  /* 가장자리 1px 음영. 충돌 경계는 기존 진한 선으로 다시 그린다. */
  g.fillStyle='rgba(52,79,81,.09)'; g.fillRect(x,y,w,1); g.fillRect(x,y,1,h);
  g.restore();
}
function render(g,S,T){
  g.save(); g.imageSmoothingEnabled=false;
  g.fillStyle=C.paper; g.fillRect(0,0,E.W,E.H);
  if(S.shake>0){ g.translate((T%2?1:-1)*Math.min(2,S.shake/3),0); }
  /* 판 */
  const GW=E.GW,GH=E.GH,CELL=E.CELL;
  boardFrame(g);
  for(let y=0;y<GH;y++){ let x=0; while(x<GW){ const v=S.cells[y*GW+x]; if(!v){ x++; continue; } let x2=x; while(x2<GW&&S.cells[y*GW+x2]===v) x2++; g.fillStyle=v===1?C.slow:C.fast; g.fillRect(px(x),py(y),(x2-x)*CELL,CELL); x=x2; } }
  /* 점령한 면의 안쪽에만 얇은 밝은 테·아래 음영. 색과 실제 점령 범위는 그대로다. */
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){
    const v=S.cells[y*GW+x]; if(!v) continue;
    if(y===0||S.cells[(y-1)*GW+x]!==v){g.fillStyle='rgba(255,255,255,.55)';g.fillRect(px(x),py(y),CELL,1);}
    if(x===0||S.cells[y*GW+x-1]!==v){g.fillStyle='rgba(255,255,255,.35)';g.fillRect(px(x),py(y),1,CELL);}
    if(y===GH-1||S.cells[(y+1)*GW+x]!==v){g.fillStyle='rgba(59,97,103,.18)';g.fillRect(px(x),py(y+1)-1,CELL,1);}
  }
  /* 빈 땅의 점무늬 */
  g.fillStyle=C.emptyDot; for(let y=2;y<GH;y+=4) for(let x=2;x<GW;x+=4){ if(!S.cells[y*GW+x]) g.fillRect(px(x)+2,py(y)+2,1,1); }
  /* 테두리 */
  g.strokeStyle=C.ink; g.lineWidth=1.5; g.lineCap='square'; g.beginPath();
  for(let y=0;y<=GH;y++) for(let x=0;x<GW;x++){ if(E.filled(S,x,y-1)!==E.filled(S,x,y)){ g.moveTo(px(x),py(y)); g.lineTo(px(x+1),py(y)); } }
  for(let x=0;x<=GW;x++) for(let y=0;y<GH;y++){ if(E.filled(S,x-1,y)!==E.filled(S,x,y)){ g.moveTo(px(x),py(y)); g.lineTo(px(x),py(y+1)); } }
  g.stroke();
  /* 점령 효과 */
  for(const f of S.fx){ if(f.k==='claim'){ g.strokeStyle=f.val===1?C.trailSlow:C.trailFast; g.globalAlpha=1-f.t/40; g.lineWidth=3; poly(g,f.pts); g.globalAlpha=1; }
    else if(f.k==='burn'){ g.strokeStyle=C.fuse; g.globalAlpha=Math.max(0,1-f.t/20); g.lineWidth=2; g.setLineDash([3,3]); poly(g,f.pts); g.setLineDash([]); g.globalAlpha=1; } }
  /* 긋는 선 */
  if(S.drawing){ g.strokeStyle=S.drawing===1?C.trailSlow:C.trailFast; g.lineWidth=2.5; poly(g,S.trail);
    if(S.fuse){ const i=Math.min(S.fuse.i,S.trail.length-1), p=S.trail[i]; g.fillStyle=C.fuse; g.beginPath(); g.arc(px(p.x),py(p.y),3+(T%4<2?1:0),0,Math.PI*2); g.fill();
      g.strokeStyle=C.fuse; g.lineWidth=2.5; poly(g,S.trail.slice(0,i+1)); } }
  /* 큐 */
  for(const q of S.qix){
    for(let h=q.hist.length-1;h>=0;h--){ const o=q.hist[h]; const col=C.qix[(q.hue+h+1)%C.qix.length]; g.strokeStyle=col; g.globalAlpha=0.35+0.5*(1-h/q.hist.length); g.lineWidth=2; seg(g,o.x,o.y,o.ang,q.len); }
    g.globalAlpha=1; g.strokeStyle=C.ink; g.lineWidth=3.5; seg(g,q.x,q.y,q.ang,q.len); g.strokeStyle=C.qix[q.hue%C.qix.length]; g.lineWidth=2; seg(g,q.x,q.y,q.ang,q.len);
  }
  /* 슈슈 */
  const face=SP.face(T%140<6?'blink':'normal',1);
  for(const s of S.sparx){ const fx=px(s.x), fy=py(s.y); if(face) g.drawImage(face,Math.round(fx-8),Math.round(fy-8)); }
  /* 플레이어 */
  if(!(S.inv>0&&(T>>2)%2===0)){ const p=S.player, x=px(p.x), y=py(p.y); g.fillStyle=C.player; g.strokeStyle=C.ink; g.lineWidth=1.5; g.beginPath(); g.moveTo(x,y-5); g.lineTo(x+5,y); g.lineTo(x,y+5); g.lineTo(x-5,y); g.closePath(); g.fill(); g.stroke(); g.fillStyle=C.playerIn; g.fillRect(x-1,y-1,2,2); }
  g.restore();
  /* 머리줄 */
  g.fillStyle=C.hud; g.fillRect(0,0,E.W,28);
  g.fillStyle='#bccabd';g.fillRect(12,27,E.W-24,1);
  g.fillStyle=C.ink; g.font='bold 11px Pretendard, sans-serif'; g.textBaseline='middle'; g.textAlign='left';
  g.fillText(`단계 ${S.level}`,12,14);
  g.fillText(`점령 ${S.pct.toFixed(1)}%`,66,14);
  const bx=148,bw=100; g.fillStyle='#ced9ce'; g.fillRect(bx,9,bw,10); g.fillStyle='#65947f'; g.fillRect(bx,9,bw*Math.min(1,S.pct/100),10); g.strokeStyle=C.ink; g.lineWidth=1; g.strokeRect(bx+.5,9.5,bw-1,9);
  g.fillStyle=C.fuse; g.fillRect(bx+bw*S.target/100-1,6,2,16);
  g.fillStyle=C.ink; g.fillText(`목표 ${S.target}%`,256,14);
  g.textAlign='right'; g.fillText(`${S.score.toLocaleString('ko-KR')}점`,E.W-12,14);
  g.fillText('목숨 '+(S.lives===Infinity?'∞':S.lives<=5?'◆'.repeat(S.lives):'◆×'+S.lives),E.W-100,14);
  /* 아랫줄 안내 */
  g.textAlign='center'; g.font='10px Pretendard, sans-serif'; g.fillStyle=C.msg;
  const foot=S.msgT>0?S.msg:(S.drawing?(S.drawing===1?'느린 선 — Z를 누른 채 끝까지 그으면 점수 2배. 멈추면 도화선이 따라온다':'보통 선 — X를 누르면 빠르게'):'테두리를 걷다가 안쪽으로 들어가면 선이 그어진다. X 빠르게 · Z 느리게');
  g.fillText(foot,E.W/2,E.H-8);
}
function poly(g,pts){ if(!pts||pts.length<2) return; g.beginPath(); g.moveTo(px(pts[0].x),py(pts[0].y)); for(let i=1;i<pts.length;i++) g.lineTo(px(pts[i].x),py(pts[i].y)); g.stroke(); }
function seg(g,x,y,ang,len){ const c=Math.cos(ang)*len/2, s=Math.sin(ang)*len/2; g.beginPath(); g.moveTo(px(x-c),py(y-s)); g.lineTo(px(x+c),py(y+s)); g.stroke(); }
root.Render={render,C};
})(typeof window!=='undefined'?window:(typeof module!=='undefined'?module.exports:this));
