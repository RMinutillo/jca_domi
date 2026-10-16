import * as THREE from './vendor/three.module.js';
import {createSoftwareRenderer} from './software-renderer.js';
import {createHeroModel} from './hero-model.js';
import {createHeroEffects} from './hero-effects.js';
import {createHeroBloom} from './hero-bloom.js';
import {CONFIG} from './hero-config.js';

const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a));return t*t*(3-2*t);};

export async function startHero(){
  const $=selector=>document.querySelector(selector);
  const story=$('.story'),stage=$('.stage'),host=$('#scene'),copy=$('.hero-copy');
  const lens=$('.inspection-lens'),direction=$('.lens-direction'),hud=$('.inspection-hud');
  const reticle=$('.detection-reticle'),label=$('.hud-label'),leader=$('.hud-leader path');
  const control=$('.inspection-toggle'),motionButton=$('.motion-toggle');
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const coarse=matchMedia('(hover: none), (pointer: coarse)');
  let reduced=preference.matches,width=1,height=1,mobile=false,ready=false,destroyed=false;
  let visible=!document.hidden,inViewport=true,raf=0,previous=0,elapsed=0,quality=1,average=16,samples=0,lastQuality=0;
  let lensPower=0,detection=0,found=false,pinned=false,dragId=null,lastDrag=-Infinity,demoStart=0,lensGlow=false;
  let timeline=null,bloom=null,layout={},lastHUD='',lastLens='',lastLight='',lastTouchZone='',lastHUDAlpha='',lastDirection='';
  const intro={scan:reduced?1:0,time:0};
  const pointer={x:0,y:0,px:-1000,py:-1000,active:false},damped={x:0,y:0};
  const lensPoint=new THREE.Vector2(),targetScreen=new THREE.Vector2();
  const point=new THREE.Vector3(),anchor=new THREE.Vector3(...CONFIG.fissure.position),autoPoint=new THREE.Vector3();
  const demoExit=new THREE.Vector3(1.6,-.2,.5);
  const raycaster=new THREE.Raycaster(),ray=new THREE.Vector2();
  const projected=new THREE.Vector3(),matrix=new THREE.Matrix4();
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.z=9;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}
  catch{renderer=createSoftwareRenderer();}
  renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;
  host.appendChild(renderer.domElement);host.dataset.renderer=renderer.isSoftware?'canvas':'webgl';
  const shared={lensCenter:{value:new THREE.Vector2(-1000,-1000)},lensRadius:{value:72},pixelRatio:{value:1},gridColor:{value:new THREE.Vector3(.7,.8,.88)}};
  const model=createHeroModel(renderer,scene,shared),effects=createHeroEffects(model,CONFIG);
  const root=model.root;
  const defects=model.defects.map(defect=>({...defect,screen:new THREE.Vector2()}));
  let activeDefect=defects[0];
  hud.dataset.defect=activeDefect.key;
  model.ring.visible=false;model.pulses.forEach(r=>r.visible=false);effects.laser.visible=effects.plane.visible=false;
  model.crack.visible=false;model.pieces.forEach(piece=>{if(piece.defect)piece.defect.mesh.visible=false;});
  const modelBounds=new THREE.Box3().setFromObject(root);
  if(!renderer.isSoftware)bloom=createHeroBloom(renderer,scene,camera,effects,CONFIG,shared);
  const shadow=document.createElement('div');shadow.className='piece-shadow';$('.scene-depth').appendChild(shadow);
  $('.hud-type strong').textContent=CONFIG.label.title;$('.hud-detail').textContent=CONFIG.label.detail;
  $('.hud-zone').textContent=CONFIG.label.zone;$('.hud-type small').textContent=CONFIG.label.note;

  // Responsive framing: DOM measurements only on resize/font changes, never on scroll.
  function renderSize(){
    const ratio=Math.min(devicePixelRatio,CONFIG.performance.maxDpr,Math.sqrt(CONFIG.performance.maxPixels/(width*height)))*quality;
    renderer.setPixelRatio(ratio);shared.pixelRatio.value=renderer.getPixelRatio();renderer.setSize(width,height,false);
    bloom?.setSize(width,height,mobile||coarse.matches,quality);
  }
  function resize(){
    width=stage.clientWidth;height=stage.clientHeight;
    mobile=width<=700&&height>width;
    camera.aspect=width/height;camera.updateProjectionMatrix();
    shared.lensRadius.value=mobile?CONFIG.lens.mobileRadius:CONFIG.lens.desktopRadius;
    lens.style.width=lens.style.height=shared.lensRadius.value*2+'px';
    const rect=stage.getBoundingClientRect(),c=copy.getBoundingClientRect(),h=$('.header').getBoundingClientRect(),bottom=$('.stage-bottom').getBoundingClientRect();
    const left=mobile?24:Math.max(c.right-rect.left+36,width*.51),right=width-Math.max(24,h.left-rect.left);
    const top=mobile?c.bottom-rect.top+26:h.bottom-rect.top+26;
    layout={left,right,top,bottom:bottom.top-rect.top-(mobile?20:54)};
    layout.bottom=Math.max(layout.top+130,layout.bottom);
    shadow.style.width=width*.34+'px';shadow.style.height=width*.08+'px';renderSize();schedule();
  }
  function project(local,out){point.copy(local).applyMatrix4(root.matrixWorld).project(camera);return out.set((point.x*.5+.5)*width,(.5-point.y*.5)*height);}
  function fitModel(){
    // Fit one parent, not the individual pieces. Their assembled poses never change.
    for(let pass=0;pass<2;pass++){
      root.updateWorldMatrix(true,false);camera.updateMatrixWorld();
      matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(root.matrixWorld);
      let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
      for(let i=0;i<8;i++){
        projected.set(i&1?modelBounds.max.x:modelBounds.min.x,i&2?modelBounds.max.y:modelBounds.min.y,i&4?modelBounds.max.z:modelBounds.min.z).applyMatrix4(matrix);
        const x=(projected.x*.5+.5)*width,y=(.5-projected.y*.5)*height;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
      }
      const scale=Math.min(1,(layout.right-layout.left)/(x1-x0),(layout.bottom-layout.top)/(y1-y0))*.98;
      const cx=(x0+x1)/2,cy=(y0+y1)/2,nx=(layout.left+layout.right)/2,ny=(layout.top+layout.bottom)/2;
      projected.copy(root.position).project(camera);
      projected.x=(((projected.x*.5+.5)*width-cx)*scale+nx)/width*2-1;
      projected.y=1-(((.5-projected.y*.5)*height-cy)*scale+ny)/height*2;
      root.position.copy(projected.unproject(camera));root.scale.multiplyScalar(scale);
      if(pass===1){
        const zone=`${Math.round(nx-(x1-x0)*scale/2)}px,${Math.round(ny-(y1-y0)*scale/2)}px,${Math.round((x1-x0)*scale)}px,${Math.round((y1-y0)*scale)}px`;
        if(zone!==lastTouchZone){lastTouchZone=zone;const [left,top,w,h]=zone.split(',');Object.assign($('.hero-interaction').style,{left,top,width:w,height:h});}
      }
    }
  }

  // Loading: one GSAP timeline, with no ScrollTrigger and no replay on scrolling.
  function startLoad(){
    if(reduced){finishLoad();return;}
    const gsap=window.gsap;
    if(!gsap){finishLoad();return;}
    timeline=gsap.timeline({onComplete:finishLoad});
    timeline.to(intro,{time:CONFIG.load.duration,duration:CONFIG.load.duration,ease:'none'},0);
    timeline.to(intro,{scan:1,duration:CONFIG.load.scanEnd-CONFIG.load.scanStart,ease:'none'},CONFIG.load.scanStart);
    timeline.fromTo('.header',{opacity:0},{opacity:1,duration:.7,ease:'power3.out'},.08);
    timeline.fromTo('.hero-rule',{scaleX:0,transformOrigin:'left'},{scaleX:1,duration:.65,ease:'power3.out'},.12);
    timeline.fromTo('.hero-eyebrow-text',{opacity:0},{opacity:1,duration:.65,ease:'power3.out'},.2);
    timeline.fromTo('.hero-title-line:not(.hero-title-accent)',{y:40,opacity:0},{y:0,opacity:1,duration:1,stagger:.17,ease:'power3.out'},.3);
    timeline.fromTo('.hero-title-accent',{y:16,opacity:0,scale:.985},{y:0,opacity:1,scale:1,duration:.35,ease:'expo.out'},2.02);
    timeline.fromTo('.hero-copy .intro,.hero-copy .primary,.hero-secondary',{opacity:0},{opacity:1,duration:.4,stagger:.06,ease:'power3.out'},1.86);
    timeline.fromTo('.hero-title-accent',{textShadow:'0 0 14px #ef44444d'},{textShadow:'0 0 0px #ef444400',duration:.22},2.18);
  }
  function finishLoad(){intro.scan=1;intro.time=CONFIG.load.duration;effects.reveal.value=1;effects.hideWire();stage.dataset.heroLoaded='true';}

  // Lens / HUD: one controller, one label, and a projected anchor per real defect.
  function selectDefect(defect){
    if(defect===activeDefect)return;
    activeDefect=defect;detection=0;hud.dataset.defect=defect.key;
    // Restart the existing reveal, rather than move an already-visible label
    // from the tube to a different component.
    found=false;hud.classList.remove('is-detected');hud.setAttribute('aria-hidden','true');
    $('.hud-type strong').textContent=defect.label.title;$('.hud-detail').textContent=defect.label.detail;
    $('.hud-zone').textContent=defect.label.zone;$('.hud-type small').textContent=defect.label.note;
  }
  function drawHUD(){
    const opacity=reduced?1:detection;
    const alpha=opacity.toFixed(3);if(alpha!==lastHUDAlpha){lastHUDAlpha=alpha;hud.style.opacity=alpha;}
    const detected=opacity>.18;
    if(detected!==found){found=detected;hud.classList.toggle('is-detected',found);hud.setAttribute('aria-hidden',String(!found));
      if(found&&(pinned||dragId!==null))$('.hero-sr-status').textContent=`${activeDefect.label.title}. ${activeDefect.label.detail}. ${activeDefect.label.zone}. ${activeDefect.label.note}.`;
    }
    if(opacity<.001)return;
    const cardWidth=mobile?222:248,cardHeight=105;
    const x=clamp(targetScreen.x+56,mobile?18:layout.left,width-cardWidth-18);
    const y=clamp(targetScreen.y-cardHeight-48,layout.top,Math.max(layout.top,layout.bottom-cardHeight));
    const key=[targetScreen.x,targetScreen.y,x,y].map(n=>n.toFixed(1)).join(',');
    if(key!==lastHUD){lastHUD=key;
      reticle.style.transform=`translate(${targetScreen.x.toFixed(1)}px,${targetScreen.y.toFixed(1)}px)`;
      label.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      const ex=clamp(targetScreen.x,x,x+cardWidth),ey=y+cardHeight;
      leader.setAttribute('d',`M${targetScreen.x.toFixed(1)} ${targetScreen.y.toFixed(1)} L${ex.toFixed(1)} ${(ey+14).toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}`);
    }
  }
  function updateLens(dt,idle){
    for(const defect of defects){
      point.copy(defect.position).applyMatrix4(defect.space.matrixWorld).project(camera);
      defect.screen.set((point.x*.5+.5)*width,(.5-point.y*.5)*height);
    }
    // Preserve the existing keyboard action, static view and mobile tour on
    // the tube. Manual mouse/touch inspection can detect any of the three.
    const automatic=reduced||pinned||((mobile||coarse.matches)&&dragId===null&&elapsed-lastDrag>=CONFIG.lens.dragGrace);
    if(automatic)selectDefect(defects[0]);
    targetScreen.copy(activeDefect.screen);
    let active=false,desiredX=pointer.px,desiredY=pointer.py;
    if(reduced||pinned){active=true;desiredX=targetScreen.x;desiredY=targetScreen.y;}
    else if(dragId!==null||elapsed-lastDrag<CONFIG.lens.dragGrace){active=true;}
    else if((mobile||coarse.matches)&&intro.scan===1){
      // Touch demo: scan, settle on the actual defect, withdraw, then repeat.
      const t=((idle-demoStart)%CONFIG.mobile.demoPeriod+CONFIG.mobile.demoPeriod)%CONFIG.mobile.demoPeriod/CONFIG.mobile.demoDuration;
      active=t<1;
      if(t<.34){autoPoint.set(mix(1.9,.65,smooth(0,.34,t)),.15,.65);project(autoPoint,lensPoint);}
      else if(t<.56){autoPoint.set(.65,.15,.65).lerp(anchor,smooth(.34,.56,t));project(autoPoint,lensPoint);}
      else if(t<.84)lensPoint.copy(targetScreen);
      else{autoPoint.copy(anchor).lerp(demoExit,smooth(.84,1,t));project(autoPoint,lensPoint);}
      desiredX=lensPoint.x;desiredY=lensPoint.y;
    }else if(pointer.active&&intro.scan===1){
      ray.set(pointer.px/width*2-1,1-pointer.py/height*2);raycaster.setFromCamera(ray,camera);
      active=raycaster.intersectObjects(model.pickMeshes,false).length>0;
    }
    if(intro.scan<1&&!reduced)active=false;
    if(active&&!automatic){
      let nearest=activeDefect,distance=Math.hypot(desiredX-nearest.screen.x,desiredY-nearest.screen.y);
      for(const defect of defects){
        const next=Math.hypot(desiredX-defect.screen.x,desiredY-defect.screen.y);
        // Small hysteresis prevents label flicker between adjacent components.
        if(next+4<distance){nearest=defect;distance=next;}
      }
      selectDefect(nearest);targetScreen.copy(activeDefect.screen);
    }
    lensPower=reduced?1:mix(lensPower,active?1:0,1-Math.exp(-dt*14));
    shared.lensCenter.value.set(desiredX,height-desiredY);
    for(const piece of model.pieces){piece.u.hoverPower.value=lensPower;piece.u.scanPower.value=0;piece.u.surfacePower.value=0;}
    const near=active&&Math.hypot(desiredX-targetScreen.x,desiredY-targetScreen.y)<Math.min(CONFIG.fissure.threshold,shared.lensRadius.value-10);
    lensGlow=lensPower>.02&&Math.hypot(desiredX-targetScreen.x,desiredY-targetScreen.y)<shared.lensRadius.value+18;
    detection=reduced?1:mix(detection,near?1:0,1-Math.exp(-dt*(near?14:9)));
    const state=reduced?'reduced':intro.scan<1?'loading':detection>.18?'detected':active?'inspecting':'idle';
    if(stage.dataset.heroState!==state)stage.dataset.heroState=state;
    stage.classList.toggle('is-inspecting',active);
    const key=[desiredX,desiredY,lensPower].map(n=>n.toFixed(2)).join(',');
    if(key!==lastLens){lastLens=key;lens.style.left=desiredX+'px';lens.style.top=desiredY+'px';lens.style.opacity=lensPower.toFixed(3);}
    const arrow=`rotate(${Math.atan2(targetScreen.y-desiredY,targetScreen.x-desiredX).toFixed(3)}rad) translateX(${shared.lensRadius.value-7}px)`,arrowAlpha=(active?1-detection:0).toFixed(3);
    if(arrow+arrowAlpha!==lastDirection){lastDirection=arrow+arrowAlpha;direction.style.transform=arrow;direction.style.opacity=arrowAlpha;}
    model.crack.visible=lensPower>.001;
    for(const piece of model.pieces)if(piece.defect)piece.defect.mesh.visible=lensPower>.001;
    effects.setFractureGlow(CONFIG.fissure.emissive+.18*Math.sin(elapsed*2.5),activeDefect.key,detection*CONFIG.fissure.detectedEmissive);
    drawHUD();
  }

  // Idle: one assembled parent, a restrained camera, one ultrasound pulse.
  function draw(dt){
    elapsed+=reduced?0:dt;
    if(!timeline&&!reduced&&intro.time<CONFIG.load.duration){intro.time+=dt;intro.scan=smooth(CONFIG.load.scanStart,CONFIG.load.scanEnd,intro.time);}
    const idle=Math.max(0,elapsed-CONFIG.load.duration),phase=idle/CONFIG.idle.period*Math.PI*2;
    const damping=1-Math.exp(-dt*CONFIG.idle.damping);
    damped.x=reduced?0:mix(damped.x,pointer.x,damping);damped.y=reduced?0:mix(damped.y,pointer.y,damping);
    const angle=THREE.MathUtils.degToRad(CONFIG.idle.parallaxDegrees);
    const worldHeight=2*Math.tan(THREE.MathUtils.degToRad(17))*9,worldWidth=worldHeight*width/height;
    root.scale.setScalar(worldWidth*(mobile?.145:.072));
    root.position.set(0,0,0);
    root.rotation.set((mobile?.15:.20)+damped.y*angle,-.60+(reduced?0:Math.sin(phase*.65)*THREE.MathUtils.degToRad(CONFIG.idle.yawDegrees))+damped.x*angle,mobile?.25:.38);
    camera.position.set(damped.x*.10,damped.y*.06,9);camera.lookAt(0,0,0);
    fitModel();
    // Apply the idle float after fitting, otherwise recentering cancels it.
    if(!reduced)root.position.y+=Math.sin(phase)*CONFIG.idle.floatAmplitude;
    root.updateWorldMatrix(true,true);effects.updateMatrix();
    for(const piece of model.pieces)piece.u.inspectionMatrix.value.copy(piece.group.matrixWorld).invert();
    const dx=Math.round(damped.x*22),dy=Math.round(damped.y*14),light=`${dx},${dy}`;
    if(light!==lastLight){lastLight=light;stage.style.setProperty('--light-dx',dx+'px');stage.style.setProperty('--light-dy',dy+'px');}
    effects.reveal.value=renderer.isSoftware?1:intro.scan;
    effects.scan.value=mix(...CONFIG.load.axis,intro.scan);
    effects.laser.position.x=effects.plane.position.x=effects.scan.value;
    const loading=!reduced&&intro.scan<.999&&!renderer.isSoftware;
    effects.laser.visible=effects.plane.visible=loading;
    effects.laser.material.opacity=loading?Math.sin(intro.scan*Math.PI)*.9:0;
    effects.plane.material.opacity=effects.laser.material.opacity*.045;
    const crossTime=CONFIG.load.scanStart+(CONFIG.load.scanEnd-CONFIG.load.scanStart)*.5;
    const since=intro.time-crossTime,heat=!reduced&&since>=0?Math.pow(1-clamp(since/CONFIG.load.cooling),2)*3.5:0;
    model.weld.material.emissiveIntensity=heat;
    if(heat>.01)model.weld.layers.enable(effects.bloomLayer);else model.weld.layers.disable(effects.bloomLayer);
    const waveTime=(idle+CONFIG.wave.period-2.5)%CONFIG.wave.period/CONFIG.wave.duration;
    const wave=!reduced&&intro.scan===1&&waveTime<1;
    const waveX=mix(-2.3,2.3,waveTime),fault=Math.exp(-Math.pow((waveX-anchor.x)/.16,2.));
    model.ring.visible=wave;model.ring.position.x=waveX;
    model.ring.material.color.set(wave&&fault>.3?CONFIG.colors.laser:'#c7dbe2');
    model.ring.material.opacity=wave?Math.sin(waveTime*Math.PI)*CONFIG.wave.opacity*(1+fault*.6):0;
    model.pulses.forEach((ring,i)=>{ring.visible=wave;ring.position.x=waveX-(i+1)*.085;ring.material.color.copy(model.ring.material.color);ring.material.opacity=model.ring.material.opacity*.12/(i+1);});
    const spec=(idle+CONFIG.specular.period-5)%CONFIG.specular.period/CONFIG.specular.duration;
    effects.sweep.value=mix(-3,3,spec);effects.sweepPower.value=!reduced&&intro.scan===1&&spec<1?Math.sin(spec*Math.PI)*CONFIG.specular.strength:0;
    updateLens(dt,idle);
    projected.copy(root.position).project(camera);
    shadow.style.transform=`translate(${(projected.x*.5+.5)*width}px,${(.5-projected.y*.5)*height+Math.min(width*.08,92)}px) translate(-50%,-50%)`;
    if(bloom)bloom.render(dt,loading||heat>.01||wave||lensGlow);else renderer.render(scene,camera);
  }

  // Visibility / accessibility: no rAF polling offscreen, and one static frame
  // in reduced-motion mode (including when the preference changes at runtime).
  function schedule(){if(!raf&&ready&&!destroyed&&visible&&inViewport)raf=requestAnimationFrame(frame);}
  function frame(now){
    raf=0;if(!ready||destroyed||!visible||!inViewport)return;
    const dt=Math.min(.05,(now-previous)/1000||1/60);previous=now;
    draw(dt);
    average=mix(average,dt*1000,.035);
    if(!renderer.isSoftware&&++samples>150&&now-lastQuality>4000){
      const next=average>20?Math.max(.6,quality-.1):average<17?Math.min(1,quality+.05):quality;
      if(next!==quality){quality=next;renderSize();}samples=0;lastQuality=now;
    }
    if(!reduced)schedule();
  }
  function syncVisibility(){
    if(!visible||!inViewport){cancelAnimationFrame(raf);raf=0;timeline?.pause();previous=0;}
    else{if(!reduced)timeline?.resume();previous=performance.now();schedule();}
  }
  function setReduced(value){
    reduced=value||renderer.isSoftware;document.body.classList.toggle('reduced',reduced);hud.classList.toggle('is-static',reduced);
    motionButton.setAttribute('aria-pressed',String(reduced));motionButton.textContent=reduced?'Activar movimiento':'Reducir movimiento';
    control.disabled=reduced;control.setAttribute('aria-pressed',String(reduced||pinned));
    if(reduced){timeline?.progress(1).pause();finishLoad();pointer.x=pointer.y=0;}
    resize();syncVisibility();
  }
  function track(event){
    const r=stage.getBoundingClientRect();pointer.px=event.clientX-r.left;pointer.py=event.clientY-r.top;
    pointer.x=clamp(pointer.px/width-.5,-.5,.5);pointer.y=clamp(pointer.py/height-.5,-.5,.5);
  }
  stage.addEventListener('pointermove',event=>{
    if(reduced)return;
    if(event.pointerType==='touch'&&dragId===null)return;
    track(event);pointer.active=!event.target.closest('a,button,.chapter-copy');
    if(dragId!==null){lastDrag=elapsed;pinned=false;control.setAttribute('aria-pressed','false');}
  },{passive:true});
  stage.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch')pointer.active=false;});
  const zone=$('.hero-interaction');
  zone.addEventListener('pointerdown',event=>{
    if(reduced||event.pointerType==='mouse')return;
    dragId=event.pointerId;lastDrag=elapsed;pinned=false;track(event);pointer.active=true;zone.setPointerCapture(event.pointerId);
  });
  function release(event){if(event.pointerId!==dragId)return;dragId=null;lastDrag=elapsed;demoStart=Math.max(0,elapsed-CONFIG.load.duration)+CONFIG.lens.dragGrace;}
  zone.addEventListener('pointerup',release);zone.addEventListener('pointercancel',release);
  control.addEventListener('click',()=>{pinned=!pinned;control.setAttribute('aria-pressed',String(pinned));});
  stage.addEventListener('keydown',event=>{if(event.key==='Escape'){pinned=false;pointer.active=false;control.setAttribute('aria-pressed','false');}});
  window.addEventListener('blur',()=>{pointer.active=false;pointer.x=pointer.y=0;});
  preference.addEventListener('change',event=>setReduced(event.matches));
  motionButton.addEventListener('click',()=>setReduced(!reduced));
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;syncVisibility();});
  const observer=new IntersectionObserver(([entry])=>{inViewport=entry.isIntersecting&&entry.intersectionRatio>0;syncVisibility();},{threshold:[0,.001]});observer.observe(story);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);document.fonts.ready.then(()=>{if(!destroyed)resize();});
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();destroyed=true;cancelAnimationFrame(raf);timeline?.progress(1).pause();document.body.classList.add('scene-failed');$('.scene-loading').setAttribute('aria-hidden','false');$('.scene-loading').textContent='La vista 3D no está disponible. Podés continuar con nuestros servicios.';});
  window.addEventListener('pagehide',event=>{
    if(event.persisted){visible=false;syncVisibility();return;}
    destroyed=true;cancelAnimationFrame(raf);timeline?.kill();observer.disconnect();resizeObserver.disconnect();bloom?.dispose();renderer.dispose();model.pmrem?.dispose();model.envMap?.dispose();model.texture.dispose();
    const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  });
  window.addEventListener('pageshow',()=>{visible=!document.hidden;syncVisibility();});
  resize();ready=true;setReduced(reduced);
  document.body.classList.add('scene-ready');$('.scene-loading').setAttribute('aria-hidden','true');
  startLoad();schedule();
}
