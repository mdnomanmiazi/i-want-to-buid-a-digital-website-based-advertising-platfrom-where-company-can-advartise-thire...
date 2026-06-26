import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { REDIRECT_KEY } from "@/components/auth-gate-modal";

type AuthSearch = { tab?: "signin" | "signup"; redirect?: string; onboarding?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    tab: s.tab === "signup" || s.tab === "signin" ? s.tab : undefined,
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    onboarding: typeof s.onboarding === "string" ? s.onboarding : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — AYNA" },
      { name: "description", content: "Sign in or create your AYNA account to post offers." },
    ],
  }),
  component: AuthPage,
});

function getSavedRedirect(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const v = localStorage.getItem(REDIRECT_KEY);
  return v && v.startsWith("/") ? v : undefined;
}

function clearSavedRedirect() {
  if (typeof window !== "undefined") localStorage.removeItem(REDIRECT_KEY);
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [loading, setLoading] = useState(false);

  const redirectAfter = search.redirect ?? getSavedRedirect();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        clearSavedRedirect();
        navigate({ to: redirectAfter ?? "/dashboard" });
      }
    });
  }, [navigate, redirectAfter]);

  const afterSignIn = () => {
    clearSavedRedirect();
    navigate({ to: redirectAfter ?? "/dashboard" });
  };

  const afterSignUp = () => {
    clearSavedRedirect();
    navigate({
      to: "/onboarding/interests",
      search: { redirect: redirectAfter ?? "/" } as any,
    });
  };

  const onSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    afterSignIn();
  };

  const onSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: { company_name: String(fd.get("company") || "") },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — let's personalize your feed");
    afterSignUp();
  };

  const onGoogle = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) { setLoading(false); toast.error(res.error.message); return; }
    if (res.redirected) return;
    // Google sign-in could be either new or returning user — send to onboarding
    // (the page will skip itself if interests are already set if you wish; for simplicity always show)
    afterSignUp();
  };

  const defaultTab = search.tab ?? "signin";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-ink p-12 text-ink-foreground">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Flame className="h-5 w-5" /></span>
          <span className="font-display text-xl font-bold">AYNA</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            Discover deals made for <span className="text-primary">you</span>.
          </h2>
          <p className="mt-4 text-ink-foreground/70">Save favorites, follow categories, and unlock full offers — free.</p>
        </div>
        <p className="text-xs text-ink-foreground/50">© {new Date().getFullYear()} AYNA</p>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Flame className="h-5 w-5" /></span>
              <span className="font-display text-xl font-bold">AYNA</span>
            </Link>
          </div>

          <h1 className="font-display text-3xl font-bold">
            {defaultTab === "signup" ? "Create your free account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {defaultTab === "signup"
              ? "Save favorites and unlock full offer details."
              : "Sign in to manage your offers and saved deals."}
          </p>

          <Button onClick={onGoogle} disabled={loading} variant="outline" className="mt-6 w-full">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" /></div>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={onSignIn} className="space-y-4 pt-4">
                <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
                <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required /></div>
                <Button type="submit" className="w-full" disabled={loading}>Sign in</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={onSignUp} className="space-y-4 pt-4">
                <div><Label htmlFor="company">Your name or brand</Label><Input id="company" name="company" required /></div>
                <div><Label htmlFor="email2">Email</Label><Input id="email2" name="email" type="email" required /></div>
                <div><Label htmlFor="password2">Password</Label><Input id="password2" name="password" type="password" minLength={8} required /></div>
                <Button type="submit" className="w-full" disabled={loading}>Create free account</Button>
              </form>
            </TabsContent>
          </Tabs>

          {redirectAfter && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              You'll return to the offer you were viewing after signing in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
