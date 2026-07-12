
import * as React from "react";
import {
  ArrowLeft,
  Microscope,
  Loader2,
  TriangleAlert,
  CalendarClock,
  Clock,
  Info,
  Repeat,
  Ban,
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
import { toBackendDateTime } from "@/lib/constants";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Booking, RecurrencePattern } from "@/types";

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

const RECURRENCE_OPTIONS: { value: RecurrencePattern; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
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

  // --- Equipment loading: dedicated getEquipment(id) endpoint ------------
  const { data: equipment, loading, error } = useAsync(
    async () => {
      if (equipmentId === null) return undefined;
      return equipmentApi.getEquipment(equipmentId);
    },
    [equipmentId],
  );

  // --- Form state ----------------------------------------------------------
  const [startValue, setStartValue] = React.useState("");
  const [endValue, setEndValue] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Recurring state
  const [recurring, setRecurring] = React.useState(false);
  const [recurrencePattern, setRecurrencePattern] =
    React.useState<RecurrencePattern>("WEEKLY");
  const [recurrenceCount, setRecurrenceCount] = React.useState(4);

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

  // --- Conflict detection (equipment-scoped calendar, cross-user) --------
  // The dedicated /api/bookings/equipment-calendar endpoint returns ALL
  // bookings on this equipment (regardless of owner). We fetch a ±1 day
  // window around the proposed slot and surface any active-status overlap.
  const conflictRange = React.useMemo(() => {
    if (equipmentId === null || !start || !end || dateError) return null;
    const padMs = 24 * 60 * 60 * 1000;
    return {
      equipmentId,
      start: toBackendDateTime(new Date(start.getTime() - padMs)),
      end: toBackendDateTime(new Date(end.getTime() + padMs)),
    };
  }, [equipmentId, start, end, dateError]);

  const { data: equipmentBookings } = useAsync(
    async () => {
      if (!conflictRange) return [] as Booking[];
      return bookingApi.equipmentCalendar(conflictRange);
    },
    [conflictRange?.equipmentId, conflictRange?.start, conflictRange?.end],
  );

  const conflictingActive = React.useMemo(() => {
    if (!start || !end || !equipmentBookings) return [];
    return equipmentBookings.filter(
      (b) =>
        ACTIVE_STATUSES.includes(b.status) &&
        rangesOverlap(start, end, parseISO(b.startTime), parseISO(b.endTime)),
    );
  }, [equipmentBookings, start, end]);

  // Split conflicts into the user's OWN bookings vs OTHER users' bookings.
  // The backend rejects same-user duplicate bookings ("You already have an
  // active or pending booking"), but allows cross-user conflicts (those go to
  // the waitlist). The UI must reflect this distinction.
  const ownConflicts = React.useMemo(
    () => conflictingActive.filter((b) => b.userId === user?.id),
    [conflictingActive, user?.id],
  );
  const otherConflicts = React.useMemo(
    () => conflictingActive.filter((b) => b.userId !== user?.id),
    [conflictingActive, user?.id],
  );

  const hasOwnConflict = ownConflicts.length > 0;
  const hasOtherConflict = otherConflicts.length > 0;
  const hasConflict = conflictingActive.length > 0;

  // --- Submit --------------------------------------------------------------
  // Non-recurring create() may return either a Booking object (new shape)
  // or a legacy plain-text message (e.g. waitlist confirmation). We branch
  // on typeof to handle both defensively.
  const handleSubmit = async () => {
    if (!user || equipmentId === null || !equipment) return;
    if (!start || !end || dateError) return;
    if (!isBookable(equipment.status)) return;

    const startTimeIso = toBackendDateTime(new Date(startValue));
    const endTimeIso = toBackendDateTime(new Date(endValue));

    setSubmitting(true);
    try {
      if (recurring) {
        const resp = await bookingApi.createRecurring({
          userId: user.id,
          equipmentId,
          startTime: startTimeIso,
          endTime: endTimeIso,
          recurrencePattern,
          recurrenceCount,
        });
        toast.success(
          `Created ${resp.totalBookingsCreated} booking${
            resp.totalBookingsCreated === 1 ? "" : "s"
          }, ${resp.totalWaitlisted} waitlisted`,
        );
        if (resp.waitlistedSlots.length > 0) {
          const lines = resp.waitlistedSlots.map(
            (s) =>
              `${format(parseISO(s.startTime), "dd MMM, HH:mm")} – ${format(
                parseISO(s.endTime),
                "HH:mm",
              )}`,
          );
          toast.warning(
            `${resp.waitlistedSlots.length} slot${
              resp.waitlistedSlots.length === 1 ? "" : "s"
            } waitlisted:\n${lines.join("\n")}`,
          );
        }
        navigate("/dashboard", { replace: true });
        return;
      }

      const resp = await bookingApi.create({
        userId: user.id,
        equipmentId,
        startTime: startTimeIso,
        endTime: endTimeIso,
      });

      if (typeof resp === "string") {
        // Legacy plain-text response — sniff for waitlist vs success.
        if (isWaitlistMessage(resp)) {
          toast.warning(
            "Slot conflicting with an active timeline — added to the waitlist.",
          );
        } else {
          toast.success(resp || "Booking request submitted.");
        }
      } else {
        // Booking object returned.
        toast.success("Booking request submitted — awaiting manager approval.");
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
  // Render — guard states first
  // -----------------------------------------------------------------------

  // No equipmentId (or unparseable) → EmptyState with back link.
  if (equipmentId === null) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Request a booking" />
        <EmptyState
          icon={Microscope}
          title="No equipment selected"
          description="Pick a piece of equipment from the catalog to start a booking."
          action={
            <Button
              variant="outline"
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
    // Loaded but missing (e.g. deleted between catalog click and this page).
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Request a booking" />
        <EmptyState
          icon={TriangleAlert}
          title="Equipment not found"
          description="This equipment may have been removed. Please pick another from the catalog."
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

  const unavailable = !isBookable(equipment.status);
  const submitDisabled =
    submitting ||
    unavailable ||
    !start ||
    !end ||
    !!dateError ||
    hasOwnConflict ||
    (recurring && (recurrenceCount < 1 || recurrenceCount > 52));

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
          <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-3 text-xs sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Institution</p>
              <p className="mt-0.5 truncate font-medium text-foreground">
                {equipment.institution?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="mt-0.5 truncate font-medium text-foreground">
                {equipment.department?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Added by</p>
              <p className="mt-0.5 truncate font-medium text-foreground">
                {equipment.addedByUsername || "—"}
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

          {/* Recurrence */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="booking-recurring"
                checked={recurring}
                onCheckedChange={(v) => setRecurring(v === true)}
                disabled={submitting || !canSelectDates}
              />
              <Label
                htmlFor="booking-recurring"
                className="flex cursor-pointer items-center gap-1.5 text-sm font-medium"
              >
                <Repeat className="size-3.5 text-primary/70" />
                Repeat this booking
              </Label>
            </div>
            {recurring && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="booking-recurrence-pattern"
                    className="text-xs text-muted-foreground"
                  >
                    Frequency
                  </Label>
                  <Select
                    value={recurrencePattern}
                    onValueChange={(v) =>
                      setRecurrencePattern(v as RecurrencePattern)
                    }
                  >
                    <SelectTrigger
                      id="booking-recurrence-pattern"
                      className="w-full"
                      disabled={submitting}
                    >
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="booking-recurrence-count"
                    className="text-xs text-muted-foreground"
                  >
                    Recurrences (1–52)
                  </Label>
                  <Input
                    id="booking-recurrence-count"
                    type="number"
                    min={1}
                    max={52}
                    value={recurrenceCount}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (Number.isFinite(n)) {
                        setRecurrenceCount(
                          Math.min(52, Math.max(1, Math.floor(n))),
                        );
                      } else if (e.target.value === "") {
                        setRecurrenceCount(1);
                      }
                    }}
                    disabled={submitting}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Own-booking conflict — BLOCKS submission */}
          {hasOwnConflict && start && end && !dateError && (
            <div
              role="alert"
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
                "bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/25",
              )}
            >
              <Ban className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">
                  You already have an active booking for this equipment at
                  this time.
                </p>
                <p className="mt-0.5 text-xs opacity-90">
                  You can&apos;t book the same equipment twice. Cancel your
                  existing booking first, or pick a different time slot.
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-xs">
                  {ownConflicts.slice(0, 3).map((b) => (
                    <li key={b.id} className="flex items-center gap-1.5">
                      <span
                        className="size-1.5 rounded-full"
                        style={{
                          backgroundColor: bookingStatusConfig(b.status).color,
                        }}
                      />
                      <span>
                        {format(parseISO(b.startTime), "dd MMM, HH:mm")} –{" "}
                        {format(parseISO(b.endTime), "HH:mm")} ·{" "}
                        {bookingStatusConfig(b.status).label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Other-user conflict — warns about waitlist, but allows submission */}
          {hasOtherConflict && !hasOwnConflict && start && end && !dateError && (
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
                  This slot is already booked by another researcher.
                </p>
                <p className="mt-0.5 text-xs opacity-90">
                  Submitting will auto-add your request to the waitlist —
                  you&apos;ll be promoted when a slot frees up.
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-xs">
                  {otherConflicts.slice(0, 3).map((b) => (
                    <li key={b.id} className="flex items-center gap-1.5">
                      <span
                        className="size-1.5 rounded-full"
                        style={{
                          backgroundColor: bookingStatusConfig(b.status).color,
                        }}
                      />
                      <span>
                        {format(parseISO(b.startTime), "dd MMM, HH:mm")} –{" "}
                        {format(parseISO(b.endTime), "HH:mm")} ·{" "}
                        {bookingStatusConfig(b.status).label}
                        {b.username ? ` · ${b.username}` : ""}
                      </span>
                    </li>
                  ))}
                  {otherConflicts.length > 3 && (
                    <li className="text-muted-foreground">
                      +{otherConflicts.length - 3} more
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
              {submitting
                ? "Submitting…"
                : recurring
                  ? "Create recurring booking"
                  : "Request booking"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
