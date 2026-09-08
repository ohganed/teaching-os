(() => {
  const ids=['physicsLibraryPanel','physicsPartsPanel','physicsVectorToolsPanel','physicsRotationPanel'];
  const labels={'physicsLibraryPanel':'📚 図版','physicsPartsPanel':'🧩 部品','physicsVectorToolsPanel':'➜ ベクトル','physicsRotationPanel':'↻ 回転'};
  function install(){
    if(document.getElementById('physicsCompactTabs')) return;
    const panels=ids.map(id=>document.getElementById(id)).filter(Boolean);
    if(panels.length<2) return;
    const nav=document.createElement('div');
    nav.id='physicsCompactTabs';
    nav.style.cssText='position:sticky;top:8px;z-index:80;background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:6px;margin:8px 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px';
    function show(id){
      panels.forEach(p=>p.style.display=p.id===id?'':'none');
      nav.querySelectorAll('button').forEach(b=>b.classList.toggle('primary',b.dataset.target===id));
    }
    panels.forEach(p=>{
      const b=document.createElement('button');
      b.className='btn small';
      b.dataset.target=p.id;
      b.textContent=labels[p.id]||p.id;
      b.style.minHeight='44px';
      b.onclick=()=>show(p.id);
      nav.appendChild(b);
    });
    panels[0].parentNode.insertBefore(nav,panels[0]);
    show(document.getElementById('physicsLibraryPanel')?'physicsLibraryPanel':panels[0].id);
    const v=document.querySelector('.version'); if(v) v.textContent='v0.32.5 Compact Physics Tabs';
  }
  let n=0; const t=setInterval(()=>{n++; install(); if(document.getElementById('physicsCompactTabs')||n>50) clearInterval(t);},100);
})();