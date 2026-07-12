
import * as React from "react";
import {
  RefreshCw,
  History,
  Search,
  Microscope,
  Hash,
  User,
  CalendarClock,
  ArrowRight,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";

import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { bookingApi } from "@/lib/api/bookingApi";
import { equipmentApi } from "@/lib/api/equipmentApi";
import {
  ACTION_LABELS,
  bookingStatusConfig,
} from "@/lib/status";
import type { BookingAction } from "@/types";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeletons";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { BookingAudit, Equipment } from "@/types";

// ---------------------------------------------------------------------------

const ACTION_ALL = "ALL";

function toTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function actionLabel(action: string): string {
  // Use the canonical ACTION_LABELS if known (these match BookingAction keys),
  // else title-case the raw string.
  if (action in ACTION_LABELS) {
    return ACTION_LABELS[action as BookingAction];
  }
  return toTitle(action);
}

function fmtDateTime(iso: string): string {
  try {
    return format(parseISO(iso), "EEE, dd MMM yyyy · HH:mm");
  } catch {
    return iso;
  }
}

function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message?: unknown }).message);
  }
  return "Something went wrong";
}

// ---------------------------------------------------------------------------
// StatusChip — uses bookingStatusConfig to resolve visual config from a status
// string (handles known BookingStatus values + graceful fallback).
// ---------------------------------------------------------------------------

function StatusChip({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/12 px-2.5 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-zinc-500/20">
        —
      </span>
    );
  }
  const cfg = bookingStatusConfig(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.chip,
      )}
    >
      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Timeline item
// ---------------------------------------------------------------------------

