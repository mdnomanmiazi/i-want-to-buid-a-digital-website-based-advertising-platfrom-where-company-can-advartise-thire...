import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [data, setData] = useState({ company_name: "", phone: "", website: "", logo_url: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setData({ company_name: data.company_name ?? "", phone: data.phone ?? "", website: data.website ?? "", logo_url: data.logo_url ?? "" });
    });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update(data).eq("id", user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-10 max-w-2xl">
        <h1 className="font-display text-4xl font-bold">Company profile</h1>
        <p className="text-muted-foreground">This information appears on your offer pages.</p>
        <form onSubmit={save} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div><Label>Company name</Label><Input value={data.company_name} onChange={(e) => setData({ ...data, company_name: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} /></div>
          <div><Label>Website</Label><Input value={data.website} onChange={(e) => setData({ ...data, website: e.target.value })} type="url" placeholder="https://..." /></div>
          <div><Label>Logo URL</Label><Input value={data.logo_url} onChange={(e) => setData({ ...data, logo_url: e.target.value })} type="url" /></div>
          <Button type="submit" disabled={loading}>Save changes</Button>
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}
