import * as React from "react";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  Clock,
  FlaskConical,
  Layers,
  Lock,
  Microscope,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "@/store/router";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// LabFlow · public landing page
// Apple-inspired: spacious, frosted glass, soft shadows, restrained palette.
// All CTAs route through the in-app hash router (navigate("/login" | "/register")).
// ---------------------------------------------------------------------------

type IconType = React.ComponentType<{ className?: string }>;

type Feature = {
  icon: IconType;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: Microscope,
    title: "Equipment catalog & search",
    description:
      "One searchable catalog of every shared instrument — with specs, location, and live availability at a glance.",
  },
  {
    icon: Layers,
    title: "Conflict-aware booking",
    description:
      "Double-booking is impossible. Auto-waitlist handles clashes and promotes the next researcher automatically.",
  },
  {
    icon: CalendarDays,
    title: "Shared calendar",
    description:
      "A single calendar across every piece of equipment — see your lab's week at a glance and plan around it.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description:
      "Six roles, from Researcher to System Admin — each with exactly the right level of access, enforced everywhere.",
  },
  {
    icon: Check,
    title: "Accept / reject workflow",
    description:
      "Lab managers review each request with one click. Researchers are notified the instant a decision is made.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Utilization analytics",
    description:
      "Clear charts reveal which equipment is over- or under-used — so procurement and budgets land right.",
  },
];

type RoleInfo = {
  name: string;
  icon: IconType;
  fullExperience: boolean;
  blurb: string;
};

const ROLES: RoleInfo[] = [
  {
    name: "Researcher",
    icon: FlaskConical,
    fullExperience: true,
    blurb: "Book equipment, track sessions, manage waitlists.",
  },
  {
    name: "Lab Technician",
    icon: Microscope,
    fullExperience: false,
    blurb: "Browse the catalog and check availability.",
  },
  {
    name: "Lab Manager",
    icon: ShieldCheck,
    fullExperience: true,
    blurb: "Approve bookings, manage equipment, view analytics.",
  },
  {
    name: "Department Head",
    icon: Users,
    fullExperience: false,
    blurb: "Oversee utilization across the department.",
  },
  {
    name: "Institution Admin",
    icon: Layers,
    fullExperience: false,
    blurb: "Provision accounts and departments at scale.",
  },
  {
    name: "System Admin",
    icon: Lock,
    fullExperience: false,
    blurb: "Keep the platform healthy, secure, and up to date.",
  },
];

const STATS: string[] = [
  "6 roles supported",
  "7 booking states",
  "Real-time calendar",
  "Utilization analytics",
];

const LIFECYCLE: string[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

const PREVIEW_STATS: { label: string; value: string }[] = [
  { label: "Bookings this week", value: "128" },
  { label: "Active equipment", value: "42" },
  { label: "Avg utilization", value: "78%" },
];

const CHART_BARS: number[] = [40, 62, 50, 80, 58, 95, 70];

export default function LandingPage() {
  const { navigate } = useRouter();
  const goSignIn = () => navigate("/login");
  const goRegister = () => navigate("/register");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav onSignIn={goSignIn} onRegister={goRegister} />

      <main>
        <Hero onGetStarted={goRegister} onSignIn={goSignIn} />
        <StatStrip />
        <Features />
        <Roles />
        <BookingLifecycle />
        <FinalCTA onGetStarted={goRegister} />
      </main>

      <Footer onSignIn={goSignIn} onRegister={goRegister} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top navigation — frosted, sticky, with logo + auth CTAs
// ---------------------------------------------------------------------------
function TopNav({
  onSignIn,
  onRegister,
}: {
  onSignIn: () => void;
  onRegister: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-soft"
            aria-hidden="true"
          >
            <FlaskConical className="size-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight">LabFlow</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">
              Equipment Booking
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignIn}
            className="hidden sm:inline-flex rounded-xl"
          >
            Sign in
          </Button>
          <Button
            size="sm"
            onClick={onRegister}
            className="rounded-xl"
          >
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Hero — headline, CTAs, and a frosted app-preview panel
// ---------------------------------------------------------------------------
function Hero({
  onGetStarted,
  onSignIn,
}: {
  onGetStarted: () => void;
  onSignIn: () => void;
}) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs text-muted-foreground shadow-soft">
          <Sparkles className="size-3.5 text-primary" />
          <span>Built for university research labs</span>
        </div>

        <h1 className="mt-6 text-balance text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] max-w-3xl">
          Bring order to your shared lab equipment.
        </h1>

        <p className="mt-5 text-balance text-lg sm:text-xl text-muted-foreground max-w-2xl">
          LabFlow is the calm, conflict-free booking system for university
          research labs — one calendar for every instrument, with role-based
          access and utilization analytics built in.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Button
            size="lg"
            onClick={onGetStarted}
            className="rounded-xl h-11 px-6 has-[>svg]:px-6 text-base"
          >
            Get started — it&apos;s free
            <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onSignIn}
            className="rounded-xl h-11 px-6 text-base"
          >
            Sign in
          </Button>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          <span>No credit card · University-grade access control</span>
        </div>
      </div>

      <AppPreview />
    </section>
  );
}

