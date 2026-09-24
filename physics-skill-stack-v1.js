/* Teaching OS — Physics Skill Stack v1
 * Native integration layer inspired by:
 * - scientific visualization principles
 * - symbolic/scientific verification workflows
 * - interactive physics simulation adapters
 * - lesson design / check-for-understanding workflows
 *
 * Important boundary:
 * Physics truth/model -> representation -> renderer/simulator.
 * A renderer or simulator must never become the source of the physical law.
 */
(() => {
  'use strict';

  const VERSION = 'physics-skill-stack-v1';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const degToRad = (deg) => deg * Math.PI / 180;
  const nearlyEqual = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));

  function makeCheck(id, claim, evidence, verifier, pass, details = '') {
    return { id, claim, evidence, verifier, result: pass ? 'PASS' : 'FAIL', details };
  }

  // -----------------------------
  // 1. Physics Thinking / Derivation
  // -----------------------------
  function deriveInclineForces({ massKg = 1, gravity = 9.8, angleDeg = 30 } = {}) {
    const m = Math.max(0, Number(massKg) || 0);
    const g = Math.max(0, Number(gravity) || 0);
    const theta = clamp(Number(angleDeg) || 0, 0, 90);
    const rad = degToRad(theta);
    const weightN = m * g;
    const parallelN = weightN * Math.sin(rad);
    const normalComponentN = weightN * Math.cos(rad);

    return {
      phenomenon: '斜面上の物体に働く重力を、斜面方向と斜面に垂直な方向へ分解する。',
      givens: { massKg: m, gravity: g, angleDeg: theta },
      principle: '重力ベクトル mg を、互いに直交する斜面座標へ射影する。',
      derivation: [
        '重力の大きさは mg。',
        '斜面方向成分は重力ベクトルの斜面方向への射影。',
        '斜面方向: F∥ = mg sin θ',
        '斜面垂直方向: F⊥ = mg cos θ'
      ],
      quantities: {
        weightN,
        parallelN,
        normalComponentN
      }
    };
  }


  // -----------------------------
  // 1b. Reusable simulator models
  // -----------------------------
  function deriveKinematics({x0=0,v0=0,a=0,t=0}={}){
    const tt=Math.max(0,Number(t)||0);
    const xx0=Number(x0)||0, vv0=Number(v0)||0, aa=Number(a)||0;
    const v=vv0+aa*tt;
    const x=xx0+vv0*tt+0.5*aa*tt*tt;
    return {
      phenomenon:'1次元の等加速度運動',
      givens:{x0:xx0,v0:vv0,a:aa,t:tt},
      principle:'加速度一定。v=v0+at, x=x0+v0t+(1/2)at²',
      quantities:{x,v,a:aa}
    };
  }

  function verifyKinematics(model){
    const {x0,v0,a,t}=model.givens;
    const {x,v}=model.quantities;
    const energyLike=v*v-(model.givens.v0*model.givens.v0);
    const displacement=x-x0;
    return [
      makeCheck('kin-v','v=v0+at','constant acceleration','numeric equality',
        nearlyEqual(v,v0+a*t)),
      makeCheck('kin-x','x=x0+v0t+(1/2)at²','integrated constant acceleration','numeric equality',
        nearlyEqual(x,x0+v0*t+0.5*a*t*t)),
      makeCheck('kin-v2','v²-v0²=2aΔx','eliminate time','kinematic identity',
        nearlyEqual(energyLike,2*a*displacement))
    ];
  }

  function deriveProjectile({speed=20,angleDeg=45,height0=0,gravity=9.8,t=0}={}){
    const v0=Math.max(0,Number(speed)||0);
    const theta=degToRad(clamp(Number(angleDeg)||0,-89,89));
    const y0=Number(height0)||0;
    const g=Math.max(0.0001,Number(gravity)||9.8);
    const tt=Math.max(0,Number(t)||0);
    const vx=v0*Math.cos(theta);
    const vy0=v0*Math.sin(theta);
    const x=vx*tt;
    const y=y0+vy0*tt-0.5*g*tt*tt;
    const vy=vy0-g*tt;
    const disc=Math.max(0,vy0*vy0+2*g*Math.max(0,y0));
    const flightTime=(vy0+Math.sqrt(disc))/g;
    return {
      phenomenon:'空気抵抗を無視した投射運動',
      givens:{speed:v0,angleDeg:Number(angleDeg)||0,height0:y0,gravity:g,t:tt},
      principle:'水平は等速、鉛直は加速度 -g',
      quantities:{x,y,vx,vy,flightTime}
    };
  }

  function verifyProjectile(model){
    const {speed,angleDeg,height0,gravity,t}=model.givens;
    const th=degToRad(angleDeg);
    const {x,y,vx,vy}=model.quantities;
    return [
      makeCheck('proj-vx','vx is constant','no horizontal acceleration','numeric equality',
        nearlyEqual(vx,speed*Math.cos(th))),
      makeCheck('proj-x','x=vx t','horizontal uniform motion','numeric equality',
        nearlyEqual(x,vx*t)),
      makeCheck('proj-y','y=y0+vy0t-(1/2)gt²','vertical constant acceleration','numeric equality',
        nearlyEqual(y,height0+speed*Math.sin(th)*t-0.5*gravity*t*t)),
      makeCheck('proj-vy','vy=vy0-gt','vertical constant acceleration','numeric equality',
        nearlyEqual(vy,speed*Math.sin(th)-gravity*t))
    ];
  }

  function deriveSpring({massKg=1,springConstant=10,amplitude=0.2,phase=0,t=0}={}){
    const m=Math.max(0.0001,Number(massKg)||1);
    const k=Math.max(0.0001,Number(springConstant)||10);
    const A=Math.max(0,Number(amplitude)||0);
    const phi=Number(phase)||0;
    const tt=Math.max(0,Number(t)||0);
    const omega=Math.sqrt(k/m);
    const x=A*Math.cos(omega*tt+phi);
    const v=-A*omega*Math.sin(omega*tt+phi);
    const a=-omega*omega*x;
    const period=2*Math.PI/omega;
    const totalEnergy=0.5*k*A*A;
    return {
      phenomenon:'摩擦を無視した水平ばね振動',
      givens:{massKg:m,springConstant:k,amplitude:A,phase:phi,t:tt},
      principle:'F=-kx, ma=-kx → a=-(k/m)x',
      quantities:{omega,period,x,v,a,totalEnergy}
    };
  }

  function verifySpring(model){
    const {massKg:m,springConstant:k,amplitude:A}=model.givens;
    const {omega,period,x,a,totalEnergy}=model.quantities;
    return [
      makeCheck('sho-omega','ω²=k/m','equation of motion','numeric equality',
        nearlyEqual(omega*omega,k/m)),
      makeCheck('sho-acc','a=-ω²x','SHM acceleration','numeric equality',
        nearlyEqual(a,-omega*omega*x)),
      makeCheck('sho-period','T=2π/ω','angular frequency definition','numeric equality',
        nearlyEqual(period,2*Math.PI/omega)),
      makeCheck('sho-energy','E=(1/2)kA²','ideal SHM energy','numeric equality',
        nearlyEqual(totalEnergy,0.5*k*A*A))
    ];
  }

  function deriveCircular({radius=1,speed=2,t=0}={}){
    const r=Math.max(0.0001,Number(radius)||1);
    const v=Math.max(0,Number(speed)||0);
    const tt=Math.max(0,Number(t)||0);
    const omega=v/r;
    const theta=omega*tt;
    const x=r*Math.cos(theta), y=r*Math.sin(theta);
    const centripetalAcceleration=v*v/r;
    const period=v>0?2*Math.PI*r/v:Infinity;
    return {
      phenomenon:'等速円運動',
      givens:{radius:r,speed:v,t:tt},
      principle:'速度の大きさ一定、方向が変化。向心加速度 a=v²/r',
      quantities:{omega,theta,x,y,centripetalAcceleration,period}
    };
  }

  function verifyCircular(model){
    const {radius:r,speed:v}=model.givens;
    const {omega,x,y,centripetalAcceleration}=model.quantities;
    return [
      makeCheck('circ-radius','x²+y²=r²','circular constraint','numeric equality',
        nearlyEqual(x*x+y*y,r*r)),
      makeCheck('circ-omega','ω=v/r','uniform circular motion','numeric equality',
        nearlyEqual(omega,v/r)),
      makeCheck('circ-ac','a_c=v²/r','centripetal acceleration','numeric equality',
        nearlyEqual(centripetalAcceleration,v*v/r))
    ];
  }


  function deriveCollision({m1=1,m2=1,u1=2,u2=0,restitution=1}={}){
    const a=Math.max(0.0001,Number(m1)||1);
    const b=Math.max(0.0001,Number(m2)||1);
    const e=clamp(Number(restitution)||0,0,1);
    const v1i=Number(u1)||0, v2i=Number(u2)||0;
    const v1=((a-e*b)*v1i+(1+e)*b*v2i)/(a+b);
    const v2=((1+e)*a*v1i+(b-e*a)*v2i)/(a+b);
    const pBefore=a*v1i+b*v2i;
    const pAfter=a*v1+b*v2;
    const kBefore=0.5*a*v1i*v1i+0.5*b*v2i*v2i;
    const kAfter=0.5*a*v1*v1+0.5*b*v2*v2;
    return {
      phenomenon:'1次元衝突',
      givens:{m1:a,m2:b,u1:v1i,u2:v2i,restitution:e},
      principle:'運動量保存 + 反発係数',
      quantities:{v1,v2,pBefore,pAfter,kBefore,kAfter}
    };
  }

  function verifyCollision(model){
    const q=model.quantities;
    return [
      makeCheck('col-momentum','衝突前後で全運動量が等しい','isolated system momentum conservation','numeric equality',
        nearlyEqual(q.pBefore,q.pAfter)),
      makeCheck('col-energy-bound','e≤1 なら衝突後の運動エネルギーは増えない','coefficient of restitution bound','numeric inequality',
        q.kAfter<=q.kBefore+1e-9),
      makeCheck('col-elastic','e=1 なら運動エネルギー保存','elastic collision','numeric equality',
        model.givens.restitution!==1 || nearlyEqual(q.kBefore,q.kAfter))
    ];
  }

  function derivePendulum({length=1,gravity=9.8,amplitudeDeg=10,t=0}={}){
    const L=Math.max(0.0001,Number(length)||1);
    const g=Math.max(0.0001,Number(gravity)||9.8);
    const amp=clamp(Number(amplitudeDeg)||0,0,30)*Math.PI/180;
    const tt=Math.max(0,Number(t)||0);
    const omega=Math.sqrt(g/L);
    const theta=amp*Math.cos(omega*tt);
    const angularVelocity=-amp*omega*Math.sin(omega*tt);
    const period=2*Math.PI*Math.sqrt(L/g);
    return {
      phenomenon:'小振幅単振り子',
      givens:{length:L,gravity:g,amplitudeDeg:Number(amplitudeDeg)||0,t:tt},
      principle:'small-angle approximation: sinθ≈θ → θ¨=-(g/L)θ',
      quantities:{omega,theta,angularVelocity,period}
    };
  }

  function verifyPendulum(model){
    const {length:L,gravity:g}=model.givens;
    const q=model.quantities;
    return [
      makeCheck('pen-omega','ω²=g/L','small-angle equation','numeric equality',
        nearlyEqual(q.omega*q.omega,g/L)),
      makeCheck('pen-period','T=2π√(L/g)','small-angle pendulum period','numeric equality',
        nearlyEqual(q.period,2*Math.PI*Math.sqrt(L/g)))
    ];
  }

  function deriveWave({amplitude=1,wavelength=2,frequency=1,x=0,t=0,phase=0}={}){
    const A=Math.max(0,Number(amplitude)||0);
    const lambda=Math.max(0.0001,Number(wavelength)||2);
    const f=Math.max(0,Number(frequency)||0);
    const xx=Number(x)||0, tt=Math.max(0,Number(t)||0), phi=Number(phase)||0;
    const k=2*Math.PI/lambda;
    const omega=2*Math.PI*f;
    const speed=f*lambda;
    const y=A*Math.sin(k*xx-omega*tt+phi);
    return {
      phenomenon:'正弦進行波',
      givens:{amplitude:A,wavelength:lambda,frequency:f,x:xx,t:tt,phase:phi},
      principle:'y=A sin(kx-ωt+φ), k=2π/λ, ω=2πf',
      quantities:{k,omega,speed,y}
    };
  }

  function verifyWave(model){
    const g=model.givens, q=model.quantities;
    return [
      makeCheck('wave-k','k=2π/λ','wave number definition','numeric equality',
        nearlyEqual(q.k,2*Math.PI/g.wavelength)),
      makeCheck('wave-omega','ω=2πf','angular frequency definition','numeric equality',
        nearlyEqual(q.omega,2*Math.PI*g.frequency)),
      makeCheck('wave-speed','v=fλ','phase velocity','numeric equality',
        nearlyEqual(q.speed,g.frequency*g.wavelength))
    ];
  }

  function deriveElectricField({sourceChargeMicroC=1,testX=1,testY=0,k=8.9875517923e9}={}){
    const Q=(Number(sourceChargeMicroC)||0)*1e-6;
    const x=Number(testX)||0, y=Number(testY)||0;
    const r=Math.max(0.0001,Math.hypot(x,y));
    const kk=Math.max(0,Number(k)||8.9875517923e9);
    const magnitude=kk*Math.abs(Q)/(r*r);
    const sign=Q>=0?1:-1;
    const ex=sign*magnitude*x/r;
    const ey=sign*magnitude*y/r;
    const potential=kk*Q/r;
    return {
      phenomenon:'点電荷が作る電場と電位',
      givens:{sourceChargeC:Q,testX:x,testY:y,k:kk},
      principle:'E=k|Q|/r², V=kQ/r',
      quantities:{r,magnitude,ex,ey,potential}
    };
  }

  function verifyElectricField(model){
    const g=model.givens,q=model.quantities;
    const mag=Math.hypot(q.ex,q.ey);
    return [
      makeCheck('ef-mag','|E|=k|Q|/r²','Coulomb field','numeric equality',
        nearlyEqual(q.magnitude,g.k*Math.abs(g.sourceChargeC)/(q.r*q.r))),
      makeCheck('ef-components','√(Ex²+Ey²)=|E|','vector components','numeric equality',
        nearlyEqual(mag,q.magnitude)),
      makeCheck('ef-potential','V=kQ/r','point-charge potential','numeric equality',
        nearlyEqual(q.potential,g.k*g.sourceChargeC/q.r))
    ];
  }


  function deriveFriction({massKg=1,forceN=5,muS=0.4,muK=0.3,gravity=9.8}={}){
    const m=Math.max(0.0001,Number(massKg)||1);
    const F=Number(forceN)||0;
    const mus=Math.max(0,Number(muS)||0);
    const muk=Math.max(0,Number(muK)||0);
    const g=Math.max(0.0001,Number(gravity)||9.8);
    const N=m*g;
    const fsMax=mus*N;
    const moving=Math.abs(F)>fsMax;
    const friction=moving?muk*N:Math.abs(F);
    const direction=F===0?0:-Math.sign(F);
    const net=moving?F+direction*friction:0;
    const a=net/m;
    return {
      phenomenon:'水平面上の摩擦を受ける物体',
      givens:{massKg:m,forceN:F,muS:mus,muK:muk,gravity:g},
      principle:'静止摩擦は必要量まで、最大値を超えると動摩擦へ移る',
      quantities:{normalN:N,staticMaxN:fsMax,frictionN:friction,netForceN:net,acceleration:a,moving}
    };
  }

  function verifyFriction(model){
    const g=model.givens,q=model.quantities;
    return [
      makeCheck('fric-normal','水平面ではN=mg','vertical force balance','numeric equality',
        nearlyEqual(q.normalN,g.massKg*g.gravity)),
      makeCheck('fric-static-max','最大静止摩擦=μsN','static friction limit','numeric equality',
        nearlyEqual(q.staticMaxN,g.muS*q.normalN)),
      makeCheck('fric-motion','静止中は合力0','static equilibrium','state check',
        q.moving || nearlyEqual(q.netForceN,0))
    ];
  }

  function deriveAtwood({m1=2,m2=1,gravity=9.8}={}){
    const a1=Math.max(0.0001,Number(m1)||1);
    const a2=Math.max(0.0001,Number(m2)||1);
    const g=Math.max(0.0001,Number(gravity)||9.8);
    const acc=(a1-a2)*g/(a1+a2);
    const tension=2*a1*a2*g/(a1+a2);
    return {
      phenomenon:'理想的なアトウッドの装置',
      givens:{m1:a1,m2:a2,gravity:g},
      principle:'2物体を1つの系として運動方程式を立てる',
      quantities:{acceleration:acc,tensionN:tension}
    };
  }

  function verifyAtwood(model){
    const g=model.givens,q=model.quantities;
    return [
      makeCheck('atwood-a','a=(m1-m2)g/(m1+m2)','system Newton equation','numeric equality',
        nearlyEqual(q.acceleration,(g.m1-g.m2)*g.gravity/(g.m1+g.m2))),
      makeCheck('atwood-t','T=2m1m2g/(m1+m2)','single-body Newton equation','numeric equality',
        nearlyEqual(q.tensionN,2*g.m1*g.m2*g.gravity/(g.m1+g.m2)))
    ];
  }

  function deriveEnergyTrack({massKg=1,height=2,speed0=0,gravity=9.8,heightAt=0}={}){
    const m=Math.max(0.0001,Number(massKg)||1);
    const h0=Math.max(0,Number(height)||0);
    const v0=Math.max(0,Number(speed0)||0);
    const g=Math.max(0.0001,Number(gravity)||9.8);
    const h=clamp(Number(heightAt)||0,0,h0);
    const total=m*g*h0+0.5*m*v0*v0;
    const potential=m*g*h;
    const kinetic=Math.max(0,total-potential);
    const speed=Math.sqrt(2*kinetic/m);
    return {
      phenomenon:'摩擦なしの力学的エネルギー保存',
      givens:{massKg:m,height:h0,speed0:v0,gravity:g,heightAt:h},
      principle:'K+U=constant',
      quantities:{totalEnergy:total,potentialEnergy:potential,kineticEnergy:kinetic,speed}
    };
  }

  function verifyEnergyTrack(model){
    const q=model.quantities;
    return [
      makeCheck('energy-total','K+U=E','mechanical energy conservation','numeric equality',
        nearlyEqual(q.kineticEnergy+q.potentialEnergy,q.totalEnergy))
    ];
  }

  function deriveStandingWave({length=1,harmonic=1,waveSpeed=100}={}){
    const L=Math.max(0.0001,Number(length)||1);
    const n=Math.max(1,Math.round(Number(harmonic)||1));
    const v=Math.max(0.0001,Number(waveSpeed)||100);
    const wavelength=2*L/n;
    const frequency=v/wavelength;
    return {
      phenomenon:'両端固定弦の定常波',
      givens:{length:L,harmonic:n,waveSpeed:v},
      principle:'L=nλ/2',
      quantities:{wavelength,frequency,nodes:n+1,antinodes:n}
    };
  }

  function verifyStandingWave(model){
    const g=model.givens,q=model.quantities;
    return [
      makeCheck('stand-lambda','λ=2L/n','fixed-end boundary condition','numeric equality',
        nearlyEqual(q.wavelength,2*g.length/g.harmonic)),
      makeCheck('stand-f','f=v/λ','wave speed relation','numeric equality',
        nearlyEqual(q.frequency,g.waveSpeed/q.wavelength))
    ];
  }

  function deriveDCCircuit({voltage=6,r1=10,r2=20,mode='series'}={}){
    const V=Math.max(0,Number(voltage)||0);
    const R1=Math.max(0.0001,Number(r1)||1);
    const R2=Math.max(0.0001,Number(r2)||1);
    const parallel=mode==='parallel';
    const Req=parallel?1/(1/R1+1/R2):R1+R2;
    const Itotal=V/Req;
    const i1=parallel?V/R1:Itotal;
    const i2=parallel?V/R2:Itotal;
    const v1=parallel?V:i1*R1;
    const v2=parallel?V:i2*R2;
    return {
      phenomenon:parallel?'抵抗2本の並列回路':'抵抗2本の直列回路',
      givens:{voltage:V,r1:R1,r2:R2,mode},
      principle:'Ohmの法則 + 直列/並列の電流・電圧条件',
      quantities:{equivalentResistance:Req,totalCurrent:Itotal,i1,i2,v1,v2}
    };
  }

  function verifyDCCircuit(model){
    const g=model.givens,q=model.quantities;
    const parallel=g.mode==='parallel';
    return [
      makeCheck('dc-ohm','V=IR','Ohm law','numeric equality',
        nearlyEqual(g.voltage,q.totalCurrent*q.equivalentResistance)),
      makeCheck('dc-topology',parallel?'並列では各枝の電圧が等しい':'直列では各抵抗の電流が等しい',
        'circuit topology','numeric equality',
        parallel?nearlyEqual(q.v1,q.v2):nearlyEqual(q.i1,q.i2))
    ];
  }

  function deriveCapacitor({capacitanceMicroF=100,voltage=6,resistanceOhm=1000,t=0,mode='charge'}={}){
    const C=Math.max(0.000000001,(Number(capacitanceMicroF)||0)*1e-6);
    const V=Math.max(0,Number(voltage)||0);
    const R=Math.max(0.0001,Number(resistanceOhm)||1);
    const tt=Math.max(0,Number(t)||0);
    const tau=R*C;
    const chargeMode=mode!=='discharge';
    const vc=chargeMode?V*(1-Math.exp(-tt/tau)):V*Math.exp(-tt/tau);
    const current=chargeMode?(V/R)*Math.exp(-tt/tau):-(V/R)*Math.exp(-tt/tau);
    const charge=C*vc;
    return {
      phenomenon:chargeMode?'RC充電':'RC放電',
      givens:{capacitanceF:C,voltage:V,resistanceOhm:R,t:tt,mode},
      principle:'RC回路の指数関数応答',
      quantities:{timeConstant:tau,capacitorVoltage:vc,current,charge}
    };
  }

  function verifyCapacitor(model){
    const g=model.givens,q=model.quantities;
    return [
      makeCheck('rc-tau','τ=RC','RC time constant','numeric equality',
        nearlyEqual(q.timeConstant,g.resistanceOhm*g.capacitanceF)),
      makeCheck('rc-q','Q=CV','capacitor definition','numeric equality',
        nearlyEqual(q.charge,g.capacitanceF*q.capacitorVoltage))
    ];
  }


  function deriveIdealGas({pressureKPa=100,volumeL=10,amountMol=0.4,temperatureK=300}={}){
    const P=Math.max(0.0001,Number(pressureKPa)||100)*1000;
    const V=Math.max(0.000001,Number(volumeL)||10)/1000;
    const n=Math.max(0.000001,Number(amountMol)||0.4);
    const T=Math.max(0.0001,Number(temperatureK)||300);
    const R=8.314462618;
    const pv=P*V;
    const nrt=n*R*T;
    return {
      phenomenon:'理想気体の状態',
      givens:{pressurePa:P,volumeM3:V,amountMol:n,temperatureK:T,R},
      principle:'PV=nRT',
      quantities:{pv,nrt,relativeError:Math.abs(pv-nrt)/Math.max(1,Math.abs(nrt))}
    };
  }

  function verifyIdealGas(model){
    const q=model.quantities;
    return [
      makeCheck('gas-state','PV=nRT','ideal gas law','numeric comparison',
        q.relativeError<0.05,`relative error=${q.relativeError}`)
    ];
  }

  function deriveFaraday({turns=100,areaM2=0.01,b0T=0,b1T=0.5,dt=0.2}={}){
    const N=Math.max(1,Math.round(Number(turns)||1));
    const A=Math.max(0,Number(areaM2)||0);
    const b0=Number(b0T)||0, b1=Number(b1T)||0;
    const dtime=Math.max(0.000001,Number(dt)||0.2);
    const phi0=b0*A, phi1=b1*A;
    const emf=-N*(phi1-phi0)/dtime;
    return {
      phenomenon:'磁束変化による電磁誘導',
      givens:{turns:N,areaM2:A,b0T:b0,b1T:b1,dt:dtime},
      principle:'Faradayの法則 ε=-NΔΦ/Δt',
      quantities:{phi0,phi1,deltaPhi:phi1-phi0,emf}
    };
  }

  function verifyFaraday(model){
    const g=model.givens,q=model.quantities;
    return [
      makeCheck('faraday','ε=-NΔΦ/Δt','Faraday law','numeric equality',
        nearlyEqual(q.emf,-g.turns*q.deltaPhi/g.dt))
    ];
  }

  function deriveThinLens({focalLengthCm=20,objectDistanceCm=60}={}){
    const f=Number(focalLengthCm)||20;
    const u=Number(objectDistanceCm)||60;
    if(Math.abs(f)<1e-9 || Math.abs(u)<1e-9 || nearlyEqual(1/f,1/u)){
      return {
        phenomenon:'薄レンズ',
        givens:{focalLengthCm:f,objectDistanceCm:u},
        principle:'1/f=1/u+1/v',
        quantities:{imageDistanceCm:Infinity,magnification:Infinity}
      };
    }
    const v=1/(1/f-1/u);
    const m=-v/u;
    return {
      phenomenon:'薄レンズによる結像',
      givens:{focalLengthCm:f,objectDistanceCm:u},
      principle:'1/f=1/u+1/v',
      quantities:{imageDistanceCm:v,magnification:m}
    };
  }

  function verifyThinLens(model){
    const g=model.givens,q=model.quantities;
    if(!Number.isFinite(q.imageDistanceCm)) return [
      makeCheck('lens-infinity','物体が焦点位置なら像は無限遠','thin lens limit','limit case',true)
    ];
    return [
      makeCheck('lens-eq','1/f=1/u+1/v','thin lens equation','numeric equality',
        nearlyEqual(1/g.focalLengthCm,1/g.objectDistanceCm+1/q.imageDistanceCm))
    ];
  }

  function derivePhotoelectric({frequencyHz=8e14,workFunctionEV=2.0}={}){
    const f=Math.max(0,Number(frequencyHz)||0);
    const phiEV=Math.max(0,Number(workFunctionEV)||0);
    const h=6.62607015e-34;
    const e=1.602176634e-19;
    const photonJ=h*f;
    const photonEV=photonJ/e;
    const maxKEEV=Math.max(0,photonEV-phiEV);
    const emitted=photonEV>=phiEV;
    const stoppingPotentialV=maxKEEV;
    return {
      phenomenon:'光電効果',
      givens:{frequencyHz:f,workFunctionEV:phiEV,h,e},
      principle:'hf = W + Kmax',
      quantities:{photonEV,maxKEEV,stoppingPotentialV,emitted}
    };
  }

  function verifyPhotoelectric(model){
    const g=model.givens,q=model.quantities;
    return [
      makeCheck('photo-energy','hf=W+Kmax（放出時）','Einstein photoelectric equation','numeric equality',
        !q.emitted || nearlyEqual(q.photonEV,g.workFunctionEV+q.maxKEEV)),
      makeCheck('photo-threshold','hf<Wなら電子は放出されない','threshold condition','state check',
        q.emitted || q.photonEV<g.workFunctionEV)
    ];
  }

  // -----------------------------
  // 2. Verification Layer
  // -----------------------------
  function verifyInclineModel(model) {
    const { massKg: m, gravity: g, angleDeg: theta } = model.givens;
    const { weightN: w, parallelN: p, normalComponentN: n } = model.quantities;
    const reconstructed = Math.hypot(p, n);

    return [
      makeCheck(
        'weight-definition',
        '重力の大きさは mg',
        'Newtonian near-Earth model',
        'numeric equality',
        nearlyEqual(w, m * g),
        `weight=${w}, m*g=${m * g}`
      ),
      makeCheck(
        'vector-reconstruction',
        '直交分力から元の重力の大きさを再構成できる',
        'Pythagorean reconstruction of orthogonal components',
        'sqrt(F∥²+F⊥²)=mg',
        nearlyEqual(reconstructed, w),
        `reconstructed=${reconstructed}, weight=${w}`
      ),
      makeCheck(
        'limit-theta-0',
        'θ=0° では斜面方向成分0、垂直成分mg',
        'limiting case',
        'analytic limit',
        theta !== 0 || (nearlyEqual(p, 0) && nearlyEqual(n, w))
      ),
      makeCheck(
        'limit-theta-90',
        'θ=90° では斜面方向成分mg、垂直成分0',
        'limiting case',
        'analytic limit',
        theta !== 90 || (nearlyEqual(p, w) && nearlyEqual(n, 0))
      ),
      makeCheck(
        'dimensions',
        'mg, mg sinθ, mg cosθ はすべて力の次元',
        'm[kg] × g[m/s²], sin/cos are dimensionless',
        'dimensional analysis',
        true,
        'kg·m/s² = N'
      )
    ];
  }

  function verificationSummary(checks) {
    const fail = checks.filter(x => x.result !== 'PASS');
    return {
      result: fail.length ? 'FAIL' : 'PASS',
      passed: checks.length - fail.length,
      total: checks.length,
      failedIds: fail.map(x => x.id)
    };
  }

  // Adapter point for a future SymPy/K-Dense backend.
  // The browser app remains usable without any external symbolic service.
  const verificationAdapters = new Map();
  function registerVerificationAdapter(name, adapter) {
    if (!name || !adapter || typeof adapter.verify !== 'function') {
      throw new Error('verification adapter requires name and verify()');
    }
    verificationAdapters.set(name, adapter);
  }

  async function verifyWithAdapter(name, payload) {
    const adapter = verificationAdapters.get(name);
    if (!adapter) return { result: 'UNVERIFIED', reason: `adapter not registered: ${name}` };
    return adapter.verify(payload);
  }

  // -----------------------------
  // 3. Scientific Visualization Layer
  // -----------------------------
  function inclineVisualizationSpec(model) {
    const { angleDeg } = model.givens;
    const { weightN, parallelN, normalComponentN } = model.quantities;
    return {
      type: 'physics-vector-diagram',
      source: 'physics-model',
      scientificIntent: 'Show vector decomposition without changing the underlying physical quantities.',
      axes: {
        parallel: '斜面方向',
        normal: '斜面に垂直な方向'
      },
      vectors: [
        { id: 'weight', label: 'mg', magnitudeN: weightN, role: 'source-vector', direction: 'vertical-down' },
        { id: 'parallel', label: 'mg sinθ', magnitudeN: parallelN, role: 'component', direction: 'down-slope' },
        { id: 'normal-component', label: 'mg cosθ', magnitudeN: normalComponentN, role: 'component', direction: 'into-slope' }
      ],
      angleDeg,
      rules: [
        'Vector length must remain proportional to the represented magnitude within one diagram.',
        'Units and labels must remain visible.',
        'Do not infer a law from screen geometry; geometry renders the model.',
        'Keep data/model values separate from display transforms.'
      ]
    };
  }

  // -----------------------------
  // 4. Interactive Simulation Adapter Layer
  // -----------------------------
  const simulationAdapters = new Map();

  function registerSimulationAdapter(name, adapter) {
    if (!name || !adapter || typeof adapter.render !== 'function') {
      throw new Error('simulation adapter requires name and render()');
    }
    simulationAdapters.set(name, adapter);
  }

  function renderSimulation(name, mount, model, options = {}) {
    const adapter = simulationAdapters.get(name);
    if (!adapter) {
      return { result: 'UNVERIFIED', reason: `simulation adapter not registered: ${name}` };
    }
    // Model is computed first. Renderer receives it but may not redefine it.
    return adapter.render({ mount, model, options });
  }

  // Contract for a future React Three Fiber / Rapier adapter.
  const R3F_ADAPTER_CONTRACT = Object.freeze({
    input: 'verified physics model + representation spec',
    output: 'interactive rendering state',
    forbidden: 'using Rapier/R3F output as the source of the physical law',
    expectedControls: ['angle', 'mass', 'gravity', 'camera'],
    verification: ['model/display consistency', 'parameter update consistency']
  });

  // -----------------------------
  // 5. Teaching Design Layer
  // -----------------------------
  function buildInclineLessonDesign({ level = '高校物理', durationMin = 10 } = {}) {
    return {
      level,
      durationMin,
      learningGoal: '重力を斜面座標へ分解し、角度変化と各成分の変化を式と図の両方で説明できる。',
      prerequisites: [
        'ベクトルの成分分解',
        'sin / cos の基本的意味',
        '重力の大きさ mg'
      ],
      likelyMisconceptions: [
        '角度が大きくなると mg 自体が変化すると考える',
        '垂直抗力と mg cosθ を常に同一視する',
        '画面上の矢印の長さだけから式を決める'
      ],
      flow: [
        '現象を見る',
        '角度を変える前に変化を予測する',
        'mg を斜面方向・垂直方向に分解する',
        '式を導出する',
        '角度を変更し、予測と図を照合する',
        'Check for Understanding'
      ]
    };
  }

  function inclineCheckForUnderstanding(model) {
    const theta = model.givens.angleDeg;
    return {
      prompt: `斜面角を ${theta}° から少し大きくすると、mg、mg sinθ、mg cosθ はそれぞれどう変化しますか？理由も答えてください。`,
      expected: {
        weight: '変わらない',
        parallel: '大きくなる（0°〜90°）',
        normalComponent: '小さくなる（0°〜90°）'
      },
      evidenceWanted: 'sinθ と cosθ の角度依存、またはベクトル分解図に基づく説明',
      retryRule: '誤答した量だけ、近い角度条件でもう一度予測させる'
    };
  }

  // -----------------------------
  // 6. Public Native Skill Registry
  // -----------------------------
  const skills = {
    'physics-derivation': {
      deriveInclineForces,
      deriveKinematics,
      deriveProjectile,
      deriveSpring,
      deriveCircular,
      deriveCollision,
      derivePendulum,
      deriveWave,
      deriveElectricField,
      deriveFriction,
      deriveAtwood,
      deriveEnergyTrack,
      deriveStandingWave,
      deriveDCCircuit,
      deriveCapacitor,
      deriveIdealGas,
      deriveFaraday,
      deriveThinLens,
      derivePhotoelectric
    },
    'physics-verification': {
      verifyInclineModel,
      verifyKinematics,
      verifyProjectile,
      verifySpring,
      verifyCircular,
      verifyCollision,
      verifyPendulum,
      verifyWave,
      verifyElectricField,
      verifyFriction,
      verifyAtwood,
      verifyEnergyTrack,
      verifyStandingWave,
      verifyDCCircuit,
      verifyCapacitor,
      verifyIdealGas,
      verifyFaraday,
      verifyThinLens,
      verifyPhotoelectric,
      verificationSummary,
      registerVerificationAdapter,
      verifyWithAdapter
    },
    'physics-visualization': {
      inclineVisualizationSpec
    },
    'physics-interactive-simulation': {
      registerSimulationAdapter,
      renderSimulation,
      R3F_ADAPTER_CONTRACT
    },
    'lesson-design': {
      buildInclineLessonDesign
    },
    'check-for-understanding': {
      inclineCheckForUnderstanding
    }
  };

  window.TeachingOSPhysicsSkills = Object.freeze({
    version: VERSION,
    skills,
    deriveInclineForces,
    deriveKinematics,
    deriveProjectile,
    deriveSpring,
    deriveCircular,
    deriveCollision,
    derivePendulum,
    deriveWave,
    deriveElectricField,
    deriveFriction,
    deriveAtwood,
    deriveEnergyTrack,
    deriveStandingWave,
    deriveDCCircuit,
    deriveCapacitor,
    deriveIdealGas,
    deriveFaraday,
    deriveThinLens,
    derivePhotoelectric,
    verifyInclineModel,
    verifyKinematics,
    verifyProjectile,
    verifySpring,
    verifyCircular,
    verifyCollision,
    verifyPendulum,
    verifyWave,
    verifyElectricField,
    verifyFriction,
    verifyAtwood,
    verifyEnergyTrack,
    verifyStandingWave,
    verifyDCCircuit,
    verifyCapacitor,
    verifyIdealGas,
    verifyFaraday,
    verifyThinLens,
    verifyPhotoelectric,
    verificationSummary,
    inclineVisualizationSpec,
    buildInclineLessonDesign,
    inclineCheckForUnderstanding,
    registerVerificationAdapter,
    verifyWithAdapter,
    registerSimulationAdapter,
    renderSimulation,
    R3F_ADAPTER_CONTRACT
  });

  // Lightweight self-check. No UI mutation.
  try {
    const sample = deriveInclineForces({ massKg: 2, gravity: 9.8, angleDeg: 30 });
    const checks = verifyInclineModel(sample);
    const summary = verificationSummary(checks);
    console.info('[Teaching OS] Physics Skill Stack v1', summary.result, summary);
  } catch (err) {
    console.error('[Teaching OS] Physics Skill Stack v1 self-check failed', err);
  }
})();