function AuditTimelineItem({
  audit,
  isLast,
}: {
  audit: BookingAudit;
  isLast: boolean;
}) {
  return (
    <li className="relative flex gap-3 pb-6 last:pb-0">
      {/* Vertical rail */}
      <div className="flex flex-col items-center">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
          <History className="size-4" />
        </div>
        {!isLast && (
          <div className="mt-1 w-px flex-1 bg-border/60" aria-hidden="true" />
        )}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge
            variant="secondary"
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
          >
            {actionLabel(audit.action)}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            Booking #{audit.bookingId} · Event #{audit.id}
          </span>
        </div>

        {/* Status transition */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusChip status={audit.fromStatus} />
          <ArrowRight className="size-3.5 text-muted-foreground" />
          <StatusChip status={audit.toStatus} />
        </div>

        {/* Meta */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <User className="size-3" />
            {audit.performedByUsername}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-3" />
            {fmtDateTime(audit.createdAt)}
          </span>
        </div>

        {/* Notes */}
        {audit.notes && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/30 px-3 py-2 text-xs text-foreground/90">
            <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span className="whitespace-pre-wrap">{audit.notes}</span>
          </p>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Mode = "booking" | "equipment";

export default function BookingAuditPage() {
  const [mode, setMode] = React.useState<Mode>("booking");

  // --- By Booking state ---
  const [bookingIdInput, setBookingIdInput] = React.useState("");
  const [bookingId, setBookingId] = React.useState<number | null>(null);

  // --- By Equipment state ---
  const [equipmentId, setEquipmentId] = React.useState<string>("");
  const equipmentAsync = useAsync<Equipment[]>(
    () => equipmentApi.getAllEquipment(),
    [],
  );
  const equipment = equipmentAsync.data ?? [];

  // Auto-select first equipment for the dropdown once it loads.
  React.useEffect(() => {
    if (mode === "equipment" && !equipmentId && equipment.length > 0) {
      setEquipmentId(String(equipment[0].id));
    }
  }, [mode, equipmentId, equipment]);

  // --- Audit fetch (one source of data depending on mode) ---
  const auditAsync = useAsync<BookingAudit[]>(() => {
    if (mode === "booking") {
      if (bookingId === null || !Number.isFinite(bookingId) || bookingId <= 0) {
        return Promise.resolve([]);
      }
      return bookingApi.bookingAudit(bookingId);
    }
    // mode === "equipment"
    const id = Number(equipmentId);
    if (!Number.isFinite(id) || id <= 0) return Promise.resolve([]);
    return bookingApi.equipmentAudit(id);
  }, [mode, bookingId, equipmentId]);

  // --- Client-side filters ---
  const [actionFilter, setActionFilter] = React.useState<string>(ACTION_ALL);
  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");

  const allAudits = auditAsync.data ?? [];

  const actionOptions = React.useMemo(() => {
    const set = new Map<string, string>();
    for (const a of allAudits) set.set(a.action, actionLabel(a.action));
    return Array.from(set.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allAudits]);

  const filtered = React.useMemo(() => {
    let list = allAudits.slice();
    if (actionFilter !== ACTION_ALL) {
      list = list.filter((a) => a.action === actionFilter);
    }
    if (fromDate || toDate) {
      const start = fromDate ? startOfDay(parseISO(fromDate)) : null;
      const end = toDate ? endOfDay(parseISO(toDate)) : null;
      list = list.filter((a) => {
        try {
          const d = parseISO(a.createdAt);
          if (start && end) {
            return isWithinInterval(d, { start, end });
          }
          if (start) return d.getTime() >= start.getTime();
          if (end) return d.getTime() <= end.getTime();
          return true;
        } catch {
          return false;
        }
      });
    }
    return list.sort(
      (a, b) =>
        parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime(),
    );
  }, [allAudits, actionFilter, fromDate, toDate]);

  // --- Handlers ---
  const handleBookingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Number(bookingIdInput.trim());
    if (!Number.isFinite(id) || id <= 0) {
      toast.error("Enter a valid booking ID.");
      return;
    }
    setBookingId(id);
  };

  const clearFilters = () => {
    setActionFilter(ACTION_ALL);
    setFromDate("");
    setToDate("");
  };

  const hasFilters =
    actionFilter !== ACTION_ALL || fromDate !== "" || toDate !== "";

  const loading = auditAsync.loading && !auditAsync.data && bookingId !== null;
  const error = auditAsync.error;
  const showEmpty = !loading && !error && filtered.length === 0;
  const hasSearched = mode === "booking" ? bookingId !== null : !!equipmentId;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Trail"
        description="Track every booking lifecycle change — approvals, cancellations, no-shows, and more."
        actions={
          (hasSearched || mode === "equipment") && (
            <Button
              variant="outline"
              size="sm"
              onClick={auditAsync.refetch}
              className="gap-1.5"
            >
              <RefreshCw
                className={cn(
                  "size-3.5",
                  auditAsync.loading && "animate-spin",
                )}
              />
              Refresh
            </Button>
          )
        }
      />

      {/* Mode toggle + search */}
      <Card className="glass rounded-2xl border-border/60 p-4 shadow-soft">
        {/* Mode switch */}
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant={mode === "booking" ? "default" : "outline"}
            onClick={() => setMode("booking")}
            className="flex-1 rounded-lg"
          >
            By Booking
          </Button>
          <Button
            size="sm"
            variant={mode === "equipment" ? "default" : "outline"}
            onClick={() => setMode("equipment")}
            className="flex-1 rounded-lg"
          >
            By Equipment
          </Button>
        </div>

        {/* By Booking form */}
        {mode === "booking" && (
          <form
            onSubmit={handleBookingSearch}
            className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <div className="flex flex-1 flex-col gap-1.5">
              <Label
                htmlFor="booking-id"
                className="text-xs font-medium text-muted-foreground"
              >
                Booking ID
              </Label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="booking-id"
                  value={bookingIdInput}
                  onChange={(e) => setBookingIdInput(e.target.value)}
                  placeholder="e.g. 42"
                  inputMode="numeric"
                  className="pl-9"
                />
              </div>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={auditAsync.loading}
              className="gap-1.5 rounded-lg sm:mb-0.5"
            >
              {auditAsync.loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Search className="size-3.5" />
              )}
              Search
            </Button>
          </form>
        )}

        {/* By Equipment picker */}
        {mode === "equipment" && (
          <div className="mt-3 flex flex-col gap-1.5">
            <Label
              htmlFor="equipment-pick"
              className="text-xs font-medium text-muted-foreground"
            >
              Equipment
            </Label>
            <Select
              value={equipmentId}
              onValueChange={setEquipmentId}
              disabled={equipmentAsync.loading}
            >
              <SelectTrigger id="equipment-pick" className="w-full">
                <SelectValue
                  placeholder={
                    equipmentAsync.loading
                      ? "Loading equipment…"
                      : "Select equipment"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((eq) => (
                  <SelectItem key={eq.id} value={String(eq.id)}>
                    {eq.equipmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>

      {/* Client-side filters — only show once there's data to filter */}
      {allAudits.length > 0 && (
        <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Action
              </label>
              <Select
                value={actionFilter}
                onValueChange={setActionFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ACTION_ALL}>All actions</SelectItem>
                  {actionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                From date
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                To date
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
            <span>
              {filtered.length} of {allAudits.length} event
              {allAudits.length === 1 ? "" : "s"}
            </span>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 gap-1.5 text-xs"
              >
                Clear filters
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Body */}
      {!hasSearched && mode === "booking" ? (
        <EmptyState
          icon={History}
          title="Search for an audit trail"
          description="Enter a booking ID above to view its complete lifecycle history."
        />
      ) : loading ? (
        <ListSkeleton count={3} />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn&apos;t load audit trail.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={auditAsync.refetch}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : showEmpty ? (
        <EmptyState
          icon={History}
          title="No audit events found."
          description={
            allAudits.length === 0
              ? "This entity has no recorded lifecycle changes yet."
              : "Try adjusting your filters or date range."
          }
          action={
            allAudits.length > 0 && hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
          <ol className="flex flex-col">
            {filtered.map((audit, idx) => (
              <AuditTimelineItem
                key={audit.id}
                audit={audit}
                isLast={idx === filtered.length - 1}
              />
            ))}
          </ol>
        </Card>
      )}

      {/* Inline footer note */}
      {mode === "equipment" && equipmentAsync.error && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <Microscope className="size-3.5" />
          Couldn&apos;t load equipment list: {equipmentAsync.error}
        </p>
      )}
    </div>
  );
}
