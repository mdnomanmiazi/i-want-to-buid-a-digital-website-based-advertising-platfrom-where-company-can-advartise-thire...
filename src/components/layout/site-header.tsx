import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, Menu, Search, ShieldCheck, User as UserIcon, X } from "lucide-react";

import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { to: "/browse", label: "Browse" },
  { to: "/pricing", label: "Pricing" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate({ to: "/browse", search: query ? { q: query } as never : undefined });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-[1600px] grid-cols-3 items-center px-4 sm:px-6 lg:px-10">
        {/* LEFT — hamburger + search */}
        <div className="flex items-center gap-1">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/5"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] bg-white">
              <SheetHeader>
                <SheetTitle className="font-display text-2xl tracking-tight">AYNA</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col">
                {NAV_LINKS.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className="border-b border-border/60 py-4 font-display text-lg tracking-tight transition hover:text-primary"
                  >
                    {l.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="border-b border-border/60 py-4 font-display text-lg">My ads</Link>
                    <Link to="/dashboard/new-ad" onClick={() => setMenuOpen(false)} className="border-b border-border/60 py-4 font-display text-lg">Post an offer</Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="border-b border-border/60 py-4 font-display text-lg">Admin</Link>
                    )}
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setMenuOpen(false)} className="border-b border-border/60 py-4 font-display text-lg">Sign in</Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <button
                aria-label="Search"
                className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/5"
              >
                <Search className="h-5 w-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="top-24 max-w-2xl translate-y-0 border-0 bg-white p-0 shadow-2xl">
              <DialogHeader className="sr-only">
                <DialogTitle>Search offers</DialogTitle>
              </DialogHeader>
              <form onSubmit={submitSearch} className="flex items-center gap-3 px-6 py-5">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search offers, brands, categories…"
                  className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
                />
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* CENTER — logo */}
        <div className="flex items-center justify-center">
          <Link to="/" className="font-display text-2xl font-bold tracking-[0.25em]">
            AYNA
          </Link>
        </div>

        {/* RIGHT — contact + account */}
        <div className="flex items-center justify-end gap-1">
          <Link
            to="/contact"
            className="hidden rounded-full px-4 py-2 text-sm font-medium tracking-wide text-foreground/80 transition hover:text-foreground sm:inline-flex"
          >
            Contact Us
          </Link>

          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account"
                  className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/5"
                >
                  <UserIcon className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="truncate px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/dashboard">My ads</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dashboard/new-ad">Post an offer</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dashboard/profile">Profile</Link></DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><ShieldCheck className="h-4 w-4" /> Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/auth"
              aria-label="Sign in"
              className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/5"
            >
              <UserIcon className="h-5 w-5" />
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
