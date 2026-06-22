import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { CATEGORIES } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/dashboard/edit-ad/$id")({
  component: EditAd,
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
});

const EDITABLE = new Set(["approved", "waiting_for_admin_approval", "rejected"]);

function EditAd() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data, error } = await supabase.from("ads").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
      if (error || !data) { toast.error("Ad not found"); navigate({ to: "/dashboard" }); return; }
      if (!EDITABLE.has(data.status)) {
        toast.error("This ad cannot be edited in its current state.");
        navigate({ to: "/dashboard" });
        return;
      }
      setAd(data);
      setLoading(false);
    })();
  }, [id, user, navigate]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !ad) return;
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
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const d = parsed.data;
    const discount = d.original_price && d.original_price > d.offer_price
      ? Math.round(((d.original_price - d.offer_price) / d.original_price) * 100)
      : null;

    const { error } = await supabase.from("ads").update({
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
      status: "waiting_for_admin_approval",
      rejection_reason: null,
    }).eq("id", ad.id).eq("user_id", user.id);

    if (error) { setSubmitting(false); toast.error(error.message); return; }
    toast.success("Changes saved — your ad is back in review.");
    navigate({ to: "/dashboard" });
  };

  if (loading || !ad) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container-page py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-10 max-w-4xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="mt-4 font-display text-4xl font-bold">Edit offer</h1>
        <p className="text-muted-foreground">Editing will hide the ad from listings until an admin re-approves it.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Offer title*</Label><Input name="title" required maxLength={120} defaultValue={ad.title} /></div>
            <div className="sm:col-span-2"><Label>Description*</Label><Textarea name="description" required rows={5} defaultValue={ad.description} /></div>
            <div>
              <Label>Category*</Label>
              <Select name="category" required defaultValue={ad.category}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Location</Label><Input name="location" defaultValue={ad.location ?? ""} /></div>
            <div><Label>Original price (BDT)</Label><Input name="original_price" type="number" min="0" step="1" defaultValue={ad.original_price ?? ""} /></div>
            <div><Label>Offer price (BDT)*</Label><Input name="offer_price" type="number" min="1" step="1" required defaultValue={ad.offer_price} /></div>
            <div className="sm:col-span-2"><Label>Image URL</Label><Input name="image_url" type="url" defaultValue={ad.image_url ?? ""} /></div>
            <div className="sm:col-span-2"><Label>Offer link</Label><Input name="link_url" type="url" defaultValue={ad.link_url ?? ""} /></div>
            <div><Label>Contact phone*</Label><Input name="contact_phone" required defaultValue={ad.contact_phone} /></div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" size="lg" disabled={submitting} className="shadow-pop">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save & send for approval"}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>
          </div>
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}
