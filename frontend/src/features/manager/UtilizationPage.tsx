import * as React from "react";
import { useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  CalendarRange,
  Clock,
  Download,
  Gauge,
  Grid3x3,
  Layers,
  PieChart as PieChartIcon,
  Minus,
  Radio,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  endOfDay,
  format,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { bookingApi } from "@/lib/api/bookingApi";
import { toBackendDateTime } from "@/lib/constants";
import {
  departmentApi,
  equipmentApi,
  institutionApi,
} from "@/lib/api/equipmentApi";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton, ListSkeleton } from "@/components/shared/Skeletons";
import { UtilizationGauge } from "@/components/shared/UtilizationGauge";
import { StatusBadge } from "@/components/shared/StatusBadge";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type {
  BenchmarkReport,
  Department,
  Equipment,
  HeatmapReport,
  IdleEquipmentRow,
  IdleReport,
  Institution,
  PeakReport,
  RealtimeUsage,
  ScopeUtilizationReport,
  SharedVsExclusiveReport,
  UtilizationReport,
} from "@/types";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const PRIMARY = "var(--primary)";

// Mon=0 … Sun=6, matching the displayed heatmap row order. Backend may send
// "MONDAY"/"Monday"/"Mon" — we normalise by first 3 chars uppercased.
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_INDEX: Record<string, number> = {
  MON: 0,
  TUE: 1,
  WED: 2,
  THU: 3,
  FRI: 4,
  SAT: 5,
  SUN: 6,
};

const SHARED_COLOR = "var(--primary)";
const EXCLUSIVE_COLOR = "#f59e0b";

function defaultStart(): string {
  return format(subDays(new Date(), 30), "yyyy-MM-dd");
}
function defaultEnd(): string {
  return format(new Date(), "yyyy-MM-dd");
}
function toISOStart(dateStr: string): string {
  return toBackendDateTime(startOfDay(parseISO(dateStr)));
}
function toISOEnd(dateStr: string): string {
  return toBackendDateTime(endOfDay(parseISO(dateStr)));
}
function fmtHours(h: number): string {
  const rounded = Math.round(h * 10000) / 10000;
  return String(rounded);
}
function fmtPct(p: number): string {
  if (!Number.isFinite(p)) return "—";
  return p.toFixed(p % 1 === 0 ? 0 : 1);
}
function fmtDateTime(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, HH:mm");
  } catch {
    return iso;
  }
}
function fmtTime(iso: string): string {
  try {
    return format(parseISO(iso), "HH:mm");
  } catch {
    return iso;
  }
}
function isDateRangeInvalid(start: string, end: string): boolean {
  return (
    !!start && !!end && parseISO(end).getTime() < parseISO(start).getTime()
  );
}
function dayIdx(dayOfWeek: string): number {
  const key = (dayOfWeek || "").toUpperCase().slice(0, 3);
  return DAY_INDEX[key] ?? -1;
}

const CHART_TOOLTIP_STYLE = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
} as const;

// ---------------------------------------------------------------------------
// Shared UI bits
// ---------------------------------------------------------------------------

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold tracking-tight",
              accent ?? "text-foreground",
            )}
          >
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </Card>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            Couldn&apos;t generate the report.
          </p>
          <p className="break-words text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="size-4" /> Retry
        </Button>
      </div>
    </Card>
  );
}

interface DateRangeBarProps {
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onGenerate: () => void;
  loading?: boolean;
  extra?: React.ReactNode;
}

