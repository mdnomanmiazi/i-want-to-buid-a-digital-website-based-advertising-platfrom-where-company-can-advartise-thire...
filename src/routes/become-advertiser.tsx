import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Store, TrendingUp, Target, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/become-advertiser")({
  head: () => ({ meta: [{ title: "Become an Advertiser — AYNA" }] }),
  component: BecomeAdvertiser,
});

function BecomeAdvertiser() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle()
      .then(({ data }) => setCurrent(((data as any)?.account_type as string) ?? null));
  }, [user]);

  const upgrade = async () => {
    if (!user) { navigate({ to: "/auth", search: { role: "advertiser" } as any }); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ account_type: "advertiser" as any }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("You're now an advertiser");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container-page py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Store className="h-3.5 w-3.5" /> For businesses
            </div>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight">Become an Advertiser</h1>
            <p className="mt-4 text-lg text-muted-foreground">Reach thousands of deal-hungry shoppers. Post offers, run campaigns, and measure performance.</p>
            {current === "advertiser" ? (
              <Button asChild size="lg" className="mt-8"><Link to="/dashboard">Go to advertiser dashboard</Link></Button>
            ) : (
              <Button onClick={upgrade} disabled={busy || loading} size="lg" className="mt-8">
                {user ? "Upgrade my account" : "Get started"}
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: TrendingUp, title: "Grow reach", body: "Feature your offers to a curated audience actively looking for deals." },
            { icon: Target, title: "Precise targeting", body: "Categories, interests and location-based visibility." },
            { icon: BarChart3, title: "Real analytics", body: "Track impressions, clicks, CTR and saves per ad." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
