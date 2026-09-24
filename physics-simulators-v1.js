/* Teaching OS — Physics Simulators v1 */
(() => {
  'use strict';

  const VERSION='v1.0 Physics Simulators';
  const $=id=>document.getElementById(id);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const uid=(p='sim')=>p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);

  const state={
    active:null,
    running:false,
    startTime:0,
    elapsed:0,
    raf:0
  };

  function api(){ return window.TeachingOSPhysicsSkills || null; }
  function svgData(svg){ return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); }

  function activeItem(){
    if(!state.active) return null;
    return items.find(it=>it.id===state.active.itemId) || null;
  }

  function makeSvg(body,w=640,h=360){
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      <rect width="100%" height="100%" fill="#f8fafc"/>
      ${body}
    </svg>`;
  }

  function renderKinematics(p,t){
    const model=api().deriveKinematics({x0:p.x0,v0:p.v0,a:p.a,t});
    const x=model.quantities.x, v=model.quantities.v;
    const px=70+clamp((x+20)/40,0,1)*500;
    return makeSvg(`
      <line x1="55" y1="245" x2="585" y2="245" stroke="#334155" stroke-width="4"/>
      <rect x="${px-28}" y="190" width="56" height="40" rx="8" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>
      <circle cx="${px-17}" cy="238" r="10" fill="#fff" stroke="#334155" stroke-width="3"/>
      <circle cx="${px+17}" cy="238" r="10" fill="#fff" stroke="#334155" stroke-width="3"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">等加速度運動</text>
      <text x="40" y="85" font-size="20" font-family="sans-serif">t = ${t.toFixed(2)} s</text>
      <text x="40" y="115" font-size="20" font-family="sans-serif">x = ${x.toFixed(2)} m</text>
      <text x="40" y="145" font-size="20" font-family="sans-serif">v = ${v.toFixed(2)} m/s</text>
      <text x="40" y="175" font-size="20" font-family="sans-serif">a = ${p.a.toFixed(2)} m/s²</text>
    `);
  }

  function renderProjectile(p,t){
    const m=api().deriveProjectile({speed:p.speed,angleDeg:p.angle,height0:p.height0,gravity:p.g,t});
    const q=m.quantities;
    const tf=q.flightTime;
    const xmax=Math.max(1,api().deriveProjectile({speed:p.speed,angleDeg:p.angle,height0:p.height0,gravity:p.g,t:tf}).quantities.x);
    const ymax=Math.max(2,p.height0+p.speed*p.speed*Math.sin(p.angle*Math.PI/180)**2/(2*p.g));
    const px=70+clamp(q.x/xmax,0,1)*500;
    const py=290-clamp(Math.max(0,q.y)/ymax,0,1)*220;
    return makeSvg(`
      <line x1="55" y1="290" x2="590" y2="290" stroke="#334155" stroke-width="4"/>
      <circle cx="${px}" cy="${py}" r="12" fill="#475569"/>
      <line x1="${px}" y1="${py}" x2="${px+q.vx*4}" y2="${py-q.vy*4}" stroke="#64748b" stroke-width="4"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">投射運動</text>
      <text x="40" y="80" font-size="18" font-family="sans-serif">t = ${t.toFixed(2)} s</text>
      <text x="40" y="108" font-size="18" font-family="sans-serif">x = ${q.x.toFixed(2)} m</text>
      <text x="40" y="136" font-size="18" font-family="sans-serif">y = ${q.y.toFixed(2)} m</text>
      <text x="40" y="164" font-size="18" font-family="sans-serif">vx = ${q.vx.toFixed(2)} m/s</text>
      <text x="40" y="192" font-size="18" font-family="sans-serif">vy = ${q.vy.toFixed(2)} m/s</text>
    `);
  }

  function renderSpring(p,t){
    const m=api().deriveSpring({massKg:p.mass,springConstant:p.k,amplitude:p.A,t});
    const q=m.quantities;
    const cx=330+clamp(q.x/Math.max(p.A,0.001),-1,1)*180;
    return makeSvg(`
      <line x1="60" y1="100" x2="60" y2="260" stroke="#334155" stroke-width="7"/>
      <path d="M60 180 L95 180 ${Array.from({length:8},(_,i)=>{
        const x1=95+i*(cx-135)/8;
        const x2=95+(i+1)*(cx-135)/8;
        const y1=i%2?155:205;
        const y2=(i+1)%2?155:205;
        return 'L'+x1.toFixed(1)+' '+y1+' L'+x2.toFixed(1)+' '+y2;
      }).join(' ')} L${cx-40} 180" fill="none" stroke="#64748b" stroke-width="4"/>
      <rect x="${cx-40}" y="145" width="80" height="70" rx="8" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">ばね振動</text>
      <text x="40" y="80" font-size="18" font-family="sans-serif">x = ${q.x.toFixed(3)} m</text>
      <text x="40" y="108" font-size="18" font-family="sans-serif">v = ${q.v.toFixed(3)} m/s</text>
      <text x="40" y="136" font-size="18" font-family="sans-serif">T = ${q.period.toFixed(3)} s</text>
    `);
  }

  function renderCircular(p,t){
    const m=api().deriveCircular({radius:p.r,speed:p.v,t});
    const q=m.quantities;
    const cx=350, cy=190, R=110;
    const px=cx+R*Math.cos(q.theta), py=cy-R*Math.sin(q.theta);
    return makeSvg(`
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#94a3b8" stroke-width="4"/>
      <circle cx="${px}" cy="${py}" r="13" fill="#475569"/>
      <line x1="${px}" y1="${py}" x2="${cx}" y2="${cy}" stroke="#64748b" stroke-width="4"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">等速円運動</text>
      <text x="40" y="80" font-size="18" font-family="sans-serif">ω = ${q.omega.toFixed(3)} rad/s</text>
      <text x="40" y="108" font-size="18" font-family="sans-serif">a₍c₎ = ${q.centripetalAcceleration.toFixed(3)} m/s²</text>
      <text x="40" y="136" font-size="18" font-family="sans-serif">r = ${p.r.toFixed(2)} m</text>
      <text x="40" y="164" font-size="18" font-family="sans-serif">v = ${p.v.toFixed(2)} m/s</text>
    `);
  }

  const defs={
    kinematics:{
      name:'等加速度運動',
      duration:p=>8,
      defaults:{x0:0,v0:0,a:2},
      render:renderKinematics,
      verify:(p,t)=>api().verificationSummary(api().verifyKinematics(api().deriveKinematics({...p,t})))
    },
    projectile:{
      name:'投射運動',
      duration:p=>api().deriveProjectile({speed:p.speed,angleDeg:p.angle,height0:p.height0,gravity:p.g,t:0}).quantities.flightTime,
      defaults:{speed:20,angle:45,height0:0,g:9.8},
      render:renderProjectile,
      verify:(p,t)=>api().verificationSummary(api().verifyProjectile(api().deriveProjectile({speed:p.speed,angleDeg:p.angle,height0:p.height0,gravity:p.g,t})))
    },
    spring:{
      name:'ばね振動',
      duration:p=>api().deriveSpring({massKg:p.mass,springConstant:p.k,amplitude:p.A,t:0}).quantities.period*3,
      defaults:{mass:1,k:10,A:0.2},
      render:renderSpring,
      verify:(p,t)=>api().verificationSummary(api().verifySpring(api().deriveSpring({massKg:p.mass,springConstant:p.k,amplitude:p.A,t})))
    },
    circular:{
      name:'等速円運動',
      duration:p=>{
        const d=api().deriveCircular({radius:p.r,speed:p.v,t:0}).quantities.period;
        return Number.isFinite(d)?d*2:8;
      },
      defaults:{r:1,v:2},
      render:renderCircular,
      verify:(p,t)=>api().verificationSummary(api().verifyCircular(api().deriveCircular({radius:p.r,speed:p.v,t})))
    }
  };

  function paramsFromPanel(type){
    if(type==='kinematics') return {
      x0:+$('psX0').value||0,v0:+$('psV0').value||0,a:+$('psA').value||0
    };
    if(type==='projectile') return {
      speed:Math.max(0,+$('psSpeed').value||0),angle:clamp(+$('psAngle').value||0,-89,89),height0:+$('psH0').value||0,g:Math.max(.1,+$('psG').value||9.8)
    };
    if(type==='spring') return {
      mass:Math.max(.01,+$('psMass').value||1),k:Math.max(.01,+$('psK').value||10),A:Math.max(0,+$('psAmp').value||0)
    };
    return {
      r:Math.max(.01,+$('psRadius').value||1),v:Math.max(0,+$('psCircV').value||0)
    };
  }

  function renderActive(){
    const a=state.active; if(!a) return;
    const it=activeItem(); if(!it) return;
    const def=defs[a.type];
    const duration=Math.max(.2,def.duration(a.params));
    const t=clamp(state.elapsed,0,duration);
    it.src=svgData(def.render(a.params,t));
    it.physicsSimulation={type:a.type,params:{...a.params},t};
    renderAll(); saveState();
    const summary=def.verify(a.params,t);
    const status=$('psStatus');
    if(status) status.textContent=`${def.name} / t=${t.toFixed(2)} s / Verification: ${summary.result}`;
  }

  function frame(ts){
    if(!state.running) return;
    if(!state.startTime) state.startTime=ts-state.elapsed*1000;
    state.elapsed=(ts-state.startTime)/1000;
    const def=defs[state.active.type];
    const d=def.duration(state.active.params);
    if(state.elapsed>=d){
      state.elapsed=d; state.running=false; state.raf=0; renderActive(); updateButtons(); return;
    }
    renderActive();
    state.raf=requestAnimationFrame(frame);
  }

  function updateButtons(){
    const b=$('psPlay');
    if(b) b.textContent=state.running?'⏸ 一時停止':'▶ 再生';
  }

  function playPause(){
    if(!state.active){ return; }
    state.running=!state.running;
    if(state.running){
      state.startTime=performance.now()-state.elapsed*1000;
      state.raf=requestAnimationFrame(frame);
    } else if(state.raf){
      cancelAnimationFrame(state.raf); state.raf=0;
    }
    updateButtons();
  }

  function reset(){
    state.running=false;
    if(state.raf) cancelAnimationFrame(state.raf);
    state.raf=0; state.elapsed=0; state.startTime=0;
    renderActive(); updateButtons();
  }

  function addSimulator(type){
    const def=defs[type]; if(!def||!api()) return;
    const p=paramsFromPanel(type);
    const it={
      id:uid(),type:'image',src:svgData(def.render(p,0)),caption:def.name,
      x:180,y:150,w:640,h:360,step:Math.max(0,currentStep||0),z:++zCounter,
      physicsKind:'simulator:'+type,
      physicsSimulation:{type,params:{...p},t:0}
    };
    items.push(it); selectedId=it.id;
    state.active={type,itemId:it.id,params:p};
    state.elapsed=0; state.startTime=0; state.running=false;
    renderAll(); saveState(); renderActive(); updateButtons();
  }

  function updateActiveParams(){
    if(!state.active) return;
    state.active.params=paramsFromPanel(state.active.type);
    state.elapsed=0; state.startTime=0;
    renderActive();
  }

  function showFields(type){
    document.querySelectorAll('[data-sim-fields]').forEach(el=>el.hidden=el.dataset.simFields!==type);
  }

  function buildPanel(){
    if($('physicsSimulatorsPanel')) return;
    const host=$('physicsLibraryPanel')||$('physicsVectorToolsPanel')||$('physicsPartsPanel');
    if(!host) return;
    const panel=document.createElement('section');
    panel.className='panel'; panel.id='physicsSimulatorsPanel';
    panel.innerHTML=`
      <h2>🧪 Physics Simulators</h2>
      <div class="physics-note">Physics Modelから描画する授業用シミュレーター。数式モデルと表示を分離しています。</div>
      <div class="field"><label>シミュレーター</label>
        <select id="psType">
          <option value="kinematics">等加速度運動</option>
          <option value="projectile">投射運動</option>
          <option value="spring">ばね振動</option>
          <option value="circular">等速円運動</option>
        </select>
      </div>

      <div data-sim-fields="kinematics" class="col">
        <div class="physics-inline"><div class="field"><label>x₀ (m)</label><input id="psX0" type="number" value="0" step="0.5"></div>
        <div class="field"><label>v₀ (m/s)</label><input id="psV0" type="number" value="0" step="0.5"></div>
        <div class="field"><label>a (m/s²)</label><input id="psA" type="number" value="2" step="0.5"></div></div>
      </div>

      <div data-sim-fields="projectile" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>速さ (m/s)</label><input id="psSpeed" type="number" value="20" step="1"></div>
        <div class="field"><label>角度 (°)</label><input id="psAngle" type="number" value="45" step="1"></div></div>
        <div class="physics-inline"><div class="field"><label>初期高さ (m)</label><input id="psH0" type="number" value="0" step="0.5"></div>
        <div class="field"><label>g (m/s²)</label><input id="psG" type="number" value="9.8" step="0.1"></div></div>
      </div>

      <div data-sim-fields="spring" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>m (kg)</label><input id="psMass" type="number" value="1" step="0.1"></div>
        <div class="field"><label>k (N/m)</label><input id="psK" type="number" value="10" step="1"></div>
        <div class="field"><label>A (m)</label><input id="psAmp" type="number" value="0.2" step="0.05"></div></div>
      </div>

      <div data-sim-fields="circular" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>r (m)</label><input id="psRadius" type="number" value="1" step="0.1"></div>
        <div class="field"><label>v (m/s)</label><input id="psCircV" type="number" value="2" step="0.2"></div></div>
      </div>

      <div class="physics-inline" style="margin-top:8px">
        <button class="btn primary" id="psAdd">Student Viewへ追加</button>
        <button class="btn" id="psPlay">▶ 再生</button>
        <button class="btn small" id="psReset">↺ リセット</button>
      </div>
      <div id="psStatus" class="status">シミュレーターを選んで追加してください。</div>
    `;
    host.insertAdjacentElement('afterend',panel);

    $('psType').onchange=e=>showFields(e.target.value);
    $('psAdd').onclick=()=>addSimulator($('psType').value);
    $('psPlay').onclick=playPause;
    $('psReset').onclick=reset;
    panel.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',updateActiveParams));
    showFields($('psType').value);
  }

  function boot(){
    buildPanel();
    const ver=document.querySelector('.version');
    if(ver) ver.textContent=VERSION;
    console.info('[Teaching OS] Physics Simulators ready');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();