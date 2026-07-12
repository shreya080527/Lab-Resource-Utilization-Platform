
import * as React from "react";
import {
  RefreshCw,
  Search,
  ListOrdered,
  Microscope,
  User,
  CalendarRange,
  Clock,
  ArrowUp,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { waitlistApi } from "@/lib/api/bookingApi";
import { equipmentApi } from "@/lib/api/equipmentApi";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeletons";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

import type { WaitlistEntry, Equipment } from "@/types";

// ---------------------------------------------------------------------------

const EQUIP_ALL = "ALL";

function fmtDate(iso: string, withTime = false): string {
  try {
    const d = parseISO(iso);
    return withTime
      ? format(d, "EEE, dd MMM yyyy · HH:mm")
      : format(d, "EEE, dd MMM yyyy");
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
// Mobile card
// ---------------------------------------------------------------------------

function WaitlistCardRow({
  entry,
  onPromote,
  onRemove,
  busy,
}: {
  entry: WaitlistEntry;
  onPromote: () => void;
  onRemove: () => void;
  busy: "promote" | "remove" | null;
}) {
  return (
    <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
            <Microscope className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {entry.equipmentName}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              <User className="size-3" />
              {entry.username}
            </p>
          </div>
        </div>
        <Badge className="gap-1 rounded-full px-2 py-0.5 text-xs">
          <ListOrdered className="size-3" />
          #{entry.position}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CalendarRange className="size-3" />
          {fmtDate(entry.startTime)}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3" />
          {fmtDate(entry.startTime, true).split("· ")[1] ?? ""}
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarRange className="size-3" />
          {fmtDate(entry.endTime)}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3" />
          Created {fmtDate(entry.createdAt)}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={onPromote}
          disabled={busy !== null}
          className="gap-1.5 rounded-lg"
        >
          {busy === "promote" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ArrowUp className="size-3.5" />
          )}
          Promote
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          disabled={busy !== null}
          className="gap-1.5 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {busy === "remove" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          Remove
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ManagerWaitlistPage() {
  // Waitlist list (all equipment) + equipment list (for the filter dropdown).
  const waitlistAsync = useAsync<WaitlistEntry[]>(
    () => waitlistApi.listAll(),
    [],
  );
  const equipmentAsync = useAsync<Equipment[]>(
    () => equipmentApi.getAllEquipment(),
    [],
  );

  // --- Filters ---
  const [equipFilter, setEquipFilter] = React.useState<string>(EQUIP_ALL);
  const [search, setSearch] = React.useState("");

  // --- Action state ---
  const [busyRow, setBusyRow] = React.useState<
    { id: number; action: "promote" | "remove" } | null
  >(null);
  const [confirmRemove, setConfirmRemove] = React.useState<WaitlistEntry | null>(
    null,
  );

  const equipment = equipmentAsync.data ?? [];

  const filtered = React.useMemo(() => {
    const all = waitlistAsync.data ?? [];
    const q = search.trim().toLowerCase();
    return all
      .filter((e) =>
        equipFilter === EQUIP_ALL
          ? true
          : e.equipmentId === Number(equipFilter),
      )
      .filter((e) => {
        if (!q) return true;
        const name = e.username?.toLowerCase() ?? "";
        const equip = e.equipmentName?.toLowerCase() ?? "";
        return name.includes(q) || equip.includes(q);
      })
      .sort((a, b) => {
        // Group by equipment, then by position asc within each equipment.
        if (a.equipmentId !== b.equipmentId) {
          return a.equipmentName.localeCompare(b.equipmentName);
        }
        return a.position - b.position;
      });
  }, [waitlistAsync.data, equipFilter, search]);

  const totalCount = waitlistAsync.data?.length ?? 0;
  const hasFilters =
    equipFilter !== EQUIP_ALL || search.trim() !== "";

  const clearFilters = () => {
    setEquipFilter(EQUIP_ALL);
    setSearch("");
  };

  // --- Promote ---
  const handlePromote = async (entry: WaitlistEntry) => {
    setBusyRow({ id: entry.id, action: "promote" });
    try {
      const res = await waitlistApi.promote(entry.equipmentId, entry.id);
      toast.success(res?.message || "Promoted next waitlist entry.");
      waitlistAsync.refetch();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusyRow(null);
    }
  };

  // --- Remove (confirmed) ---
  const handleRemove = async (entry: WaitlistEntry) => {
    setBusyRow({ id: entry.id, action: "remove" });
    try {
      await waitlistApi.remove(entry.id);
      toast.success("Waitlist entry removed.");
      waitlistAsync.refetch();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusyRow(null);
    }
  };

  const loading = waitlistAsync.loading && !waitlistAsync.data;
  const error = waitlistAsync.error;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Waitlist Management"
        description="Promote or remove researchers queued for fully-booked equipment."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={waitlistAsync.refetch}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn(
                "size-3.5",
                waitlistAsync.loading && "animate-spin",
              )}
            />
            Refresh
          </Button>
        }
      />

      {/* Filters bar */}
      <Card className="glass rounded-2xl border-border/60 p-4 shadow-soft">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Equipment
            </label>
            <Select
              value={equipFilter}
              onValueChange={setEquipFilter}
              disabled={equipmentAsync.loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EQUIP_ALL}>All equipment</SelectItem>
                {equipment.map((eq) => (
                  <SelectItem key={eq.id} value={String(eq.id)}>
                    {eq.equipmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              Search user
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Username or equipment…"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <span>
            {filtered.length} of {totalCount} entr
            {totalCount === 1 ? "y" : "ies"}
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

      {/* Body */}
      {loading ? (
        <ListSkeleton count={4} />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn&apos;t load waitlist.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={waitlistAsync.refetch}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : totalCount === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No waitlist entries."
          description="When equipment is fully booked, researchers will be queued here for promotion."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try adjusting your filters or search to find what you're looking for."
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop / tablet: table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-4">Position</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry) => {
                    const busy =
                      busyRow && busyRow.id === entry.id
                        ? busyRow.action
                        : null;
                    return (
                      <TableRow key={entry.id} className="align-top">
                        <TableCell className="pl-4">
                          <Badge
                            variant="outline"
                            className="gap-1 rounded-full px-2 py-0.5 text-xs"
                          >
                            <ListOrdered className="size-3" />
                            #{entry.position}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
                              <Microscope className="size-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-foreground">
                                {entry.equipmentName}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                ID #{entry.equipmentId}
                              </span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate text-sm text-foreground">
                              {entry.username}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <CalendarRange className="size-3.5 text-muted-foreground" />
                            {fmtDate(entry.startTime)}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {fmtDate(entry.startTime, true).split("· ")[1] ?? ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <CalendarRange className="size-3.5 text-muted-foreground" />
                            {fmtDate(entry.endTime)}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {fmtDate(entry.endTime, true).split("· ")[1] ?? ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">
                            {fmtDate(entry.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="pr-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePromote(entry)}
                              disabled={busy !== null}
                              className="gap-1.5 rounded-lg"
                            >
                              {busy === "promote" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <ArrowUp className="size-3.5" />
                              )}
                              Promote
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmRemove(entry)}
                              disabled={busy !== null}
                              className="gap-1.5 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              {busy === "remove" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((entry) => {
              const busy =
                busyRow && busyRow.id === entry.id ? busyRow.action : null;
              return (
                <WaitlistCardRow
                  key={entry.id}
                  entry={entry}
                  busy={busy}
                  onPromote={() => handlePromote(entry)}
                  onRemove={() => setConfirmRemove(entry)}
                />
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={(v) => !v && setConfirmRemove(null)}
        title="Remove waitlist entry?"
        description={
          confirmRemove
            ? `This will remove ${confirmRemove.username}'s waitlist entry for ${confirmRemove.equipmentName}. This cannot be undone.`
            : ""
        }
        confirmLabel="Remove"
        destructive
        onConfirm={() =>
          confirmRemove ? handleRemove(confirmRemove) : Promise.resolve()
        }
      />
    </div>
  );
}
