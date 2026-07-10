
import * as React from "react";
import {
  ArrowLeft,
  RotateCw,
  Tag,
  Hash,
  Building2,
  UserCircle,
  CalendarDays,
  Info,
  Boxes,
} from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, endOfDay } from "date-fns";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { useAsync } from "@/hooks/use-async";
import { equipmentApi } from "@/lib/api/equipmentApi";
import { bookingApi } from "@/lib/api/bookingApi";
import { useAuthStore } from "@/store/authStore";
import { useRouter, matchRoute } from "@/store/router";
import { ROLE_PERMISSIONS } from "@/config/rolePermissions";
import { equipmentStatusConfig, BOOKING_STATUS_CONFIG } from "@/lib/status";

import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { CardSkeleton } from "@/components/shared/Skeletons";
import {
  CalendarView,
  type CalendarEventItem,
} from "@/components/shared/CalendarView";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Booking, Equipment } from "@/types";

export default function EquipmentDetailPage() {
  const { path, navigate } = useRouter();
  const { user } = useAuthStore();

  const match = matchRoute("/equipment/:id", path);
  const id = match ? Number(match.id) : NaN;
  const hasId = Number.isFinite(id) && id > 0;

  // Single-equipment detail via GET /api/equipment/get-equipment/{id} (#24)
  const {
    data: equipment,
    loading,
    error,
    refetch,
  } = useAsync(
    () =>
      hasId
        ? equipmentApi.getEquipment(id)
        : Promise.resolve<Equipment | undefined>(undefined),
    [id],
  );

  // Bookings for the current ISO week (Mon–Sun), used by the calendar
  const now = React.useMemo(() => new Date(), []);
  const weekStart = React.useMemo(
    () => startOfWeek(now, { weekStartsOn: 1 }),
    [now],
  );
  const weekEnd = React.useMemo(
    () => endOfDay(endOfWeek(now, { weekStartsOn: 1 })),
    [now],
  );

  // Bookings for the current ISO week (Mon–Sun).
  // The real backend's calendar endpoint is RESEARCHER-only + user-scoped (returns
  // the user's OWN bookings). LAB_MANAGER uses /all + client filter by equipment.
  const isResearcher = user?.role === "RESEARCHER";
  const isManager = user?.role === "LAB_MANAGER";
  const { data: bookings, loading: bookingsLoading } = useAsync(
    async () => {
      if (!hasId) return [] as Booking[];
      if (isResearcher && user) {
        const all = await bookingApi.calendar({
          userId: user.id,
          start: weekStart.toISOString(),
          end: weekEnd.toISOString(),
        });
        // Filter to this equipment (calendar returns all the user's bookings)
        return all.filter((b) => b.equipment.id === id);
      }
      if (isManager) {
        const all = await bookingApi.allBookings();
        const ws = weekStart.getTime();
        const we = weekEnd.getTime();
        return all.filter(
          (b) =>
            b.equipment.id === id &&
            new Date(b.endTime).getTime() >= ws &&
            new Date(b.startTime).getTime() <= we,
        );
      }
      return [] as Booking[];
    },
    [id, weekStart, weekEnd, isResearcher, isManager, user?.id],
  );

  const events: CalendarEventItem[] = React.useMemo(() => {
    return (bookings ?? []).map((b) => ({
      id: b.id,
      start: b.startTime,
      end: b.endTime,
      title: b.equipment.equipmentName,
      subtitle: b.user.username,
      status: b.status,
    }));
  }, [bookings]);

  const canBook = user ? ROLE_PERMISSIONS[user.role].canBook : false;
  const isLabManager = user?.role === "LAB_MANAGER";
  const backHref = isLabManager ? "/manager/equipment" : "/equipment";

  const onBook = () => {
    if (!equipment) return;
    navigate(`/bookings/new?equipmentId=${equipment.id}`);
  };

  const onSelectEvent = (ev: CalendarEventItem) => {
    try {
      const s = parseISO(ev.start);
      const e = parseISO(ev.end);
      toast(
        `${format(s, "EEE, d MMM · HH:mm")}–${format(e, "HH:mm")} · ${ev.title} (${ev.status})`,
      );
    } catch {
      toast(`${ev.title} · ${ev.status}`);
    }
  };

  // ---- Render branches -----------------------------------------------------

  // Route doesn't match /equipment/:id
  if (!hasId) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={backHref} />
        <EmptyState
          icon={Boxes}
          title="Equipment not found"
          description="The equipment you’re looking for doesn’t exist or has been removed."
          action={
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => navigate(backHref)}
            >
              Back to equipment
            </Button>
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={backHref} />
        <CardSkeleton className="rounded-2xl" />
        <CardSkeleton className="rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={backHref} />
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            We couldn’t load this equipment.
          </p>
          {error && (
            <p className="text-xs text-muted-foreground/80">{error}</p>
          )}
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg"
          >
            <RotateCw className="size-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={backHref} />
        <EmptyState
          icon={Boxes}
          title="Equipment not found"
          description="This equipment may have been removed. Browse the catalog to find another."
          action={
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => navigate(backHref)}
            >
              Back to equipment
            </Button>
          }
        />
      </div>
    );
  }

  const statusCfg = equipmentStatusConfig(equipment.status);
  const bookable = equipment.status === "AVAILABLE";

  let acquisitionLabel = "—";
  try {
    if (equipment.acquisitionDate) {
      acquisitionLabel = format(parseISO(equipment.acquisitionDate), "d MMM yyyy");
    }
  } catch {
    acquisitionLabel = equipment.acquisitionDate;
  }

  // Show only statuses that are actually present (or all if none) for the legend
  const legendStatuses = events.length
    ? Array.from(new Set(events.map((e) => e.status)))
    : ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={backHref} />

      {/* Detail card */}
      <Card className="overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft">
        {/* Gradient icon header */}
        <div className="relative flex flex-col gap-4 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/15 shadow-soft">
              <CategoryIcon category={equipment.category} className="size-7" />
            </div>
            <StatusBadge status={equipment.status} type="equipment" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
              {equipment.equipmentName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                <Tag className="size-3" />
                {equipment.category}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                <Hash className="size-3" />
                {equipment.serial}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-1 gap-3 px-5 py-5 sm:grid-cols-2 sm:px-7 sm:py-6">
          <MetaRow icon={Building2} label="Institution" value={equipment.institution} />
          <MetaRow icon={UserCircle} label="Added by" value={equipment.addedBy} />
          <MetaRow icon={CalendarDays} label="Acquired" value={acquisitionLabel} />
          <MetaRow
            icon={Boxes}
            label="Status"
            value={statusCfg.label}
          />
        </div>

        {/* Description */}
        <div className="border-t border-border/60 px-5 py-5 sm:px-7 sm:py-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Description
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {equipment.description || "No description provided."}
          </p>
        </div>

        {/* Book / availability banner */}
        <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          {canBook && bookable ? (
            <>
              <p className="text-sm text-muted-foreground">
                This equipment is available — book a slot to use it.
              </p>
              <Button
                size="lg"
                onClick={onBook}
                className="rounded-xl px-5 shadow-soft"
              >
                Book this equipment
              </Button>
            </>
          ) : canBook && !bookable ? (
            <div className="flex w-full items-center justify-between gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="inline-flex cursor-help items-center gap-1.5 text-sm text-muted-foreground">
                    <Info className="size-3.5" />
                    This equipment is currently{" "}
                    <span className="font-medium text-foreground/80">
                      {statusCfg.label}
                    </span>{" "}
                    and can’t be booked.
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  Only AVAILABLE equipment can be booked. Try again later or pick a different item.
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {user
                ? "Booking is available to researchers from the equipment catalog."
                : "Sign in as a researcher to book this equipment."}
            </p>
          )}
        </div>
      </Card>

      {/* Availability calendar — role-aware */}
      {user && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {isManager ? "Bookings this week" : "My bookings this week"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isManager
                  ? "All bookings on this equipment for the current week (Mon–Sun)."
                  : "Your bookings on this equipment for the current week (Mon–Sun)."}
              </p>
            </div>
            {bookingsLoading && (
              <span className="text-xs text-muted-foreground">Loading bookings…</span>
            )}
          </div>

        <CalendarView
          events={events}
          onSelect={onSelectEvent}
          emptyHint="No bookings this week."
        />

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">Legend:</span>
          {legendStatuses.map((s) => {
            const cfg = BOOKING_STATUS_CONFIG[s as keyof typeof BOOKING_STATUS_CONFIG];
            if (!cfg) return null;
            return (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
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
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small internal helpers
// ---------------------------------------------------------------------------

function BackLink({ href }: { href: string }) {
  const { navigate } = useRouter();
  return (
    <button
      onClick={() => navigate(href)}
      className="group inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      Equipment
    </button>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground ring-1 ring-border/50">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
