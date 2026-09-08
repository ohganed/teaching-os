/* Teaching OS v0.32.3 — Physics Component Rotation */
(() => {
  'use strict';

  const VERSION = 'v0.32.3 Physics Rotation';
  const VECTOR_KINDS = new Set(['forceVector','resultantVector','componentVector']);
  const $ = id => document.getElementById(id);
  const clampAngle = v => {
    let n = Number(v) || 0;
    while (n > 180) n -= 360;
    while (n < -180) n += 360;
    return Math.round(n * 10) / 10;
  };

  function selectedItem(){
    return (window.items || []).find(it => it.id === window.selectedId);
  }

  function isRotatable(it){
    return !!it && it.physicsKind && !VECTOR_KINDS.has(it.physicsKind);
  }

  function applyRotationToDom(){
    const list = window.items || [];
    for (const it of list){
      if (!it.physicsKind || VECTOR_KINDS.has(it.physicsKind)) continue;
      const el = document.querySelector(`.item[data-id="${CSS.escape(it.id)}"]`);
      if (!el) continue;
      const a = Number(it.rotation || 0);
      el.style.transformOrigin = '50% 50%';
      el.style.transform = `rotate(${a}deg)`;
    }
    updateRotationUi();
  }

  function setRotation(value, quiet=false){
    const it = selectedItem();
    if (!isRotatable(it)){
      setStatus('回転する物理パーツを選択してください。力の矢印は方向を直接描いて調整します。', true);
      return;
    }
    it.rotation = clampAngle(value);
    applyRotationToDom();
    try { window.saveState?.(); } catch {}
    try {
      if (window.activeScreenId === window.liveScreenId && !window.liveFrozen) window.refreshLiveSnapshot?.(false);
    } catch {}
    if (!quiet) setStatus(`回転角 ${it.rotation}°`);
  }

  function rotateBy(delta){
    const it = selectedItem();
    if (!isRotatable(it)){
      setStatus('回転する物理パーツを選択してください。', true);
      return;
    }
    setRotation((Number(it.rotation)||0) + delta);
  }

  function updateRotationUi(){
    const it = selectedItem();
    const input = $('pvRotationInput');
    const range = $('pvRotationRange');
    const label = $('pvRotationCurrent');
    const enabled = isRotatable(it);
    const angle = enabled ? Number(it.rotation || 0) : 0;
    if (input){ input.value = angle; input.disabled = !enabled; }
    if (range){ range.value = angle; range.disabled = !enabled; }
    if (label) label.textContent = enabled ? `${angle}°` : '—';
  }

  function setStatus(msg,error=false){
    const node = $('pvRotationStatus') || $('pvStatus');
    if (!node) return;
    node.textContent = msg;
    node.style.color = error ? '#ffb4b4' : '#bfe0ff';
  }

  function installPanel(){
    if ($('physicsRotationPanel')) return;
    const anchor = $('physicsVectorToolsPanel') || $('physicsPartsPanel');
    if (!anchor) return;

    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.id = 'physicsRotationPanel';
    panel.innerHTML = `
      <h2>↻ 物理パーツを回転</h2>
      <div class="col">
        <div class="physics-note">斜面・物体・ばね・滑車・棒・座標軸などを自由に回転できます。力の矢印は作図方向そのものが向きになるため、この回転機能の対象外です。</div>
        <div class="row" style="align-items:center">
          <input id="pvRotationRange" type="range" min="-180" max="180" step="1" value="0" style="flex:1;min-width:150px">
          <strong id="pvRotationCurrent" style="min-width:48px;text-align:right">—</strong>
        </div>
        <div class="row">
          <button class="btn small" id="pvRotMinus90">−90°</button>
          <button class="btn small" id="pvRotMinus15">−15°</button>
          <button class="btn small" id="pvRotReset">0°</button>
          <button class="btn small" id="pvRotPlus15">＋15°</button>
          <button class="btn small" id="pvRotPlus90">＋90°</button>
        </div>
        <div class="field"><label>角度を直接入力（°）</label><input id="pvRotationInput" type="number" min="-180" max="180" step="1" value="0"></div>
        <div id="pvRotationStatus" class="status">物理パーツを選択すると回転できます。</div>
      </div>`;
    anchor.insertAdjacentElement('afterend', panel);

    $('pvRotationRange').addEventListener('input', e => setRotation(e.target.value, true));
    $('pvRotationRange').addEventListener('change', e => setRotation(e.target.value));
    $('pvRotationInput').addEventListener('change', e => setRotation(e.target.value));
    $('pvRotMinus90').onclick = () => rotateBy(-90);
    $('pvRotMinus15').onclick = () => rotateBy(-15);
    $('pvRotReset').onclick = () => setRotation(0);
    $('pvRotPlus15').onclick = () => rotateBy(15);
    $('pvRotPlus90').onclick = () => rotateBy(90);
    updateRotationUi();
  }

  function wrapRender(){
    if (window.__teachingOsRotationWrapped) return;
    if (typeof window.renderAll !== 'function') return;
    const original = window.renderAll;
    window.renderAll = function(...args){
      const result = original.apply(this,args);
      requestAnimationFrame(applyRotationToDom);
      return result;
    };
    window.__teachingOsRotationWrapped = true;
  }

  function wrapSelection(){
    if (window.__teachingOsRotationSelectionWrapped) return;
    if (typeof window.selectItem === 'function'){
      const original = window.selectItem;
      window.selectItem = function(...args){
        const r = original.apply(this,args);
        requestAnimationFrame(updateRotationUi);
        return r;
      };
    }
    if (typeof window.selectItemWithoutRender === 'function'){
      const original2 = window.selectItemWithoutRender;
      window.selectItemWithoutRender = function(...args){
        const r = original2.apply(this,args);
        requestAnimationFrame(updateRotationUi);
        return r;
      };
    }
    window.__teachingOsRotationSelectionWrapped = true;
  }

  function init(){
    installPanel();
    wrapRender();
    wrapSelection();
    applyRotationToDom();
    const version = document.querySelector('.version');
    if (version) version.textContent = VERSION;
    const slideNode = window.slide || document.querySelector('.slide');
    if (slideNode){
      const observer = new MutationObserver(() => requestAnimationFrame(applyRotationToDom));
      observer.observe(slideNode,{childList:true,subtree:false});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init,0));
  else setTimeout(init,0);
})();
