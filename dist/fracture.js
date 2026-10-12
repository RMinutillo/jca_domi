import * as THREE from './vendor/three.module.js';
import {applyInspectionCut} from './inspection.js';

// A metal section with an actual opening, bevelled sides and a recessed floor.
// The complete section is revealed only inside the existing scan/cursor window.
export function createRecessedFracture(uniforms,{outline,points,surface,width=.012,depth=.020}){
  const group=new THREE.Group();
  const material=(color,roughness,metalness,detail=false)=>{
    const mat=applyInspectionCut(new THREE.MeshStandardMaterial({
      color,roughness,metalness,envMapIntensity:1,side:THREE.DoubleSide
    }),uniforms,{interior:true});
    mat.userData.fracture=true;mat.userData.fractureDetail=detail;
    return mat;
  };
  const steel=material(0x89929c,.43,.90),bevel=material(0x666e77,.57,.72,true),floor=material(0x15191d,.96,.12,true);
  const lanes=[-1,-.24,.24,1],sinks=[0,depth,depth,0],positions=[],left=[],right=[];
  points.forEach(([x,y],i)=>{
    const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)];
    const dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1;
    const tip=i===0||i===points.length-1?.035:1;
    const halfWidth=width*tip*(.83+.17*Math.sin(i*2.7+1));
    lanes.forEach((lane,j)=>{
      const u=x-dy/length*lane*halfWidth,v=y+dx/length*lane*halfWidth;
      positions.push(...surface(u,v,sinks[j]*tip));
      if(j===0)left.push(new THREE.Vector2(u,v));
      if(j===3)right.push(new THREE.Vector2(u,v));
    });
  });
  const section=outline.clone(),hole=new THREE.Path().setFromPoints([...left,...right.reverse()]);hole.closePath();section.holes.push(hole);
  // Subdivide in surface coordinates so a curved inner wall stays smooth.
  const flat=new THREE.ShapeGeometry(section,24),uv=flat.attributes.position,index=flat.index.array,wall=[],normals=[];
  const vx=new THREE.Vector3(),vy=new THREE.Vector3(),n=new THREE.Vector3();
  function vertex(p){
    wall.push(...surface(p.x,p.y,0));
    vx.fromArray(surface(p.x+.0001,p.y,0)).sub(new THREE.Vector3(...surface(p.x-.0001,p.y,0)));
    vy.fromArray(surface(p.x,p.y+.0001,0)).sub(new THREE.Vector3(...surface(p.x,p.y-.0001,0)));
    n.crossVectors(vx,vy).normalize();normals.push(n.x,n.y,n.z);
  }
  function subdivide(a,b,c,level=0){
    if(level<5&&Math.max(a.distanceTo(b),b.distanceTo(c),c.distanceTo(a))>.16){
      const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);
      subdivide(a,ab,ca,level+1);subdivide(ab,b,bc,level+1);subdivide(ca,bc,c,level+1);subdivide(ab,bc,ca,level+1);
    }else{vertex(a);vertex(b);vertex(c);}
  }
  for(let i=0;i<index.length;i+=3)subdivide(...[0,1,2].map(j=>new THREE.Vector2().fromBufferAttribute(uv,index[i+j])));
  flat.dispose();
  const backing=new THREE.BufferGeometry();backing.setAttribute('position',new THREE.Float32BufferAttribute(wall,3));backing.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));group.add(new THREE.Mesh(backing,steel));
  for(let lane=0;lane<lanes.length-1;lane++){
    const indices=[],g=new THREE.BufferGeometry();
    for(let i=0;i<points.length-1;i++){
      const a=i*lanes.length+lane,b=a+lanes.length;indices.push(a,b,a+1,b,b+1,a+1);
    }
    g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    // Ordinary depth testing lets solid internal components occlude the defect.
    group.add(new THREE.Mesh(g,lane===1?floor:bevel));
  }
  return group;
}
