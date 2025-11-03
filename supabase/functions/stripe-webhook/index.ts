import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.11.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();
  const bodyBuffer = new TextEncoder().encode(rawBody);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      bodyBuffer,
      sig!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("❌ Invalid signature:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const email = session.customer_email;
    const name = session.customer_details?.name || "Unbenannt";
    const priceId = session.metadata?.price_id || "starter";
    const subscriptionId = session.subscription;

    console.log("💳 Checkout abgeschlossen für:", email);

    // 🔹 1️⃣ User anhand der E-Mail finden
    const { data: user } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    const userId = user?.id || null;
    if (!userId) console.log("⚠️ Kein passendes Profil gefunden – nur Stripe-Daten gespeichert");

    // 🔹 2️⃣ Firma suchen oder neu anlegen
    const { data: existingFirm } = await supabase
      .from("firmen")
      .select("*")
      .ilike("name", `%${name.trim()}%`)
      .maybeSingle();

    let firmaId;
    if (existingFirm) {
      firmaId = existingFirm.id;
      console.log("✅ Bestehende Firma gefunden:", existingFirm.name);
    } else {
      const { data: newFirma, error: errFirma } = await supabase
        .from("firmen")
        .insert({ name, status: "active", owner_user: userId || null })
        .select()
        .single();

      if (errFirma) {
        console.error("❌ Fehler beim Anlegen der Firma:", errFirma.message);
        return new Response("Firma creation failed", { status: 500 });
      }

      firmaId = newFirma.id;
      console.log("🆕 Neue Firma erstellt:", name);
    }

    // 🔹 3️⃣ Abo speichern oder updaten
    const plan =
      priceId.includes("team") ? "team" :
      priceId.includes("business") ? "business" :
      "starter";

    const { error: aboErr } = await supabase.from("abos").upsert({
      firma_id: firmaId,
      plan,
      stripe_subscription_id: subscriptionId,
      status: "active",
    });

    if (aboErr) console.error("❌ Fehler beim Speichern des Abos:", aboErr.message);

    // 🔹 4️⃣ User in firmen_user eintragen (Owner)
    if (userId) {
      const { error: relErr } = await supabase.from("firmen_user").upsert({
        firma_id: firmaId,
        user_id: userId,
        role: "owner",
      });
      if (relErr) console.error("❌ Fehler beim Hinzufügen zu firmen_user:", relErr.message);
      else console.log("👑 User wurde als Owner hinzugefügt:", email);
    }

    console.log("✅ Webhook erfolgreich abgeschlossen");
  }

  return new Response("ok", { status: 200 });
});
