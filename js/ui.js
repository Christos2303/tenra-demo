// Year
document.getElementById('y').textContent = new Date().getFullYear();

// Mobile menu
const burger = document.getElementById('burger');
const mobile = document.getElementById('mobileMenu');
burger?.addEventListener('click', () => {
  const hidden = mobile.hasAttribute('hidden');
  mobile.toggleAttribute('hidden', !hidden);
  burger.classList.toggle('open');
});

// Pricing reveal
const reveal = document.getElementById('revealPricing');
const pricing = document.getElementById('pricing');
reveal?.addEventListener('click', () => {
  const hidden = pricing.hasAttribute('hidden');
  pricing.toggleAttribute('hidden', !hidden);
  reveal.textContent = hidden ? 'Preise ausblenden' : 'Preise ansehen';
});

// Dark mode
const root = document.documentElement;
const dmBtn = document.getElementById('dm-toggle');
const saved = localStorage.getItem('nova_dm');
if (saved === 'dark') root.classList.add('dark');
dmBtn?.addEventListener('click', () => {
  root.classList.toggle('dark');
  localStorage.setItem('nova_dm', root.classList.contains('dark') ? 'dark' : 'light');
  dmBtn.textContent = root.classList.contains('dark') ? 'Light' : 'Dark';
});
dmBtn && (dmBtn.textContent = root.classList.contains('dark') ? 'Light' : 'Dark');

// Smooth anchors (native in most browsers; fallback)
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    if (id.length > 1) {
      e.preventDefault();
      document.querySelector(id)?.scrollIntoView({behavior:'smooth', block:'start'});
      mobile?.setAttribute('hidden',''); // close mobile menu
    }
  });
});
