// Registrierung
document.querySelector('#regBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = document.querySelector('#regEmail').value.trim();
  const pass  = document.querySelector('#regPass').value.trim();
  if (!email || !pass) return alert('Bitte E-Mail & Passwort eingeben.');

  const { error } = await sb.auth.signUp({ email, password: pass });
  if (error) return alert('Fehler: ' + error.message);

  alert('✅ Check deine E-Mails und bestätige die Adresse.');
  window.location.href = 'login.html';
});

// Login
document.querySelector('#loginBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = document.querySelector('#loginEmail').value.trim();
  const pass  = document.querySelector('#loginPass').value.trim();
  if (!email || !pass) return alert('Bitte E-Mail & Passwort eingeben.');

  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  if (error) return alert('❌ ' + error.message);

  window.location.href = '/app/dashboard.html';
});
