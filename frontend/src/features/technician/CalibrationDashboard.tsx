import * as React from "react";
import {
  RefreshCw,
  Search,
  Filter,
  ClipboardCheck,
  AlertTriangle,
  XCircle,
  Calendar,
  Microscope,
  User,
  FileText,
  Eye,
  Edit,
  Loader2,
  CheckCircle2,
  Clock,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, differenceInCalendarDays, addDays, startOfDay, endOfDay } from "date-fns";

import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { equipmentApi } from "@/lib/api/equipmentApi";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeletons";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type {
  CalibrationRecord,
  CalibrationRecordType,
  Equipment,
} from "@/types";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type CalibrationStatus = "VALID" | "DUE_SOON" | "OVERDUE" | "UNDER_CALIBRATION";

const RECORD_TYPES: CalibrationRecordType[] = [
  "CALIBRATION",
  "CERTIFICATION",
  "INSPECTION",
  "MAINTENANCE_CHECK",
];

const RESULTS = ["PASS", "FAIL", "N/A"] as const;
type CalResult = (typeof RESULTS)[number];

const FILTER_OPTIONS = [
  { value: "all", label: "All Equipment" },
  { value: "valid", label: "Valid" },
  { value: "due_soon", label: "Due Soon" },
  { value: "overdue", label: "Overdue" },
] as const;

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

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

// Determine calibration status based on next due date
function getCalibrationStatus(nextDueDate: string | null): CalibrationStatus {
  if (!nextDueDate) return "VALID";
  try {
    const days = differenceInCalendarDays(parseISO(nextDueDate), new Date());
    if (days < 0) return "OVERDUE";
    if (days <= 7) return "DUE_SOON";
    return "VALID";
  } catch {
    return "VALID";
  }
}

// Status badge configuration
const STATUS_CONFIG: Record<CalibrationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  VALID: {
    label: "Valid",
    color: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25",
    icon: <CheckCircle2 className="size-3" />,
  },
  DUE_SOON: {
    label: "Due Soon",
    color: "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/25",
    icon: <Clock className="size-3" />,
  },
  OVERDUE: {
    label: "Overdue",
    color: "bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/25",
    icon: <XCircle className="size-3" />,
  },
  UNDER_CALIBRATION: {
    label: "Under Calibration",
    color: "bg-blue-500/12 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/25",
    icon: <Loader2 className="size-3 animate-spin" />,
  },
};

// ---------------------------------------------------------------------------
// Calibration Status Badge Component
// ---------------------------------------------------------------------------

