import * as THREE from './vendor/three.module.js';
import {createSoftwareRenderer} from './software-renderer.js';
import {createAdditionalModels} from './additional-models.js';
import {createMechanicalCore} from './mechanical-core.js';
import {createRecessedFracture} from './fracture.js';
import {createMobileFraming} from './mobile-framing.js';
import {createInspectionUniforms,applyInspectionCut,createInspectionLines} from './inspection.js';

const $=s=>document.querySelector(s);
const story=$('.story'),stage=$('.stage'),host=$('#scene');
const chapters=[...document.querySelectorAll('.chapter')];
const motionButton=$('.motion-toggle');
const state={progress:0},pointer={x:0,y:0,px:-1000,py:-1000,active:false},smoothedPointer={x:0,y:0};
const lens=$('.inspection-lens'),raycaster=new THREE.Raycaster(),rayPoint=new THREE.Vector2();
const pieces=[],pickMeshes=[],shared={lensCenter:{value:new THREE.Vector2(-1000,-1000)},lensRadius:{value:72},pixelRatio:{value:1},gridColor:{value:new THREE.Vector3(.7,.8,.88)}};
let hovered=null,lastTouch=0,touchStart=null,lastScrollTime=-Infinity;
let mobileFraming=null,mobileCopyBottom=[0,0,0],mobileBottom=0;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let method='ultrasound',width=1,height=1,activeChapter=-1;
let scrollStart=0,scrollRange=2400,quality=1,frameAverage=16,qualitySamples=0,lastQualityChange=0;
let lightX=Infinity,lightY=Infinity;
let renderer,scene,camera,assembly,ring,grid,crack,texture,pmrem,envMap;
let animationId=0,previousTime=0,elapsed=0,lastProgress=-1,visible=true,storyVisible=true;
let scanUniforms=null;
let shellRear,shellFront,opening=0;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
// Begin after the scan completes (.62); retain the same .34 scroll distance.
const SERVICE_START=.62,SERVICE_END=.96;
// Existing group order: cylinder, plain plate, drilled plate. No extra timeline.
const serviceProfiles=[
  {start:.43,end:.73,depth:1.6},
  {start:.70,end:1,depth:-2},
  {start:.16,end:.46,depth:3.8}
];

function shownProgress(current,target,dt){
  const rate=12+Math.min(12,Math.abs(target-current)*40);
  let next=mix(current,target,1-Math.exp(-dt*rate));
  // Protect the visible roll from being skipped on a large wheel/touch update.
  const rollStep=Math.min(.008,dt*.48);
  if(next>current&&current<.39&&next>.13)next=Math.min(next,Math.max(current,.13)+rollStep);
  if(next<current&&current>.13&&next<.39)next=Math.max(next,Math.min(current,.39)-rollStep);
  // Resolve each mechanical separation even on a large wheel/touch update.
  const step=Math.min(.018,dt*.54);
  if(next>current&&current<SERVICE_END&&next>SERVICE_START)return Math.min(next,Math.max(current,SERVICE_START)+step);
  if(next<current&&current>SERVICE_START&&next<SERVICE_END)return Math.max(next,Math.min(current,SERVICE_END)-step);
  return next;
}

