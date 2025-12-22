// Lightweight, performance-friendly interactions
// - IntersectionObserver for reveal-on-scroll
// - Minimal demo widget logic

(function() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal-on-scroll
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
  }

  // Overview demo widget
  const range = document.getElementById('savingsRange');
  const savingsValue = document.getElementById('savingsValue');
  const proj5 = document.getElementById('proj5');
  const proj10 = document.getElementById('proj10');

  function format(n) { return `$${n.toLocaleString()}`; }

  function updateProjections(val) {
    const monthly = Number(val);
    // Simple projections without compounding for speed and clarity
    proj5.textContent = format(monthly * 12 * 5);
    proj10.textContent = format(monthly * 12 * 10);
  }

  if (range && savingsValue && proj5 && proj10) {
    updateProjections(range.value);
    range.addEventListener('input', () => {
      savingsValue.textContent = format(Number(range.value));
      updateProjections(range.value);
    });
  }
})();
