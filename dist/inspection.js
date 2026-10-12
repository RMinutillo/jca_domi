import * as THREE from './vendor/three.module.js';

export function createInspectionUniforms(shared){
  return {...shared,scanPosition:{value:0},scanPower:{value:0},scanWidth:{value:.45},hoverPower:{value:0},surfacePower:{value:0},inspectionMatrix:{value:new THREE.Matrix4()}};
}

// A geometric window, shared by the solid shell and the interior. Its size
// animates, while its boundary stays sharp: no noise, dithering or alpha fade.
const inspectionFragment=`
  varying vec3 vInspectionLocal;
  uniform float scanPosition,scanPower,scanWidth,hoverPower,lensRadius,pixelRatio,surfacePower;
  uniform vec2 lensCenter;
  float inspectionDistance(vec3 point){
    float band=scanPower>.001 ? abs(point.x-scanPosition)-scanWidth*scanPower : 100000.;
    float cursor=hoverPower>.001 ? distance(gl_FragCoord.xy/pixelRatio,lensCenter)-lensRadius*hoverPower : 100000.;
    return min(band,cursor);
  }
`;
const inspectionVertex='varying vec3 vInspectionLocal;\nuniform mat4 inspectionMatrix;\n';
const inspectionPosition='vInspectionLocal=(inspectionMatrix*modelMatrix*vec4(transformed,1.)).xyz;';

export function applyInspectionCut(material,uniforms,{interior=false,surface=false}={}){
  material.userData.inspectUniforms=uniforms;
  material.userData.inspectionInterior=interior;
  material.userData.inspectionSurface=surface;
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=inspectionVertex+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+inspectionPosition);
    shader.fragmentShader=inspectionFragment+shader.fragmentShader;
    const condition=interior?`inspectionDistance(vInspectionLocal)>0.${surface?' && surfacePower<.001':''}`:'inspectionDistance(vInspectionLocal)<0.';
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>\nif(${condition})discard;`);
  };
  material.customProgramCacheKey=()=>`jca-clean-cut-v1-${interior}-${surface}`;
  return material;
}

export function createInspectionLines(geometry,uniforms,opacity=.58){
  const material=new THREE.ShaderMaterial({
    uniforms:{...uniforms,lineOpacity:{value:opacity}},transparent:true,depthWrite:false,depthTest:false,
    vertexShader:inspectionVertex+`void main(){vec3 transformed=position;${inspectionPosition}gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:inspectionFragment+`uniform vec3 gridColor;uniform float lineOpacity;void main(){if(inspectionDistance(vInspectionLocal)>0.)discard;gl_FragColor=vec4(gridColor,lineOpacity);}`
  });
  material.userData.inspectUniforms=uniforms;
  material.userData.lineOpacity=opacity;
  const lines=new THREE.LineSegments(geometry,material);lines.renderOrder=5;return lines;
}
