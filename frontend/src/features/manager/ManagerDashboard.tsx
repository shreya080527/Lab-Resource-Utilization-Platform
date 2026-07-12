
import * as React from "react";
import {
  Clock,
  CalendarCheck,
  Boxes,
  Check,
  X,
  RefreshCw,
  ArrowRight,
  Inbox,
  CalendarClock,
  CalendarRange,
  Gauge,
  Microscope,
  ListChecks,
  Wrench,
  Ban,
  Archive,
  Activity,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "@/store/router";
import { useAsync } from "@/hooks/use-async";
import { bookingApi, dashboardApi } from "@/lib/api/bookingApi";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton, CardSkeleton } from "@/components/shared/Skeletons";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { Booking } from "@/types";

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  ring,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  accent: string;
  ring?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl ring-1",
            accent,
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold leading-none tracking-tight text-foreground">
            {value === undefined ? "–" : value}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </>
  );
  const cls = cn(
    "rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-all duration-200",
    ring,
    onClick &&
      "cursor-pointer hover:-translate-y-0.5 hover:shadow-float hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(cls, "text-left w-full")}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

// ---------------------------------------------------------------------------
// Quick-link card
// ---------------------------------------------------------------------------

function QuickLink({
  icon: Icon,
  title,
  description,
  href,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  accent: string;
}) {
  const { navigate } = useRouter();
  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-soft transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-float hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      )}
    >
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1",
          accent,
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {description}
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Pending-request row (uses FLATTENED booking shape)
// ---------------------------------------------------------------------------

function PendingRow({
  booking,
  busy,
  onAccept,
  onReject,
}: {
  booking: Booking;
  busy: "accept" | "reject" | null;
  onAccept: () => void;
  onReject: () => void;
}) {
  const start = parseISO(booking.startTime);
  const end = parseISO(booking.endTime);
  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
          <Microscope className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {booking.equipmentName}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Requested by{" "}
            <span className="font-medium text-foreground/90">
              {booking.username}
            </span>
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5 text-amber-600/70 dark:text-amber-300/70" />
            <span className="text-foreground/90">
              {format(start, "EEE, dd MMM yyyy, HH:mm")}
              {" – "}
              {format(end, sameDay ? "HH:mm" : "EEE, dd MMM yyyy, HH:mm")}
            </span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
        <Button
          size="sm"
          className="gap-1.5 rounded-lg"
          onClick={onAccept}
          disabled={busy !== null}
        >
          {busy === "accept" ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onReject}
          disabled={busy !== null}
        >
          {busy === "reject" ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <X className="size-3.5" />
          )}
          Reject
        </Button>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Real-time usage widget
// ---------------------------------------------------------------------------

