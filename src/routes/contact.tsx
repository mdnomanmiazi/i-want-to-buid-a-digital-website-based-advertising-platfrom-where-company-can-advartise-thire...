import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — AYNA" },
      { name: "description", content: "Get in touch with the AYNA team for partnerships, support or sales." },
    ],
  }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-16">
        <h1 className="font-display text-5xl font-bold">Get in touch</h1>
        <p className="mt-3 text-muted-foreground">Questions, partnerships, or custom plans — we'd love to hear from you.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 max-w-2xl">
          <a href="mailto:hello@ayna.bd" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Email</p>
              <p className="text-sm text-muted-foreground">hello@ayna.bd</p>
            </div>
          </a>
          <a href="https://wa.me/" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">WhatsApp</p>
              <p className="text-sm text-muted-foreground">Chat with sales</p>
            </div>
          </a>
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
});
