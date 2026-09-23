(() => {
  const nav = document.querySelector('.nav');
  const paint = () => {
    if (!nav) return;
    nav.style.borderBottomColor = window.scrollY > 6 ? 'rgba(30,30,30,.12)' : '';
  };
  window.addEventListener('scroll', paint, { passive: true });
  paint();
})();
