import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin — AYNA" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: role } = await supabase
        .from("user_roles").select("role").eq("user_id", data.session.user.id).eq("role", "admin").maybeSingle();
      if (role) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    if (error) { setLoading(false); return toast.error(error.message); }
    const { data: role } = await supabase
      .from("user_roles").select("role").eq("user_id", data.user!.id).eq("role", "admin").maybeSingle();
    if (!role) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error("This account isn't an admin.");
      return;
    }
    setLoading(false);
    navigate({ to: "/admin" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-6 text-ink-foreground">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-ink-foreground/70 hover:text-ink-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Admin sign in</h1>
            <p className="text-xs text-ink-foreground/60">Restricted access</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="email" className="text-ink-foreground/80">Email</Label>
            <Input id="email" name="email" type="email" required className="border-white/10 bg-white/5 text-ink-foreground" />
          </div>
          <div>
            <Label htmlFor="password" className="text-ink-foreground/80">Password</Label>
            <Input id="password" name="password" type="password" required className="border-white/10 bg-white/5 text-ink-foreground" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">Sign in as admin</Button>
        </form>
      </div>
    </div>
  );
}
