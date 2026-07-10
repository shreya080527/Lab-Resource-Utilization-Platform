
import * as React from "react";
import {
  Telescope,
  Search,
  CalendarDays,
  ShieldCheck,
  ArrowRight,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "@/store/router";
import { ROLE_PERMISSIONS } from "@/config/rolePermissions";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// BrowsePlaceholder
// ---------------------------------------------------------------------------
// Read-only landing page for the four "browse-only" roles
// (LAB_TECHNICIAN, DEPARTMENT_HEAD, INSTITUTION_ADMIN, SYSTEM_ADMIN).
//
// These roles don't have a full dashboard yet — this page greets them warmly,
// explains the read-only nature of their access, and routes them into the
// equipment catalog (the one feature they CAN use today). Everything is
// purely informational: no booking, no management, no mutations.
// ---------------------------------------------------------------------------

const PREVIEW_CARDS: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
}[] = [
  {
    icon: Search,
    label: "Browse catalog",
    hint: "Explore microscopes, sequencers, and more.",
  },
  {
    icon: CalendarDays,
    label: "View availability",
    hint: "See what's booked and what's free this week.",
  },
  {
    icon: ShieldCheck,
    label: "Secure & tracked",
    hint: "Reads are logged and auditable.",
  },
];

export default function BrowsePlaceholder() {
  const user = useAuthStore((s) => s.user);
  const { navigate } = useRouter();

  const username = user?.username ?? "there";
  const roleLabel = user ? ROLE_PERMISSIONS[user.role].label : "Browse only";

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center gap-8 py-10 sm:py-14 lg:py-16">
      {/* ─────────────────────────  Hero card  ───────────────────────── */}
      <section
        className={cn(
          "relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border/60",
          "glass-strong shadow-float",
          "px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12",
        )}
      >
        {/* Subtle calm-blue gradient accent — top wash + corner glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/12 via-primary/4 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex flex-col items-center text-center">
          {/* Large gradient icon tile */}
          <div
            className={cn(
              "flex size-16 items-center justify-center rounded-2xl",
              "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
              "ring-1 ring-primary/20 shadow-soft",
              "sm:size-20",
            )}
          >
            <Telescope className="size-8 sm:size-10" strokeWidth={2} />
          </div>

          {/* Heading + role chip */}
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            Welcome, {username}
          </h1>
          <span
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-full",
              "bg-primary/10 px-3 py-1 text-xs font-medium text-primary",
              "ring-1 ring-inset ring-primary/15",
            )}
          >
            <span className="size-1.5 rounded-full bg-primary/70" />
            {roleLabel}
          </span>

          {/* Body copy */}
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            Your role&apos;s full dashboard is coming soon. In the meantime, you
            can browse the equipment catalog read-only.
          </p>

          {/* Primary CTA */}
          <Button
            size="lg"
            className="mt-7 h-11 gap-2 rounded-xl px-6 text-sm font-medium"
            onClick={() => navigate("/equipment")}
          >
            Browse equipment
            <ArrowRight className="size-4" />
          </Button>

          {/* Muted note */}
          <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            Booking and management actions aren&apos;t available for your role
            yet.
          </p>
        </div>
      </section>

      {/* ─────────────────────  3-up preview row  ───────────────────── */}
      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {PREVIEW_CARDS.map(({ icon: Icon, label, hint }) => (
          <div
            key={label}
            aria-hidden="true"
            className={cn(
              "flex flex-col items-center gap-2.5 rounded-2xl border border-border/60",
              "bg-muted/30 px-4 py-5 text-center",
            )}
          >
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                "bg-primary/10 text-primary ring-1 ring-primary/10",
              )}
            >
              <Icon className="size-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {hint}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
