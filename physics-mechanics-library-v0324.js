/* Teaching OS v0.32.4 — Mechanics Library + Basic Shapes */
(() => {
'use strict';
const VERSION='v0.32.4 Mechanics Library';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=(p='mech')=>p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
const CATS=[['all','すべて'],['basic','基本'],['force','力'],['motion','運動'],['projectile','落下・投射'],['incline','斜面'],['spring','ばね・振動'],['pulley','糸・滑車'],['circular','円運動'],['momentum','衝突・運動量'],['rigid','剛体'],['energy','エネルギー'],['graph','グラフ']];
const LIB=[
['block','物体','basic'],['cart','台車','basic'],['ground','水平面','basic'],['wall','壁','basic'],['rope','糸','basic'],['localAxes','座標軸','basic'],
['forceFree','自由物体図','force'],['forceBalance','力のつり合い','force'],['twoBlocks','2物体','force'],
['constantVelocity','等速直線運動','motion'],['acceleration','加速度運動','motion'],['freeFall','自由落下','projectile'],['horizontalProjectile','水平投射','projectile'],['obliqueProjectile','斜方投射','projectile'],
['slope','斜面','incline'],['inclineBlock','斜面上の物体','incline'],['inclineFriction','斜面＋摩擦','incline'],
['spring','ばね','spring'],['horizontalSpring','水平ばね振り子','spring'],['verticalSpring','鉛直ばね','spring'],['pendulum','単振り子','spring'],
['fixedPulley','定滑車','pulley'],['movablePulley','動滑車','pulley'],['atwood','アトウッドの装置','pulley'],
['circle','円軌道','circular'],['circularMotion','円運動','circular'],['verticalCircle','鉛直面内の円運動','circular'],
['collision','衝突','momentum'],['separation','分裂・反発','momentum'],['ballisticPendulum','弾道振り子','momentum'],
['rod','棒','rigid'],['lever','てこ・支点','rigid'],['torque','力のモーメント','rigid'],['centerMass','重心','rigid'],
['height','高さ h','energy'],['energySlope','力学的エネルギー','energy'],
['xtGraph','x–t グラフ','graph'],['vtGraph','v–t グラフ','graph'],['atGraph','a–t グラフ','graph']
].map(([id,name,cat])=>({id,name,cat}));

function data(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}
function svgWrap(body,w=260,h=180){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`;}
function genericSvg(kind){
 const k=esc(kind); const common='stroke="#182235" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"';
 const maps={
 ground:`<line x1="20" y1="120" x2="240" y2="120" ${common}/><path d="M30 120l-14 18m40-18l-14 18m40-18l-14 18m40-18l-14 18m40-18l-14 18m40-18l-14 18m40-18l-14 18" ${common}/>`,
 wall:`<line x1="80" y1="20" x2="80" y2="160" ${common}/><path d="M80 35l-18-14m18 42L62 49m18 42L62 77m18 42l-18-14m18 42l-18-14" ${common}/>`,
 rope:`<path d="M20 90 C70 45 120 135 240 90" ${common}/>`,
 circle:`<circle cx="130" cy="90" r="65" ${common}/><circle cx="130" cy="90" r="5" fill="#182235"/>`,
 rod:`<rect x="25" y="75" width="210" height="30" rx="8" fill="#d9e4f5" stroke="#182235" stroke-width="5"/>`,
 spring:`<path d="M20 90h20l10-22 18 44 18-44 18 44 18-44 18 44 18-44 18 44 18-44 12 22h28" ${common}/>`
 };
 return svgWrap(maps[k]||`<rect x="45" y="45" width="170" height="90" rx="10" fill="#e8eef8" stroke="#182235" stroke-width="5"/><text x="130" y="100" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#182235">${k}</text>`);
}
function addSvgItem(svg,caption,kind,x=190,y=170,w=300,h=210){
 const it={id:uid(),type:'image',src:data(svg),caption,x,y,w,h,step:Math.max(0,window.currentStep||0),z:++window.zCounter,physicsKind:kind,rotation:0};
 window.items.push(it); window.selectedId=it.id; window.renderAll(); window.saveState(); return it;
}
function addPart(kind,name){
 try{ if(typeof window.addPhysicsPart==='function' && ['block','cart','slope','spring','pendulum','fixedPulley','movablePulley','localAxes'].includes(kind)){window.addPhysicsPart(kind);return;} }catch{}
 addSvgItem(genericSvg(kind),name,kind);
}
function addTemplate(id,name){
 const ox=120,oy=120;
 const part=(k,n,x,y,w,h)=>{try{ if(typeof window.addPhysicsPart==='function'){window.addPhysicsPart(k,x,y,w,h,window.currentStep);return;} }catch{} addSvgItem(genericSvg(k),n,k,x,y,w,h);};
 switch(id){
  case'inclineBlock': part('slope','斜面',ox,oy+150,430,295);part('block','物体',ox+220,oy+90,150,105);break;
  case'inclineFriction': part('slope','斜面',ox,oy+150,430,295);part('block','物体',ox+220,oy+90,150,105);part('localAxes','座標軸',ox+390,oy+20,220,150);break;
  case'horizontalSpring': part('spring','ばね',ox+100,oy+150,300,120);part('block','物体',ox+380,oy+150,140,100);part('ground','水平面',ox+50,oy+245,520,100);break;
  case'verticalSpring': part('spring','ばね',ox+280,oy,130,300);part('block','物体',ox+275,oy+290,140,100);break;
  case'atwood': part('fixedPulley','定滑車',ox+260,oy,180,180);part('block','物体A',ox+130,oy+270,120,100);part('block','物体B',ox+450,oy+270,120,100);break;
  case'circularMotion': part('circle','円軌道',ox+220,oy+40,300,300);part('block','物体',ox+470,oy+150,90,70);break;
  case'verticalCircle': part('circle','円軌道',ox+220,oy+20,300,300);part('block','物体',ox+325,oy+5,80,60);break;
  case'collision': part('cart','物体A',ox+80,oy+180,170,110);part('cart','物体B',ox+390,oy+180,170,110);part('ground','水平面',ox+40,oy+270,600,80);break;
  case'lever': part('rod','棒',ox+100,oy+150,500,100);addSvgItem(svgWrap('<path d="M130 150 L80 170 L180 170 Z" fill="#d9e4f5" stroke="#182235" stroke-width="5"/>'), '支点','fulcrum',ox+270,oy+210,180,120);break;
  case'energySlope': part('slope','斜面',ox+100,oy+100,430,295);part('block','物体',ox+250,oy+50,140,100);part('height','高さ h',ox+540,oy+100,140,260);break;
  default: addPart(id,name);
 }
 window.saveState();
}
function shapeSvg(kind){const s='stroke="#182235" stroke-width="5" fill="rgba(110,160,220,.10)"';const a={line:'<line x1="25" y1="90" x2="235" y2="90" stroke="#182235" stroke-width="5"/>',dash:'<line x1="25" y1="90" x2="235" y2="90" stroke="#182235" stroke-width="5" stroke-dasharray="14 10"/>',rect:`<rect x="35" y="35" width="190" height="110" rx="3" ${s}/>`,circle:`<circle cx="130" cy="90" r="65" ${s}/>`,ellipse:`<ellipse cx="130" cy="90" rx="95" ry="55" ${s}/>`,triangle:`<path d="M130 25 L225 150 L35 150 Z" ${s}/>`,point:'<circle cx="130" cy="90" r="9" fill="#182235"/>',arc:'<path d="M45 125 A95 95 0 0 1 215 125" fill="none" stroke="#182235" stroke-width="5"/>',axis:'<path d="M25 145V25m0 120h210" fill="none" stroke="#182235" stroke-width="5"/><path d="M25 25l-8 16m8-16l8 16M235 145l-16-8m16 8l-16 8" fill="none" stroke="#182235" stroke-width="4"/>',angle:'<path d="M45 145h170M45 145l135-100M95 145A50 50 0 0 0 85 115" fill="none" stroke="#182235" stroke-width="5"/><text x="105" y="125" font-size="25">θ</text>'};return svgWrap(a[kind]||a.rect);}
function addShape(k,n){addSvgItem(shapeSvg(k),n,'basicShape:'+k,220,190,260,180);}
function install(){
 if($('physicsLibraryPanel'))return; const anchor=$('physicsPartsPanel');if(!anchor)return;
 const panel=document.createElement('section');panel.className='panel';panel.id='physicsLibraryPanel';panel.innerHTML=`<h2>📚 Physics Library</h2><div class="physics-note">高校力学の教科書でよく使う図を、部品＋編集可能なテンプレートとして配置します。</div><input id="mechSearch" placeholder="図を検索：滑車、斜面、衝突…" style="width:100%;min-height:44px;margin:8px 0"><div id="mechTabs" class="row" style="overflow-x:auto;flex-wrap:nowrap;padding-bottom:6px"></div><div id="mechGrid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:8px"></div><details style="margin-top:12px" open><summary style="font-weight:800;cursor:pointer">✏️ 基本図形</summary><div id="shapeGrid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:8px"></div></details><div id="mechStatus" class="status">図を選ぶとStudent Viewへ追加します。</div>`;
 anchor.insertAdjacentElement('afterend',panel);let cat='all';
 const tabs=$('mechTabs');CATS.forEach(([id,n])=>{const b=document.createElement('button');b.className='btn small';b.textContent=n;b.onclick=()=>{cat=id;render();};tabs.appendChild(b)});
 function render(){const q=($('mechSearch').value||'').trim().toLowerCase();const g=$('mechGrid');g.innerHTML='';LIB.filter(x=>(cat==='all'||x.cat===cat)&&(!q||x.name.toLowerCase().includes(q))).forEach(x=>{const b=document.createElement('button');b.className='btn small';b.style.minHeight='48px';b.textContent=x.name;b.onclick=()=>{addTemplate(x.id,x.name);$('mechStatus').textContent=`${x.name} を追加しました。`;};g.appendChild(b)});}
 $('mechSearch').oninput=render;render();
 [['line','直線'],['dash','点線'],['rect','長方形'],['circle','円'],['ellipse','楕円'],['triangle','三角形'],['point','点'],['arc','円弧'],['axis','座標軸'],['angle','角度']].forEach(([k,n])=>{const b=document.createElement('button');b.className='btn small';b.style.minHeight='44px';b.textContent=n;b.onclick=()=>addShape(k,n);$('shapeGrid').appendChild(b)});
 const ver=document.querySelector('.version');if(ver)ver.textContent=VERSION;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();