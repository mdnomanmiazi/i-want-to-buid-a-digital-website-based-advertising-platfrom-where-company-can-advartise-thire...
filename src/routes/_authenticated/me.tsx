import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Store, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/me")({
  head: () => ({ meta: [{ title: "My Account — AYNA" }] }),
  component: MyAccount,
});

function MyAccount() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("user_favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => setFavCount(count ?? 0));
  }, [user]);

  const name = profile?.company_name || user?.email?.split("@")[0] || "You";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-12">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-background p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Hi, {name}</h1>
              <p className="text-sm text-muted-foreground">End User account</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Link to="/browse" className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="mt-4 font-display text-xl font-bold">Discover offers</h2>
            <p className="mt-1 text-sm text-muted-foreground">Personalized deals picked for you.</p>
          </Link>
          <div className="rounded-2xl border border-border bg-card p-6">
            <Heart className="h-6 w-6 text-primary" />
            <h2 className="mt-4 font-display text-xl font-bold">{favCount} saved</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your favorite ads live here.</p>
          </div>
          <Link to="/become-advertiser" className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg">
            <Store className="h-6 w-6 text-primary" />
            <h2 className="mt-4 font-display text-xl font-bold">Become an advertiser</h2>
            <p className="mt-1 text-sm text-muted-foreground">Post your own offers on AYNA.</p>
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">Rich profile (photo, interests, brands, shopping & notification preferences, completion meter) rolls out in Phase 2.</p>
          <Button asChild variant="outline" className="mt-4"><Link to="/onboarding/interests">Edit interests</Link></Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
