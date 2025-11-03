import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const { firma_id } = await req.json();
    if (!firma_id) {
      return new Response("Missing firma_id", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // Firma → Stripe Customer ID holen
    const { data: aboData, error: aboErr } = await supabase
      .from("abos")
      .select("stripe_customer_id")
      .eq("firma_id", firma_id)
      .single();

    if (aboErr || !aboData?.stripe_customer_id) {
      console.error("❌ Kein Stripe-Kunde gefunden:", aboErr?.message);
      return new Response("Stripe customer not found", {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: aboData.stripe_customer_id,
      return_url: "https://deine-domain.de/app/dashboard.html",
    });

    return new Response(
      JSON.stringify({ url: portal.url }),
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err) {
    console.error("❌ Portal-Link Fehler:", err);
    return new Response("Internal Error", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});
