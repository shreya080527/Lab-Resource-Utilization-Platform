
import * as React from "react";
import {
  Clock,
  CalendarCheck,
  Boxes,
  Wrench,
  Check,
  X,
  RefreshCw,
  ArrowRight,
  Inbox,
  CalendarClock,
  CalendarRange,
  Gauge,
  Microscope,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "@/store/router";
import { useAsync } from "@/hooks/use-async";
import { bookingApi } from "@/lib/api/bookingApi";
import { equipmentApi } from "@/lib/api/equipmentApi";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeletons";

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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
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
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
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
// Pending-request row
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
            {booking.equipment.equipmentName}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Requested by{" "}
            <span className="font-medium text-foreground/90">
              {booking.user.username}
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
// Main page
// ---------------------------------------------------------------------------

export default function ManagerDashboard() {
  const user = useAuthStore((s) => s.user);

  // All bookings system-wide via GET /api/bookings/all (#25, LAB_MANAGER only).
  const bookingsAsync = useAsync(() => bookingApi.allBookings(), []);
  const equipmentAsync = useAsync(() => equipmentApi.getAllEquipment(), []);
  const myEquipAsync = useAsync(() => equipmentApi.getMyEquipment(), []);

  const [busyRow, setBusyRow] = React.useState<
    { id: number; action: "accept" | "reject" } | null
  >(null);

  const refetchAll = React.useCallback(() => {
    bookingsAsync.refetch();
    equipmentAsync.refetch();
    myEquipAsync.refetch();
  }, [bookingsAsync, equipmentAsync, myEquipAsync]);

  const handleAccept = async (booking: Booking) => {
    setBusyRow({ id: booking.id, action: "accept" });
    try {
      await bookingApi.accept(booking.id);
      toast.success("Booking accepted");
      refetchAll();
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
      refetchAll();
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

  // Derive counts defensively even while other asyncs load.
  const bookings = bookingsAsync.data ?? [];
  const pendingBookings = bookings
    .filter((b) => b.status === "PENDING")
    .sort(
      (a, b) =>
        parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime(),
    );
  const pendingCount = pendingBookings.length;
  const activeCount = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS",
  ).length;
  const totalEquip = equipmentAsync.data?.length ?? 0;
  const myEquip = myEquipAsync.data?.length ?? 0;

  const anyLoading =
    bookingsAsync.loading && !bookingsAsync.data && !bookingsAsync.error;

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
                (bookingsAsync.loading ||
                  equipmentAsync.loading ||
                  myEquipAsync.loading) &&
                  "animate-spin",
              )}
            />
            Refresh
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Pending requests"
          value={pendingCount}
          accent="bg-amber-500/12 text-amber-700 ring-amber-500/20 dark:text-amber-300"
        />
        <StatCard
          icon={CalendarCheck}
          label="Active bookings"
          value={activeCount}
          accent="bg-blue-500/12 text-blue-700 ring-blue-500/20 dark:text-blue-300"
        />
        <StatCard
          icon={Boxes}
          label="Total equipment"
          value={totalEquip}
          accent="bg-cyan-500/12 text-cyan-700 ring-cyan-500/20 dark:text-cyan-300"
        />
        <StatCard
          icon={Wrench}
          label="My equipment"
          value={myEquip}
          accent="bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
        />
      </div>

      {/* Pending requests inbox */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Pending requests
          </h2>
          <span className="text-xs text-muted-foreground">
            {pendingCount} awaiting review
          </span>
        </div>

        <Card className="gap-3 rounded-2xl p-4 shadow-soft">
          {anyLoading ? (
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
            accent="bg-blue-500/12 text-blue-700 ring-blue-500/20 dark:text-blue-300"
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

      {/* Inline error footers for equipment fetches (non-blocking) */}
      {equipmentAsync.error && (
        <p className="text-xs text-muted-foreground">
          Couldn’t load equipment stats: {equipmentAsync.error}
        </p>
      )}
      {myEquipAsync.error && (
        <p className="text-xs text-muted-foreground">
          Couldn’t load your equipment: {myEquipAsync.error}
        </p>
      )}

      {user && (
        <p className="sr-only" aria-live="polite">
          Signed in as {user.username} ({user.role}).
        </p>
      )}
    </div>
  );
}
