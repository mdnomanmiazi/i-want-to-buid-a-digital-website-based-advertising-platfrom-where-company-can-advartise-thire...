import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function fireN8nWebhook(event: string, payload: Record<string, unknown>) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    console.warn("[n8n] N8N_WEBHOOK_URL not set, skipping webhook for", event);
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    console.error("[n8n] webhook failed", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Confirm a payment after gateway redirect.
 * - Marks ad_payments.payment_status = 'paid'
 * - Sets ad.status = 'waiting_for_admin_approval' (fallback if n8n is down)
 * - Triggers n8n webhook (payment.paid)
 */
export const confirmPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tran_id: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: pay, error: payErr } = await supabase
      .from("ad_payments")
      .select("id, ad_id, amount, plan, payment_status, user_id")
      .eq("tran_id", data.tran_id)
      .maybeSingle();
    if (payErr || !pay) throw new Error("Payment not found");
    if (pay.user_id !== userId) throw new Error("Forbidden");

    // Already processed
    if (pay.payment_status === "paid") {
      return { ok: true, alreadyPaid: true };
    }

    const now = new Date();
    await supabase
      .from("ad_payments")
      .update({
        payment_status: "paid",
        status: "paid",
        paid_at: now.toISOString(),
        payment_method: "gateway",
      })
      .eq("id", pay.id);

    if (pay.ad_id) {
      const { data: ad } = await supabase
        .from("ads")
        .select("plan")
        .eq("id", pay.ad_id)
        .maybeSingle();
      const days = ad?.plan === "yearly" ? 365 : ad?.plan === "monthly" ? 30 : 30;
      const expires = new Date(now.getTime() + days * 86400 * 1000).toISOString();
      await supabase
        .from("ads")
        .update({
          status: "waiting_for_admin_approval",
          starts_at: now.toISOString(),
          expires_at: expires,
        })
        .eq("id", pay.ad_id);
    }

    const webhook = await fireN8nWebhook("payment.paid", {
      payment_id: pay.id,
      ad_id: pay.ad_id,
      user_id: pay.user_id,
      tran_id: data.tran_id,
      amount: pay.amount,
      plan: pay.plan,
    });

    return { ok: true, webhook };
  });
