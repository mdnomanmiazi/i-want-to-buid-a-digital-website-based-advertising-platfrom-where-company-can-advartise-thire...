import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES, PLAN_LIST, PLANS, type PlanId, formatBDT } from "@/lib/plans";
import { generateTransactionId, initiatePayment } from "@/lib/payment";

const MAX_IMAGES = 8;
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // 5 years

export const Route = createFileRoute("/_authenticated/dashboard/new-ad")({
  validateSearch: (s: Record<string, unknown>) => ({
    plan: (s.plan as PlanId) ?? "single",
  }),
  component: NewAd,
});

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  category: z.string().min(1),
  original_price: z.number().nonnegative().optional(),
  offer_price: z.number().positive(),
  image_url: z.string().url().optional().or(z.literal("")),
  link_url: z.string().url().optional().or(z.literal("")),
  contact_phone: z.string().min(6).max(20),
  location: z.string().max(80).optional(),
  company_name: z.string().min(2).max(120),
});

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  category: z.string().min(1),
  original_price: z.number().nonnegative().optional(),
  offer_price: z.number().positive(),
  link_url: z.string().url().optional().or(z.literal("")),
  contact_phone: z.string().min(6).max(20),
  location: z.string().max(80).optional(),
  company_name: z.string().min(2).max(120),
});

function NewAd() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan: initialPlan } = Route.useSearch();
  const [plan, setPlan] = useState<PlanId>(initialPlan);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    const room = MAX_IMAGES - files.length;
    if (room <= 0) {
      toast.error(`Max ${MAX_IMAGES} images`);
      return;
    }
    const next = arr.slice(0, room);
    setFiles((prev) => [...prev, ...next]);
    setPreviews((prev) => [...prev, ...next.map((f) => URL.createObjectURL(f))]);
  };

  const removeAt = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      title: fd.get("title"),
      description: fd.get("description"),
      category: fd.get("category"),
      original_price: fd.get("original_price") ? Number(fd.get("original_price")) : undefined,
      offer_price: Number(fd.get("offer_price")),
      image_url: fd.get("image_url") || "",
      link_url: fd.get("link_url") || "",
      contact_phone: fd.get("contact_phone"),
      location: fd.get("location") || undefined,
      company_name: fd.get("company_name"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const d = parsed.data;

    const discount = d.original_price && d.original_price > d.offer_price
      ? Math.round(((d.original_price - d.offer_price) / d.original_price) * 100)
      : null;

    // Insert ad in pending_payment
    const tran = generateTransactionId();
    const { data: ad, error: adErr } = await supabase
      .from("ads")
      .insert({
        user_id: user.id,
        title: d.title,
        description: d.description,
        category: d.category,
        original_price: d.original_price ?? null,
        offer_price: d.offer_price,
        discount_percent: discount,
        image_url: d.image_url || null,
        link_url: d.link_url || null,
        contact_phone: d.contact_phone,
        location: d.location || null,
        plan,
        status: "payment_pending",
        transaction_id: tran,
      })
      .select()
      .single();
    if (adErr || !ad) { setSubmitting(false); toast.error(adErr?.message ?? "Failed to create ad"); return; }

    // Update profile company_name if blank
    await supabase.from("profiles").update({ company_name: d.company_name, phone: d.contact_phone }).eq("id", user.id);

    // Insert payment record
    const amount = PLANS[plan].price;
    await supabase.from("ad_payments").insert({
      ad_id: ad.id,
      user_id: user.id,
      tran_id: tran,
      amount,
      plan,
      status: "initiated",
    });

    // Initiate payment
    const result = await initiatePayment(
      [{ name: `AYNA — ${PLANS[plan].name}`, price: amount, description: d.title }],
      { name: d.company_name, email: user.email ?? "", phone: d.contact_phone },
      tran,
    );

    if (result.success && result.redirectUrl) {
      window.location.href = result.redirectUrl;
    } else {
      setSubmitting(false);
      toast.error(result.error ?? "Payment failed to start");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-10 max-w-4xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="mt-4 font-display text-4xl font-bold">Post a new offer</h1>
        <p className="text-muted-foreground">Fill in your offer details, pick a plan, and pay to publish.</p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Offer title*</Label><Input name="title" required maxLength={120} placeholder="40% off lunch buffet at..." /></div>
              <div className="sm:col-span-2"><Label>Description*</Label><Textarea name="description" required rows={5} placeholder="What's included, terms, expiry..." /></div>
              <div>
                <Label>Category*</Label>
                <Select name="category" required defaultValue={CATEGORIES[0]}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Location</Label><Input name="location" placeholder="Dhaka" /></div>
              <div><Label>Original price (BDT)</Label><Input name="original_price" type="number" min="0" step="1" /></div>
              <div><Label>Offer price (BDT)*</Label><Input name="offer_price" type="number" min="1" step="1" required /></div>
              <div className="sm:col-span-2"><Label>Image URL</Label><Input name="image_url" type="url" placeholder="https://..." /></div>
              <div className="sm:col-span-2"><Label>Offer link (optional)</Label><Input name="link_url" type="url" placeholder="https://yourbrand.com/offer" /></div>
              <div><Label>Contact phone*</Label><Input name="contact_phone" required placeholder="+8801..." /></div>
              <div><Label>Company name*</Label><Input name="company_name" required placeholder="Your brand" /></div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-bold">Choose plan</h3>
              <div className="mt-4 space-y-3">
                {PLAN_LIST.map((p) => (
                  <label key={p.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${plan === p.id ? "border-primary bg-primary/5" : "border-border"}`}>
                    <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{p.name}</p>
                        <p className="font-display text-lg font-bold">{formatBDT(p.price)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full shadow-pop" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting to payment...</> : `Pay ${formatBDT(PLANS[plan].price)} & submit`}
            </Button>
            <p className="text-center text-xs text-muted-foreground">After payment, your ad goes into review. We'll publish it within hours.</p>
          </div>
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}
