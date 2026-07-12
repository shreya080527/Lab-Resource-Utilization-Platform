
import * as React from "react";
import { CalendarClock, Clock, User, Microscope, X, Repeat, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ActionButtonGroup } from "@/components/shared/ActionButtonGroup";
import type { Booking, User as AppUser } from "@/types";
import { format, parseISO } from "date-fns";

export function BookingCard({
  booking,
  currentUser,
  onAction,
  onViewEquipment,
  showUser = false,
  className,
}: {
  booking: Booking;
  currentUser: AppUser | null;
  onAction?: (action: string, booking: Booking) => void;
  onViewEquipment?: (id: number) => void;
  showUser?: boolean;
  className?: string;
}) {
  const start = parseISO(booking.startTime);
  const end = parseISO(booking.endTime);
  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");
  const isRecurring = !!booking.recurrencePattern;
  const isPartOfSeries = booking.parentBookingId != null;

  return (
    <Card
      className={cn(
        "flex flex-col gap-3 rounded-2xl border-border/60 p-4 shadow-soft transition-colors",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          className="flex min-w-0 items-center gap-3 text-left"
          onClick={() => onViewEquipment?.(booking.equipmentId)}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
            <Microscope className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {booking.equipmentName}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {isRecurring && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-1.5 py-0 text-[10px] font-medium gap-0.5"
                  title={`Recurring: ${booking.recurrencePattern}`}
                >
                  <Repeat className="size-2.5" />
                  {booking.recurrencePattern}
                </Badge>
              )}
              {isPartOfSeries && (
                <Badge
                  variant="outline"
                  className="rounded-full px-1.5 py-0 text-[10px] font-medium gap-0.5 text-muted-foreground"
                  title={`Part of recurring series #${booking.parentBookingId}`}
                >
                  <Link2 className="size-2.5" />
                  Part of series #{booking.parentBookingId}
                </Badge>
              )}
            </div>
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
            {format(start, "HH:mm")} – {format(end, sameDay ? "HH:mm" : "dd MMM HH:mm")}
          </span>
        </div>
        {showUser && (
          <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
            <User className="size-4 shrink-0 text-primary/70" />
            <span className="text-foreground truncate">{booking.username}</span>
          </div>
        )}
      </div>

      <ActionButtonGroup
        booking={booking}
        currentUser={currentUser}
        onAction={(a) => onAction?.(a, booking)}
        className="pt-1"
      />
    </Card>
  );
}

// Re-export for convenience in tables/lists
export function BookingCancelButton({
  onClick,
  busy,
}: {
  onClick: () => void;
  busy?: boolean;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={busy} className="gap-1.5">
      <X className="size-3.5" />
      Cancel
    </Button>
  );
}
