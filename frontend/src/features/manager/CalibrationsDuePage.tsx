
import * as React from "react";
import {
  RefreshCw,
  ClipboardCheck,
  Microscope,
  CalendarClock,
  User,
  Award,
  FileText,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, differenceInCalendarDays, addDays } from "date-fns";

import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { equipmentApi } from "@/lib/api/equipmentApi";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeletons";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type {
  CalibrationRecord,
  CalibrationRecordType,
  Equipment,
} from "@/types";

// ---------------------------------------------------------------------------

const RECORD_TYPES: CalibrationRecordType[] = [
  "CALIBRATION",
  "CERTIFICATION",
  "INSPECTION",
  "MAINTENANCE_CHECK",
];
const RESULTS = ["PASS", "FAIL", "N/A"] as const;
type CalResult = (typeof RESULTS)[number];

const WINDOW_OPTIONS = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
] as const;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "EEE, dd MMM yyyy");
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

function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

// Row color rules:
//   overdue (nextDueDate < today)   → red
//   ≤7d from today                   → amber
//   ≤30d from today                  → muted
//   else                             → default
function rowVariant(rec: CalibrationRecord): "overdue" | "soon" | "near" | "default" {
  if (!rec.nextDueDate) return "default";
  try {
    const days = differenceInCalendarDays(parseISO(rec.nextDueDate), new Date());
    if (days < 0) return "overdue";
    if (days <= 7) return "soon";
    if (days <= 30) return "near";
    return "default";
  } catch {
    return "default";
  }
}

const ROW_TONE: Record<
  ReturnType<typeof rowVariant>,
  { row: string; chip: string }
> = {
  overdue: {
    row: "bg-rose-500/5 hover:bg-rose-500/10",
    chip:
      "bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/25",
  },
  soon: {
    row: "bg-amber-500/5 hover:bg-amber-500/10",
    chip:
      "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/25",
  },
  near: {
    row: "bg-muted/30 hover:bg-muted/50",
    chip:
      "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-500/25",
  },
  default: {
    row: "hover:bg-muted/30",
    chip:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25",
  },
};

// ---------------------------------------------------------------------------
// Add Calibration Dialog
// ---------------------------------------------------------------------------

interface AddCalibrationForm {
  recordType: CalibrationRecordType;
  performedDate: string;
  nextDueDate: string;
  performedBy: string;
  result: CalResult;
  certificateRef: string;
  notes: string;
}

