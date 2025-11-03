console.log("✅ upgrade.js wurde geladen");
console.log("➡️ Script start – prüfe sb:", typeof sb);


(async () => {
  const FN_URL = "https://lajqzmlhcsxhpfbhmlxe.supabase.co/functions/v1/stripe-checkout";

  // Dein anon Key (aus curl - Authorization Bearer ...)
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhanF6bWxoY3N4aHBmYmhtbHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzkzMTksImV4cCI6MjA3NTQxNTMxOX0.3fjdlh2Ozf0Ku7-s2459qYFCzQBBw49tzMFM-vFgmeg";

  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

// 🟢 DOM ist schon bereit, also direkt ausführen
console.log("DOM vollständig geladen ✅");

const buttons = document.querySelectorAll(".btn[data-plan]");
console.log("Gefundene Buttons:", buttons.length);

buttons.forEach(btn => {
  console.log("Button erkannt:", btn.dataset.plan);
  btn.addEventListener("click", async () => {
    console.log("🟢 Button wurde geklickt:", btn.dataset.plan);

    const companyName = document.getElementById("companyName").value.trim();
    if (!companyName) return alert("Bitte gib einen Firmennamen an.");

    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          plan: btn.dataset.plan,
          userId: user.id,
          email: user.email,
          companyName
        })
      });

      const data = await res.json();
      console.log("Antwort von Supabase:", data);

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Fehler: " + (data.error || "Unbekannt"));
      }
    } catch (error) {
      console.error("❌ Fetch-Fehler:", error);
      alert("Ein technischer Fehler ist aufgetreten.");
    }
  });
});

})();
