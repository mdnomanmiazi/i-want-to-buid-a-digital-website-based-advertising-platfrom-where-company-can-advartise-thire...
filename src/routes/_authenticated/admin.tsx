import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending_review" | "active" | "rejected">("pending_review");
  const { data: ads } = useQuery({
    queryKey: ["admin-ads", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*, profiles:user_id(company_name, phone)")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approve = async (id: string) => {
    const { error } = await supabase.from("ads").update({ status: "active" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Approved"); qc.invalidateQueries({ queryKey: ["admin-ads"] }); }
  };
  const reject = async (id: string) => {
    const reason = prompt("Rejection reason?") || "Does not meet guidelines";
    const { error } = await supabase.from("ads").update({ status: "rejected", rejection_reason: reason }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Rejected"); qc.invalidateQueries({ queryKey: ["admin-ads"] }); }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-10">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="font-display text-4xl font-bold">Admin · Ad review</h1>
        </div>

        <div className="mt-6 flex gap-2">
          {(["pending_review", "active", "rejected"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border ${tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {!ads || ads.length === 0 ? (
            <p className="text-muted-foreground">Nothing here.</p>
          ) : ads.map((ad: any) => (
            <div key={ad.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                {ad.image_url && <img src={ad.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold">{ad.title}</h3>
                <p className="text-sm text-muted-foreground">{ad.category} · {formatBDT(Number(ad.offer_price))} · {ad.plan}</p>
                <p className="mt-1 text-sm">{ad.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">By: {ad.profiles?.company_name} · {ad.profiles?.phone}</p>
              </div>
              {tab === "pending_review" && (
                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={() => approve(ad.id)}><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => reject(ad.id)}><XCircle className="h-4 w-4" /> Reject</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
