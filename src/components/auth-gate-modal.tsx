import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  redirectTo: string;
  onClose: () => void;
}

const REDIRECT_KEY = "ayna_redirect_after_auth";

export function AuthGateModal({ open, redirectTo, onClose }: Props) {
  const navigate = useNavigate();

  const go = (tab: "signin" | "signup") => {
    if (typeof window !== "undefined") {
      localStorage.setItem(REDIRECT_KEY, redirectTo);
    }
    navigate({ to: "/auth", search: { tab, redirect: redirectTo } as any });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-none">
        <div className="px-7 pt-8 pb-7 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black text-white">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-light tracking-tight">
            A free account unlocks this offer
          </h2>
          <p className="mt-2 text-sm text-foreground/70">
            See full details, contact the seller, and save it to your favorites — it only takes a moment.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => go("signup")} className="h-11 w-full text-xs uppercase tracking-[0.25em]">
              Sign up free
            </Button>
            <Button onClick={() => go("signin")} variant="outline" className="h-11 w-full text-xs uppercase tracking-[0.25em]">
              Login
            </Button>
            <button
              onClick={onClose}
              className="mt-1 text-xs font-medium uppercase tracking-[0.25em] text-foreground/60 hover:text-foreground"
            >
              Back
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { REDIRECT_KEY };
