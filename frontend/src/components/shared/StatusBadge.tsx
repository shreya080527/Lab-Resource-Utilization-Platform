
import * as React from "react";
import { cn } from "@/lib/utils";
import { bookingStatusConfig, equipmentStatusConfig } from "@/lib/status";

export function StatusBadge({
  status,
  type = "booking",
  className,
}: {
  status: string;
  type?: "booking" | "equipment";
  className?: string;
}) {
  const cfg =
    type === "equipment"
      ? equipmentStatusConfig(status)
      : bookingStatusConfig(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.chip,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}
