import * as THREE from './vendor/three.module.js';

// Same geometry and camera, with a lightweight studio-shaded canvas fallback.
export function createSoftwareRenderer(){
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  const layer=document.createElement('canvas'),lc=layer.getContext('2d');
  let width=1,height=1,dpr=1,lastFrame=0;
  const cache=new WeakMap(),mv=new THREE.Matrix4(),normalMatrix=new THREE.Matrix3();
  const point=new THREE.Vector3(),normal=new THREE.Vector3(),projected=new THREE.Vector3();
  function luminance(nx,ny,nz){
    const length=Math.hypot(nx,ny,nz)||1;nx/=length;ny/=length;nz/=length;
    const ry=2*nz*ny,rx=2*nz*nx;
    const top=Math.exp(-Math.pow((ry-.74)/.31,2))*1.55;
    const left=Math.exp(-Math.pow((rx+.73)/.3,2))*.95;
    const rim=Math.exp(-Math.pow((ry+.58)/.13,2))*.36;
    const light=.055+top+left+rim+Math.max(0,ny)*.07;
    return 255*Math.pow(light/(light+.54),.58);
  }
  function shade(v,mat){const tint=mat.color;if(mat.userData.fractureDetail){if(mat.emissiveIntensity>0){const glow=mat.emissive;return `rgb(${Math.round(255*Math.sqrt(glow.r))},${Math.round(255*Math.sqrt(glow.g))},${Math.round(255*Math.sqrt(glow.b))})`;}return `rgb(${Math.round(v*(.06+Math.sqrt(tint.r)*.94))},${Math.round(v*(.06+Math.sqrt(tint.g)*.94))},${Math.round(v*(.06+Math.sqrt(tint.b)*.94))})`;}return `rgb(${Math.round(v*(.84+tint.r*.18))},${Math.round(v*(.88+tint.g*.18))},${Math.round(v*(.93+tint.b*.16))})`;}
  function render(scene,camera){
    const now=performance.now();if(now-lastFrame<34)return;lastFrame=now;
    ctx.clearRect(0,0,width,height);scene.updateMatrixWorld();camera.updateMatrixWorld();
    const batches=new Map();
    function batch(object){let ancestor=object;while(ancestor.parent&&!ancestor.userData.piece)ancestor=ancestor.parent;const key=ancestor.userData.piece||scene;if(!batches.has(key))batches.set(key,{faces:[],interiors:[],effects:[],lines:[],u:key.u,piece:key});return batches.get(key);}
    scene.traverseVisible(object=>{
      if(!object.geometry||!object.material)return;
      const output=batch(object);
      if(object.isLineSegments){output.lines.push(object);return;}
      if(!object.isMesh||object.material.opacity<.003)return;
      const geo=object.geometry,pos=geo.attributes.position,norm=geo.attributes.normal;
      let vertices=cache.get(geo);if(!vertices){vertices=new Float32Array(pos.count*7);cache.set(geo,vertices);}
      mv.multiplyMatrices(camera.matrixWorldInverse,object.matrixWorld);normalMatrix.getNormalMatrix(mv);
      for(let i=0;i<pos.count;i++){
        point.fromBufferAttribute(pos,i).applyMatrix4(mv);projected.copy(point).applyMatrix4(camera.projectionMatrix);normal.fromBufferAttribute(norm,i).applyMatrix3(normalMatrix).normalize();
        const n=i*7;vertices[n]=(projected.x*.5+.5)*width;vertices[n+1]=(-projected.y*.5+.5)*height;vertices[n+2]=point.z;vertices[n+3]=normal.x;vertices[n+4]=normal.y;vertices[n+5]=normal.z;vertices[n+6]=luminance(normal.x,normal.y,normal.z);
      }
      const indices=geo.index?.array,count=indices?indices.length:pos.count,mat=object.material,u=mat.userData.inspectUniforms;
      for(let i=0;i<count;i+=3){
        const a=indices?indices[i]:i,b=indices?indices[i+1]:i+1,c=indices?indices[i+2]:i+2,A=a*7,B=b*7,C=c*7;
        const winding=(vertices[B]-vertices[A])*(vertices[C+1]-vertices[A+1])-(vertices[B+1]-vertices[A+1])*(vertices[C]-vertices[A]);if(winding>=0&&!mat.userData.fracture)continue;
        let alpha=mat.opacity;

        if(alpha<.035)continue;
        const f={v:[vertices[A],vertices[A+1],vertices[B],vertices[B+1],vertices[C],vertices[C+1]],lights:[vertices[A+6],vertices[B+6],vertices[C+6]],z:(vertices[A+2]+vertices[B+2]+vertices[C+2])/3,mat,alpha,core:object.userData.inspectionCore===true};
        (mat.isMeshBasicMaterial?output.effects:mat.userData.inspectionInterior?output.interiors:output.faces).push(f);
      }
    });
    function draw(f){
      const v=f.v;lc.globalAlpha=f.alpha;lc.beginPath();lc.moveTo(v[0],v[1]);lc.lineTo(v[2],v[3]);lc.lineTo(v[4],v[5]);lc.closePath();
      let fill;
      if(f.mat.isMeshBasicMaterial)fill='#'+f.mat.color.getHexString();
      else{
        const l=f.lights,low=l.indexOf(Math.min(...l)),high=l.indexOf(Math.max(...l));
        if(l[high]-l[low]>15&&Math.hypot(v[low*2]-v[high*2],v[low*2+1]-v[high*2+1])>2){fill=lc.createLinearGradient(v[low*2],v[low*2+1],v[high*2],v[high*2+1]);fill.addColorStop(0,shade(l[low],f.mat));fill.addColorStop(1,shade(l[high],f.mat));}
        else fill=shade((l[0]+l[1]+l[2])/3,f.mat);
      }
      lc.fillStyle=fill;lc.fill();if(f.alpha>.8){lc.strokeStyle=fill;lc.lineWidth=.42;lc.stroke();}
    }
    const ordered=[...batches.values()].sort((a,b)=>(a.piece.group?.matrixWorld.elements[14]||0)-(b.piece.group?.matrixWorld.elements[14]||0));
    for(const output of ordered){
      if(!output.faces.length&&!output.effects.length)continue;
      lc.clearRect(0,0,width,height);output.faces.sort((a,b)=>a.z-b.z);output.faces.forEach(draw);lc.globalAlpha=1;
      const u=output.u;
      const cutPath=new Path2D();let hasCut=false;
      if(u?.scanPower.value>.001){
        const endpoints=[-1,1].map(side=>{point.set(u.scanPosition.value+side*u.scanWidth.value*u.scanPower.value,0,0).applyMatrix4(output.piece.group.matrixWorld).project(camera);return {x:(point.x*.5+.5)*width,y:(-point.y*.5+.5)*height};});
        const a=endpoints[0],b=endpoints[1],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,extent=Math.hypot(width,height)*2,nx=-dy/length*extent,ny=dx/length*extent;
        cutPath.moveTo(a.x+nx,a.y+ny);cutPath.lineTo(a.x-nx,a.y-ny);cutPath.lineTo(b.x-nx,b.y-ny);cutPath.lineTo(b.x+nx,b.y+ny);cutPath.closePath();hasCut=true;
      }
      if(u?.hoverPower.value>.001){
        const x=u.lensCenter.value.x,y=height-u.lensCenter.value.y,r=u.lensRadius.value*u.hoverPower.value;
        cutPath.moveTo(x+r,y);cutPath.arc(x,y,r,0,Math.PI*2);cutPath.closePath();hasCut=true;
      }
      if(hasCut){
        lc.save();lc.globalCompositeOperation='destination-out';lc.fillStyle='#000';lc.fill(cutPath);lc.restore();
        lc.save();lc.clip(cutPath);
        // Real internal components remain visible through the shell's cut.
        output.faces.filter(face=>face.core).concat(output.interiors).sort((a,b)=>a.z-b.z).forEach(draw);
        for(const object of output.lines){
          const pos=object.geometry.attributes.position,uniforms=object.material.userData.inspectUniforms;if(!uniforms)continue;
          const color=uniforms.gridColor.value;lc.strokeStyle=`rgb(${color.x*255},${color.y*255},${color.z*255})`;lc.lineWidth=.8;lc.globalAlpha=object.material.userData.lineOpacity??.6;lc.beginPath();
          for(let i=0;i<pos.count;i+=2){
            for(let j=0;j<2;j++){point.fromBufferAttribute(pos,i+j).applyMatrix4(object.matrixWorld).project(camera);const x=(point.x*.5+.5)*width,y=(-point.y*.5+.5)*height;if(j===0)lc.moveTo(x,y);else lc.lineTo(x,y);}
          }
          lc.stroke();
        }
        lc.restore();
      }
      output.effects.sort((a,b)=>a.z-b.z);
      const interior=[];
      for(const face of output.effects){const mat=face.mat;if(mat.userData.inspectionInterior&&!(mat.userData.inspectionSurface&&u.surfacePower.value>.001))interior.push(face);else draw(face);}
      if(hasCut&&interior.length){lc.save();lc.clip(cutPath);interior.forEach(draw);lc.restore();}
      lc.globalAlpha=1;ctx.drawImage(layer,0,0,width,height);
    }
  }
  return {domElement:canvas,isSoftware:true,setPixelRatio(r){dpr=Math.min(r,1.25);},getPixelRatio(){return dpr;},setClearColor(){},setSize(w,h){width=w;height=h;canvas.width=layer.width=Math.round(w*dpr);canvas.height=layer.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);lc.setTransform(dpr,0,0,dpr,0,0);},render,dispose(){}};
}
