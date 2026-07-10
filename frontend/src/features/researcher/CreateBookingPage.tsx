
import * as React from "react";
import {
  ArrowLeft,
  Microscope,
  Loader2,
  TriangleAlert,
  CalendarClock,
  Clock,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  format,
  parseISO,
  isAfter,
  differenceInMinutes,
  isValid,
} from "date-fns";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "@/store/router";
import { useAsync } from "@/hooks/use-async";
import { equipmentApi } from "@/lib/api/equipmentApi";
import { bookingApi, isWaitlistMessage } from "@/lib/api/bookingApi";
import {
  bookingStatusConfig,
  equipmentStatusConfig,
  isBookable,
} from "@/lib/status";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CardSkeleton } from "@/components/shared/Skeletons";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Booking, Equipment } from "@/types";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Convert an ISO/string datetime-local value to a Date (or null if invalid). */
function toDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isValid(d) ? d : null;
}

/** Format a duration as e.g. "2 hours", "1 hour 30 minutes", "45 minutes". */
function formatDuration(minutes: number): string {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} minute${m === 1 ? "" : "s"}`;
  if (m === 0) return `${h} hour${h === 1 ? "" : "s"}`;
  return `${h} hour${h === 1 ? "" : "s"} ${m} minute${m === 1 ? "" : "s"}`;
}

/** Two half-open ranges [s1,e1) and [s2,e2) overlap if s1 < e2 && s2 < e1. */
function rangesOverlap(
  s1: Date,
  e1: Date,
  s2: Date,
  e2: Date,
): boolean {
  return s1.getTime() < e2.getTime() && s2.getTime() < e1.getTime();
}

const ACTIVE_STATUSES: Booking["status"][] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CreateBookingPage() {
  const user = useAuthStore((s) => s.user);
  const { query, navigate } = useRouter();
  const equipmentIdRaw = query.equipmentId;

  const equipmentId = React.useMemo(() => {
    if (!equipmentIdRaw) return null;
    const n = Number(equipmentIdRaw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [equipmentIdRaw]);

  // Redirect to /equipment if no valid id (run once).
  React.useEffect(() => {
    if (equipmentId === null) {
      navigate("/equipment", { replace: true });
    }
  }, [equipmentId, navigate]);

  // Fetch equipment list and find the one we need (no GET-by-id endpoint).
  const { data: equipmentList, loading, error } = useAsync(
    () => equipmentApi.getAllEquipment(),
    [],
  );

  const equipment: Equipment | undefined = React.useMemo(() => {
    if (!equipmentList || equipmentId === null) return undefined;
    return equipmentList.find((e) => e.id === equipmentId);
  }, [equipmentList, equipmentId]);

  // --- Form state ----------------------------------------------------------
  const [startValue, setStartValue] = React.useState("");
  const [endValue, setEndValue] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const start = toDate(startValue);
  const end = toDate(endValue);

  const dateError: string | null = React.useMemo(() => {
    if (!startValue || !endValue) return null;
    if (!start || !end) return "Please enter valid start and end times.";
    if (!isAfter(end, start)) return "End time must be after the start time.";
    return null;
  }, [startValue, endValue, start, end]);

  const durationMin = React.useMemo(() => {
    if (!start || !end || !isAfter(end, start)) return 0;
    return differenceInMinutes(end, start);
  }, [start, end]);

  const canSelectDates = !!equipment && isBookable(equipment.status);

  // --- Conflict detection (client-side heads-up) ---------------------------
  // The real backend's calendar endpoint is user-scoped (returns the current
  // user's OWN bookings). This heads-up flags overlaps with the user's own
  // active bookings on this equipment. Cross-user conflicts are caught by the
  // backend at creation time and auto-waitlisted.
  const conflictRange = React.useMemo(() => {
    if (!user || !equipmentId || !start || !end || dateError) return null;
    const padMs = 24 * 60 * 60 * 1000;
    return {
      userId: user.id,
      start: new Date(start.getTime() - padMs).toISOString(),
      end: new Date(end.getTime() + padMs).toISOString(),
    };
  }, [user, equipmentId, start, end, dateError]);

  const { data: conflictBookings } = useAsync(
    async () => {
      if (!conflictRange) return [] as Booking[];
      const all = await bookingApi.calendar(conflictRange);
      // Filter to this equipment (calendar returns all the user's bookings)
      return all.filter((b) => b.equipment.id === equipmentId);
    },
    [conflictRange?.userId, conflictRange?.start, conflictRange?.end, equipmentId],
  );

  const conflictingActive = React.useMemo(() => {
    if (!start || !end || !conflictBookings) return [];
    return conflictBookings.filter(
      (b) =>
        b.equipment.id === equipmentId &&
        ACTIVE_STATUSES.includes(b.status) &&
        rangesOverlap(start, end, parseISO(b.startTime), parseISO(b.endTime)),
    );
  }, [conflictBookings, start, end, equipmentId]);

  const hasConflict = conflictingActive.length > 0;

  // --- Submit --------------------------------------------------------------
  const handleSubmit = async () => {
    if (!user || equipmentId === null || !equipment) return;
    if (!start || !end || dateError) return;
    if (!isBookable(equipment.status)) return;

    setSubmitting(true);
    try {
      const msg = await bookingApi.create({
        userId: user.id,
        equipmentId,
        startTime: new Date(startValue).toISOString(),
        endTime: new Date(endValue).toISOString(),
      });
      if (isWaitlistMessage(msg)) {
        toast(
          "Added to waitlist — you'll be promoted when a slot frees up.",
        );
      } else {
        toast.success("Booking submitted — awaiting manager approval.");
      }
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Failed to submit booking";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (equipmentId !== null) navigate(`/equipment/${equipmentId}`);
    else navigate("/equipment");
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (equipmentId === null) {
    // effect will redirect; minimal placeholder
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Request a booking" description="Loading equipment…" />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Request a booking" />
        <EmptyState
          icon={TriangleAlert}
          title="Couldn’t load this equipment"
          description={error}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/equipment")}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Back to equipment
            </Button>
          }
        />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Request a booking" />
        <EmptyState
          icon={Microscope}
          title="Equipment not found"
          description="This equipment may have been removed. Pick another item from the catalogue."
          action={
            <Button
              size="sm"
              onClick={() => navigate("/equipment")}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Browse equipment
            </Button>
          }
        />
      </div>
    );
  }

  const unavailable = !isBookable(equipment.status);
  const submitDisabled =
    submitting ||
    unavailable ||
    !start ||
    !end ||
    !!dateError;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Request a booking"
        description="Pick a start and end time for your session."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="gap-1.5"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Equipment summary */}
        <Card className="gap-4 rounded-2xl p-5 shadow-soft lg:col-span-2">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
              <Microscope className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground">
                {equipment.equipmentName}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {equipment.category} · S/N {equipment.serial}
              </p>
            </div>
            <StatusBadge status={equipment.status} type="equipment" />
          </div>
          <p className="text-sm text-muted-foreground">
            {equipment.description || "No description provided."}
          </p>
          <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3 text-xs">
            <div>
              <p className="text-muted-foreground">Institution</p>
              <p className="mt-0.5 font-medium text-foreground">
                {equipment.institution}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Added by</p>
              <p className="mt-0.5 font-medium text-foreground">
                {equipment.addedBy}
              </p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <Card className="gap-5 rounded-2xl p-5 shadow-soft lg:col-span-3">
          {unavailable && (
            <div
              role="alert"
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
                equipmentStatusConfig(equipment.status).chip,
              )}
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">
                  This equipment is currently{" "}
                  <span className="font-semibold">
                    {equipmentStatusConfig(equipment.status).label}
                  </span>{" "}
                  and cannot be booked.
                </p>
                <p className="mt-0.5 text-xs opacity-90">
                  You can still review the form below — submit will stay disabled
                  until the equipment is available again.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="booking-start" className="gap-1.5">
                <CalendarClock className="size-3.5 text-primary/70" />
                Start time
              </Label>
              <Input
                id="booking-start"
                type="datetime-local"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                disabled={!canSelectDates || submitting}
                aria-invalid={!!dateError}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="booking-end" className="gap-1.5">
                <Clock className="size-3.5 text-primary/70" />
                End time
              </Label>
              <Input
                id="booking-end"
                type="datetime-local"
                value={endValue}
                onChange={(e) => setEndValue(e.target.value)}
                disabled={!canSelectDates || submitting}
                aria-invalid={!!dateError}
              />
            </div>
          </div>

          {dateError && (
            <p className="text-xs font-medium text-destructive" role="alert">
              {dateError}
            </p>
          )}

          {/* Duration */}
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-4 py-2.5 text-sm">
            <Clock className="size-4 text-primary/70" />
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium text-foreground">
              {durationMin > 0 ? formatDuration(durationMin) : "—"}
            </span>
          </div>

          {/* Conflict heads-up */}
          {hasConflict && start && end && !dateError && (
            <div
              role="status"
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
                bookingStatusConfig("PENDING").chip,
              )}
            >
              <Info className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">
                  This slot conflicts with an existing booking.
                </p>
                <p className="mt-0.5 text-xs opacity-90">
                  Submitting will auto-add it to the waitlist — you’ll be
                  promoted when a slot frees up.
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-xs">
                  {conflictingActive.slice(0, 3).map((b) => (
                    <li key={b.id} className="flex items-center gap-1.5">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: bookingStatusConfig(b.status).color }}
                      />
                      <span>
                        {format(parseISO(b.startTime), "dd MMM, HH:mm")} –{" "}
                        {format(parseISO(b.endTime), "HH:mm")} ·{" "}
                        {bookingStatusConfig(b.status).label}
                      </span>
                    </li>
                  ))}
                  {conflictingActive.length > 3 && (
                    <li className="text-muted-foreground">
                      +{conflictingActive.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitDisabled}
              className="gap-1.5"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Submitting…" : "Request booking"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
