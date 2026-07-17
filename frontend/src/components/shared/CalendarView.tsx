import * as React from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  addWeeks,
  addDays,
  isToday,
  startOfDay,
  endOfDay,
  differenceInMinutes,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Microscope, Loader2 } from "lucide-react";
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
const HOUR_HEIGHT = 60;

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
  const [viewMode, setViewMode] = React.useState<"week" | "day">("week");
  const cursor = controlledCursor ?? internalCursor;
  const setCursor = React.useCallback(
    (next: Date) => {
      if (controlledCursor === undefined) setInternalCursor(next);
      onCursorChange?.(next);
    },
    [controlledCursor, onCursorChange],
  );

  const visibleRange = React.useMemo(() => {
    if (viewMode === "day") {
      const dayStart = startOfDay(cursor);
      return { start: dayStart, end: endOfDay(cursor), days: [dayStart] };
    } else {
      const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
      return { start: weekStart, end: weekEnd, days: eachDayOfInterval({ start: weekStart, end: weekEnd }) };
    }
  }, [cursor, viewMode]);

  const days = visibleRange.days;
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

  const handlePrev = () => {
    if (viewMode === "day") {
      setCursor(addDays(cursor, -1));
    } else {
      setCursor(addWeeks(cursor, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "day") {
      setCursor(addDays(cursor, 1));
    } else {
      setCursor(addWeeks(cursor, 1));
    }
  };

  const getDateRangeLabel = () => {
    if (viewMode === "day") {
      return format(visibleRange.start, "EEEE, MMMM d, yyyy");
    }
    return `${format(visibleRange.start, "MMMM d")} – ${format(visibleRange.end, "MMMM d, yyyy")}`;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all duration-200">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-3 shadow-lg">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span className="text-sm font-medium">Loading bookings...</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border/60 bg-gradient-to-r from-muted/30 to-muted/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-sm">
              <Calendar className="size-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-foreground">
                {getDateRangeLabel()}
              </div>
              <div className="text-xs text-muted-foreground">
                {events.length} booking{events.length !== 1 ? "s" : ""} {viewMode === "day" ? "today" : "this week"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border/60 bg-background p-0.5">
              <button
                onClick={() => setViewMode("day")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  viewMode === "day"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  viewMode === "week"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Week
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-9 w-9 rounded-lg p-0 transition-all hover:scale-105"
                aria-label="Previous"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCursor(new Date())}
                className="h-9 rounded-lg px-4 text-xs font-medium transition-all hover:scale-105"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                className="h-9 w-9 rounded-lg p-0 transition-all hover:scale-105"
                aria-label="Next"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Day headers */}
        <div className={cn(
          "grid border-b border-border/60 bg-muted/20",
          viewMode === "day" ? "grid-cols-[56px_1fr]" : "grid-cols-[56px_repeat(7,minmax(0,1fr))]"
        )}>
          <div className="flex items-center justify-center border-r border-border/40 py-3">
            <Clock className="size-4 text-muted-foreground" />
          </div>
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className={cn(
                "px-2 py-3 text-center transition-colors",
                isToday(d) && "bg-primary/5"
              )}
            >
              <div className={cn(
                "text-[11px] font-medium uppercase tracking-wide",
                isToday(d) ? "text-primary" : "text-muted-foreground"
              )}>
                {format(d, "EEE")}
              </div>
              <div
                className={cn(
                  "mx-auto mt-1.5 flex size-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-200",
                  isToday(d)
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-primary/20"
                    : "text-foreground hover:bg-muted/50"
                )}
              >
                {format(d, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className={cn(
          "overflow-y-auto scroll-thin relative",
          viewMode === "day" ? "grid grid-cols-[56px_1fr] max-h-[600px]" : "grid grid-cols-[56px_repeat(7,minmax(0,1fr))] max-h-[600px]"
        )}>
          {/* hour labels column */}
          <div className="border-r border-border/40">
            {hours.map((h) => (
              <div
                key={h}
                className="relative border-t border-border/40 text-right pr-3"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-3 right-3 text-[11px] font-medium tabular-nums text-muted-foreground/70">
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
                  isToday(d) && "bg-primary/[0.03]"
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
                  const isShort = block.height < 50;
                  const isVeryShort = block.height < 30;

                  return (
                    <Tooltip key={ev.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onSelect?.(ev)}
                          onMouseEnter={() => setHoveredEvent(ev.id)}
                          onMouseLeave={() => setHoveredEvent(null)}
                          className={cn(
                            "absolute left-1 right-1 overflow-hidden rounded-lg px-2 py-1.5 text-left text-xs leading-tight transition-all duration-200 cursor-pointer",
                            "hover:z-30 hover:shadow-xl hover:scale-[1.02]",
                            isHovered && "z-30 shadow-xl scale-[1.03]",
                            !isVeryShort && "border-l-4"
                          )}
                          style={{
                            top: block.top,
                            height: Math.max(block.height, 24),
                            background: `linear-gradient(135deg, ${cfg.color}20 0%, ${cfg.color}08 100%)`,
                            borderColor: cfg.color,
                            boxShadow: isHovered
                              ? `0 4px 16px ${cfg.color}40, 0 1px 3px ${cfg.color}20`
                              : `0 1px 4px ${cfg.color}15`,
                          }}
                        >
                          <div className={cn(
                            "truncate font-semibold",
                            isShort ? "text-[10px]" : "text-xs"
                          )}
                          style={{ color: cfg.color }}>
                            {ev.title}
                          </div>
                          {!isVeryShort && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
                              <Clock className="size-2.5" />
                              <span className="tabular-nums font-medium">
                                {format(parseISO(ev.start), "HH:mm")}-{format(parseISO(ev.end), "HH:mm")}
                              </span>
                            </div>
                          )}
                          {!isShort && ev.subtitle && (
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/70">
                              <User className="size-2.5" />
                              <span className="truncate">{ev.subtitle}</span>
                            </div>
                          )}
                          {!isShort && (
                            <div
                              className="absolute right-1.5 top-1.5 mt-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                              style={{ backgroundColor: `${cfg.color}25`, color: cfg.color }}
                            >
                              {cfg.label}
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-50 w-72 p-0 overflow-hidden">
                        <div className="bg-gradient-to-br from-card to-card/95">
                          <div
                            className="px-4 py-3 border-b"
                            style={{ borderColor: cfg.color + "30", backgroundColor: cfg.color + "10" }}
                          >
                            <div className="flex items-center gap-2">
                              <Microscope className="size-4" style={{ color: cfg.color }} />
                              <div className="font-semibold text-sm" style={{ color: cfg.color }}>
                                {ev.title}
                              </div>
                            </div>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                              <Calendar className="size-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(parseISO(ev.start), "EEEE, MMM d, yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <Clock className="size-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(parseISO(ev.start), "HH:mm")} - {format(parseISO(ev.end), "HH:mm")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({formatDuration(ev.start, ev.end)})
                              </span>
                            </div>
                            {ev.subtitle && (
                              <div className="flex items-center gap-3 text-sm">
                                <User className="size-4 text-muted-foreground" />
                                <span className="font-medium">{ev.subtitle}</span>
                              </div>
                            )}
                            <div className="pt-2">
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                                style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                              >
                                <span className="size-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {/* Current time indicator */}
                {isToday(d) && <CurrentTimeIndicator hourStart={HOUR_START} hourHeight={HOUR_HEIGHT} />}
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

function CurrentTimeIndicator({ hourStart, hourHeight }: { hourStart: number; hourHeight: number }) {
  const [position, setPosition] = React.useState({ top: 0, visible: false });

  React.useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (currentHour >= hourStart && currentHour <= hourStart + 14) {
        const hoursFromStart = currentHour - hourStart + (currentMinute / 60);
        setPosition({ top: hoursFromStart * hourHeight, visible: true });
      } else {
        setPosition(prev => ({ ...prev, visible: false }));
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60000);
    return () => clearInterval(interval);
  }, [hourStart, hourHeight]);

  if (!position.visible) return null;

  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: position.top }}>
      <div className="flex items-center gap-1">
        <div className="size-2 rounded-full bg-rose-500 shadow-sm" />
        <div className="h-0.5 flex-1 bg-rose-500 shadow-sm" />
      </div>
    </div>
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