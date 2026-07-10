import * as React from "react";
import {
  BarChart3,
  RefreshCw,
  Gauge,
  Sparkles,
  CalendarRange,
  AlertCircle,
  Building2,
  Grid3x3,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  addDays,
  endOfDay,
  format,
  parseISO,
  startOfDay,
} from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { bookingApi } from "@/lib/api/bookingApi";
import { equipmentApi } from "@/lib/api/equipmentApi";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeletons";
import { UtilizationGauge } from "@/components/shared/UtilizationGauge";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Booking, Equipment, UtilizationReport } from "@/types";

// ---------------------------------------------------------------------------
// The real backend ONLY has: GET /api/bookings/utilization?equipmentId=&start=&end=
// (per-equipment, LAB_MANAGER). There are NO department/institution/heatmap/idle
// endpoints. We compute ALL of those client-side from:
//   1. equipmentApi.getAllEquipment() — for department/institution grouping
//   2. bookingApi.utilization(...) per equipment — for booked/available hours
//   3. bookingApi.allBookings() — for the heatmap (day-of-week × hour-of-day)
// ---------------------------------------------------------------------------

const BAR_COLOR = "var(--primary)";
const BAR_COLOR_HEX = "#3b82f6";
const EQUIP_ALL = "ALL";

function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}
function plusDaysStr(days: number): string {
  return format(addDays(new Date(), days), "yyyy-MM-dd");
}

function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message?: unknown }).message);
  }
  return "Something went wrong";
}

function truncate(name: string, n = 14): string {
  if (name.length <= n) return name;
  return name.slice(0, n - 1) + "…";
}

function fmtPct(p: number): string {
  return p.toFixed(p % 1 === 0 ? 0 : 1);
}

/** Format hours to at most 4 decimal places (trailing zeros trimmed). */
function fmtHours(h: number): string {
  const rounded = Math.round(h * 10000) / 10000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function isDateInvalid(start: string, end: string): boolean {
  return !!start && !!end && parseISO(end).getTime() < parseISO(start).getTime();
}

/** Convert "yyyy-MM-dd" start/end to ISO strings for the API */
function isoRange(start: string, end: string) {
  return {
    startIso: startOfDay(parseISO(start)).toISOString(),
    endIso: endOfDay(parseISO(end)).toISOString(),
  };
}

function distinct(list: (string | undefined | null)[]): string[] {
  return Array.from(new Set(list.filter((x): x is string => !!x))).sort();
}

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------

function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight", accent ?? "text-foreground")}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function GenerateButton({
  loading,
  invalid,
  onClick,
}: {
  loading: boolean;
  invalid: boolean;
  onClick: () => void;
}) {
  return (
    <Button onClick={onClick} disabled={loading || invalid} className="w-full gap-1.5">
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {loading ? "Generating…" : "Generate"}
    </Button>
  );
}

function DateInvalidHint({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="mt-3 flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="size-3.5" />
      End date must be on or after the start date.
    </p>
  );
}

