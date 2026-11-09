/* 동현큐 그림: 테두리를 타고 도는 빌런 '슈슈'는 동현주(동현몬과 같은 글자 팔레트)의 16×16 슈슈 얼굴을 그대로 쓴다. 원작 게임의 그림은 한 점도 쓰지 않는다.
   나머지(큐·선·플레이어)는 render.js가 도형으로 그린다. */
(function(root){
'use strict';
const PAL={'.':null,K:'#2e2a38',h:'#6b4a2e',s:'#efc7a6',p:'#f0a3a3'};
const SHUSHU=`
KhhK........KhhK
hhhhK..KK..Khhhh
KhhKKKKhhKKKKhhK
.KKKhhhhhhhhKKK.
..KhhhhhhhhhhK..
..KhhhhhhhhhhK..
.KssssssssssssK.
.KssssssssssssK.
.KsssKKssKKsssK.
.KsssKKssKKsssK.
.KspsssssssspsK.
.KsssKssssKsssK.
..KsssKKKKsssK..
...KssssssssK...
....KKssssKK....
......KKKK......`;
/* 눈을 감은 얼굴(깜빡임용): 8·9줄의 눈 KK를 한 줄만 남긴다 */
const SHUSHU_BLINK=SHUSHU.replace('.KsssKKssKKsssK.\n.KsssKKssKKsssK.','.KssssssssssssK.\n.KsssKKssKKsssK.');
function rows(t){ return t.trim().split('\n'); }
function paint(g,t,x,y,s){ const r=rows(t); for(let j=0;j<r.length;j++) for(let i=0;i<r[j].length;i++){ const c=PAL[r[j][i]]; if(!c) continue; g.fillStyle=c; g.fillRect(x+i*s,y+j*s,s,s); } }
let cache={};
function face(name,s){ /* 미리 그려 둔 오프스크린 캔버스 */
  const key=name+':'+s; if(cache[key]) return cache[key];
  const t=name==='blink'?SHUSHU_BLINK:SHUSHU; const r=rows(t);
  const c=(typeof document!=='undefined')?document.createElement('canvas'):null; if(!c) return null;
  c.width=r[0].length*s; c.height=r.length*s; paint(c.getContext('2d'),t,0,0,s); cache[key]=c; return c;
}
root.Sprites={PAL,SHUSHU,SHUSHU_BLINK,paint,face,rows};
})(typeof window!=='undefined'?window:(typeof module!=='undefined'?module.exports:this));
