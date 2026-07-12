
import * as React from "react";
import {
  RefreshCw,
  CalendarDays,
  Filter,
  Microscope,
} from "lucide-react";
import { toast } from "sonner";
import {
  startOfWeek,
  endOfWeek,
  endOfDay,
  format,
} from "date-fns";

import { useAsync } from "@/hooks/use-async";
import { bookingApi } from "@/lib/api/bookingApi";
import { equipmentApi } from "@/lib/api/equipmentApi";
import { toBackendDateTime } from "@/lib/constants";
import { bookingStatusConfig } from "@/lib/status";
import { cn } from "@/lib/utils";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeletons";
import {
  CalendarView,
  type CalendarEventItem,
} from "@/components/shared/CalendarView";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Booking, BookingStatus, Equipment } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toCalendarEvent(b: Booking): CalendarEventItem {
  return {
    id: b.id,
    start: b.startTime,
    end: b.endTime,
    title: b.equipmentName,
    subtitle: b.username,
    status: b.status as BookingStatus,
  };
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ManagerCalendarPage() {
  // --- equipment list (for the selector) ---
  const {
    data: equipment,
    loading: equipLoading,
    error: equipError,
    refetch: refetchEquip,
  } = useAsync<Equipment[]>(() => equipmentApi.getAllEquipment(), []);

  // --- selected equipment + cursor ---
  const [equipmentId, setEquipmentId] = React.useState<number | null>(null);
  const [cursor, setCursor] = React.useState<Date>(() => new Date());

  // Default to the first equipment once the list loads.
  React.useEffect(() => {
    if (equipmentId === null && equipment && equipment.length > 0) {
      setEquipmentId(equipment[0].id);
    }
  }, [equipment, equipmentId]);

  // --- week window (Mon–Sun) derived from cursor, as ISO strings ---
  const startIso = React.useMemo(
    () => toBackendDateTime(startOfWeek(cursor, { weekStartsOn: 1 })),
    [cursor],
  );
  const endIso = React.useMemo(
    () => toBackendDateTime(endOfDay(endOfWeek(cursor, { weekStartsOn: 1 }))),
    [cursor],
  );

  const windowStart = React.useMemo(
    () => startOfWeek(cursor, { weekStartsOn: 1 }),
    [cursor],
  );
  const windowEnd = React.useMemo(
    () => endOfDay(endOfWeek(cursor, { weekStartsOn: 1 })),
    [cursor],
  );

  // --- calendar data via /api/bookings/equipment-calendar ---
  // Refetches automatically when equipmentId or week window changes.
  const {
    data: rawBookings,
    loading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useAsync<Booking[]>(
    () =>
      equipmentId === null
        ? Promise.resolve([] as Booking[])
        : bookingApi.equipmentCalendar({
            equipmentId,
            start: startIso,
            end: endIso,
          }),
    [equipmentId, startIso, endIso],
  );

  const events: CalendarEventItem[] = React.useMemo(
    () => (rawBookings ?? []).map(toCalendarEvent),
    [rawBookings],
  );

  // --- legend: which statuses are actually present? ---
  const presentStatuses = React.useMemo(() => {
    const set = new Set<BookingStatus>();
    for (const ev of events) set.add(ev.status);
    if (set.size === 0) {
      return [
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
      ] as BookingStatus[];
    }
    return Array.from(set);
  }, [events]);

  const onSelect = (ev: CalendarEventItem) => {
    toast(`${ev.title} · ${ev.subtitle}`);
  };

  const selectedEquipment = (equipment ?? []).find((e) => e.id === equipmentId);

  const refetchAll = () => {
    refetchEquip();
    refetchBookings();
  };

  const showEmptyNoEquip =
    !equipLoading &&
    !equipError &&
    (equipment ?? []).length === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendar"
        description="Browse equipment bookings on a weekly calendar."
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
                (equipLoading || bookingsLoading) && "animate-spin",
              )}
            />
            Refresh
          </Button>
        }
      />

      {/* Equipment selector */}
      <Card className="glass rounded-2xl border-border/60 p-4 shadow-soft">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Filter className="size-3.5" />
            Filter
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Equipment
              </label>
              <Select
                value={equipmentId !== null ? String(equipmentId) : ""}
                onValueChange={(v) => setEquipmentId(Number(v))}
                disabled={
                  equipLoading || (equipment ?? []).length === 0
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select equipment…" />
                </SelectTrigger>
                <SelectContent>
                  {(equipment ?? []).map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.equipmentName}
                      <span className="ml-2 text-xs text-muted-foreground">
                        · {e.category}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Visible week
              </label>
              <div className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm text-foreground">
                {format(windowStart, "MMM d, yyyy")}
                {" – "}
                {format(windowEnd, "MMM d, yyyy")}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedEquipment ? (
              <>
                Showing bookings for{" "}
                <span className="font-medium text-foreground/90">
                  {selectedEquipment.equipmentName}
                </span>{" "}
                (S/N {selectedEquipment.serial}).
              </>
            ) : (
              <>Select an equipment to view its weekly schedule.</>
            )}
          </p>
        </div>
      </Card>

      {/* Loading / error / empty states */}
      {equipLoading ? (
        <ListSkeleton count={2} />
      ) : equipError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn’t load equipment list.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{equipError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refetchEquip}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : showEmptyNoEquip ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing to show yet"
          description="No equipment has been registered. Add equipment first, then bookings will appear on the calendar."
        />
      ) : equipmentId === null ? (
        <EmptyState
          icon={Microscope}
          title="Select equipment"
          description="Pick an equipment above to see its bookings on the weekly calendar."
        />
      ) : bookingsLoading && !rawBookings && !bookingsError ? (
        <ListSkeleton count={2} />
      ) : bookingsError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn’t load calendar bookings.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {bookingsError}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={refetchBookings}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : (
        <>
          <CalendarView
            events={events}
            onSelect={onSelect}
            emptyHint="No bookings in this week."
            cursor={cursor}
            onCursorChange={setCursor}
          />

          {/* Legend */}
          <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status colors
              </p>
              <div className="flex flex-wrap gap-2">
                {presentStatuses.map((s) => {
                  const cfg = bookingStatusConfig(s);
                  return (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${cfg.color} 14%, transparent)`,
                        color: cfg.color,
                      }}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                      {cfg.label}
                    </span>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {events.length} booking{events.length === 1 ? "" : "s"} in the
                week of {format(windowStart, "MMM d")} –{" "}
                {format(windowEnd, "MMM d")}.
                {selectedEquipment ? (
                  <>
                    {" "}
                    Filtered to{" "}
                    <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                      <Microscope className="size-3" />
                      {selectedEquipment.equipmentName}
                    </span>
                    .
                  </>
                ) : null}{" "}
                Use the arrows above to browse weeks.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
