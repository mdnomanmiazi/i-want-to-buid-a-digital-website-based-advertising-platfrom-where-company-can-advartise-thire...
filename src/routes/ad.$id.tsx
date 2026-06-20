import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, MapPin, Phone, Tag } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/plans";

export const Route = createFileRoute("/ad/$id")({
  head: () => ({
    meta: [
      { title: "Offer — AYNA" },
      { name: "description", content: "View this exclusive offer on AYNA." },
    ],
  }),
  component: AdDetail,
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-4xl font-bold">Offer not found</h1>
        <p className="mt-2 text-muted-foreground">It may have expired or been removed.</p>
        <Button asChild className="mt-6"><Link to="/browse">Back to browse</Link></Button>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container-page py-20 text-center">
      <p>Failed to load: {error.message}</p>
    </div>
  ),
});

function AdDetail() {
  const { id } = Route.useParams();
  const { data: ad, isLoading } = useQuery({
    queryKey: ["ad", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*, profiles:user_id(company_name, phone, website, logo_url)")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) return <div className="container-page py-20">Loading...</div>;
  if (!ad) return null;

  const discount =
    ad.discount_percent ??
    (ad.original_price && ad.original_price > ad.offer_price
      ? Math.round(((Number(ad.original_price) - Number(ad.offer_price)) / Number(ad.original_price)) * 100)
      : null);

  const profile = (ad as any).profiles as { company_name: string; phone: string | null; website: string | null } | null;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-10">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to browse
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            {ad.image_url ? (
              <img src={ad.image_url} alt={ad.title} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-accent/30 to-primary/20">
                <Tag className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{ad.category}</p>
            <h1 className="mt-1 font-display text-4xl font-bold">{ad.title}</h1>

            <div className="mt-5 flex items-end gap-4">
              <p className="font-display text-5xl font-bold text-primary">{formatBDT(Number(ad.offer_price))}</p>
              {ad.original_price && Number(ad.original_price) > Number(ad.offer_price) && (
                <p className="text-xl text-muted-foreground line-through pb-1">{formatBDT(Number(ad.original_price))}</p>
              )}
              {discount && discount > 0 && (
                <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">−{discount}% OFF</span>
              )}
            </div>

            <p className="mt-6 whitespace-pre-line text-foreground/80">{ad.description}</p>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {ad.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {ad.location}</span>}
              {ad.contact_phone && <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {ad.contact_phone}</span>}
            </div>

            {ad.link_url && (
              <Button asChild size="lg" className="mt-7 shadow-pop">
                <a href={ad.link_url} target="_blank" rel="noopener noreferrer">
                  Claim this offer <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}

            {profile && (
              <div className="mt-8 rounded-2xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Offered by</p>
                <p className="mt-1 font-display text-xl font-bold">{profile.company_name}</p>
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-primary hover:underline">
                    Visit website ↗
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
