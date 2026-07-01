import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

function Placeholder({ title, description, cta }: { title: string; description: string; cta?: { to: string; label: string } }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-10 text-center">
          <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Coming soon</div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-muted-foreground">{description}</p>
          {cta && (
            <Button asChild className="mt-8"><Link to={cta.to}>{cta.label}</Link></Button>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

export { Placeholder };

export const Route = createFileRoute("/advertiser/trends")({
  head: () => ({ meta: [{ title: "Market Trends — AYNA" }] }),
  component: () => (
    <Placeholder
      title="Market Trends"
      description="Views, clicks, CTR, saves, likes and dislikes across all your ads. Rolling out in Phase 3."
      cta={{ to: "/dashboard", label: "Back to my ads" }}
    />
  ),
});
