/* Teaching OS v0.32.2 — Physics Vector Tools / iPad manipulation improvement */
(() => {
  'use strict';

  const VERSION = 'v0.32.2 Physics Vector Tools';
  const state = {
    drawMode: false,
    overlapMode: false,
    dragStart: null,
    preview: null,
    activeInclineId: null
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

  function activeIncline(){
    const selected=items.find(x=>x.id===selectedId && x.physicsKind==='slope');
    if(selected){
      state.activeInclineId=selected.id;
      return selected;
    }
    const remembered=items.find(x=>x.id===state.activeInclineId && x.physicsKind==='slope');
    return remembered || null;
  }

  function physicsSkillStack(){
    return window.TeachingOSPhysicsSkills || null;
  }

  function updateInclineSkillReadout(angle){
    const api=physicsSkillStack();
    const out=$('pvSkillReadout');
    if(!out) return;
    if(!api){
      out.textContent='Physics Skill Stack: UNVERIFIED（まだ読み込まれていません）';
      return;
    }
    const mass=clamp(+($('pvMassKg')?.value||1),0,10000);
    const model=api.deriveInclineForces({massKg:mass,gravity:9.8,angleDeg:angle});
    const checks=api.verifyInclineModel(model);
    const summary=api.verificationSummary(checks);
    const q=model.quantities;
    const cfu=api.inclineCheckForUnderstanding(model);
    out.innerHTML=
      '<div><b>Physics Model</b> θ='+angle+'° / m='+mass+' kg</div>'+
      '<div>mg = '+q.weightN.toFixed(2)+' N</div>'+
      '<div>mg sinθ = '+q.parallelN.toFixed(2)+' N</div>'+
      '<div>mg cosθ = '+q.normalComponentN.toFixed(2)+' N</div>'+
      '<div><b>Verification: '+summary.result+'</b> ('+summary.passed+'/'+summary.total+')</div>'+
      '<div style="margin-top:6px"><b>予測:</b> '+cfu.prompt+'</div>';
    out.dataset.physicsResult=summary.result;
  }

  function applySlopeAngle(){
    const it=items.find(x=>x.id===selectedId);
    if(!it || it.physicsKind!=='slope'){toastPhysics('角度を変える斜面を選択してください。',true);return;}
    state.activeInclineId=it.id;
    const angle=clamp(+($('pvSlopeAngle')?.value||30),5,80);
    const range=$('pvSlopeAngleRange'); if(range) range.value=angle;
    const old=$('physicsAngleInput'); if(old) old.value=angle;
    try{
      it.src=svgDataUrl(physicsSvg('slope'));
      it.physicsAngle=angle;
      removeAutoInclineVectors();
      renderAll();saveState();
      updateInclineSkillReadout(angle);
      toastPhysics(`斜面を ${angle}° に変更しました。Physics Modelも更新しました。`);
    }catch(e){toastPhysics('斜面角度を更新できませんでした。',true);}
  }


  function removeAutoInclineVectors(){
    const before=items.length;
    items=items.filter(it=>!it?.autoPhysicsRole);
    if(items.length!==before){renderAll();saveState();}
  }

  function addAutoInclineVectors(){
    const slope=activeIncline();
    if(!slope){toastPhysics('自動分力を表示する斜面を選択してください。',true);return;}
    const api=physicsSkillStack();
    if(!api){toastPhysics('Physics Skill Stack が読み込まれていません。',true);return;}

    removeAutoInclineVectors();

    const angle=clamp(+($('pvSlopeAngle')?.value||slope.physicsAngle||30),5,80);
    const mass=clamp(+($('pvMassKg')?.value||1),0,10000);
    const model=api.deriveInclineForces({massKg:mass,gravity:9.8,angleDeg:angle});
    const q=model.quantities;

    const cx=slope.x+slope.w*0.58;
    const cy=slope.y+slope.h*0.40;
    const scale=clamp(10/Math.max(q.weightN,1),0.7,8);

    const weightLen=q.weightN*scale;
    const parallelLen=q.parallelN*scale;
    const normalLen=q.normalComponentN*scale;
    const rad=angle*Math.PI/180;

    const created=[];

    const weight=addVector(cx,cy,cx,cy+weightLen,{
      color:'#d62828',label:'mg',kind:'componentVector',role:'source',
      caption:'重力 mg'
    });
    weight.autoPhysicsRole='incline-weight';
    created.push(weight);

    const px=cx-parallelLen*Math.cos(rad);
    const py=cy+parallelLen*Math.sin(rad);
    const parallel=addVector(cx,cy,px,py,{
      color:'#2166d1',label:'mg sinθ',kind:'componentVector',role:'component',
      caption:'斜面方向 mg sinθ'
    });
    parallel.autoPhysicsRole='incline-parallel';
    created.push(parallel);

    const nx=cx+normalLen*Math.sin(rad);
    const ny=cy+normalLen*Math.cos(rad);
    const normal=addVector(cx,cy,nx,ny,{
      color:'#e67e22',label:'mg cosθ',kind:'componentVector',role:'component',
      caption:'斜面垂直方向 mg cosθ'
    });
    normal.autoPhysicsRole='incline-normal';
    created.push(normal);

    for(const it of created){
      it.physicsModel={
        kind:'incline-gravity-decomposition',
        angleDeg:angle,
        massKg:mass,
        gravity:9.8
      };
    }

    selectedId=slope.id;
    state.activeInclineId=slope.id;
    saveState();renderAll();
    toastPhysics('Physics Modelから mg / mg sinθ / mg cosθ を自動描画しました。');
  }


  function refreshSelectedInclineFromControls({redrawVectors=true,quiet=true}={}){
    const slope=activeIncline();
    if(!slope) return false;
    const angle=clamp(+($('pvSlopeAngle')?.value||slope.physicsAngle||30),5,80);
    const old=$('physicsAngleInput'); if(old) old.value=angle;
    try{
      slope.src=svgDataUrl(physicsSvg('slope'));
      slope.physicsAngle=angle;
      removeAutoInclineVectors();
      renderAll();saveState();
      updateInclineSkillReadout(angle);
      if(redrawVectors) addAutoInclineVectors();
      if(!quiet) toastPhysics(`斜面 ${angle}° をPhysics Modelと同期しました。`);
      return true;
    }catch(e){
      if(!quiet) toastPhysics('リアルタイム更新に失敗しました。',true);
      return false;
    }
  }



  function addAutoInclineAxes(slope, angle){
    const cx=slope.x+slope.w*0.58;
    const cy=slope.y+slope.h*0.40;
    const len=95;
    const rad=angle*Math.PI/180;

    const p=addVector(cx,cy,cx+len*Math.cos(rad),cy-len*Math.sin(rad),{
      color:'#64748b',label:'∥',kind:'componentVector',role:'axis',
      caption:'斜面方向軸'
    });
    p.autoPhysicsRole='incline-axis-parallel';

    const n=addVector(cx,cy,cx-len*Math.sin(rad),cy-len*Math.cos(rad),{
      color:'#64748b',label:'⊥',kind:'componentVector',role:'axis',
      caption:'斜面垂直方向軸'
    });
    n.autoPhysicsRole='incline-axis-normal';

    for(const it of [p,n]){
      it.physicsModel={kind:'incline-coordinate-axes',angleDeg:angle};
    }
    selectedId=slope.id;
    state.activeInclineId=slope.id;
    saveState();renderAll();
  }

  function addAutoInclineVectorsForRoles(roles){
    const slope=activeIncline();
    if(!slope) return false;
    const api=physicsSkillStack();
    if(!api) return false;

    removeAutoInclineVectors();

    const angle=clamp(+($('pvSlopeAngle')?.value||slope.physicsAngle||30),5,80);
    const mass=clamp(+($('pvMassKg')?.value||1),0,10000);
    const model=api.deriveInclineForces({massKg:mass,gravity:9.8,angleDeg:angle});
    const q=model.quantities;

    const cx=slope.x+slope.w*0.58;
    const cy=slope.y+slope.h*0.40;
    const scale=clamp(10/Math.max(q.weightN,1),0.7,8);
    const rad=angle*Math.PI/180;

    if(roles.includes('axes')) addAutoInclineAxes(slope,angle);

    if(roles.includes('weight')){
      const weight=addVector(cx,cy,cx,cy+q.weightN*scale,{
        color:'#d62828',label:'mg',kind:'componentVector',role:'source',
        caption:'重力 mg'
      });
      weight.autoPhysicsRole='incline-weight';
      weight.physicsModel={kind:'incline-gravity-decomposition',angleDeg:angle,massKg:mass,gravity:9.8};
    }

    if(roles.includes('parallel')){
      const l=q.parallelN*scale;
      const parallel=addVector(cx,cy,cx-l*Math.cos(rad),cy+l*Math.sin(rad),{
        color:'#2166d1',label:'mg sinθ',kind:'componentVector',role:'component',
        caption:'斜面方向 mg sinθ'
      });
      parallel.autoPhysicsRole='incline-parallel';
      parallel.physicsModel={kind:'incline-gravity-decomposition',angleDeg:angle,massKg:mass,gravity:9.8};
    }

    if(roles.includes('normal')){
      const l=q.normalComponentN*scale;
      const normal=addVector(cx,cy,cx+l*Math.sin(rad),cy+l*Math.cos(rad),{
        color:'#e67e22',label:'mg cosθ',kind:'componentVector',role:'component',
        caption:'斜面垂直方向 mg cosθ'
      });
      normal.autoPhysicsRole='incline-normal';
      normal.physicsModel={kind:'incline-gravity-decomposition',angleDeg:angle,massKg:mass,gravity:9.8};
    }

    selectedId=slope.id;
    state.activeInclineId=slope.id;
    saveState();renderAll();
    return true;
  }

  function syncDerivationVisuals(){
    const slope=activeIncline();
    if(!slope) return;
    const rolesByStep=[
      ['weight'],
      ['weight','axes'],
      ['weight','axes'],
      ['weight','axes','parallel'],
      ['weight','axes','parallel','normal'],
      ['weight','axes','parallel','normal']
    ];
    const roles=rolesByStep[clamp(derivationState.step,0,rolesByStep.length-1)];
    addAutoInclineVectorsForRoles(roles);
  }

  const derivationState = { step: 0 };

  function inclineDerivationSteps(){
    const api=physicsSkillStack();
    const angle=clamp(+($('pvSlopeAngle')?.value||30),5,80);
    const mass=clamp(+($('pvMassKg')?.value||1),0,10000);
    const model=api ? api.deriveInclineForces({massKg:mass,gravity:9.8,angleDeg:angle}) : null;
    const q=model?.quantities || {weightN:mass*9.8,parallelN:NaN,normalComponentN:NaN};
    return [
      {
        title:'1. 現象',
        body:`質量 ${mass} kg の物体には、鉛直下向きに重力 mg が働く。`,
        formula:`mg = ${q.weightN.toFixed(2)} N`
      },
      {
        title:'2. 座標を斜面に合わせる',
        body:'斜面方向と、斜面に垂直な方向を新しい2軸として考える。重力そのものは変わらない。',
        formula:'source vector: mg'
      },
      {
        title:'3. 重力を2軸へ射影する',
        body:`斜面角 θ=${angle}°。重力ベクトルを斜面方向・垂直方向に分ける。`,
        formula:'orthogonal projection'
      },
      {
        title:'4. 斜面方向の成分',
        body:'斜面方向の成分は、重力ベクトルの斜面方向への射影として現れる。',
        formula:`F∥ = mg sinθ = ${Number(q.parallelN).toFixed(2)} N`
      },
      {
        title:'5. 斜面に垂直な成分',
        body:'斜面に垂直な成分は、重力ベクトルの垂直方向への射影として現れる。',
        formula:`F⊥ = mg cosθ = ${Number(q.normalComponentN).toFixed(2)} N`
      },
      {
        title:'6. 検証',
        body:'2つの成分を直交ベクトルとして合成すると、元の重力 mg に戻る。',
        formula:`√(F∥² + F⊥²) = mg`
      }
    ];
  }

  function renderInclineDerivation(){
    const box=$('pvDerivation');
    if(!box) return;
    const steps=inclineDerivationSteps();
    derivationState.step=clamp(derivationState.step,0,steps.length-1);
    const s=steps[derivationState.step];
    box.innerHTML=
      '<div style="font-weight:900">'+s.title+'</div>'+
      '<div style="margin-top:6px">'+s.body+'</div>'+
      '<div style="margin-top:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px">'+s.formula+'</div>'+
      '<div style="margin-top:8px;font-size:12px;opacity:.75">Step '+(derivationState.step+1)+' / '+steps.length+'</div>';
    const prev=$('pvDerivePrev'), next=$('pvDeriveNext');
    if(prev) prev.disabled=derivationState.step<=0;
    if(next) next.disabled=derivationState.step>=steps.length-1;
    syncDerivationVisuals();
  }

  function stepInclineDerivation(delta){
    const steps=inclineDerivationSteps();
    derivationState.step=clamp(derivationState.step+delta,0,steps.length-1);
    renderInclineDerivation();
  }

  function resetInclineDerivation(){
    derivationState.step=0;
    renderInclineDerivation();
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
          <div class="field"><label>選択斜面の角度</label>
            <input id="pvSlopeAngleRange" type="range" min="5" max="80" step="1" value="30">
            <input id="pvSlopeAngle" type="number" min="5" max="80" step="1" value="30">
          </div>
          <div class="field"><label>質量 m (kg)</label><input id="pvMassKg" type="number" min="0" step="0.1" value="1"></div>
          <button class="btn" id="pvApplySlope">角度を適用</button>
        </div>
        <div id="pvSkillReadout" class="physics-note">Physics Skill Stack: 斜面を選択して角度を適用すると、モデル・検証・予測問題を表示します。</div>
        <div class="physics-inline">
          <button class="btn primary" id="pvAutoInclineVectors">⚙ モデルから分力を描画</button>
          <button class="btn small" id="pvClearAutoInclineVectors">自動分力を消す</button>
        </div>
        <details open>
          <summary style="font-weight:800;cursor:pointer">🧭 Derivation View</summary>
          <div id="pvDerivation" class="physics-note" style="margin-top:8px">導出を準備しています。</div>
          <div class="physics-inline" style="margin-top:8px">
            <button class="btn small" id="pvDerivePrev">← 前</button>
            <button class="btn small" id="pvDeriveReset">最初から</button>
            <button class="btn small" id="pvDeriveNext">次 →</button>
          </div>
        </details>
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
    $('pvAutoInclineVectors').onclick=addAutoInclineVectors;
    $('pvClearAutoInclineVectors').onclick=removeAutoInclineVectors;
    $('pvDerivePrev').onclick=()=>stepInclineDerivation(-1);
    $('pvDeriveNext').onclick=()=>stepInclineDerivation(1);
    $('pvDeriveReset').onclick=resetInclineDerivation;

    const syncAngleControls=(value)=>{
      const angle=clamp(+value||30,5,80);
      $('pvSlopeAngle').value=angle;
      $('pvSlopeAngleRange').value=angle;
      return angle;
    };

    $('pvSlopeAngleRange').oninput=(e)=>{
      syncAngleControls(e.target.value);
      refreshSelectedInclineFromControls({redrawVectors:false,quiet:true});
      renderInclineDerivation();
      renderInclineDerivation();
    };

    $('pvSlopeAngle').oninput=(e)=>{
      syncAngleControls(e.target.value);
      refreshSelectedInclineFromControls({redrawVectors:false,quiet:true});
    };

    $('pvMassKg').oninput=()=>{
      updateInclineSkillReadout(clamp(+($('pvSlopeAngle')?.value||30),5,80));
      renderInclineDerivation();
    };
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
    renderInclineDerivation();
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
