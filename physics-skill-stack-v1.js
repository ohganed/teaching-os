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
      deriveCircular
    },
    'physics-verification': {
      verifyInclineModel,
      verifyKinematics,
      verifyProjectile,
      verifySpring,
      verifyCircular,
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
    verifyInclineModel,
    verifyKinematics,
    verifyProjectile,
    verifySpring,
    verifyCircular,
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