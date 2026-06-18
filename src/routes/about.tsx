import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — AYNA" },
      { name: "description", content: "AYNA is Bangladesh's deal marketplace connecting brands with bargain-hungry shoppers." },
      { property: "og:title", content: "About AYNA" },
      { property: "og:description", content: "Bangladesh's deal marketplace." },
    ],
  }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-16 prose prose-neutral max-w-3xl">
        <h1 className="font-display text-5xl font-bold">About AYNA</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          AYNA is a vibrant deal marketplace built in Bangladesh. We connect brands running great offers
          with shoppers actively looking for value. Simple, fast, and fair.
        </p>
        <p className="mt-4 text-muted-foreground">
          Companies post their offers on AYNA. We charge a small per-ad, monthly or yearly fee to keep the platform
          running and the listings high quality.
        </p>
      </div>
      <SiteFooter />
    </div>
  ),
});
