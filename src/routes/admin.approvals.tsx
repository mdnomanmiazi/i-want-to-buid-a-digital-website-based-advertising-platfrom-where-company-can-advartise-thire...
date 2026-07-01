import { createFileRoute, redirect } from "@tanstack/react-router";

// Approvals lives at /admin (the existing admin panel).
export const Route = createFileRoute("/admin/approvals")({
  beforeLoad: () => { throw redirect({ to: "/admin" }); },
});
