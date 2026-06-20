import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, XCircle, ShieldCheck, RotateCcw, ClipboardList } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/plans";
import {
  approveAd, rejectAd, initiateRefund, completeRefund,
} from "@/lib/admin-actions.functions";

type Tab = "waiting_for_admin_approval" | "approved" | "rejected" | "refunds" | "actions";

const STATUS_TABS: { id: Tab; label: string }[] = [
  { id: "waiting_for_admin_approval", label: "Awaiting approval" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "refunds", label: "Refunds" },
  { id: "actions", label: "Audit log" },
];

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("waiting_for_admin_approval");

  const approveFn = useServerFn(approveAd);
  const rejectFn = useServerFn(rejectAd);
  const initiateRefundFn = useServerFn(initiateRefund);
  const completeRefundFn = useServerFn(completeRefund);

  const adsQ = useQuery({
    queryKey: ["admin-ads", tab],
    enabled: tab === "waiting_for_admin_approval" || tab === "approved" || tab === "rejected",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*, profiles:user_id(company_name, phone)")
        .eq("status", tab as "waiting_for_admin_approval" | "approved" | "rejected")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const refundsQ = useQuery({
    queryKey: ["admin-refunds"],
    enabled: tab === "refunds",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refunds")
        .select("*, ads(title), profiles:user_id(company_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const actionsQ = useQuery({
    queryKey: ["admin-actions-log"],
    enabled: tab === "actions",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*, ads(title)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("admin-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "ads" },
        () => qc.invalidateQueries({ queryKey: ["admin-ads"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "refunds" },
        () => qc.invalidateQueries({ queryKey: ["admin-refunds"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_actions" },
        () => qc.invalidateQueries({ queryKey: ["admin-actions-log"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const handleApprove = async (id: string) => {
    try {
      await approveFn({ data: { ad_id: id } });
      toast.success("Approved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const handleReject = async (id: string) => {
    const reason = window.prompt("Rejection reason?") || "";
    if (!reason.trim()) return;
    try {
      await rejectFn({ data: { ad_id: id, reason } });
      toast.success("Rejected");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const handleRefund = async (id: string) => {
    const reason = window.prompt("Refund reason (optional)?") || "";
    try {
      await initiateRefundFn({ data: { ad_id: id, reason: reason || undefined } });
      toast.success("Refund initiated");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const handleCompleteRefund = async (refundId: string, success: boolean) => {
    try {
      await completeRefundFn({ data: { refund_id: refundId, success } });
      toast.success(success ? "Refund marked completed" : "Refund marked failed");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-10">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="font-display text-4xl font-bold">Admin panel</h1>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
                tab === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Ad lists */}
        {(tab === "waiting_for_admin_approval" || tab === "approved" || tab === "rejected") && (
          <div className="mt-6 grid gap-4">
            {!adsQ.data || adsQ.data.length === 0 ? (
              <p className="text-muted-foreground">Nothing here.</p>
            ) : adsQ.data.map((ad: any) => (
              <div key={ad.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                  {ad.image_url && <img src={ad.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold">{ad.title}</h3>
                  <p className="text-sm text-muted-foreground">{ad.category} · {formatBDT(Number(ad.offer_price))} · {ad.plan}</p>
                  <p className="mt-1 text-sm">{ad.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    By: {ad.profiles?.company_name} · {ad.profiles?.phone}
                  </p>
                  {ad.rejection_reason && <p className="mt-1 text-xs text-destructive">Reason: {ad.rejection_reason}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  {tab === "waiting_for_admin_approval" && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(ad.id)}>
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(ad.id)}>
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                  {(tab === "rejected" || tab === "approved") && (
                    <Button size="sm" variant="outline" onClick={() => handleRefund(ad.id)}>
                      <RotateCcw className="h-4 w-4" /> Refund
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refunds tab */}
        {tab === "refunds" && (
          <div className="mt-6 grid gap-4">
            {!refundsQ.data || refundsQ.data.length === 0 ? (
              <p className="text-muted-foreground">No refunds.</p>
            ) : refundsQ.data.map((r: any) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                <div>
                  <p className="font-semibold">{r.ads?.title ?? "—"} <span className="text-xs text-muted-foreground">· {r.profiles?.company_name}</span></p>
                  <p className="text-xs text-muted-foreground">
                    {formatBDT(Number(r.amount))} {r.currency} · {new Date(r.created_at).toLocaleString()}
                  </p>
                  {r.reason && <p className="mt-1 text-xs text-muted-foreground">Reason: {r.reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{r.status}</span>
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => handleCompleteRefund(r.id, true)}>
                        <CheckCircle2 className="h-4 w-4" /> Mark completed
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCompleteRefund(r.id, false)}>
                        <XCircle className="h-4 w-4" /> Mark failed
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Audit log */}
        {tab === "actions" && (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium">
              <ClipboardList className="h-4 w-4" /> Recent admin actions
            </div>
            {!actionsQ.data || actionsQ.data.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No actions yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">When</th>
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">Ad</th>
                    <th className="px-4 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {actionsQ.data.map((a: any) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 font-mono text-xs">{a.action_type}</td>
                      <td className="px-4 py-2">{a.ads?.title ?? "—"}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{a.notes ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
