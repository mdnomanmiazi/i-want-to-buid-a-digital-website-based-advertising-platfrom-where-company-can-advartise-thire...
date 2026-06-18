import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { PLAN_LIST, formatBDT } from "@/lib/plans";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — AYNA" },
      { name: "description", content: "Transparent pricing for advertising on AYNA. Single ad, monthly, or yearly plans." },
      { property: "og:title", content: "Pricing — AYNA" },
      { property: "og:description", content: "Single ad, monthly, or yearly. Pick the plan that fits your business." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-5xl font-bold">Simple, honest pricing</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Pay per ad or unlock unlimited posting. Cancel anytime.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLAN_LIST.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-3xl border p-7 ${p.highlight ? "border-primary bg-card shadow-deal" : "border-border bg-card"}`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-primary-foreground tracking-wider">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold">{formatBDT(p.price)}</span>
                <span className="text-muted-foreground">/ {p.id === "single" ? "ad" : p.id}</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-success" /> {perk}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-7" variant={p.highlight ? "default" : "outline"}>
                <Link to="/dashboard/new-ad" search={{ plan: p.id } as never}>Choose {p.name}</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-border bg-card p-8 text-center">
          <h2 className="font-display text-2xl font-bold">Need a custom plan?</h2>
          <p className="mt-2 text-muted-foreground">Running a big campaign or want featured placement? Get in touch.</p>
          <Button asChild variant="outline" className="mt-4"><Link to="/contact">Contact sales</Link></Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
