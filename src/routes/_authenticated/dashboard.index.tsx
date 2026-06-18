import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Eye, Clock, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatBDT } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Dashboard,
});

const STATUS_META: Record<string, { label: string; icon: any; cls: string }> = {
  pending_payment: { label: "Awaiting payment", icon: Hourglass, cls: "bg-amber-100 text-amber-900" },
  pending_review: { label: "In review", icon: Clock, cls: "bg-blue-100 text-blue-900" },
  active: { label: "Live", icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-900" },
  rejected: { label: "Rejected", icon: XCircle, cls: "bg-red-100 text-red-900" },
  expired: { label: "Expired", icon: Clock, cls: "bg-muted text-muted-foreground" },
};

function Dashboard() {
  const { user } = useAuth();
  const { data: ads } = useQuery({
    queryKey: ["my-ads", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">My ads</h1>
            <p className="text-muted-foreground">Manage and track your offers in one place.</p>
          </div>
          <Button asChild><Link to="/dashboard/new-ad"><Plus className="h-4 w-4" /> Post a new offer</Link></Button>
        </div>

        <div className="mt-8">
          {!ads || ads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <p className="font-display text-xl font-semibold">No ads yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first offer and reach thousands of shoppers.</p>
              <Button asChild className="mt-4"><Link to="/dashboard/new-ad">Post your first offer</Link></Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {ads.map((ad) => {
                const meta = STATUS_META[ad.status] ?? STATUS_META.pending_payment;
                const Icon = meta.icon;
                return (
                  <div key={ad.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                      {ad.image_url ? <img src={ad.image_url} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-bold">{ad.title}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}>
                          <Icon className="h-3 w-3" /> {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{ad.category} · {formatBDT(Number(ad.offer_price))} · {ad.plan}</p>
                      {ad.rejection_reason && <p className="mt-1 text-xs text-destructive">Reason: {ad.rejection_reason}</p>}
                    </div>
                    <div className="flex gap-2">
                      {ad.status === "active" && (
                        <Button asChild variant="outline" size="sm"><Link to="/ad/$id" params={{ id: ad.id }}><Eye className="h-4 w-4" /> View</Link></Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