function AddCalibrationDialog({
  open,
  onOpenChange,
  equipment,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  equipment: Equipment | null;
  onSubmit: (
    body: AddCalibrationForm,
  ) => Promise<void>;
}) {
  const [form, setForm] = React.useState<AddCalibrationForm>({
    recordType: "CALIBRATION",
    performedDate: todayISO(),
    nextDueDate: "",
    performedBy: "",
    result: "PASS",
    certificateRef: "",
    notes: "",
  });
  const [busy, setBusy] = React.useState(false);

  // Reset form when opened fresh for a new equipment.
  React.useEffect(() => {
    if (open) {
      setForm({
        recordType: "CALIBRATION",
        performedDate: todayISO(),
        nextDueDate: "",
        performedBy: "",
        result: "PASS",
        certificateRef: "",
        notes: "",
      });
    }
  }, [open, equipment?.id]);

  const set = <K extends keyof AddCalibrationForm>(
    k: K,
    v: AddCalibrationForm[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment) return;
    if (!form.performedDate) {
      toast.error("Performed date is required.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Mark calibration as done</DialogTitle>
          <DialogDescription>
            {equipment
              ? `Record a calibration for ${equipment.equipmentName}.`
              : "Record a new calibration entry."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Record type</Label>
              <Select
                value={form.recordType}
                onValueChange={(v) =>
                  set("recordType", v as CalibrationRecordType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t
                        .toLowerCase()
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">
                Performed date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={form.performedDate}
                onChange={(e) => set("performedDate", e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Next due date{" "}
                <span className="text-[11px] font-normal">(optional)</span>
              </Label>
              <Input
                type="date"
                value={form.nextDueDate}
                onChange={(e) => set("nextDueDate", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Performed by{" "}
                <span className="text-[11px] font-normal">(optional)</span>
              </Label>
              <Input
                value={form.performedBy}
                onChange={(e) => set("performedBy", e.target.value)}
                placeholder="Technician name"
                maxLength={120}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Result</Label>
              <Select
                value={form.result}
                onValueChange={(v) => set("result", v as CalResult)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESULTS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Certificate ref{" "}
                <span className="text-[11px] font-normal">(optional)</span>
              </Label>
              <Input
                value={form.certificateRef}
                onChange={(e) => set("certificateRef", e.target.value)}
                placeholder="e.g. CAL-2025-0142"
                maxLength={120}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Notes{" "}
              <span className="text-[11px] font-normal">(optional)</span>
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Observations, deviations, follow-up actions…"
              maxLength={500}
              className="min-h-20"
            />
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={busy}
              className="gap-1.5 rounded-lg"
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Save calibration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CalibrationsDuePage() {
  const [windowDays, setWindowDays] = React.useState<string>("30");
  const [tick, setTick] = React.useState(0);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogEquip, setDialogEquip] = React.useState<Equipment | null>(null);

  // --- Fetch equipment list, then batch-fetch calibrations-due per equipment ---
  const equipmentAsync = useAsync<Equipment[]>(
    () => equipmentApi.getAllEquipment(),
    [],
  );

  const equipment = equipmentAsync.data ?? [];

  const calibsAsync = useAsync<CalibrationRecord[]>(() => {
    if (equipment.length === 0) return Promise.resolve([]);
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const endStr = format(addDays(today, Number(windowDays)), "yyyy-MM-dd");
    return Promise.all(
      equipment.map((eq) =>
        equipmentApi
          .calibrationsDue(eq.id, todayStr, endStr)
          .then((recs) => recs)
          .catch(() => [] as CalibrationRecord[]),
      ),
    ).then((buckets) => buckets.flat());
  }, [equipment.length, windowDays, tick]);

  const refetch = () => {
    equipmentAsync.refetch();
    setTick((t) => t + 1);
  };

  // --- Sorted view (Next Due asc; nulls last) ---
  const sorted = React.useMemo(() => {
    const all = calibsAsync.data ?? [];
    return all
      .slice()
      .sort((a, b) => {
        const ad = a.nextDueDate ? parseISO(a.nextDueDate).getTime() : Infinity;
        const bd = b.nextDueDate ? parseISO(b.nextDueDate).getTime() : Infinity;
        return ad - bd;
      });
  }, [calibsAsync.data]);

  // --- Summary stats ---
  const stats = React.useMemo(() => {
    const now = new Date();
    let overdue = 0;
    let dueSoon = 0; // ≤7 days (including overdue)
    for (const r of calibsAsync.data ?? []) {
      if (!r.nextDueDate) continue;
      const days = differenceInCalendarDays(parseISO(r.nextDueDate), now);
      if (days < 0) overdue += 1;
      if (days <= 7) dueSoon += 1;
    }
    return {
      total: (calibsAsync.data ?? []).length,
      overdue,
      dueSoon,
    };
  }, [calibsAsync.data]);

  // --- Submit calibration ---
  const handleSubmitCalibration = async (body: AddCalibrationForm) => {
    if (!dialogEquip) return;
    await equipmentApi.addCalibration(dialogEquip.id, {
      recordType: body.recordType,
      performedDate: body.performedDate,
      nextDueDate: body.nextDueDate || undefined,
      performedBy: body.performedBy || undefined,
      result: body.result,
      certificateRef: body.certificateRef || undefined,
      notes: body.notes || undefined,
    });
    toast.success("Calibration recorded.");
    refetch();
  };

  const loading =
    (equipmentAsync.loading && !equipmentAsync.data) ||
    (calibsAsync.loading && !calibsAsync.data);
  const error = equipmentAsync.error ?? calibsAsync.error;
  const hasData = (calibsAsync.data?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calibrations Due"
        description="Track upcoming calibration, certification, and inspection deadlines across all equipment."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn(
                "size-3.5",
                (equipmentAsync.loading || calibsAsync.loading) && "animate-spin",
              )}
            />
            Refresh
          </Button>
        }
      />

      {/* Controls + Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Window selector */}
        <Card className="rounded-2xl border-border/60 p-4 shadow-soft lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
              <CalendarClock className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Look-ahead window
              </p>
              <p className="text-xs text-muted-foreground">
                Fetch calibrations due in the next…
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-1.5">
            {WINDOW_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={
                  windowDays === opt.value ? "default" : "outline"
                }
                onClick={() => setWindowDays(opt.value)}
                className="flex-1 rounded-lg text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Summary stats */}
        <Card className="rounded-2xl border-border/60 p-4 shadow-soft lg:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-start gap-1">
              <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/12 text-cyan-700 ring-1 ring-cyan-500/20 dark:text-cyan-300">
                <ClipboardCheck className="size-4" />
              </div>
              <p className="mt-1 text-2xl font-semibold leading-none tracking-tight text-foreground">
                {stats.total}
              </p>
              <p className="text-xs text-muted-foreground">Total due</p>
            </div>
            <div className="flex flex-col items-start gap-1">
              <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/12 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-300">
                <XCircle className="size-4" />
              </div>
              <p className="mt-1 text-2xl font-semibold leading-none tracking-tight text-foreground">
                {stats.overdue}
              </p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
            <div className="flex flex-col items-start gap-1">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
                <AlertTriangle className="size-4" />
              </div>
              <p className="mt-1 text-2xl font-semibold leading-none tracking-tight text-foreground">
                {stats.dueSoon}
              </p>
              <p className="text-xs text-muted-foreground">Due ≤7 days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      {loading ? (
        <ListSkeleton count={4} />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn&apos;t load calibrations.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No calibrations due."
          description={`Nothing is due in the next ${windowDays} days. Mark a calibration manually using the button below.`}
          action={
            <Button
              size="sm"
              onClick={() => {
                setDialogEquip(equipment[0] ?? null);
                setDialogOpen(true);
              }}
              disabled={equipment.length === 0}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              Mark calibration done
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-4">Equipment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Next due</TableHead>
                <TableHead>Performed by</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Certificate ref</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((rec) => {
                const v = rowVariant(rec);
                const tone = ROW_TONE[v];
                const equip = equipment.find((e) => e.id === rec.equipmentId) ?? null;
                return (
                  <TableRow key={rec.id} className={cn("align-top", tone.row)}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
                          <Microscope className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {rec.equipmentName}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            ID #{rec.equipmentId}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                      >
                        {rec.recordType
                          .toLowerCase()
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          tone.chip,
                        )}
                      >
                        <CalendarClock className="size-3" />
                        {fmtDate(rec.nextDueDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {rec.performedBy ? (
                        <div className="flex items-center gap-1.5">
                          <User className="size-3.5 text-muted-foreground" />
                          <span className="truncate text-sm text-foreground">
                            {rec.performedBy}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {rec.result ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                            rec.result === "PASS"
                              ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25"
                              : rec.result === "FAIL"
                                ? "bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/25"
                                : "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-500/25",
                          )}
                        >
                          <Award className="size-3" />
                          {rec.result}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {rec.certificateRef ? (
                        <div className="flex items-center gap-1.5">
                          <FileText className="size-3.5 text-muted-foreground" />
                          <span className="truncate text-sm text-foreground">
                            {rec.certificateRef}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDialogEquip(equip);
                            setDialogOpen(true);
                          }}
                          className="gap-1.5 rounded-lg"
                        >
                          <Plus className="size-3.5" />
                          Mark as done
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Floating "Mark calibration done" CTA when there's data */}
      {hasData && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              setDialogEquip(equipment[0] ?? null);
              setDialogOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            Mark calibration done
          </Button>
        </div>
      )}

      <AddCalibrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        equipment={dialogEquip}
        onSubmit={handleSubmitCalibration}
      />
    </div>
  );
}
