const header=document.querySelector('.header');
const menu=header.querySelector('.menu-button');
const nav=header.querySelector('nav');
function closeMenu(){nav.classList.remove('nav-open');menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',event=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('nav-open',open);if(open&&event.detail===0)requestAnimationFrame(()=>nav.querySelector('a')?.focus());});
header.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();menu.focus();}});
document.addEventListener('click',event=>{if(!header.contains(event.target))closeMenu();});
nav.addEventListener('click',event=>{const link=event.target.closest('a');if(!link)return;nav.querySelectorAll('a').forEach(a=>a.removeAttribute('aria-current'));link.setAttribute('aria-current','location');closeMenu();});
// Keep the floating contact action above the 3D progress controls.
new IntersectionObserver(([entry])=>document.body.classList.toggle('story-controls-visible',entry.isIntersecting&&entry.intersectionRatio>0)).observe(document.querySelector('.stage'));
window.addEventListener('load',()=>{
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  preference.addEventListener('change',event=>{
    const control=document.querySelector('.motion-toggle');
    if(control&&!control.hidden&&document.body.classList.contains('reduced')!==event.matches)control.click();
  });
});
