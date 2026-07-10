
import * as React from "react";
import { FlaskConical } from "lucide-react";
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
 * AuthLayout — Apple-inspired split layout for unauthenticated pages.
 *
 * Left: calm-blue gradient brand panel with the LabFlow logo, tagline, and a
 * small "Demo accounts" card. Hidden on mobile, where a compact header takes
 * its place above the form card.
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
    <div className="min-h-screen w-full bg-background grid lg:grid-cols-[1.05fr_1fr]">
      {/* ─────────────────────────  Brand panel  ───────────────────────── */}
      <aside
        aria-hidden="true"
        className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 xl:p-16 text-white"
        style={{
          background:
            "linear-gradient(150deg, oklch(0.58 0.19 255) 0%, oklch(0.46 0.18 258) 55%, oklch(0.36 0.15 262) 100%)",
        }}
      >
        {/* decorative soft glows */}
        <div className="pointer-events-none absolute -top-32 -right-24 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 size-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-1/4 size-3 rounded-full bg-white/30 blur-sm" />

        {/* Logo + wordmark */}
        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
            <FlaskConical className="size-6" strokeWidth={2} />
          </div>
          <span className="text-xl font-semibold tracking-tight">LabFlow</span>
        </div>

        {/* Tagline */}
        <div className="relative max-w-md">
          <h2 className="text-3xl xl:text-4xl font-semibold leading-tight tracking-tight">
            University lab equipment, booked beautifully.
          </h2>
          <p className="mt-4 text-white/75 text-base leading-relaxed">
            Reserve microscopes, sequencers, and centrifuges in seconds. Track
            utilization, manage waitlists, and keep your lab running smoothly.
          </p>
        </div>

        {/* Demo accounts card */}
        <div className="relative rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 max-w-sm">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/70 mb-3">
            <span className="size-1.5 rounded-full bg-emerald-300" />
            Demo accounts
          </div>
          <div className="space-y-3 text-sm">
            <DemoAccount
              role="Researcher"
              email="researcher@demo.com"
              password="password"
              otp="123456"
            />
            <DemoAccount
              role="Lab Manager"
              email="manager@demo.com"
              password="password"
              otp="123456"
            />
          </div>
        </div>
      </aside>

      {/* ─────────────────────────  Form panel  ───────────────────────── */}
      <div className="flex flex-col items-center justify-center min-h-screen p-6 sm:p-10">
        {/* Mobile compact header */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FlaskConical className="size-5" strokeWidth={2} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            LabFlow
          </span>
        </div>

        <div
          className={cn(
            "w-full max-w-md glass-strong rounded-2xl shadow-soft border border-border/60 p-7 sm:p-9",
            "transition-all duration-200",
            className,
          )}
        >
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          ) : null}

          <div className="mt-6">{children}</div>

          {footer ? (
            <div className="mt-6 pt-5 border-t border-border/60 text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DemoAccount({
  role,
  email,
  password,
  otp,
}: {
  role: string;
  email: string;
  password: string;
  otp: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-white/60 text-xs">{role}</div>
        <div className="font-medium text-white">{email}</div>
      </div>
      <div className="text-right text-white/70 text-xs leading-relaxed">
        <div>
          pw <span className="font-mono text-white/90">{password}</span>
        </div>
        <div>
          otp <span className="font-mono text-white/90">{otp}</span>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
