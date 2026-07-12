
import * as React from "react";
import {
  Clock,
  CheckCircle2,
  Loader,
  Hourglass,
  Plus,
  RefreshCw,
  Microscope,
  CalendarClock,
  History,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "@/store/router";
import { useAsync } from "@/hooks/use-async";
import { bookingApi } from "@/lib/api/bookingApi";
import {
  ACTION_SUCCESS,
  bookingStatusConfig,
} from "@/lib/status";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ActionButtonGroup } from "@/components/shared/ActionButtonGroup";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ListSkeleton } from "@/components/shared/Skeletons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import type {
  Booking,
  BookingAction,
  BookingAudit,
  BookingStatus,
  User,
  WaitlistEntry,
} from "@/types";

// ---------------------------------------------------------------------------
// Filter chips map → predicate
// ---------------------------------------------------------------------------

type FilterKey =
  | "all"
  | "pending"
  | "confirmed"
  | "in_progress"
  | "past"
  | "cancelled";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_progress", label: "In Progress" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

function matches(filter: FilterKey, b: Booking): boolean {
  const s = b.status as BookingStatus;
  switch (filter) {
    case "all":
      return true;
    case "pending":
      return s === "PENDING";
    case "confirmed":
      return s === "CONFIRMED";
    case "in_progress":
      return s === "IN_PROGRESS";
    case "past":
      return s === "COMPLETED";
    case "cancelled":
      return s === "CANCELLED" || s === "REJECTED";
  }
}

const EMPTY_COPY: Record<FilterKey, { title: string; description: string }> = {
  all: {
    title: "No bookings yet",
    description: "No upcoming bookings — browse equipment to book.",
  },
  pending: {
    title: "No pending bookings",
    description: "New booking requests awaiting manager approval will appear here.",
  },
  confirmed: {
    title: "No confirmed bookings",
    description: "Approved bookings will show up here once a manager accepts them.",
  },
  in_progress: {
    title: "No bookings in progress",
    description: "Active sessions you’ve started will appear here.",
  },
  past: {
    title: "No past bookings",
    description: "Completed bookings will be archived here.",
  },
  cancelled: {
    title: "No cancelled bookings",
    description: "Cancelled or rejected requests will appear here.",
  },
};

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
// Waitlist row
//   — backend-provided `position` field (NO client-side sorting). The
//     WaitlistEntry shape already carries position directly.
// ---------------------------------------------------------------------------

