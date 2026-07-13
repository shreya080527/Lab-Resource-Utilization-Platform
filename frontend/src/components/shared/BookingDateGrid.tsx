
import * as React from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { bookingStatusConfig } from "@/lib/status";
import type { Booking, BookingStatus } from "@/types";

// ---------------------------------------------------------------------------
// BookingDateGrid — GitHub-style date-box grid
// ---------------------------------------------------------------------------
// Shows a month calendar where each day box is color-coded by booking status:
//   - green dot / border  = AVAILABLE (no active bookings)
//   - blue fill           = BOOKED (has CONFIRMED or IN_PROGRESS bookings)
//   - amber fill          = PENDING (has pending requests, not yet confirmed)
//   - muted               = past dates with no active bookings
//
// Hovering a day shows a tooltip with the booking details. Clicking a day
// selects it and shows the day's bookings in a list below the grid.
// ---------------------------------------------------------------------------

const ACTIVE_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS"];

interface DayInfo {
  date: Date;
  bookings: Booking[];
  /** the "worst" status on this day — drives the cell color */
  status: "booked" | "pending" | "available" | "past" | "empty";
}

function classifyDay(date: Date, bookings: Booking[]): DayInfo["status"] {
  const now = new Date();
  if (date < startOfWeek(now, { weekStartsOn: 1 }) && !isSameDay(date, now)) {
    // Past day (before this week)
    if (bookings.length === 0) return "past";
  }
  if (bookings.length === 0) return "available";

  const hasConfirmed = bookings.some((b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS");
  const hasPending = bookings.some((b) => b.status === "PENDING");

  if (hasConfirmed) return "booked";
  if (hasPending) return "pending";
  return "available";
}

const STATUS_STYLES: Record<DayInfo["status"], { cell: string; dot: string; label: string }> = {
  booked: {
    cell: "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    label: "Booked",
  },
  pending: {
    cell: "bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    label: "Pending",
  },
  available: {
    cell: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    label: "Available",
  },
  past: {
    cell: "bg-muted/30 border-border/40 text-muted-foreground",
    dot: "bg-muted-foreground/30",
    label: "Past",
  },
  empty: {
    cell: "border-transparent text-muted-foreground/30",
    dot: "bg-transparent",
    label: "",
  },
};

export function BookingDateGrid({
  bookings,
  onSelectDate,
}: {
  bookings: Booking[];
  onSelectDate?: (date: Date, dayBookings: Booking[]) => void;
}) {
  const [cursor, setCursor] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Group bookings by date (yyyy-MM-dd)
  const bookingsByDate = React.useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      try {
        const start = parseISO(b.startTime);
        const end = parseISO(b.endTime);
        // A booking may span multiple days — add it to each day it covers
        const dayCursor = new Date(start);
        dayCursor.setHours(0, 0, 0, 0);
        const endDay = new Date(end);
        endDay.setHours(0, 0, 0, 0);
        while (dayCursor <= endDay) {
          const key = format(dayCursor, "yyyy-MM-dd");
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(b);
          dayCursor.setDate(dayCursor.getDate() + 1);
        }
      } catch {
        // ignore parse errors
      }
    }
    return map;
  }, [bookings]);

  const dayInfos: DayInfo[] = days.map((date) => {
    const key = format(date, "yyyy-MM-dd");
    const dayBookings = (bookingsByDate.get(key) ?? []).filter((b) =>
      ACTIVE_STATUSES.includes(b.status),
    );
    return {
      date,
      bookings: dayBookings,
      status: isSameMonth(date, cursor)
        ? classifyDay(date, dayBookings)
        : "empty",
    };
  });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleDayClick = (info: DayInfo) => {
    if (info.status === "empty") return;
    setSelectedDate(info.date);
    onSelectDate?.(info.date, info.bookings);
  };

  const selectedDayBookings = selectedDate
    ? dayInfos.find((d) => isSameDay(d.date, selectedDate))?.bookings ?? []
    : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-foreground">
          {format(cursor, "MMMM yyyy")}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="rounded-lg"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(new Date())}
            className="rounded-lg text-xs"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded-lg"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground pb-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date boxes */}
      <div className="grid grid-cols-7 gap-1.5">
        {dayInfos.map((info) => {
          const style = STATUS_STYLES[info.status];
          const isSelected = selectedDate && isSameDay(info.date, selectedDate);
          const today = isToday(info.date);
          return (
            <button
              key={info.date.toISOString()}
              onClick={() => handleDayClick(info)}
              disabled={info.status === "empty"}
              title={
                info.status === "empty"
                  ? undefined
                  : `${format(info.date, "EEE, d MMM yyyy")} — ${style.label}${
                      info.bookings.length > 0
                        ? ` (${info.bookings.length} booking${info.bookings.length !== 1 ? "s" : ""})`
                        : ""
                    }`
              }
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-lg border text-xs font-medium transition-all",
                "hover:scale-105 hover:shadow-soft",
                style.cell,
                isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                today && "ring-1 ring-primary/50",
                info.status === "empty" && "cursor-default hover:scale-100 hover:shadow-none",
              )}
            >
              <span>{format(info.date, "d")}</span>
              {info.bookings.length > 0 && (
                <span
                  className={cn(
                    "absolute bottom-1 size-1.5 rounded-full",
                    style.dot,
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">Legend:</span>
        {(["booked", "pending", "available", "past"] as const).map((s) => {
          const style = STATUS_STYLES[s];
          return (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className={cn("size-2.5 rounded", style.dot)} />
              {style.label}
            </span>
          );
        })}
      </div>

      {/* Selected day bookings */}
      {selectedDate && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              {format(selectedDate, "EEEE, d MMMM yyyy")}
            </h4>
            <span className="text-xs text-muted-foreground">
              {selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? "s" : ""}
            </span>
          </div>
          {selectedDayBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active bookings on this day — equipment is available.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedDayBookings.map((b) => {
                const cfg = bookingStatusConfig(b.status);
                let start: Date | null = null;
                let end: Date | null = null;
                try {
                  start = parseISO(b.startTime);
                  end = parseISO(b.endTime);
                } catch {
                  /* ignore */
                }
                return (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {b.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {start && end
                          ? `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`
                          : "—"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        cfg.chip,
                      )}
                    >
                      {cfg.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