function RangeFooter({ start, end }: { start: string; end: string }) {
  return (
    <div className="mt-3 flex items-center gap-1.5 border-t border-border/40 pt-3 text-xs text-muted-foreground">
      <CalendarRange className="size-3.5" />
      Range: {start} → {end}
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">Couldn't generate the report.</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
        <RefreshCw className="size-3.5" />
        Retry
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------

export default function UtilizationPage() {
  const { data: equipment, loading: equipLoading, error: equipError, refetch: refetchEquip } =
    useAsync(() => equipmentApi.getAllEquipment(), []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Utilization"
        description="Booked vs. available hours — see how hard your equipment is working."
        actions={
          (equipment?.length ?? 0) > 0 ? (
            <Button variant="outline" size="sm" onClick={refetchEquip} className="gap-1.5">
              <RefreshCw className="size-3.5" />
              Refresh list
            </Button>
          ) : undefined
        }
      />

      {equipLoading ? (
        <ListSkeleton count={2} />
      ) : equipError ? (
        <ErrorPanel message={equipError} onRetry={refetchEquip} />
      ) : (equipment?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No equipment to analyze"
          description="Add equipment first, then come back here to measure its utilization."
        />
      ) : (
        <Tabs defaultValue="equipment">
          <TabsList className="h-9 w-full overflow-x-auto no-scrollbar sm:w-auto">
            <TabsTrigger value="equipment" className="gap-1.5">
              <Gauge className="size-3.5" />
              Equipment
            </TabsTrigger>
            <TabsTrigger value="department" className="gap-1.5">
              <Building2 className="size-3.5" />
              Department
            </TabsTrigger>
            <TabsTrigger value="institution" className="gap-1.5">
              <Building2 className="size-3.5" />
              Institution
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="gap-1.5">
              <Grid3x3 className="size-3.5" />
              Heatmap
            </TabsTrigger>
            <TabsTrigger value="idle" className="gap-1.5">
              <Clock className="size-3.5" />
              Idle Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipment" className="mt-4">
            <EquipmentTab equipment={equipment ?? []} />
          </TabsContent>
          <TabsContent value="department" className="mt-4">
            <ScopeTab equipment={equipment ?? []} scope="DEPARTMENT" />
          </TabsContent>
          <TabsContent value="institution" className="mt-4">
            <ScopeTab equipment={equipment ?? []} scope="INSTITUTION" />
          </TabsContent>
          <TabsContent value="heatmap" className="mt-4">
            <HeatmapTab equipment={equipment ?? []} />
          </TabsContent>
          <TabsContent value="idle" className="mt-4">
            <IdleTimeTab equipment={equipment ?? []} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fetch helper: per-equipment utilization for ALL equipment (parallel)
// ---------------------------------------------------------------------------

async function fetchAllUtilization(
  equipment: Equipment[],
  startIso: string,
  endIso: string,
): Promise<UtilizationReport[]> {
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();
  const nowMs = Date.now();
  return Promise.all(
    equipment.map((e) => {
      const acqMs = e.acquisitionDate ? new Date(e.acquisitionDate).getTime() : 0;
      if (acqMs > startMs) {
        // Equipment was added DURING the selected range (e.g., 1 hour ago).
        // "Available hours" should only count ELAPSED time (from acquisition
        // to now), not future capacity — otherwise a newly-added equipment
        // shows 176h "available" for a 7-day range, which is misleading.
        const effectiveStart = new Date(acqMs).toISOString();
        const effectiveEnd = new Date(Math.min(endMs, nowMs)).toISOString();
        return bookingApi.utilization({
          equipmentId: e.id,
          start: effectiveStart,
          end: effectiveEnd,
        });
      }
      // Equipment existed before the range — use the full selected range.
      return bookingApi.utilization({
        equipmentId: e.id,
        start: startIso,
        end: endIso,
      });
    }),
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Equipment (per-equipment + comparison chart)
// ---------------------------------------------------------------------------

interface ChartRow {
  id: number;
  name: string;
  shortName: string;
  utilizationPercentage: number;
  bookedHours: number;
  availableHours: number;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-float backdrop-blur">
      <p className="font-semibold text-foreground">{row.name}</p>
      <p className="mt-1 text-foreground">{fmtPct(row.utilizationPercentage)}% utilization</p>
      <p className="text-muted-foreground">
        {fmtHours(row.bookedHours)}h booked · {fmtHours(row.availableHours)}h available
      </p>
    </div>
  );
}

function EquipmentTab({ equipment }: { equipment: Equipment[] }) {
  const [selectedId, setSelectedId] = React.useState<string>(EQUIP_ALL);
  const [startDate, setStartDate] = React.useState(todayStr());
  const [endDate, setEndDate] = React.useState(plusDaysStr(7));
  const [applied, setApplied] = React.useState<{ start: string; end: string } | null>(null);

  // Auto-apply defaults once
  const autoRef = React.useRef(false);
  React.useEffect(() => {
    if (!autoRef.current && equipment.length > 0) {
      autoRef.current = true;
      setApplied({ start: startDate, end: endDate });
    }
  }, [equipment]);

  const { data: reports, loading, error, refetch } = useAsync(async () => {
    if (!applied || equipment.length === 0) return [] as UtilizationReport[];
    const { startIso, endIso } = isoRange(applied.start, applied.end);
    return fetchAllUtilization(equipment, startIso, endIso);
  }, [applied, equipment]);

  const dateInvalid = isDateInvalid(startDate, endDate);
  const selectedIdNum = selectedId === EQUIP_ALL ? null : Number(selectedId);
  const singleReport = reports?.find((r) => r.equipmentId === selectedIdNum) ?? null;

  const chartRows: ChartRow[] = React.useMemo(() => {
    return equipment
      .map((eq) => {
        const r = reports?.find((x) => x.equipmentId === eq.id);
        return {
          id: eq.id,
          name: eq.equipmentName,
          shortName: truncate(eq.equipmentName, 14),
          utilizationPercentage: r?.utilizationPercentage ?? 0,
          bookedHours: r?.bookedHours ?? 0,
          availableHours: r?.availableHours ?? 0,
        };
      })
      .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);
  }, [equipment, reports]);

  const onGenerate = () => {
    if (dateInvalid) {
      toast.error("End date must be on or after the start date.");
      return;
    }
    setApplied({ start: startDate, end: endDate });
    toast.success("Generating utilization report…");
  };

  if (loading && !reports) return <ListSkeleton count={3} />;
  if (error) return <ErrorPanel message={error} onRetry={refetch} />;
  if (!applied) return <EmptyState icon={Gauge} title="No data yet" description="Click Generate to compute utilization." />;

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <Card className="glass rounded-2xl border-border/60 p-4 shadow-soft">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Equipment</label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EQUIP_ALL}>All equipment</SelectItem>
                {equipment.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.equipmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Start date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">End date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-invalid={dateInvalid || undefined} />
          </div>
          <div className="flex items-end">
            <GenerateButton loading={loading} invalid={dateInvalid} onClick={onGenerate} />
          </div>
        </div>
        <DateInvalidHint show={dateInvalid} />
        <RangeFooter start={startDate} end={endDate} />
      </Card>

      {loading ? (
        <ListSkeleton count={3} />
      ) : !reports || reports.length === 0 ? (
        <EmptyState icon={Gauge} title="No data yet" description="Click Generate to compute utilization." />
      ) : (
        <>
          {/* Single-equipment panel */}
          {singleReport && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Gauge className="size-4 text-primary" />
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {singleReport.equipmentName}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <UtilizationGauge report={singleReport} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatTile label="Booked hours" value={`${fmtHours(singleReport.bookedHours)}h`} hint="Total scheduled time" accent="text-primary" />
                  <StatTile label="Available hours" value={`${fmtHours(singleReport.availableHours)}h`} hint="Open time in range" />
                  <StatTile label="Utilization" value={`${fmtPct(singleReport.utilizationPercentage)}%`} hint="Booked ÷ available" />
                </div>
              </div>
            </section>
          )}

          {/* Comparison chart */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">All equipment comparison</h2>
            </div>
            <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRows} margin={{ top: 12, right: 16, left: 0, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
                      interval={0}
                      angle={chartRows.length > 4 ? -25 : 0}
                      textAnchor={chartRows.length > 4 ? "end" : "middle"}
                      height={chartRows.length > 4 ? 56 : 28}
                    />
                    <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} width={36} unit="%" />
                    <Tooltip cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }} content={<ChartTooltip />} />
                    <Bar dataKey="utilizationPercentage" radius={[6, 6, 0, 0]}>
                      {chartRows.map((row) => (
                        <Cell key={row.id} fill={BAR_COLOR} fillOpacity={singleReport == null || singleReport.equipmentId === row.id ? 1 : 0.4} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Breakdown list */}
            <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Per-equipment breakdown</p>
              <ul className="flex flex-col gap-2">
                {chartRows.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{fmtHours(row.bookedHours)}h booked · {fmtHours(row.availableHours)}h available</p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: `color-mix(in oklch, ${BAR_COLOR_HEX} 12%, transparent)`, color: BAR_COLOR_HEX }}
                    >
                      {fmtPct(row.utilizationPercentage)}%
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 & 3: Department / Institution (computed client-side)
// ---------------------------------------------------------------------------

interface ScopeRow {
  name: string;
  equipmentCount: number;
  totalAvailableHours: number;
  totalBookedHours: number;
  utilizationPercentage: number;
}

function ScopeTab({ equipment, scope }: { equipment: Equipment[]; scope: "DEPARTMENT" | "INSTITUTION" }) {
  const fieldKey = scope === "DEPARTMENT" ? "department" : "institution";
  const label = scope === "DEPARTMENT" ? "Department" : "Institution";

  const [selectedName, setSelectedName] = React.useState<string>(EQUIP_ALL);
  const [startDate, setStartDate] = React.useState(todayStr());
  const [endDate, setEndDate] = React.useState(plusDaysStr(7));
  const [applied, setApplied] = React.useState<{ start: string; end: string } | null>(null);

  // Auto-apply once
  const autoRef = React.useRef(false);
  React.useEffect(() => {
    if (!autoRef.current && equipment.length > 0) {
      autoRef.current = true;
      setApplied({ start: startDate, end: endDate });
    }
  }, [equipment]);

  const { data: reports, loading, error, refetch } = useAsync(async () => {
    if (!applied || equipment.length === 0) return [] as UtilizationReport[];
    const { startIso, endIso } = isoRange(applied.start, applied.end);
    return fetchAllUtilization(equipment, startIso, endIso);
  }, [applied, equipment]);

  // Group by department or institution (client-side)
  const scopeRows: ScopeRow[] = React.useMemo(() => {
    const groups = new Map<string, Equipment[]>();
    for (const eq of equipment) {
      const name = (eq as any)[fieldKey] as string | undefined;
      if (!name) continue;
      const arr = groups.get(name) ?? [];
      arr.push(eq);
      groups.set(name, arr);
    }
    return Array.from(groups.entries()).map(([name, eqs]) => {
      const equipmentCount = eqs.length;
      let totalBooked = 0;
      let totalAvail = 0;
      for (const eq of eqs) {
        const r = reports?.find((x) => x.equipmentId === eq.id);
        totalBooked += r?.bookedHours ?? 0;
        totalAvail += r?.availableHours ?? 0;
      }
      const pct = totalAvail > 0 ? (totalBooked / totalAvail) * 100 : 0;
      return { name, equipmentCount, totalAvailableHours: totalAvail, totalBookedHours: totalBooked, utilizationPercentage: pct };
    }).sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);
  }, [equipment, reports, fieldKey]);

  const names = distinct(equipment.map((e) => (e as any)[fieldKey] as string | undefined));
  const dateInvalid = isDateInvalid(startDate, endDate);
  const selected = selectedName === EQUIP_ALL ? null : scopeRows.find((r) => r.name === selectedName) ?? null;

  const onGenerate = () => {
    if (dateInvalid) {
      toast.error("End date must be on or after the start date.");
      return;
    }
    setApplied({ start: startDate, end: endDate });
    toast.success("Generating utilization report…");
  };

  // Adapt a ScopeRow to UtilizationReport shape for the gauge
  const gaugeReport: UtilizationReport | null = selected
    ? { equipmentId: 0, equipmentName: selected.name, bookedHours: selected.totalBookedHours, availableHours: selected.totalAvailableHours, utilizationPercentage: selected.utilizationPercentage }
    : null;

  if (loading && !reports) return <ListSkeleton count={2} />;
  if (error) return <ErrorPanel message={error} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <Card className="glass rounded-2xl border-border/60 p-4 shadow-soft">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <Select value={selectedName} onValueChange={setSelectedName}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`All ${label.toLowerCase()}s`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EQUIP_ALL}>All {label.toLowerCase()}s</SelectItem>
                {names.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Start date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">End date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-invalid={dateInvalid || undefined} />
          </div>
          <div className="flex items-end">
            <GenerateButton loading={loading} invalid={dateInvalid} onClick={onGenerate} />
          </div>
        </div>
        <DateInvalidHint show={dateInvalid} />
        <RangeFooter start={startDate} end={endDate} />
      </Card>

      {loading ? (
        <ListSkeleton count={2} />
      ) : !applied ? (
        <EmptyState icon={Gauge} title="No data yet" description="Click Generate to compute utilization." />
      ) : scopeRows.length === 0 ? (
        <EmptyState icon={Building2} title={`No ${label.toLowerCase()}s found`} description={`Add ${label.toLowerCase()}s to equipment to see aggregated utilization.`} />
      ) : (
        <>
          {/* Single scope panel */}
          {gaugeReport && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <h2 className="text-lg font-semibold tracking-tight text-foreground">{gaugeReport.equipmentName}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <UtilizationGauge report={gaugeReport} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatTile label="Equipment count" value={String(selected?.equipmentCount ?? 0)} hint={`In this ${label.toLowerCase()}`} />
                  <StatTile label="Booked hours" value={`${selected?.totalBookedHours ?? 0}h`} accent="text-primary" />
                  <StatTile label="Utilization" value={`${fmtPct(selected?.utilizationPercentage ?? 0)}%`} hint="Booked ÷ available" />
                </div>
              </div>
            </section>
          )}

          {/* All scopes comparison list */}
          <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label} breakdown</p>
            <ul className="flex flex-col gap-2">
              {scopeRows.map((row) => (
                <li key={row.name} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.equipmentCount} equipment · {fmtHours(row.totalBookedHours)}h booked · {fmtHours(row.totalAvailableHours)}h available
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: `color-mix(in oklch, ${BAR_COLOR_HEX} 12%, transparent)`, color: BAR_COLOR_HEX }}
                  >
                    {fmtPct(row.utilizationPercentage)}%
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4: Heatmap (computed client-side from /api/bookings/all)
// ---------------------------------------------------------------------------

const DAY_LABELS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function HeatmapTab({ equipment }: { equipment: Equipment[] }) {
  const [selectedId, setSelectedId] = React.useState<string>(equipment[0] ? String(equipment[0].id) : EQUIP_ALL);
  const [startDate, setStartDate] = React.useState(todayStr());
  const [endDate, setEndDate] = React.useState(plusDaysStr(7));
  const [applied, setApplied] = React.useState<{ start: string; end: string } | null>(null);

  const autoRef = React.useRef(false);
  React.useEffect(() => {
    if (!autoRef.current && equipment.length > 0) {
      autoRef.current = true;
      setApplied({ start: startDate, end: endDate });
    }
  }, [equipment]);

  // Fetch ALL bookings (LAB_MANAGER has access), then compute heatmap client-side
  const { data: allBookings, loading, error, refetch } = useAsync(async () => {
    if (!applied) return [] as Booking[];
    return bookingApi.allBookings();
  }, [applied]);

  const heatmap = React.useMemo(() => {
    if (!allBookings || !applied) return [] as { dayOfWeek: number; hour: number; bookedHours: number; bookingCount: number }[];
    const { startIso, endIso } = isoRange(applied.start, applied.end);
    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();
    const eqId = selectedId === EQUIP_ALL ? null : Number(selectedId);

    // 8×24 grid (index 1-7 for Mon-Sun, 0-23 for hours)
    const hours = new Array(8).fill(null).map(() => new Array(24).fill(0));
    const counts = new Array(8).fill(null).map(() => new Array(24).fill(0));

    for (const b of allBookings) {
      if (eqId !== null && b.equipment.id !== eqId) continue;
      if (b.status === "CANCELLED" || b.status === "REJECTED") continue;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      if (bEnd < startMs || bStart > endMs) continue;

      // Iterate hour by hour through the booking
      let cursor = new Date(Math.max(bStart, startMs));
      const effectiveEnd = new Date(Math.min(bEnd, endMs));
      while (cursor < effectiveEnd) {
        const dow = cursor.getDay() === 0 ? 7 : cursor.getDay(); // 1=Mon, 7=Sun
        const hour = cursor.getHours();
        hours[dow][hour] += 1;
        counts[dow][hour] += 1;
        cursor = new Date(cursor.getTime() + 3600_000); // +1 hour
      }
    }

    const result: { dayOfWeek: number; hour: number; bookedHours: number; bookingCount: number }[] = [];
    for (let d = 1; d <= 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (hours[d][h] > 0) {
          result.push({ dayOfWeek: d, hour: h, bookedHours: hours[d][h], bookingCount: counts[d][h] });
        }
      }
    }
    return result;
  }, [allBookings, applied, selectedId]);

  const dateInvalid = isDateInvalid(startDate, endDate);

  const onGenerate = () => {
    if (dateInvalid) {
      toast.error("End date must be on or after the start date.");
      return;
    }
    setApplied({ start: startDate, end: endDate });
    toast.success("Generating heatmap…");
  };

  // Build a lookup map for quick cell access
  const cellMap = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const p of heatmap) {
      m.set(`${p.dayOfWeek}-${p.hour}`, p.bookedHours);
    }
    return m;
  }, [heatmap]);

  const maxHours = React.useMemo(() => Math.max(1, ...heatmap.map((p) => p.bookedHours)), [heatmap]);

  if (loading && !allBookings) return <ListSkeleton count={2} />;
  if (error) return <ErrorPanel message={error} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <Card className="glass rounded-2xl border-border/60 p-4 shadow-soft">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Equipment</label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EQUIP_ALL}>All equipment</SelectItem>
                {equipment.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.equipmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Start date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">End date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-invalid={dateInvalid || undefined} />
          </div>
          <div className="flex items-end">
            <GenerateButton loading={loading} invalid={dateInvalid} onClick={onGenerate} />
          </div>
        </div>
        <DateInvalidHint show={dateInvalid} />
        <RangeFooter start={startDate} end={endDate} />
      </Card>

      {loading ? (
        <ListSkeleton count={2} />
      ) : !applied ? (
        <EmptyState icon={Grid3x3} title="No data yet" description="Click Generate to compute the heatmap." />
      ) : heatmap.length === 0 ? (
        <EmptyState icon={Grid3x3} title="No bookings in this range" description="Try a wider date range or select all equipment." />
      ) : (
        <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <Grid3x3 className="size-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Peak usage patterns</h2>
          </div>
          {/* Heatmap grid */}
          <div className="overflow-x-auto">
            <div className="inline-block">
              {/* Hour labels */}
              <div className="flex" style={{ marginLeft: 44 }}>
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="text-center text-[9px] text-muted-foreground" style={{ width: 22 }}>
                    {h}
                  </div>
                ))}
              </div>
              {/* Day rows */}
              {Array.from({ length: 7 }, (_, i) => i + 1).map((dow) => (
                <div key={dow} className="flex items-center">
                  <div className="text-right pr-2 text-[10px] font-medium text-muted-foreground" style={{ width: 36 }}>
                    {DAY_LABELS[dow]}
                  </div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const val = cellMap.get(`${dow}-${h}`) ?? 0;
                    const opacity = val > 0 ? Math.min(100, (val / maxHours) * 100) : 0;
                    return (
                      <div
                        key={h}
                        className="m-[1px] rounded-sm"
                        style={{
                          width: 20,
                          height: 20,
                          backgroundColor: val > 0
                            ? `color-mix(in oklch, var(--primary) ${Math.max(15, opacity)}%, transparent)`
                            : "var(--muted)",
                        }}
                        title={`${DAY_LABELS[dow]} ${h}:00 — ${fmtHours(val)}h booked`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-0.5">
              {[15, 30, 50, 70, 100].map((o) => (
                <div
                  key={o}
                  className="h-3 w-5 rounded-sm"
                  style={{ backgroundColor: `color-mix(in oklch, var(--primary) ${o}%, transparent)` }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 5: Idle Time (computed client-side from per-equipment utilization)
// ---------------------------------------------------------------------------

interface IdleRow {
  equipmentId: number;
  equipmentName: string;
  totalPeriodHours: number;
  bookedHours: number;
  idleHours: number;
  idlePercentage: number;
}

function IdleTimeTab({ equipment }: { equipment: Equipment[] }) {
  const [startDate, setStartDate] = React.useState(todayStr());
  const [endDate, setEndDate] = React.useState(plusDaysStr(7));
  const [applied, setApplied] = React.useState<{ start: string; end: string } | null>(null);

  const autoRef = React.useRef(false);
  React.useEffect(() => {
    if (!autoRef.current && equipment.length > 0) {
      autoRef.current = true;
      setApplied({ start: startDate, end: endDate });
    }
  }, [equipment]);

  const { data: reports, loading, error, refetch } = useAsync(async () => {
    if (!applied || equipment.length === 0) return [] as UtilizationReport[];
    const { startIso, endIso } = isoRange(applied.start, applied.end);
    return fetchAllUtilization(equipment, startIso, endIso);
  }, [applied, equipment]);

  const idleRows: IdleRow[] = React.useMemo(() => {
    return equipment
      .filter((e) => e.status !== "RETIRED")
      .map((eq) => {
        const r = reports?.find((x) => x.equipmentId === eq.id);
        const total = r?.availableHours ?? 0;
        const booked = r?.bookedHours ?? 0;
        const idle = Math.max(0, total - booked);
        const pct = total > 0 ? (idle / total) * 100 : 0;
        return {
          equipmentId: eq.id,
          equipmentName: eq.equipmentName,
          totalPeriodHours: total,
          bookedHours: booked,
          idleHours: idle,
          idlePercentage: pct,
        };
      })
      .sort((a, b) => b.idlePercentage - a.idlePercentage);
  }, [equipment, reports]);

  const dateInvalid = isDateInvalid(startDate, endDate);

  const onGenerate = () => {
    if (dateInvalid) {
      toast.error("End date must be on or after the start date.");
      return;
    }
    setApplied({ start: startDate, end: endDate });
    toast.success("Generating idle time report…");
  };

  if (loading && !reports) return <ListSkeleton count={3} />;
  if (error) return <ErrorPanel message={error} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <Card className="glass rounded-2xl border-border/60 p-4 shadow-soft">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Start date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">End date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-invalid={dateInvalid || undefined} />
          </div>
          <div className="flex items-end">
            <GenerateButton loading={loading} invalid={dateInvalid} onClick={onGenerate} />
          </div>
        </div>
        <DateInvalidHint show={dateInvalid} />
        <RangeFooter start={startDate} end={endDate} />
      </Card>

      {loading ? (
        <ListSkeleton count={3} />
      ) : !applied ? (
        <EmptyState icon={Clock} title="No data yet" description="Click Generate to compute idle time." />
      ) : idleRows.length === 0 ? (
        <EmptyState icon={Clock} title="No equipment found" description="Add non-retired equipment to see idle time." />
      ) : (
        <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Idle time per equipment</h2>
          </div>
          <ul className="flex flex-col gap-2">
            {idleRows.map((row) => (
              <li
                key={row.equipmentId}
                className="flex flex-col gap-2 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{row.equipmentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtHours(row.bookedHours)}h booked · {fmtHours(row.idleHours)}h idle · {fmtHours(row.totalPeriodHours)}h total
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {row.idlePercentage > 80 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-300">
                        High idle
                      </span>
                    )}
                    <span className="text-sm font-semibold text-foreground">{fmtPct(row.idlePercentage)}%</span>
                  </div>
                </div>
                {/* Progress bar: booked (primary) vs idle (muted) */}
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="bg-primary"
                    style={{
                      width: `${row.totalPeriodHours > 0 ? (row.bookedHours / row.totalPeriodHours) * 100 : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
