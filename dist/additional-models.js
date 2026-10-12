import * as THREE from './vendor/three.module.js';
import {createRecessedFracture} from './fracture.js';
import {createInspectionUniforms,applyInspectionCut,createInspectionLines} from './inspection.js';

export function createAdditionalModels(makeMaterial, shared, software){
  const radial=software?40:96;
  const uniforms=()=>createInspectionUniforms(shared);
  const steel=(u,color=0xb0b6bd,roughness=.28)=>makeMaterial({color,roughness},u);
  function roundedShape(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
  function hole(shape,x,y,r){const h=new THREE.Path();h.absarc(x,y,r,0,Math.PI*2,true);shape.holes.push(h);}
  function extrude(shape,depth,bevel=.035){const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:software?2:4,bevelSize:bevel,bevelThickness:bevel,curveSegments:software?16:32});g.translate(0,0,-depth/2);return g;}
  function mesh(group,geometry,material){const m=new THREE.Mesh(geometry,material);group.add(m);return m;}
  function internalLines(group,points,u){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    const lines=createInspectionLines(geometry,u,.64);group.add(lines);return lines;
  }
  function outline(points,shape,z,offsetX=0){
    const contour=shape.getPoints(10);
    for(let i=1;i<contour.length;i++)points.push(contour[i-1].x+offsetX,contour[i-1].y,z,contour[i].x+offsetX,contour[i].y,z);
  }
  function circle(points,x,y,r,z,segments=48){
    for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;points.push(x+r*Math.cos(a),y+r*Math.sin(a),z,x+r*Math.cos(b),y+r*Math.sin(b),z);}
  }
  function bore(points,x,y,r,front,back,links=6){
    circle(points,x,y,r,front);circle(points,x,y,r,back);
    for(let i=0;i<links;i++){const a=i/links*Math.PI*2;points.push(x+r*Math.cos(a),y+r*Math.sin(a),front,x+r*Math.cos(a),y+r*Math.sin(a),back);}
  }
  function interiorBody(group,geometry,u){
    const material=applyInspectionCut(new THREE.MeshBasicMaterial({color:0x91aabb,transparent:true,opacity:.10,depthWrite:false,side:THREE.DoubleSide}),u,{interior:true});
    const body=mesh(group,geometry,material);body.renderOrder=3;
  }
  // Welded test coupon: two substantial plates, rounded corners and a scalloped bead.
  const plateGroup=new THREE.Group(),pu=uniforms();
  const plateMaterial=steel(pu,0x8a929c,.36),edgeMaterial=steel(pu,0xd0d2d4,.27);
  const plateShape=roundedShape(1.16,2.15,.07);
  hole(plateShape,-.34,.80,.055);hole(plateShape,.34,-.80,.055);
  const left=extrude(plateShape,.22);left.translate(-.615,0,0);
  const right=extrude(plateShape,.22);right.translate(.615,0,0);
  mesh(plateGroup,left,plateMaterial);mesh(plateGroup,right,plateMaterial);
  const weldMat=steel(pu,0xaca7a0,.48);
  const path=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-1.03,.11),new THREE.Vector3(.012,0,.12),new THREE.Vector3(-.006,1.03,.11)]);
  mesh(plateGroup,new THREE.TubeGeometry(path,26,.066,8,false),weldMat);
  for(let i=0;i<24;i++){const bead=mesh(plateGroup,new THREE.TorusGeometry(.05,.009,5,12,Math.PI*1.2),edgeMaterial);bead.rotation.z=-Math.PI*.1;bead.position.set(0,-.97+i*.083,.154);bead.scale.y=.58;}
  const plateLines=[];
  for(let x=-1.12;x<=1.13;x+=.28)plateLines.push(x,-1.02,0,x,1.02,0);
  for(let y=-1.02;y<=1.03;y+=.34)plateLines.push(-1.12,y,0,1.12,y,0);
  for(const side of [-1,1]){
    for(const z of [-.11,.11])outline(plateLines,plateShape,z,side*.615);
  }
  interiorBody(plateGroup,left,pu);interiorBody(plateGroup,right,pu);
  internalLines(plateGroup,plateLines,pu);
  // A deliberate interior indication, distinct from the visible weld bead.
  const plateSection=roundedShape(2.39,2.15,.07);
  for(const offset of [-.615,.615]){hole(plateSection,offset-.34,.80,.055);hole(plateSection,offset+.34,-.80,.055);}
  const plateFracture=createRecessedFracture(pu,{
    outline:plateSection,
    points:[[-.024,-.32],[.002,-.24],[-.011,-.18],[.026,-.09],[.016,-.015],[.049,.07],[.031,.14],[.046,.24],[.036,.29]],
    surface:(x,y,sink)=>[x,y,.05-sink],width:.010,depth:.016
  });
  plateGroup.add(plateFracture);
  const plateDefect={mesh:plateFracture};

  // Machined bearing housing: rounded body, central bore, stepped sleeve and four mounting holes.
  const housingGroup=new THREE.Group(),hu=uniforms();
  const housingMat=steel(hu,0xb8bdc3,.24),recessMat=steel(hu,0x535e6a,.34);
  const shape=roundedShape(2.18,2.18,.26);hole(shape,0,0,.62);
  for(const x of [-.81,.81])for(const y of [-.81,.81])hole(shape,x,y,.105);
  const housingBody=extrude(shape,.38,.045);mesh(housingGroup,housingBody,housingMat);
  const profile=[[.62,-.14],[.70,-.14],[.78,.23],[.80,.30],[.80,.45],[.76,.49],[.63,.49],[.60,.44],[.60,-.14],[.62,-.14]].map(p=>new THREE.Vector2(p[0],p[1]));
  const sleeve=new THREE.LatheGeometry(profile,radial);sleeve.rotateX(Math.PI/2);mesh(housingGroup,sleeve,housingMat);
  for(const z of [.41,.32]){const r=mesh(housingGroup,new THREE.TorusGeometry(.72,.023,8,radial),recessMat);r.position.z=z;}
  const screws=steel(hu,0x646e78,.3);
  for(const x of [-.81,.81])for(const y of [-.81,.81]){const washer=mesh(housingGroup,new THREE.TorusGeometry(.105,.027,8,24),screws);washer.position.set(x,y,.247);}
  // Structural ribs on the reverse make rotation reveal a genuinely different silhouette.
  for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;const rib=mesh(housingGroup,new THREE.BoxGeometry(.11,.32,.14),recessMat);rib.position.set(Math.cos(a)*.90,Math.sin(a)*.90,-.24);rib.rotation.z=a-Math.PI/2;}
  const housingLines=[];
  // Keep the full envelope, wall thickness and each drilled passage readable
  // inside the inspection aperture. The central bore remains genuinely empty.
  for(const z of [-.19,.19])outline(housingLines,shape,z);
  for(const x of [-.83,.83])for(const y of [-1.09,1.09])housingLines.push(x,y,-.19,x,y,.19);
  for(const x of [-1.09,1.09])for(const y of [-.83,.83])housingLines.push(x,y,-.19,x,y,.19);
  bore(housingLines,0,0,.62,.44,-.19,12);
  circle(housingLines,0,0,.78,.23);circle(housingLines,0,0,.80,.44);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;housingLines.push(.78*Math.cos(a),.78*Math.sin(a),.23,.80*Math.cos(a),.80*Math.sin(a),.44);}
  for(const x of [-.81,.81])for(const y of [-.81,.81])bore(housingLines,x,y,.105,.19,-.19,4);
  interiorBody(housingGroup,housingBody,hu);interiorBody(housingGroup,sleeve,hu);
  internalLines(housingGroup,housingLines,hu);
  const housingFracture=createRecessedFracture(hu,{
    outline:shape,
    points:[[.64,.18],[.70,.205],[.728,.245],[.775,.236],[.82,.29],[.90,.325]],
    surface:(x,y,sink)=>[x,y,.10-sink],width:.010,depth:.018
  });
  housingGroup.add(housingFracture);
  const housingDefect={mesh:housingFracture};
  return [
    {group:plateGroup,u:pu,name:'Placa soldada',key:'surface',defect:plateDefect,hover:0,selected:0},
    {group:housingGroup,u:hu,name:'Carcasa mecanizada',key:'radiography',defect:housingDefect,hover:0,selected:0}
  ];
}
