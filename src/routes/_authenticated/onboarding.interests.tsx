import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/plans";
import { toast } from "sonner";

type Search = { redirect?: string };

export const Route = createFileRoute("/_authenticated/onboarding/interests")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Pick your interests — AYNA" }] }),
  component: InterestsPage,
});

function InterestsPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/_authenticated/onboarding/interests" });
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("interests")
        .eq("id", u.user.id)
        .maybeSingle();
      if (p?.interests?.length) setSelected(p.interests as string[]);
    })();
  }, []);

  const toggle = (c: string) =>
    setSelected((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  const finish = async (skip = false) => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      const interests = skip ? [] : selected;
      const { error } = await supabase
        .from("profiles")
        .update({ interests })
        .eq("id", u.user.id);
      if (error) {
        // fallback: try upsert in case row doesn't exist
        await supabase.from("profiles").upsert({ id: u.user.id, interests });
      }
    }
    setSaving(false);
    if (!skip) toast.success("Your feed is now personalized");
    const dest = redirect && redirect.startsWith("/") ? redirect : "/";
    navigate({ to: dest });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50/40 to-rose-50/30">
      <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-foreground/70 backdrop-blur">
            <Sparkles className="h-3 w-3" /> Personalize your AYNA
          </div>
          <h1 className="mt-6 font-display text-4xl font-light leading-tight tracking-tight sm:text-5xl">
            What are you<br className="sm:hidden" /> shopping for?
          </h1>
          <p className="mt-3 text-sm text-foreground/70 sm:text-base">
            Pick a few categories you love. We'll surface offers worth your time.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2.5">
          {CATEGORIES.map((c) => {
            const active = selected.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className={`group inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-black/15 bg-white/70 text-foreground hover:border-black"
                }`}
              >
                {active && <Check className="h-3.5 w-3.5" />}
                {c}
              </button>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3">
          <Button
            onClick={() => finish(false)}
            disabled={saving || selected.length === 0}
            className="h-12 min-w-64 text-xs uppercase tracking-[0.25em]"
          >
            {selected.length === 0 ? "Select at least one" : `Continue · ${selected.length} picked`}
          </Button>
          <button
            onClick={() => finish(true)}
            disabled={saving}
            className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/60 hover:text-foreground"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
