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


  function renderCollision(p,t){
    const m=api().deriveCollision({m1:p.m1,m2:p.m2,u1:p.u1,u2:p.u2,restitution:p.e});
    const q=m.quantities;
    const hitTime=1.6;
    const before=t<hitTime;
    const dt=before?t:t-hitTime;
    const x1=before?180+p.u1*40*t:260+q.v1*40*dt;
    const x2=before?430+p.u2*40*t:350+q.v2*40*dt;
    return makeSvg(`
      <line x1="60" y1="245" x2="590" y2="245" stroke="#334155" stroke-width="4"/>
      <rect x="${clamp(x1,70,540)-35}" y="190" width="70" height="45" rx="8" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>
      <rect x="${clamp(x2,100,570)-35}" y="190" width="70" height="45" rx="8" fill="#e2e8f0" stroke="#334155" stroke-width="3"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">1次元衝突</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">e = ${p.e.toFixed(2)}</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">v₁ = ${q.v1.toFixed(2)} m/s</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">v₂ = ${q.v2.toFixed(2)} m/s</text>
      <text x="40" y="166" font-size="18" font-family="sans-serif">p(before)=${q.pBefore.toFixed(2)}, p(after)=${q.pAfter.toFixed(2)}</text>
    `);
  }

  function renderPendulum(p,t){
    const m=api().derivePendulum({length:p.L,gravity:p.g,amplitudeDeg:p.amp,t});
    const q=m.quantities;
    const ox=350, oy=70, scale=150/Math.max(p.L,.1);
    const Lpx=Math.min(190,p.L*scale);
    const bx=ox+Lpx*Math.sin(q.theta);
    const by=oy+Lpx*Math.cos(q.theta);
    return makeSvg(`
      <circle cx="${ox}" cy="${oy}" r="6" fill="#334155"/>
      <line x1="${ox}" y1="${oy}" x2="${bx}" y2="${by}" stroke="#64748b" stroke-width="4"/>
      <circle cx="${bx}" cy="${by}" r="18" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>
      <line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy+190}" stroke="#94a3b8" stroke-dasharray="8 8" stroke-width="2"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">単振り子（小振幅）</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">θ = ${(q.theta*180/Math.PI).toFixed(2)}°</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">T = ${q.period.toFixed(3)} s</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">ω = ${q.omega.toFixed(3)} rad/s</text>
    `);
  }

  function renderWave(p,t){
    const pts=[];
    for(let i=0;i<=100;i++){
      const x=i/100*10;
      const y=api().deriveWave({amplitude:p.A,wavelength:p.lambda,frequency:p.f,x,t}).quantities.y;
      const px=60+i/100*520;
      const py=190-y*70/Math.max(p.A,.01);
      pts.push((i?'L':'M')+px.toFixed(1)+' '+py.toFixed(1));
    }
    return makeSvg(`
      <line x1="55" y1="190" x2="590" y2="190" stroke="#94a3b8" stroke-width="2"/>
      <path d="${pts.join(' ')}" fill="none" stroke="#475569" stroke-width="4"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">正弦進行波</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">λ = ${p.lambda.toFixed(2)} m</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">f = ${p.f.toFixed(2)} Hz</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">v = ${(p.f*p.lambda).toFixed(2)} m/s</text>
    `);
  }

  function renderElectricField(p,t){
    const m=api().deriveElectricField({sourceChargeMicroC:p.Q,testX:p.x,testY:p.y});
    const q=m.quantities;
    const cx=320, cy=190;
    const tx=cx+p.x*70, ty=cy-p.y*70;
    const dirX=q.magnitude>0?q.ex/q.magnitude:0;
    const dirY=q.magnitude>0?q.ey/q.magnitude:0;
    const ex=tx+dirX*80, ey=ty-dirY*80;
    return makeSvg(`
      <circle cx="${cx}" cy="${cy}" r="24" fill="#e2e8f0" stroke="#334155" stroke-width="3"/>
      <text x="${cx}" y="${cy+7}" text-anchor="middle" font-size="24" font-family="sans-serif">${p.Q>=0?'+':'−'}</text>
      <circle cx="${tx}" cy="${ty}" r="9" fill="#475569"/>
      <line x1="${tx}" y1="${ty}" x2="${ex}" y2="${ey}" stroke="#64748b" stroke-width="4"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">点電荷の電場・電位</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">r = ${q.r.toFixed(2)} m</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">|E| = ${q.magnitude.toExponential(3)} N/C</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">V = ${q.potential.toExponential(3)} V</text>
    `);
  }


  function renderFriction(p,t){
    const m=api().deriveFriction({massKg:p.m,forceN:p.F,muS:p.muS,muK:p.muK,gravity:p.g});
    const q=m.quantities;
    const x=180+clamp(q.acceleration*t*t*18,-80,260);
    return makeSvg(`
      <line x1="60" y1="250" x2="590" y2="250" stroke="#334155" stroke-width="4"/>
      <rect x="${x}" y="190" width="85" height="55" rx="8" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>
      <line x1="${x+42}" y1="185" x2="${x+42+clamp(p.F*10,-120,120)}" y2="185" stroke="#475569" stroke-width="4"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">摩擦</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">F = ${p.F.toFixed(2)} N</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">f = ${q.frictionN.toFixed(2)} N</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">a = ${q.acceleration.toFixed(2)} m/s²</text>
      <text x="40" y="166" font-size="18" font-family="sans-serif">${q.moving?'動摩擦':'静止摩擦'}</text>
    `);
  }

  function renderAtwood(p,t){
    const m=api().deriveAtwood({m1:p.m1,m2:p.m2,gravity:p.g});
    const q=m.quantities;
    const dy=clamp(q.acceleration*t*t*18,-90,90);
    return makeSvg(`
      <circle cx="320" cy="95" r="42" fill="none" stroke="#334155" stroke-width="4"/>
      <line x1="278" y1="95" x2="278" y2="${210+dy}" stroke="#64748b" stroke-width="4"/>
      <line x1="362" y1="95" x2="362" y2="${210-dy}" stroke="#64748b" stroke-width="4"/>
      <rect x="240" y="${210+dy}" width="76" height="58" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>
      <rect x="324" y="${210-dy}" width="76" height="58" fill="#e2e8f0" stroke="#334155" stroke-width="3"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">アトウッドの装置</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">a = ${q.acceleration.toFixed(3)} m/s²</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">T = ${q.tensionN.toFixed(3)} N</text>
    `);
  }

  function renderEnergy(p,t){
    const frac=(Math.sin(t)+1)/2;
    const h=p.h*(1-frac);
    const m=api().deriveEnergyTrack({massKg:p.m,height:p.h,speed0:p.v0,gravity:p.g,heightAt:h});
    const q=m.quantities;
    const px=120+frac*420, py=260-h/Math.max(p.h,.01)*150;
    return makeSvg(`
      <path d="M90 100 Q320 310 560 260" fill="none" stroke="#64748b" stroke-width="5"/>
      <circle cx="${px}" cy="${py}" r="15" fill="#475569"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">力学的エネルギー</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">K = ${q.kineticEnergy.toFixed(2)} J</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">U = ${q.potentialEnergy.toFixed(2)} J</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">E = ${q.totalEnergy.toFixed(2)} J</text>
      <text x="40" y="166" font-size="18" font-family="sans-serif">v = ${q.speed.toFixed(2)} m/s</text>
    `);
  }

  function renderStandingWave(p,t){
    const m=api().deriveStandingWave({length:p.L,harmonic:p.n,waveSpeed:p.v});
    const q=m.quantities;
    const pts=[];
    for(let i=0;i<=120;i++){
      const x=i/120;
      const y=Math.sin(p.n*Math.PI*x)*Math.cos(2*Math.PI*q.frequency*t)*70;
      const px=70+x*500, py=190-y;
      pts.push((i?'L':'M')+px.toFixed(1)+' '+py.toFixed(1));
    }
    return makeSvg(`
      <line x1="70" y1="190" x2="570" y2="190" stroke="#94a3b8" stroke-width="2"/>
      <path d="${pts.join(' ')}" fill="none" stroke="#475569" stroke-width="4"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">両端固定弦の定常波</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">n = ${p.n}</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">λ = ${q.wavelength.toFixed(3)} m</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">f = ${q.frequency.toFixed(3)} Hz</text>
    `);
  }

  function renderDCCircuit(p,t){
    const m=api().deriveDCCircuit({voltage:p.V,r1:p.R1,r2:p.R2,mode:p.mode});
    const q=m.quantities;
    return makeSvg(`
      <text x="40" y="45" font-size="24" font-family="sans-serif">直流回路（${p.mode==='parallel'?'並列':'直列'}）</text>
      <rect x="110" y="115" width="110" height="45" fill="#e2e8f0" stroke="#334155" stroke-width="3"/>
      <rect x="420" y="115" width="110" height="45" fill="#e2e8f0" stroke="#334155" stroke-width="3"/>
      <line x1="80" y1="138" x2="110" y2="138" stroke="#334155" stroke-width="4"/>
      <line x1="220" y1="138" x2="420" y2="138" stroke="#334155" stroke-width="4"/>
      <line x1="530" y1="138" x2="560" y2="138" stroke="#334155" stroke-width="4"/>
      <text x="40" y="210" font-size="18" font-family="sans-serif">Req = ${q.equivalentResistance.toFixed(2)} Ω</text>
      <text x="40" y="238" font-size="18" font-family="sans-serif">I = ${q.totalCurrent.toFixed(3)} A</text>
      <text x="40" y="266" font-size="18" font-family="sans-serif">V₁ = ${q.v1.toFixed(2)} V, V₂ = ${q.v2.toFixed(2)} V</text>
    `);
  }

  function renderCapacitor(p,t){
    const m=api().deriveCapacitor({capacitanceMicroF:p.C,voltage:p.V,resistanceOhm:p.R,t,mode:p.mode});
    const q=m.quantities;
    const fill=clamp(q.capacitorVoltage/Math.max(p.V,.0001),0,1);
    return makeSvg(`
      <text x="40" y="45" font-size="24" font-family="sans-serif">RC ${p.mode==='discharge'?'放電':'充電'}</text>
      <line x1="260" y1="100" x2="260" y2="270" stroke="#334155" stroke-width="6"/>
      <line x1="330" y1="100" x2="330" y2="270" stroke="#334155" stroke-width="6"/>
      <rect x="265" y="${260-fill*150}" width="60" height="${fill*150}" fill="#cbd5e1"/>
      <text x="40" y="100" font-size="18" font-family="sans-serif">τ = ${q.timeConstant.toFixed(4)} s</text>
      <text x="40" y="128" font-size="18" font-family="sans-serif">Vc = ${q.capacitorVoltage.toFixed(3)} V</text>
      <text x="40" y="156" font-size="18" font-family="sans-serif">I = ${q.current.toExponential(3)} A</text>
      <text x="40" y="184" font-size="18" font-family="sans-serif">Q = ${q.charge.toExponential(3)} C</text>
    `);
  }


  function renderIdealGas(p,t){
    const m=api().deriveIdealGas({pressureKPa:p.P,volumeL:p.V,amountMol:p.n,temperatureK:p.T});
    const q=m.quantities;
    const pistonX=200+clamp(p.V/20,0.1,1)*300;
    return makeSvg(`
      <rect x="180" y="110" width="340" height="140" fill="none" stroke="#334155" stroke-width="4"/>
      <rect x="${pistonX}" y="105" width="16" height="150" fill="#94a3b8"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">理想気体</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">P = ${p.P.toFixed(1)} kPa</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">V = ${p.V.toFixed(2)} L</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">T = ${p.T.toFixed(1)} K</text>
      <text x="40" y="166" font-size="18" font-family="sans-serif">PV = ${q.pv.toFixed(2)} J</text>
      <text x="40" y="194" font-size="18" font-family="sans-serif">nRT = ${q.nrt.toFixed(2)} J</text>
    `);
  }

  function renderFaraday(p,t){
    const b=p.B0+(p.B1-p.B0)*clamp(t/Math.max(p.dt,.001),0,1);
    const m=api().deriveFaraday({turns:p.N,areaM2:p.A,b0T:p.B0,b1T:p.B1,dt:p.dt});
    const q=m.quantities;
    return makeSvg(`
      <ellipse cx="360" cy="190" rx="110" ry="70" fill="none" stroke="#334155" stroke-width="5"/>
      <text x="360" y="195" text-anchor="middle" font-size="24" font-family="sans-serif">coil × ${p.N}</text>
      <text x="40" y="45" font-size="24" font-family="sans-serif">電磁誘導</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">B(t) = ${b.toFixed(3)} T</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">ΔΦ = ${q.deltaPhi.toExponential(3)} Wb</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">ε = ${q.emf.toFixed(3)} V</text>
    `);
  }

  function renderThinLens(p,t){
    const m=api().deriveThinLens({focalLengthCm:p.f,objectDistanceCm:p.u});
    const q=m.quantities;
    const lensX=320, axisY=190;
    const objectX=lensX-clamp(Math.abs(p.u)*3,70,230);
    const v=q.imageDistanceCm;
    const imageX=Number.isFinite(v)?lensX+clamp(v*3,-230,230):580;
    const objH=70;
    const imgH=Number.isFinite(q.magnification)?objH*q.magnification:0;
    return makeSvg(`
      <line x1="50" y1="${axisY}" x2="590" y2="${axisY}" stroke="#94a3b8" stroke-width="2"/>
      <line x1="${lensX}" y1="70" x2="${lensX}" y2="310" stroke="#334155" stroke-width="5"/>
      <line x1="${objectX}" y1="${axisY}" x2="${objectX}" y2="${axisY-objH}" stroke="#475569" stroke-width="5"/>
      ${Number.isFinite(v)?`<line x1="${imageX}" y1="${axisY}" x2="${imageX}" y2="${axisY-imgH}" stroke="#64748b" stroke-width="5"/>`:''}
      <text x="40" y="45" font-size="24" font-family="sans-serif">薄レンズ</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">f = ${p.f.toFixed(1)} cm</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">u = ${p.u.toFixed(1)} cm</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">v = ${Number.isFinite(v)?v.toFixed(2):'∞'} cm</text>
      <text x="40" y="166" font-size="18" font-family="sans-serif">m = ${Number.isFinite(q.magnification)?q.magnification.toFixed(3):'∞'}</text>
    `);
  }

  function renderPhotoelectric(p,t){
    const m=api().derivePhotoelectric({frequencyHz:p.f,workFunctionEV:p.W});
    const q=m.quantities;
    return makeSvg(`
      <rect x="360" y="120" width="170" height="120" fill="#e2e8f0" stroke="#334155" stroke-width="3"/>
      <line x1="120" y1="150" x2="350" y2="175" stroke="#64748b" stroke-width="6"/>
      ${q.emitted?'<circle cx="550" cy="180" r="9" fill="#475569"/>':''}
      <text x="40" y="45" font-size="24" font-family="sans-serif">光電効果</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">hf = ${q.photonEV.toFixed(3)} eV</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">W = ${p.W.toFixed(3)} eV</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">Kmax = ${q.maxKEEV.toFixed(3)} eV</text>
      <text x="40" y="166" font-size="18" font-family="sans-serif">${q.emitted?'電子放出あり':'しきい値未満'}</text>
    `);
  }


  function renderInclineFriction(p,t){
    const m=api().deriveInclineFriction({massKg:p.m,angleDeg:p.angle,muS:p.muS,muK:p.muK,gravity:p.g,appliedAlongSlopeN:p.F});
    const q=m.quantities;
    const rad=p.angle*Math.PI/180;
    const ox=130, oy=275, len=360;
    const x2=ox+len*Math.cos(rad), y2=oy-len*Math.sin(rad);
    const s=clamp((q.acceleration*t*t)*10,-80,160);
    const bx=ox+180*Math.cos(rad)+s*Math.cos(rad);
    const by=oy-180*Math.sin(rad)-s*Math.sin(rad);
    return makeSvg(`
      <line x1="${ox}" y1="${oy}" x2="${x2}" y2="${y2}" stroke="#334155" stroke-width="6"/>
      <rect x="${bx-35}" y="${by-28}" width="70" height="55" rx="8" fill="#cbd5e1" stroke="#334155" stroke-width="3" transform="rotate(${-p.angle} ${bx} ${by})"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">斜面＋摩擦</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">mg sinθ = ${q.parallelN.toFixed(2)} N</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">f = ${q.frictionN.toFixed(2)} N</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">a = ${q.acceleration.toFixed(2)} m/s²</text>
      <text x="40" y="166" font-size="18" font-family="sans-serif">${q.moving?'運動':'静止'}</text>
    `);
  }

  function renderTwoBlock(p,t){
    const m=api().deriveTwoBlock({m1:p.m1,m2:p.m2,forceN:p.F,mu:p.mu,gravity:p.g});
    const q=m.quantities;
    const shift=clamp(.5*q.acceleration*t*t*28,-100,180);
    return makeSvg(`
      <line x1="60" y1="255" x2="590" y2="255" stroke="#334155" stroke-width="4"/>
      <rect x="${160+shift}" y="195" width="90" height="55" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>
      <rect x="${330+shift}" y="195" width="90" height="55" fill="#e2e8f0" stroke="#334155" stroke-width="3"/>
      <line x1="${250+shift}" y1="222" x2="${330+shift}" y2="222" stroke="#64748b" stroke-width="4"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">2物体連結系</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">a = ${q.acceleration.toFixed(3)} m/s²</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">T = ${q.tensionN.toFixed(3)} N</text>
    `);
  }

  function renderVerticalCircle(p,t){
    const angle=(p.omegaDeg*t)%360;
    const m=api().deriveVerticalCircle({radius:p.r,speedBottom:p.v0,massKg:p.m,gravity:p.g,angleDeg:angle});
    const q=m.quantities;
    const cx=360,cy=190,R=110;
    const th=angle*Math.PI/180;
    const px=cx+R*Math.sin(th),py=cy+R*Math.cos(th);
    return makeSvg(`
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#94a3b8" stroke-width="4"/>
      <circle cx="${px}" cy="${py}" r="13" fill="#475569"/>
      <line x1="${px}" y1="${py}" x2="${cx}" y2="${cy}" stroke="#64748b" stroke-width="3"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">鉛直円運動</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">v = ${q.speed.toFixed(2)} m/s</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">Tension = ${q.tensionN.toFixed(2)} N</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">${q.contactMaintained?'接触維持':'接触条件を満たさない'}</text>
    `);
  }

  function renderImpulse(p,t){
    const tt=Math.min(t,p.dt);
    const m=api().deriveImpulse({massKg:p.m,initialVelocity:p.u,forceN:p.F,durationS:tt});
    const q=m.quantities;
    const px=100+clamp(q.finalVelocity*t*18,-20,430);
    return makeSvg(`
      <line x1="60" y1="250" x2="590" y2="250" stroke="#334155" stroke-width="4"/>
      <rect x="${px}" y="195" width="80" height="50" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">力積・運動量</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">J = ${q.impulseNs.toFixed(2)} N·s</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">Δp = ${q.deltaMomentum.toFixed(2)} kg·m/s</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">v = ${q.finalVelocity.toFixed(2)} m/s</text>
    `);
  }

  function renderSHMEnergy(p,t){
    const x=p.A*Math.cos(t*2);
    const m=api().deriveSHMEnergy({massKg:p.m,springConstant:p.k,amplitude:p.A,position:x});
    const q=m.quantities;
    const bx=330+clamp(x/Math.max(p.A,.001),-1,1)*180;
    const maxE=Math.max(q.totalEnergy,.0001);
    return makeSvg(`
      <line x1="70" y1="180" x2="${bx-40}" y2="180" stroke="#64748b" stroke-width="4"/>
      <rect x="${bx-40}" y="145" width="80" height="70" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>
      <rect x="70" y="285" width="${220*q.kineticEnergy/maxE}" height="18" fill="#94a3b8"/>
      <rect x="320" y="285" width="${220*q.potentialEnergy/maxE}" height="18" fill="#cbd5e1"/>
      <text x="40" y="45" font-size="24" font-family="sans-serif">単振動：エネルギー</text>
      <text x="40" y="82" font-size="18" font-family="sans-serif">K = ${q.kineticEnergy.toFixed(3)} J</text>
      <text x="40" y="110" font-size="18" font-family="sans-serif">U = ${q.potentialEnergy.toFixed(3)} J</text>
      <text x="40" y="138" font-size="18" font-family="sans-serif">E = ${q.totalEnergy.toFixed(3)} J</text>
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
    },
    collision:{
      name:'1次元衝突',
      duration:p=>4,
      defaults:{m1:1,m2:1,u1:2,u2:0,e:1},
      render:renderCollision,
      verify:(p,t)=>api().verificationSummary(api().verifyCollision(api().deriveCollision({m1:p.m1,m2:p.m2,u1:p.u1,u2:p.u2,restitution:p.e})))
    },
    pendulum:{
      name:'単振り子',
      duration:p=>api().derivePendulum({length:p.L,gravity:p.g,amplitudeDeg:p.amp,t:0}).quantities.period*3,
      defaults:{L:1,g:9.8,amp:10},
      render:renderPendulum,
      verify:(p,t)=>api().verificationSummary(api().verifyPendulum(api().derivePendulum({length:p.L,gravity:p.g,amplitudeDeg:p.amp,t})))
    },
    wave:{
      name:'正弦進行波',
      duration:p=>6,
      defaults:{A:1,lambda:2,f:1},
      render:renderWave,
      verify:(p,t)=>api().verificationSummary(api().verifyWave(api().deriveWave({amplitude:p.A,wavelength:p.lambda,frequency:p.f,x:0,t})))
    },
    electric:{
      name:'電場・電位',
      duration:p=>1,
      defaults:{Q:1,x:1,y:0},
      render:renderElectricField,
      verify:(p,t)=>api().verificationSummary(api().verifyElectricField(api().deriveElectricField({sourceChargeMicroC:p.Q,testX:p.x,testY:p.y})))
    },
    friction:{
      name:'摩擦',
      duration:p=>5,
      defaults:{m:1,F:5,muS:.4,muK:.3,g:9.8},
      render:renderFriction,
      verify:(p,t)=>api().verificationSummary(api().verifyFriction(api().deriveFriction({massKg:p.m,forceN:p.F,muS:p.muS,muK:p.muK,gravity:p.g})))
    },
    atwood:{
      name:'連結体・滑車',
      duration:p=>5,
      defaults:{m1:2,m2:1,g:9.8},
      render:renderAtwood,
      verify:(p,t)=>api().verificationSummary(api().verifyAtwood(api().deriveAtwood({m1:p.m1,m2:p.m2,gravity:p.g})))
    },
    energy:{
      name:'力学的エネルギー',
      duration:p=>6,
      defaults:{m:1,h:2,v0:0,g:9.8},
      render:renderEnergy,
      verify:(p,t)=>api().verificationSummary(api().verifyEnergyTrack(api().deriveEnergyTrack({massKg:p.m,height:p.h,speed0:p.v0,gravity:p.g,heightAt:p.h/2})))
    },
    standing:{
      name:'定常波',
      duration:p=>6,
      defaults:{L:1,n:2,v:100},
      render:renderStandingWave,
      verify:(p,t)=>api().verificationSummary(api().verifyStandingWave(api().deriveStandingWave({length:p.L,harmonic:p.n,waveSpeed:p.v})))
    },
    dc:{
      name:'直流回路',
      duration:p=>1,
      defaults:{V:6,R1:10,R2:20,mode:'series'},
      render:renderDCCircuit,
      verify:(p,t)=>api().verificationSummary(api().verifyDCCircuit(api().deriveDCCircuit({voltage:p.V,r1:p.R1,r2:p.R2,mode:p.mode})))
    },
    capacitor:{
      name:'コンデンサー・RC',
      duration:p=>Math.max(.5,api().deriveCapacitor({capacitanceMicroF:p.C,voltage:p.V,resistanceOhm:p.R,t:0,mode:p.mode}).quantities.timeConstant*5),
      defaults:{C:100,V:6,R:1000,mode:'charge'},
      render:renderCapacitor,
      verify:(p,t)=>api().verificationSummary(api().verifyCapacitor(api().deriveCapacitor({capacitanceMicroF:p.C,voltage:p.V,resistanceOhm:p.R,t,mode:p.mode})))
    },
    gas:{
      name:'理想気体',
      duration:p=>1,
      defaults:{P:100,V:10,n:.4,T:300},
      render:renderIdealGas,
      verify:(p,t)=>api().verificationSummary(api().verifyIdealGas(api().deriveIdealGas({pressureKPa:p.P,volumeL:p.V,amountMol:p.n,temperatureK:p.T})))
    },
    faraday:{
      name:'電磁誘導',
      duration:p=>Math.max(.3,p.dt),
      defaults:{N:100,A:.01,B0:0,B1:.5,dt:.2},
      render:renderFaraday,
      verify:(p,t)=>api().verificationSummary(api().verifyFaraday(api().deriveFaraday({turns:p.N,areaM2:p.A,b0T:p.B0,b1T:p.B1,dt:p.dt})))
    },
    lens:{
      name:'薄レンズ',
      duration:p=>1,
      defaults:{f:20,u:60},
      render:renderThinLens,
      verify:(p,t)=>api().verificationSummary(api().verifyThinLens(api().deriveThinLens({focalLengthCm:p.f,objectDistanceCm:p.u})))
    },
    photoelectric:{
      name:'光電効果',
      duration:p=>1,
      defaults:{f:8e14,W:2},
      render:renderPhotoelectric,
      verify:(p,t)=>api().verificationSummary(api().verifyPhotoelectric(api().derivePhotoelectric({frequencyHz:p.f,workFunctionEV:p.W})))
    },
    inclineFriction:{
      name:'斜面＋摩擦',
      duration:p=>5,
      defaults:{m:1,angle:30,muS:.4,muK:.3,F:0,g:9.8},
      render:renderInclineFriction,
      verify:(p,t)=>api().verificationSummary(api().verifyInclineFriction(api().deriveInclineFriction({massKg:p.m,angleDeg:p.angle,muS:p.muS,muK:p.muK,gravity:p.g,appliedAlongSlopeN:p.F})))
    },
    twoBlock:{
      name:'2物体連結系',
      duration:p=>5,
      defaults:{m1:2,m2:1,F:9,mu:0,g:9.8},
      render:renderTwoBlock,
      verify:(p,t)=>api().verificationSummary(api().verifyTwoBlock(api().deriveTwoBlock({m1:p.m1,m2:p.m2,forceN:p.F,mu:p.mu,gravity:p.g})))
    },
    verticalCircle:{
      name:'鉛直円運動',
      duration:p=>6,
      defaults:{r:1,v0:6,m:1,g:9.8,omegaDeg:60},
      render:renderVerticalCircle,
      verify:(p,t)=>api().verificationSummary(api().verifyVerticalCircle(api().deriveVerticalCircle({radius:p.r,speedBottom:p.v0,massKg:p.m,gravity:p.g,angleDeg:(p.omegaDeg*t)%360})))
    },
    impulse:{
      name:'力積・運動量',
      duration:p=>Math.max(2,p.dt+1),
      defaults:{m:1,u:0,F:10,dt:.5},
      render:renderImpulse,
      verify:(p,t)=>api().verificationSummary(api().verifyImpulse(api().deriveImpulse({massKg:p.m,initialVelocity:p.u,forceN:p.F,durationS:Math.min(t,p.dt)})))
    },
    shmEnergy:{
      name:'単振動エネルギー',
      duration:p=>6,
      defaults:{m:1,k:10,A:.2},
      render:renderSHMEnergy,
      verify:(p,t)=>api().verificationSummary(api().verifySHMEnergy(api().deriveSHMEnergy({massKg:p.m,springConstant:p.k,amplitude:p.A,position:p.A*Math.cos(t*2)})))
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
    if(type==='circular') return {
      r:Math.max(.01,+$('psRadius').value||1),v:Math.max(0,+$('psCircV').value||0)
    };
    if(type==='collision') return {
      m1:Math.max(.01,+$('psM1').value||1),m2:Math.max(.01,+$('psM2').value||1),
      u1:+$('psU1').value||0,u2:+$('psU2').value||0,e:clamp(+$('psE').value||0,0,1)
    };
    if(type==='pendulum') return {
      L:Math.max(.05,+$('psL').value||1),g:Math.max(.1,+$('psPendG').value||9.8),amp:clamp(+$('psPendAmp').value||10,0,30)
    };
    if(type==='wave') return {
      A:Math.max(.01,+$('psWaveA').value||1),lambda:Math.max(.05,+$('psLambda').value||2),f:Math.max(0,+$('psFreq').value||1)
    };
    if(type==='electric') return {
      Q:+$('psQ').value||0,x:+$('psEX').value||1,y:+$('psEY').value||0
    };
    if(type==='friction') return {
      m:Math.max(.01,+$('psFricM').value||1),F:+$('psForce').value||0,muS:Math.max(0,+$('psMuS').value||0),muK:Math.max(0,+$('psMuK').value||0),g:9.8
    };
    if(type==='atwood') return {
      m1:Math.max(.01,+$('psAM1').value||1),m2:Math.max(.01,+$('psAM2').value||1),g:9.8
    };
    if(type==='energy') return {
      m:Math.max(.01,+$('psEnergyM').value||1),h:Math.max(0,+$('psEnergyH').value||0),v0:Math.max(0,+$('psEnergyV0').value||0),g:9.8
    };
    if(type==='standing') return {
      L:Math.max(.01,+$('psStandL').value||1),n:Math.max(1,Math.round(+$('psStandN').value||1)),v:Math.max(.01,+$('psStandV').value||100)
    };
    if(type==='dc') return {
      V:Math.max(0,+$('psDCV').value||0),R1:Math.max(.01,+$('psR1').value||1),R2:Math.max(.01,+$('psR2').value||1),mode:$('psDCMode').value
    };
    if(type==='capacitor') return {
      C:Math.max(.001,+$('psCapC').value||100),V:Math.max(0,+$('psCapV').value||0),R:Math.max(.01,+$('psCapR').value||1000),mode:$('psCapMode').value
    };
    if(type==='gas') return {
      P:Math.max(.001,+$('psGasP').value||100),V:Math.max(.001,+$('psGasV').value||10),n:Math.max(.0001,+$('psGasN').value||.4),T:Math.max(.1,+$('psGasT').value||300)
    };
    if(type==='faraday') return {
      N:Math.max(1,Math.round(+$('psFarN').value||100)),A:Math.max(0,+$('psFarA').value||.01),B0:+$('psB0').value||0,B1:+$('psB1').value||0,dt:Math.max(.001,+$('psFarDt').value||.2)
    };
    if(type==='lens') return {
      f:+$('psLensF').value||20,u:+$('psLensU').value||60
    };
    if(type==='photoelectric') return {
      f:Math.max(0,+$('psPhotoF').value||8e14),W:Math.max(0,+$('psPhotoW').value||2)
    };
    if(type==='inclineFriction') return {
      m:Math.max(.01,+$('psIFM').value||1),angle:clamp(+$('psIFAngle').value||30,0,80),muS:Math.max(0,+$('psIFMuS').value||0),muK:Math.max(0,+$('psIFMuK').value||0),F:+$('psIFF').value||0,g:9.8
    };
    if(type==='twoBlock') return {
      m1:Math.max(.01,+$('psTBM1').value||1),m2:Math.max(.01,+$('psTBM2').value||1),F:+$('psTBF').value||0,mu:Math.max(0,+$('psTBMu').value||0),g:9.8
    };
    if(type==='verticalCircle') return {
      r:Math.max(.05,+$('psVCR').value||1),v0:Math.max(0,+$('psVCV').value||6),m:Math.max(.01,+$('psVCM').value||1),g:9.8,omegaDeg:Math.max(1,+$('psVCOmega').value||60)
    };
    if(type==='impulse') return {
      m:Math.max(.01,+$('psImpM').value||1),u:+$('psImpU').value||0,F:+$('psImpF').value||0,dt:Math.max(0,+$('psImpDt').value||.5)
    };
    return {
      m:Math.max(.01,+$('psSHMM').value||1),k:Math.max(.01,+$('psSHMK').value||10),A:Math.max(0,+$('psSHMA').value||.2)
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
    renderAll(); saveState(); renderActive(); updateButtons(); renderExam();
  }

  function updateActiveParams(){
    if(!state.active) return;
    state.active.params=paramsFromPanel(state.active.type);
    state.elapsed=0; state.startTime=0;
    renderActive();
    renderExam();
  }

  function showFields(type){
    document.querySelectorAll('[data-sim-fields]').forEach(el=>el.hidden=el.dataset.simFields!==type);
  }


  const examBank = {
    friction: {
      title:'摩擦：動き出す境界',
      prompt:p=>`外力Fを増やしていく。どの瞬間に物体は動き始める？ 現在 μs=${p.muS}, m=${p.m} kg。`,
      reveal:p=>{
        const m=api().deriveFriction({massKg:p.m,forceN:p.F,muS:p.muS,muK:p.muK,gravity:p.g});
        return `最大静止摩擦は μsN = ${m.quantities.staticMaxN.toFixed(2)} N。|F|がこれを超えると動き始める。`;
      }
    },
    atwood: {
      title:'連結体：どちら向きに加速？',
      prompt:p=>`m₁=${p.m1} kg, m₂=${p.m2} kg。系はどちら向きに加速し、質量差を大きくすると加速度はどうなる？`,
      reveal:p=>{
        const m=api().deriveAtwood({m1:p.m1,m2:p.m2,gravity:p.g});
        return `a=(m₁-m₂)g/(m₁+m₂)=${m.quantities.acceleration.toFixed(3)} m/s²。`;
      }
    },
    energy: {
      title:'力学的エネルギー：高さを下げる',
      prompt:p=>`物体が低い位置へ移ると、位置エネルギー・運動エネルギー・全力学的エネルギーはどう変化する？`,
      reveal:p=>'摩擦なしでは U は減少、K は増加、K+U は一定。'
    },
    standing: {
      title:'定常波：次数を上げる',
      prompt:p=>`両端固定、弦長と波速一定。次数 n を1つ上げると、波長と振動数はどう変わる？`,
      reveal:p=>'L=nλ/2 より λ は小さくなり、f=v/λ より振動数は大きくなる。'
    },
    dc: {
      title:'回路：直列と並列',
      prompt:p=>`同じ2抵抗を直列から並列に変えると、合成抵抗と電源電流はどう変化する？`,
      reveal:p=>'並列では合成抵抗が小さくなるため、同じ電圧なら電源電流は大きくなる。'
    },
    capacitor: {
      title:'RC：時定数',
      prompt:p=>`RまたはCを2倍にすると、充電・放電にかかる時間スケールはどう変わる？`,
      reveal:p=>'τ=RC なので、RまたはCを2倍にすると時定数も2倍。'
    },
    projectile: {
      title:'投射：角度を変える',
      prompt:p=>`初速度の大きさ一定。角度を大きくすると水平速度成分と鉛直速度成分はどう変わる？`,
      reveal:p=>'vx=v cosθ は減少、vy0=v sinθ は増加する（0°〜90°）。'
    },
    circular: {
      title:'円運動：速さを2倍',
      prompt:p=>`半径一定で速さを2倍にすると向心加速度は何倍？`,
      reveal:p=>'a=v²/r なので4倍。'
    },
    faraday: {
      title:'電磁誘導：時間を半分',
      prompt:p=>`同じ磁束変化を半分の時間で起こすと、誘導起電力の大きさはどうなる？`,
      reveal:p=>'|ε|=N|ΔΦ|/Δt なので2倍。'
    },
    lens: {
      title:'レンズ：焦点へ近づける',
      prompt:p=>`凸レンズで物体を焦点の外側から焦点へ近づけると、実像の位置と大きさはどう変化する？`,
      reveal:p=>'像距離は大きくなり、実像は遠ざかって拡大する。焦点位置では像は無限遠。'
    },
    photoelectric: {
      title:'光電効果：強さと周波数',
      prompt:p=>`しきい周波数未満の光を強くすると電子は出る？ 周波数を上げるとKmaxは？`,
      reveal:p=>'しきい周波数未満では強くしても放出されない。放出域では Kmax=hf-W なので周波数とともに増える。'
    },
    inclineFriction: {
      title:'斜面＋摩擦：動き出す条件',
      prompt:p=>`角度θを増やすと、どの条件で物体は斜面を滑り始める？ μs=${p.muS}。`,
      reveal:p=>'mg sinθ が最大静止摩擦 μs mg cosθ を超えると滑り始める。境界は tanθ=μs。'
    },
    twoBlock: {
      title:'連結体：張力をどこで求める？',
      prompt:p=>'2物体全体で加速度を求めた後、張力Tはどの物体に運動方程式を立てると求めやすい？',
      reveal:p=>'通常は張力以外の未知力が少ない側の1物体に運動方程式を立てる。'
    },
    verticalCircle: {
      title:'鉛直円運動：頂点で糸がたるまない条件',
      prompt:p=>'頂点で張力が0になる限界では、速さは半径とgを使ってどう表せる？',
      reveal:p=>'頂点では mg=mv²/r が限界なので v²=gr。'
    },
    impulse: {
      title:'力積：同じΔpを作る',
      prompt:p=>'同じ運動量変化を作るには、力を半分にしたとき作用時間はどうすればよい？',
      reveal:p=>'J=FΔt=Δp なので、力を半分にすれば作用時間を2倍にする。'
    },
    shmEnergy: {
      title:'単振動：どこで速さ最大？',
      prompt:p=>'ばね単振動で速さが最大になる位置、運動エネルギー最大になる位置はどこ？',
      reveal:p=>'平衡点 x=0。U=(1/2)kx² が最小なので K が最大。'
    },
    gas: {
      title:'気体：温度変化',
      prompt:p=>`物質量と体積一定で温度を上げると圧力はどうなる？`,
      reveal:p=>'PV=nRT より P∝T。絶対温度に比例して増える。'
    }
  };

  function currentExam(){
    return state.active ? examBank[state.active.type] || null : null;
  }

  function renderExam(){
    const box=$('psExamBox');
    if(!box) return;
    const ex=currentExam();
    if(!ex){
      box.innerHTML='<div class="physics-note">このシミュレーターのExam Modeは準備中です。</div>';
      return;
    }
    box.innerHTML=
      '<div style="font-weight:900">'+ex.title+'</div>'+
      '<div style="margin-top:6px">'+ex.prompt(state.active.params)+'</div>'+
      '<textarea id="psExamAnswer" rows="3" placeholder="予測・理由を書く" style="width:100%;margin-top:8px"></textarea>'+
      '<div class="physics-inline" style="margin-top:8px">'+
      '<button class="btn small" id="psExamReveal">結果を開示</button>'+
      '<button class="btn small" id="psExamRetry">再回答</button>'+
      '</div>'+
      '<div id="psExamResult" class="physics-note" style="margin-top:8px">まず予測してから結果を開示します。</div>';
    $('psExamReveal').onclick=()=>{
      $('psExamResult').textContent=ex.reveal(state.active.params);
    };
    $('psExamRetry').onclick=()=>{
      $('psExamAnswer').value='';
      $('psExamResult').textContent='条件を変えるか、理由を言い直して再回答してください。';
      $('psExamAnswer').focus();
    };
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
          <option value="collision">1次元衝突</option>
          <option value="pendulum">単振り子</option>
          <option value="wave">正弦進行波</option>
          <option value="electric">電場・電位</option>
          <option value="friction">摩擦</option>
          <option value="atwood">連結体・滑車</option>
          <option value="energy">力学的エネルギー</option>
          <option value="standing">定常波</option>
          <option value="dc">直流回路</option>
          <option value="capacitor">コンデンサー・RC</option>
          <option value="gas">理想気体</option>
          <option value="faraday">電磁誘導</option>
          <option value="lens">薄レンズ</option>
          <option value="photoelectric">光電効果</option>
          <option value="inclineFriction">斜面＋摩擦</option>
          <option value="twoBlock">2物体連結系</option>
          <option value="verticalCircle">鉛直円運動</option>
          <option value="impulse">力積・運動量</option>
          <option value="shmEnergy">単振動エネルギー</option>
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

      <div data-sim-fields="collision" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>m₁</label><input id="psM1" type="number" value="1" step="0.1"></div>
        <div class="field"><label>m₂</label><input id="psM2" type="number" value="1" step="0.1"></div></div>
        <div class="physics-inline"><div class="field"><label>u₁</label><input id="psU1" type="number" value="2" step="0.2"></div>
        <div class="field"><label>u₂</label><input id="psU2" type="number" value="0" step="0.2"></div>
        <div class="field"><label>反発係数 e</label><input id="psE" type="number" min="0" max="1" value="1" step="0.1"></div></div>
      </div>

      <div data-sim-fields="pendulum" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>L (m)</label><input id="psL" type="number" value="1" step="0.1"></div>
        <div class="field"><label>振幅 (°)</label><input id="psPendAmp" type="number" value="10" min="0" max="30" step="1"></div>
        <div class="field"><label>g</label><input id="psPendG" type="number" value="9.8" step="0.1"></div></div>
      </div>

      <div data-sim-fields="wave" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>A</label><input id="psWaveA" type="number" value="1" step="0.1"></div>
        <div class="field"><label>λ (m)</label><input id="psLambda" type="number" value="2" step="0.1"></div>
        <div class="field"><label>f (Hz)</label><input id="psFreq" type="number" value="1" step="0.1"></div></div>
      </div>

      <div data-sim-fields="electric" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>Q (μC)</label><input id="psQ" type="number" value="1" step="0.5"></div>
        <div class="field"><label>x (m)</label><input id="psEX" type="number" value="1" step="0.1"></div>
        <div class="field"><label>y (m)</label><input id="psEY" type="number" value="0" step="0.1"></div></div>
      </div>

      <div data-sim-fields="friction" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>m (kg)</label><input id="psFricM" type="number" value="1" step="0.1"></div>
        <div class="field"><label>外力 F (N)</label><input id="psForce" type="number" value="5" step="0.5"></div></div>
        <div class="physics-inline"><div class="field"><label>μs</label><input id="psMuS" type="number" value="0.4" step="0.05"></div>
        <div class="field"><label>μk</label><input id="psMuK" type="number" value="0.3" step="0.05"></div></div>
      </div>

      <div data-sim-fields="atwood" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>m₁</label><input id="psAM1" type="number" value="2" step="0.1"></div>
        <div class="field"><label>m₂</label><input id="psAM2" type="number" value="1" step="0.1"></div></div>
      </div>

      <div data-sim-fields="energy" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>m (kg)</label><input id="psEnergyM" type="number" value="1" step="0.1"></div>
        <div class="field"><label>h (m)</label><input id="psEnergyH" type="number" value="2" step="0.2"></div>
        <div class="field"><label>v₀</label><input id="psEnergyV0" type="number" value="0" step="0.5"></div></div>
      </div>

      <div data-sim-fields="standing" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>L (m)</label><input id="psStandL" type="number" value="1" step="0.1"></div>
        <div class="field"><label>次数 n</label><input id="psStandN" type="number" value="2" min="1" step="1"></div>
        <div class="field"><label>波速</label><input id="psStandV" type="number" value="100" step="5"></div></div>
      </div>

      <div data-sim-fields="dc" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>電圧 V</label><input id="psDCV" type="number" value="6" step="1"></div>
        <div class="field"><label>R₁</label><input id="psR1" type="number" value="10" step="1"></div>
        <div class="field"><label>R₂</label><input id="psR2" type="number" value="20" step="1"></div></div>
        <div class="field"><label>接続</label><select id="psDCMode"><option value="series">直列</option><option value="parallel">並列</option></select></div>
      </div>

      <div data-sim-fields="capacitor" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>C (μF)</label><input id="psCapC" type="number" value="100" step="10"></div>
        <div class="field"><label>V</label><input id="psCapV" type="number" value="6" step="1"></div>
        <div class="field"><label>R (Ω)</label><input id="psCapR" type="number" value="1000" step="100"></div></div>
        <div class="field"><label>モード</label><select id="psCapMode"><option value="charge">充電</option><option value="discharge">放電</option></select></div>
      </div>

      <div data-sim-fields="gas" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>P (kPa)</label><input id="psGasP" type="number" value="100" step="5"></div>
        <div class="field"><label>V (L)</label><input id="psGasV" type="number" value="10" step="0.5"></div></div>
        <div class="physics-inline"><div class="field"><label>n (mol)</label><input id="psGasN" type="number" value="0.4" step="0.05"></div>
        <div class="field"><label>T (K)</label><input id="psGasT" type="number" value="300" step="10"></div></div>
      </div>

      <div data-sim-fields="faraday" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>N</label><input id="psFarN" type="number" value="100" step="10"></div>
        <div class="field"><label>A (m²)</label><input id="psFarA" type="number" value="0.01" step="0.005"></div></div>
        <div class="physics-inline"><div class="field"><label>B₀ (T)</label><input id="psB0" type="number" value="0" step="0.1"></div>
        <div class="field"><label>B₁ (T)</label><input id="psB1" type="number" value="0.5" step="0.1"></div>
        <div class="field"><label>Δt (s)</label><input id="psFarDt" type="number" value="0.2" step="0.05"></div></div>
      </div>

      <div data-sim-fields="lens" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>f (cm)</label><input id="psLensF" type="number" value="20" step="1"></div>
        <div class="field"><label>u (cm)</label><input id="psLensU" type="number" value="60" step="1"></div></div>
      </div>

      <div data-sim-fields="photoelectric" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>f (Hz)</label><input id="psPhotoF" type="number" value="800000000000000" step="10000000000000"></div>
        <div class="field"><label>仕事関数 W (eV)</label><input id="psPhotoW" type="number" value="2" step="0.1"></div></div>
      </div>

      <div data-sim-fields="inclineFriction" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>m</label><input id="psIFM" type="number" value="1" step="0.1"></div>
        <div class="field"><label>角度</label><input id="psIFAngle" type="number" value="30" step="1"></div></div>
        <div class="physics-inline"><div class="field"><label>μs</label><input id="psIFMuS" type="number" value="0.4" step="0.05"></div>
        <div class="field"><label>μk</label><input id="psIFMuK" type="number" value="0.3" step="0.05"></div>
        <div class="field"><label>斜面方向外力</label><input id="psIFF" type="number" value="0" step="0.5"></div></div>
      </div>

      <div data-sim-fields="twoBlock" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>m₁</label><input id="psTBM1" type="number" value="2" step="0.1"></div>
        <div class="field"><label>m₂</label><input id="psTBM2" type="number" value="1" step="0.1"></div></div>
        <div class="physics-inline"><div class="field"><label>外力 F</label><input id="psTBF" type="number" value="9" step="0.5"></div>
        <div class="field"><label>μ</label><input id="psTBMu" type="number" value="0" step="0.05"></div></div>
      </div>

      <div data-sim-fields="verticalCircle" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>r</label><input id="psVCR" type="number" value="1" step="0.1"></div>
        <div class="field"><label>底での速さ</label><input id="psVCV" type="number" value="6" step="0.5"></div>
        <div class="field"><label>m</label><input id="psVCM" type="number" value="1" step="0.1"></div>
        <div class="field"><label>角速度表示</label><input id="psVCOmega" type="number" value="60" step="5"></div></div>
      </div>

      <div data-sim-fields="impulse" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>m</label><input id="psImpM" type="number" value="1" step="0.1"></div>
        <div class="field"><label>初速度</label><input id="psImpU" type="number" value="0" step="0.5"></div></div>
        <div class="physics-inline"><div class="field"><label>F</label><input id="psImpF" type="number" value="10" step="1"></div>
        <div class="field"><label>作用時間</label><input id="psImpDt" type="number" value="0.5" step="0.1"></div></div>
      </div>

      <div data-sim-fields="shmEnergy" class="col" hidden>
        <div class="physics-inline"><div class="field"><label>m</label><input id="psSHMM" type="number" value="1" step="0.1"></div>
        <div class="field"><label>k</label><input id="psSHMK" type="number" value="10" step="1"></div>
        <div class="field"><label>A</label><input id="psSHMA" type="number" value="0.2" step="0.05"></div></div>
      </div>

      <div class="physics-inline" style="margin-top:8px">
        <button class="btn primary" id="psAdd">Student Viewへ追加</button>
        <button class="btn" id="psPlay">▶ 再生</button>
        <button class="btn small" id="psReset">↺ リセット</button>
      </div>
      <details open style="margin-top:10px">
        <summary style="font-weight:800;cursor:pointer">🎯 Exam Mode</summary>
        <div id="psExamBox" style="margin-top:8px"><div class="physics-note">Student Viewへ追加すると典型問題を出します。</div></div>
      </details>
      <div id="psStatus" class="status">シミュレーターを選んで追加してください。</div>
    `;
    host.insertAdjacentElement('afterend',panel);

    $('psType').onchange=e=>showFields(e.target.value);
    $('psAdd').onclick=()=>addSimulator($('psType').value);
    $('psPlay').onclick=playPause;
    $('psReset').onclick=reset;
    panel.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',updateActiveParams));
    panel.querySelectorAll('select').forEach(sel=>{ if(sel.id!=='psType') sel.addEventListener('change',updateActiveParams); });
    showFields($('psType').value);
    renderExam();
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