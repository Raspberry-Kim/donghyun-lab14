// 화면 시험: node qa/ui.cjs (build 뒤 index.html을 파일로 연다)
// 첫 화면·규약 오류·예제 여섯·키보드(테두리 걷기·십자키 보통 선·X 빠르게·Z 느린 선·A·Enter)·마우스로는 안 움직임·메뉴 저장 칸 3개·.dhsave·첫 화면 칸 목록·클리어 카드→다음 단계·결과 카드·전체 화면·휴대폰 띠·콘솔 오류
const {chromium}=require('/home/user/node_modules/playwright'); const path=require('path'); const assert=require('assert'); const fs=require('fs');
const url='file://'+path.join(__dirname,'..','index.html');
const H='window.__donghyunq';
(async()=>{
  const b=await chromium.launch(); const errs=[]; let n=0; const ok=(name)=>{ n++; console.log('ok',name); };
  const p=await b.newPage({viewport:{width:1280,height:900}});
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto(url); await p.waitForTimeout(400);
  const G=(js)=>p.evaluate(`(()=>{const D=${H};const S=D.state;return (${js});})()`);
  const txt=async()=>JSON.parse(await p.evaluate('render_game_to_text()'));
  const bb=async()=>p.$eval('#board',e=>{const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};});
  const menuText=async()=>p.$eval('#menu',e=>e.hidden?'':e.textContent);
  const toSetup=async()=>{ if((await G('D.mode'))!=='setup'){ await p.click('#concede'); await mi('포기한다'); } };
  const mi=async(label)=>{ const items=await p.$$('#menu .mi'); for(const it of items){ const t=await it.$eval('span',e=>e.textContent); if(t===label){ await it.click(); await p.waitForTimeout(60); return; } } throw new Error('메뉴 항목 없음: '+label+' / '+await menuText()); };
  const freeze=()=>p.evaluate(()=>{ const S=window.__donghyunq.state; for(const q of S.qix){ q.x=2;q.y=2;q.vx=0;q.vy=0;q.len=1;q.dang=0;q.wT=-1e9; } S.sparx=[]; S.sparxT=1e9; });

  // 0) 첫 화면
  assert.strictEqual(await G('D.mode'),'setup'); assert.ok(!(await p.$eval('#setup-panel',e=>e.hidden))); assert.ok(await p.$eval('#hud',e=>e.hidden));
  assert.deepStrictEqual(await p.$$eval('.slot-btn',a=>a.map(b=>b.disabled)),[true,true,true]); assert.ok(await p.$eval('#full',e=>e.disabled));
  assert.strictEqual(await p.$eval('#example',e=>e.options.length),6); assert.match(await p.$eval('#stamp-mode',e=>e.textContent),/기본/);
  assert.strictEqual(await p.$eval('.series-links',e=>e.children.length),19); assert.strictEqual(await p.$eval('.series-item.is-current .series-name',e=>e.textContent.replace('™','')),'동현큐');
  assert.strictEqual(await p.$$eval('.input-marks .mark',a=>a.map(m=>m.classList.contains('on')).join()),'true,false,true,true','입력 표식: 키보드 on · 마우스 off · 게임패드 on · 전체 화면 on');
  assert.strictEqual(await p.$('#touchpad'),null,'터치패드 없음'); ok('첫 화면: 설정 패널 · 칸 비어 있음 · 예제 6 · 띠 19 · 입력 표식 · 터치패드 없음');
  // 1) 규약 오류
  await p.fill('#code','나는 동현이냐?\n뿡뿡 도오오오오오옹~뿡뿡뿡\n동현이구나'); await p.click('#run'); await p.waitForTimeout(100);
  assert.match(await p.$eval('#result',e=>e.textContent),/방식 번호가 아니다/); assert.strictEqual(await G('D.mode'),'setup');
  const pr=await G(`D.parseSortie('2 3 4 5')`); assert.strictEqual(pr.go,false); assert.match(pr.err[0],/4개/);
  const pr2=await G(`D.parseSortie('5 9 5')`); assert.deepStrictEqual([pr2.go,pr2.c.mode,pr2.c.level,pr2.c.lives],[true,5,9,5]);
  const pr3=await G(`D.parseSortie('1 10')`); assert.strictEqual(pr3.go,false); assert.match(pr3.err[0],/시작 단계가 아니다/);
  const pr4=await G(`D.parseSortie('1 1 0')`); assert.deepStrictEqual([pr4.go,pr4.c.lives],[true,0]); ok('규약: 방식 범위 · 정수 개수 · 단계·목숨 읽기');
  // 2) 예제 여섯
  const want={basic:[1,1,3],swarm:[2,1,3],twin:[3,1,3],fast:[4,1,3],greedy:[5,1,3],stage5:[1,5,5]};
  for(const id of Object.keys(want)){ await toSetup(); await p.selectOption('#example',id); await p.click('#run'); await p.waitForTimeout(150); const t=await txt(); assert.strictEqual(t.mode,'play',id); assert.strictEqual(await G('window.Engine.modeOf(S).id'),want[id][0]); assert.strictEqual(t.level,want[id][1]); assert.strictEqual(t.lives,want[id][2]); assert.ok(!(await p.$eval('#hud',e=>e.hidden))); }
  assert.strictEqual((await txt()).qix.length,1); assert.match(await p.$eval('#day',e=>e.textContent),/단계 5 · 기본/); assert.strictEqual(await G('S.target'),75);
  await toSetup(); await p.selectOption('#example','twin'); await p.click('#run'); await p.waitForTimeout(150); assert.strictEqual((await txt()).qix.length,2); await toSetup(); await p.selectOption('#example','greedy'); await p.click('#run'); await p.waitForTimeout(150); assert.strictEqual((await txt()).target,90); ok('예제 여섯: 방식·시작 단계·목숨 · 쌍둥이 큐 2 · 욕심쟁이 90%');
  // 3) 키보드
  await toSetup(); await p.selectOption('#example','basic'); await p.click('#run'); await p.waitForTimeout(150); await freeze(); await p.evaluate(()=>document.querySelector('#board-wrap').scrollIntoView({block:'center'}));
  await p.focus('#board-wrap'); let t=await txt(); assert.deepStrictEqual([t.player.x,t.player.y],[40,56]);
  await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(350); await p.keyboard.up('ArrowLeft'); t=await txt(); assert.ok(t.player.x<35&&t.player.y===56,'← 테두리 걷기 '+JSON.stringify(t.player)); assert.strictEqual(t.drawing,0);
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(200); await p.keyboard.up('ArrowUp'); t=await txt(); assert.strictEqual(t.drawing,2,'십자키만으로 보통 선'); assert.ok(t.player.y<56&&t.player.y>40,'보통 속도 '+JSON.stringify(t.player));
  await p.keyboard.down('KeyX'); await p.keyboard.down('ArrowUp'); await p.waitForTimeout(300); t=await txt(); assert.strictEqual(t.drawing,2,'X 누른 채 빠르게'); assert.ok(t.player.y<40&&t.trail>8,'빠르게 '+JSON.stringify(t.player));
  await p.keyboard.up('ArrowUp'); await p.keyboard.down('ArrowRight'); await p.waitForTimeout(300); await p.keyboard.up('ArrowRight'); await p.keyboard.down('ArrowDown'); await p.waitForTimeout(600); await p.keyboard.up('ArrowDown'); await p.keyboard.up('KeyX');
  t=await txt(); assert.strictEqual(t.drawing,0,'닫힘'); assert.ok(t.pct>0&&t.score>0,'점령 '+t.pct); assert.match(await p.$eval('#log',e=>e.textContent),/칸 점령/);
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(250); await p.keyboard.up('ArrowRight'); /* 점령한 땅의 모서리를 지나 빈 땅 쪽으로 */
  await p.keyboard.down('KeyZ'); await p.keyboard.down('ArrowUp'); await p.waitForTimeout(300); t=await txt(); assert.strictEqual(t.drawing,1,'Z 느린 선 '+JSON.stringify(t.player)); await p.keyboard.up('ArrowUp'); await p.keyboard.up('KeyZ'); await p.waitForTimeout(100);
  await p.keyboard.press('KeyA'); await p.waitForTimeout(100); assert.match(await G('S.msg'),/기본: 큐 하나와 슈슈 둘/,'A 설명');
  await p.keyboard.press('Enter'); await p.waitForTimeout(100); assert.match(await menuText(),/잠시 멈춤/); const fr0=await G('S.time'); await p.waitForTimeout(400); assert.strictEqual(await G('S.time'),fr0,'메뉴 동안 멎음'); await mi('방식 설명'); assert.match(await menuText(),/기본: 큐 하나/); await p.keyboard.press('KeyZ'); await p.waitForTimeout(60); assert.match(await menuText(),/잠시 멈춤/,'Z로 멈춤 메뉴로'); await mi('계속 간다'); assert.strictEqual(await menuText(),''); ok('키보드: ← 걷기 · ↑ 단추 없이는 안 들어감 · X 빠른 선 닫기 · Z 느린 선 · A · Enter 메뉴');
  // 4) 마우스로 화면을 찍어도 플레이어는 움직이지 않는다
  await p.evaluate(()=>{ const S=window.__donghyunq.state; S.trail=[]; S.trailEdges=[]; S.drawing=0; S.player.x=0; S.player.y=56; }); await p.waitForTimeout(50);
  const r=await bb(); const p0=(await txt()).player; await p.mouse.click(r.x+r.w*0.5,r.y+r.h*0.5); await p.waitForTimeout(300); const p1=(await txt()).player; assert.deepStrictEqual(p1,p0,'마우스 찍기로는 안 움직임'); assert.strictEqual((await txt()).drawing,0); ok('마우스: 화면을 찍어도 움직이지 않음');
  // 5) 저장 메뉴
  await p.evaluate(()=>{ window.__dl=null; URL.createObjectURL=(blob)=>{ blob.text().then(t=>window.__dl=t); return 'blob:x'; }; URL.revokeObjectURL=()=>{}; HTMLAnchorElement.prototype.click=function(){ window.__dlname=this.download; }; });
  await p.keyboard.press('Enter'); await p.waitForTimeout(80); await mi('저장'); assert.match(await menuText(),/^저장/); await mi('브라우저 칸 1'); assert.strictEqual(await menuText(),''); const s1=await p.evaluate(()=>JSON.parse(localStorage.getItem('donghyunq:slot1'))); assert.strictEqual(s1.format,'donghyunq-save'); assert.strictEqual(s1.summary.mode,'기본'); assert.strictEqual(s1.state.cells.length,80*56); const savedScore=s1.state.score;
  assert.match(await p.$eval('.slot-btn',e=>e.textContent),/칸 1.*단계 1 기본/); assert.strictEqual((await p.$$('.slot-del')).length,1);
  await p.keyboard.press('Enter'); await mi('저장'); await mi('브라우저 칸 1'); assert.match(await menuText(),/덮어쓸까/); await mi('그만둔다'); assert.match(await menuText(),/^저장/); await mi('파일로 내려받기'); await p.waitForTimeout(200); const dl=await p.evaluate(()=>[window.__dl,window.__dlname]); assert.ok(dl[0]&&JSON.parse(dl[0]).format==='donghyunq-save'); assert.match(dl[1],/^donghyunq-level1-\d+\.dhsave$/); fs.writeFileSync('/tmp/q.dhsave',dl[0]);
  await p.evaluate(`${H}.state.score+=777`); await p.keyboard.press('Enter'); await mi('불러오기'); assert.match(await menuText(),/^불러오기/); await mi('브라우저 칸 1'); assert.match(await menuText(),/버리고 불러올까/); await mi('그만둔다'); await mi('브라우저 칸 1'); await mi('불러온다'); assert.strictEqual(await G('S.score'),savedScore,'칸에서 불러오면 그 시점'); assert.strictEqual(await G('D.mode'),'play'); assert.strictEqual(await G('S.cells instanceof Uint8Array'),true);
  await p.evaluate(`${H}.state.score+=5`); await p.keyboard.press('Enter'); await mi('불러오기'); await mi('파일에서 불러오기'); await p.setInputFiles('#load-file','/tmp/q.dhsave'); await p.waitForTimeout(200); assert.strictEqual(await G('S.score'),savedScore,'파일에서 불러오면 그 시점');
  fs.writeFileSync('/tmp/q-bad.dhsave','{"hello":1}'); await p.setInputFiles('#load-file','/tmp/q-bad.dhsave'); await p.waitForTimeout(200); assert.match(await p.$eval('#status',e=>e.textContent),/불러오기 실패: 동현큐 저장 파일이 아니다/);
  const bad=JSON.parse(dl[0]); bad.state.player.x=999; fs.writeFileSync('/tmp/q-bad2.dhsave',JSON.stringify(bad)); await p.setInputFiles('#load-file','/tmp/q-bad2.dhsave'); await p.waitForTimeout(200); assert.match(await p.$eval('#status',e=>e.textContent),/플레이어 위치가 맞지 않는다/);
  const bad3=JSON.parse(dl[0]); bad3.state.cells[5]=7; fs.writeFileSync('/tmp/q-bad3.dhsave',JSON.stringify(bad3)); await p.setInputFiles('#load-file','/tmp/q-bad3.dhsave'); await p.waitForTimeout(200); assert.match(await p.$eval('#status',e=>e.textContent),/판 정보가 맞지 않는다/);
  await p.keyboard.press('Enter'); await mi('저장'); await mi('브라우저 칸 2'); await p.keyboard.press('Enter'); await mi('저장'); await mi('브라우저 칸 지우기'); assert.match(await menuText(),/^지울 칸/); await mi('브라우저 칸 2'); await mi('지운다'); assert.strictEqual(await p.evaluate(()=>localStorage.getItem('donghyunq:slot2')),null); await p.keyboard.press('KeyZ'); await p.waitForTimeout(60); assert.match(await menuText(),/^저장/,'Z로 한 단계'); await p.keyboard.press('KeyZ'); await p.waitForTimeout(60); await p.keyboard.press('KeyZ'); await p.waitForTimeout(60); assert.strictEqual(await menuText(),'');
  ok('저장 메뉴 · 덮어쓰기 확인 · 불러오기 확인 · .dhsave 내려받기·열기 · 잘못된 파일 셋 · 칸 지우기');
  // 6) 포기 → 첫 화면 칸 목록
  await p.click('#concede'); await mi('포기한다'); assert.strictEqual(await G('D.mode'),'setup'); assert.deepStrictEqual(await p.$$eval('.slot-btn',a=>a.map(b=>b.disabled)),[false,true,true]);
  await p.click('.slot-btn'); await p.waitForTimeout(100); assert.strictEqual(await G('D.mode'),'play'); assert.strictEqual(await G('S.score'),savedScore);
  await p.click('#concede'); await mi('포기한다'); await p.click('.slot-del'); assert.strictEqual(await p.$eval('.slot-del',e=>e.textContent),'정말 지운다'); await p.click('.slot-del'); assert.strictEqual(await p.evaluate(()=>localStorage.getItem('donghyunq:slot1')),null);
  await p.setInputFiles('#load-file-setup','/tmp/q.dhsave'); await p.waitForTimeout(200); assert.strictEqual(await G('D.mode'),'play'); assert.strictEqual(await G('S.score'),savedScore); ok('첫 화면 칸 목록 · 지우기 두 번 · 파일에서 불러오기');
  // 7) 클리어 카드 → 다음 단계 · 9단계 → 결과 카드
  await freeze(); await p.evaluate(()=>{ const S=window.__donghyunq.state, E=window.Engine; S.trail=[]; S.trailEdges=[]; S.drawing=0; S.cells.fill(0); S.claimed=0; S.pct=0; S.player.x=40; S.player.y=56; }); await p.focus('#board-wrap'); /* 판을 비우고 가운데 아래에서 시작: 세로 선 하나가 정확히 반 */
  await p.keyboard.down('KeyX'); await p.keyboard.down('ArrowUp'); await p.waitForTimeout(600); await p.evaluate(`(()=>{const D=${H}; D.keys.fast=true; D.keys.up=true; D.step(130); D.keys.fast=false; D.keys.up=false;})()`); await p.keyboard.up('ArrowUp'); await p.keyboard.up('KeyX'); t=await txt(); assert.ok(t.pct>=50&&t.pct<51,'세로로 반 '+t.pct);
  await p.evaluate(()=>{ const S=window.__donghyunq.state; S.player.x=20; S.player.y=0; }); await p.evaluate(`(()=>{const D=${H}; D.keys.fast=true; D.keys.down=true; D.step(130); D.keys.fast=false; D.keys.down=false;})()`); await p.waitForTimeout(200);
  assert.strictEqual(await G('D.mode'),'clear'); assert.ok(!(await p.$eval('#result-card',e=>e.hidden))); assert.match(await p.$eval('#result-card',e=>e.textContent),/단계 1 클리어.*7\d\.\d%.*다음은 단계 2/);
  await p.click('#rc-next'); await p.waitForTimeout(100); t=await txt(); assert.strictEqual(t.mode,'play'); assert.strictEqual(t.level,2); assert.strictEqual(t.pct,0); assert.match(await p.$eval('#day',e=>e.textContent),/단계 2 · 기본/);
  await freeze(); await p.evaluate(()=>{ const S=window.__donghyunq.state; S.level=9; for(let y=0;y<56;y++) for(let x=0;x<60;x++) S.cells[y*80+x]=2; S.claimed=60*56; S.pct=75; S.player.x=70; S.player.y=56; S.qix[0].x=63; S.qix[0].y=28; }); /* 9단계에서 75% 점령 상태 · 오른쪽 열 10칸을 세로로 가르면 87.5% → win */
  await p.evaluate(`(()=>{const D=${H}; D.keys.fast=true; D.keys.up=true; D.step(130); D.keys.fast=false; D.keys.up=false;})()`); await p.waitForTimeout(300); assert.strictEqual(await G('D.mode'),'over'); assert.match(await p.$eval('#result-card',e=>e.textContent),/아홉 단계를 모두 마쳤다/); await p.click('#rc-back'); assert.strictEqual(await G('D.mode'),'setup'); ok('클리어 카드(75% 이상) → 다음 단계 · 9단계 결과 카드 · 출전 준비로');
  // 8) 목숨을 다 잃으면 결과 카드
  await p.fill('#code','나는 동현이냐?\n뿡뿡 도옹~뿡뿡뿡~뿡뿡 도옹~뿡뿡뿡~뿡뿡 도옹~뿡뿡뿡\n동현이구나'); await p.click('#run'); await p.waitForTimeout(150); t=await txt(); assert.strictEqual(t.lives,1); assert.strictEqual(t.level,1);
  await p.evaluate(()=>{ const S=window.__donghyunq.state; S.inv=0; S.sparx=[{x:40,y:56,px:41,py:56,t:0,spd:2,born:0}]; }); await p.waitForTimeout(400); assert.strictEqual(await G('D.mode'),'over'); assert.match(await p.$eval('#result-card',e=>e.textContent),/다시 해 보자/); assert.match(await p.$eval('#log',e=>e.textContent),/슈슈와 부딪혔다/); await p.keyboard.press('Enter'); await p.waitForTimeout(100); assert.strictEqual(await G('D.mode'),'setup'); ok('목숨 소진 → 결과 카드 · Enter로 출전 준비');
  // 9) 전체 화면
  await toSetup(); await p.selectOption('#example','fast'); await p.click('#run'); await p.waitForTimeout(150); const w0=(await bb()).w; await p.click('#full'); await p.waitForTimeout(500); assert.ok(!(await p.$eval('#exit-full',e=>e.hidden))); assert.ok((await bb()).w>w0,'전체 화면에서 판이 넓다'); await p.click('#exit-full'); await p.waitForTimeout(400); assert.ok(Math.abs((await bb()).w-w0)<2); ok('전체 화면: 켜고 끄기');
  // 10) 다른 탭을 보면 멎는다
  await p.evaluate(()=>{ Object.defineProperty(document,'hidden',{get:()=>true,configurable:true}); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(100); const t1=await G('S.time'); await p.waitForTimeout(500); assert.strictEqual(await G('S.time'),t1,'숨기면 멎는다');
  await p.evaluate(()=>{ Object.defineProperty(document,'hidden',{get:()=>false,configurable:true}); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(300); assert.match(await menuText(),/잠시 멈춤/); await mi('계속 간다'); await p.waitForTimeout(300); assert.ok((await G('S.time'))>t1); ok('숨기면 멎는다 · 돌아오면 멈춤 메뉴');
  // 11) 규칙 탭 표
  await p.click('text=규칙과 빌런'); await p.waitForTimeout(100);
  assert.strictEqual(await p.$eval('#mode-grid',e=>e.querySelectorAll('article').length),5); assert.strictEqual(await p.$eval('#level-table',e=>e.querySelectorAll('tbody tr').length),9); ok('규칙 표: 방식 5 · 단계 9');
  await p.evaluate(()=>localStorage.clear());
  // 12) 휴대폰: 띠 · 터치패드 없음 · 전체 화면
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}); const m=await ctx.newPage();
  m.on('pageerror',e=>errs.push('mobile: '+e.message)); m.on('console',x=>{ if(x.type()==='error') errs.push('mobile console: '+x.text()); });
  await m.goto(url); await m.waitForTimeout(400); const MG=(js)=>m.evaluate(`(()=>{const D=${H};const S=D.state;return (${js});})()`);
  await m.tap('#run'); await m.waitForTimeout(200); assert.strictEqual(await MG('D.mode'),'play'); assert.strictEqual(await m.$('#touchpad'),null);
  await m.tap('#full'); await m.waitForTimeout(500); assert.ok(!(await m.$eval('#exit-full',e=>e.hidden))); assert.ok((await m.$eval('#board',e=>e.getBoundingClientRect().width))>=360); await m.tap('#exit-full'); await m.waitForTimeout(300); assert.ok(await m.$eval('#exit-full',e=>e.hidden));
  assert.strictEqual(await m.$eval('.series-links',e=>e.children.length),19); const strip=await m.$eval('.series-links',e=>{ const n=e.children.length, L=e.querySelector('.series-item[data-series="lang"]'); const r=[...e.children].map(c=>c.getBoundingClientRect()); return {n, span:getComputedStyle(L).gridColumn.replace(/\s/g,''), langW:L.getBoundingClientRect().width, otherW:r[1].width, rows:new Set(r.map(x=>Math.round(x.top))).size}; }); assert.strictEqual(strip.span,strip.n%2?'span2':'auto','짝수면 auto'); assert.ok(strip.langW>strip.otherW*1.9,'홀수: 동현랭 두 칸 폭'); assert.strictEqual(strip.rows,Math.ceil(strip.n/2)); ok('휴대폰: 시작 · 터치패드 없음 · 전체 화면 · 띠 19(홀수 → 동현랭 두 칸 폭)');
  await ctx.close(); await b.close();
  if(errs.length){ console.error('콘솔 오류',errs); process.exit(1); }
  console.log(`\n${n} ui tests passed · 콘솔 오류 0`);
})().catch(e=>{ console.error(e); process.exit(1); });
