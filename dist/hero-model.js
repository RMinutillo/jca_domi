import * as THREE from './vendor/three.module.js';
import {createAdditionalModels} from './additional-models.js';
import {createMechanicalCore} from './mechanical-core.js';
import {createRecessedFracture} from './fracture.js';
import {createInspectionUniforms,applyInspectionCut,createInspectionLines} from './inspection.js';
import {CONFIG} from './hero-config.js';
const mix=(a,b,t)=>a+(b-a)*t;

// Existing procedural geometry, steel materials and geometric inspection cut.
// The assembled pieces now stay inside one parent; no scroll/despiece controller.
export function createHeroModel(renderer,scene,shared){
  let texture,pmrem,envMap,scanUniforms,assembly,shellRear,shellFront,crack,ring;
  const pieces=[],pickMeshes=[],pulses=[];
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
    // Keep the original recessed crack, but clear the bearing that occluded it.
    points:[[-.48,.14],[-.46,.21],[-.49,.26],[-.43,.32],[-.45,.37],[-.39,.43],[-.40,.48],[-.37,.54]].map(([x,y])=>[x+CONFIG.fissure.position[0]+.45,y+CONFIG.fissure.position[1]-.37]),
    surface:(x,y,sink)=>[x,y,-Math.sqrt(Math.max(0,(.621+sink)**2-y*y))],width:CONFIG.fissure.width
  });
}

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

  const root=new THREE.Group();scene.add(root);
  pieces.forEach((piece,i)=>{
    root.add(piece.group);piece.group.userData.piece=piece;
    if(i){piece.group.position.x=i===1?-2.42:2.36;piece.group.rotation.y=i===1?-Math.PI/2:Math.PI/2;}
    piece.group.traverse(object=>{
      if(object.isMesh&&object.material.isMeshStandardMaterial){
        object.userData.piece=piece;pickMeshes.push(object);
      }
    });
  });
  // Each marker belongs to the same local space as its actual recessed mesh.
  // Keep this hero-only: the shared plate/housing builders are also used elsewhere.
  const defects=[
    {key:'tube',mesh:crack,space:assembly,position:new THREE.Vector3(...CONFIG.fissure.position),label:CONFIG.label},
    {key:'plate',mesh:pieces[1].defect.mesh,space:pieces[1].group,position:new THREE.Vector3(.016,-.015,.05),
      label:{...CONFIG.label,detail:'Fisura en placa soldada',zone:'Unión soldada'}},
    {key:'housing',mesh:pieces[2].defect.mesh,space:pieces[2].group,position:new THREE.Vector3(.775,.236,.10),
      label:{...CONFIG.label,detail:'Fisura en carcasa',zone:'Entorno del alojamiento'}}
  ];
  return {root,pieces,defects,pickMeshes,scanUniforms,crack,weld,ring,pulses,texture,pmrem,envMap};
}
