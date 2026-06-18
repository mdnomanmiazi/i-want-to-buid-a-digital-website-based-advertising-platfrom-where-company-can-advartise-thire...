import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AdCard, type AdCardData } from "@/components/ad-card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/plans";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse offers — AYNA" },
      { name: "description", content: "Discover live offers from brands across Bangladesh." },
      { property: "og:title", content: "Browse offers — AYNA" },
      { property: "og:description", content: "Live deals across categories — food, fashion, electronics, travel and more." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [category, setCategory] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const { data: ads, isLoading } = useQuery({
    queryKey: ["ads", category],
    queryFn: async () => {
      let query = supabase
        .from("ads")
        .select("id,title,category,original_price,offer_price,discount_percent,image_url,location,plan")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) throw error;
      return data as AdCardData[];
    },
  });

  const filtered = (ads ?? []).filter((a) =>
    q ? a.title.toLowerCase().includes(q.toLowerCase()) : true,
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-10">
        <h1 className="font-display text-4xl font-bold">Browse offers</h1>
        <p className="mt-2 text-muted-foreground">Hand-picked deals refreshed daily.</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search offers..." className="pl-9" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border ${!category ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border ${category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {isLoading ? (
            <p className="text-muted-foreground">Loading offers...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <p className="font-display text-lg font-semibold">No offers match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different category or clear the search.</p>
              <Link to="/dashboard/new-ad" className="mt-4 inline-block text-primary hover:underline">Or post your own offer →</Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((ad) => <AdCard key={ad.id} ad={ad} />)}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
