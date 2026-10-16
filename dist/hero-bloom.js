import * as THREE from './vendor/three.module.js';
import {UnrealBloomPass} from './vendor/postprocessing/UnrealBloomPass.js';
import {FullScreenQuad} from './vendor/postprocessing/Pass.js';

// Official r170 UnrealBloomPass, at reduced resolution and only when light is
// visible. Layer 1 selects emitters; black depth masks preserve real occlusion.
export function createHeroBloom(renderer,scene,camera,effects,config,shared){
  let viewWidth=1;
  const target=new THREE.WebGLRenderTarget(256,256,{type:THREE.HalfFloatType});
  const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),config.glow.strength,config.glow.radius,config.glow.threshold);
  const layer=new THREE.Layers();layer.set(effects.bloomLayer);
  const excluded=effects.nonBloom.map(object=>({object,visible:false}));
  const black=new THREE.Color(0,0,0),maskCache=new Map();
  const masks=effects.meshes.map(object=>{
    const original=object.material;
    let mask=maskCache.get(original);
    if(!mask){
      // Occlusion needs only black + the existing geometric cut, not a second
      // round of PBR lighting, environment sampling or bump-map evaluation.
      mask=new THREE.MeshBasicMaterial({color:black,side:original.side,toneMapped:false});
      mask.userData={...original.userData};mask.onBeforeCompile=original.onBeforeCompile;
      mask.customProgramCacheKey=()=>original.customProgramCacheKey()+'-bloom-mask';maskCache.set(original,mask);
    }
    return {object,original,mask};
  });
  const overlay=new THREE.ShaderMaterial({
    uniforms:{glowMap:{value:target.texture}},transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:'uniform sampler2D glowMap;varying vec2 vUv;void main(){vec3 light=texture2D(glowMap,vUv).rgb;gl_FragColor=vec4(light,clamp(max(light.r,max(light.g,light.b)),0.,.65));}'
  });
  const quad=new FullScreenQuad(overlay);
  return {
    setSize(width,height,mobile,quality=1){
      viewWidth=width;
      const ratio=Math.min((mobile?config.glow.mobileResolution:config.glow.desktopResolution)*quality,Math.sqrt(config.performance.bloomMaxPixels/(width*height)));
      const w=Math.max(64,Math.round(width*ratio)),h=Math.max(64,Math.round(height*ratio));
      target.setSize(w,h);bloom.setSize(w,h);
    },
    render(dt,active){
      renderer.setRenderTarget(null);renderer.render(scene,camera);
      if(!active)return;
      const clear=renderer.autoClear,ratio=shared.pixelRatio.value,specular=effects.sweepPower.value;
      try{
        // The geometric lens uses CSS pixels. Its shader must use this target's
        // ratio, not the full-resolution canvas ratio, during the glow pass.
        shared.pixelRatio.value=target.width/viewWidth;
        effects.sweepPower.value=0;
        for(const entry of excluded){entry.visible=entry.object.visible;if(!entry.object.layers.test(layer))entry.object.visible=false;}
        for(const entry of masks)if(!entry.object.layers.test(layer))entry.object.material=entry.mask;
        renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);
        bloom.render(renderer,null,target,dt,false);
      }finally{
        shared.pixelRatio.value=ratio;
        effects.sweepPower.value=specular;
        for(const entry of excluded)entry.object.visible=entry.visible;
        for(const entry of masks)entry.object.material=entry.original;
        renderer.setRenderTarget(null);renderer.autoClear=false;
      }
      quad.render(renderer);renderer.autoClear=clear;
    },
    dispose(){target.dispose();bloom.materialHighPassFilter.dispose();bloom.dispose();overlay.dispose();quad.dispose();for(const material of maskCache.values())material.dispose();}
  };
}
