import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// ⚙️ Zwei Clients:
// 1️⃣ serviceClient = voller Zugriff (für DB-Änderungen)
// 2️⃣ authClient = prüft den JWT vom eingeloggten User (mit Anon-Key)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);
const authClient = createClient(SUPABASE_URL, ANON_KEY);

serve(async (req) => {
    // ✅ CORS freigeben, damit der Authorization Header durchkommt
if (req.method === "OPTIONS") {
  return new Response("ok", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response("Missing invite token", { status: 400 });
    }

    // ✅ Schritt 1: eingeloggten User abrufen
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ Kein Auth-Header gefunden");
      return new Response("Not authenticated", { status: 401 });
    }

    // Nutzer über Supabase-JWT abrufen (mit Anon-Key!)
    const { data: { user }, error: userErr } =
      await authClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userErr || !user) {
      console.error("❌ Auth fehlgeschlagen:", userErr?.message);
      return new Response("Invalid or expired token", { status: 401 });
    }

    const currentUserId = user.id;

    // ✅ Schritt 2: Invite-Eintrag finden
    const { data: invite, error: inviteErr } = await serviceClient
      .from("firmen_user")
      .select("id, firma_id, status")
      .eq("invite_token", token)
      .maybeSingle();

    if (inviteErr || !invite) {
      console.error("❌ Invite nicht gefunden:", inviteErr?.message);
      return new Response("Invite not found", { status: 404 });
    }

    if (invite.status === "accepted") {
      return new Response("Invite already accepted", { status: 409 });
    }

    // ✅ Schritt 3: user_id & Status updaten
    const { error: updateErr } = await serviceClient
      .from("firmen_user")
      .update({
        user_id: currentUserId,
        status: "accepted",
      })
      .eq("invite_token", token);

    if (updateErr) {
      console.error("❌ Fehler beim Update des Invites:", updateErr.message);
      return new Response("Error updating invite", { status: 500 });
    }

    console.log("🎉 Invite akzeptiert für:", currentUserId);
return new Response("Invite accepted", {
  status: 200,
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
});


  } catch (err) {
    console.error("❌ Interner Fehler:", err);
    return new Response("Internal Error", { status: 500 });
  }
});
