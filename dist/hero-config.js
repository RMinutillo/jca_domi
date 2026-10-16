// All positions below use the existing assembled tube's local coordinates.
export const CONFIG={
  colors:{laser:'#ef4444',heat:'#ff6028',fissure:'#ff3b15',wire:'#82909b'},
  load:{duration:2.4,scanStart:.22,scanEnd:2.15,axis:[-2.9,2.9],cooling:.8},
  idle:{period:6,floatAmplitude:.022,yawDegrees:2.2,parallaxDegrees:5,damping:5},
  wave:{period:7.4,duration:2.35,opacity:.58},
  specular:{period:10,duration:2.2,strength:.13},
  lens:{desktopRadius:72,mobileRadius:52,dragGrace:4},
  fissure:{position:[-1.45,.37,-.499],width:.024,threshold:31,emissive:1.3,detectedEmissive:4.2},
  glow:{strength:.65,radius:.35,threshold:.12,desktopResolution:.5,mobileResolution:.28},
  mobile:{demoPeriod:8,demoDuration:5.8},
  performance:{maxDpr:1.5,maxPixels:2200000,bloomMaxPixels:500000},
  label:{title:'DISCONTINUIDAD DETECTADA',detail:'Fisura · 2,4 mm',zone:'Zona afectada por calor',note:'Demostración 3D · medida ilustrativa'}
};