function CalibrationStatusBadge({ status }: { status: CalibrationStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", config.color)}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Update Calibration Dialog Form
// ---------------------------------------------------------------------------

interface UpdateCalibrationForm {
  performedDate: string;
  nextDueDate: string;
  performedBy: string;
  result: CalResult;
  certificateRef: string;
  notes: string;
}

function UpdateCalibrationDialog({
  open,
  onOpenChange,
  equipment,
  lastCalibration,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  equipment: Equipment | null;
  lastCalibration: CalibrationRecord | null;
  onSubmit: (body: UpdateCalibrationForm) => Promise<void>;
}) {
  const [form, setForm] = React.useState<UpdateCalibrationForm>({
    performedDate: todayISO(),
    nextDueDate: "",
    performedBy: "",
    result: "PASS",
    certificateRef: "",
    notes: "",
  });
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open && equipment) {
      setForm({
        performedDate: todayISO(),
        nextDueDate: lastCalibration?.nextDueDate || "",
        performedBy: lastCalibration?.performedBy || "",
        result: lastCalibration?.result as CalResult || "PASS",
        certificateRef: lastCalibration?.certificateRef || "",
        notes: lastCalibration?.notes || "",
      });
    }
  }, [open, equipment, lastCalibration]);

  const set = <K extends keyof UpdateCalibrationForm>(k: K, v: UpdateCalibrationForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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
      toast.success("Calibration updated successfully!");
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
          <DialogTitle>Update Calibration</DialogTitle>
          <DialogDescription>
            {equipment ? `Update calibration record for ${equipment.equipmentName}.` : "Update calibration record."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">
                Performed Date <span className="text-destructive">*</span>
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
                Next Due Date <span className="text-[11px] font-normal">(optional)</span>
              </Label>
              <Input
                type="date"
                value={form.nextDueDate}
                onChange={(e) => set("nextDueDate", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Performed By</Label>
              <Input
                value={form.performedBy}
                onChange={(e) => set("performedBy", e.target.value)}
                placeholder="Technician name"
                maxLength={120}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Result</Label>
              <Select value={form.result} onValueChange={(v) => set("result", v as CalResult)}>
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

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Certificate Reference</Label>
              <Input
                value={form.certificateRef}
                onChange={(e) => set("certificateRef", e.target.value)}
                placeholder="e.g. CAL-2025-0142"
                maxLength={120}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Remarks</Label>
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
            <Button type="submit" size="sm" disabled={busy} className="gap-1.5 rounded-lg">
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              Save Calibration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Equipment Details Dialog
// ---------------------------------------------------------------------------

function EquipmentDetailsDialog({
  open,
  onOpenChange,
  equipment,
  calibrationHistory,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  equipment: Equipment | null;
  calibrationHistory: CalibrationRecord[];
}) {
  const lastCalibration = calibrationHistory[0] || null;
  const status = lastCalibration ? getCalibrationStatus(lastCalibration.nextDueDate) : "VALID";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Equipment Calibration Details</DialogTitle>
          <DialogDescription>Complete calibration information for this equipment.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Equipment Information */}
          <Card className="rounded-xl border-border/60 p-4 shadow-soft">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Equipment Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{equipment?.equipmentName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Equipment ID</p>
                <p className="font-medium text-foreground">#{equipment?.id || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lab/Department</p>
                <p className="font-medium text-foreground">{equipment?.department?.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Serial Number</p>
                <p className="font-medium text-foreground">{equipment?.serial || "—"}</p>
              </div>
            </div>
          </Card>

          {/* Calibration Status */}
          <Card className="rounded-xl border-border/60 p-4 shadow-soft">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Calibration Status</h3>
            <div className="flex items-center gap-3">
              <CalibrationStatusBadge status={status} />
              {lastCalibration && (
                <div className="text-sm text-muted-foreground">
                  Last calibrated: {fmtDate(lastCalibration.performedDate)}
                </div>
              )}
            </div>
            {lastCalibration && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="font-medium text-foreground">{fmtDate(lastCalibration.nextDueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Result</p>
                  <p className="font-medium text-foreground">{lastCalibration.result || "—"}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Calibration History */}
          <Card className="rounded-xl border-border/60 p-4 shadow-soft">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Calibration History</h3>
            {calibrationHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No calibration records found.</p>
            ) : (
              <div className="space-y-3">
                {calibrationHistory.map((record) => (
                  <div key={record.id} className="rounded-lg border border-border/40 bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {record.recordType.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {fmtDate(record.performedDate)}
                          </span>
                        </div>
                        {record.performedBy && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            By: {record.performedBy}
                          </p>
                        )}
                        {record.notes && (
                          <p className="mt-1 text-xs text-foreground">{record.notes}</p>
                        )}
                      </div>
                      {record.result && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            record.result === "PASS"
                              ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                              : record.result === "FAIL"
                                ? "bg-rose-500/12 text-rose-700 dark:text-rose-300"
                                : "",
                          )}
                        >
                          {record.result}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Calibration Dashboard
// ---------------------------------------------------------------------------

export default function CalibrationDashboard() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [tick, setTick] = React.useState(0);
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false);
  const [selectedEquipment, setSelectedEquipment] = React.useState<Equipment | null>(null);
  const [selectedCalibration, setSelectedCalibration] = React.useState<CalibrationRecord | null>(null);

  // Fetch equipment list
  const equipmentAsync = useAsync<Equipment[]>(
    () => equipmentApi.getAllEquipment(),
    [],
  );

  const equipment = equipmentAsync.data ?? [];

  // Fetch calibration records for all equipment
  const calibrationsAsync = useAsync<Record<number, CalibrationRecord[]>>(() => {
    if (equipment.length === 0) return Promise.resolve({});
    
    return Promise.all(
      equipment.map(async (eq) => {
        try {
          const records = await equipmentApi.listCalibrations(eq.id);
          return { id: eq.id, records };
        } catch (error) {
          console.warn(`Failed to fetch calibrations for equipment ${eq.id}:`, error);
          return { id: eq.id, records: [] };
        }
      }),
    ).then((results) => {
      const map: Record<number, CalibrationRecord[]> = {};
      results.forEach(({ id, records }) => {
        map[id] = records;
      });
      return map;
    });
  }, [equipment.length, tick]);

  const calibrationsMap = calibrationsAsync.data ?? {};

  // Calculate summary stats
  const stats = React.useMemo(() => {
    const now = new Date();
    let totalEquipment = equipment.length;
    let dueToday = 0;
    let dueSoon = 0; // ≤7 days
    let overdue = 0;
    let completed = 0;

    Object.values(calibrationsMap).forEach((records) => {
      records.forEach((rec) => {
        completed++;
        if (!rec.nextDueDate) return;
        const days = differenceInCalendarDays(parseISO(rec.nextDueDate), now);
        if (days < 0) overdue++;
        else if (days === 0) dueToday++;
        else if (days <= 7) dueSoon++;
      });
    });

    return {
      totalEquipment,
      dueToday,
      dueSoon,
      overdue,
      completed,
    };
  }, [equipment, calibrationsMap]);

  // Filter and search equipment
  const filteredEquipment = React.useMemo(() => {
    return equipment.filter((eq) => {
      const calibrations = calibrationsMap[eq.id] || [];
      const lastCalibration = calibrations[0] || null;
      const status = lastCalibration ? getCalibrationStatus(lastCalibration.nextDueDate) : "VALID";

      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        eq.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.id.toString().includes(searchQuery);

      // Status filter
      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "valid" && status === "VALID") ||
        (filterStatus === "due_soon" && status === "DUE_SOON") ||
        (filterStatus === "overdue" && status === "OVERDUE");

      return matchesSearch && matchesFilter;
    });
  }, [equipment, calibrationsMap, searchQuery, filterStatus]);

  // Get alerts for dashboard
  const alerts = React.useMemo(() => {
    const now = new Date();
    const weekEnd = addDays(now, 7);
    const alertItems: { type: "overdue" | "today" | "week"; equipment: Equipment; dueDate: string }[] = [];

    Object.entries(calibrationsMap).forEach(([eqId, records]) => {
      const eq = equipment.find((e) => e.id === Number(eqId));
      if (!eq) return;
      const lastCal = records[0];
      if (!lastCal?.nextDueDate) return;

      const dueDate = parseISO(lastCal.nextDueDate);
      const days = differenceInCalendarDays(dueDate, now);

      if (days < 0) {
        alertItems.push({ type: "overdue", equipment: eq, dueDate: lastCal.nextDueDate });
      } else if (days === 0) {
        alertItems.push({ type: "today", equipment: eq, dueDate: lastCal.nextDueDate });
      } else if (days <= 7) {
        alertItems.push({ type: "week", equipment: eq, dueDate: lastCal.nextDueDate });
      }
    });

    return alertItems;
  }, [calibrationsMap, equipment]);

  const refetch = () => {
    equipmentAsync.refetch();
    calibrationsAsync.refetch();
    setTick((t) => t + 1);
  };

  const handleUpdateCalibration = async (body: UpdateCalibrationForm) => {
    if (!selectedEquipment) return;
    await equipmentApi.addCalibration(selectedEquipment.id, {
      recordType: "CALIBRATION",
      performedDate: body.performedDate,
      nextDueDate: body.nextDueDate || undefined,
      performedBy: body.performedBy || undefined,
      result: body.result,
      certificateRef: body.certificateRef || undefined,
      notes: body.notes || undefined,
    });
    refetch();
  };

  const loading = equipmentAsync.loading || calibrationsAsync.loading;
  const error = equipmentAsync.error || calibrationsAsync.error;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calibration Dashboard"
        description="Manage and track equipment calibration schedules and records."
        actions={
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5">
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
              <Microscope className="size-4" />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none text-foreground">{stats.totalEquipment}</p>
              <p className="text-xs text-muted-foreground">Total Equipment</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/12 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-300">
              <XCircle className="size-4" />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none text-foreground">{stats.dueToday}</p>
              <p className="text-xs text-muted-foreground">Due Today</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
              <Clock className="size-4" />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none text-foreground">{stats.dueSoon}</p>
              <p className="text-xs text-muted-foreground">Due Soon</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-500/12 text-red-700 ring-1 ring-red-500/20 dark:text-red-300">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none text-foreground">{stats.overdue}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
              <ClipboardCheck className="size-4" />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none text-foreground">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alert Cards */}
      {alerts.length > 0 && (
        <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Alerts</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.slice(0, 6).map((alert, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-2 rounded-lg border p-3",
                  alert.type === "overdue"
                    ? "border-rose-500/30 bg-rose-500/10"
                    : alert.type === "today"
                      ? "border-orange-500/30 bg-orange-500/10"
                      : "border-amber-500/30 bg-amber-500/10",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    alert.type === "overdue"
                      ? "text-rose-600 dark:text-rose-400"
                      : alert.type === "today"
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {alert.type === "overdue" ? <XCircle className="size-4" /> : <AlertTriangle className="size-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {alert.equipment.equipmentName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.type === "overdue" ? "Overdue" : alert.type === "today" ? "Due today" : "Due this week"}:{" "}
                    {fmtDate(alert.dueDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by equipment name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Equipment Table */}
      {loading ? (
        <ListSkeleton count={5} />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">Couldn't load calibration data.</p>
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5">
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : filteredEquipment.length === 0 ? (
        <EmptyState
          icon={Microscope}
          title="No equipment found"
          description={
            searchQuery || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria."
              : "No equipment available for calibration tracking."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4">Equipment Name</TableHead>
                  <TableHead>Equipment ID</TableHead>
                  <TableHead>Lab Name</TableHead>
                  <TableHead>Last Calibration</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.map((eq) => {
                  const calibrations = calibrationsMap[eq.id] || [];
                  const lastCal = calibrations[0] || null;
                  const status = lastCal ? getCalibrationStatus(lastCal.nextDueDate) : "VALID";

                  return (
                    <TableRow key={eq.id} className="hover:bg-muted/30">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2">
                          <Microscope className="size-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{eq.equipmentName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">#{eq.id}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="size-3" />
                          {eq.department?.name || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lastCal ? fmtDate(lastCal.performedDate) : "—"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {lastCal?.nextDueDate ? fmtDate(lastCal.nextDueDate) : "—"}
                      </TableCell>
                      <TableCell>
                        <CalibrationStatusBadge status={status} />
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedEquipment(eq);
                              setSelectedCalibration(lastCal);
                              setDetailsDialogOpen(true);
                            }}
                            className="gap-1"
                          >
                            <Eye className="size-3.5" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEquipment(eq);
                              setSelectedCalibration(lastCal);
                              setUpdateDialogOpen(true);
                            }}
                            className="gap-1"
                          >
                            <Edit className="size-3.5" />
                            Update
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
      )}

      {/* Dialogs */}
      <UpdateCalibrationDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        equipment={selectedEquipment}
        lastCalibration={selectedCalibration}
        onSubmit={handleUpdateCalibration}
      />

      <EquipmentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        equipment={selectedEquipment}
        calibrationHistory={calibrationsMap[selectedEquipment?.id || 0] || []}
      />
    </div>
  );
}
