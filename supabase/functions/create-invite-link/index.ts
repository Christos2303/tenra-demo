import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.1";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    const { firma_id, role } = await req.json();

    if (!firma_id)
      return new Response("Missing firma_id", { status: 400 });

    // 🔹 1️⃣ Einmaligen Token generieren
    const token = uuidv4();

    // 🔹 2️⃣ In DB speichern
    const { error } = await supabase.from("invite_links").insert({
      firma_id,
      token,
      role: role || "member",
    });

    if (error) {
      console.error("❌ Fehler beim Erstellen:", error.message);
      return new Response("Error creating link", { status: 500 });
    }

    // 🔹 3️⃣ Den vollständigen Join-Link zurückgeben
    const joinLink = `https://deine-app.de/join?firma_id=${firma_id}&token=${token}`;
    console.log("✅ Invite-Link erstellt:", joinLink);

    return new Response(JSON.stringify({ joinLink }), { status: 200 });
  } catch (err) {
    console.error("❌ Fehler in create-invite-link:", err.message);
    return new Response("Internal Server Error", { status: 500 });
  }
});
