import * as THREE from './vendor/three.module.js';

// A real coaxial assembly: the shell can open while these components retain
// their depth, lighting and occlusion. No flat image or wireframe substitute.
export function createMechanicalCore(software=false){
  const group=new THREE.Group(),segments=software?40:96;
  const steel=new THREE.MeshStandardMaterial({color:0xb9c3cc,metalness:1,roughness:.22,envMapIntensity:1.4});
  const dark=new THREE.MeshStandardMaterial({color:0x424b55,metalness:.92,roughness:.31});
  const cage=new THREE.MeshStandardMaterial({color:0xafa28a,metalness:.88,roughness:.28});
  function mesh(geometry,material,parent=group){
    const object=new THREE.Mesh(geometry,material);object.userData.inspectionCore=true;parent.add(object);return object;
  }
  function turned(profile,material,parent=group){
    const geo=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),segments);geo.rotateZ(-Math.PI/2);return mesh(geo,material,parent);
  }
  turned([[0,-2.20],[.19,-2.20],[.22,-2.12],[.22,-1.0],[.26,-.92],[.26,.92],[.22,1.0],[.22,2.33],[.19,2.40],[0,2.40]],steel);
  // A key and machined shoulders make the central shaft readable at a glance.
  const key=mesh(new THREE.BoxGeometry(.60,.045,.095),dark);key.position.set(1.62,.22,0);
  for(const x of [-1.3,1.25]){
    const shoulder=turned([[.22,-.055],[.33,-.055],[.35,-.035],[.35,.035],[.33,.055],[.22,.055],[.22,-.055]],steel);shoulder.position.x=x;
  }
  for(const x of [-.40,.40]){
    const bearing=new THREE.Group();bearing.position.x=x;group.add(bearing);
    turned([[.255,-.15],[.32,-.15],[.345,-.11],[.345,.11],[.32,.15],[.255,.15],[.255,-.15]],steel,bearing);
    turned([[.49,-.15],[.575,-.15],[.59,-.12],[.59,.12],[.575,.15],[.49,.15],[.49,-.15]],steel,bearing);
    for(let i=0;i<10;i++){
      const a=i/10*Math.PI*2;
      const ball=mesh(new THREE.SphereGeometry(.084,software?10:20,software?8:14),steel,bearing);ball.position.set(0,.418*Math.cos(a),.418*Math.sin(a));
    }
    for(const side of [-1,1]){
      const retainer=mesh(new THREE.TorusGeometry(.418,.014,6,segments),cage,bearing);retainer.rotation.y=Math.PI/2;retainer.position.x=side*.075;
    }
  }
  for(const x of [-1.70,1.83]){
    const seal=turned([[.23,-.045],[.53,-.045],[.55,-.02],[.55,.02],[.53,.045],[.23,.045],[.23,-.045]],dark);seal.position.x=x;
    const lip=mesh(new THREE.TorusGeometry(.49,.012,6,segments),steel);lip.rotation.y=Math.PI/2;lip.position.x=x+.048;
  }
  return group;
}