// ---------------------------------------------------------------------------
// App preview — abstract mini-dashboard mock inside a frosted panel
// ---------------------------------------------------------------------------
function AppPreview() {
  return (
    <div className="mt-14 sm:mt-20 rounded-[2rem] glass shadow-float overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[64px_1fr]">
        {/* Sidebar rail (hidden on mobile) */}
        <div className="hidden sm:flex flex-col items-center gap-5 py-5 border-r border-border/40 bg-muted/30">
          <div
            className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-soft"
            aria-hidden="true"
          >
            <FlaskConical className="size-4" />
          </div>
          <div className="flex flex-col gap-3.5">
            <div className="size-2.5 rounded-full bg-primary" />
            <div className="size-2.5 rounded-full bg-muted-foreground/35" />
            <div className="size-2.5 rounded-full bg-muted-foreground/35" />
            <div className="size-2.5 rounded-full bg-muted-foreground/35" />
          </div>
          <div className="mt-auto size-8 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Main preview content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-3">
            {PREVIEW_STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-muted/30 border border-border/40 p-3"
              >
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-1 text-xl font-semibold tracking-tight">
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Calendar + bar chart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Calendar */}
            <div className="rounded-xl bg-muted/30 border border-border/40 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Calendar
                </div>
                <CalendarDays className="size-3.5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 21 }).map((_, i) => {
                  const isWeekend = i % 7 === 0 || i % 7 === 6;
                  const isBooked = i === 8 || i === 14;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "aspect-square rounded-[3px]",
                        isBooked
                          ? "bg-primary"
                          : isWeekend
                            ? "bg-muted-foreground/10"
                            : "bg-muted-foreground/30",
                      )}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bar chart */}
            <div className="rounded-xl bg-muted/30 border border-border/40 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Utilization
                </div>
                <ChartNoAxesCombined className="size-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-1.5 h-20">
                {CHART_BARS.map((h, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-t-[3px]",
                      i === 3 || i === 5 ? "bg-primary" : "bg-primary/35",
                    )}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat strip — understated row of muted facts
// ---------------------------------------------------------------------------
function StatStrip() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row items-stretch rounded-2xl glass shadow-soft overflow-hidden">
        {STATS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "flex-1 px-4 py-5 sm:px-6 text-center",
              i > 0 && "border-t sm:border-t-0 sm:border-l border-border/60",
            )}
          >
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {s}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Features — 6 cards in a responsive 1→2→3 grid
// ---------------------------------------------------------------------------
function Features() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">
          Features
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
          Everything you need to run a shared lab
        </h2>
        <p className="mt-3 text-muted-foreground">
          Six core capabilities that replace the spreadsheet-and-email chaos
          with one calm, predictable system.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl glass shadow-soft p-6 hover:-translate-y-0.5 hover:shadow-float transition-all duration-200"
          >
            <div
              className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"
              aria-hidden="true"
            >
              <f.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold tracking-tight">
              {f.title}
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Roles — 6 chips inside a frosted container, with experience badges
// ---------------------------------------------------------------------------
function Roles() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">
          Roles
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
          Built for every role in the lab
        </h2>
        <p className="mt-3 text-muted-foreground">
          Two roles get the full booking experience; the other four get a
          clean, browse-ready view of the catalog.
        </p>
      </div>

      <div className="rounded-3xl glass shadow-soft p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl bg-muted/30 border border-border/40 p-5 flex flex-col gap-3 transition-all duration-200 hover:bg-muted/50 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div
                  className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"
                  aria-hidden="true"
                >
                  <r.icon className="size-5" />
                </div>
                {r.fullExperience ? (
                  <Badge>Full experience</Badge>
                ) : (
                  <Badge variant="secondary">Browse-ready</Badge>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">
                  {r.name}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {r.blurb}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Booking lifecycle — horizontal status flow + waitlist branch
// ---------------------------------------------------------------------------
function BookingLifecycle() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="rounded-3xl glass shadow-soft p-6 sm:p-10">
        <div className="text-center mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            Lifecycle
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
            A predictable, enforced booking lifecycle
          </h2>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Main flow */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {LIFECYCLE.map((s, i) => (
              <React.Fragment key={s}>
                <div className="rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-foreground tracking-wide shadow-soft">
                  {s}
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <ArrowRight
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Waitlist branch */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted/60 px-3 py-1 font-medium text-foreground/80 tracking-wide">
              WAITLIST
            </span>
            <Clock className="size-3.5" aria-hidden="true" />
            <span>auto-promotes on cancellation</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Final CTA — primary band with inverted button
// ---------------------------------------------------------------------------
function FinalCTA({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="rounded-3xl bg-primary text-primary-foreground shadow-float p-10 sm:p-14 text-center">
        <h2 className="text-balance text-3xl sm:text-4xl font-semibold tracking-tight">
          Ready to bring order to your lab?
        </h2>
        <p className="mt-4 text-primary-foreground/80 text-lg max-w-xl mx-auto">
          Get started in minutes. No credit card, no procurement nightmare —
          just calmer shared equipment for everyone in your department.
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={onGetStarted}
            className="rounded-xl h-11 px-6 has-[>svg]:px-6 text-base bg-background text-foreground hover:bg-background/90"
          >
            Get started
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer — minimal, muted, with logo + small auth links
// ---------------------------------------------------------------------------
function Footer({
  onSignIn,
  onRegister,
}: {
  onSignIn: () => void;
  onRegister: () => void;
}) {
  return (
    <footer className="border-t border-border/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"
            aria-hidden="true"
          >
            <FlaskConical className="size-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold">LabFlow</span>
            <span className="mt-0.5 text-xs text-muted-foreground">
              Calmer shared labs.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignIn}
            className="rounded-xl"
          >
            Sign in
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegister}
            className="rounded-xl"
          >
            Register
          </Button>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            © 2026 LabFlow
          </span>
        </div>
      </div>
    </footer>
  );
}
