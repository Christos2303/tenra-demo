import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// 🌍 Basis-Domain für Einladungslinks
const BASE_URL = "http://127.0.0.1:5500/app/join.html";
// später: "https://deine-domain.de/join"

// 🔧 Supabase Setup
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// 🔢 Limits pro Plan
const PLAN_LIMITS = {
  starter: 10,
  team: 40,
  business: 9999,
};

serve(async (req) => {
  // ✅ CORS / Preflight erlauben
if (req.method === "OPTIONS") {
  return new Response("ok", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
  });
}

  try {
    // --- Body lesen ---
    let body;
    try {
      body = await req.json();
    } catch {
      console.error("❌ Kein gültiger JSON-Body empfangen");
      return new Response("Invalid JSON body", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const firmaId = body.firma_id || body.firmaId;
    const email = body.email?.trim().toLowerCase();
    const role = body.role || "member";

    if (!email || !firmaId) {
      return new Response("Missing data (email/firmaId)", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    console.log("📨 Invite request:", email, "→ Firma:", firmaId);

    // 🔹 1️⃣ Firma + Plan abrufen
    const { data: aboData, error: aboErr } = await supabase
      .from("abos")
      .select("plan")
      .eq("firma_id", firmaId)
      .single();

    if (aboErr || !aboData) {
      console.error("❌ Kein Abo gefunden:", aboErr?.message);
      return new Response("Firma/Plan not found", { status: 404 });
    }

    const plan = aboData.plan || "starter";

    // 🔹 2️⃣ Aktive Mitglieder zählen
    const { count, error: countErr } = await supabase
      .from("firmen_user")
      .select("*", { count: "exact", head: true })
      .eq("firma_id", firmaId)
      .neq("status", "pending");

    if (countErr) {
      console.error("❌ Fehler beim Zählen:", countErr.message);
      return new Response("Error checking members", { status: 500 });
    }

    const memberCount = count ?? 0;
    console.log(`👥 Aktive Mitglieder: ${memberCount}/${PLAN_LIMITS[plan]} (${plan})`);

    if (memberCount >= PLAN_LIMITS[plan]) {
      return new Response("Limit reached for current plan", { status: 403 });
    }

    // 🔹 3️⃣ Prüfen, ob User bereits existiert
    const { data: existingProfile, error: profileErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileErr) {
      console.error("❌ Fehler beim Profile-Check:", profileErr.message);
      return new Response("Profile check failed", { status: 500 });
    }

    // 🔹 4️⃣ Wenn User existiert → direkt hinzufügen
    if (existingProfile) {
      const { error: addErr } = await supabase
        .from("firmen_user")
        .upsert(
          {
            firma_id: firmaId,
            user_id: existingProfile.id,
            role,
            status: "accepted",
            invited_email: email,
            invite_token: null,
          },
          { onConflict: "firma_id,user_id" }
        );

      if (addErr) {
        console.error("❌ Fehler beim Hinzufügen (bestehender User):", addErr.message);
        return new Response(JSON.stringify({ error: addErr.message }), {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      }

      console.log("✅ Bestehender User hinzugefügt:", email);
      return new Response(JSON.stringify({ message: "User added" }), {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // 🔹 5️⃣ Neuer User → Einladung anlegen
    const token = crypto.randomUUID();

    const { error: inviteErr } = await supabase.from("firmen_user").insert({
      firma_id: firmaId,
      invited_email: email,
      role,
      status: "pending",
      invite_token: token,
    });

    if (inviteErr) {
      console.error("❌ Fehler beim Speichern des Invites:", inviteErr.message);
      return new Response("Error saving invite", {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const inviteLink = `${BASE_URL}?token=${token}`;
    console.log("✅ Einladung erstellt:", inviteLink);

    return new Response(
      JSON.stringify({ message: "Invite saved", inviteLink }),
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );

  } catch (err) {
    console.error("❌ Invite error:", err);
    return new Response("Internal Error", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});
