import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgePercent, Megaphone, Sparkles, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AdCard, type AdCardData } from "@/components/ad-card";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, PLAN_LIST, formatBDT } from "@/lib/plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AYNA — Bangladesh's Vibrant Deal Marketplace" },
      { name: "description", content: "Discover exclusive offers from top brands. Companies advertise their best deals — shoppers save big." },
      { property: "og:title", content: "AYNA — Bangladesh's Vibrant Deal Marketplace" },
      { property: "og:description", content: "Discover exclusive offers from top brands across Bangladesh." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: featured } = useQuery({
    queryKey: ["featured-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("id,title,category,original_price,offer_price,discount_percent,image_url,location,plan")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as AdCardData[];
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="deal-chip mb-5"><Sparkles className="h-3 w-3" /> Bangladesh's #1 offer marketplace</span>
            <h1 className="font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
              Where brands shout <span className="text-primary">their best price</span> — and shoppers listen.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Post your offer in minutes. Reach thousands of bargain-hungry buyers across Dhaka and beyond. Pay once, get seen.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-pop">
                <Link to="/dashboard/new-ad">
                  <Megaphone className="h-5 w-5" /> Post an offer
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/browse">Browse offers <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div><strong className="text-foreground">From {formatBDT(500)}</strong> · single ad</div>
              <div className="h-4 w-px bg-border" />
              <div><strong className="text-foreground">No setup fees</strong></div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-transparent blur-2xl" />
            <div className="relative grid grid-cols-2 gap-4">
              {[
                { tag: "−40%", title: "Iftar Buffet", price: "৳699", color: "bg-primary text-primary-foreground" },
                { tag: "−25%", title: "Smart TV 43\"", price: "৳29,990", color: "bg-ink text-ink-foreground" },
                { tag: "BOGO", title: "Spa Day", price: "৳1,500", color: "bg-deal text-deal-foreground" },
                { tag: "−15%", title: "Cox's Bazar Stay", price: "৳4,200", color: "bg-accent text-accent-foreground" },
              ].map((c, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-5 shadow-pop ${i % 2 === 0 ? "translate-y-4" : ""} ${c.color}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80">Offer</p>
                  <p className="mt-2 text-2xl font-bold font-display">{c.tag}</p>
                  <p className="mt-1 text-sm opacity-90">{c.title}</p>
                  <p className="mt-3 text-lg font-bold">{c.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page py-12">
        <h2 className="mb-6 font-display text-2xl font-bold">Browse by category</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to="/browse"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-page py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold">🔥 Hottest offers right now</h2>
            <p className="text-muted-foreground">Fresh deals from verified brands</p>
          </div>
          <Button asChild variant="ghost"><Link to="/browse">See all <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        {featured && featured.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((ad) => <AdCard key={ad.id} ad={ad} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="font-display text-lg font-semibold">No live offers yet</p>
            <p className="text-sm text-muted-foreground">Be the first to post — your offer will land on the front page.</p>
            <Button asChild className="mt-4"><Link to="/dashboard/new-ad">Post the first offer</Link></Button>
          </div>
        )}
      </section>

      {/* WHY */}
      <section className="container-page py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, title: "Hyper-targeted", text: "Shoppers come here specifically looking for offers. Higher intent, better conversion." },
            { icon: Zap, title: "Live in minutes", text: "Post your ad, pay securely, get reviewed fast, and go live the same day." },
            { icon: BadgePercent, title: "Transparent pricing", text: "No hidden fees. Pay per ad or unlock unlimited posting with monthly/yearly plans." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="container-page py-12">
        <div className="rounded-3xl bg-ink p-10 text-ink-foreground shadow-deal">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold">Simple, honest pricing</h2>
              <p className="mt-2 text-ink-foreground/70">Start at {formatBDT(500)} for a single ad. Scale up when you're ready.</p>
              <Button asChild size="lg" className="mt-6"><Link to="/pricing">See plans <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {PLAN_LIST.map((p) => (
                <div key={p.id} className={`rounded-2xl border p-4 ${p.highlight ? "border-primary bg-primary text-primary-foreground" : "border-ink-foreground/15"}`}>
                  <p className="text-xs uppercase tracking-wider opacity-70">{p.name}</p>
                  <p className="mt-2 font-display text-2xl font-bold">{formatBDT(p.price)}</p>
                  <p className="mt-1 text-xs opacity-80">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
