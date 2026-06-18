import { Link } from "@tanstack/react-router";
import { MapPin, Tag } from "lucide-react";
import { formatBDT } from "@/lib/plans";

export interface AdCardData {
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

export function AdCard({ ad }: { ad: AdCardData }) {
  const discount =
    ad.discount_percent ??
    (ad.original_price && ad.original_price > ad.offer_price
      ? Math.round(((ad.original_price - ad.offer_price) / ad.original_price) * 100)
      : null);

  const featured = ad.plan === "monthly" || ad.plan === "yearly";

  return (
    <Link
      to="/ad/$id"
      params={{ id: ad.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:shadow-pop hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {ad.image_url ? (
          <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/30 to-primary/20 text-muted-foreground">
            <Tag className="h-10 w-10" />
          </div>
        )}
        {discount !== null && discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-pop">
            −{discount}% OFF
          </span>
        )}
        {featured && (
          <span className="absolute right-3 top-3 deal-chip">★ Featured</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{ad.category}</p>
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-tight">{ad.title}</h3>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="font-display text-2xl font-bold text-primary">{formatBDT(ad.offer_price)}</p>
            {ad.original_price && ad.original_price > ad.offer_price && (
              <p className="text-sm text-muted-foreground line-through">{formatBDT(ad.original_price)}</p>
            )}
          </div>
          {ad.location && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {ad.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
