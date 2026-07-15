import * as React from "react";
import { useState, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Flame,
  Gauge,
  Grid3x3,
  Layers,
  PieChart as PieChartIcon,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
  Filter,
  X,
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
  subMonths,
} from "date-fns";

import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { bookingApi, dashboardApi } from "@/lib/api/bookingApi";
import { toBackendDateTime } from "@/lib/constants";
import { equipmentApi, departmentApi, institutionApi } from "@/lib/api/equipmentApi";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton, ListSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";

import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type {
  DashboardStats,
  Equipment,
  HeatmapReport,
  IdleEquipmentRow,
  IdleReport,
  PeakReport,
  RealtimeUsage,
  UtilizationReport,
  Department,
  Institution,
} from "@/types";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const PRIMARY = "var(--primary)";
const SUCCESS = "#10b981";
const WARNING = "#f59e0b";
const DANGER = "#f43f5e";

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
  const rounded = Math.round(h * 100) / 100;
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
// Shared UI components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  trend,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <Card className="rounded-2xl border-border/60 p-5 shadow-soft hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp className="size-3 text-green-500" />
              ) : (
                <TrendingDown className="size-3 text-red-500" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-green-500" : "text-red-500",
                )}
              >
                {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              accent ? "bg-opacity-10" : "bg-primary/10",
              accent ? "" : "text-primary",
            )}
            style={{ backgroundColor: accent ? `${accent}20` : undefined, color: accent || undefined }}
          >
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </Card>
  );
}

