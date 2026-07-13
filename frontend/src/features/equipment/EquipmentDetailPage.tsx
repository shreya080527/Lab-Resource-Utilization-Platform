
import * as React from "react";
import {
  ArrowLeft,
  RotateCw,
  Hash,
  Building2,
  UserCircle,
  CalendarDays,
  Info,
  Boxes,
  X,
  Plus,
  FileText,
  Download,
  Trash2,
  History,
  Tag as TagIcon,
  Wrench,
  ListOrdered,
  Calendar as CalendarIcon,
  Loader2,
  AlertTriangle,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  endOfDay,
  startOfDay,
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { toast } from "sonner";

import { useAsync } from "@/hooks/use-async";
import { equipmentApi } from "@/lib/api/equipmentApi";
import { toBackendDateTime } from "@/lib/constants";
import { bookingApi, waitlistApi } from "@/lib/api/bookingApi";
import { useAuthStore } from "@/store/authStore";
import { useRouter, matchRoute } from "@/store/router";
import { ROLE_PERMISSIONS } from "@/config/rolePermissions";
import {
  equipmentStatusConfig,
  bookingStatusConfig,
} from "@/lib/status";

import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { CardSkeleton, ListSkeleton } from "@/components/shared/Skeletons";
import {
  CalendarView,
  type CalendarEventItem,
} from "@/components/shared/CalendarView";
import { BookingDateGrid } from "@/components/shared/BookingDateGrid";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import type {
  Equipment,
  EquipmentDocument,
  CalibrationRecord,
  CalibrationRecordType,
  DocumentType,
  BookingAudit,
  WaitlistEntry,
  Booking,
} from "@/types";

// ---------------------------------------------------------------------------
// Constants — Select option lists (string-valued, converted at API boundary)
// ---------------------------------------------------------------------------

const CALIBRATION_RECORD_TYPES: CalibrationRecordType[] = [
  "CALIBRATION",
  "CERTIFICATION",
  "INSPECTION",
  "MAINTENANCE_CHECK",
];

const CALIBRATION_RESULTS = ["PASS", "FAIL", "N/A"] as const;

const DOCUMENT_TYPES: DocumentType[] = [
  "MANUAL",
  "DATASHEET",
  "SPEC_SHEET",
  "CERTIFICATE",
  "OTHER",
];

function recordTypeLabel(t: CalibrationRecordType): string {
  return t
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function documentTypeLabel(t: DocumentType): string {
  return t
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EquipmentDetailPage() {
  const { path, navigate } = useRouter();
  const { user } = useAuthStore();

  const match = matchRoute("/equipment/:id", path);
  const id = match ? Number(match.id) : NaN;
  const hasId = Number.isFinite(id) && id > 0;

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

  const isLabManager = user?.role === "LAB_MANAGER";
  const canManage =
    user?.role === "LAB_MANAGER" || user?.role === "SYSTEM_ADMIN";
  const canBook = user ? ROLE_PERMISSIONS[user.role].canBook : false;
  const backHref = isLabManager ? "/manager/equipment" : "/equipment";

  // ---- Render branches ---------------------------------------------------

  if (!hasId) {
    return <NotFoundShell backHref={backHref} />;
  }

  if (loading) {
    return <LoadingShell backHref={backHref} />;
  }

  if (error) {
    return (
      <ErrorShell backHref={backHref} error={error} refetch={refetch} />
    );
  }

  if (!equipment) {
    return <NotFoundShell backHref={backHref} />;
  }

  const bookable = equipment.status === "AVAILABLE";

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={backHref} />

      <HeaderCard equipment={equipment} />

      <Tabs defaultValue="overview" className="gap-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-9">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="calibration">Calibration</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            {isLabManager && <TabsTrigger value="audit">Audit Trail</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0">
          <OverviewTab
            equipment={equipment}
            canBook={canBook}
            bookable={bookable}
            navigate={navigate}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <CalendarTab equipmentId={equipment.id} />
        </TabsContent>

        <TabsContent value="calibration" className="mt-0">
          <CalibrationTab equipmentId={equipment.id} canManage={canManage} />
        </TabsContent>

        <TabsContent value="documents" className="mt-0">
          <DocumentsTab equipmentId={equipment.id} canManage={canManage} />
        </TabsContent>

        <TabsContent value="tags" className="mt-0">
          <TagsTab
            equipment={equipment}
            canManage={canManage}
            onEquipmentChanged={refetch}
          />
        </TabsContent>

        <TabsContent value="waitlist" className="mt-0">
          <WaitlistTab equipmentId={equipment.id} isLabManager={isLabManager} />
        </TabsContent>

        {isLabManager && (
          <TabsContent value="audit" className="mt-0">
            <AuditTab equipmentId={equipment.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Always-visible header card (gradient icon + status + name + chips)
// ---------------------------------------------------------------------------

function HeaderCard({ equipment }: { equipment: Equipment }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft">
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
              <Boxes className="size-3" />
              {equipment.category}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
              <Hash className="size-3" />
              {equipment.serial}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Overview (metadata grid + description + book banner)
// ---------------------------------------------------------------------------

function OverviewTab({
  equipment,
  canBook,
  bookable,
  navigate,
}: {
  equipment: Equipment;
  canBook: boolean;
  bookable: boolean;
  navigate: (href: string) => void;
}) {
  const { user } = useAuthStore();
  const statusCfg = equipmentStatusConfig(equipment.status);

  let acquisitionLabel = "—";
  try {
    if (equipment.acquisitionDate) {
      acquisitionLabel = format(parseISO(equipment.acquisitionDate), "d MMM yyyy");
    }
  } catch {
    acquisitionLabel = equipment.acquisitionDate;
  }

  const onBook = () => navigate(`/bookings/new?equipmentId=${equipment.id}`);

  return (
    <div className="flex flex-col gap-4">
      {/* Details metadata grid */}
      <Card className="rounded-2xl border-border/60 p-5 shadow-soft sm:p-6">
        <h3 className="mb-4 text-base font-semibold tracking-tight text-foreground">
          Details
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetaRow
            icon={Building2}
            label="Institution"
            value={equipment.institution?.name ?? "—"}
          />
          <MetaRow
            icon={Building2}
            label="Department"
            value={equipment.department?.name ?? "—"}
          />
          <MetaRow
            icon={UserCircle}
            label="Added by"
            value={equipment.addedByUsername ?? "—"}
          />
          <MetaRow
            icon={CalendarDays}
            label="Acquired"
            value={acquisitionLabel}
          />
          <MetaRow icon={Boxes} label="Status" value={statusCfg.label} />
          <MetaRow
            icon={TagIcon}
            label="Tags"
            value={
              equipment.tags.length ? (
                <div className="flex flex-wrap gap-1">
                  {equipment.tags.map((t) => (
                    <Badge key={t.id} variant="secondary" className="rounded-full">
                      {t.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">No tags</span>
              )
            }
          />
        </div>
      </Card>

      {/* Description */}
      <Card className="rounded-2xl border-border/60 p-5 shadow-soft sm:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Description
        </h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {equipment.description || "No description provided."}
        </p>
      </Card>

      {/* Book / availability banner */}
      <Card className="flex flex-col gap-3 rounded-2xl border-border/60 bg-muted/20 p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-6">
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
        ) : (
          <p className="text-sm text-muted-foreground">
            {user
              ? "Booking is available to researchers from the equipment catalog."
              : "Sign in as a researcher to book this equipment."}
          </p>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Calendar (equipment-scoped weekly bookings, all roles)
// ---------------------------------------------------------------------------

function CalendarTab({ equipmentId }: { equipmentId: number }) {
  const now = React.useMemo(() => new Date(), []);

  // Weekly window for the time-grid calendar — Mon–Sun, time-boxed.
  const weekStart = React.useMemo(
    () => startOfWeek(now, { weekStartsOn: 1 }),
    [now],
  );
  const weekEnd = React.useMemo(
    () => endOfDay(endOfWeek(now, { weekStartsOn: 1 })),
    [now],
  );
  const startIso = toBackendDateTime(weekStart);
  const endIso = toBackendDateTime(weekEnd);

  // Wider window for the GitHub-style date grid — start of this month to end
  // of next month (so users can browse 2 months of availability).
  const gridStart = React.useMemo(
    () => startOfWeek(startOfMonth(now), { weekStartsOn: 1 }),
    [now],
  );
  const gridEnd = React.useMemo(
    () => endOfDay(endOfWeek(endOfMonth(addMonths(now, 1)), { weekStartsOn: 1 })),
    [now],
  );
  const gridStartIso = toBackendDateTime(gridStart);
  const gridEndIso = toBackendDateTime(gridEnd);

  // Weekly bookings for the time-grid calendar.
  const {
    data: bookings,
    loading,
    error,
    refetch,
  } = useAsync(
    () => bookingApi.equipmentCalendar({ equipmentId, start: startIso, end: endIso }),
    [equipmentId, startIso, endIso],
  );

  // Wider bookings for the date-grid (2 months). Separate fetch so the weekly
  // calendar stays fast.
  const {
    data: gridBookings,
    loading: gridLoading,
  } = useAsync(
    () => bookingApi.equipmentCalendar({ equipmentId, start: gridStartIso, end: gridEndIso }),
    [equipmentId, gridStartIso, gridEndIso],
  );

  const events: CalendarEventItem[] = React.useMemo(() => {
    return (bookings ?? []).map((b: Booking) => ({
      id: b.id,
      start: b.startTime,
      end: b.endTime,
      title: b.equipmentName,
      subtitle: b.username,
      status: b.status,
    }));
  }, [bookings]);

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

  const legendStatuses = events.length
    ? Array.from(new Set(events.map((e) => e.status)))
    : ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

  return (
    <div className="flex flex-col gap-6">
      {/* Weekly time-grid calendar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
              <CalendarIcon className="size-4 text-primary" />
              Bookings this week
            </h3>
            <p className="text-sm text-muted-foreground">
              All bookings on this equipment for the current week (Mon–Sun).
            </p>
          </div>
          {loading && (
            <span className="text-xs text-muted-foreground">Loading bookings…</span>
          )}
        </div>

        {loading && events.length === 0 ? (
          <ListSkeleton count={2} />
        ) : error && events.length === 0 ? (
          <ErrorInline error={error} onRetry={refetch} />
        ) : (
          <>
            <CalendarView
              events={events}
              onSelect={onSelectEvent}
              emptyHint="No bookings this week."
            />
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5">
              <span className="text-xs font-medium text-muted-foreground">
                Legend:
              </span>
              {legendStatuses.map((s) => {
                const cfg = bookingStatusConfig(s);
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
          </>
        )}
      </div>

      {/* GitHub-style date grid — shows booked/free days across 2 months */}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <CalendarIcon className="size-4 text-primary" />
            Availability overview
          </h3>
          <p className="text-sm text-muted-foreground">
            Green = available, blue = booked, amber = pending. Click any day to
            see its bookings.
          </p>
        </div>
        {gridLoading ? (
          <CardSkeleton className="rounded-2xl" />
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <BookingDateGrid bookings={gridBookings ?? []} />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Calibration & Certification
// ---------------------------------------------------------------------------

function CalibrationTab({
  equipmentId,
  canManage,
}: {
  equipmentId: number;
  canManage: boolean;
}) {
  const {
    data: records,
    loading,
    error,
    refetch,
  } = useAsync(
    () => equipmentApi.listCalibrations(equipmentId),
    [equipmentId],
  );

  // Due-in-next-30-days warning.
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const todayPlus30 = React.useMemo(() => endOfDay(addDays(today, 30)), [today]);
  const fromIso = toBackendDateTime(today);
  const toIso = toBackendDateTime(todayPlus30);
  const {
    data: dueRecords,
  } = useAsync(
    () => equipmentApi.calibrationsDue(equipmentId, fromIso, toIso),
    [equipmentId, fromIso, toIso],
  );

  const [addOpen, setAddOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Due warning */}
      {dueRecords && dueRecords.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm">
            <span className="font-semibold">{dueRecords.length}</span>{" "}
            calibration{dueRecords.length === 1 ? "" : "s"} due in the next 30 days.
            Review the records below to schedule a follow-up.
          </p>
        </div>
      )}

      <Card className="rounded-2xl border-border/60 p-5 shadow-soft sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
            <Wrench className="size-4 text-primary" />
            Calibration & Certification Records
          </h3>
          {canManage && (
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              className="gap-1.5 rounded-lg"
            >
              <Plus className="size-4" />
              Add Calibration Record
            </Button>
          )}
        </div>

        {loading ? (
          <ListSkeleton count={3} />
        ) : error ? (
          <ErrorInline error={error} onRetry={refetch} />
        ) : !records || records.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No calibration records yet"
            description="Add the first calibration, certification, inspection, or maintenance check to start tracking this equipment's history."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Performed Date</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Certificate Ref</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md">
                        {recordTypeLabel(r.recordType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(r.performedDate)}</TableCell>
                    <TableCell>{formatDate(r.nextDueDate)}</TableCell>
                    <TableCell>{r.performedBy ?? "—"}</TableCell>
                    <TableCell>
                      {r.result ? (
                        <ResultBadge result={r.result} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.certificateRef ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[20rem]">
                      {r.notes ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {canManage && (
        <AddCalibrationDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          equipmentId={equipmentId}
          onSaved={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}

function ResultBadge({ result }: { result: string }) {
  const variant =
    result === "PASS"
      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25"
      : result === "FAIL"
        ? "bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/25"
        : "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-500/25";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variant}`}
    >
      {result}
    </span>
  );
}

function AddCalibrationDialog({
  open,
  onOpenChange,
  equipmentId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  equipmentId: number;
  onSaved: () => void;
}) {
  const [recordType, setRecordType] = React.useState<CalibrationRecordType>(
    "CALIBRATION",
  );
  const [performedDate, setPerformedDate] = React.useState("");
  const [nextDueDate, setNextDueDate] = React.useState("");
  const [performedBy, setPerformedBy] = React.useState("");
  const [result, setResult] = React.useState<string>("PASS");
  const [certificateRef, setCertificateRef] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const reset = () => {
    setRecordType("CALIBRATION");
    setPerformedDate("");
    setNextDueDate("");
    setPerformedBy("");
    setResult("PASS");
    setCertificateRef("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!performedDate) {
      toast.error("Performed date is required");
      return;
    }
    setSubmitting(true);
    try {
      await equipmentApi.addCalibration(equipmentId, {
        recordType,
        performedDate,
        nextDueDate: nextDueDate || undefined,
        performedBy: performedBy || undefined,
        result: result === "N/A" ? "N/A" : result,
        certificateRef: certificateRef || undefined,
        notes: notes || undefined,
      });
      toast.success("Calibration record added");
      reset();
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(errMessage(e) ?? "Failed to add calibration record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Calibration Record</DialogTitle>
          <DialogDescription>
            Track a calibration, certification, inspection, or maintenance check.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Record type" className="sm:col-span-2">
            <Select
              value={recordType}
              onValueChange={(v) => setRecordType(v as CalibrationRecordType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALIBRATION_RECORD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {recordTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Performed date">
            <Input
              type="date"
              value={performedDate}
              onChange={(e) => setPerformedDate(e.target.value)}
            />
          </Field>

          <Field label="Next due date">
            <Input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
            />
          </Field>

          <Field label="Performed by">
            <Input
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              placeholder="e.g. Jane Doe"
            />
          </Field>

          <Field label="Result">
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALIBRATION_RESULTS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Certificate ref" className="sm:col-span-2">
            <Input
              value={certificateRef}
              onChange={(e) => setCertificateRef(e.target.value)}
              placeholder="Optional certificate / reference number"
            />
          </Field>

          <Field label="Notes" className="sm:col-span-2">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={3}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1.5 rounded-lg"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Save record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Documents & Specs
// ---------------------------------------------------------------------------

function DocumentsTab({
  equipmentId,
  canManage,
}: {
  equipmentId: number;
  canManage: boolean;
}) {
  const {
    data: documents,
    loading,
    error,
    refetch,
  } = useAsync(
    () => equipmentApi.listDocuments(equipmentId),
    [equipmentId],
  );

  const [addOpen, setAddOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<EquipmentDocument | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await equipmentApi.deleteDocument(equipmentId, deleteTarget.id);
      toast.success("Document deleted");
      setDeleteTarget(null);
      refetch();
    } catch (e) {
      toast.error(errMessage(e) ?? "Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl border-border/60 p-5 shadow-soft sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
            <FileText className="size-4 text-primary" />
            Documents & Specs
          </h3>
          {canManage && (
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              className="gap-1.5 rounded-lg"
            >
              <Plus className="size-4" />
              Add Document
            </Button>
          )}
        </div>

        {loading ? (
          <ListSkeleton count={2} />
        ) : error ? (
          <ErrorInline error={error} onRetry={refetch} />
        ) : !documents || documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents uploaded"
            description="Add manuals, datasheets, spec sheets, or certificates to keep everything linked to this equipment."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-soft"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground ring-1 ring-border/50">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {doc.docName}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="rounded-md">
                        {documentTypeLabel(doc.docType)}
                      </Badge>
                      <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="gap-1.5 rounded-lg"
                  >
                    <a href={doc.docUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="size-3.5" />
                      Download
                      <ExternalLink className="size-3 opacity-60" />
                    </a>
                  </Button>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteTarget(doc)}
                      className="gap-1.5 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canManage && (
        <AddDocumentDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          equipmentId={equipmentId}
          onSaved={() => refetch()}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        title="Delete document?"
        description={
          deleteTarget
            ? `“${deleteTarget.docName}” will be permanently removed from this equipment.`
            : ""
        }
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

function AddDocumentDialog({
  open,
  onOpenChange,
  equipmentId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  equipmentId: number;
  onSaved: () => void;
}) {
  const [docName, setDocName] = React.useState("");
  const [docUrl, setDocUrl] = React.useState("");
  const [docType, setDocType] = React.useState<DocumentType>("MANUAL");
  const [submitting, setSubmitting] = React.useState(false);

  const reset = () => {
    setDocName("");
    setDocUrl("");
    setDocType("MANUAL");
  };

  const handleSubmit = async () => {
    if (!docName.trim() || !docUrl.trim()) {
      toast.error("Document name and URL are required");
      return;
    }
    setSubmitting(true);
    try {
      await equipmentApi.addDocument(equipmentId, {
        docName: docName.trim(),
        docUrl: docUrl.trim(),
        docType,
      });
      toast.success("Document added");
      reset();
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(errMessage(e) ?? "Failed to add document");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
          <DialogDescription>
            Link a manual, datasheet, spec sheet, certificate, or other file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field label="Document name">
            <Input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Operator Manual v2"
            />
          </Field>
          <Field label="Document URL">
            <Input
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Document type">
            <Select
              value={docType}
              onValueChange={(v) => setDocType(v as DocumentType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {documentTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1.5 rounded-lg"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Add document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Tab 5 — Tags (removable badges + inline add + datalist suggestions)
// ---------------------------------------------------------------------------

function TagsTab({
  equipment,
  canManage,
  onEquipmentChanged,
}: {
  equipment: Equipment;
  canManage: boolean;
  onEquipmentChanged: () => void;
}) {
  const {
    data: allTags,
  } = useAsync(() => equipmentApi.listAllTags(), []);

  const [newTag, setNewTag] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<number | null>(null);

  const handleAdd = async () => {
    const name = newTag.trim();
    if (!name) return;
    setAdding(true);
    try {
      await equipmentApi.addTags(equipment.id, [name]);
      toast.success(`Tag “${name}” added`);
      setNewTag("");
      onEquipmentChanged();
    } catch (e) {
      toast.error(errMessage(e) ?? "Failed to add tag");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (tagId: number, tagName: string) => {
    setRemovingId(tagId);
    try {
      await equipmentApi.removeTag(equipment.id, tagId);
      toast.success(`Tag “${tagName}” removed`);
      onEquipmentChanged();
    } catch (e) {
      toast.error(errMessage(e) ?? "Failed to remove tag");
    } finally {
      setRemovingId(null);
    }
  };

  const datalistId = `tag-suggestions-${equipment.id}`;

  return (
    <Card className="rounded-2xl border-border/60 p-5 shadow-soft sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
        <TagIcon className="size-4 text-primary" />
        Tags
      </h3>

      {equipment.tags.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="No tags yet"
          description="Add tags to make this equipment easier to discover and filter."
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {equipment.tags.map((t) => (
            <Badge
              key={t.id}
              variant="secondary"
              className="gap-1 rounded-full py-1 pl-2.5 pr-1.5"
            >
              {t.name}
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleRemove(t.id, t.name)}
                  disabled={removingId === t.id}
                  className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-50"
                  aria-label={`Remove tag ${t.name}`}
                >
                  {removingId === t.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <X className="size-3" />
                  )}
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {canManage && (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field label="Add a tag" className="flex-1">
            <Input
              list={datalistId}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="Type a tag name…"
              disabled={adding}
            />
            <datalist id={datalistId}>
              {(allTags ?? [])
                .filter(
                  (t) => !equipment.tags.some((et) => et.id === t.id),
                )
                .map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
            </datalist>
          </Field>
          <Button
            onClick={handleAdd}
            disabled={adding || !newTag.trim()}
            className="gap-1.5 rounded-lg sm:w-auto"
          >
            {adding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add tag
          </Button>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Tab 6 — Waitlist
// ---------------------------------------------------------------------------

function WaitlistTab({
  equipmentId,
  isLabManager,
}: {
  equipmentId: number;
  isLabManager: boolean;
}) {
  const {
    data: entries,
    loading,
    error,
    refetch,
  } = useAsync(() => waitlistApi.byEquipment(equipmentId), [equipmentId]);

  const [promoting, setPromoting] = React.useState(false);

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const res = await waitlistApi.promote(equipmentId);
      if (res?.promoted) {
        toast.success("Next entry promoted to a booking");
      } else {
        toast.info(res?.message ?? "No entry was promoted");
      }
      refetch();
    } catch (e) {
      toast.error(errMessage(e) ?? "Failed to promote next entry");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
          <ListOrdered className="size-4 text-primary" />
          Waitlist
        </h3>
        {isLabManager && entries && entries.length > 0 && (
          <Button
            size="sm"
            onClick={handlePromote}
            disabled={promoting}
            className="gap-1.5 rounded-lg"
          >
            {promoting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Promote Next
          </Button>
        )}
      </div>

      {loading ? (
        <ListSkeleton count={2} />
      ) : error ? (
        <ErrorInline error={error} onRetry={refetch} />
      ) : !entries || entries.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No waitlist entries"
          description="When this equipment is fully booked, researchers can join a waitlist for their requested slot."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Position</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Start – End</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-full">
                      #{w.position}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {w.username}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(w.startTime)} – {formatDateTime(w.endTime)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(w.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Tab 7 — Audit Trail (LAB_MANAGER only)
// ---------------------------------------------------------------------------

function AuditTab({ equipmentId }: { equipmentId: number }) {
  const {
    data: events,
    loading,
    error,
    refetch,
  } = useAsync(() => bookingApi.equipmentAudit(equipmentId), [equipmentId]);

  return (
    <Card className="rounded-2xl border-border/60 p-5 shadow-soft sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
        <History className="size-4 text-primary" />
        Audit Trail
      </h3>

      {loading ? (
        <ListSkeleton count={3} />
      ) : error ? (
        <ErrorInline error={error} onRetry={refetch} />
      ) : !events || events.length === 0 ? (
        <EmptyState
          icon={History}
          title="No audit events yet"
          description="Status changes on this equipment's bookings will be recorded here as they happen."
        />
      ) : (
        <ol className="relative flex flex-col gap-0">
          {events.map((ev, idx) => {
            const fromCfg = ev.fromStatus ? bookingStatusConfig(ev.fromStatus) : null;
            const toCfg = bookingStatusConfig(ev.toStatus);
            const isLast = idx === events.length - 1;
            return (
              <li key={ev.id} className="relative flex gap-3 pb-5">
                {/* Timeline spine */}
                <div className="relative flex flex-col items-center">
                  <span className="mt-1 flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                    <History className="size-3.5" />
                  </span>
                  {!isLast && (
                    <span className="mt-1 w-px flex-1 bg-border/70" aria-hidden />
                  )}
                </div>
                {/* Body */}
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-md">
                      {ev.action}
                    </Badge>
                    {fromCfg ? (
                      <>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${fromCfg.chip}`}
                        >
                          <span className={`size-1.5 rounded-full ${fromCfg.dot}`} />
                          {fromCfg.label}
                        </span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${toCfg.chip}`}
                        >
                          <span className={`size-1.5 rounded-full ${toCfg.dot}`} />
                          {toCfg.label}
                        </span>
                      </>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${toCfg.chip}`}
                      >
                        <span className={`size-1.5 rounded-full ${toCfg.dot}`} />
                        {toCfg.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    By <span className="font-medium text-foreground/80">{ev.performedByUsername}</span>
                    {" · "}
                    {formatDateTime(ev.createdAt)}
                  </p>
                  {ev.notes && (
                    <p className="mt-1 text-sm text-foreground/90">{ev.notes}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared shells + helpers
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

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5">{label}</Label>
      {children}
    </div>
  );
}

function ErrorInline({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">
        Something went wrong loading this section.
      </p>
      {error && <p className="text-xs text-muted-foreground/80">{error}</p>}
      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="gap-1.5 rounded-lg"
      >
        <RotateCw className="size-3.5" />
        Retry
      </Button>
    </div>
  );
}

function LoadingShell({ backHref }: { backHref: string }) {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href={backHref} />
      <CardSkeleton className="rounded-2xl" />
      <CardSkeleton className="rounded-2xl" />
    </div>
  );
}

function NotFoundShell({ backHref }: { backHref: string }) {
  const { navigate } = useRouter();
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

function ErrorShell({
  backHref,
  error,
  refetch,
}: {
  backHref: string;
  error: string;
  refetch: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href={backHref} />
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-14 text-center">
        <p className="text-sm text-muted-foreground">
          We couldn’t load this equipment.
        </p>
        {error && <p className="text-xs text-muted-foreground/80">{error}</p>}
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

// ---------------------------------------------------------------------------
// Date formatting helpers (safe against bad input)
// ---------------------------------------------------------------------------

function errMessage(e: unknown): string | undefined {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return undefined;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "d MMM yyyy · HH:mm");
  } catch {
    return iso;
  }
}
