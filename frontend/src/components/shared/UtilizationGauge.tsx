
import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { UtilizationReport } from "@/types";

/** Format hours to at most 4 decimal places (trailing zeros trimmed). */
function fmtHours(h: number): string {
  const rounded = Math.round(h * 10000) / 10000;
  return String(rounded);
}

export function UtilizationGauge({
  report,
  className,
}: {
  report: UtilizationReport;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, report.utilizationPercentage));
  const tone =
    pct >= 80 ? "var(--destructive)" : pct >= 50 ? "#f59e0b" : "var(--primary)";

  return (
    <Card className={cn("rounded-2xl border-border/60 p-5 shadow-soft", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {report.equipmentName}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            {pct.toFixed(pct % 1 === 0 ? 0 : 1)}%
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fmtHours(report.bookedHours)}h booked · {fmtHours(report.availableHours)}h available
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `color-mix(in oklch, ${tone} 14%, transparent)`,
            color: tone,
          }}
        >
          {pct >= 80 ? "High" : pct >= 50 ? "Moderate" : "Light"}
        </span>
      </div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: tone }}
        />
      </div>
    </Card>
  );
}
