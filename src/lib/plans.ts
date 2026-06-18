export type PlanId = "single" | "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // BDT
  description: string;
  durationDays: number | null; // null = one-off listing 30 days
  perks: string[];
  highlight?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  single: {
    id: "single",
    name: "Single Ad",
    price: 500,
    description: "One-time listing, live for 30 days",
    durationDays: 30,
    perks: ["1 active ad", "30 days visibility", "Standard placement"],
  },
  monthly: {
    id: "monthly",
    name: "Monthly",
    price: 2000,
    description: "Unlimited renewals every month",
    durationDays: 30,
    perks: ["Priority placement", "30 days visibility", "Featured badge", "Email support"],
    highlight: true,
  },
  yearly: {
    id: "yearly",
    name: "Yearly",
    price: 20000,
    description: "Best value for established brands",
    durationDays: 365,
    perks: ["Top placement", "365 days visibility", "Featured badge", "Priority support", "Save 17%"],
  },
};

export const PLAN_LIST = Object.values(PLANS);

export const formatBDT = (n: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n);

export const CATEGORIES = [
  "Food & Restaurant",
  "Fashion & Apparel",
  "Electronics",
  "Beauty & Wellness",
  "Travel & Hotels",
  "Education",
  "Real Estate",
  "Automotive",
  "Services",
  "Other",
];
