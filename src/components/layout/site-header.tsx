import { Link, useNavigate } from "@tanstack/react-router";
import { Flame, LogOut, Menu, Plus, ShieldCheck, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-pop">
            <Flame className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">AYNA</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/browse" className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/30">
            Browse offers
          </Link>
          <Link to="/pricing" className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/30">
            Pricing
          </Link>
          <Link to="/how-it-works" className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/30">
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {!loading && user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard/new-ad"><Plus className="h-4 w-4" /> Post an offer</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Account">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
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
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
