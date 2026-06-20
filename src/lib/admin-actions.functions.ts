import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function fireN8nWebhook(event: string, payload: Record<string, unknown>) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return { ok: false, skipped: true };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin role required");
}

async function logAdminAction(
  ctx: { supabase: any; userId: string },
  row: {
    action_type: string;
    ad_id?: string | null;
    payment_id?: string | null;
    refund_id?: string | null;
    target_user_id?: string | null;
    notes?: string | null;
    metadata?: Record<string, unknown> | null;
  },
) {
  await ctx.supabase.from("admin_actions").insert({
    admin_id: ctx.userId,
    ...row,
  });
}

export const approveAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ad_id: z.string().uuid(), notes: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("ads")
      .update({ status: "approved", rejection_reason: null })
      .eq("id", data.ad_id);
    if (error) throw new Error(error.message);

    const { data: ad } = await context.supabase
      .from("ads")
      .select("user_id")
      .eq("id", data.ad_id)
      .maybeSingle();

    await logAdminAction(context, {
      action_type: "ad.approved",
      ad_id: data.ad_id,
      target_user_id: ad?.user_id ?? null,
      notes: data.notes ?? null,
    });

    return { ok: true };
  });

export const rejectAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ ad_id: z.string().uuid(), reason: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("ads")
      .update({ status: "rejected", rejection_reason: data.reason })
      .eq("id", data.ad_id);
    if (error) throw new Error(error.message);

    const { data: ad } = await context.supabase
      .from("ads")
      .select("user_id")
      .eq("id", data.ad_id)
      .maybeSingle();

    await logAdminAction(context, {
      action_type: "ad.rejected",
      ad_id: data.ad_id,
      target_user_id: ad?.user_id ?? null,
      notes: data.reason,
    });

    return { ok: true };
  });

export const initiateRefund = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ ad_id: z.string().uuid(), reason: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: pay, error: payErr } = await context.supabase
      .from("ad_payments")
      .select("id, user_id, amount, currency, payment_status, refund_status")
      .eq("ad_id", data.ad_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (payErr || !pay) throw new Error("No payment found for this ad");
    if (pay.payment_status !== "paid") throw new Error("Payment is not paid; cannot refund");
    if (pay.refund_status === "pending" || pay.refund_status === "completed") {
      throw new Error(`Refund already ${pay.refund_status}`);
    }

    const { data: refund, error: refundErr } = await context.supabase
      .from("refunds")
      .insert({
        payment_id: pay.id,
        ad_id: data.ad_id,
        user_id: pay.user_id,
        amount: pay.amount,
        currency: pay.currency ?? "BDT",
        status: "pending",
        reason: data.reason ?? null,
        initiated_by: context.userId,
      })
      .select()
      .single();
    if (refundErr) throw new Error(refundErr.message);

    await context.supabase
      .from("ad_payments")
      .update({ refund_status: "pending" })
      .eq("id", pay.id);

    await logAdminAction(context, {
      action_type: "refund.initiated",
      ad_id: data.ad_id,
      payment_id: pay.id,
      refund_id: refund.id,
      target_user_id: pay.user_id,
      notes: data.reason ?? null,
    });

    const webhook = await fireN8nWebhook("refund.initiated", {
      refund_id: refund.id,
      payment_id: pay.id,
      ad_id: data.ad_id,
      user_id: pay.user_id,
      amount: pay.amount,
    });

    return { ok: true, refund_id: refund.id, webhook };
  });

export const completeRefund = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ refund_id: z.string().uuid(), success: z.boolean().default(true) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: refund, error: rErr } = await context.supabase
      .from("refunds")
      .select("id, payment_id, ad_id, user_id, amount")
      .eq("id", data.refund_id)
      .maybeSingle();
    if (rErr || !refund) throw new Error("Refund not found");

    const newStatus = data.success ? "completed" : "failed";

    await context.supabase
      .from("refunds")
      .update({
        status: newStatus,
        completed_at: data.success ? new Date().toISOString() : null,
      })
      .eq("id", refund.id);

    await context.supabase
      .from("ad_payments")
      .update({ refund_status: newStatus })
      .eq("id", refund.payment_id);

    if (data.success && refund.ad_id) {
      await context.supabase
        .from("ads")
        .update({ status: "refunded" })
        .eq("id", refund.ad_id);
    }

    await logAdminAction(context, {
      action_type: data.success ? "refund.completed" : "refund.failed",
      ad_id: refund.ad_id,
      payment_id: refund.payment_id,
      refund_id: refund.id,
      target_user_id: refund.user_id,
    });

    const webhook = await fireN8nWebhook(
      data.success ? "refund.completed" : "refund.failed",
      {
        refund_id: refund.id,
        payment_id: refund.payment_id,
        ad_id: refund.ad_id,
        user_id: refund.user_id,
        amount: refund.amount,
      },
    );

    return { ok: true, webhook };
  });
