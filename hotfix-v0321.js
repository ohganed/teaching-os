/* Teaching OS v0.32.1 iPad boot hotfix. Restores functions accidentally omitted from v0.32. */

function addStudentScreen(fromCurrent=false){commitActiveScreen();const id=screenLetters.find(x=>!screens.some(s=>s.id===x))||('S'+(screens.length+1));const sc={id,name:'Screen '+id,items:fromCurrent?deepCopy(items):[],currentStep:0,board:[]};screens.push(sc);switchScreen(id);renderScreenStrip();saveState();return sc}

async function attachAudio(){const f=audioInput.files[0];if(!f){alert('MP3/音声ファイルを選んでください。');return}const sc=activeScreen();if(!sc)return;sc.audioName=f.name;sc.audioMediaId=await storeMediaBlob(f,f.name);sc.audioUrl=await getMediaURL(sc.audioMediaId);audioStatus.textContent='Audio: '+f.name+'（Screen '+sc.id+'）';saveState()}

function boardClear(){if(!boardActions.length)return;const prev=deepCopy(boardActions);boardActions=[];redrawBoard();saveState();boardClearBtn.textContent='UNDO CLEAR';setTimeout(()=>{if(boardClearBtn.textContent==='UNDO CLEAR')boardClearBtn.textContent='Clear Board'},3500);boardClearBtn.onclick=()=>{boardActions=prev;redrawBoard();saveState();boardClearBtn.textContent='Clear Board';boardClearBtn.onclick=boardClear}}

function boardPoint(e){const r=stage.getBoundingClientRect(),scaleX=DESIGN_W/r.width,scaleY=DESIGN_H/r.height;return {x:(e.clientX-r.left)*scaleX,y:(e.clientY-r.top)*scaleY}}

function boardUndo(){boardActions.pop();redrawBoard();saveState();if(activeScreenId===liveScreenId&&!liveFrozen)refreshLiveSnapshot(false)}

function clearAudioTimers(){for(const t of audioTimers)clearInterval(t);audioTimers.clear()}

function ensureScreens(){if(!screens.length)screens=[{id:'A',name:'Screen A',items:deepCopy(items),currentStep,board:[]}];if(!screens.some(x=>x.id===activeScreenId))activeScreenId=screens[0].id;if(!screens.some(x=>x.id===liveScreenId))liveScreenId=screens[0].id}

function fadeAudioElement(a,duration=1000,stop=true){
 if(!a)return null;const start=Math.max(0,Math.min(1,a.volume)),steps=20,dt=Math.max(16,duration/steps);let i=0;
 const timer=setInterval(()=>{i++;a.volume=Math.max(0,start*(1-i/steps));if(i>=steps){clearInterval(timer);audioTimers.delete(timer);if(stop){a.pause();try{a.currentTime=0}catch(e){}}}},dt);
 audioTimers.add(timer);return timer;
}

function fit(){const s=Math.min(innerWidth/1280,innerHeight/720);ps.style.transform='scale('+s+')'}

function notesToPresenter(){const t=selectedNotesText();if(!t)return;teacherScriptInput.value+=(teacherScriptInput.value?'\n\n':'')+'🎤 '+t;saveTeacherScript()}

function notesToScreen(){const t=selectedNotesText();if(!t)return;const it={id:'item_'+Date.now(),type:'text',text:t,x:100,y:120,w:960,h:180,size:34,step:currentStep,z:++zCounter,motion:'fade'};items.push(it);selectedId=it.id;renderAll();saveState()}

function openStudentWindow(){if(studentWindow&&!studentWindow.closed){studentWindow.focus();syncStudentWindow();return}studentWindow=window.open('','TeachingOSStudent','popup=yes,width=1280,height=720');if(!studentWindow){alert('ポップアップを許可してください。');return}studentWindow.document.write(studentWindowDocument());studentWindow.document.close();setTimeout(syncStudentWindow,150)}

