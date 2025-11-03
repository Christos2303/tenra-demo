(async () => {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) window.location.href = '/login.html';

  document.getElementById('userEmail').textContent = user.email;

  const { data: links } = await sb
    .from('firmen_user')
    .select('firma_id, role, firmen(name, status)')
    .eq('user_id', user.id);

  if (links?.length) {
    const f = links[0];
    document.getElementById('firmInfo').innerHTML =
      `Firma: <strong>${f.firmen.name}</strong> — Status: <strong>${f.firmen.status}</strong>`;
  }

  document.getElementById('logoutBtn')?.addEventListener('click', async ()=>{
    await sb.auth.signOut();
    window.location.href = '/index.html';
  });
})();
