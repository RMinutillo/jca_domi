import * as THREE from './vendor/three.module.js';

// Fit the existing poses to the space below the mobile copy. This changes only
// the overall framing, leaving the scroll timeline and local despiece intact.
export function createMobileFraming(pieces){
  const bounds=pieces.map(piece=>new THREE.Box3().setFromObject(piece.group));
  const point=new THREE.Vector3(),box=new THREE.Box3();
  const viewProjection=new THREE.Matrix4(),projector=new THREE.Matrix4();
  return function fit(camera,width,height,{top,bottom,left=14,right=width-14,softReserve=0},shellOpening){
    // Combine the three projection transforms once, not for every box corner.
    viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    for(let pass=0;pass<2;pass++){
      let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
      pieces.forEach((piece,i)=>{
        piece.group.updateWorldMatrix(true,false);box.copy(bounds[i]);
        projector.multiplyMatrices(viewProjection,piece.group.matrixWorld);
        if(i===0){box.min.x-=.78*shellOpening;box.max.x+=1.05*shellOpening;}
        for(let c=0;c<8;c++){
          point.set(c&1?box.max.x:box.min.x,c&2?box.max.y:box.min.y,c&4?box.max.z:box.min.z).applyMatrix4(projector);
          const x=(point.x*.5+.5)*width,y=(.5-point.y*.5)*height;
          x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
        }
      });
      const spanX=x1-x0,spanY=y1-y0;
      let factor=Math.min(1,(right-left)/spanX,Math.max(1,bottom-top)/spanY);
      // Soften the fit threshold inside 2→3; retain the exact original static framing.
      const edge=Math.min(1,(1-factor)/.08);
      const reserve=(factor<1?1:0)*(1-softReserve)+edge*edge*(3-2*edge)*softReserve;
      factor*=1-.015*reserve;
      const cx=(x0+x1)/2,cy=(y0+y1)/2;
      const nx=Math.max(left+spanX*factor/2,Math.min(right-spanX*factor/2,cx));
      const ny=Math.max(top+spanY*factor/2,Math.min(bottom-spanY*factor/2,cy));
      if(factor===1&&Math.abs(nx-cx)<.01&&Math.abs(ny-cy)<.01)break;
      for(const piece of pieces){
        point.copy(piece.group.position).project(camera);
        point.x=(((point.x*.5+.5)*width-cx)*factor+nx)/width*2-1;
        point.y=1-(((.5-point.y*.5)*height-cy)*factor+ny)/height*2;
        piece.group.position.copy(point.unproject(camera));piece.group.scale.multiplyScalar(factor);
      }
    }
  };
}
