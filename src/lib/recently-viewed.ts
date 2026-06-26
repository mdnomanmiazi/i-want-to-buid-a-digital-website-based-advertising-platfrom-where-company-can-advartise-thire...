const KEY = "ayna_recent_ads";
const MAX = 20;

export function pushRecentAd(id: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    const next = [id, ...arr.filter((x) => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* noop */ }
}

export function getRecentAds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}
