/* 동현큐 화면 그리기: 480×340. 파스텔 색(시리즈 플레이그라운드의 종이색과 어울리게). 원작의 그림은 쓰지 않는다. */
(function(root){
'use strict';
const E=root.Engine, SP=root.Sprites;
const C={paper:'#fbf7ef',hud:'#f3ecdf',empty:'#ebe5f3',emptyDot:'#ddd5ea',slow:'#bfe3d2',fast:'#c3dbf2',ink:'#4a4258',line:'#8b80a0',trailSlow:'#d98da3',trailFast:'#e8ae4a',player:'#f2b705',playerIn:'#fff3c4',fuse:'#ef6b5a',msg:'#6b6280',
  qix:['#f08aa0','#f6ad86','#efd680','#8fd1a6','#86bdeb','#b39ce8']};
function px(x){ return E.OX+x*E.CELL; } function py(y){ return E.OY+y*E.CELL; }
function render(g,S,T){
  g.save(); g.imageSmoothingEnabled=false;
  g.fillStyle=C.paper; g.fillRect(0,0,E.W,E.H);
  if(S.shake>0){ g.translate((T%2?1:-1)*Math.min(2,S.shake/3),0); }
  /* 판 */
  const GW=E.GW,GH=E.GH,CELL=E.CELL;
  g.fillStyle=C.empty; g.fillRect(E.OX,E.OY,GW*CELL,GH*CELL);
  for(let y=0;y<GH;y++){ let x=0; while(x<GW){ const v=S.cells[y*GW+x]; if(!v){ x++; continue; } let x2=x; while(x2<GW&&S.cells[y*GW+x2]===v) x2++; g.fillStyle=v===1?C.slow:C.fast; g.fillRect(px(x),py(y),(x2-x)*CELL,CELL); x=x2; } }
  /* 빈 땅의 점무늬 */
  g.fillStyle=C.emptyDot; for(let y=0;y<GH;y+=2) for(let x=(y/2)%2?1:0;x<GW;x+=2){ if(!S.cells[y*GW+x]) g.fillRect(px(x)+2,py(y)+2,1,1); }
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
  g.fillStyle=C.ink; g.font='bold 11px Pretendard, sans-serif'; g.textBaseline='middle'; g.textAlign='left';
  g.fillText(`단계 ${S.level}`,12,14);
  g.fillText(`점령 ${S.pct.toFixed(1)}%`,66,14);
  const bx=148,bw=100; g.fillStyle='#ddd5ea'; g.fillRect(bx,9,bw,10); g.fillStyle=C.slow; g.fillRect(bx,9,bw*Math.min(1,S.pct/100),10); g.strokeStyle=C.ink; g.lineWidth=1; g.strokeRect(bx+.5,9.5,bw-1,9);
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
