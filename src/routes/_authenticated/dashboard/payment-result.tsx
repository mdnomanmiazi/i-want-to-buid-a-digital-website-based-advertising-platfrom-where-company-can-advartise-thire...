import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { confirmPayment } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/dashboard/payment-result")({
  component: PaymentResult,
});

function PaymentResult() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const confirm = useServerFn(confirmPayment);

  useEffect(() => {
    (async () => {
      const tran =
        localStorage.getItem("lastTransactionId") ||
        new URLSearchParams(location.search).get("tran_id");
      if (!tran) {
        setStatus("error");
        setMessage("Missing transaction id.");
        return;
      }
      try {
        await confirm({ data: { tran_id: tran } });
        localStorage.removeItem("lastTransactionId");
        setStatus("ok");
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Could not confirm payment.");
      }
    })();
  }, [confirm]);

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
            <p className="mt-2 text-muted-foreground">
              Your ad is awaiting admin approval. You'll see live updates on your dashboard.
            </p>
            <Button className="mt-6" onClick={() => navigate({ to: "/dashboard" })}>
              Back to dashboard
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="font-display text-3xl font-bold">We couldn't confirm your payment</h1>
            <p className="mt-2 text-muted-foreground">
              {message || "If you were charged, please contact support with your transaction id."}
            </p>
            <Button className="mt-6" onClick={() => navigate({ to: "/dashboard" })}>
              Back to dashboard
            </Button>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
