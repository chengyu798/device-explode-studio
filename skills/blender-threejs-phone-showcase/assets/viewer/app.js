import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { createStudioEnvironment } from './studio-environment.js';
import { applyExplosion, COMPONENTS, BODY, SOURCE } from './model.js';
import { loadBlenderModel } from './load-blender.js';
import { applyFinish } from './finishes.js';

const $=s=>document.querySelector(s);
const icons={download:'<path d="M9 2v9m-3-3 3 3 3-3M3 12v3h12v-3"/>',reset:'<path d="M3 6a6 6 0 1 1-.5 5M3 2v4h4"/>',tag:'<path d="m2 3 6-1 8 8-6 6-8-8Z"/><circle cx="6" cy="6" r="1"/>',rotate:'<path d="M14 5a6 6 0 1 0 1 6M14 1v4h-4"/><path d="m7 6 4 3-4 3Z"/>',mouse:'<rect x="4" y="1" width="10" height="16" rx="5"/><path d="M9 4v3"/>',search:'<circle cx="7.5" cy="7.5" r="5"/><path d="m11 11 5 5"/>',eye:'<path d="M1 9s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z"/><circle cx="9" cy="9" r="2"/>',eyeOff:'<path d="m2 2 14 14M4 5C2 6 1 9 1 9s3 5 8 5c1 0 2-.2 3-.6M7 4.2C8 4 8 4 9 4c5 0 8 5 8 5s-.8 1.4-2.4 2.7"/>',focus:'<path d="M2 6V2h4m6 0h4v4m0 6v4h-4M6 16H2v-4"/><circle cx="9" cy="9" r="3"/>'};
const svg=name=>`<svg viewBox="0 0 18 18" aria-hidden="true">${icons[name]||''}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=svg(el.dataset.icon));
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200);}

try { await start(); }
catch(error){console.error(error);const loading=$('#loading');loading.innerHTML='';const text=document.createElement('p');text.textContent='三维视图未能启动。请使用支持 WebGL 2 的浏览器，并启用图形加速。';text.style.cssText='max-width:340px;line-height:1.9;padding:20px';loading.append(text);$('#export').disabled=true;}

async function start(){
  const viewport=$('#viewport');
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.setClearColor(0x000000,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label','iPhone 17 Pro Max 国行结构复原模型，可拖动旋转，滚轮或双指缩放');renderer.domElement.setAttribute('role','img');
  viewport.prepend(renderer.domElement);
  const scene=new THREE.Scene();
  const pmrem=new THREE.PMREMGenerator(renderer);const room=createStudioEnvironment();const env=pmrem.fromScene(room,.02);scene.environment=env.texture;scene.environmentIntensity=.85;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#f1f3f5','#303840',.28));
  const key=new THREE.DirectionalLight('#ffffff',1.6);key.position.set(-190,180,-260);scene.add(key);
  const fill=new THREE.DirectionalLight('#e8efff',.45);fill.position.set(220,-60,-140);scene.add(fill);
  const edge=new THREE.DirectionalLight('#ffffff',1.1);edge.position.set(-130,80,230);scene.add(edge);
  const camera=new THREE.PerspectiveCamera(35,1,25,2500);
  camera.position.set(-150,85,-650);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=180;controls.maxDistance=1600;controls.autoRotateSpeed=.5;controls.enablePan=true;controls.target.set(0,0,35);
  const model=await loadBlenderModel();scene.add(model.root);const parts=model.parts;
  applyFinish(model.finishMaterials,'silver');
  const state={target:0,current:0,selected:null,isolated:false,hidden:new Set(),labels:true,finish:'silver'};
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const labelElements=new Map();
  for(const part of parts.values()){
    part.node.traverse(obj=>{if(obj.isMesh){obj.userData.baseEmissive=obj.material.emissive?.clone();obj.userData.baseEmissiveIntensity=obj.material.emissiveIntensity;}});
    if(part.label){const button=document.createElement('button');button.className='model-label';button.setAttribute('aria-label',`查看${part.name}`);button.innerHTML=`<span class="label-index">${String(COMPONENTS.findIndex(p=>p.id===part.id)+1).padStart(2,'0')}</span><span>${part.name}</span>`;button.addEventListener('click',()=>selectPart(part.id));$('#labels').append(button);labelElements.set(part.id,button);}
  }
  $('#parts-count').textContent=parts.size;$('#component-count').textContent=`${parts.size} ASSEMBLIES`;
  const orderedSections=['外部与密封','核心组件','声音与触觉','连接与机身','盖板与支撑件'];
  function renderList(){
    const query=$('#search').value.trim().toLowerCase();const list=$('#part-list');list.replaceChildren();let found=0;
    for(const section of orderedSections){
      const filtered=COMPONENTS.filter(p=>p.section===section&&`${p.name} ${p.en} ${p.id} ${p.code||''}`.toLowerCase().includes(query));if(!filtered.length)continue;
      const head=document.createElement('div');head.className='group-heading';head.innerHTML=`<span>${section}</span><span>${String(filtered.length).padStart(2,'0')}</span>`;list.append(head);
      for(const meta of filtered){found++;const index=COMPONENTS.findIndex(p=>p.id===meta.id)+1;const row=document.createElement('div');row.className=`part-row${state.selected===meta.id?' selected':''}${state.hidden.has(meta.id)?' is-hidden':''}`;row.dataset.part=meta.id;
        const button=document.createElement('button');button.className='part-select';button.setAttribute('aria-pressed',String(state.selected===meta.id));button.innerHTML=`<span class="part-number">${String(index).padStart(2,'0')}</span><span class="part-dot" style="--part-color:${meta.color}"></span><span class="part-copy"><span class="part-name">${meta.name}</span><span class="part-english">${meta.en}</span></span>`;button.addEventListener('click',()=>selectPart(meta.id));
        const visibility=document.createElement('button');visibility.className='visibility-button';const hidden=state.hidden.has(meta.id);visibility.setAttribute('aria-label',`${hidden?'显示':'隐藏'}${meta.name}`);visibility.title=`${hidden?'显示':'隐藏'}${meta.name}`;visibility.innerHTML=svg(hidden?'eyeOff':'eye');visibility.addEventListener('click',()=>{hidden?state.hidden.delete(meta.id):state.hidden.add(meta.id);updateVisibility();renderList();if(state.selected===meta.id)renderDetail();});row.append(button,visibility);list.append(row);
      }
    }
    $('#no-results').hidden=found>0;
  }
  function updateVisibility(){for(const part of parts.values())part.node.visible=!state.hidden.has(part.id)&&(!state.isolated||state.selected===part.id);$('.stage').classList.toggle('is-isolated',state.isolated);}
  function renderDetail(){
    const part=parts.get(state.selected);if(!part)return;const number=String(COMPONENTS.findIndex(p=>p.id===part.id)+1).padStart(2,'0');const detail=$('#detail');detail.innerHTML=`<div class="detail-id">COMPONENT ${number} / ${part.en}</div><h3>${part.name}</h3>${part.code?`<div class="part-code">${part.code}</div>`:''}<p>${part.description}</p><p class="estimate-info">几何估算：${part.estimate}</p><div class="detail-actions"><button id="isolate" class="${state.isolated?'active':''}">${svg('focus')}${state.isolated?'返回全部':'单独查看'}</button><button id="detail-hide">${svg(state.hidden.has(part.id)?'eyeOff':'eye')}${state.hidden.has(part.id)?'显示':'隐藏'}</button><a href="${part.source||SOURCE}" target="_blank" rel="noopener">依据 ↗</a></div><div class="detail-footer"><span class="estimate-dot"></span>参考图重建 · 未实测</div>`;
    $('#isolate').addEventListener('click',()=>{state.isolated=!state.isolated;state.hidden.delete(part.id);updateVisibility();renderList();renderDetail();fitTo(state.isolated?part.node:model.root,false);toast(state.isolated?`正在单独查看：${part.name}`:'已恢复全部组件');});
    $('#detail-hide').addEventListener('click',()=>{state.hidden.has(part.id)?state.hidden.delete(part.id):state.hidden.add(part.id);if(state.isolated&&state.hidden.has(part.id))state.isolated=false;updateVisibility();renderList();renderDetail();});
  }
  function selectPart(id){
    if(!parts.has(id))return;state.selected=id;state.hidden.delete(id);updateVisibility();
    for(const p of parts.values())p.node.traverse(obj=>{if(!obj.isMesh||!obj.material.emissive)return;const base=obj.userData.baseEmissive;obj.material.emissive.copy(base);obj.material.emissiveIntensity=obj.userData.baseEmissiveIntensity;if(p.id===id){obj.material.emissive.add(new THREE.Color('#462c19'));obj.material.emissiveIntensity=Math.max(.14,obj.material.emissiveIntensity);}});
    for(const [key,el]of labelElements)el.classList.toggle('selected',key===id);
    setTab('parts');renderList();renderDetail();
  }
  function setTab(which){const p=which==='parts';$('#parts-panel').hidden=!p;$('#sources-panel').hidden=p;$('#parts-tab').classList.toggle('active',p);$('#sources-tab').classList.toggle('active',!p);$('#parts-tab').setAttribute('aria-selected',String(p));$('#sources-tab').setAttribute('aria-selected',String(!p));}
  $('#parts-tab').addEventListener('click',()=>setTab('parts'));$('#sources-tab').addEventListener('click',()=>setTab('sources'));
  document.querySelectorAll('[role=tab]').forEach(tab=>tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const isParts=tab.id==='parts-tab';setTab(isParts?'sources':'parts');$(isParts?'#sources-tab':'#parts-tab').focus();}}));
  $('#search').addEventListener('input',renderList);
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();setTab('parts');$('#search').focus();}if(event.key==='Escape'&&document.activeElement===$('#search')){$('#search').value='';renderList();$('#search').blur();}});

  function setStage(value){const needsFit=(state.target===0)!==(value===0);state.target=THREE.MathUtils.clamp(value,0,1);$('#explode').value=Math.round(state.target*100);$('#explode').style.setProperty('--progress',`${Math.round(state.target*100)}%`);$('#explode-value').textContent=Math.round(state.target*100);document.querySelectorAll('[data-stage]').forEach(el=>el.classList.toggle('active',Math.abs(Number(el.dataset.stage)-value)<.005));if(reduced){state.current=state.target;applyExplosion(parts,state.current);}if(needsFit&&!state.isolated)fitFull();}
  $('#explode').addEventListener('input',event=>setStage(Number(event.target.value)/100));
  document.querySelectorAll('[data-stage]').forEach(el=>el.addEventListener('click',()=>setStage(Number(el.dataset.stage))));
  $('#labels-toggle').addEventListener('click',()=>{state.labels=!state.labels;$('#labels-toggle').classList.toggle('active',state.labels);$('#labels-toggle').setAttribute('aria-pressed',String(state.labels));});
  $('#rotate-toggle').addEventListener('click',()=>{controls.autoRotate=!controls.autoRotate;$('#rotate-toggle').classList.toggle('active',controls.autoRotate);$('#rotate-toggle').setAttribute('aria-pressed',String(controls.autoRotate));});
  document.querySelectorAll('[data-finish]').forEach(el=>el.addEventListener('click',()=>{state.finish=el.dataset.finish;applyFinish(model.finishMaterials,state.finish);document.querySelectorAll('[data-finish]').forEach(button=>{const chosen=button===el;button.classList.toggle('active',chosen);button.setAttribute('aria-pressed',String(chosen));});}));

  function fitTo(object,defaultAngle=true){
    const box=new THREE.Box3().setFromObject(object);if(box.isEmpty())return;const center=box.getCenter(new THREE.Vector3());const direction=defaultAngle?new THREE.Vector3(-150,85,-650).normalize():camera.position.clone().sub(controls.target).normalize();
    controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,650);camera.up.set(0,1,0);camera.zoom=1;camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    let maxX=0,maxY=0;for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);maxX=Math.max(maxX,Math.abs(p.x));maxY=Math.max(maxY,Math.abs(p.y));}
    camera.zoom=Math.min(2.5,(window.innerWidth<761?.79:.84)/Math.max(maxX,maxY));camera.updateProjectionMatrix();controls.update();
  }
  function fitFull(){const current=state.current;applyExplosion(parts,state.target===0?0:1);fitTo(model.root);applyExplosion(parts,current);}
  function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;renderer.setSize(w,h);const aspect=w/h;camera.aspect=aspect;camera.updateProjectionMatrix();if(!state.isolated)fitFull();else fitTo(parts.get(state.selected).node,false);}
  $('#reset').addEventListener('click',()=>{state.hidden.clear();state.isolated=false;controls.autoRotate=false;$('#rotate-toggle').classList.remove('active');$('#rotate-toggle').setAttribute('aria-pressed','false');setStage(0);state.current=0;applyExplosion(parts,0);updateVisibility();renderList();renderDetail();fitFull();toast('已复位视角与组件显示');});
  function straightView(back){const center=new THREE.Box3().setFromObject(state.isolated?parts.get(state.selected).node:model.root).getCenter(new THREE.Vector3());controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(0,0,back?-650:650));camera.up.set(0,1,0);camera.lookAt(center);controls.update();fitTo(state.isolated?parts.get(state.selected).node:model.root,false);controls.autoRotate=false;$('#rotate-toggle').classList.remove('active');$('#rotate-toggle').setAttribute('aria-pressed','false');toast(back?'背面视图：镜头朝向这一侧':'正面视图：显示屏朝向这一侧');}
  $('#front-view').addEventListener('click',()=>straightView(false));$('#back-view').addEventListener('click',()=>straightView(true));
  function sideView(side){
    state.hidden.clear();state.isolated=false;setStage(0);state.current=0;applyExplosion(parts,0);updateVisibility();renderList();renderDetail();
    const center=new THREE.Box3().setFromObject(model.root).getCenter(new THREE.Vector3());
    controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(side*650,0,0));camera.up.set(0,1,0);camera.lookAt(center);controls.update();fitTo(model.root,false);
    controls.autoRotate=false;$('#rotate-toggle').classList.remove('active');$('#rotate-toggle').setAttribute('aria-pressed','false');
    toast(side>0?'右侧视图：侧边键与相机控制键':'左侧视图：操作按钮、音量键与 SIM 卡托');
  }
  $('#left-view').addEventListener('click',()=>sideView(-1));$('#right-view').addEventListener('click',()=>sideView(1));
  $('#bottom-view').addEventListener('click',()=>{
    state.hidden.clear();state.isolated=false;setStage(0);state.current=0;applyExplosion(parts,0);updateVisibility();renderList();renderDetail();
    const target=new THREE.Vector3(0,-81.715,0);controls.target.copy(target);camera.position.copy(target).add(new THREE.Vector3(0,-650,0));camera.up.set(0,0,1);camera.zoom=1;camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    const box=new THREE.Box3().setFromObject(model.root);let maxX=0,maxY=0;
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);maxX=Math.max(maxX,Math.abs(p.x));maxY=Math.max(maxY,Math.abs(p.y));}
    camera.zoom=Math.min(7,.84/Math.max(maxX,maxY));camera.updateProjectionMatrix();controls.autoRotate=false;controls.update();$('#rotate-toggle').classList.remove('active');$('#rotate-toggle').setAttribute('aria-pressed','false');
    toast('底部视图：12 个声学圆孔、两颗螺丝与居中 USB-C 接口');
  });
  const down={x:0,y:0};renderer.domElement.addEventListener('pointerdown',e=>{down.x=e.clientX;down.y=e.clientY;});
  renderer.domElement.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;const bounds=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);const visibleMeshes=[];for(const p of parts.values())if(p.node.visible)p.node.traverse(obj=>{if(obj.isMesh)visibleMeshes.push(obj)});const hit=raycaster.intersectObjects(visibleMeshes,false)[0];if(hit)selectPart(hit.object.userData.componentId);});

  function positionLabels(){
    const w=viewport.clientWidth,h=viewport.clientHeight;const used=[];
    for(const [id,element]of labelElements){const part=parts.get(id);const world=new THREE.Vector3(...part.anchor).add(part.node.position);const projected=world.project(camera);let x=(projected.x*.5+.5)*w,y=(-projected.y*.5+.5)*h-23;
      const heroWidth=window.innerWidth<761?205:window.innerWidth<1101?220:300;
      let visible=state.labels&&part.node.visible&&(state.current>.13||id===state.selected)&&projected.z>-1&&projected.z<1&&x>45&&x<w-45&&y>20&&y<h-25;
      if(x<heroWidth&&y<(window.innerWidth<761?190:240))visible=false;
      if(x>w-68&&y<350)visible=false;
      const width=element.offsetWidth||100,height=element.offsetHeight||24;
      const collides=()=>used.some(r=>Math.abs(r.x-x)<(r.w+width)/2+5&&Math.abs(r.y-y)<(r.h+height)/2+5);
      if(visible&&collides()){y-=32;if(collides())visible=false;}
      element.hidden=!visible;if(visible){element.style.left=`${x}px`;element.style.top=`${y}px`;used.push({x,y,w:width,h:height});}
    }
  }
  $('#export').addEventListener('click',()=>{
    try{
      controls.update();renderer.render(scene,camera);positionLabels();const canvas=document.createElement('canvas');const scale=2;const w=viewport.clientWidth,h=viewport.clientHeight;canvas.width=w*scale;canvas.height=(h+76)*scale;const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#171b1f';ctx.fillRect(0,0,w,h+76);ctx.drawImage(renderer.domElement,0,0,w,h);
      ctx.font='500 10px sans-serif';for(const [id,el]of labelElements){if(el.hidden)continue;const x=parseFloat(el.style.left),y=parseFloat(el.style.top);const text=parts.get(id).name;const tw=ctx.measureText(text).width;ctx.fillStyle='#11171de8';ctx.fillRect(x-tw/2-8,y-10,tw+16,20);ctx.strokeStyle='#b18a65';ctx.strokeRect(x-tw/2-8,y-10,tw+16,20);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e1ddd7';ctx.fillText(text,x,y);}
      ctx.fillStyle='#0f1215';ctx.fillRect(0,h,w,76);ctx.fillStyle='#e7e8e8';ctx.textAlign='left';ctx.font='500 16px sans-serif';ctx.fillText('INSIDE 17 / iPhone 17 Pro Max · A3527',20,h+26);ctx.font='10px sans-serif';ctx.fillStyle='#b9a18b';ctx.fillText(`结构复原 · 内部几何为估算 · 展开 ${Math.round(state.current*100)}%`,20,h+47);ctx.fillStyle='#717d87';ctx.font='9px monospace';ctx.fillText('Reference: support.apple.com/en-my/124264',20,h+63);
      canvas.toBlob(blob=>{if(!blob){toast('图片导出失败，请重试。');return;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='iphone17-pro-max-a3527-teardown.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('拆解图已导出，图片包含估算说明。');},'image/png');
    }catch(error){console.error(error);toast('图片导出失败，请重试。');}
  });

  renderList();applyExplosion(parts,state.current);resize();
  const observer=new ResizeObserver(resize);observer.observe(viewport);$('#loading').hidden=true;
  let previous=performance.now();
  function animate(now){const dt=Math.min((now-previous)/1000,.1);previous=now;if(Math.abs(state.current-state.target)>.0001){state.current=THREE.MathUtils.lerp(state.current,state.target,1-Math.exp(-dt*7));applyExplosion(parts,state.current);}else if(state.current!==state.target){state.current=state.target;applyExplosion(parts,state.current);}controls.update(dt);renderer.render(scene,camera);positionLabels();requestAnimationFrame(animate);}
  requestAnimationFrame(animate);
  // Read-only diagnostics for geometry and interaction verification.
  window.inside17=Object.freeze({snapshot:()=>({componentCount:parts.size,explosion:state.current,target:state.target,selected:state.selected,isolated:state.isolated,hidden:[...state.hidden],visible:[...parts.values()].filter(p=>p.node.visible).map(p=>p.id),finish:state.finish,finishRoles:Object.fromEntries(model.finishMaterials.map(m=>[m.userData.finishRole,{color:'#'+m.color.getHexString(),roughness:m.roughness,metalness:m.metalness}])),labels:state.labels,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,dimensions:BODY})});
}