function redrawBoard(){boardSvg.innerHTML='';boardActions.forEach(a=>{let el;if(a.type==='path'){el=document.createElementNS('http://www.w3.org/2000/svg','path');el.setAttribute('d',a.d);el.setAttribute('fill','none');el.setAttribute('stroke',a.color||'#e8452c');el.setAttribute('stroke-width',a.width||5);el.setAttribute('stroke-linecap','round');el.setAttribute('stroke-linejoin','round')}if(a.type==='circle'){el=document.createElementNS('http://www.w3.org/2000/svg','ellipse');el.setAttribute('cx',(a.x1+a.x2)/2);el.setAttribute('cy',(a.y1+a.y2)/2);el.setAttribute('rx',Math.abs(a.x2-a.x1)/2);el.setAttribute('ry',Math.abs(a.y2-a.y1)/2);el.setAttribute('fill','none');el.setAttribute('stroke','#e8452c');el.setAttribute('stroke-width','5')}if(a.type==='arrow'){el=document.createElementNS('http://www.w3.org/2000/svg','line');el.setAttribute('x1',a.x1);el.setAttribute('y1',a.y1);el.setAttribute('x2',a.x2);el.setAttribute('y2',a.y2);el.setAttribute('stroke','#e8452c');el.setAttribute('stroke-width','5');el.setAttribute('marker-end','url(#boardArrow)')}if(a.type==='text'){el=document.createElementNS('http://www.w3.org/2000/svg','text');el.setAttribute('x',a.x);el.setAttribute('y',a.y);el.setAttribute('fill','#172033');el.setAttribute('font-size','34');el.setAttribute('font-weight','700');el.textContent=a.text}if(el)boardSvg.appendChild(el)});if(boardActions.some(a=>a.type==='arrow')){const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');defs.innerHTML='<marker id="boardArrow" markerWidth="12" markerHeight="12" refX="9" refY="4" orient="auto"><path d="M0,0 L0,8 L10,4 z" fill="#e8452c"/></marker>';boardSvg.prepend(defs)}}

function refreshLiveSnapshot(force=true){if(activeScreenId!==liveScreenId&&!force)return;if(liveFrozen&&!force)return;liveSnapshotHTML=sanitizeStageHTML();syncStudentWindow()}

function renderScreenStrip(){if(!window.screenStrip)return;screenStrip.innerHTML='';ensureScreens();screens.forEach(sc=>{const b=document.createElement('button');b.className='screen-chip'+(sc.id===activeScreenId?' active':'')+(sc.id===liveScreenId?' live':'');b.textContent=sc.id;b.title=sc.name+(sc.id===liveScreenId?'（現在投影）':'');b.addEventListener('click',()=>switchScreen(sc.id));screenStrip.appendChild(b)});liveStateText.textContent='LIVE '+liveScreenId+(liveFrozen?' · FROZEN':'');liveStateText.className=liveFrozen?'preview-indicator':'live-indicator';if(window.editStateText)editStateText.textContent='EDIT '+activeScreenId+(activeScreenId===liveScreenId?' · LIVE':' · PREVIEW')}

function restoreBoardForActiveScreen(){redrawBoard()}

function sanitizeStageHTML(){const clone=stage.cloneNode(true);clone.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected'));clone.querySelectorAll('.resize-handle,.move-grip').forEach(x=>x.remove());clone.querySelector('.silent-cover')?.remove();clone.querySelector('.tap-hint')?.remove();return clone.innerHTML}

function selectedNotesText(){const el=studyNotes;const a=el.selectionStart??0,b=el.selectionEnd??0;return (a!==b?el.value.slice(a,b):el.value).trim()}

function setBoardTool(tool){boardTool=tool;document.querySelectorAll('.cockpit-tool').forEach(b=>b.classList.toggle('mode-on',b.dataset.tool===tool));boardSvg.classList.toggle('draw-active',['pen','circle','arrow'].includes(tool));stage.style.cursor=tool==='pointer'?'crosshair':tool==='stick'?'crosshair':tool==='text'?'text':''}

function smoothStrokePoints(points){const mode=penStability?.value||'mid';const windowSize=mode==='high'?5:mode==='mid'?3:1;if(windowSize<=1)return points;const filtered=[];for(const p of points){const last=filtered[filtered.length-1];if(!last||Math.hypot(p.x-last.x,p.y-last.y)>1.7)filtered.push(p)}return filtered.map((p,i)=>{const a=Math.max(0,i-windowSize+1),chunk=filtered.slice(a,i+1);return{x:chunk.reduce((n,q)=>n+q.x,0)/chunk.length,y:chunk.reduce((n,q)=>n+q.y,0)/chunk.length}})}

function strokePath(points){const ps=smoothStrokePoints(points);if(!ps.length)return'';return 'M '+ps.map(q=>q.x.toFixed(1)+' '+q.y.toFixed(1)).join(' L ')}

function studentWindowDocument(){return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${document.querySelector('style').textContent}html,body{margin:0;background:#000;overflow:hidden}#vp{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}#ps{position:absolute;width:1280px;height:720px;overflow:hidden;background:var(--paper);color:var(--ink);transform-origin:center}</style></head><body><div id="vp"><div id="ps"></div><div id="remotePointer" style="display:none;position:absolute;width:22px;height:22px;border:3px solid #ef4444;border-radius:50%;transform:translate(-50%,-50%);z-index:99999;pointer-events:none"></div><div id="remoteStick" style="display:none;position:absolute;width:160px;height:4px;background:#ef4444;z-index:99999;pointer-events:none"></div></div><script>function fit(){const s=Math.min(innerWidth/1280,innerHeight/720);ps.style.transform='scale('+s+')'}addEventListener('resize',fit);addEventListener('keydown',e=>{if(['ArrowRight',' ','Enter'].includes(e.key))opener.postMessage({source:'student',command:'next'},'*');if(e.key==='ArrowLeft')opener.postMessage({source:'student',command:'prev'},'*');if(e.key==='Escape')opener.postMessage({source:'student',command:'focus'},'*')});addEventListener('message',e=>{if(e.data?.source==='teacher'){ps.innerHTML=e.data.html;ps.animate([{opacity:.35},{opacity:1}],{duration:320,easing:'ease-out'});document.documentElement.style.setProperty('--paper',e.data.paper);document.documentElement.style.setProperty('--ink',e.data.ink)}if(e.data?.source==='teacher-pointer'){const s=Math.min(innerWidth/1280,innerHeight/720),ox=(innerWidth-1280*s)/2,oy=(innerHeight-720*s)/2;const el=e.data.kind==='stick'?remoteStick:remotePointer;remotePointer.style.display='none';remoteStick.style.display='none';if(e.data.visible){el.style.display='block';el.style.left=(ox+e.data.x*s)+'px';el.style.top=(oy+e.data.y*s)+'px';if(e.data.kind==='stick'){el.style.width=(160*s)+'px';el.style.height=Math.max(2,4*s)+'px';el.style.transform='translate(-100%,-50%)'}}}});fit();opener.postMessage({source:'student',command:'ready'},'*');<\/script></body></html>`}

function switchScreen(id){if(id===activeScreenId)return;commitActiveScreen();const sc=screens.find(x=>x.id===id);if(!sc)return;activeScreenId=id;items=deepCopy(sc.items||[]);currentStep=sc.currentStep||0;boardActions=deepCopy(sc.board||[]);selectedId=null;spotlightId=null;renderAll();saveState()}

function syncStudentWindow(){const on=studentWindow&&!studentWindow.closed;windowStatus.textContent=on?'別ウィンドウ：接続中':'別ウィンドウ：未接続';windowStatus.classList.toggle('on',!!on);if(!on)return;if(!liveSnapshotHTML)liveSnapshotHTML=sanitizeStageHTML();const html=blackout?'<div style="position:absolute;inset:0;background:#000"></div>':liveSnapshotHTML;studentWindow.postMessage({source:'teacher',html,paper:getComputedStyle(document.documentElement).getPropertyValue('--paper'),ink:getComputedStyle(document.documentElement).getPropertyValue('--ink')},'*')}

function takeLive(){commitActiveScreen();const oldLive=liveScreenId;if(oldLive&&oldLive!==activeScreenId)liveHistory.push(oldLive);liveScreenId=activeScreenId;liveFrozen=false;blackout=false;liveSnapshotHTML=sanitizeStageHTML();renderScreenStrip();syncStudentWindow();saveState();transitionScreenAudio(oldLive,liveScreenId)}

function toggleBlack(){blackout=!blackout;blackBtn.textContent=blackout?'SHOW':'BLACK';syncStudentWindow()}

function toggleFreeze(){liveFrozen=!liveFrozen;if(!liveFrozen&&activeScreenId===liveScreenId)liveSnapshotHTML=sanitizeStageHTML();freezeBtn.textContent=liveFrozen?'RELEASE':'FREEZE';renderScreenStrip();syncStudentWindow()}

function toggleFullscreen(){if(document.body.classList.contains('fullscreen')){document.body.classList.remove('fullscreen');document.exitFullscreen?.().catch(()=>{})}else{document.body.classList.add('fullscreen');document.documentElement.requestFullscreen?.().catch(()=>{})}requestAnimationFrame(fitStage)}

function toggleSilent(){silent=!silent;stage.classList.toggle('silent',silent);silentBtn.textContent=silent?'Silent Mode解除':'Silent Mode'}
