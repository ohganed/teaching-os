/* Teaching OS v0.32.2 — Physics Vector Tools / iPad manipulation improvement */
(() => {
  'use strict';

  const VERSION = 'v0.32.2 Physics Vector Tools';
  const state = {
    drawMode: false,
    overlapMode: false,
    dragStart: null,
    preview: null
  };

  function $(id){ return document.getElementById(id); }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function uid(prefix='pv'){ return prefix+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,7); }
  function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function stagePoint(ev){
    const r = stage.getBoundingClientRect();
    const sx = DESIGN_W / r.width;
    const sy = DESIGN_H / r.height;
    return {
      x: clamp((ev.clientX-r.left)*sx,0,DESIGN_W),
      y: clamp((ev.clientY-r.top)*sy,0,DESIGN_H)
    };
  }

  function vectorSvg(w,h,sx,sy,ex,ey,color,label,dashed=false){
    const stroke = esc(color || '#d62828');
    const markerId = 'm'+Math.random().toString(36).slice(2,8);
    const mx=(sx+ex)/2, my=(sy+ey)/2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      <defs><marker id="${markerId}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
        <path d="M0,0 L9,4.5 L0,9 Z" fill="${stroke}"/>
      </marker></defs>
      <line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="${stroke}" stroke-width="7"
        stroke-linecap="round" ${dashed?'stroke-dasharray="13 10"':''} marker-end="url(#${markerId})"/>
      ${label ? `<text x="${mx+10}" y="${my-10}" font-size="28" font-weight="700" fill="${stroke}"
        font-family="Arial, sans-serif">${esc(label)}</text>` : ''}
    </svg>`;
  }

  function addVector(x1,y1,x2,y2,opts={}){
    const pad = 28;
    const x = Math.min(x1,x2)-pad, y = Math.min(y1,y2)-pad;
    const w = Math.max(80,Math.abs(x2-x1)+pad*2);
    const h = Math.max(70,Math.abs(y2-y1)+pad*2);
    const sx=x1-x, sy=y1-y, ex=x2-x, ey=y2-y;
    const color=opts.color||'#d62828';
    const label=opts.label||'F';
    const it={
      id:uid('force'),
      type:'image',
      src:svgDataUrl(vectorSvg(w,h,sx,sy,ex,ey,color,label,!!opts.dashed)),
      caption:opts.caption||`力ベクトル ${label}`,
      x,y,w,h,
      step:Math.max(0,currentStep),
      z:++zCounter,
      physicsKind:opts.kind||'forceVector',
      vectorMeta:{
        sx:sx/w, sy:sy/h, ex:ex/w, ey:ey/h,
        color,label,
        role:opts.role||'force'
      }
    };
    items.push(it);
    selectedId=it.id;
    renderAll(); saveState();
    return it;
  }

  function endpoints(it){
    const m=it?.vectorMeta;
    if(!m) return null;
    return {
      x1:it.x+m.sx*it.w, y1:it.y+m.sy*it.h,
      x2:it.x+m.ex*it.w, y2:it.y+m.ey*it.h
    };
  }

  function vectorItems(){
    return items.filter(it=>it?.vectorMeta && ['forceVector','resultantVector','componentVector'].includes(it.physicsKind));
  }

  function nearestCommonPair(){
    const vs=vectorItems().filter(v=>v.physicsKind==='forceVector');
    if(vs.length<2) return null;
    let preferred = items.find(v=>v.id===selectedId && v.physicsKind==='forceVector');
    const ordered=[...vs].sort((a,b)=>(b.z||0)-(a.z||0));
    if(preferred){
      const p=endpoints(preferred);
      let best=null,bestD=Infinity;
      for(const v of ordered){
        if(v.id===preferred.id) continue;
        const q=endpoints(v); const d=Math.hypot(p.x1-q.x1,p.y1-q.y1);
        if(d<bestD){bestD=d;best=v;}
      }
      if(best && bestD<=55) return [preferred,best];
    }
    let best=null,bestD=Infinity;
    for(let i=0;i<ordered.length;i++) for(let j=i+1;j<ordered.length;j++){
      const a=endpoints(ordered[i]), b=endpoints(ordered[j]);
      const d=Math.hypot(a.x1-b.x1,a.y1-b.y1);
      if(d<bestD){bestD=d;best=[ordered[i],ordered[j]];}
    }
    return bestD<=55?best:null;
  }

  function makeResultant(){
    const pair=nearestCommonPair();
    if(!pair){
      toastPhysics('同じ始点から出る力の矢印を2本描いてください。',true);
      return;
    }
    const a=endpoints(pair[0]), b=endpoints(pair[1]);
    const ox=(a.x1+b.x1)/2, oy=(a.y1+b.y1)/2;
    const dx=(a.x2-a.x1)+(b.x2-b.x1);
    const dy=(a.y2-a.y1)+(b.y2-b.y1);
    const r=addVector(ox,oy,ox+dx,oy+dy,{color:'#17823b',label:'R',kind:'resultantVector',role:'resultant',caption:'合力 R'});
    r.sourceVectorIds=[pair[0].id,pair[1].id];
    saveState();
    toastPhysics('合力 R を作図しました。');
  }

  function selectedForce(){
    return items.find(v=>v.id===selectedId && v?.vectorMeta) ||
           [...vectorItems()].sort((a,b)=>(b.z||0)-(a.z||0))[0];
  }

  function decomposeForce(){
    const src=selectedForce();
    if(!src){ toastPhysics('分解する力の矢印を選択してください。',true); return; }
    const e=endpoints(src);
    const theta=+($('pvDecompAngle')?.value||0);
    const rad=theta*Math.PI/180;
    const Fx=e.x2-e.x1, FyMath=-(e.y2-e.y1);
    const c=Math.cos(rad), s=Math.sin(rad);
    const a=Fx*c + FyMath*s;
    const b=Fx*(-s) + FyMath*c;
    const ux=c, uy=-s;
    const vx=-s, vy=-c;
    const c1=addVector(e.x1,e.y1,e.x1+a*ux,e.y1+a*uy,{
      color:'#2166d1',label:'F₁',kind:'componentVector',role:'component',caption:`分力 F₁ (${theta}°)`
    });
    const c2=addVector(e.x1,e.y1,e.x1+b*vx,e.y1+b*vy,{
      color:'#e67e22',label:'F₂',kind:'componentVector',role:'component',caption:`分力 F₂ (${theta+90}°)`
    });
    c1.sourceVectorId=src.id; c2.sourceVectorId=src.id;
    saveState();
    toastPhysics(`力を ${theta}° と ${theta+90}° の2方向へ分解しました。`);
  }

  function setDrawMode(on){
    state.drawMode=on;
    state.overlapMode=false;
    const b=$('pvDrawForce');
    if(b){b.textContent=on?'✋ 力の矢印：描画中（もう一度で終了）':'➜ 力の矢印を描く';b.classList.toggle('primary',on);}
    const ob=$('pvOverlapPick'); if(ob) ob.classList.remove('primary');
    toastPhysics(on?'Student View上で、始点から終点までドラッグしてください。続けて何本でも描けます。':'力の矢印モードを終了しました。');
  }

  function makePreview(a,b){
    removePreview();
    const el=document.createElement('div');
    el.id='pvVectorPreview';
    el.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:9999;';
    el.innerHTML=`<svg viewBox="0 0 ${DESIGN_W} ${DESIGN_H}" width="100%" height="100%">
      <defs><marker id="pva" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#d62828"/></marker></defs>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#d62828" stroke-width="7" stroke-linecap="round" marker-end="url(#pva)"/>
    </svg>`;
    slide.appendChild(el); state.preview=el;
  }
  function removePreview(){ if(state.preview){state.preview.remove();state.preview=null;} }

  function onPointerDown(ev){
    if(state.overlapMode){
      ev.preventDefault(); ev.stopImmediatePropagation();
      showOverlapPicker(stagePoint(ev));
      return;
    }
    if(!state.drawMode) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    const p=stagePoint(ev); state.dragStart=p;
    try{ stage.setPointerCapture?.(ev.pointerId); }catch{}
    makePreview(p,p);
  }
  function onPointerMove(ev){
    if(!state.drawMode || !state.dragStart) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    makePreview(state.dragStart,stagePoint(ev));
  }
  function onPointerUp(ev){
    if(!state.drawMode || !state.dragStart) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    const a=state.dragStart,b=stagePoint(ev);state.dragStart=null;removePreview();
    if(Math.hypot(b.x-a.x,b.y-a.y)<18) return;
    const label=($('pvForceLabel')?.value||'F').trim()||'F';
    const color=$('pvForceColor')?.value||'#d62828';
    addVector(a.x,a.y,b.x,b.y,{color,label,kind:'forceVector',role:'force',caption:`力 ${label}`});
  }

  function normalizeZ(){
    const s=[...items].sort((a,b)=>(a.z||0)-(b.z||0));
    s.forEach((it,i)=>it.z=i+1);
    zCounter=Math.max(zCounter,s.length+1);
  }
  function moveLayer(delta){
    const it=items.find(x=>x.id===selectedId); if(!it){toastPhysics('要素を選択してください。',true);return;}
    normalizeZ();
    const s=[...items].sort((a,b)=>a.z-b.z), i=s.findIndex(x=>x.id===it.id), j=clamp(i+delta,0,s.length-1);
    if(i===j)return;
    const other=s[j]; const z=it.z;it.z=other.z;other.z=z;
    renderAll();saveState();
  }
  function extremeLayer(front){
    const it=items.find(x=>x.id===selectedId); if(!it){toastPhysics('要素を選択してください。',true);return;}
    normalizeZ();it.z=front?++zCounter:0;renderAll();saveState();
  }

  function itemsAt(p){
    return items
      .filter(it=>p.x>=it.x && p.x<=it.x+it.w && p.y>=it.y && p.y<=it.y+it.h)
      .sort((a,b)=>(b.z||0)-(a.z||0));
  }
  function showOverlapPicker(p){
    state.overlapMode=false;
    const btn=$('pvOverlapPick');if(btn)btn.classList.remove('primary');
    document.getElementById('pvOverlapMenu')?.remove();
    const hits=itemsAt(p);
    if(!hits.length){toastPhysics('この位置には要素がありません。',true);return;}
    if(hits.length===1){selectItem(hits[0].id);toastPhysics('要素を選択しました。');return;}
    const menu=document.createElement('div');menu.id='pvOverlapMenu';
    menu.style.cssText='position:fixed;z-index:999999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,88vw);max-height:70vh;overflow:auto;background:#101827;color:#fff;border:2px solid #76a7ff;border-radius:16px;padding:14px;box-shadow:0 18px 70px #000a';
    menu.innerHTML='<div style="font-weight:900;margin-bottom:10px">重なっている要素を選択</div>';
    hits.forEach((it,i)=>{
      const b=document.createElement('button');b.className='btn';b.style.cssText='width:100%;margin:4px 0;text-align:left;min-height:44px';
      b.textContent=`${i+1}. ${it.caption||it.physicsKind||it.type||'要素'}${it.id===selectedId?' ✓':''}`;
      b.onclick=()=>{selectItem(it.id);menu.remove();toastPhysics('選択しました。');};menu.appendChild(b);
    });
    const close=document.createElement('button');close.className='btn small';close.style.cssText='width:100%;margin-top:8px';close.textContent='閉じる';close.onclick=()=>menu.remove();menu.appendChild(close);
    document.body.appendChild(menu);
  }

  function applySlopeAngle(){
    const it=items.find(x=>x.id===selectedId);
    if(!it || it.physicsKind!=='slope'){toastPhysics('角度を変える斜面を選択してください。',true);return;}
    const angle=clamp(+($('pvSlopeAngle')?.value||30),5,80);
    const old=$('physicsAngleInput'); if(old) old.value=angle;
    try{
      it.src=svgDataUrl(physicsSvg('slope'));
      it.physicsAngle=angle;
      renderAll();saveState();
      toastPhysics(`斜面を ${angle}° に変更しました。`);
    }catch(e){toastPhysics('斜面角度を更新できませんでした。',true);}
  }

  function toastPhysics(msg,error=false){
    const n=$('pvStatus'); if(!n)return;
    n.textContent=msg;n.style.color=error?'#ffb4b4':'#bfe0ff';
  }

  function buildPanel(){
    if($('physicsVectorToolsPanel')) return;
    const host=$('physicsPartsPanel');
    if(!host) return;
    const panel=document.createElement('section');
    panel.className='panel';panel.id='physicsVectorToolsPanel';
    panel.innerHTML=`
      <h2>➜ 力・ベクトル作図</h2>
      <div class="col">
        <div class="physics-note">図ではなく実際の作図ツールです。Student View上へ直接、力の矢印・合力・分力を作れます。</div>
        <div class="physics-inline">
          <div class="field"><label>矢印ラベル</label><input id="pvForceLabel" type="text" value="F" maxlength="8"></div>
          <div class="field"><label>矢印色</label><input id="pvForceColor" type="color" value="#d62828"></div>
        </div>
        <button class="btn" id="pvDrawForce">➜ 力の矢印を描く</button>
        <div class="physics-inline">
          <button class="btn primary" id="pvResultant">↗ 合力を作図</button>
          <button class="btn" id="pvOverlapPick">重なりから選ぶ</button>
        </div>
        <div class="field">
          <label>分解する第1方向（0°=右、90°=上）</label>
          <input id="pvDecompAngle" type="number" min="-180" max="180" step="1" value="0">
        </div>
        <button class="btn primary" id="pvDecompose">↗↗ 選択した力を2方向へ分解</button>
        <div class="physics-note">合力：同じ始点から2本の力を描いて「合力を作図」。分解：1本を選び、第1方向を決めて「分解」。第2方向は直角方向になります。</div>

        <h2 style="margin-top:8px">斜面・重なり操作</h2>
        <div class="physics-inline">
          <div class="field"><label>選択斜面の角度</label><input id="pvSlopeAngle" type="number" min="5" max="80" value="30"></div>
          <button class="btn" id="pvApplySlope">角度を適用</button>
        </div>
        <div class="physics-inline">
          <button class="btn small" id="pvLayerDown">一段 後ろ</button>
          <button class="btn small" id="pvLayerUp">一段 前</button>
          <button class="btn small" id="pvLayerBottom">最背面</button>
          <button class="btn small" id="pvLayerTop">最前面</button>
        </div>
        <div id="pvStatus" class="status">力の矢印を描く準備ができています。</div>
      </div>`;
    host.insertAdjacentElement('afterend',panel);

    $('pvDrawForce').onclick=()=>setDrawMode(!state.drawMode);
    $('pvResultant').onclick=makeResultant;
    $('pvDecompose').onclick=decomposeForce;
    $('pvApplySlope').onclick=applySlopeAngle;
    $('pvOverlapPick').onclick=()=>{
      state.overlapMode=!state.overlapMode;state.drawMode=false;removePreview();
      $('pvOverlapPick').classList.toggle('primary',state.overlapMode);
      $('pvDrawForce').classList.remove('primary');$('pvDrawForce').textContent='➜ 力の矢印を描く';
      toastPhysics(state.overlapMode?'Student View上で、選びたい重なり位置を1回タップしてください。':'重なり選択を終了しました。');
    };
    $('pvLayerDown').onclick=()=>moveLayer(-1);
    $('pvLayerUp').onclick=()=>moveLayer(1);
    $('pvLayerBottom').onclick=()=>extremeLayer(false);
    $('pvLayerTop').onclick=()=>extremeLayer(true);
  }

  function improvePhysicsTouch(){
    const st=document.createElement('style');
    st.textContent=`
      .physics-item{touch-action:none}
      .physics-item.selected{outline:4px dashed #2d68d8!important;outline-offset:7px!important}
      .physics-item.selected::before{content:"✥ 移動";position:absolute;left:50%;top:-38px;transform:translateX(-50%);
        background:#2d68d8;color:white;padding:7px 16px;border-radius:999px;font-size:15px;font-weight:900;
        min-width:86px;text-align:center;pointer-events:none;box-shadow:0 4px 12px #0005}
      #physicsVectorToolsPanel .btn{min-height:44px}
      #physicsVectorToolsPanel input{min-height:44px}
    `;
    document.head.appendChild(st);
  }

  function boot(){
    buildPanel();improvePhysicsTouch();
    stage.addEventListener('pointerdown',onPointerDown,true);
    stage.addEventListener('pointermove',onPointerMove,true);
    stage.addEventListener('pointerup',onPointerUp,true);
    const version=document.querySelector('.version'); if(version)version.textContent=VERSION;
    document.title='Teaching OS '+VERSION;
    console.info('[Teaching OS] Physics Vector Tools ready');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
