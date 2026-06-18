import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Megaphone, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — AYNA" },
      { name: "description", content: "Post an offer on AYNA in 3 simple steps: create, pay, go live." },
      { property: "og:title", content: "How AYNA works" },
      { property: "og:description", content: "Post an offer on AYNA in 3 simple steps." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { icon: Megaphone, title: "1. Create your ad", text: "Add your offer details, image, and the discount you're running. Takes under 2 minutes." },
  { icon: CreditCard, title: "2. Pick a plan & pay", text: "Choose single, monthly, or yearly. Pay securely via bKash, Nagad, card or bank." },
  { icon: ShieldCheck, title: "3. Quick review", text: "Our team verifies your ad to keep the marketplace high-quality. Usually within hours." },
  { icon: Sparkles, title: "4. Go live", text: "Your offer lands on the homepage and is visible to thousands of deal-seekers." },
];

function HowItWorks() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-5xl font-bold">How AYNA works</h1>
          <p className="mt-3 text-lg text-muted-foreground">From idea to live offer in under a day.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Button asChild size="lg"><Link to="/dashboard/new-ad">Post your first offer</Link></Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
