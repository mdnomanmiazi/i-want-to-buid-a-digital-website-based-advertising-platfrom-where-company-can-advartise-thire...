import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, formatBDT } from "@/lib/plans";

const EDITORIAL_SLIDES = [
  {
    kicker: "The Digital Edit",
    title: "Days of Summer",
    cta: "For Her",
    href: "/browse",
    video: "https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4",
    poster: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1920&q=80",
  },
  {
    kicker: "New Arrivals",
    title: "Modern Essentials",
    cta: "Shop Now",
    href: "/browse",
    video: "https://videos.pexels.com/video-files/3024269/3024269-uhd_2560_1440_24fps.mp4",
    poster: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1920&q=80",
  },
  {
    kicker: "Featured Brands",
    title: "Crafted with Care",
    cta: "Discover",
    href: "/browse",
    video: "https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_25fps.mp4",
    poster: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80",
  },
];
const SLIDE_DURATION = 6000;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AYNA — A Curated Marketplace for Bold Offers" },
      { name: "description", content: "An editorial marketplace of standout offers from leading brands. Discover, compare, and shop the season's most talked-about deals." },
      { property: "og:title", content: "AYNA — A Curated Marketplace for Bold Offers" },
      { property: "og:description", content: "An editorial marketplace of standout offers from leading brands." },
    ],
  }),
  component: HomePage,
});

interface AdRow {
  id: string;
  title: string;
  category: string;
  original_price: number | null;
  offer_price: number;
  discount_percent: number | null;
  image_url: string | null;
  location: string | null;
  plan: string;
}

const HERO_VIDEO = "https://youtu.be/50PU-cQx7j0";
const HERO_POSTER = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80";
const FEATURE_LIFESTYLE = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=85";
const FEATURE_PRODUCT = "https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?auto=format&fit=crop&w=900&q=85";

const PAGE_SIZE = 12;

