const figmaHome = document.getElementById('figma-home');
let sectionPositions = {};

function scrollToFigmaSection(id) {
  const offset = sectionPositions[id];
  if (typeof offset !== 'number') return;
  window.scrollTo({ top: figmaHome.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' });
}

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.source !== figmaHome?.contentWindow) return;
  if (event.data?.type === 'jca-figma-scroll') {
    scrollToFigmaSection(event.data.section);
    return;
  }
  if (event.data?.type !== 'jca-figma-height') return;
  const height = Number(event.data.height);
  if (Number.isFinite(height) && height > 0 && height < 100000) {
    figmaHome.style.height = `${height}px`;
  }
  sectionPositions = event.data.sections ?? {};
  const hash = window.location.hash.slice(1);
  if (hash && hash !== 'nuestras-soluciones' && sectionPositions[hash] !== undefined) {
    scrollToFigmaSection(hash);
  }
});

if (window.location.hash === '#nuestras-soluciones') {
  window.addEventListener('load', () => {
    document.getElementById('nuestras-soluciones')?.scrollIntoView();
  });
}
