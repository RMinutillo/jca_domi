# Hero de inspección de JCA

La Home tiene un único hero. Se eliminaron del documento las secciones 2 y 3,
las capas blanca/roja y los controles 01–02–03. No hay pin ni progreso de scroll:
al bajar se entra directamente en Nuestras soluciones. Sus contenidos, las
internas, el footer y los logos no se modificaron.

## Archivos

- `dist/app.js`: entrada del hero, con salida legible si la vista 3D falla.
- `dist/hero-controller.js`: carga GSAP de 2,4 s, idle, cámara, lente, HUD,
  arrastre, demostración móvil, reduced-motion y ciclo de vida del render.
- `dist/hero-model.js`: geometría procedural y materiales existentes extraídos
  del controlador anterior, sin cambiar la forma exterior ni los componentes.
  Las piezas se conservan ensambladas en un único padre. Reutiliza
  `inspection.js`, `fracture.js`, `mechanical-core.js` y `additional-models.js`.
- `dist/hero-effects.js`: extiende `onBeforeCompile` después del recorte original
  de la lente; wireframe, revelado de metal, franja especular y emisivos.
- `dist/hero-bloom.js`: selección por layer 1, máscaras de profundidad y
  UnrealBloomPass r170 a resolución reducida. El pixelRatio del recorte se
  adapta al render target para que el halo coincida con la lente.
- `dist/hero-config.js`: parámetros de diseño, tiempos, luces y defecto.
- `dist/hero.css` / `dist/index.html`: composición de un único hero y HUD.
- `dist/software-renderer.js`: alternativa Canvas estática si WebGL no existe,
  conservando el recorte y el color de la fisura sin postprocesado.

`dist/app.js` y estos módulos son fuentes mantenidas directamente, no bundles
generados por Vite. No requieren recompilar las internas para previsualizarlos.
Los antiguos módulos de transición no se importan ni ejecutan en el hero.

## Ajustar la fisura

Editar `CONFIG.fissure` en `dist/hero-config.js`:

```js
fissure: {
  position: [-1.45, .37, -.499],
  width: .024,
  threshold: 31,
  emissive: 1.3,
  detectedEmissive: 4.2
}
```

La posición es local al tubo ensamblado, antes de su escala/rotación responsive.
X sigue el eje longitudinal. X/Y desplazan el trazado hundido existente dentro
de la pared; Z posiciona el marcador y debe coincidir con esa pared interior:
`z = -sqrt(.621 ** 2 - y ** 2)` en la geometría actual. No usar coordenadas de
pantalla. El HUD, la dirección de búsqueda y la demostración táctil se proyectan
desde ese mismo punto. Mantener el trazado dentro del contorno de `buildCrack`.

El defecto se desplazó hacia el extremo izquierdo para que no quede oculto por
el rodamiento y se ensanchó ligeramente para que siga siendo legible en mobile.
Si cambia el radio o la geometría, ajustar también `buildCrack` en
`hero-model.js`. No usar `renderOrder` ni desactivar el depth test para fingir
su visibilidad.

La medida de 2,4 mm es ilustrativa, no un resultado real de inspección. El HUD
incluye esa aclaración. Sus textos se editan en `CONFIG.label`.

Las fisuras preexistentes de la placa soldada y de la carcasa también son
detectables con mouse o arrastre. `hero-model.js` registra las tres en `defects`,
con su mesh, grupo de referencia, posición local y etiqueta. Cada marcador se
proyecta desde su propio grupo, no desde las coordenadas del tubo. La retícula,
la flecha de búsqueda, el emisivo intensificado y el bloom siguen el defecto
más cercano; sólo hay un HUD/controlador. Las placas no heredan la medida ni
la descripción específica del tubo. El botón de teclado, la vista estática y
el recorrido automático siguen mostrando la fisura original del tubo.

## Accesibilidad y rendimiento

- Mouse: lente sobre la pieza, flecha hacia la falla, activación por proximidad.
- Teclado: Encontrar la falla activa la inspección; Escape la desactiva.
- Touch: recorrido automático cada 8 s; arrastre libre únicamente sobre el área
  de la pieza. Fuera de ella, el scroll sigue siendo normal.
- `prefers-reduced-motion`: sin carga, pulso, parallax ni loops. Pieza estática
  con la falla marcada y el texto visible. Se atienden cambios en tiempo real.
- rAF y timeline se pausan fuera de viewport / con la pestaña oculta.
- DPR máximo 1,5 y presupuesto de 2,2 M píxeles, con calidad adaptativa.
- Bloom en media resolución (desktop) o 0,28 (touch), con presupuesto de 0,5 M
  píxeles y ajuste adicional según rendimiento. Se omite cuando no hay luz o
  defecto visible. El metal general no pertenece a la selección de bloom.
- Sin partículas adicionales: son opcionales y no aportan a la inspección.

## Dependencias locales

Se usa GSAP ya incluido en el repositorio; no se agregó ScrollTrigger.
Los cuatro módulos de postprocesado son de Three.js r170, la misma versión que
`vendor/three.module.js`, con imports adaptados a rutas locales. Licencia MIT
en `dist/vendor/THREE-LICENSE.txt`.

Fuentes oficiales:

- https://github.com/mrdoob/three.js/blob/r170/examples/jsm/postprocessing/UnrealBloomPass.js
- https://github.com/mrdoob/three.js/blob/r170/examples/jsm/postprocessing/Pass.js
- https://github.com/mrdoob/three.js/blob/r170/examples/jsm/shaders/CopyShader.js
- https://github.com/mrdoob/three.js/blob/r170/examples/jsm/shaders/LuminosityHighPassShader.js

La fluidez se debe perfilar en el equipo objetivo: una prueba headless no
garantiza 60 FPS en cualquier GPU. La pieza ensamblada se muestra estática
si no hay WebGL, en lugar de ejecutar animaciones pesadas en CPU.
