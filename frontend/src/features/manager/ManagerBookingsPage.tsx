
import * as React from "react";
import {
  RefreshCw,
  Search,
  CalendarX2,
  Microscope,
  User,
  Clock,
  CalendarRange,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "@/store/router";
import { useAsync } from "@/hooks/use-async";
import { bookingApi } from "@/lib/api/bookingApi";
import { BOOKING_STATUS_CONFIG } from "@/lib/status";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BookingCard } from "@/components/shared/BookingCard";
import { ActionButtonGroup } from "@/components/shared/ActionButtonGroup";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  Booking,
  BookingAction,
  BookingStatus,
} from "@/types";
import { BOOKING_STATUSES } from "@/types";

// ---------------------------------------------------------------------------

const STATUS_ALL = "ALL";
const EQUIP_ALL = "ALL";

const ACTION_SUCCESS: Record<BookingAction, string> = {
  accept: "Booking accepted",
  reject: "Booking rejected",
  start: "Booking started",
  cancel: "Booking cancelled",
  complete: "Booking completed",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string, withTime = false): string {
  try {
    const d = parseISO(iso);
    return withTime ? format(d, "EEE, dd MMM yyyy · HH:mm") : format(d, "EEE, dd MMM yyyy");
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
// Main page
// ---------------------------------------------------------------------------

export default function ManagerBookingsPage() {
  const user = useAuthStore((s) => s.user);
  const { navigate } = useRouter();

  // All bookings system-wide via GET /api/bookings/all (#25, LAB_MANAGER only).
  const { data, loading, error, refetch } = useAsync(
    () => bookingApi.allBookings(),
    [],
  );

  // --- filter state ---
  const [statusFilter, setStatusFilter] = React.useState<string>(STATUS_ALL);
  const [equipFilter, setEquipFilter] = React.useState<string>(EQUIP_ALL);
  const [search, setSearch] = React.useState<string>("");

  // --- distinct equipment names for the filter dropdown ---
  const equipmentNames = React.useMemo(() => {
    const set = new Set<string>();
    for (const b of data ?? []) set.add(b.equipment.equipmentName);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // --- client-side filtering ---
  const filtered = React.useMemo(() => {
    const all = data ?? [];
    const q = search.trim().toLowerCase();
    return all
      .filter((b) => (statusFilter === STATUS_ALL ? true : b.status === statusFilter))
      .filter((b) =>
        equipFilter === EQUIP_ALL ? true : b.equipment.equipmentName === equipFilter,
      )
      .filter((b) => {
        if (!q) return true;
        const u = b.user;
        return (
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // newest start first
        return parseISO(b.startTime).getTime() - parseISO(a.startTime).getTime();
      });
  }, [data, statusFilter, equipFilter, search]);

  const totalCount = data?.length ?? 0;

  // --- lifecycle action (accept/reject/cancel/complete) ---
  const handleAction = async (action: BookingAction, booking: Booking) => {
    try {
      if (action === "accept") await bookingApi.accept(booking.id);
      else if (action === "reject") await bookingApi.reject(booking.id);
      else if (action === "start") await bookingApi.start(booking.id);
      else if (action === "cancel") await bookingApi.cancel(booking.id);
      else if (action === "complete") await bookingApi.complete(booking.id);
      else return;
      toast.success(ACTION_SUCCESS[action]);
      refetch();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const clearFilters = () => {
    setStatusFilter(STATUS_ALL);
    setEquipFilter(EQUIP_ALL);
    setSearch("");
  };

  const hasFilters =
    statusFilter !== STATUS_ALL || equipFilter !== EQUIP_ALL || search.trim() !== "";

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bookings"
        description="All booking requests across equipment — review, approve, and manage."
        actions={
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5">
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        }
      />

      {/* Filters bar */}
      <Card className="glass rounded-2xl border-border/60 p-4 shadow-soft">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_ALL}>All statuses</SelectItem>
                {BOOKING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {BOOKING_STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Equipment</label>
            <Select value={equipFilter} onValueChange={setEquipFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EQUIP_ALL}>All equipment</SelectItem>
                {equipmentNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              Search requester
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Username or email…"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <span>
            {filtered.length} of {totalCount} booking{totalCount === 1 ? "" : "s"}
          </span>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 gap-1.5 text-xs">
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {/* Loading */}
      {loading ? (
        <ListSkeleton count={5} />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">Couldn’t load bookings.</p>
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5">
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : totalCount === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="No bookings yet"
          description="Booking requests from researchers will show up here for you to review and approve."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try adjusting your filters or search to find what you’re looking for."
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop / tablet: responsive table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-4">Equipment</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id} className="align-top">
                      <TableCell className="pl-4">
                        <button
                          onClick={() => navigate(`/equipment/${b.equipment.id}`)}
                          className="group flex items-center gap-2.5 text-left"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
                            <Microscope className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary">
                              {b.equipment.equipmentName}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {b.equipment.category} · S/N {b.equipment.serial}
                            </span>
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="size-3.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm text-foreground">{b.user.username}</p>
                            <p className="truncate text-xs text-muted-foreground">{b.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <CalendarRange className="size-3.5 text-muted-foreground" />
                          {fmtDate(b.startTime)}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {fmtDate(b.startTime, true).split("· ")[1] ?? ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <CalendarRange className="size-3.5 text-muted-foreground" />
                          {fmtDate(b.endTime)}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {fmtDate(b.endTime, true).split("· ")[1] ?? ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} />
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end">
                          <ActionButtonGroup
                            booking={b}
                            currentUser={user}
                            onAction={(a) => handleAction(a, b)}
                            size="sm"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile: stacked cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((b) => (
              <div key={b.id} className="flex flex-col gap-2">
                <BookingCard
                  booking={b}
                  currentUser={user}
                  showUser
                  onAction={(action, booking) =>
                    handleAction(action as BookingAction, booking)
                  }
                  onViewEquipment={(id) => navigate(`/equipment/${id}`)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