function DateRangeBar({
  start,
  end,
  onStartChange,
  onEndChange,
  onGenerate,
  loading,
  extra,
}: DateRangeBarProps) {
  const invalid = isDateRangeInvalid(start, end);
  return (
    <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Start date
            </label>
            <Input
              type="date"
              value={start}
              onChange={(e) => onStartChange(e.target.value)}
              className="w-full sm:w-44"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              End date
            </label>
            <Input
              type="date"
              value={end}
              onChange={(e) => onEndChange(e.target.value)}
              className="w-full sm:w-44"
            />
          </div>
          {extra}
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <Button
            onClick={onGenerate}
            disabled={loading || invalid}
            className="gap-1.5"
          >
            {loading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {loading ? "Generating…" : "Generate"}
          </Button>
          {invalid && (
            <p className="text-xs text-destructive">
              End date must be on or after start date.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon className="size-4 text-muted-foreground" />
      {children}
    </div>
  );
}

function UtilizationPill({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const tone =
    clamped >= 80 ? "#f43f5e" : clamped >= 50 ? "#f59e0b" : "var(--primary)";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums"
      style={{
        backgroundColor: `color-mix(in oklch, ${tone} 14%, transparent)`,
        color: tone,
      }}
    >
      {fmtPct(clamped)}%
    </span>
  );
}

/** Inline equipment + date-range selector, shared by Equipment and Heatmap tabs. */
function EquipmentRangeBar({
  equipment,
  equipmentId,
  onEquipmentChange,
  start,
  end,
  onStartChange,
  onEndChange,
  onGenerate,
  loading,
}: {
  equipment: Equipment[];
  equipmentId: number | null;
  onEquipmentChange: (id: number) => void;
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onGenerate: () => void;
  loading: boolean;
}) {
  return (
    <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Equipment
            </label>
            <Select
              value={String(equipmentId ?? "")}
              onValueChange={(v) => onEquipmentChange(Number(v))}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.equipmentName} · {e.serial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Start date
            </label>
            <Input
              type="date"
              value={start}
              onChange={(e) => onStartChange(e.target.value)}
              className="w-full sm:w-44"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              End date
            </label>
            <Input
              type="date"
              value={end}
              onChange={(e) => onEndChange(e.target.value)}
              className="w-full sm:w-44"
            />
          </div>
        </div>
        <Button
          onClick={onGenerate}
          disabled={loading || equipmentId == null}
          className="gap-1.5"
        >
          {loading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {loading ? "Generating…" : "Generate"}
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------

export default function UtilizationPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Utilization Analytics"
        description="Track booked vs. available hours across equipment, scope, and time — driven by backend analytics endpoints."
      />
      <Tabs defaultValue="equipment" className="gap-4">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 py-1 sm:w-auto">
          <TabsTrigger value="equipment" className="gap-1.5">
            <Gauge className="size-3.5" /> Equipment
          </TabsTrigger>
          <TabsTrigger value="department" className="gap-1.5">
            <Building2 className="size-3.5" /> Department
          </TabsTrigger>
          <TabsTrigger value="institution" className="gap-1.5">
            <Layers className="size-3.5" /> Institution
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-1.5">
            <Grid3x3 className="size-3.5" /> Heatmap
          </TabsTrigger>
          <TabsTrigger value="idle" className="gap-1.5">
            <Clock className="size-3.5" /> Idle Time
          </TabsTrigger>
          <TabsTrigger value="peak" className="gap-1.5">
            <BarChart3 className="size-3.5" /> Peak Patterns
          </TabsTrigger>
          <TabsTrigger value="shared" className="gap-1.5">
            <PieChartIcon className="size-3.5" /> Shared vs Exclusive
          </TabsTrigger>
          <TabsTrigger value="realtime" className="gap-1.5">
            <Radio className="size-3.5" /> Real-Time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          <EquipmentTab />
        </TabsContent>
        <TabsContent value="department">
          <ScopeTab kind="department" />
        </TabsContent>
        <TabsContent value="institution">
          <ScopeTab kind="institution" />
        </TabsContent>
        <TabsContent value="heatmap">
          <HeatmapTab />
        </TabsContent>
        <TabsContent value="idle">
          <IdleTimeTab />
        </TabsContent>
        <TabsContent value="peak">
          <PeakTab />
        </TabsContent>
        <TabsContent value="shared">
          <SharedVsExclusiveTab />
        </TabsContent>
        <TabsContent value="realtime">
          <RealtimeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. EQUIPMENT TAB — bookingApi.utilization({equipmentId,start,end}) + benchmark
// ---------------------------------------------------------------------------

interface EquipParams {
  equipmentId: number;
  start: string;
  end: string;
}

function EquipmentTab() {
  const {
    data: equipment,
    loading: equipLoading,
    error: equipError,
    refetch: refetchEquip,
  } = useAsync<Equipment[]>(() => equipmentApi.getAllEquipment(), []);

  const [start, setStart] = useState(defaultStart());
  const [end, setEnd] = useState(defaultEnd());
  const [equipmentId, setEquipmentId] = useState<number | null>(null);
  const [params, setParams] = useState<EquipParams | null>(null);
  const [benchParams, setBenchParams] = useState<EquipParams | null>(null);

  const {
    data: report,
    loading,
    error,
    refetch,
  } = useAsync<UtilizationReport | undefined>(
    () =>
      params
        ? bookingApi.utilization(params)
        : Promise.resolve(undefined),
    [params],
  );

  const {
    data: benchmark,
    loading: benchLoading,
    error: benchError,
    refetch: refetchBench,
  } = useAsync<BenchmarkReport | undefined>(
    () =>
      benchParams
        ? bookingApi.benchmark(
            benchParams.equipmentId,
            benchParams.start,
            benchParams.end,
          )
        : Promise.resolve(undefined),
    [benchParams],
  );

  // Auto-pick the first equipment once the list loads.
  React.useEffect(() => {
    if (equipmentId === null && equipment && equipment.length > 0) {
      setEquipmentId(equipment[0].id);
    }
  }, [equipment, equipmentId]);

  function handleGenerate() {
    if (equipmentId == null) {
      toast.error("Select an equipment first.");
      return;
    }
    setParams({
      equipmentId,
      start: toISOStart(start),
      end: toISOEnd(end),
    });
  }

  function openBenchmark() {
    if (equipmentId == null) {
      toast.error("Select an equipment first.");
      return;
    }
    setBenchParams({
      equipmentId,
      start: toISOStart(start),
      end: toISOEnd(end),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {equipLoading ? (
        <ListSkeleton count={1} />
      ) : equipError ? (
        <ErrorCard message={equipError} onRetry={refetchEquip} />
      ) : (equipment?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No equipment available"
          description="Add equipment first, then come back to analyze its utilization."
        />
      ) : (
        <>
          <EquipmentRangeBar
            equipment={equipment!}
            equipmentId={equipmentId}
            onEquipmentChange={setEquipmentId}
            start={start}
            end={end}
            onStartChange={setStart}
            onEndChange={setEnd}
            onGenerate={handleGenerate}
            loading={loading}
          />

          {!params ? (
            <EmptyState
              icon={Gauge}
              title="Select an equipment and generate"
              description="Pick an equipment and a date range, then click Generate to view its utilization."
            />
          ) : loading ? (
            <CardSkeleton />
          ) : error ? (
            <ErrorCard message={error} onRetry={refetch} />
          ) : report ? (
            <div className="flex flex-col gap-4">
              <UtilizationGauge report={report} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Window: {fmtDateTime(params.start)} →{" "}
                  {fmtDateTime(params.end)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openBenchmark}
                  className="gap-1.5"
                >
                  <Activity className="size-4" /> View Benchmark
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <Dialog
        open={benchParams !== null}
        onOpenChange={(o) => !o && setBenchParams(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Benchmark</DialogTitle>
            <DialogDescription>
              Current vs. historical utilization for the selected equipment.
            </DialogDescription>
          </DialogHeader>
          {benchLoading ? (
            <CardSkeleton />
          ) : benchError ? (
            <ErrorCard message={benchError} onRetry={refetchBench} />
          ) : benchmark ? (
            <BenchmarkView benchmark={benchmark} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BenchmarkView({ benchmark }: { benchmark: BenchmarkReport }) {
  const TrendIcon =
    benchmark.trend === "INCREASING"
      ? TrendingUp
      : benchmark.trend === "DECREASING"
        ? TrendingDown
        : Minus;
  const trendColor =
    benchmark.trend === "INCREASING"
      ? "#10b981"
      : benchmark.trend === "DECREASING"
        ? "#f43f5e"
        : "var(--muted-foreground)";
  const trendLabel =
    benchmark.trend === "INCREASING"
      ? "Up"
      : benchmark.trend === "DECREASING"
        ? "Down"
        : "Stable";

  const data = React.useMemo(
    () =>
      benchmark.monthlyHistory.map((m) => ({
        month: m.month,
        utilization: m.utilizationPercentage,
      })),
    [benchmark.monthlyHistory],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 p-3">
          <p className="text-xs text-muted-foreground">Current</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {fmtPct(benchmark.currentPeriod.utilizationPercentage)}%
          </p>
        </div>
        <div className="rounded-xl border border-border/60 p-3">
          <p className="text-xs text-muted-foreground">
            Historical avg ({benchmark.historicalAverage.periodMonths}m)
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {fmtPct(benchmark.historicalAverage.utilizationPercentage)}%
          </p>
        </div>
        <div className="rounded-xl border border-border/60 p-3">
          <p className="text-xs text-muted-foreground">Trend</p>
          <div className="mt-1 flex items-center gap-1.5">
            <TrendIcon className="size-5" style={{ color: trendColor }} />
            <span
              className="text-xl font-semibold tabular-nums"
              style={{ color: trendColor }}
            >
              {trendLabel} {fmtPct(Math.abs(benchmark.deltaPercentage))}%
            </span>
          </div>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="rounded-xl border border-border/60 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Monthly history
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 8, bottom: 5, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/40"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v) => [`${fmtPct(Number(v))}%`, "Utilization"]}
              />
              <Line
                type="monotone"
                dataKey="utilization"
                stroke={PRIMARY}
                strokeWidth={2}
                dot={{ r: 3, fill: PRIMARY }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2 & 3. SCOPE TAB (Department / Institution) — backend scopeUtilization
// ---------------------------------------------------------------------------

interface ScopeParams {
  scopeId: number;
  start: string;
  end: string;
}

function ScopeTab({ kind }: { kind: "department" | "institution" }) {
  const label = kind === "department" ? "Department" : "Institution";
  const Icon = kind === "department" ? Building2 : Layers;

  const {
    data: scopes,
    loading: scopesLoading,
    error: scopesError,
    refetch: refetchScopes,
  } = useAsync<Department[] | Institution[]>(
    () =>
      kind === "department"
        ? departmentApi.list()
        : institutionApi.list(),
    [kind],
  );

  const [start, setStart] = useState(defaultStart());
  const [end, setEnd] = useState(defaultEnd());
  const [scopeId, setScopeId] = useState<number | null>(null);
  const [params, setParams] = useState<ScopeParams | null>(null);

  const {
    data: report,
    loading,
    error,
    refetch,
  } = useAsync<ScopeUtilizationReport | undefined>(
    () =>
      params
        ? kind === "department"
          ? bookingApi.departmentUtilization(
              params.scopeId,
              params.start,
              params.end,
            )
          : bookingApi.institutionUtilization(
              params.scopeId,
              params.start,
              params.end,
            )
        : Promise.resolve(undefined),
    [params, kind],
  );

  // Auto-pick the first scope once the list loads.
  React.useEffect(() => {
    if (scopeId === null && scopes && scopes.length > 0) {
      setScopeId(scopes[0].id);
    }
  }, [scopes, scopeId]);

  function handleGenerate() {
    if (scopeId == null) {
      toast.error(`Select a ${kind} first.`);
      return;
    }
    setParams({ scopeId, start: toISOStart(start), end: toISOEnd(end) });
  }

  return (
    <div className="flex flex-col gap-4">
      {scopesLoading ? (
        <ListSkeleton count={1} />
      ) : scopesError ? (
        <ErrorCard message={scopesError} onRetry={refetchScopes} />
      ) : (scopes?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Icon}
          title={`No ${kind}s available`}
          description={`Add ${kind}s first, then come back to analyze their utilization.`}
        />
      ) : (
        <>
          <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {label}
                  </label>
                  <Select
                    value={String(scopeId ?? "")}
                    onValueChange={(v) => setScopeId(Number(v))}
                  >
                    <SelectTrigger className="w-full sm:w-72">
                      <SelectValue placeholder={`Select ${kind}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {scopes!.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Start date
                  </label>
                  <Input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-full sm:w-44"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    End date
                  </label>
                  <Input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full sm:w-44"
                  />
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={loading || scopeId == null}
                className="gap-1.5"
              >
                {loading ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {loading ? "Generating…" : "Generate"}
              </Button>
            </div>
          </Card>

          {!params ? (
            <EmptyState
              icon={Icon}
              title={`Select a ${kind} and generate`}
              description={`Pick a ${kind} and a date range, then click Generate.`}
            />
          ) : loading ? (
            <CardSkeleton />
          ) : error ? (
            <ErrorCard message={error} onRetry={refetch} />
          ) : report ? (
            <ScopeReportView report={report} />
          ) : null}
        </>
      )}
    </div>
  );
}

function ScopeReportView({ report }: { report: ScopeUtilizationReport }) {
  const pct = Math.max(0, Math.min(100, report.utilizationPercentage));
  const sorted = React.useMemo(
    () =>
      [...report.perEquipment].sort(
        (a, b) => b.utilizationPercentage - a.utilizationPercentage,
      ),
    [report.perEquipment],
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              {report.scopeName}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {fmtPct(pct)}%
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {report.totalEquipment} equipment ·{" "}
              {fmtHours(report.totalBookedHours)}h booked ·{" "}
              {fmtHours(report.totalAvailableHours)}h available
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            {report.scope}
          </Badge>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: PRIMARY }}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Window: {fmtDateTime(report.periodStart)} →{" "}
          {fmtDateTime(report.periodEnd)}
        </p>
      </Card>

      <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
        <SectionLabel icon={Gauge}>Per-equipment breakdown</SectionLabel>
        {sorted.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No equipment in this scope.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead className="text-right">Booked (h)</TableHead>
                  <TableHead className="text-right">Available (h)</TableHead>
                  <TableHead className="text-right">Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => (
                  <TableRow key={r.equipmentId}>
                    <TableCell className="font-medium text-foreground">
                      {r.equipmentName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtHours(r.bookedHours)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtHours(r.availableHours)}
                    </TableCell>
                    <TableCell className="text-right">
                      <UtilizationPill pct={r.utilizationPercentage} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. HEATMAP TAB — bookingApi.heatmap(equipmentId, start, end) → 7×24 grid
// ---------------------------------------------------------------------------

interface HeatmapParams {
  equipmentId: number;
  start: string;
  end: string;
}

function HeatmapTab() {
  const {
    data: equipment,
    loading: equipLoading,
    error: equipError,
    refetch: refetchEquip,
  } = useAsync<Equipment[]>(() => equipmentApi.getAllEquipment(), []);

  const [start, setStart] = useState(defaultStart());
  const [end, setEnd] = useState(defaultEnd());
  const [equipmentId, setEquipmentId] = useState<number | null>(null);
  const [params, setParams] = useState<HeatmapParams | null>(null);

  const {
    data: heatmap,
    loading,
    error,
    refetch,
  } = useAsync<HeatmapReport | undefined>(
    () =>
      params
        ? bookingApi.heatmap(params.equipmentId, params.start, params.end)
        : Promise.resolve(undefined),
    [params],
  );

  // Auto-pick first equipment.
  React.useEffect(() => {
    if (equipmentId === null && equipment && equipment.length > 0) {
      setEquipmentId(equipment[0].id);
    }
  }, [equipment, equipmentId]);

  // Build a 7×24 grid of {booked, count} from the flat HeatmapPoint[].
  const grid = React.useMemo(() => {
    const g: { booked: number; count: number }[][] = Array.from(
      { length: 7 },
      () => Array.from({ length: 24 }, () => ({ booked: 0, count: 0 })),
    );
    for (const p of heatmap?.heatmap ?? []) {
      const d = dayIdx(p.dayOfWeek);
      if (d < 0) continue;
      const h = Math.max(0, Math.min(23, p.hourOfDay));
      g[d][h].booked += p.bookedHours;
      g[d][h].count += p.bookingCount;
    }
    return g;
  }, [heatmap]);

  const maxBooked = React.useMemo(() => {
    let m = 0;
    for (const row of grid) for (const c of row) if (c.booked > m) m = c.booked;
    return m;
  }, [grid]);

  function handleGenerate() {
    if (equipmentId == null) {
      toast.error("Select an equipment first.");
      return;
    }
    setParams({
      equipmentId,
      start: toISOStart(start),
      end: toISOEnd(end),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {equipLoading ? (
        <ListSkeleton count={1} />
      ) : equipError ? (
        <ErrorCard message={equipError} onRetry={refetchEquip} />
      ) : (equipment?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Grid3x3}
          title="No equipment available"
          description="Add equipment first, then come back to render a heatmap."
        />
      ) : (
        <>
          <EquipmentRangeBar
            equipment={equipment!}
            equipmentId={equipmentId}
            onEquipmentChange={setEquipmentId}
            start={start}
            end={end}
            onStartChange={setStart}
            onEndChange={setEnd}
            onGenerate={handleGenerate}
            loading={loading}
          />

          {!params ? (
            <EmptyState
              icon={Grid3x3}
              title="Pick an equipment and generate"
              description="Select equipment and a date range, then click Generate to render the day × hour heatmap."
            />
          ) : loading ? (
            <CardSkeleton />
          ) : error ? (
            <ErrorCard message={error} onRetry={refetch} />
          ) : heatmap && maxBooked === 0 ? (
            <EmptyState
              icon={Grid3x3}
              title="No heatmap data for this range"
              description="No bookings occurred for this equipment in the selected period."
            />
          ) : heatmap ? (
            <Card className="rounded-2xl border-border/60 p-6 shadow-soft overflow-hidden">
              <SectionLabel icon={Grid3x3}>
                Booking intensity heatmap
              </SectionLabel>
              <p className="mt-1 text-xs text-muted-foreground">
                Each cell = booked hours aggregated per day. Darker green = higher utilization.
                Hover for details.
              </p>

              {/* GitHub-style heatmap */}
              <div className="mt-6 overflow-x-auto pb-2">
                <div className="min-w-[600px]">
                  {/* Day labels on left */}
                  <div className="flex">
                    <div className="flex flex-col justify-between mr-3 py-1">
                      <div className="h-[12px] text-[10px] text-muted-foreground text-right w-8">Sun</div>
                      <div className="h-[12px] text-[10px] text-muted-foreground text-right w-8">Mon</div>
                      <div className="h-[12px] text-[10px] text-muted-foreground text-right w-8">Tue</div>
                      <div className="h-[12px] text-[10px] text-muted-foreground text-right w-8">Wed</div>
                      <div className="h-[12px] text-[10px] text-muted-foreground text-right w-8">Thu</div>
                      <div className="h-[12px] text-[10px] text-muted-foreground text-right w-8">Fri</div>
                      <div className="h-[12px] text-[10px] text-muted-foreground text-right w-8">Sat</div>
                    </div>

                    {/* Heatmap grid - aggregate by day of week */}
                    <div className="flex gap-[4px]">
                      {grid.map((dayData, dayIdx) => {
                        // Aggregate all hours for this day of week
                        const totalBooked = dayData.reduce((sum, h) => sum + h.booked, 0);
                        const totalCount = dayData.reduce((sum, h) => sum + h.count, 0);
                        const intensity = maxBooked > 0 ? Math.round((totalBooked / maxBooked) * 100) : 0;
                        
                        // GitHub-inspired colors: emerald green gradient
                        const getBgColor = (intensity: number, booked: number) => {
                          if (booked === 0) return 'bg-[#ebedf0] dark:bg-[#161b22]';
                          if (intensity < 15) return 'bg-[#9be9a8]';
                          if (intensity < 30) return 'bg-[#40c463]';
                          if (intensity < 60) return 'bg-[#30a14e]';
                          return 'bg-[#216e39]';
                        };
                        
                        return (
                          <div key={dayIdx} className="flex flex-col gap-[4px]">
                            <div className="text-[10px] text-muted-foreground text-center mb-1">
                              {DAY_LABELS[dayIdx]}
                            </div>
                            <div
                              title={`${DAY_LABELS[dayIdx]} — ${fmtHours(totalBooked)}h booked · ${totalCount} booking${totalCount === 1 ? '' : 's'}`}
                              className={cn(
                                "w-[52px] h-[52px] rounded-lg transition-all duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-[#216e39] cursor-pointer flex items-center justify-center shadow-sm",
                                getBgColor(intensity, totalBooked)
                              )}
                            >
                              <span className={cn(
                                "text-xs font-semibold",
                                totalBooked === 0 ? "text-muted-foreground" : "text-white drop-shadow-md"
                              )}>
                                {totalBooked > 0 ? fmtHours(totalBooked) + 'h' : '-'}
                              </span>
                            </div>
                            {/* Hour breakdown on hover */}
                            <div className="space-y-0.5">
                              {[0, 6, 12, 18].map(h => (
                                <div key={h} className="text-[8px] text-muted-foreground text-center">
                                  {dayData[h]?.booked > 0 ? `${fmtHours(dayData[h].booked)}h` : ''}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hour legend at bottom */}
                  <div className="flex justify-center gap-6 mt-4 text-[10px] text-muted-foreground">
                    <span>Midnight</span>
                    <span>6 AM</span>
                    <span>Noon</span>
                    <span>6 PM</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Less</span>
                <div className="flex gap-[4px]">
                  <div className="w-6 h-6 rounded-lg bg-[#ebedf0] dark:bg-[#161b22]" />
                  <div className="w-6 h-6 rounded-lg bg-[#9be9a8]" />
                  <div className="w-6 h-6 rounded-lg bg-[#40c463]" />
                  <div className="w-6 h-6 rounded-lg bg-[#30a14e]" />
                  <div className="w-6 h-6 rounded-lg bg-[#216e39]" />
                </div>
                <span className="text-xs text-muted-foreground">More</span>
                <span className="ml-auto text-xs text-muted-foreground font-medium">
                  Peak: {fmtHours(maxBooked)}h booked in a slot
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Window: {fmtDateTime(heatmap.periodStart)} →{" "}
                {fmtDateTime(heatmap.periodEnd)}
              </p>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. IDLE TIME TAB — bookingApi.idleReport(start, end, thresholdHours)
// ---------------------------------------------------------------------------

interface IdleParams {
  start: string;
  end: string;
  thresholdHours: number;
}

function IdleTimeTab() {
  const [start, setStart] = useState(defaultStart());
  const [end, setEnd] = useState(defaultEnd());
  const [threshold, setThreshold] = useState(500);
  const [params, setParams] = useState<IdleParams | null>(null);

  const {
    data: report,
    loading,
    error,
    refetch,
  } = useAsync<IdleReport | undefined>(
    () =>
      params
        ? bookingApi.idleReport(
            params.start,
            params.end,
            params.thresholdHours,
          )
        : Promise.resolve(undefined),
    [params],
  );

  const rows = React.useMemo<IdleEquipmentRow[]>(
    () =>
      report
        ? [...report.idleEquipment].sort((a, b) => b.idleHours - a.idleHours)
        : [],
    [report],
  );

  function handleGenerate() {
    setParams({
      start: toISOStart(start),
      end: toISOEnd(end),
      thresholdHours: threshold,
    });
  }

  function handleExport() {
    if (!report || report.idleEquipment.length === 0) {
      toast.error("Nothing to export.");
      return;
    }
    exportIdleCsv(report.idleEquipment, params!);
    toast.success("CSV exported.");
  }

  return (
    <div className="flex flex-col gap-4">
      <DateRangeBar
        start={start}
        end={end}
        onStartChange={setStart}
        onEndChange={setEnd}
        onGenerate={handleGenerate}
        loading={loading}
        extra={
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Threshold (idle hours)
            </label>
            <Input
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 0)}
              className="w-full sm:w-36"
            />
          </div>
        }
      />

      {!params ? (
        <EmptyState
          icon={Clock}
          title="Pick a range and generate"
          description="Set a date range and an idle-hours threshold. Equipment with at least that many available hours is considered idle."
        />
      ) : loading ? (
        <ListSkeleton count={3} />
      ) : error ? (
        <ErrorCard message={error} onRetry={refetch} />
      ) : report && rows.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No idle equipment in this range"
          description={`Nothing met the ${params.thresholdHours}h idle threshold for the selected period.`}
        />
      ) : report ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile
              label="Idle equipment"
              value={report.totalIdleCount}
              hint={`≥ ${params.thresholdHours}h available`}
              icon={Clock}
            />
            <StatTile
              label="Period start"
              value={fmtDateTime(params.start)}
              icon={CalendarRange}
            />
            <StatTile
              label="Period end"
              value={fmtDateTime(params.end)}
              icon={CalendarRange}
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1.5"
            >
              <Download className="size-4" /> Export CSV
            </Button>
          </div>

          <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
            <SectionLabel icon={Clock}>
              Idle equipment ({rows.length})
            </SectionLabel>
            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Booked (h)</TableHead>
                    <TableHead className="text-right">Available (h)</TableHead>
                    <TableHead className="text-right">Idle (h)</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.equipmentId}>
                      <TableCell className="font-medium text-foreground">
                        {r.equipmentName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.serial}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.department ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtHours(r.bookedHours)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtHours(r.availableHours)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                        {fmtHours(r.idleHours)}
                      </TableCell>
                      <TableCell className="text-right">
                        <UtilizationPill pct={r.utilizationPercentage} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} type="equipment" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function exportIdleCsv(
  rows: IdleEquipmentRow[],
  params: IdleParams,
): void {
  const headers = [
    "Equipment Name",
    "Serial",
    "Department",
    "Booked Hours",
    "Available Hours",
    "Idle Hours",
    "Utilization %",
    "Status",
  ];
  const escape = (v: string | number | null | undefined): string => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        escape(r.equipmentName),
        escape(r.serial),
        escape(r.department),
        r.bookedHours,
        r.availableHours,
        r.idleHours,
        r.utilizationPercentage,
        escape(r.status),
      ].join(","),
    );
  }
  lines.push("");
  lines.push(
    `# period: ${params.start} → ${params.end} · threshold: ${params.thresholdHours}h`,
  );
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `idle-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// 6. PEAK PATTERNS TAB — bookingApi.peakAnalysis(start, end)
// ---------------------------------------------------------------------------

interface RangeParams {
  start: string;
  end: string;
}

function PeakTab() {
  const [start, setStart] = useState(defaultStart());
  const [end, setEnd] = useState(defaultEnd());
  const [params, setParams] = useState<RangeParams | null>(null);

  const {
    data: report,
    loading,
    error,
    refetch,
  } = useAsync<PeakReport | undefined>(
    () =>
      params
        ? bookingApi.peakAnalysis(params.start, params.end)
        : Promise.resolve(undefined),
    [params],
  );

  function handleGenerate() {
    setParams({ start: toISOStart(start), end: toISOEnd(end) });
  }

  const hourlyData = React.useMemo(
    () =>
      (report?.hourlyDistribution ?? []).map((d) => ({
        hour: `${d.hour}:00`,
        bookedHours: d.bookedHours,
      })),
    [report],
  );
  const dailyData = React.useMemo(
    () => report?.dailyDistribution ?? [],
    [report],
  );

  return (
    <div className="flex flex-col gap-4">
      <DateRangeBar
        start={start}
        end={end}
        onStartChange={setStart}
        onEndChange={setEnd}
        onGenerate={handleGenerate}
        loading={loading}
      />

      {!params ? (
        <EmptyState
          icon={BarChart3}
          title="Pick a range and generate"
          description="Set a date range, then click Generate to surface peak booking hours and days."
        />
      ) : loading ? (
        <ListSkeleton count={2} />
      ) : error ? (
        <ErrorCard message={error} onRetry={refetch} />
      ) : report ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatTile
              label="Peak hour"
              value={
                report.peakHourOfDay != null
                  ? `${report.peakHourOfDay}:00`
                  : "—"
              }
              hint={`${fmtHours(report.peakHourBookedHours)}h booked`}
              icon={Clock}
            />
            <StatTile
              label="Peak day"
              value={report.peakDayOfWeek ?? "—"}
              hint={`${fmtHours(report.peakDayBookedHours)}h booked`}
              icon={CalendarRange}
            />
          </div>

          <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
            <SectionLabel icon={BarChart3}>Hourly distribution</SectionLabel>
            {hourlyData.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No hourly data for this range.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={hourlyData}
                  margin={{ top: 10, right: 12, bottom: 5, left: -10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/40"
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(v) => [`${fmtHours(Number(v))}h`, "Booked"]}
                  />
                  <Bar
                    dataKey="bookedHours"
                    fill={PRIMARY}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
            <SectionLabel icon={CalendarRange}>
              Daily distribution
            </SectionLabel>
            {dailyData.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No daily data for this range.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={dailyData}
                  margin={{ top: 10, right: 12, bottom: 5, left: -10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/40"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(v) => [`${fmtHours(Number(v))}h`, "Booked"]}
                  />
                  <Bar
                    dataKey="bookedHours"
                    fill={PRIMARY}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. SHARED vs EXCLUSIVE TAB — bookingApi.sharedVsExclusive(start, end)
// ---------------------------------------------------------------------------

function SharedVsExclusiveTab() {
  const [start, setStart] = useState(defaultStart());
  const [end, setEnd] = useState(defaultEnd());
  const [params, setParams] = useState<RangeParams | null>(null);

  const {
    data: report,
    loading,
    error,
    refetch,
  } = useAsync<SharedVsExclusiveReport | undefined>(
    () =>
      params
        ? bookingApi.sharedVsExclusive(params.start, params.end)
        : Promise.resolve(undefined),
    [params],
  );

  function handleGenerate() {
    setParams({ start: toISOStart(start), end: toISOEnd(end) });
  }

  const pieData = React.useMemo(
    () =>
      report
        ? [
            {
              name: "Shared",
              value: report.sharedEquipment.count,
              color: SHARED_COLOR,
            },
            {
              name: "Exclusive",
              value: report.exclusiveEquipment.count,
              color: EXCLUSIVE_COLOR,
            },
          ]
        : [],
    [report],
  );

  const hasPieData = pieData.some((d) => d.value > 0);

  return (
    <div className="flex flex-col gap-4">
      <DateRangeBar
        start={start}
        end={end}
        onStartChange={setStart}
        onEndChange={setEnd}
        onGenerate={handleGenerate}
        loading={loading}
      />

      {!params ? (
        <EmptyState
          icon={PieChartIcon}
          title="Pick a range and generate"
          description="Set a date range, then click Generate to compare shared vs. exclusive equipment usage."
        />
      ) : loading ? (
        <ListSkeleton count={2} />
      ) : error ? (
        <ErrorCard message={error} onRetry={refetch} />
      ) : report ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatTile
              label="Shared equipment"
              value={report.sharedEquipment.count}
              hint={`${fmtHours(
                report.sharedEquipment.totalBookedHours,
              )}h · avg ${fmtPct(
                report.sharedEquipment.avgUniqueUsersPerEquipment,
              )} users`}
              icon={Users}
              accent="text-primary"
            />
            <StatTile
              label="Exclusive equipment"
              value={report.exclusiveEquipment.count}
              hint={`${fmtHours(
                report.exclusiveEquipment.totalBookedHours,
              )}h · avg ${fmtPct(
                report.exclusiveEquipment.avgUniqueUsersPerEquipment,
              )} users`}
              icon={Users}
              accent="text-amber-600 dark:text-amber-400"
            />
          </div>

          {hasPieData ? (
            <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
              <SectionLabel icon={PieChartIcon}>Count split</SectionLabel>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(v) => [String(v), "Equipment"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          ) : null}

          <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
            <SectionLabel icon={Users}>
              Per-equipment breakdown
            </SectionLabel>
            {report.perEquipment.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No equipment usage in this range.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">
                        Unique users
                      </TableHead>
                      <TableHead className="text-right">Booked (h)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.perEquipment.map((r) => (
                      <TableRow key={r.equipmentId}>
                        <TableCell className="font-medium text-foreground">
                          {r.equipmentName}
                        </TableCell>
                        <TableCell>
                          {r.type === "SHARED" ? (
                            <Badge className="bg-primary/15 text-primary">
                              SHARED
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
                              EXCLUSIVE
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.uniqueUsers}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmtHours(r.bookedHours)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. REAL-TIME TAB — bookingApi.realtimeUsage(), auto-refresh 30s
// ---------------------------------------------------------------------------

function RealtimeTab() {
  const {
    data,
    loading,
    error,
    refetch,
  } = useAsync<RealtimeUsage | undefined>(
    () => bookingApi.realtimeUsage(),
    [],
  );

  // Hold the latest refetch in a ref so the interval closure stays stable and
  // the interval can be created once on mount.
  const refetchRef = React.useRef(refetch);
  refetchRef.current = refetch;

  React.useEffect(() => {
    const id = setInterval(() => refetchRef.current(), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <p className="text-sm font-medium text-foreground">
              Live · auto-refreshes every 30s
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="gap-1.5"
          >
            <RefreshCw className="size-4" /> Refresh now
          </Button>
        </div>
      </Card>

      {loading && !data ? (
        <ListSkeleton count={2} />
      ) : error ? (
        <ErrorCard message={error} onRetry={refetch} />
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="In Use"
              value={data.inUseCount}
              icon={Activity}
              accent="text-emerald-600 dark:text-emerald-400"
            />
            <StatTile
              label="Available"
              value={data.availableCount}
              icon={Gauge}
              accent="text-primary"
            />
            <StatTile
              label="Booked"
              value={data.bookedCount}
              icon={CalendarRange}
              accent="text-amber-600 dark:text-amber-400"
            />
            <StatTile
              label="Maintenance"
              value={data.maintenanceCount}
              icon={Clock}
              accent="text-rose-600 dark:text-rose-400"
            />
          </div>

          <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
            <SectionLabel icon={Radio}>
              In-use equipment ({data.inUseEquipment.length})
            </SectionLabel>
            {data.inUseEquipment.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No equipment currently in use.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Time window</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.inUseEquipment.map((e) => (
                      <TableRow key={e.bookingId}>
                        <TableCell className="font-medium text-foreground">
                          {e.equipmentName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {e.user.username}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {fmtTime(e.startTime)}–{fmtTime(e.endTime)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-amber-600 dark:text-amber-400">
                          {e.remainingMinutes}m remaining
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
