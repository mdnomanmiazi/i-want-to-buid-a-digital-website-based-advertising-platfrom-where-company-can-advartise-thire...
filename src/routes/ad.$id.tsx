import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Heart, MapPin, MessageCircle, Phone, Tag } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/plans";
import { useAuth } from "@/hooks/use-auth";
import { AuthGateModal } from "@/components/auth-gate-modal";
import { pushRecentAd } from "@/lib/recently-viewed";
import { toast } from "sonner";

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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [gateOpen, setGateOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // Track recently viewed (regardless of auth)
  useEffect(() => { pushRecentAd(id); }, [id]);

  // Show gate modal for guests
  useEffect(() => {
    if (!authLoading && !user) setGateOpen(true);
    else setGateOpen(false);
  }, [authLoading, user]);

  // Fetch a teaser even for guests (cover image + title only)
  const { data: teaser } = useQuery({
    queryKey: ["ad-teaser", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("id,title,category,image_url,location")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Full ad — only when signed in
  const { data: ad, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["ad", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      let profile: any = null;
      if (data.user_id) {
        const { data: p } = await supabase
          .from("profiles")
          .select("company_name, phone, website, logo_url")
          .eq("id", data.user_id)
          .maybeSingle();
        profile = p;
      }
      return { ...data, profile };
    },
  });

  // Favorite status
  const { data: isFav } = useQuery({
    enabled: !!user,
    queryKey: ["ad-fav", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("ad_id", id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  const favMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not signed in");
      if (isFav) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("ad_id", id)
          .eq("user_id", user.id);
        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ ad_id: id, user_id: user.id });
        if (error) throw error;
        return true;
      }
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(["ad-fav", id, user?.id], saved);
      toast.success(saved ? "Saved to favorites" : "Removed from favorites");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not update favorite"),
  });

  // Guest view — gated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container-page py-10">
          <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to browse
          </Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
              {teaser?.image_url ? (
                <img src={teaser.image_url} alt={teaser.title} className="aspect-[4/3] w-full object-cover blur-md scale-105" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-accent/30 to-primary/20">
                  <Tag className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 grid place-items-center bg-black/40 text-white">
                <div className="text-center px-6">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/70">Members only</p>
                  <p className="mt-2 font-display text-2xl">Sign in to view this offer</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{teaser?.category}</p>
              <h1 className="mt-1 font-display text-4xl font-bold">{teaser?.title ?? "Exclusive offer"}</h1>
              <p className="mt-6 text-foreground/70">
                Create a free account to see full pricing, claim the offer, and contact the seller.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:max-w-xs">
                <Button onClick={() => setGateOpen(true)} className="h-11">Sign up to view</Button>
                <Button variant="outline" onClick={() => navigate({ to: "/browse" })} className="h-11">Back to browse</Button>
              </div>
            </div>
          </div>
        </div>
        <SiteFooter />
        <AuthGateModal
          open={gateOpen}
          redirectTo={`/ad/${id}`}
          onClose={() => setGateOpen(false)}
        />
      </div>
    );
  }

  if (isLoading || authLoading) return <div className="container-page py-20">Loading...</div>;
  if (!ad) return null;

  const discount =
    ad.discount_percent ??
    (ad.original_price && ad.original_price > ad.offer_price
      ? Math.round(((Number(ad.original_price) - Number(ad.offer_price)) / Number(ad.original_price)) * 100)
      : null);

  const profile = (ad as any).profile as { company_name: string; phone: string | null; website: string | null } | null;

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
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{ad.category}</p>
                <h1 className="mt-1 font-display text-4xl font-bold">{ad.title}</h1>
              </div>
              <button
                onClick={() => favMut.mutate()}
                disabled={favMut.isPending}
                aria-label={isFav ? "Remove favorite" : "Save favorite"}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${
                  isFav ? "border-rose-500 bg-rose-500 text-white" : "border-border bg-white text-foreground hover:border-foreground"
                }`}
              >
                <Heart className={`h-5 w-5 ${isFav ? "fill-current" : ""}`} />
              </button>
            </div>

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
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {ad.link_url && (
                <Button asChild size="lg" className="shadow-pop">
                  <a href={ad.link_url} target="_blank" rel="noopener noreferrer">
                    Claim this offer <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {(ad.contact_phone || profile?.phone) && (
                <Button size="lg" variant="outline" onClick={() => setShowContact((s) => !s)}>
                  <MessageCircle className="h-4 w-4" /> Contact seller
                </Button>
              )}
            </div>

            {showContact && (ad.contact_phone || profile?.phone) && (
              <div className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Seller contact</p>
                <p className="mt-1 inline-flex items-center gap-2 font-medium">
                  <Phone className="h-4 w-4" /> {ad.contact_phone ?? profile?.phone}
                </p>
              </div>
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
