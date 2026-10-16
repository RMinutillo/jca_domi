import * as THREE from './vendor/three.module.js';

// Section 2 -> 3 only. All three follow one visible rail until the whole
// train reaches the destination; only then does the final layout open.
export const SERVICE_ARRIVAL=.62;
export const serviceFlights={
  radiography:{trail:0,depth:3.8,phase:4.2},
  ultrasound:{trail:4.25,depth:1.6,phase:0},
  surface:{trail:8.25,depth:-2,phase:2.1}
};

export const constellation={
  desktop:{
    ultrasound:[.755,.59,.043,.15,-.38,-.23],
    surface:[.87,.30,.042,-.16,.26,.12],
    radiography:[.66,.83,.035,.12,-.24,-.16]
  },
  phone:{
    ultrasound:[.40,.73,.073,.12,-.38,-.20],
    surface:[.76,.65,.055,-.16,.26,.12],
    radiography:[.23,.88,.050,.12,-.24,-.16]
  },
  landscape:{
    ultrasound:[.76,.55,.038,.15,-.38,-.23],
    surface:[.92,.30,.027,-.16,.26,.12],
    radiography:[.64,.84,.023,.12,-.24,-.16]
  }
};

const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const u=clamp(x);return u*u*u*(u*(u*6-15)+10);};
// A long constant-speed cruise, with short C2-continuous starts/stops, keeps
// the train readable instead of concentrating its motion in the middle.
const journey=x=>{
  const t=clamp(x),ramp=.14;
  if(t<ramp)return (t/2-ramp*Math.sin(Math.PI*t/ramp)/(2*Math.PI))/(1-ramp);
  if(t>1-ramp)return 1-journey(1-t);
  return (t-ramp/2)/(1-ramp);
};

