import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Plus, Eye, Clock, CheckCircle2, XCircle, Hourglass,
  CreditCard, RotateCcw, FileText, ShieldAlert, Pencil,
} from "lucide-react";
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
  draft:                       { label: "Draft",                icon: FileText,    cls: "bg-muted text-muted-foreground" },
  payment_pending:             { label: "Awaiting payment",     icon: Hourglass,   cls: "bg-amber-100 text-amber-900" },
  waiting_for_admin_approval:  { label: "Awaiting approval",    icon: Clock,       cls: "bg-blue-100 text-blue-900" },
  approved:                    { label: "Approved · Live",      icon: CheckCircle2,cls: "bg-emerald-100 text-emerald-900" },
  rejected:                    { label: "Rejected",             icon: XCircle,     cls: "bg-red-100 text-red-900" },
  refunded:                    { label: "Refunded",             icon: RotateCcw,   cls: "bg-purple-100 text-purple-900" },
  expired:                     { label: "Expired",              icon: Clock,       cls: "bg-muted text-muted-foreground" },
};

const PAY_META: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  paid: "bg-emerald-100 text-emerald-900",
  failed: "bg-red-100 text-red-900",
  cancelled: "bg-muted text-muted-foreground",
};

const REFUND_META: Record<string, string> = {
  none: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-900",
  completed: "bg-purple-100 text-purple-900",
  failed: "bg-red-100 text-red-900",
};

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const adsQ = useQuery({
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

  const paymentsQ = useQuery({
    queryKey: ["my-payments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_payments")
        .select("*, ads(title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const refundsQ = useQuery({
    queryKey: ["my-refunds", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refunds")
        .select("*, ads(title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`user-${user.id}-updates`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ads", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["my-ads"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "ad_payments", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["my-payments"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "refunds", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["my-refunds"] });
          qc.invalidateQueries({ queryKey: ["my-payments"] });
          qc.invalidateQueries({ queryKey: ["my-ads"] });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, qc]);

  const ads = adsQ.data ?? [];
  const payments = paymentsQ.data ?? [];
  const refunds = refundsQ.data ?? [];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">My dashboard</h1>
            <p className="text-muted-foreground">Track ads, payments and refunds in one place.</p>
          </div>
          <Button asChild><Link to="/dashboard/new-ad"><Plus className="h-4 w-4" /> Post a new offer</Link></Button>
        </div>

        {/* Ads */}
        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold">My ads</h2>
          <div className="mt-4">
            {ads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                <p className="font-display text-xl font-semibold">No ads yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Create your first offer and reach thousands of shoppers.</p>
                <Button asChild className="mt-4"><Link to="/dashboard/new-ad">Post your first offer</Link></Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {ads.map((ad) => {
                  const meta = STATUS_META[ad.status] ?? STATUS_META.draft;
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
                        {ad.rejection_reason && (
                          <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" /> {ad.rejection_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {ad.status === "approved" && (
                          <Button asChild variant="outline" size="sm">
                            <Link to="/ad/$id" params={{ id: ad.id }}><Eye className="h-4 w-4" /> View</Link>
                          </Button>
                        )}
                        {["approved", "waiting_for_admin_approval", "rejected"].includes(ad.status) && (
                          <Button asChild variant="outline" size="sm">
                            <Link to="/dashboard/edit-ad/$id" params={{ id: ad.id }}><Pencil className="h-4 w-4" /> Edit</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Transactions */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Transactions
          </h2>
          {payments.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Transaction</th>
                    <th className="px-4 py-3">Ad</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Refund</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">{p.tran_id}</td>
                      <td className="px-4 py-3">{p.ads?.title ?? "—"}</td>
                      <td className="px-4 py-3">{formatBDT(Number(p.amount))} {p.currency}</td>
                      <td className="px-4 py-3">{p.payment_method ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAY_META[p.payment_status] ?? ""}`}>
                          {p.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${REFUND_META[p.refund_status] ?? ""}`}>
                          {p.refund_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Refunds */}
        {refunds.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <RotateCcw className="h-5 w-5" /> Refunds
            </h2>
            <div className="mt-4 grid gap-3">
              {refunds.map((r: any) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                  <div>
                    <p className="font-semibold">{r.ads?.title ?? "Refund"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBDT(Number(r.amount))} {r.currency} · {new Date(r.created_at).toLocaleString()}
                    </p>
                    {r.reason && <p className="mt-1 text-xs text-muted-foreground">Reason: {r.reason}</p>}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${REFUND_META[r.status] ?? ""}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