function EquipmentUtilizationCard({
  equipment,
  utilization,
  onClick,
}: {
  equipment: Equipment;
  utilization?: UtilizationReport;
  onClick?: () => void;
}) {
  const pct = utilization?.utilizationPercentage ?? 0;
  const statusColor =
    pct >= 80 ? SUCCESS : pct >= 50 ? WARNING : pct >= 20 ? PRIMARY : DANGER;

  return (
    <Card
      className="rounded-2xl border-border/60 p-4 shadow-soft hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{equipment.equipmentName}</p>
          <p className="text-xs text-muted-foreground">{equipment.serial}</p>
        </div>
        <StatusBadge status={equipment.status} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Utilization</span>
          <span
            className="text-sm font-semibold"
            style={{ color: statusColor }}
          >
            {fmtPct(pct)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, pct)}%`, backgroundColor: statusColor }}
          />
        </div>
        {utilization && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{fmtHours(utilization.bookedHours)}h booked</span>
            <span>{fmtHours(utilization.availableHours)}h available</span>
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
            Couldn&apos;t load data.
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

// ---------------------------------------------------------------------------
// Filter Bar Component
// ---------------------------------------------------------------------------

interface FilterBarProps {
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onApply: () => void;
  loading?: boolean;
  equipment?: Equipment[];
  equipmentId?: number | null;
  onEquipmentChange?: (id: number) => void;
  departments?: Department[];
  departmentId?: number | null;
  onDepartmentChange?: (id: number) => void;
  institutions?: Institution[];
  institutionId?: number | null;
  onInstitutionChange?: (id: number) => void;
}

function FilterBar({
  start,
  end,
  onStartChange,
  onEndChange,
  onApply,
  loading,
  equipment,
  equipmentId,
  onEquipmentChange,
  departments,
  departmentId,
  onDepartmentChange,
  institutions,
  institutionId,
  onInstitutionChange,
}: FilterBarProps) {
  const invalid = isDateRangeInvalid(start, end);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Dashboard Filters</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            {showFilters ? (
              <>
                <X className="size-4" /> Hide Filters
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Show Filters
              </>
            )}
          </Button>
        </div>

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
                className="w-full sm:w-40"
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
                className="w-full sm:w-40"
              />
            </div>

            {showFilters && (
              <>
                {equipment && onEquipmentChange && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Equipment
                    </label>
                    <Select
                      value={String(equipmentId ?? "")}
                      onValueChange={(v) => onEquipmentChange(Number(v))}
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="All equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All equipment</SelectItem>
                        {equipment.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>
                            {e.equipmentName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {departments && onDepartmentChange && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Department
                    </label>
                    <Select
                      value={String(departmentId ?? "")}
                      onValueChange={(v) => onDepartmentChange(Number(v))}
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="All departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All departments</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {institutions && onInstitutionChange && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Institution
                    </label>
                    <Select
                      value={String(institutionId ?? "")}
                      onValueChange={(v) => onInstitutionChange(Number(v))}
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="All institutions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All institutions</SelectItem>
                        {institutions.map((i) => (
                          <SelectItem key={i.id} value={String(i.id)}>
                            {i.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <Button
              onClick={onApply}
              disabled={loading || invalid}
              className="gap-1.5"
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {loading ? "Loading…" : "Apply Filters"}
            </Button>
            {invalid && (
              <p className="text-xs text-destructive">
                End date must be on or after start date.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Heatmap Component - Enhanced UI
// ---------------------------------------------------------------------------

function UtilizationHeatmap({ data }: { data: HeatmapReport }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = DAY_LABELS;
  const [hoveredCell, setHoveredCell] = React.useState<{day: string; hour: number; hours: number} | null>(null);

  const heatmapData = React.useMemo(() => {
    const map = new Map<string, number>();
    data.heatmap.forEach((point) => {
      const key = `${dayIdx(point.dayOfWeek)}-${point.hourOfDay}`;
      map.set(key, point.bookedHours);
    });
    return map;
  }, [data.heatmap]);

  const maxHours = Math.max(...data.heatmap.map((h) => h.bookedHours), 1);

  // Enhanced color gradient with better visual distinction
  const getColor = (hours: number, hovered = false) => {
    const intensity = maxHours > 0 ? hours / maxHours : 0;
    
    if (hours === 0) {
      return {
        bg: "bg-slate-100 dark:bg-slate-800/50",
        text: "text-slate-400 dark:text-slate-500",
        ring: "ring-slate-200 dark:ring-slate-700"
      };
    }
    
    // Gradient from cool blue to warm orange/red based on utilization
    if (intensity < 0.2) {
      return {
        bg: hovered ? "bg-emerald-200 dark:bg-emerald-900/50" : "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-300",
        ring: "ring-emerald-400"
      };
    }
    if (intensity < 0.4) {
      return {
        bg: hovered ? "bg-teal-200 dark:bg-teal-900/50" : "bg-teal-100 dark:bg-teal-900/30",
        text: "text-teal-700 dark:text-teal-300",
        ring: "ring-teal-400"
      };
    }
    if (intensity < 0.6) {
      return {
        bg: hovered ? "bg-blue-200 dark:bg-blue-900/50" : "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-300",
        ring: "ring-blue-400"
      };
    }
    if (intensity < 0.8) {
      return {
        bg: hovered ? "bg-amber-200 dark:bg-amber-900/50" : "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-300",
        ring: "ring-amber-400"
      };
    }
    return {
      bg: hovered ? "bg-rose-200 dark:bg-rose-900/50" : "bg-rose-100 dark:bg-rose-900/30",
      text: "text-rose-700 dark:text-rose-300",
      ring: "ring-rose-400"
    };
  };

  const formatHour = (h: number) => {
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  return (
    <Card className="rounded-2xl border-border/60 overflow-hidden shadow-soft">
      {/* Header */}
      <div className="bg-gradient-to-r from-muted/50 to-muted/30 px-5 py-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
              <Grid3x3 className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Weekly Utilization Heatmap</h3>
              <p className="text-xs text-muted-foreground">
                Equipment usage patterns by day and hour
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium px-3 py-1.5 bg-background/50">
              <Calendar className="size-3 mr-1.5" />
              {format(parseISO(data.periodStart), "MMM d")} - {format(parseISO(data.periodEnd), "MMM d")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="p-5">
        {/* Hour labels - simplified */}
        <div className="flex mb-3 ml-12">
          <div className="text-[10px] text-muted-foreground/60 font-medium grid grid-cols-24 gap-0.5 w-full">
            {hours.filter((_, i) => i % 3 === 0).map((hour) => (
              <div key={hour} className="text-center">{formatHour(hour)}</div>
            ))}
          </div>
        </div>

        {/* Day rows */}
        <div className="space-y-1.5">
          {days.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-2">
              {/* Day label */}
              <div className="w-12 text-xs font-medium text-muted-foreground text-right pr-2">
                {day}
              </div>
              
              {/* Hour cells */}
              <div className="flex gap-0.5 flex-1">
                {hours.map((hour) => {
                  const key = `${dayIdx}-${hour}`;
                  const hoursBooked = heatmapData.get(key) || 0;
                  const color = getColor(hoursBooked, hoveredCell?.day === day && hoveredCell?.hour === hour);
                  const isHovered = hoveredCell?.day === day && hoveredCell?.hour === hour;
                  
                  return (
                    <div
                      key={hour}
                      className={cn(
                        "flex-1 h-7 rounded-md flex items-center justify-center text-[10px] font-semibold transition-all duration-200 cursor-pointer",
                        color.bg,
                        color.text,
                        isHovered && "ring-2 ring-offset-1 ring-offset-background z-10 scale-110 shadow-lg"
                      )}
                      onMouseEnter={() => setHoveredCell({ day, hour, hours: hoursBooked })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {hoursBooked > 0 && hoursBooked < 10 && hoursBooked.toFixed(1)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Utilization:</span>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-[9px] font-semibold text-slate-400" title="No usage">0</div>
                <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[9px] font-semibold text-emerald-700" title="Low">L</div>
                <div className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-[9px] font-semibold text-teal-700" title="Light">L</div>
                <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[9px] font-semibold text-blue-700" title="Medium">M</div>
                <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[9px] font-semibold text-amber-700" title="High">H</div>
                <div className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-[9px] font-semibold text-rose-700" title="Very High">V</div>
              </div>
            </div>
            
            {/* Hover tooltip preview */}
            {hoveredCell ? (
              <div className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-1.5 rounded-lg border border-border/40 animate-fade-in">
                <Clock className="size-3.5 text-primary" />
                <span className="font-medium">{hoveredCell.day} {formatHour(hoveredCell.hour)}:</span>
                <Badge variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/20">
                  {hoveredCell.hours > 0 ? `${hoveredCell.hours.toFixed(2)}h` : "No usage"}
                </Badge>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/60">Hover over cells for details</span>
            )}
          </div>
          
          {/* Gradient bar */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/60">No Usage</span>
            <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-slate-100 via-emerald-200 teal-200 blue-200 amber-200 to-rose-200 dark:from-slate-800/50 dark:via-emerald-900/30 dark:teal-900/30 dark:blue-900/30 dark:amber-900/30 dark:to-rose-900/30" />
            <span className="text-[10px] text-muted-foreground/60">Peak Usage</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Idle Equipment Component
// ---------------------------------------------------------------------------

function IdleEquipmentTable({ data }: { data: IdleReport }) {
  return (
    <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Clock className="size-4 text-warning" />
          Idle Equipment
        </h3>
        <Badge variant="outline" className="text-xs">
          {data.totalIdleCount} items
        </Badge>
      </div>

      {data.idleEquipment.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No idle equipment"
          description="All equipment has been utilized within the threshold."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Idle Hours</TableHead>
                <TableHead className="text-right">Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.idleEquipment.map((item) => (
                <TableRow key={item.equipmentId}>
                  <TableCell className="font-medium">{item.equipmentName}</TableCell>
                  <TableCell className="text-muted-foreground">{item.serial}</TableCell>
                  <TableCell>{item.department || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium text-warning">
                    {fmtHours(item.idleHours)}h
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-medium",
                        item.utilizationPercentage < 20 ? "text-danger" : "",
                      )}
                    >
                      {fmtPct(item.utilizationPercentage)}%
                    </span>
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
// Peak Analysis Component
// ---------------------------------------------------------------------------

function PeakAnalysisChart({ data }: { data: PeakReport }) {
  const hourlyData = React.useMemo(
    () =>
      data.hourlyDistribution.map((h) => ({
        hour: h.hour,
        hours: h.bookedHours,
      })),
    [data.hourlyDistribution],
  );

  const dailyData = React.useMemo(
    () =>
      data.dailyDistribution.map((d) => ({
        day: d.day.slice(0, 3),
        hours: d.bookedHours,
      })),
    [data.dailyDistribution],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Flame className="size-4 text-orange-500" />
          Hourly Distribution
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={hourlyData} margin={{ top: 5, right: 8, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => [`${fmtHours(Number(v))}h`, "Booked"]} />
            <Bar dataKey="hours" fill={PRIMARY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Calendar className="size-4 text-blue-500" />
          Daily Distribution
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyData} margin={{ top: 5, right: 8, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => [`${fmtHours(Number(v))}h`, "Booked"]} />
            <Bar dataKey="hours" fill={SUCCESS} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Real-time Usage Component
// ---------------------------------------------------------------------------

function RealtimeUsageCard({ data }: { data: RealtimeUsage }) {
  const total = data.inUseCount + data.availableCount + data.maintenanceCount;
  const inUsePct = total > 0 ? (data.inUseCount / total) * 100 : 0;
  const availablePct = total > 0 ? (data.availableCount / total) * 100 : 0;
  const maintenancePct = total > 0 ? (data.maintenanceCount / total) * 100 : 0;

  const pieData = [
    { name: "In Use", value: data.inUseCount, color: SUCCESS },
    { name: "Available", value: data.availableCount, color: PRIMARY },
    { name: "Maintenance", value: data.maintenanceCount, color: WARNING },
  ];

  return (
    <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Zap className="size-4 text-yellow-500" />
          Real-Time Usage
        </h3>
        <Badge variant="outline" className="text-xs">
          {format(parseISO(data.timestamp), "HH:mm:ss")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 rounded-xl bg-green-500/10">
          <p className="text-2xl font-semibold text-green-500">{data.inUseCount}</p>
          <p className="text-xs text-muted-foreground">In Use</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-primary/10">
          <p className="text-2xl font-semibold text-primary">{data.availableCount}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-orange-500/10">
          <p className="text-2xl font-semibold text-orange-500">{data.maintenanceCount}</p>
          <p className="text-xs text-muted-foreground">Maintenance</p>
        </div>
      </div>

      {data.inUseEquipment.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Currently in use:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {data.inUseEquipment.map((item) => (
              <div
                key={item.equipmentId}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.equipmentName}</p>
                  <p className="text-muted-foreground">{item.user.username}</p>
                </div>
                <div className="text-right ml-2">
                  <p className="font-medium">{item.remainingMinutes}m left</p>
                  <p className="text-muted-foreground">
                    {format(parseISO(item.endTime), "HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------

export default function EquipmentUtilizationDashboard() {
  const [start, setStart] = useState(defaultStart());
  const [end, setEnd] = useState(defaultEnd());
  const [equipmentId, setEquipmentId] = useState<number | null>(null);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [shouldRefresh, setShouldRefresh] = useState(0);

  // Load filter options
  const {
    data: equipment,
    loading: equipLoading,
    error: equipError,
    refetch: refetchEquip,
  } = useAsync<Equipment[]>(() => equipmentApi.getAllEquipment(), []);

  const {
    data: departments,
    loading: deptLoading,
    error: deptError,
    refetch: refetchDept,
  } = useAsync<Department[]>(() => departmentApi.list(), []);

  const {
    data: institutions,
    loading: instLoading,
    error: instError,
    refetch: refetchInst,
  } = useAsync<Institution[]>(() => institutionApi.list(), []);

  // Load dashboard stats
  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useAsync<DashboardStats>(() => dashboardApi.stats(), [shouldRefresh]);

  // Load utilization data
  const {
    data: utilizationData,
    loading: utilLoading,
    error: utilError,
    refetch: refetchUtil,
  } = useAsync<UtilizationReport[]>(async () => {
    if (equipment && equipment.length > 0) {
      const promises = equipment.map((e) =>
        bookingApi
          .utilization({
            equipmentId: e.id,
            start: toISOStart(start),
            end: toISOEnd(end),
          })
          .catch(() => null)
      );
      const results = await Promise.all(promises);
      return results.filter((r): r is UtilizationReport => r !== null);
    }
    return [];
  }, [equipment, start, end, shouldRefresh]);

  // Load heatmap data (for first equipment or selected)
  const {
    data: heatmapData,
    loading: heatmapLoading,
    error: heatmapError,
    refetch: refetchHeatmap,
  } = useAsync<HeatmapReport | undefined>(async () => {
    const targetId = equipmentId ?? (equipment && equipment[0]?.id);
    if (targetId) {
      return bookingApi.heatmap(targetId, toISOStart(start), toISOEnd(end));
    }
    return undefined;
  }, [equipment, equipmentId, start, end, shouldRefresh]);

  // Load idle equipment
  const {
    data: idleData,
    loading: idleLoading,
    error: idleError,
    refetch: refetchIdle,
  } = useAsync<IdleReport>(() =>
    bookingApi.idleReport(toISOStart(start), toISOEnd(end), 100),
  [start, end, shouldRefresh]);

  // Load peak analysis
  const {
    data: peakData,
    loading: peakLoading,
    error: peakError,
    refetch: refetchPeak,
  } = useAsync<PeakReport>(() =>
    bookingApi.peakAnalysis(toISOStart(start), toISOEnd(end)),
  [start, end, shouldRefresh]);

  // Load real-time usage
  const {
    data: realtimeData,
    loading: realtimeLoading,
    error: realtimeError,
    refetch: refetchRealtime,
  } = useAsync<RealtimeUsage>(() => bookingApi.realtimeUsage(), [shouldRefresh]);

  // Auto-refresh real-time data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShouldRefresh((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function handleApplyFilters() {
    setShouldRefresh((prev) => prev + 1);
  }

  function handleRefresh() {
    setShouldRefresh((prev) => prev + 1);
    toast.success("Dashboard refreshed");
  }

  const filteredEquipment = React.useMemo(() => {
    let filtered = equipment || [];
    if (equipmentId) {
      filtered = filtered.filter((e) => e.id === equipmentId);
    }
    if (departmentId) {
      filtered = filtered.filter((e) => e.department?.id === departmentId);
    }
    if (institutionId) {
      filtered = filtered.filter((e) => e.institution?.id === institutionId);
    }
    return filtered;
  }, [equipment, equipmentId, departmentId, institutionId]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Equipment Utilization Dashboard"
        description="Comprehensive view of equipment utilization, idle time, and usage patterns."
        actions={
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="size-4" /> Refresh
          </Button>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        start={start}
        end={end}
        onStartChange={setStart}
        onEndChange={setEnd}
        onApply={handleApplyFilters}
        loading={statsLoading || utilLoading}
        equipment={equipment || undefined}
        equipmentId={equipmentId}
        onEquipmentChange={setEquipmentId}
        departments={departments || undefined}
        departmentId={departmentId}
        onDepartmentChange={setDepartmentId}
        institutions={institutions || undefined}
        institutionId={institutionId}
        onInstitutionChange={setInstitutionId}
      />

      {/* Statistics Cards */}
      {statsError ? (
        <ErrorCard message={statsError} onRetry={refetchStats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Equipment"
            value={stats?.totalEquipment ?? "—"}
            icon={Grid3x3}
            accent={PRIMARY}
          />
          <StatCard
            label="Available"
            value={stats?.availableCount ?? "—"}
            hint={`${stats?.bookedCount ?? 0} booked`}
            icon={Zap}
            accent={SUCCESS}
          />
          <StatCard
            label="Under Maintenance"
            value={stats?.maintenanceCount ?? "—"}
            icon={Clock}
            accent={WARNING}
          />
          <StatCard
            label="Active Bookings"
            value={stats?.activeBookingsCount ?? "—"}
            hint={`${stats?.pendingApprovalCount ?? 0} pending`}
            icon={Activity}
            accent={PRIMARY}
          />
        </div>
      )}

      {/* Real-time Usage */}
      {realtimeError ? (
        <ErrorCard message={realtimeError} onRetry={refetchRealtime} />
      ) : realtimeData ? (
        <RealtimeUsageCard data={realtimeData} />
      ) : realtimeLoading ? (
        <CardSkeleton />
      ) : null}

      {/* Equipment Utilization Cards */}
      {utilError ? (
        <ErrorCard message={utilError} onRetry={refetchUtil} />
      ) : filteredEquipment.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No equipment to display"
          description="Add equipment or adjust your filters."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEquipment.map((equip) => {
            const util = utilizationData?.find((u) => u.equipmentId === equip.id);
            return (
              <EquipmentUtilizationCard
                key={equip.id}
                equipment={equip}
                utilization={util}
              />
            );
          })}
        </div>
      )}

      {/* Heatmap and Peak Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {heatmapError ? (
          <ErrorCard message={heatmapError} onRetry={refetchHeatmap} />
        ) : heatmapLoading ? (
          <CardSkeleton />
        ) : heatmapData ? (
          <UtilizationHeatmap data={heatmapData} />
        ) : null}

        {peakError ? (
          <ErrorCard message={peakError} onRetry={refetchPeak} />
        ) : peakLoading ? (
          <CardSkeleton />
        ) : peakData ? (
          <PeakAnalysisChart data={peakData} />
        ) : null}
      </div>

      {/* Idle Equipment Table */}
      {idleError ? (
        <ErrorCard message={idleError} onRetry={refetchIdle} />
      ) : idleLoading ? (
        <CardSkeleton />
      ) : idleData ? (
        <IdleEquipmentTable data={idleData} />
      ) : null}
    </div>
  );
}
