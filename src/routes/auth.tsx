import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, ShoppingBag, Store, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { REDIRECT_KEY } from "@/components/auth-gate-modal";

type Role = "end_user" | "advertiser";
type AuthSearch = { tab?: "signin" | "signup"; redirect?: string; role?: Role };

const INTENDED_ROLE_KEY = "ayna_intended_role";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    tab: s.tab === "signup" || s.tab === "signin" ? s.tab : undefined,
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    role: s.role === "end_user" || s.role === "advertiser" ? s.role : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — AYNA" },
      { name: "description", content: "Sign in or create your AYNA account." },
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

async function applyIntendedRole(userId: string) {
  if (typeof window === "undefined") return;
  const intended = localStorage.getItem(INTENDED_ROLE_KEY) as Role | null;
  if (!intended) return;
  localStorage.removeItem(INTENDED_ROLE_KEY);
  // Only upgrade if still on the default (end_user). Never demote.
  if (intended === "advertiser") {
    await supabase.from("profiles").update({ account_type: "advertiser" as any }).eq("id", userId).eq("account_type", "end_user" as any);
  }
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role | null>(search.role ?? null);

  const redirectAfter = search.redirect ?? getSavedRedirect();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        await applyIntendedRole(data.session.user.id);
        clearSavedRedirect();
        navigate({ to: redirectAfter ?? "/" });
      }
    });
  }, [navigate, redirectAfter]);

  const landingFor = (r: Role) => (r === "advertiser" ? "/dashboard" : "/me");

  const afterSignIn = async (userId: string) => {
    await applyIntendedRole(userId);
    clearSavedRedirect();
    navigate({ to: redirectAfter ?? landingFor(role ?? "end_user") });
  };

  const afterSignUp = () => {
    clearSavedRedirect();
    if (role === "advertiser") {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/onboarding/interests", search: { redirect: redirectAfter ?? "/" } as any });
    }
  };

  const onSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.user) await afterSignIn(data.user.id);
  };

  const onSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!role) return;
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          company_name: String(fd.get("company") || ""),
          account_type: role,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    afterSignUp();
  };

  const onGoogle = async () => {
    if (typeof window !== "undefined" && role) localStorage.setItem(INTENDED_ROLE_KEY, role);
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) { setLoading(false); toast.error(res.error.message); return; }
  };

  // Step 1: role picker
  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12">
          <Link to="/" className="mb-10 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Flame className="h-5 w-5" /></span>
            <span className="font-display text-xl font-bold tracking-[0.2em]">AYNA</span>
          </Link>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Choose your account type</h1>
          <p className="mt-3 text-center text-muted-foreground">Pick how you want to use AYNA. You can switch to advertiser later.</p>

          <div className="mt-12 grid w-full gap-6 sm:grid-cols-2">
            <button onClick={() => setRole("end_user")} className="group rounded-3xl border border-border bg-card p-8 text-left transition hover:-translate-y-1 hover:border-primary hover:shadow-xl">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold">End User</h2>
              <p className="mt-2 text-sm text-muted-foreground">Browse deals, save favorites, follow categories and get personalized offers.</p>
              <span className="mt-6 inline-block text-sm font-medium text-primary">Continue as End User →</span>
            </button>

            <button onClick={() => setRole("advertiser")} className="group rounded-3xl border border-border bg-card p-8 text-left transition hover:-translate-y-1 hover:border-primary hover:shadow-xl">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Store className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold">Customer (Advertiser)</h2>
              <p className="mt-2 text-sm text-muted-foreground">Post offers, manage campaigns and track performance across our audience.</p>
              <span className="mt-6 inline-block text-sm font-medium text-primary">Continue as Advertiser →</span>
            </button>
          </div>

          <p className="mt-10 text-xs text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => setRole("end_user")} className="underline underline-offset-2 hover:text-foreground">Sign in</button>
          </p>
        </div>
      </div>
    );
  }

  const defaultTab = search.tab ?? "signin";
  const isAdv = role === "advertiser";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-ink p-12 text-ink-foreground">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Flame className="h-5 w-5" /></span>
          <span className="font-display text-xl font-bold">AYNA</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            {isAdv ? <>Grow your reach with <span className="text-primary">AYNA</span>.</> : <>Discover deals made for <span className="text-primary">you</span>.</>}
          </h2>
          <p className="mt-4 text-ink-foreground/70">
            {isAdv ? "Post offers, run campaigns, and track performance in one dashboard." : "Save favorites, follow categories, and unlock full offers — free."}
          </p>
        </div>
        <p className="text-xs text-ink-foreground/50">© {new Date().getFullYear()} AYNA</p>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button onClick={() => setRole(null)} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Choose a different account type
          </button>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {isAdv ? <Store className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
            {isAdv ? "Customer (Advertiser)" : "End User"}
          </div>

          <h1 className="font-display text-3xl font-bold">
            {defaultTab === "signup" ? "Create your free account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {defaultTab === "signup"
              ? isAdv ? "Set up your business and start posting offers." : "Save favorites and unlock full offer details."
              : "Sign in to continue."}
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
                <div><Label htmlFor="company">{isAdv ? "Business name" : "Your name"}</Label><Input id="company" name="company" required /></div>
                <div><Label htmlFor="email2">Email</Label><Input id="email2" name="email" type="email" required /></div>
                <div><Label htmlFor="password2">Password</Label><Input id="password2" name="password" type="password" minLength={8} required /></div>
                <Button type="submit" className="w-full" disabled={loading}>Create free account</Button>
              </form>
            </TabsContent>
          </Tabs>

          {redirectAfter && (
            <p className="mt-4 text-center text-xs text-muted-foreground">You'll return to the offer you were viewing after signing in.</p>
          )}
        </div>
      </div>
    </div>
  );
}
