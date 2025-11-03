import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// ===========================================
// 🧩 Supabase Setup – ENV Variablen verwenden
// ===========================================

// 🚫 Kein Key mehr direkt im Code! Nur aus Environment:
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Falls eine Variable fehlt, brich mit Log ab:
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Fehlende ENV Variablen: SUPABASE_URL oder SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log("🚀 toggle-module Function gestartet");

// ===========================================
// 🌍 Main Handler
// ===========================================
serve(async (req) => {
  try {
    // ✅ 1. CORS Preflight korrekt behandeln
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": req.headers.get("origin") || "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // ✅ 2. Body lesen
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response("❌ Kein gültiges JSON empfangen", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const { firma_id, modul_key, aktiviert } = body;
    if (!firma_id || !modul_key) {
      return new Response("❌ Missing firma_id oder modul_key", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    console.log("🔧 Toggle Request:", { firma_id, modul_key, aktiviert });

    // ===========================================
    // 🧠 Modul updaten oder anlegen (Upsert)
    // ===========================================
    const { error } = await supabase
      .from("firmen_module")
      .upsert(
        {
          firma_id,
          modul_key,
          aktiviert: !!aktiviert,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "firma_id, modul_key" }
      );

    if (error) {
      console.error("❌ DB Fehler:", error.message);
      return new Response(`DB Error: ${error.message}`, {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // ✅ Erfolg
    console.log("✅ Modul erfolgreich gespeichert:", modul_key);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("🔥 Interner Fehler:", err);
    return new Response(err.message || "Unbekannter Fehler", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});