function RealtimeUsageWidget() {
  // Auto-refresh every 60s via setInterval + refetch.
  const rtAsync = useAsync(() => bookingApi.realtimeUsage(), []);
  const { data, loading, error, refetch } = rtAsync;

  React.useEffect(() => {
    const id = window.setInterval(() => {
      refetch();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [refetch]);

  const rt = data;
  const inUse = rt?.inUseEquipment ?? [];

  return (
    <Card className="gap-3 rounded-2xl p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
            <Activity className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Real-time usage
            </h2>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              Live · auto-refreshes every 60s
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          className="gap-1.5"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stat row */}
      {loading && !rt && !error ? (
        <ListSkeleton count={1} />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 px-6 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn’t load real-time usage.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : !rt ? null : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat
              label="In Use"
              value={rt.inUseCount}
              accent="text-cyan-700 dark:text-cyan-300"
              dot="bg-cyan-500"
            />
            <MiniStat
              label="Available"
              value={rt.availableCount}
              accent="text-emerald-700 dark:text-emerald-300"
              dot="bg-emerald-500"
            />
            <MiniStat
              label="Booked"
              value={rt.bookedCount}
              accent="text-amber-700 dark:text-amber-300"
              dot="bg-amber-500"
            />
            <MiniStat
              label="Maintenance"
              value={rt.maintenanceCount}
              accent="text-purple-700 dark:text-purple-300"
              dot="bg-purple-500"
            />
          </div>

          {inUse.length === 0 ? (
            <EmptyState
              icon={Radio}
              title="No equipment currently in use."
              description="Active sessions will appear here as soon as researchers start their bookings."
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Equipment</th>
                    <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">
                      User
                    </th>
                    <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
                      Window
                    </th>
                    <th className="px-3 py-2 text-right font-medium">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {inUse.map((row) => {
                    const start = parseISO(row.startTime);
                    const end = parseISO(row.endTime);
                    return (
                      <tr key={row.bookingId} className="align-top">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Microscope className="size-3.5 shrink-0 text-primary/70" />
                            <span className="truncate font-medium text-foreground">
                              {row.equipmentName}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate pl-5 text-xs text-muted-foreground sm:hidden">
                            {row.user.username}
                          </p>
                        </td>
                        <td className="hidden px-3 py-2 text-foreground sm:table-cell">
                          {row.user.username}
                        </td>
                        <td className="hidden px-3 py-2 text-xs text-muted-foreground md:table-cell">
                          {format(start, "HH:mm")} – {format(end, "HH:mm")}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              row.remainingMinutes <= 15
                                ? "bg-rose-500/12 text-rose-700 dark:text-rose-300"
                                : row.remainingMinutes <= 60
                                  ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                                  : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
                            )}
                          >
                            <Clock className="size-3" />
                            {row.remainingMinutes}m left
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function MiniStat({
  label,
  value,
  accent,
  dot,
}: {
  label: string;
  value: number;
  accent: string;
  dot: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className={cn("size-1.5 rounded-full", dot)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn("mt-1 text-xl font-semibold", accent)}>{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ManagerDashboard() {
  const user = useAuthStore((s) => s.user);
  const { navigate } = useRouter();

  // Server-side stats via /api/dashboard/stats — no client-side computation.
  const statsAsync = useAsync(() => dashboardApi.stats(), []);
  // All bookings (used for the pending-requests inbox).
  const bookingsAsync = useAsync(() => bookingApi.allBookings(), []);

  const [busyRow, setBusyRow] = React.useState<
    { id: number; action: "accept" | "reject" } | null
  >(null);

  const refetchAll = React.useCallback(() => {
    statsAsync.refetch();
    bookingsAsync.refetch();
  }, [statsAsync, bookingsAsync]);

  const handleAccept = async (booking: Booking) => {
    setBusyRow({ id: booking.id, action: "accept" });
    try {
      await bookingApi.accept(booking.id);
      toast.success("Booking accepted");
      bookingsAsync.refetch();
      statsAsync.refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusyRow(null);
    }
  };

  const handleReject = async (booking: Booking) => {
    setBusyRow({ id: booking.id, action: "reject" });
    try {
      await bookingApi.reject(booking.id);
      toast.success("Booking rejected");
      bookingsAsync.refetch();
      statsAsync.refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusyRow(null);
    }
  };

  // --- pending inbox derived from flattened bookings ---
  const bookings = bookingsAsync.data ?? [];
  const pendingBookings = React.useMemo(
    () =>
      bookings
        .filter((b) => b.status === "PENDING")
        .sort(
          (a, b) =>
            parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime(),
        ),
    [bookings],
  );

  const stats = statsAsync.data;
  const statsLoading = statsAsync.loading && !stats && !statsAsync.error;
  const statsError = statsAsync.error;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manager Dashboard"
        description="Oversee equipment, bookings, and utilization across your lab."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn(
                "size-3.5",
                (statsAsync.loading || bookingsAsync.loading) && "animate-spin",
              )}
            />
            Refresh
          </Button>
        }
      />

      {/* Stat cards — server-computed via dashboardApi.stats() */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : statsError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn’t load dashboard data.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{statsError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={statsAsync.refetch}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            icon={Boxes}
            label="Total equipment"
            value={stats?.totalEquipment}
            accent="bg-cyan-500/12 text-cyan-700 ring-cyan-500/20 dark:text-cyan-300"
          />
          <StatCard
            icon={Check}
            label="Available"
            value={stats?.availableCount}
            accent="bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
          />
          <StatCard
            icon={CalendarRange}
            label="Booked"
            value={stats?.bookedCount}
            accent="bg-amber-500/12 text-amber-700 ring-amber-500/20 dark:text-amber-300"
          />
          <StatCard
            icon={Wrench}
            label="Under maintenance"
            value={stats?.maintenanceCount}
            accent="bg-purple-500/12 text-purple-700 ring-purple-500/20 dark:text-purple-300"
          />
          <StatCard
            icon={Ban}
            label="Out of service"
            value={stats?.outOfServiceCount}
            accent="bg-zinc-500/12 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300"
          />
          <StatCard
            icon={Archive}
            label="Retired"
            value={stats?.retiredCount}
            accent="bg-rose-500/12 text-rose-700 ring-rose-500/20 dark:text-rose-300"
          />
          <StatCard
            icon={Clock}
            label="Pending approval"
            value={stats?.pendingApprovalCount}
            accent="bg-amber-500/12 text-amber-700 ring-amber-500/20 dark:text-amber-300"
            onClick={() => navigate("/manager/bookings")}
          />
          <StatCard
            icon={CalendarCheck}
            label="Active bookings"
            value={stats?.activeBookingsCount}
            accent="bg-cyan-500/12 text-cyan-700 ring-cyan-500/20 dark:text-cyan-300"
          />
          <StatCard
            icon={ListChecks}
            label="Waitlist"
            value={stats?.waitlistCount}
            accent="bg-purple-500/12 text-purple-700 ring-purple-500/20 dark:text-purple-300"
            onClick={() => navigate("/manager/waitlist")}
          />
          <StatCard
            icon={CalendarClock}
            label="Calibrations due (30d)"
            value={stats?.calibrationsDueIn30Days}
            accent="bg-amber-500/12 text-amber-700 ring-amber-500/20 dark:text-amber-300"
            ring="ring-2 ring-amber-500/40"
            onClick={() => navigate("/manager/calibrations")}
          />
        </div>
      )}

      {/* Real-time usage widget */}
      <RealtimeUsageWidget />

      {/* Pending requests inbox */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Pending requests
          </h2>
          <span className="text-xs text-muted-foreground">
            {pendingBookings.length} awaiting review
          </span>
        </div>

        <Card className="gap-3 rounded-2xl p-4 shadow-soft">
          {bookingsAsync.loading && !bookingsAsync.data && !bookingsAsync.error ? (
            <ListSkeleton count={3} />
          ) : bookingsAsync.error ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                Couldn’t load bookings.
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {bookingsAsync.error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={bookingsAsync.refetch}
                className="gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
            </div>
          ) : pendingBookings.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No pending requests"
              description="New booking requests awaiting your approval will appear here."
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {pendingBookings.map((b) => (
                <PendingRow
                  key={b.id}
                  booking={b}
                  busy={
                    busyRow && busyRow.id === b.id ? busyRow.action : null
                  }
                  onAccept={() => handleAccept(b)}
                  onReject={() => handleReject(b)}
                />
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Quick links */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Quick links
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <QuickLink
            icon={Wrench}
            title="Manage equipment"
            description="Add, edit, and track equipment status."
            href="/manager/equipment"
            accent="bg-primary/12 text-primary ring-primary/20"
          />
          <QuickLink
            icon={CalendarRange}
            title="All bookings"
            description="Review every booking across the lab."
            href="/manager/bookings"
            accent="bg-cyan-500/12 text-cyan-700 ring-cyan-500/20 dark:text-cyan-300"
          />
          <QuickLink
            icon={CalendarClock}
            title="Calendar"
            description="See bookings on a weekly calendar."
            href="/manager/calendar"
            accent="bg-cyan-500/12 text-cyan-700 ring-cyan-500/20 dark:text-cyan-300"
          />
          <QuickLink
            icon={Gauge}
            title="Utilization"
            description="Track equipment utilization over time."
            href="/manager/utilization"
            accent="bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
          />
        </div>
      </section>

      {user && (
        <p className="sr-only" aria-live="polite">
          Signed in as {user.username} ({user.role}).
        </p>
      )}
    </div>
  );
}
