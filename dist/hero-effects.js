import * as THREE from './vendor/three.module.js';

// Extend, do not replace, the existing geometric lens shader.
export function createHeroEffects(model,config){
  const heroMatrix={value:new THREE.Matrix4()},scan={value:config.load.axis[0]},reveal={value:0};
  const sweep={value:100},sweepPower={value:0},laserColor={value:new THREE.Color(config.colors.laser)};
  const uniforms={heroMatrix,heroScan:scan,heroReveal:reveal,heroSweep:sweep,heroSweepPower:sweepPower,heroLaser:laserColor};
  const meshes=[],wireframes=[],nonMetal=[],fractureMaterials=new Set(),materials=new Set();
  model.root.traverse(object=>{
    if(object.isLineSegments||(object.isMesh&&!object.material.isMeshStandardMaterial)){nonMetal.push(object);return;}
    if(!object.isMesh)return;
    meshes.push(object);
    const material=object.material;
    if(material.userData.fractureDetail)fractureMaterials.add(material);
    if(!materials.has(material)){
      materials.add(material);
      const compile=material.onBeforeCompile,key=material.customProgramCacheKey();
      material.onBeforeCompile=shader=>{
        compile.call(material,shader);Object.assign(shader.uniforms,uniforms);
        shader.vertexShader='varying vec3 vHeroLocal;uniform mat4 heroMatrix;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHeroLocal=(heroMatrix*modelMatrix*vec4(transformed,1.)).xyz;');
        shader.fragmentShader='varying vec3 vHeroLocal;uniform float heroScan,heroReveal,heroSweep,heroSweepPower;uniform vec3 heroLaser;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(heroReveal<.999&&vHeroLocal.x>heroScan)discard;');
        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
          float scanEdge=exp(-pow((vHeroLocal.x-heroScan)/.045,2.))*(1.-step(.999,heroReveal));
          float highlight=exp(-pow((vHeroLocal.x-heroSweep)/.26,2.))*heroSweepPower;
          totalEmissiveRadiance+=heroLaser*scanEdge*.8+vec3(.78,.86,1.)*highlight;`);
      };
      material.customProgramCacheKey=()=>key+'-hero-inspection-v1';
    }
    if(!material.userData.inspect||material.userData.inspectionInterior||object.userData.inspectionCore)return;
    const lines=new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry,12),new THREE.ShaderMaterial({
      uniforms:{...uniforms,wireColor:{value:new THREE.Color(config.colors.wire)}},
      transparent:true,depthWrite:false,
      vertexShader:'uniform mat4 heroMatrix;varying vec3 vHeroLocal;void main(){vHeroLocal=(heroMatrix*modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'uniform float heroScan,heroReveal;uniform vec3 wireColor;varying vec3 vHeroLocal;void main(){if(vHeroLocal.x<heroScan||heroReveal>=.999)discard;gl_FragColor=vec4(wireColor,.22);}'
    }));
    lines.userData.heroWire=true;wireframes.push({object,lines});
  });
  for(const {object,lines} of wireframes)object.add(lines);
  for(const material of fractureMaterials){material.emissive.set(config.colors.fissure);material.emissiveIntensity=0;}
  model.weld.material.emissive.set(config.colors.heat);

  // These are the only objects eligible for selective bloom.
  const bloomLayer=1;
  const defectMaterials=new Map();
  for(const defect of model.defects){
    const selected=new Set();
    defect.mesh.traverse(object=>{
      if(object.isMesh&&object.material.userData.fractureDetail){object.layers.enable(bloomLayer);selected.add(object.material);}
    });
    defectMaterials.set(defect.key,selected);
  }
  model.ring.layers.enable(bloomLayer);model.pulses.forEach(r=>r.layers.enable(bloomLayer));
  const laserMaterial=new THREE.MeshBasicMaterial({color:config.colors.laser,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  const laser=new THREE.Mesh(new THREE.TorusGeometry(1.14,.012,6,96),laserMaterial);laser.rotation.y=Math.PI/2;laser.layers.enable(bloomLayer);model.root.add(laser);
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(2.65,2.65),laserMaterial.clone());plane.rotation.y=Math.PI/2;plane.material.side=THREE.DoubleSide;plane.layers.enable(bloomLayer);model.root.add(plane);
  return {meshes,nonBloom:nonMetal.concat(wireframes.map(entry=>entry.lines)),uniforms,scan,reveal,sweep,sweepPower,laser,plane,fractureMaterials,bloomLayer,
    updateMatrix(){heroMatrix.value.copy(model.root.matrixWorld).invert();},
    hideWire(){for(const {lines} of wireframes)lines.visible=false;},
    setFractureGlow(base,key,boost=0){
      const selected=defectMaterials.get(key);
      for(const material of fractureMaterials)material.emissiveIntensity=base+(selected?.has(material)?boost:0);
    }
  };
}
