// Reloads start at the hero; ordinary navigation keeps section links and history.
if(performance.getEntriesByType('navigation')[0]?.type==='reload'){
  history.scrollRestoration='manual';
  if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
  const reset=()=>window.scrollTo({top:0,left:0,behavior:'instant'});
  reset();
  document.addEventListener('DOMContentLoaded',reset,{once:true});
  window.addEventListener('pageshow',event=>{
    if(!event.persisted)reset();
  },{once:true});
  window.addEventListener('pagehide',()=>{history.scrollRestoration='auto';},{once:true});
}else{
  history.scrollRestoration='auto';
}
