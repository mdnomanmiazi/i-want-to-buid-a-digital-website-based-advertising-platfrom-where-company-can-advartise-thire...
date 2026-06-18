import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-ink text-ink-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Flame className="h-5 w-5" /></span>
            <span className="font-display text-xl font-bold">AYNA</span>
          </div>
          <p className="mt-3 text-sm text-ink-foreground/70 max-w-xs">
            Bangladesh's vibrant deal marketplace. Where brands meet bargain-hungry shoppers.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-foreground/60">For brands</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/pricing" className="hover:text-primary">Pricing</Link></li>
            <li><Link to="/dashboard/new-ad" className="hover:text-primary">Post an offer</Link></li>
            <li><Link to="/how-it-works" className="hover:text-primary">How it works</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-foreground/60">For shoppers</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/browse" className="hover:text-primary">Browse offers</Link></li>
            <li><Link to="/browse" className="hover:text-primary">Categories</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-foreground/60">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-foreground/60 sm:flex-row">
          <p>© {new Date().getFullYear()} AYNA. All rights reserved.</p>
          <p>Made with care in Dhaka 🇧🇩</p>
        </div>
      </div>
    </footer>
  );
}