function measureScroll(){scrollStart=story.offsetTop;scrollRange=Math.max(1,story.offsetHeight-stage.offsetHeight);}
function nativeProgress(){return clamp((scrollY-scrollStart)/scrollRange);}
function renderRatio(){return Math.min(devicePixelRatio,1.5,Math.sqrt(2200000/Math.max(1,width*height)))*quality;}
function applyRenderSize(){renderer.setPixelRatio(renderRatio());shared.pixelRatio.value=renderer.getPixelRatio?.()||1;renderer.setSize(width,height,false);}
function setupScroll(){
  document.body.classList.toggle('reduced',reduced);
  motionButton.setAttribute('aria-pressed',String(reduced));
  motionButton.textContent=reduced?'Activar movimiento':'Reducir movimiento';
  if(reduced){stage.dataset.theme='dark';lens.style.opacity=0;chapters.forEach(c=>{c.inert=false;c.setAttribute('aria-hidden','false');});return;}
  measureScroll();state.progress=nativeProgress();
  activeChapter=-1;
}
motionButton.addEventListener('click',()=>{const p=state.progress;reduced=!reduced;setupScroll();resize();if(!reduced){window.scrollTo(0,p*(story.offsetHeight-stage.offsetHeight));} });
function jump(p){if(reduced){chapters[p<.2?0:p<.7?1:2].scrollIntoView({behavior:'auto'});return;}window.scrollTo({top:story.offsetTop+p*(story.offsetHeight-stage.offsetHeight),behavior:'smooth'});}
document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>jump(Number(b.dataset.jump))));
$('.skip').addEventListener('click',e=>{if(!reduced){e.preventDefault();jump(.94);setTimeout(()=>document.querySelector('.service button').focus({preventScroll:true}),900);}});
document.querySelectorAll('.brand,.footer a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();jump(0);}));
function chooseMethod(button){
  method=button.closest('.service').dataset.method;
  document.querySelectorAll('.service').forEach(row=>{const active=row.dataset.method===method;row.classList.toggle('is-open',active);row.querySelector('button').setAttribute('aria-expanded',String(active));row.querySelector('.service-detail').hidden=!active;});
  measureMobileLayout();
}
document.querySelectorAll('.service button').forEach(button=>{
  button.addEventListener('click',()=>chooseMethod(button));
  button.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'&&!reduced&&width>700&&state.progress>.87&&performance.now()-lastScrollTime>150&&Math.abs(nativeProgress()-state.progress)<.002)chooseMethod(button);});
  button.addEventListener('focus',()=>chooseMethod(button));
});
function trackPointer(e){
  const r=stage.getBoundingClientRect();pointer.px=e.clientX-r.left;pointer.py=e.clientY-r.top;
  pointer.x=pointer.px/width-.5;pointer.y=pointer.py/height-.5;
  pointer.active=pointer.py>=0&&pointer.py<=height&&!e.target.closest('button,a,.chapter-copy');
}
function cancelTouchInspection(){
  if(!lastTouch&&!touchStart)return;
  pointer.active=false;pointer.x=pointer.y=0;pointer.px=pointer.py=-1000;lastTouch=0;touchStart=null;lens.style.opacity=0;
}
window.addEventListener('pointermove',e=>{
  if(e.pointerType!=='touch'){if(!lastTouch&&!touchStart)trackPointer(e);}
  else if(touchStart&&Math.hypot(e.clientX-touchStart.x,e.clientY-touchStart.y)>8)cancelTouchInspection();
},{passive:true});
window.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'){cancelTouchInspection();trackPointer(e);return;}
  // A new touch dismisses a retained inspection, including touches on controls.
  if(lastTouch||touchStart){cancelTouchInspection();return;}
  trackPointer(e);
  if(pointer.active)touchStart={x:e.clientX,y:e.clientY,id:e.pointerId};
},{passive:true});
window.addEventListener('pointerup',e=>{
  if(e.pointerType!=='touch'||!touchStart||e.pointerId!==touchStart.id)return;
  if(Math.hypot(e.clientX-touchStart.x,e.clientY-touchStart.y)>8){cancelTouchInspection();return;}
  // Start the two-second window on release, never on initial contact.
  lastTouch=performance.now();touchStart=null;
},{passive:true});
window.addEventListener('pointercancel',cancelTouchInspection,{passive:true});
window.addEventListener('scroll',()=>{lastScrollTime=performance.now();cancelTouchInspection();},{passive:true});
window.addEventListener('blur',()=>{cancelTouchInspection();pointer.active=false;pointer.x=pointer.y=0;});
stage.addEventListener('pointerleave',e=>{
  // Touch devices emit pointerleave after lifting the finger. Keep the aperture pinned.
  if(e.pointerType!=='touch'&&!lastTouch&&!touchStart)pointer.active=false;
});
document.addEventListener('visibilitychange',()=>{visible=!document.hidden;});
new IntersectionObserver(([entry])=>{storyVisible=entry.isIntersecting;},{rootMargin:'100px 0px'}).observe(story);

