import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/advertiser/activity")({
  head: () => ({ meta: [{ title: "Activity — AYNA" }] }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-10 text-center">
          <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Coming soon</div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Activity</h1>
          <p className="mt-3 text-muted-foreground">Recent impressions, clicks and campaign events. Rolling out in Phase 3.</p>
          <Button asChild className="mt-8"><Link to="/dashboard">Back to my ads</Link></Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
});
