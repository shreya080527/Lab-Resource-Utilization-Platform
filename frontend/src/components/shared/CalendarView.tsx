
	
import * as React from "react";
import {
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
  differenceInMinutes,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Microscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { bookingStatusConfig } from "@/lib/status";
import type { BookingStatus } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
const HOUR_HEIGHT = 48;

export function CalendarView({
  events,
  onSelect,
  emptyHint,
  cursor: controlledCursor,
  onCursorChange,
  loading = false,
}: {
  events: CalendarEventItem[];
  onSelect?: (ev: CalendarEventItem) => void;
  emptyHint?: string;
  cursor?: Date;
  onCursorChange?: (next: Date) => void;
  loading?: boolean;
}) {
  const [internalCursor, setInternalCursor] = React.useState(new Date());
  const [hoveredEvent, setHoveredEvent] = React.useState<number | null>(null);
  const cursor = controlledCursor ?? internalCursor;
  const setCursor = React.useCallback(
    (next: Date) => {
      if (controlledCursor === undefined) setInternalCursor(next);
      onCursorChange?.(next);
    },
    [controlledCursor, onCursorChange],
  );
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

  const formatDuration = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const mins = differenceInMinutes(endDate, startDate);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-muted/30 to-muted/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {format(weekStart, "MMMM d")} – {format(weekEnd, "MMMM d, yyyy")}
              </div>
              <div className="text-xs text-muted-foreground">
                {events.length} booking{events.length !== 1 ? "s" : ""} this week
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursor(addWeeks(cursor, -1))}
              className="h-8 rounded-lg transition-all hover:scale-105"
              aria-label="Previous week"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursor(new Date())}
              className="h-8 rounded-lg px-3 text-xs font-medium transition-all hover:scale-105"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursor(addWeeks(cursor, 1))}
              className="h-8 rounded-lg transition-all hover:scale-105"
              aria-label="Next week"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-center border-r border-border/40 py-2">
            <Clock className="size-3.5 text-muted-foreground" />
          </div>
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className={cn(
                "px-2 py-3 text-center transition-colors",
                isToday(d) && "bg-primary/5"
              )}
            >
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {format(d, "EEE")}
              </div>
              <div
                className={cn(
                  "mx-auto mt-1.5 flex size-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-200",
                  isToday(d)
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/20"
                    : "text-foreground hover:bg-muted/50",
                )}
              >
                {format(d, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] overflow-y-auto scroll-thin max-h-[576px]">
          {/* hour labels column */}
          <div>
            {hours.map((h) => (
              <div
                key={h}
                className="relative border-t border-border/40 text-right pr-3"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2.5 right-3 text-[10px] font-medium tabular-nums text-muted-foreground/70">
                  {h === 12 ? "12 PM" : h > 12 ? `${h - 12}pm` : `${h}am`}
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
                className={cn(
                  "relative border-l border-border/40 transition-colors",
                  isToday(d) && "bg-primary/[0.02]"
                )}
                style={{ height: totalHeight }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className={cn(
                      "border-t border-border/30 transition-colors",
                      isToday(d) && "border-border/50",
                      h % 2 === 0 && "bg-muted/5"
                    )}
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                {dayEvents.map((ev) => {
                  const block = layoutEvent(ev, d);
                  if (!block) return null;
                  const cfg = bookingStatusConfig(ev.status);
                  const isHovered = hoveredEvent === ev.id;
                  
                  return (
                    <Tooltip key={ev.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onSelect?.(ev)}
                          onMouseEnter={() => setHoveredEvent(ev.id)}
                          onMouseLeave={() => setHoveredEvent(null)}
                          className={cn(
                            "absolute left-1 right-1 overflow-hidden rounded-xl px-2.5 py-1.5 text-left text-[11px] leading-tight transition-all duration-200 cursor-pointer",
                            "hover:z-20 hover:shadow-xl hover:scale-[1.02]",
                            isHovered && "z-20 shadow-xl scale-[1.03]"
                          )}
                          style={{
                            top: block.top,
                            height: Math.max(block.height, 24),
                            background: `linear-gradient(135deg, ${cfg.color}15 0%, ${cfg.color}08 100%)`,
                            borderLeft: `4px solid ${cfg.color}`,
                            color: "var(--foreground)",
                            boxShadow: isHovered ? `0 4px 12px ${cfg.color}30` : `0 1px 3px ${cfg.color}10`,
                          }}
                        >
                          <div className="truncate font-bold text-[11px]" style={{ color: cfg.color }}>
                            {ev.title}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Clock className="size-2.5" />
                            <span className="tabular-nums">
                              {format(parseISO(ev.start), "HH:mm")}–{format(parseISO(ev.end), "HH:mm")}
                            </span>
                          </div>
                          {block.height > 40 && ev.subtitle && (
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/80">
                              <User className="size-2.5" />
                              <span className="truncate">{ev.subtitle}</span>
                            </div>
                          )}
                          {block.height > 60 && (
                            <div 
                              className="mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                              style={{ 
                                backgroundColor: `${cfg.color}20`,
                                color: cfg.color 
                              }}
                            >
                              {cfg.label}
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-50 w-64 p-0 overflow-hidden">
                        <div className="bg-gradient-to-br from-card to-card/95">
                          <div 
                            className="px-3 py-2 border-b"
                            style={{ borderColor: cfg.color + "30", backgroundColor: cfg.color + "10" }}
                          >
                            <div className="font-semibold text-sm" style={{ color: cfg.color }}>
                              {ev.title}
                            </div>
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="size-3.5 text-muted-foreground" />
                              <span className="font-medium">
                                {format(parseISO(ev.start), "MMM d, yyyy HH:mm")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Duration:</span>
                              <span className="font-medium">
                                {formatDuration(ev.start, ev.end)}
                              </span>
                            </div>
                            {ev.subtitle && (
                              <div className="flex items-center gap-2 text-xs">
                                <User className="size-3.5 text-muted-foreground" />
                                <span className="font-medium">{ev.subtitle}</span>
                              </div>
                            )}
                            <div className="pt-1">
                              <span 
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{ 
                                  backgroundColor: `${cfg.color}20`,
                                  color: cfg.color 
                                }}
                              >
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {events.length === 0 && emptyHint && (
          <div className="flex items-center justify-center gap-2 border-t border-border/60 bg-muted/20 px-4 py-4">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{emptyHint}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function layoutEvent(ev: CalendarEventItem, day: Date) {
  const start = parseISO(ev.start);
  const end = parseISO(ev.end);
  if (!isSameDay(start, day) && !isSameDay(end, day)) {
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