function surfaceTexture(){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d');
  const data=c.createImageData(512,512);let seed=873;
  for(let y=0;y<512;y++){seed=(seed*1664525+1013904223)>>>0;const line=(seed/4294967296-.5)*30;for(let x=0;x<512;x++){seed=(seed*1664525+1013904223)>>>0;const shade=140+line+(seed/4294967296-.5)*14;const i=(y*512+x)*4;data.data[i]=data.data[i+1]=data.data[i+2]=shade;data.data[i+3]=255;}}
  c.putImageData(data,0,0);const map=new THREE.CanvasTexture(canvas);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(2,3);map.anisotropy=4;return map;
}
function studioEnvironment(){
  const room=new THREE.Scene();room.background=new THREE.Color(.035,.038,.043);
  const makePanel=(w,h,pos,color)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(...color),side:THREE.DoubleSide}));m.position.set(...pos);m.lookAt(0,0,0);room.add(m);};
  makePanel(11,4,[0,6,2],[5,5.1,5.3]);
  makePanel(3,9,[-5,1,3],[3.5,3.6,3.8]);
  makePanel(2,10,[5,1,-1],[2,2.3,2.7]);
  makePanel(8,.9,[0,-2,5],[1.5,1.6,1.8]);
  makePanel(4,5,[0,3,-6],[2.6,2.6,2.7]);
  makePanel(.5,8,[-6,-1,-1],[2.5,.14,.1]);
  pmrem=new THREE.PMREMGenerator(renderer);const result=pmrem.fromScene(room,.055);room.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});return result;
}
function scanMaterial(parameters={},u=scanUniforms){
  const material=new THREE.MeshStandardMaterial({color:0xa1a5aa,metalness:1,roughness:.3,bumpMap:texture,bumpScale:.009,envMapIntensity:1.3,depthWrite:true,...parameters});
  material.userData.inspect=true;
  return applyInspectionCut(material,u);
}
function lathe(profile,material,parent=assembly){
  const points=[];
  for(let i=0;i<profile.length-1;i++){const a=profile[i],b=profile[i+1],segments=renderer.isSoftware?Math.max(1,Math.ceil(Math.abs(b[1]-a[1])/.14)):1;for(let j=0;j<segments;j++)points.push(new THREE.Vector2(mix(a[0],b[0],j/segments),mix(a[1],b[1],j/segments)));}
  points.push(new THREE.Vector2(...profile[profile.length-1]));
  const geometry=new THREE.LatheGeometry(points,renderer.isSoftware?64:128);geometry.rotateZ(-Math.PI/2);const m=new THREE.Mesh(geometry,material);parent.add(m);return m;
}
function weldGeometry(){
  const radial=renderer.isSoftware?64:160,axial=renderer.isSoftware?10:22,positions=[],uvs=[],indices=[];
  for(let j=0;j<=axial;j++){const x=(j/axial-.5)*.23;for(let i=0;i<=radial;i++){const a=i/radial*Math.PI*2;const bell=Math.pow(Math.cos((j/axial-.5)*Math.PI),.7);const ripple=Math.sin(a*62+j*.45)*.006+Math.sin(a*27-j*.3)*.003;const r=.789+bell*(.038+ripple);positions.push(x,r*Math.cos(a),r*Math.sin(a));uvs.push(i/radial,j/axial);}}
  for(let j=0;j<axial;j++)for(let i=0;i<radial;i++){const a=j*(radial+1)+i,b=a+radial+1;indices.push(a,a+1,b,b,a+1,b+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function interiorGrid(start,end){
  const points=[],radial=64;
  for(let x=start;x<=end+.01;x+=.275){for(let i=0;i<radial;i++){const a=i/radial*Math.PI*2,b=(i+1)/radial*Math.PI*2;points.push(x,.695*Math.cos(a),.695*Math.sin(a),x,.695*Math.cos(b),.695*Math.sin(b));}}
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;points.push(start,.695*Math.cos(a),.695*Math.sin(a),end,.695*Math.cos(a),.695*Math.sin(a));}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  return createInspectionLines(geometry,scanUniforms,.6);
}
function buildCrack(){
  // The far inner wall stays attached to the rear shell. The shaft can occlude it.
  const outline=new THREE.Shape();outline.moveTo(-2.235,-.60);outline.lineTo(-.065,-.60);outline.lineTo(-.065,.60);outline.lineTo(-2.235,.60);outline.closePath();
  return createRecessedFracture(scanUniforms,{
    outline,
    points:[[-.48,.14],[-.46,.21],[-.49,.26],[-.43,.32],[-.45,.37],[-.39,.43],[-.40,.48],[-.37,.54]],
    surface:(x,y,sink)=>[x,y,-Math.sqrt(Math.max(0,(.621+sink)**2-y*y))]
  });
}
const pulses=[];
function buildScene(){
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch{renderer=createSoftwareRenderer(()=>scanUniforms);}
  renderer.setPixelRatio(Math.min(devicePixelRatio,width<=700?1:1.25));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('La vista 3D no está disponible en este dispositivo.');});
  host.appendChild(renderer.domElement);scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.z=9;
  if(!renderer.isSoftware){envMap=studioEnvironment();scene.environment=envMap.texture;}
  scene.add(new THREE.HemisphereLight(0xd4dcf2,0x141316,1.15));const key=new THREE.DirectionalLight(0xffffff,2.1);key.position.set(0,5,5);scene.add(key);const fill=new THREE.DirectionalLight(0x8194b3,.8);fill.position.set(-4,0,3);scene.add(fill);
  texture=surfaceTexture();shared.pixelRatio.value=renderer.getPixelRatio?.()||Math.min(devicePixelRatio,1.25);scanUniforms=createInspectionUniforms(shared);scanUniforms.scanPosition.value=-3;scanUniforms.scanWidth.value=.66;
  assembly=new THREE.Group();scene.add(assembly);
  shellRear=new THREE.Group();shellFront=new THREE.Group();assembly.add(shellRear,shellFront);
  const bodyMat=scanMaterial(),cutMat=scanMaterial({color:0xc6c9cc,roughness:.24}),weldMat=scanMaterial({color:0x858b92,roughness:.4,bumpScale:.018});
  lathe([[.63,-2.25],[.76,-2.25],[.79,-2.20],[.79,-.12],[.775,-.055],[.655,-.055],[.62,-.11],[.62,-2.2],[.63,-2.25]],bodyMat,shellRear);
  lathe([[.655,.055],[.775,.055],[.79,.12],[.79,2.18],[.765,2.25],[.64,2.25],[.62,2.21],[.62,.11],[.655,.055]],bodyMat,shellFront);
  // Machined rear flange, open at its centre. The near end stays open to show wall thickness.
  lathe([[.79,-2.06],[1.015,-2.06],[1.065,-2.01],[1.065,-1.88],[1.015,-1.83],[.79,-1.83],[.79,-2.06]],cutMat,shellRear);
  const darkMetal=scanMaterial({color:0x747a82,roughness:.36});
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.075,6),darkMetal);bolt.rotation.z=Math.PI/2;bolt.position.set(-1.8,.925*Math.cos(a),.925*Math.sin(a));shellRear.add(bolt);}
  for(const x of [-2.12,2.1,2.18]){const band=new THREE.Mesh(new THREE.TorusGeometry(.786,.007,8,128),darkMetal);band.rotation.y=Math.PI/2;band.position.x=x;(x<0?shellRear:shellFront).add(band);}
  const weld=new THREE.Mesh(weldGeometry(),weldMat);shellRear.add(weld);
  shellRear.add(interiorGrid(-2.23,-.03));shellFront.add(interiorGrid(.03,2.23));
  assembly.add(createMechanicalCore(renderer.isSoftware));crack=buildCrack();shellRear.add(crack);
  ring=new THREE.Mesh(new THREE.TorusGeometry(.86,.008,8,128),new THREE.MeshBasicMaterial({color:0xff5044,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));ring.rotation.y=Math.PI/2;ring.renderOrder=7;assembly.add(ring);
  for(let i=0;i<4;i++){const p=new THREE.Mesh(new THREE.TorusGeometry(.85,.008,8,96),new THREE.MeshBasicMaterial({color:0xf06755,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));p.rotation.y=Math.PI/2;p.renderOrder=5;assembly.add(p);pulses.push(p);}
  pieces.push({group:assembly,u:scanUniforms,name:'Tubo con brida',key:'ultrasound',hover:0,selected:1});
  pieces.push(...createAdditionalModels(scanMaterial,shared,renderer.isSoftware));
  for(const piece of pieces){piece.shadow=document.createElement('div');piece.shadow.className='piece-shadow';$('.scene-depth').appendChild(piece.shadow);scene.add(piece.group);piece.group.userData.piece=piece;piece.group.traverse(o=>{if(o.isMesh&&o.material.isMeshStandardMaterial){o.userData.piece=piece;pickMeshes.push(o);}});}
  mobileFraming=createMobileFraming(pieces);
  resize();document.body.classList.add('scene-ready');$('.scene-loading').setAttribute('aria-hidden','true');
}
function measureMobileLayout(){
  if(width>950)return;
  const details=[...document.querySelectorAll('.service-detail')],heights=details.map(detail=>{
    const hidden=detail.hidden;detail.hidden=false;const h=detail.offsetHeight;detail.hidden=hidden;return h;
  });
  const current=details.findIndex(detail=>!detail.hidden);
  const reserve=heights.length?Math.max(...heights)-(heights[current]||0):0;
  mobileCopyBottom=['.hero-copy','.inspect-copy','.services-copy'].map((selector,i)=>{
    const copy=$(selector);return copy.offsetTop+copy.offsetHeight+(i===2?reserve:0)+14;
  });
  mobileBottom=height-$('.stage-bottom').offsetHeight-12;
}
function resize(){width=stage.clientWidth;height=stage.clientHeight;measureScroll();if(!renderer)return;applyRenderSize();pieces.forEach(piece=>{piece.shadow.style.width=`${width*.3}px`;piece.shadow.style.height=`${width*.096}px`;});camera.aspect=width/height;camera.updateProjectionMatrix();shared.lensRadius.value=width<=700?52:72;measureMobileLayout();lastProgress=-1;}
window.addEventListener('resize',()=>{
  const w=width,h=height,p=state.progress;resize();
  if(width!==w||height!==h){
    cancelTouchInspection();
    if(!reduced&&Math.min(w,width)<=950&&(w>h)!==(width>height)){
      window.scrollTo({top:story.offsetTop+p*(story.offsetHeight-stage.offsetHeight),behavior:'auto'});
    }
  }
},{passive:true});
document.fonts?.ready.then(()=>{measureMobileLayout();});
function setChapter(index){if(index===activeChapter)return;activeChapter=index;stage.dataset.chapter=String(index);chapters.forEach((c,i)=>{const active=i===index;c.inert=!active;c.setAttribute('aria-hidden',String(!active));});document.querySelectorAll('[data-jump]').forEach(b=>{const n=Number(b.dataset.jump),i=n<.2?0:n<.7?1:2;if(i===index)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});$('#scroll-text').textContent=index===2?'Explorá los métodos':'Deslizá para explorar';}
function updateUI(p){
  if(reduced)return;
  const light=smooth(.13,.34,p),red=smooth(.64,.84,p);
  $('.panel-light').style.transform=`translateY(${(1-light)*100}%)`;
  $('.panel-red').style.transform=`translateY(${(1-red)*100}%)`;
  stage.dataset.theme=p<.32?'dark':p<.82?'light':'red';
  const opacity=[1-smooth(.10,.30,p),smooth(.20,.34,p)*(1-smooth(.67,.82,p)),smooth(.72,.86,p)];
  chapters.forEach((c,i)=>{c.style.opacity=opacity[i];c.style.visibility=opacity[i]>.001?'visible':'hidden';const offset=i===0?-smooth(.1,.25,p)*45:i===1?(1-smooth(.28,.38,p))*40-smooth(.63,.76,p)*35:(1-smooth(.76,.86,p))*40;c.querySelector('.chapter-copy').style.transform=`translateY(${offset}px)`;});
  const tracks=document.querySelectorAll('.progress-track i');tracks[0].style.transform=`scaleX(${clamp(p/.46)})`;tracks[1].style.transform=`scaleX(${clamp((p-.46)/.48)})`;
  const lightTheme=p>=.32&&p<.82;shared.gridColor.value.set(...(lightTheme?[.18,.27,.32]:[.75,.84,.9]));
  setChapter(p<.28?0:p<.76?1:2);
}
function fallback(message){reduced=true;setupScroll();$('.scene-loading').textContent=message;document.body.classList.add('scene-failed');motionButton.hidden=true;}

// All three outer components share an axis and scale before separating.
const assemblyPoses={
  desktop:[[.64,.49,.072,.20,-.60,.38],[.30,.50,.061,.15,-.40,-.27]],
  phone:[[.50,.72,.145,.15,-.60,.25],[.48,.67,.089,.12,-.40,-.18]]
};
const assemblyPosition=new THREE.Vector3(),assemblyQuaternion=new THREE.Quaternion(),localQuaternion=new THREE.Quaternion(),targetQuaternion=new THREE.Quaternion(),targetEuler=new THREE.Euler(),localPosition=new THREE.Vector3(),finalPosition=new THREE.Vector3();
// Additive intro perspective: zero at both endpoints, outside the despiece transforms.
const introAxis=new THREE.Vector3(0,1,0),introQuaternion=new THREE.Quaternion();
const rollAxis=new THREE.Vector3(1,0,0),rollQuaternion=new THREE.Quaternion();
const rollAngle=Math.PI*2;
function longitudinalRoll(p){
  // One forward revolution; the endpoint restores orientation without rewinding.
  return smooth(.13,.39,p);
}
function introPerspective(p){
  if(p<=0||p>=.48)return 0;
  const t=p/.48;
  return 16*t*t*(1-t)*(1-t);
}
function updateHover(dt){
  if(lastTouch&&performance.now()-lastTouch>=2000)cancelTouchInspection();
  shared.lensCenter.value.set(pointer.px,height-pointer.py);
  hovered=null;
  if(pointer.active){
    rayPoint.set(pointer.px/width*2-1,1-pointer.py/height*2);raycaster.setFromCamera(rayPoint,camera);
    const hit=raycaster.intersectObjects(pickMeshes,false)[0];if(hit)hovered=hit.object.userData.piece;
  }
  for(const piece of pieces){const inspecting=hovered&&(opening<.08||hovered===piece);piece.hover=mix(piece.hover,inspecting?1:0,1-Math.exp(-dt*9));piece.u.hoverPower.value=piece.hover;}
  lens.style.opacity=hovered?1:0;lens.style.left=`${pointer.px}px`;lens.style.top=`${pointer.py}px`;
  if(hovered)lens.querySelector('.lens-label').textContent=opening<.08?'Conjunto industrial':hovered.name;
  stage.classList.toggle('is-inspecting',!!hovered);
}
function frame(time){
  animationId=requestAnimationFrame(frame);
  const dt=Math.min((time-previousTime)/1000||.016,.06);previousTime=time;
  if(!visible||reduced||!renderer||!storyVisible)return;
  elapsed+=dt;
  const target=nativeProgress();
  state.progress=shownProgress(state.progress,target,dt);
  if(Math.abs(target-state.progress)<.00005)state.progress=target;
  // Change resolution infrequently; isolated slow frames do not trigger resizing.
  frameAverage=mix(frameAverage,dt*1000,.04);
  if(++qualitySamples>120&&time-lastQualityChange>3000&&!renderer.isSoftware){
    const next=frameAverage>23?Math.max(.6,quality-.1):frameAverage<18?Math.min(1,quality+.05):quality;
    if(next!==quality){quality=next;applyRenderSize();lastQualityChange=time;qualitySamples=0;}
  }
  const p=state.progress,landscape=width>height&&width<=950&&height<=500,phone=width<=700&&!landscape;
  if(Math.abs(p-lastProgress)>.00001){updateUI(p);lastProgress=p;}
  smoothedPointer.x=mix(smoothedPointer.x,pointer.x,1-Math.exp(-dt*5));smoothedPointer.y=mix(smoothedPointer.y,pointer.y,1-Math.exp(-dt*5));
  const dx=Math.round(smoothedPointer.x*22),dy=Math.round(smoothedPointer.y*14);
  if(dx!==lightX){stage.style.setProperty('--light-dx',`${dx}px`);lightX=dx;}
  if(dy!==lightY){stage.style.setProperty('--light-dy',`${dy}px`);lightY=dy;}
  const a=smooth(.13,.39,p),b=smooth(SERVICE_START,SERVICE_END,p);
  // One scroll clock: a short camera move, then three mechanical separations.
  const serviceTime=clamp((p-SERVICE_START)/(SERVICE_END-SERVICE_START));
  const worldHeight=2*Math.tan(THREE.MathUtils.degToRad(17))*9,worldWidth=worldHeight*width/height;
  const config=phone?assemblyPoses.phone:assemblyPoses.desktop,selectedIndex=pieces.findIndex(piece=>piece.key===method);
  const common=config[0].map((v,i)=>mix(v,config[1][i],a)),commonScale=worldWidth*common[2];
  assemblyPosition.set((common[0]-.5)*worldWidth,(.5-common[1])*worldHeight+Math.sin(elapsed*.65)*.012*(1-smooth(0,.16,serviceTime)),0);
  assemblyQuaternion.setFromEuler(targetEuler.set(common[3]+smoothedPointer.y*.10,common[4]+smoothedPointer.x*.13,common[5]));
  const perspective=introPerspective(p);
  introQuaternion.setFromAxisAngle(introAxis,THREE.MathUtils.degToRad(phone?31:33)*perspective);
  assemblyQuaternion.premultiply(introQuaternion);
  // Shared local parent rotation: X-axis split offsets stay on their original paths.
  rollQuaternion.setFromAxisAngle(rollAxis,rollAngle*longitudinalRoll(p));
  assemblyQuaternion.multiply(rollQuaternion);
  // Hold a close tracking shot, then open the framing during the final descent.
  // Translation is camera-only: all model poses and the final camera remain intact.
  const cameraTravel=smooth(.13,.21,p)*(1-smooth(.27,.39,p));
  const cameraDistance=9-((phone||landscape)?.85:1.65)*cameraTravel;
  const trackingWeight=(9-cameraDistance)/9;
  const revealPan=(phone||landscape)?0:worldWidth*.15*smooth(.22,.27,p)*(1-smooth(.27,.39,p));
  const trackingX=assemblyPosition.x*trackingWeight+revealPan;
  const trackingY=assemblyPosition.y*trackingWeight;
  camera.position.set((phone?.10:.18)*perspective+trackingX,trackingY,cameraDistance);
  camera.lookAt(trackingX,trackingY,0);
  if(p>SERVICE_START){
    // Move once, before release; hold the resulting perspective without orbiting.
    const follow=(phone||landscape)?.5:1;
    const cameraStep=smooth(0,.16,serviceTime);
    camera.position.set(.65*follow*cameraStep,.08*follow*cameraStep,9+.25*follow*cameraStep);
    camera.lookAt(.08*follow*cameraStep,0,0);
  }
  camera.updateMatrixWorld();
  opening=smooth(.17,.48,p);
  // The tube's existing internal opening is held; only the three outer groups move.
  const shellOpening=opening;
  shellRear.position.x=-.78*shellOpening;shellFront.position.x=1.05*shellOpening;
  pieces.forEach((piece,i)=>{
    piece.selected=mix(piece.selected,piece.key===method?1:0,1-Math.exp(-dt*5));
    const selected=piece.selected,side=(i<selectedIndex?i:i-1)<=0?.15:.85;
    piece.secondaryX=mix(piece.secondaryX??side,side,1-Math.exp(-dt*5));
    // A focus slot plus two separated inspection slots, whichever method is selected.
    // The side is interpolated by the existing selection interaction.
    const lane=clamp((piece.secondaryX-.15)/.70);
    const shortPhone=phone&&height<760;
    const secondary=phone?
      [mix(i===1?.02:.20,i===2&&!shortPhone?.90:.72,lane),i===1?.72:i===2?(shortPhone?.87:.79):.88,i===0?.039:.038]:
      [mix(landscape&&i===1?.02:.17,i===2?(landscape?.48:.54):.50,lane),i===0?.82:i===1?(landscape?.30:.32):.70,i===0?.027:.030];
    const focus=phone?[.46,shortPhone?.70:.73,i===0?.088:i===1?.135:.125]:[.255,landscape?(i===0?.43:.38):(i===0?.58:.53),i===0?(landscape?.045:.055):i===1?.090:.085];
    const finalPose=[mix(secondary[0],focus[0],selected),mix(secondary[1],focus[1],selected),mix(secondary[2],focus[2],selected),i===0?.04:-.2,i===0?-.35:.37,i===0?-.24:-.16];
    const localX=i===0?0:i===1?mix(-2.42,-4.0,opening):mix(2.36,4.25,opening);
    localPosition.set(localX,0,0).multiplyScalar(commonScale).applyQuaternion(assemblyQuaternion).add(assemblyPosition);
    // Separate physical depth planes also during option changes. Compensating
    // X/Y and scale preserves the intended screen-space composition at z != 0.
    const profile=serviceProfiles[i],finalDepth=profile.depth+piece.hover*.1;
    const depthScale=(9-finalDepth)/9;
    finalPosition.set((finalPose[0]-.5)*worldWidth*depthScale,(.5-finalPose[1])*worldHeight*depthScale,finalDepth);
    // One straight 3D segment per piece, eased only at its mechanical end stops.
    const drift=smooth(profile.start,profile.end,serviceTime);
    piece.group.position.copy(localPosition).lerp(finalPosition,drift);
    const finalScale=worldWidth*finalPose[2]*depthScale*(1+piece.hover*.035);
    piece.group.scale.setScalar(mix(commonScale,finalScale,drift));
    localQuaternion.setFromEuler(targetEuler.set(0,i===0?0:i===1?-Math.PI/2:Math.PI/2-opening*.18,0));
    piece.group.quaternion.copy(assemblyQuaternion).multiply(localQuaternion);
    targetQuaternion.setFromEuler(targetEuler.set(finalPose[3]+smoothedPointer.y*.14,finalPose[4]+smoothedPointer.x*.18,finalPose[5]));
    // Advance along the original shortest rotation, never overshoot or rewind.
    piece.group.quaternion.slerp(targetQuaternion,drift);
    piece.shadowRotation=mix(common[5],finalPose[5],drift);
  });
  if(mobileFraming&&(phone||landscape)){
    const top=phone?mix(mix(mobileCopyBottom[0],mobileCopyBottom[1],a),mobileCopyBottom[2],b):$('.header').offsetHeight+10;
    const softReserve=Math.max(smooth(.13,.17,p)*(1-smooth(.35,.39,p)),smooth(SERVICE_START,SERVICE_START+.04,p)*(1-smooth(SERVICE_END-.04,SERVICE_END,p)));
    mobileFraming(camera,width,height,{top:top,bottom:mobileBottom,softReserve},shellOpening);
  }
  pieces.forEach((piece,i)=>{
    // Shadows follow the actual component centres, including the opening.
    localPosition.copy(piece.group.position).project(camera);
    const sx=(localPosition.x*.5+.5)*width,sy=(-localPosition.y*.5+.5)*height,scale=piece.group.scale.x/worldWidth;
    const shadowWidth=width*scale*(i===0?4.4:2.15);
    const shadowX=sx+shadowWidth*.09-smoothedPointer.x*12,shadowY=sy+width*scale*(i===0?1.05:1.3);
    piece.shadow.style.opacity=String(i===0?1:mix(.2,1,opening));
    piece.shadow.style.transform=`translate(${shadowX}px,${shadowY}px) rotate(${i===0?-piece.shadowRotation*24:0}deg) scale(${shadowWidth/(width*.3)}) translate(-50%,-50%)`;
  });

  // Inspection uniforms need only root matrices; child transforms are updated by
  // the renderer. Ray picking alone requires the full hierarchy before rendering.
  if(pointer.active)scene.updateMatrixWorld();
  else for(const piece of pieces)piece.group.updateWorldMatrix(true,false);
  for(const piece of pieces)piece.u.inspectionMatrix.value.copy(piece.group.matrixWorld).invert();updateHover(dt);
  const inspection=smooth(.29,.40,p)*(1-smooth(.62,.73,p)),service=smooth(.77,.89,p);
  let scanX=mix(-2.4,2.4,smooth(.34,.62,p));
  if(service>.01)scanX=mix(scanX,0,service);
  scanUniforms.scanPosition.value=scanX;
  scanUniforms.scanPower.value=Math.max(inspection,service*pieces[0].selected*.47);
  scanUniforms.scanWidth.value=.59;
  ring.position.x=scanX;ring.material.opacity=inspection*.62+service*pieces[0].selected*.5;ring.visible=ring.material.opacity>.005;ring.material.color.setRGB(1,mix(.08,.75,service),mix(.055,.61,service));
  pulses.forEach((r,i)=>{const f=(elapsed*.28+i/4)%1;r.position.x=-1.85+f*3.7;r.material.color.copy(ring.material.color);r.material.opacity=service*pieces[0].selected*Math.sin(f*Math.PI)*.5;});
  crack.visible=Math.max(scanUniforms.scanPower.value,scanUniforms.hoverPower.value)>.001;
  for(const piece of pieces.slice(1)){
    piece.u.scanPosition.value=piece.key==='radiography'?Math.sin(elapsed*.8)*.72:0;
    piece.u.scanPower.value=service*piece.selected*(piece.key==='radiography'?.90:0);
    piece.u.scanWidth.value=.48;
    piece.u.surfacePower.value=service*piece.selected*(piece.key==='surface'?1:0);
    piece.defect.mesh.visible=Math.max(piece.u.scanPower.value,piece.u.hoverPower.value)>.001;
  }
  renderer.render(scene,camera);
}

setupScroll();
try{buildScene();requestAnimationFrame(frame);}catch(error){console.error('JCA scene:',error);fallback('La vista 3D no está disponible en este dispositivo.');}
window.addEventListener('pagehide',()=>{cancelAnimationFrame(animationId);renderer?.dispose();envMap?.dispose();pmrem?.dispose();texture?.dispose();scene?.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});},{once:true});