function WaitlistRow({ entry }: { entry: WaitlistEntry }) {
  const start = parseISO(entry.startTime);
  const end = parseISO(entry.endTime);
  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/12 text-orange-700 ring-1 ring-orange-500/20 dark:text-orange-300">
          <Microscope className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {entry.equipmentName}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5 text-orange-600/70 dark:text-orange-300/70" />
            <span className="text-foreground/90">
              {format(start, "EEE, dd MMM yyyy, HH:mm")}
              {" – "}
              {format(end, sameDay ? "HH:mm" : "EEE, dd MMM yyyy, HH:mm")}
            </span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 pl-12 sm:pl-0">
        <Badge variant="secondary" className="text-[10px]">
          Waitlisted
        </Badge>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/20">
          Position {entry.position}
        </span>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Booking row — reads FLATTENED booking shape directly.
// ---------------------------------------------------------------------------

function BookingRow({
  booking,
  currentUser,
  onAction,
  onViewEquipment,
  onAudit,
}: {
  booking: Booking;
  currentUser: User | null;
  onAction: (action: BookingAction, booking: Booking) => void;
  onViewEquipment: (id: number) => void;
  onAudit: (id: number) => void;
}) {
  const start = parseISO(booking.startTime);
  const end = parseISO(booking.endTime);
  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");

  return (
    <Card className="flex flex-col gap-3 rounded-2xl border-border/60 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="flex min-w-0 items-center gap-3 text-left"
          onClick={() => onViewEquipment(booking.equipmentId)}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
            <Microscope className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {booking.equipmentName}
              </p>
              {booking.recurrencePattern && (
                <Badge
                  variant="secondary"
                  className="text-[10px]"
                  title={`Recurs ${booking.recurrencePattern.toLowerCase()}`}
                >
                  ↻ {booking.recurrencePattern}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Booking #{booking.id}
            </p>
            {booking.parentBookingId !== null && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                Part of series #{booking.parentBookingId}
              </p>
            )}
          </div>
        </button>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarClock className="size-4 shrink-0 text-primary/70" />
          <span className="text-foreground">
            {format(start, "EEE, dd MMM yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4 shrink-0 text-primary/70" />
          <span className="text-foreground">
            {format(start, "HH:mm")} –{" "}
            {format(end, sameDay ? "HH:mm" : "dd MMM HH:mm")}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
        <ActionButtonGroup
          booking={booking}
          currentUser={currentUser}
          onAction={(a) => onAction(a, booking)}
          size="sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAudit(booking.id)}
          className="gap-1.5"
        >
          <History className="size-3.5" />
          View Audit Trail
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Audit timeline (rendered inside the dialog)
// ---------------------------------------------------------------------------

function AuditTimeline({ events }: { events: BookingAudit[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        No audit events.
      </div>
    );
  }

  return (
    <ol className="flex flex-col">
      {events.map((ev, idx) => {
        const fromCfg = ev.fromStatus
          ? bookingStatusConfig(ev.fromStatus)
          : null;
        const toCfg = bookingStatusConfig(ev.toStatus);
        return (
          <li
            key={ev.id}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            {idx < events.length - 1 && (
              <div
                aria-hidden
                className="absolute left-[7px] top-3 bottom-0 w-px bg-border/60"
              />
            )}
            <div className="z-10 mt-1.5 size-3.5 shrink-0 rounded-full bg-primary ring-2 ring-background" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {ev.action}
                </Badge>
                <div className="flex items-center gap-1.5">
                  {fromCfg ? (
                    <StatusBadge status={ev.fromStatus as string} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <StatusBadge status={ev.toStatus as string} />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                by <span className="font-medium text-foreground/90">{ev.performedByUsername}</span>
                {" · "}
                {format(parseISO(ev.createdAt), "dd MMM yyyy, HH:mm")}
              </p>
              {ev.notes && (
                <p className="mt-1 text-xs text-foreground/80">{ev.notes}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ResearcherDashboard() {
  const user = useAuthStore((s) => s.user);
  const { navigate } = useRouter();

  const { data, loading, error, refetch } = useAsync(
    async () => {
      // Defensive: useAsync's effect runs even on the first render before the
      // auth-aware guard below kicks in. Bail cleanly until `user` resolves.
      if (!user) throw { message: "Not authenticated" };
      return bookingApi.myDashboard(user.id);
    },
    [user?.id],
  );

  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [actionPending, setActionPending] =
    React.useState<BookingAction | null>(null);

  // Audit dialog open state — the selected booking's id (or null when closed).
  const [selectedBookingId, setSelectedBookingId] = React.useState<
    number | null
  >(null);

  // Fetch audit events for the selected booking. Returning [] when null
  // keeps the hook's contract simple (no conditional hook calls).
  const {
    data: auditEvents,
    loading: auditLoading,
    error: auditError,
  } = useAsync<BookingAudit[]>(
    async () => {
      if (selectedBookingId === null) return [];
      return bookingApi.bookingAudit(selectedBookingId);
    },
    [selectedBookingId],
  );

  // Guard while auth hydrates
  if (!user) {
    return <ListSkeleton count={3} />;
  }

  const bookings = data?.bookings ?? [];
  // Waitlist entries come WITH a `position` field from the backend — use it
  // directly. Do NOT re-sort client-side.
  const waitlistEntries: WaitlistEntry[] = data?.waitlistEntries ?? [];

  const counts = {
    PENDING: 0,
    CONFIRMED: 0,
    IN_PROGRESS: 0,
  } as Record<BookingStatus, number>;
  for (const b of bookings) {
    counts[b.status] = (counts[b.status] ?? 0) + 1;
  }

  const filtered = bookings.filter((b) => matches(filter, b));

  const handleAction = async (action: BookingAction, booking: Booking) => {
    setActionPending(action);
    try {
      if (action === "start") await bookingApi.start(booking.id);
      else if (action === "cancel") await bookingApi.cancel(booking.id);
      else if (action === "complete") await bookingApi.complete(booking.id);
      else {
        // accept/reject/noShow are manager-only — ActionButtonGroup hides
        // them for researchers, so we never expect to receive them here.
        return;
      }
      toast.success(ACTION_SUCCESS[action]);
      refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Something went wrong";
      toast.error(msg);
    } finally {
      setActionPending(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Dashboard"
        description="Your bookings and waitlist at a glance."
        actions={
          <Button onClick={() => navigate("/equipment")} className="gap-1.5">
            <Plus className="size-4" />
            Book equipment
          </Button>
        }
      />

      {/* Loading */}
      {loading ? (
        <ListSkeleton count={4} />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn’t load your dashboard.
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
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={Clock}
              label="Pending"
              value={counts.PENDING ?? 0}
              accent="bg-amber-500/12 text-amber-700 ring-amber-500/20 dark:text-amber-300"
            />
            <StatCard
              icon={CheckCircle2}
              label="Confirmed"
              value={counts.CONFIRMED ?? 0}
              accent="bg-blue-500/12 text-blue-700 ring-blue-500/20 dark:text-blue-300"
            />
            <StatCard
              icon={Loader}
              label="In Progress"
              value={counts.IN_PROGRESS ?? 0}
              accent="bg-cyan-500/12 text-cyan-700 ring-cyan-500/20 dark:text-cyan-300"
            />
            <StatCard
              icon={Hourglass}
              label="Waitlist"
              value={waitlistEntries.length}
              accent="bg-orange-500/12 text-orange-700 ring-orange-500/20 dark:text-orange-300"
            />
          </div>

          {/* Bookings */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Bookings
              </h2>
              <Tabs
                value={filter}
                onValueChange={(v) => setFilter(v as FilterKey)}
              >
                <TabsList className="h-9 w-full overflow-x-auto no-scrollbar sm:w-auto">
                  {FILTERS.map((f) => (
                    <TabsTrigger
                      key={f.key}
                      value={f.key}
                      className="whitespace-nowrap"
                    >
                      {f.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={
                  filter === "all"
                    ? Microscope
                    : filter === "past"
                      ? CheckCircle2
                      : Hourglass
                }
                title={EMPTY_COPY[filter].title}
                description={EMPTY_COPY[filter].description}
                action={
                  filter === "all" ? (
                    <Button
                      size="sm"
                      onClick={() => navigate("/equipment")}
                      className="gap-1.5"
                    >
                      <Plus className="size-4" />
                      Browse equipment
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    currentUser={user}
                    onAction={(action, booking) =>
                      handleAction(action as BookingAction, booking)
                    }
                    onViewEquipment={(id) => navigate(`/equipment/${id}`)}
                    onAudit={(id) => setSelectedBookingId(id)}
                  />
                ))}
              </div>
            )}
            {actionPending && (
              <p className="sr-only" aria-live="polite">
                Processing {actionPending}…
              </p>
            )}
          </section>

          {/* Waitlist */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Waitlist
            </h2>
            <Card className="gap-3 rounded-2xl p-4 shadow-soft">
              {waitlistEntries.length === 0 ? (
                <EmptyState
                  icon={Hourglass}
                  title="No waitlisted requests"
                  description="When a slot is busy, conflicting requests are auto-added to the waitlist here."
                  className="border-0 bg-transparent py-8"
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {waitlistEntries.map((e) => (
                    <WaitlistRow key={e.id} entry={e} />
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </>
      )}

      {/* Audit trail dialog */}
      <Dialog
        open={selectedBookingId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBookingId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="size-4 text-primary/70" />
              Audit trail
              {selectedBookingId !== null && (
                <span className="text-sm font-normal text-muted-foreground">
                  · Booking #{selectedBookingId}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Lifecycle history of this booking, newest first.
            </DialogDescription>
          </DialogHeader>

          {selectedBookingId !== null && auditLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-border/60 p-3"
                >
                  <Skeleton className="size-3.5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : selectedBookingId !== null && auditError ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              Couldn’t load audit events. {auditError}
            </div>
          ) : (
            <AuditTimeline events={auditEvents ?? []} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
