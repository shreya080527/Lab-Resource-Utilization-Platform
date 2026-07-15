
import * as React from "react";
import { FlaskConical, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuthLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Optional className for the frosted card body */
  className?: string;
}

/**
 * AuthLayout — Colorful split layout for unauthenticated pages.
 *
 * Left: vibrant gradient brand panel with the LabFlow logo and tagline.
 * Hidden on mobile, where a compact header takes its place above the form card.
 *
 * Right: a frosted glass card (rounded-2xl, shadow-soft) that vertically
 * centers `children` on the viewport and renders `title` / `subtitle` above
 * and `footer` below.
 */
export function AuthLayout({
  title,
  subtitle,
  footer,
  children,
  className,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background grid lg:grid-cols-[1.05fr_1fr] relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none lg:hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-violet-400/20 to-purple-600/20 blur-[80px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-400/15 to-blue-600/15 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* ─────────────────────────  Brand panel  ───────────────────────── */}
      <aside
        aria-hidden="true"
        className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 xl:p-16 text-white"
        style={{
          background:
            "linear-gradient(150deg, oklch(0.58 0.22 280) 0%, oklch(0.50 0.20 290) 50%, oklch(0.42 0.18 300) 100%)",
        }}
      >
        {/* Animated decorative orbs */}
        <div className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-gradient-to-br from-violet-400/30 to-purple-600/20 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 size-[500px] rounded-full bg-gradient-to-tr from-emerald-400/20 to-cyan-400/10 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="pointer-events-none absolute top-1/3 right-1/4 size-4 rounded-full bg-white/40 blur-sm animate-pulse" />
        <div className="pointer-events-none absolute bottom-1/4 left-1/3 size-6 rounded-full bg-amber-400/30 blur-sm animate-pulse" style={{ animationDelay: '0.5s' }} />

        {/* Logo + wordmark */}
        <div className="relative flex items-center gap-3 group cursor-pointer">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/30 shadow-lg group-hover:scale-105 transition-transform">
            <FlaskConical className="size-6" strokeWidth={2} />
          </div>
          <span className="text-2xl font-bold tracking-tight">LabFlow</span>
        </div>

        {/* Tagline */}
        <div className="relative max-w-md">
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight">
            University lab equipment, booked{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300">beautifully</span>.
          </h2>
          <p className="mt-4 text-white/80 text-base leading-relaxed">
            Reserve microscopes, sequencers, and centrifuges in seconds. Track
            utilization, manage waitlists, and keep your lab running smoothly.
          </p>
        </div>

        {/* Feature bullets with colorful icons */}
        <div className="relative rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 p-6 max-w-sm space-y-4 text-sm text-white/90 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="size-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
              <Sparkles className="size-4 text-white" />
            </span>
            <span>Conflict-aware booking with auto-waitlist</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="size-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-md">
              <Sparkles className="size-4 text-white" />
            </span>
            <span>Role-based access for researchers and managers</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="size-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Sparkles className="size-4 text-white" />
            </span>
            <span>Real-time utilization analytics</span>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────  Form panel  ───────────────────────── */}
      <div className="flex flex-col items-center justify-center min-h-screen p-6 sm:p-10 relative">
        {/* Mobile compact header */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
            <FlaskConical className="size-5" strokeWidth={2} />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground gradient-text">
            LabFlow
          </span>
        </div>

        <div
          className={cn(
            "w-full max-w-md rounded-2xl shadow-xl border border-border/40 p-7 sm:p-9 bg-gradient-to-br from-card to-violet-50/30 dark:to-violet-950/10 transition-all duration-300",
            className,
          )}
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          ) : null}

          <div className="mt-6">{children}</div>

          {footer ? (
            <div className="mt-6 pt-5 border-t border-border/40 text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
