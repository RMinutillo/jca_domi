import {startHero} from './hero-controller.js';

startHero().catch(error=>{
  console.error('JCA hero:',error);
  document.body.classList.add('scene-failed');
  document.querySelector('.scene-loading').textContent='La vista 3D no está disponible. Podés continuar explorando nuestros servicios.';
});
