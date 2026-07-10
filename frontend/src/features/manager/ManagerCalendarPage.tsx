
import * as React from "react";
import { RefreshCw, CalendarDays, Filter, Layers } from "lucide-react";
import { toast } from "sonner";

import { useAsync } from "@/hooks/use-async";
import { bookingApi } from "@/lib/api/bookingApi";
import { equipmentApi } from "@/lib/api/equipmentApi";
import { bookingStatusConfig } from "@/lib/status";

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

import type { Booking, BookingStatus } from "@/types";

// ---------------------------------------------------------------------------

const EQUIP_ALL = "ALL";
const CAT_ALL = "ALL";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toCalendarEvent(b: Booking): CalendarEventItem {
  return {
    id: b.id,
    start: b.startTime,
    end: b.endTime,
    title: b.equipment.equipmentName,
    subtitle: b.user.username,
    status: b.status as BookingStatus,
  };
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ManagerCalendarPage() {
  // --- filters state ---
  const [equipFilter, setEquipFilter] = React.useState<string>(EQUIP_ALL);
  const [catFilter, setCatFilter] = React.useState<string>(CAT_ALL);

  // --- data: equipment list (for filter dropdown) ---
  const {
    data: equipment,
    loading: equipLoading,
    error: equipError,
    refetch: refetchEquip,
  } = useAsync(() => equipmentApi.getAllEquipment(), []);

  // --- data: all bookings in a 90-day window ---
  const {
    data: bookings,
    loading,
    error,
    refetch,
  } = useAsync(() => bookingApi.allBookings(), []);

  // --- derived filter option lists ---
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const e of equipment ?? []) set.add(e.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [equipment]);

  // --- client-side filtering before passing events to CalendarView ---
  const events: CalendarEventItem[] = React.useMemo(() => {
    const all = bookings ?? [];
    return all
      .filter((b) =>
        equipFilter === EQUIP_ALL ? true : b.equipment.equipmentName === equipFilter,
      )
      .filter((b) =>
        catFilter === CAT_ALL ? true : b.equipment.category === catFilter,
      )
      .map(toCalendarEvent);
  }, [bookings, equipFilter, catFilter]);

  // --- legend: which statuses are actually present? ---
  const presentStatuses = React.useMemo(() => {
    const set = new Set<BookingStatus>();
    for (const ev of events) set.add(ev.status);
    if (set.size === 0) {
      // Show the common defaults when the visible range is empty
      return (["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"] as BookingStatus[]);
    }
    return Array.from(set);
  }, [events]);

  const onSelect = (ev: CalendarEventItem) => {
    toast(`${ev.title} · ${ev.subtitle}`);
  };

  const clearFilters = () => {
    setEquipFilter(EQUIP_ALL);
    setCatFilter(CAT_ALL);
  };

  const hasFilters = equipFilter !== EQUIP_ALL || catFilter !== CAT_ALL;
  const anyLoading = loading || equipLoading;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendar"
        description="Spot booking conflicts across all equipment at a glance."
        actions={
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5">
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <Card className="glass rounded-2xl border-border/60 p-4 shadow-soft">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Filter className="size-3.5" />
            Filters
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Equipment
              </label>
              <Select
                value={equipFilter}
                onValueChange={setEquipFilter}
                disabled={equipLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EQUIP_ALL}>All equipment</SelectItem>
                  {(equipment ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.equipmentName}>
                      {e.equipmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Category
              </label>
              <Select
                value={catFilter}
                onValueChange={setCatFilter}
                disabled={equipLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CAT_ALL}>All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasFilters && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Loading */}
      {anyLoading ? (
        <ListSkeleton count={2} />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn’t load the calendar.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5">
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : equipError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn’t load equipment list.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{equipError}</p>
          <Button variant="outline" size="sm" onClick={refetchEquip} className="gap-1.5">
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : (bookings?.length ?? 0) === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No bookings in this range"
          description="No booking requests fall within the next/previous 45 days."
        />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No matching bookings"
          description="Try clearing the equipment or category filter to see all bookings."
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <CalendarView
            events={events}
            onSelect={onSelect}
            emptyHint="No bookings in this range."
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
                {events.length} booking{events.length === 1 ? "" : "s"} in the ±45-day
                window. Use the arrows above to browse weeks.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
