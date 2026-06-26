import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "ayna_welcome_seen";

export function WelcomeModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      if (localStorage.getItem(STORAGE_KEY)) return;
      // Don't show to already signed-in users
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        localStorage.setItem(STORAGE_KEY, "1");
        return;
      }
      // Small delay so the homepage paints first
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    })();
    return () => { cancelled = true; };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const goSignup = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
    navigate({ to: "/auth", search: { tab: "signup", onboarding: "1" } as any });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="max-w-md overflow-hidden p-0 border-none">
        <div className="relative">
          <button
            onClick={dismiss}
            className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/80 text-foreground/70 backdrop-blur hover:bg-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative h-44 overflow-hidden bg-gradient-to-br from-rose-100 via-amber-50 to-sky-100">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80"
              alt=""
              className="h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-5 flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4" />
              <p className="text-[10px] font-medium uppercase tracking-[0.3em]">Welcome to AYNA</p>
            </div>
          </div>
          <div className="px-7 pb-7 pt-6 text-center">
            <h2 className="font-display text-2xl font-light leading-tight tracking-tight sm:text-3xl">
              Get the season's best<br />offers, personalized.
            </h2>
            <p className="mt-3 text-sm text-foreground/70">
              Create a free account to save favorites, follow categories you love, and unlock full deal details.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={goSignup} className="h-12 w-full text-sm uppercase tracking-[0.2em]">
                Create free account
              </Button>
              <button
                onClick={dismiss}
                className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/60 hover:text-foreground"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