export function createServiceTrain(){
  const points=Array.from({length:7},()=>new THREE.Vector3());
  const lengths=new Float64Array(129),axis=new THREE.Vector3(),tangent=new THREE.Vector3();
  const previous=new THREE.Vector3(),sample=new THREE.Vector3(),lead=new THREE.Vector3();
  const gateScreen=new THREE.Vector3(),endScreen=new THREE.Vector3();
  const sourceAxis=new THREE.Vector3(),sourcePoint=new THREE.Vector3(),offsets={};
  const savedOrigin=new THREE.Vector3(Infinity,0,0),savedRotation=new THREE.Quaternion();
  const zAxis=new THREE.Vector3(0,0,1),identity=new THREE.Quaternion();
  let savedWidth=0,savedHeight=0,savedScale=0,savedSide=false,total=0,head=0,gap=0,clock=0,sourceAngle=0;

  function pointAt(u,out,derivative=false){
    const offset=u<.5?0:3,t=u<.5?u*2:(u-.5)*2,s=1-t;
    const a=points[offset],b=points[offset+1],c=points[offset+2],d=points[offset+3];
    if(derivative)return out.set(
      3*s*s*(b.x-a.x)+6*s*t*(c.x-b.x)+3*t*t*(d.x-c.x),
      3*s*s*(b.y-a.y)+6*s*t*(c.y-b.y)+3*t*t*(d.y-c.y),
      3*s*s*(b.z-a.z)+6*s*t*(c.z-b.z)+3*t*t*(d.z-c.z)
    ).normalize();
    return out.set(s*s*s*a.x+3*s*s*t*b.x+3*s*t*t*c.x+t*t*t*d.x,s*s*s*a.y+3*s*s*t*b.y+3*s*t*t*c.y+t*t*t*d.y,s*s*s*a.z+3*s*s*t*b.z+3*s*t*t*c.z+t*t*t*d.z);
  }

  function railAt(distance,out){
    if(distance<=0){out.copy(points[0]).addScaledVector(axis,distance);tangent.copy(axis);return;}
    const target=Math.min(total,distance);
    let low=0,high=128;
    while(high-low>1){const mid=(low+high)>>1;if(lengths[mid]<target)low=mid;else high=mid;}
    const u=(low+(target-lengths[low])/Math.max(1e-9,lengths[high]-lengths[low]))/128;
    pointAt(u,out);pointAt(u,tangent,true);
  }

  return {
    createState(){return {progress:0,dock:0,distance:0,rotation:new THREE.Quaternion()};},
    update(time,origin,rotation,commonScale,width,height,rightSide){
      clock=clamp(time);
      if(width!==savedWidth||height!==savedHeight||commonScale!==savedScale||rightSide!==savedSide||savedOrigin.distanceToSquared(origin)>1e-10||Math.abs(savedRotation.dot(rotation))<1-1e-10){
        savedWidth=width;savedHeight=height;savedScale=commonScale;savedSide=rightSide;savedOrigin.copy(origin);savedRotation.copy(rotation);
        sourceAxis.set(1,0,0).applyQuaternion(rotation);
        lead.copy(origin).addScaledVector(sourceAxis,4.25*commonScale);
        // Work on one camera-facing plane. Initial depth is flattened along
        // each camera ray, so the original entry has no screen-space jump.
        lead.multiplyScalar(9/(9-lead.z));lead.z=0;
        for(const [key,profile] of Object.entries(serviceFlights)){
          sourcePoint.copy(origin).addScaledVector(sourceAxis,(4.25-profile.trail)*commonScale);
          sourcePoint.multiplyScalar(9/(9-sourcePoint.z));sourcePoint.z=0;
          offsets[key]=lead.distanceTo(sourcePoint);
          if(key==='ultrasound')axis.copy(lead).sub(sourcePoint).normalize();
        }
        sourceAngle=Math.atan2(axis.y,axis.x);
        points[0].copy(lead);points[1].copy(lead).addScaledVector(axis,width*(rightSide?.04:.06));
        const set=(i,x,y,z)=>points[i].set((x-.5)*width,(.5-y)*height,z);
        if(rightSide){
          // Never lift the leading plate above the entry line. Keep the first
          // curve's Y controls descending, including on wide/short viewports.
          const entryY=.5-points[1].y/height;
          set(3,.64,Math.max(.73,(3*entryY+.89)/4+.005),0);set(6,.93,.89,0);
        }
        else{
          const entryY=.5-points[1].y/height;
          set(3,1.02,Math.max(.81,(3*entryY+1.03)/4+.005),0);set(6,1.30,1.03,0);
        }
        // The last portion is a straight arrival row, close to the final slots.
        points[2].copy(points[3]).addScaledVector(sample.copy(points[6]).sub(points[3]),-1/3);
        points[4].copy(points[3]).lerp(points[6],1/3);points[5].copy(points[3]).lerp(points[6],2/3);
        gap=points[3].distanceTo(points[6])*.49;
        lengths[0]=0;previous.copy(points[0]);
        for(let i=1;i<=128;i++){pointAt(i/128,sample);lengths[i]=lengths[i-1]+sample.distanceTo(previous);previous.copy(sample);}
        total=lengths[128];
      }
      head=journey(clock/SERVICE_ARRIVAL)*total;
    },
    sample(key,reveal,start,end,out,state,camera=null){
      const rank=key==='radiography'?0:key==='ultrasound'?1:2;
      const gather=ease((clock-.18)/.34),offset=offsets[key]+(gap*rank-offsets[key])*gather;
      const distance=head-offset;
      state.distance=distance;
      railAt(distance,out);
      const travelDepth=start.z*(1-ease(clock/.12));
      out.multiplyScalar((9-travelDepth)/9);out.z=travelDepth;
      // One late distribution gate for the entire train, never per-car arrivals.
      const dock=ease((clock-SERVICE_ARRIVAL)/(1-SERVICE_ARRIVAL));
      if(camera&&dock>0){
        // Establish clearance in depth before the silhouettes turn and open.
        // Projection compensation keeps this separation visually unobtrusive.
        const depthDock=ease((clock-SERVICE_ARRIVAL)/((1-SERVICE_ARRIVAL)*.60));
        const z=out.z+(end.z-out.z)*depthDock;
        gateScreen.copy(out).project(camera);endScreen.copy(end).project(camera);
        sample.copy(gateScreen).lerp(endScreen,dock);sample.z=0;sample.unproject(camera);
        const factor=(z-camera.position.z)/(sample.z-camera.position.z);
        out.copy(sample).sub(camera.position).multiplyScalar(factor).add(camera.position);
      }else out.lerp(end,dock);
      out.lerp(end,reveal);
      state.progress=ease(clock/.65);
      state.progress+= (1-state.progress)*reveal;
      state.dock=dock+(1-dock)*reveal;
      // Ease into steering while the initially adjacent components gain room.
      const steering=ease(clock/.20);
      state.rotation.setFromAxisAngle(zAxis,(Math.atan2(tangent.y,tangent.x)-sourceAngle)*steering).slerp(identity,reveal);
      // The exact original poses are retained before this transition starts.
      if(head===0&&reveal===0){out.copy(start);state.progress=state.dock=0;state.rotation.identity();}
      if(clock===1){out.copy(end);state.progress=state.dock=1;}
      return state.progress;
    }
  };
}

export function positionServiceCamera(camera,time,compact,rightSide=false){
  // Keep the rail visually fixed while the cars follow each other.
  const t=ease((time-SERVICE_ARRIVAL)/(1-SERVICE_ARRIVAL));
  const direction=rightSide?-1:1;
  camera.position.set(.28*t*direction,.04*t,9+.40*t);
  camera.lookAt(0,0,0);
}

