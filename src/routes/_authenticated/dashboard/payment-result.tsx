import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/payment-result")({
  component: PaymentResult,
});

function PaymentResult() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    (async () => {
      const tran = localStorage.getItem("lastTransactionId") || new URLSearchParams(location.search).get("tran_id");
      if (!tran) { setStatus("error"); return; }
      // Mark payment paid & ad pending_review (trust-on-redirect; production should verify via webhook)
      const { data: pay } = await supabase.from("ad_payments").select("ad_id").eq("tran_id", tran).maybeSingle();
      if (!pay?.ad_id) { setStatus("error"); return; }
      await supabase.from("ad_payments").update({ status: "paid" }).eq("tran_id", tran);

      // Compute expires_at based on plan duration
      const { data: ad } = await supabase.from("ads").select("plan").eq("id", pay.ad_id).maybeSingle();
      const days = ad?.plan === "yearly" ? 365 : 30;
      const expires = new Date(Date.now() + days * 86400 * 1000).toISOString();
      await supabase.from("ads").update({ status: "pending_review", starts_at: new Date().toISOString(), expires_at: expires }).eq("id", pay.ad_id);

      localStorage.removeItem("lastTransactionId");
      setStatus("ok");
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-20 text-center">
        {status === "loading" && <p>Confirming your payment...</p>}
        {status === "ok" && (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold">Payment received!</h1>
            <p className="mt-2 text-muted-foreground">Your ad is now in review. We typically publish within a few hours.</p>
            <Button className="mt-6" onClick={() => navigate({ to: "/dashboard" })}>Back to dashboard</Button>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="font-display text-3xl font-bold">We couldn't confirm your payment</h1>
            <p className="mt-2 text-muted-foreground">If you were charged, please contact support with your transaction id.</p>
            <Button className="mt-6" onClick={() => navigate({ to: "/dashboard" })}>Back to dashboard</Button>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
