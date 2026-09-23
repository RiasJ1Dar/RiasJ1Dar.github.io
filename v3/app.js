(() => {
  // soft sticky nav shade on scroll
  const nav = document.querySelector('.nav');
  const onScroll = () => {
    if (!nav) return;
    nav.style.boxShadow = window.scrollY > 8 ? '0 1px 0 rgba(0,0,0,.04)' : 'none';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
