
import * as React from "react";
import {
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  addWeeks,
  isToday,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { bookingStatusConfig } from "@/lib/status";
import type { BookingStatus } from "@/types";

export interface CalendarEventItem {
  id: number;
  start: string;
  end: string;
  title: string;
  subtitle?: string;
  status: BookingStatus;
}

const HOUR_START = 7;
const HOUR_END = 21;
const HOUR_HEIGHT = 46;

export function CalendarView({
  events,
  onSelect,
  emptyHint,
}: {
  events: CalendarEventItem[];
  onSelect?: (ev: CalendarEventItem) => void;
  emptyHint?: string;
}) {
  const [cursor, setCursor] = React.useState(new Date());
  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

  const eventsByDay: Record<string, CalendarEventItem[]> = (() => {
    const map: Record<string, CalendarEventItem[]> = {};
    for (const d of days) map[format(d, "yyyy-MM-dd")] = [];
    for (const ev of events) {
      const key = format(parseISO(ev.start), "yyyy-MM-dd");
      if (map[key]) map[key].push(ev);
    }
    return map;
  })();

  const totalHeight = hours.length * HOUR_HEIGHT;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-4 py-3">
        <div className="text-sm font-semibold text-foreground">
          {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor((c) => addWeeks(c, -1))}
            className="rounded-lg"
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(new Date())}
            className="rounded-lg"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor((c) => addWeeks(c, 1))}
            className="rounded-lg"
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] border-b border-border/60">
        <div />
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className="px-2 py-2 text-center"
          >
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {format(d, "EEE")}
            </div>
            <div
              className={cn(
                "mx-auto mt-1 flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                isToday(d)
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground",
              )}
            >
              {format(d, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] overflow-y-auto scroll-thin max-h-[560px]">
        {/* hour labels column */}
        <div>
          {hours.map((h) => (
            <div
              key={h}
              className="relative border-t border-border/40 text-right pr-2"
              style={{ height: HOUR_HEIGHT }}
            >
              <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground">
                {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
              </span>
            </div>
          ))}
        </div>

        {/* day columns */}
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const dayEvents = eventsByDay[key] ?? [];
          return (
            <div
              key={d.toISOString()}
              className="relative border-l border-border/40"
              style={{ height: totalHeight }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="border-t border-border/40"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}
              {dayEvents.map((ev) => {
                const block = layoutEvent(ev, d);
                if (!block) return null;
                const cfg = bookingStatusConfig(ev.status);
                return (
                  <button
                    key={ev.id}
                    onClick={() => onSelect?.(ev)}
                    className="absolute left-1 right-1 overflow-hidden rounded-lg px-2 py-1 text-left text-[11px] leading-tight shadow-soft transition-transform hover:z-10 hover:scale-[1.02]"
                    style={{
                      top: block.top,
                      height: Math.max(block.height, 18),
                      backgroundColor: `color-mix(in oklch, ${cfg.color} 18%, transparent)`,
                      borderLeft: `3px solid ${cfg.color}`,
                      color: "var(--foreground)",
                    }}
                    title={`${ev.title} · ${format(parseISO(ev.start), "HH:mm")}–${format(parseISO(ev.end), "HH:mm")}`}
                  >
                    <div className="truncate font-semibold" style={{ color: cfg.color }}>
                      {ev.title}
                    </div>
                    <div className="truncate text-muted-foreground">
                      {format(parseISO(ev.start), "HH:mm")}–{format(parseISO(ev.end), "HH:mm")}
                      {ev.subtitle ? ` · ${ev.subtitle}` : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {events.length === 0 && emptyHint && (
        <div className="border-t border-border/60 px-4 py-3 text-center text-xs text-muted-foreground">
          {emptyHint}
        </div>
      )}
    </div>
  );
}

function layoutEvent(ev: CalendarEventItem, day: Date) {
  const start = parseISO(ev.start);
  const end = parseISO(ev.end);
  if (!isSameDay(start, day) && !isSameDay(end, day)) {
    // span across days — show on the start day only
    if (!isSameDay(start, day)) return null;
  }
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const effStart = start < dayStart ? dayStart : start;
  const effEnd = end > dayEnd ? dayEnd : end;

  const dayStartHour = HOUR_START;
  const topMs = effStart.getTime() - dayStart.getTime();
  const topHours = topMs / 3600_000 - dayStartHour;
  const durHours = (effEnd.getTime() - effStart.getTime()) / 3600_000;
  if (topHours + durHours <= 0 || topHours >= HOUR_END - HOUR_START + 1) return null;
  const clampedTop = Math.max(topHours, 0);
  const clampedHeight = Math.min(
    durHours - (clampedTop - topHours),
    HOUR_END - HOUR_START - clampedTop,
  );
  return {
    top: clampedTop * HOUR_HEIGHT,
    height: clampedHeight * HOUR_HEIGHT,
  };
}