function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Top "shelf" — first 8 ads for the category grid section
  const { data: shelf } = useQuery({
    queryKey: ["home-shelf", activeCategory],
    queryFn: async () => {
      let q = supabase
        .from("ads")
        .select("id,title,category,original_price,offer_price,discount_percent,image_url,location,plan")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(8);
      if (activeCategory !== "All") q = q.eq("category", activeCategory);
      const { data, error } = await q;
      if (error) throw error;
      return data as AdRow[];
    },
  });

  // Infinite feed
  const feed = useInfiniteQuery({
    queryKey: ["home-feed"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("ads")
        .select("id,title,category,original_price,offer_price,discount_percent,image_url,location,plan")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { rows: (data ?? []) as AdRow[], next: data && data.length === PAGE_SIZE ? (pageParam as number) + 1 : null };
    },
    getNextPageParam: (last) => last.next,
  });

  const feedRows = useMemo(() => feed.data?.pages.flatMap((p) => p.rows) ?? [], [feed.data]);

  // Intersection observer for infinite scroll
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) {
          feed.fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [feed]);

  const tabs = ["All", ...CATEGORIES];

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* ===================== HERO ===================== */}
      <section className="relative h-screen w-full overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster={HERO_POSTER}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.5em] text-white/70">A curated marketplace</p>
          <h1 className="font-display text-5xl font-light leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-[88px]">
            The season's most<br />talked-about offers.
          </h1>
          <p className="mt-8 max-w-xl text-base text-white/80 sm:text-lg">
            Editorial deals from the brands shaping how Bangladesh shops, eats, travels and lives.
          </p>
          <Link
            to="/browse"
            className="mt-10 inline-flex items-center gap-3 border border-white px-10 py-4 text-xs font-medium uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black"
          >
            Discover offers
          </Link>
        </div>
      </section>

      {/* ===================== EDITORIAL VIDEO CAROUSEL ===================== */}
      <EditorialCarousel />

      {/* ===================== INTEREST EDIT (Women / Men) ===================== */}
      <InterestEdit />

      {/* ===================== CATEGORY TOGGLE + GRID ===================== */}
      <section className="bg-white">
        <div className="flex justify-center px-4 pb-8 pt-20">
          <div className="flex max-w-full gap-2 overflow-x-auto scrollbar-none">
            {tabs.map((t) => {
              const active = activeCategory === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveCategory(t)}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] transition ${
                    active
                      ? "bg-black text-white"
                      : "border border-border text-foreground/70 hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {(shelf ?? Array.from({ length: 8 })).map((ad, i) => (
            <AdTile key={(ad as AdRow)?.id ?? `s-${i}`} ad={ad as AdRow | undefined} />
          ))}
        </div>
        <div className="h-24 md:h-32" />
      </section>

      {/* ===================== SPLIT FEATURE ===================== */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="relative aspect-[3/4] md:aspect-auto md:min-h-[720px]">
          <img
            src={FEATURE_LIFESTYLE}
            alt="Featured editorial collection"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex items-center justify-center bg-[#f7f5f1] px-8 py-24 md:px-16">
          <div className="flex w-full max-w-md flex-col items-center text-center">
            <div className="aspect-square w-56 overflow-hidden bg-white sm:w-64">
              <img src={FEATURE_PRODUCT} alt="The Atelier collection" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <p className="mt-12 text-[10px] font-medium uppercase tracking-[0.4em] text-foreground/60">The Atelier Collection</p>
            <h2 className="mt-5 font-display text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl">
              Quietly bold,<br />distinctly yours.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-foreground/70">
              A featured spotlight from a brand we love this month — handpicked offers worth your attention.
            </p>
            <Link
              to="/browse"
              className="mt-10 inline-flex items-center gap-2 border border-black px-10 py-4 text-xs font-medium uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
            >
              Shop now <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== MORE TO LOVE ===================== */}
      <section className="bg-white px-4 py-24 sm:px-6">
        <div className="mb-16 text-center">
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.4em] text-foreground/60">An endless feed</p>
          <h2 className="font-display text-4xl font-light tracking-tight sm:text-5xl md:text-6xl">More to love</h2>
        </div>

        <div className="grid grid-cols-2 gap-1 sm:gap-1.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {feedRows.map((ad) => (
            <FeedTile key={ad.id} ad={ad} />
          ))}
          {(feed.isFetching || feed.isFetchingNextPage) &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`sk-${i}`} className="aspect-[3/4] animate-pulse bg-muted" />
            ))}
        </div>

        <div ref={sentinel} className="h-10" />

        {!feed.hasNextPage && feedRows.length > 0 && (
          <p className="mt-12 text-center text-xs uppercase tracking-[0.3em] text-foreground/50">You're all caught up</p>
        )}
        {!feed.isFetching && feedRows.length === 0 && (
          <p className="mt-12 text-center text-sm text-foreground/60">No offers live yet — check back soon.</p>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function InterestEdit() {
  const [audience, setAudience] = useState<"Women" | "Men">("Women");

  const { data: items, isLoading } = useQuery({
    queryKey: ["interest-edit", audience],
    queryFn: async () => {
      const keywords =
        audience === "Women"
          ? ["women", "woman", "her", "ladies", "female", "girl", "dress", "skirt", "heel"]
          : ["men", "man", "him", "male", "guy", "gentleman", "suit", "beard"];
      const orFilter = keywords.map((k) => `title.ilike.%${k}%,description.ilike.%${k}%`).join(",");
      const { data, error } = await supabase
        .from("ads")
        .select("id,title,category,original_price,offer_price,discount_percent,image_url,location,plan")
        .eq("status", "approved")
        .or(orFilter)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      // Fallback: if no matches, return latest approved
      if (!data || data.length === 0) {
        const { data: fb } = await supabase
          .from("ads")
          .select("id,title,category,original_price,offer_price,discount_percent,image_url,location,plan")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(4);
        return (fb ?? []) as AdRow[];
      }
      return data as AdRow[];
    },
  });

  return (
    <section className="bg-white pt-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="font-display text-lg font-light leading-relaxed text-foreground sm:text-xl">
          Lightness and pure textures shape the essence of the season in a new
          curated edit, with an online exclusive selection.
        </p>
        <div className="mt-10 flex items-center justify-center gap-10">
          {(["Women", "Men"] as const).map((a) => {
            const active = audience === a;
            return (
              <button
                key={a}
                onClick={() => setAudience(a)}
                className={`relative pb-2 text-sm font-medium tracking-wide transition ${
                  active ? "text-foreground" : "text-foreground/50 hover:text-foreground"
                }`}
              >
                {a}
                {active && <span className="absolute inset-x-0 -bottom-px h-px bg-foreground" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-14 grid grid-cols-2 lg:grid-cols-4">
        {(isLoading ? Array.from({ length: 4 }) : items ?? []).map((ad, i) => (
          <InterestTile key={(ad as AdRow)?.id ?? `ie-${i}`} ad={ad as AdRow | undefined} />
        ))}
      </div>
    </section>
  );
}

function InterestTile({ ad }: { ad?: AdRow }) {
  if (!ad) {
    return (
      <div className="block">
        <div className="aspect-[3/4] animate-pulse bg-muted" />
        <div className="px-6 py-6 text-center">
          <div className="mx-auto h-3 w-32 animate-pulse bg-muted" />
        </div>
      </div>
    );
  }
  return (
    <Link to="/ad/$id" params={{ id: ad.id }} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {ad.image_url ? (
          <img
            src={ad.image_url}
            alt={ad.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-foreground/5 to-foreground/10 text-foreground/40">
            <span className="font-display text-2xl">AYNA</span>
          </div>
        )}
      </div>
      <div className="px-6 py-6 text-center">
        <h3 className="line-clamp-1 text-sm font-medium tracking-tight text-foreground">{ad.title}</h3>
        <p className="mt-1 text-xs text-foreground/60">{formatBDT(ad.offer_price)}</p>
      </div>
    </Link>
  );
}

function EditorialCarousel() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const total = EDITORIAL_SLIDES.length;

  useEffect(() => {
    if (!playing) return;
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / SLIDE_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        setIndex((i) => (i + 1) % total);
      }
    }, 50);
    return () => clearInterval(tick);
  }, [index, playing, total]);

  const go = (next: number) => {
    setIndex(((next % total) + total) % total);
    setProgress(0);
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {EDITORIAL_SLIDES.map((s, i) => (
        <div
          key={s.title}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            poster={s.poster}
          >
            <source src={s.video} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/20" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-32 text-center text-white">
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.4em] text-white/80">
          {EDITORIAL_SLIDES[index].kicker}
        </p>
        <h2 className="font-display text-5xl font-light leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          {EDITORIAL_SLIDES[index].title}
        </h2>
        <Link
          to={EDITORIAL_SLIDES[index].href}
          className="mt-8 inline-block border-b border-white pb-1 text-xs font-medium uppercase tracking-[0.35em] text-white transition hover:opacity-70"
        >
          {EDITORIAL_SLIDES[index].cta}
        </Link>
      </div>

      {/* Bottom control bar */}
      <div className="absolute inset-x-0 bottom-8 z-20 flex items-center justify-center gap-4 px-6">
        <div className="flex flex-1 max-w-xl items-center gap-3">
          {EDITORIAL_SLIDES.map((_, i) => {
            const fill = i < index ? 1 : i === index ? progress : 0;
            return (
              <button
                key={i}
                onClick={() => go(i)}
                className="group relative h-px flex-1 bg-white/30"
                aria-label={`Slide ${i + 1}`}
              >
                <span
                  className="absolute inset-y-0 left-0 bg-white transition-[width] duration-100 ease-linear"
                  style={{ width: `${fill * 100}%` }}
                />
              </button>
            );
          })}
          <button
            onClick={() => go(index + 1)}
            className="ml-2 text-white/80 transition hover:text-white"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="absolute right-6 text-white/80 transition hover:text-white"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={() => go(index - 1)}
          className="absolute left-6 text-white/80 transition hover:text-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

function AdTile({ ad }: { ad?: AdRow }) {
  if (!ad) return <div className="aspect-square animate-pulse bg-muted" />;
  const discount =
    ad.discount_percent ??
    (ad.original_price && ad.original_price > ad.offer_price
      ? Math.round(((ad.original_price - ad.offer_price) / ad.original_price) * 100)
      : null);
  return (
    <Link
      to="/ad/$id"
      params={{ id: ad.id }}
      className="group relative block aspect-square overflow-hidden bg-muted"
    >
      {ad.image_url ? (
        <img
          src={ad.image_url}
          alt={ad.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-foreground/5 to-foreground/10 text-foreground/40">
          <span className="font-display text-2xl">AYNA</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 translate-y-2 p-5 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">{ad.category}</p>
        <h3 className="mt-1 line-clamp-2 font-display text-lg">{ad.title}</h3>
        <p className="mt-1 text-sm">{formatBDT(ad.offer_price)}</p>
      </div>
      {discount !== null && discount > 0 && (
        <span className="absolute left-3 top-3 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
          −{discount}%
        </span>
      )}
    </Link>
  );
}

function FeedTile({ ad }: { ad: AdRow }) {
  const discount =
    ad.discount_percent ??
    (ad.original_price && ad.original_price > ad.offer_price
      ? Math.round(((ad.original_price - ad.offer_price) / ad.original_price) * 100)
      : null);
  return (
    <Link
      to="/ad/$id"
      params={{ id: ad.id }}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {ad.image_url ? (
          <img
            src={ad.image_url}
            alt={ad.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-foreground/5 to-foreground/10 text-foreground/40">
            <span className="font-display">AYNA</span>
          </div>
        )}
        {discount !== null && discount > 0 && (
          <span className="absolute left-2 top-2 bg-black px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            −{discount}%
          </span>
        )}
      </div>
      <div className="px-1 py-2">
        <h3 className="line-clamp-1 text-xs font-medium tracking-tight text-foreground">{ad.title}</h3>
        <p className="mt-0.5 text-xs text-foreground/70">{formatBDT(ad.offer_price)}</p>
      </div>
    </Link>
  );
}
