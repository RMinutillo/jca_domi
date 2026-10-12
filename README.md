# JCA & Asociados — versión 11

## Abrir en tu IDE

1. Descomprimí el ZIP y abrí la carpeta JCA-proyecto-v11.
2. Instalá Node.js si todavía no lo tenés.
3. En la terminal de esa carpeta ejecutá:

```sh
npm run dev
```

4. Abrí http://localhost:4173/ en tu navegador.

No hace falta ejecutar npm install: el servidor usa módulos incluidos en Node.js y las librerías del navegador están en dist/vendor.
El contenido desde «Nuestras soluciones» se monta desde `dist/design/embed.js` dentro del home; no usa un iframe. Para recompilar cambios en `figma-source`, instalá sus dependencias una vez en esa carpeta y ejecutá `npm run build:content` desde la raíz.
Para usar otro puerto: `npm run dev -- --port 5173`.
No abras index.html directamente con file://; usá el servidor local.

## Archivos editables

- dist/index.html: estructura, textos y secciones.
- dist/style.css: estilos, fondos y adaptación responsive.
- dist/app.js: escena Three.js, transiciones con GSAP/ScrollTrigger e interacción de la lupa.
- dist/additional-models.js y dist/mechanical-core.js: geometrías y componentes industriales.
- dist/fracture.js y dist/inspection.js: fisuras e inspección visual.
- dist/mobile-framing.js: encuadre para mobile.
- dist/software-renderer.js: alternativa cuando WebGL no está disponible.
- dist/vendor/: librerías, fuentes y archivos de licencia incluidos en el proyecto.
- dev-server.cjs: servidor local.
- .openai/hosting.json: metadatos del alojamiento original; no son necesarios para ejecutarlo localmente.

Aunque la carpeta se llama dist, contiene los archivos editables de este sitio. No requiere compilación. Guardá los cambios y recargá el navegador para verlos.

## Versión incluida

Copia de la versión 11, commit bad3f114aaa8ff6c783db2f901163e3079608d5a.
Incluye la lupa táctil que permanece visible dos segundos después de soltar y se cierra ante un nuevo toque o al hacer scroll.
Se conserva el diseño, las piezas 3D y las transiciones existentes. Los modelos se generan por código: no hay archivos GLB externos.

Para editar solo contenido, concentrá los cambios en index.html y evitá alterar las transformaciones y timelines de app.js.
Antes de modificar animaciones, conservá este ZIP como respaldo o iniciá un repositorio Git local.

## Publicación externa

Es un sitio estático. Para alojarlo en otro servidor, publicá el contenido de dist conservando sus rutas relativas. No incluye backend ni base de datos. Revisá las licencias aplicables de las librerías antes de redistribuirlas.
