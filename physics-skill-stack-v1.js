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
      deriveInclineForces
    },
    'physics-verification': {
      verifyInclineModel,
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
    verifyInclineModel,
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