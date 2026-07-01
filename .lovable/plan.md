# AYNA — 3 user types rollout

Phased across 4 turns. Each phase ships working and testable.

## Phase 1 — Foundation (this turn)

**Data**
- `profiles.account_type` enum: `end_user` | `advertiser` | `admin`. Default `end_user`. Backfill: existing profiles → `end_user`.
- `profiles.username` (unique, nullable), plus a `profile_completion` computed helper (SQL view or client calc — I'll do client calc to keep it simple).

**Sign In (`/auth`)**
- New first step: pick role card — End User / Customer (Advertiser). No Admin option here.
- Admin login lives at hidden `/admin/login` (not linked anywhere). Same email/password; rejects non-admins.
- After sign-up, `account_type` is set from the selected card; existing users keep `end_user`.
- Advertiser signup routes to onboarding for business basics; End User routes to interest onboarding (already exists).

**Navigation (`site-header`)** — swaps by `account_type`:
- End User: Product (was Browse), How It Works, About, Contact, Sign In / account menu
- Advertiser: Market Trends, Pricing, How It Works, About, Post Ads, Become an Advertiser, Activity
- Admin: Current Status, Approvals, Financial Management
- Guest (not signed in): End User nav + Sign In

**Routing**
- `/browse` stays but is exposed as **Product** in nav (rename label only — URL unchanged so existing links keep working).
- New empty stubs so nav links resolve: `/advertiser/trends`, `/advertiser/activity`, `/become-advertiser`, `/admin/status`, `/admin/approvals`, `/admin/finance`, `/admin/login`. Stubs render a "coming in Phase 3/4" placeholder so the app builds and menus work.
- Existing `/dashboard` becomes Advertiser-only. End Users going to `/dashboard` land on a new End User dashboard (`/me`) instead.

## Phase 2 — End User profile + completion meter
Rich profile fields (photo, gender, birthday, country/city, contact, education, work, interests, brands, shopping prefs, notification prefs), tabbed profile editor, % completion widget, favorites/recently-viewed already exist and get surfaced.

## Phase 3 — Advertiser analytics
Counter columns on `ads`: `view_count`, `click_count`, `save_count`, `like_count`, `dislike_count`. RPCs to increment. Ad card wires view/click/like/dislike; dashboard shows CTR + per-ad table. Market Trends aggregates across the advertiser's ads.

## Phase 4 — Admin panel upgrade
Current Status (ads-by-category counts), Approvals (already exists → moves under new nav), Financial Management (payments/refunds summary + tables).

## Technical notes

- Migration adds enum + column + backfill in one shot, plus grants unchanged (column-only add).
- `useAccountType(userId)` hook alongside `useIsAdmin` reads `profiles.account_type`; header renders the correct nav from it.
- Role picker stored in `localStorage` as `ayna_intended_role` so it survives the Google OAuth round-trip; consumed on the returning session to set `account_type` if still `end_user`.
- Admin route `/admin/login` is unlinked; on success, if `has_role('admin')` fails, sign the user out and show an error.
- No changes to `client.ts`, `types.ts`, `.env` (auto-gen). Types regenerate after the migration.

Approve to ship Phase 1.
