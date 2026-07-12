
import * as React from "react";
import { Building2, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { isBookable } from "@/lib/status";
import type { Equipment } from "@/types";

export function EquipmentCard({
  equipment,
  onView,
  onBook,
  canBook = false,
  className,
}: {
  equipment: Equipment;
  onView?: (e: Equipment) => void;
  onBook?: (e: Equipment) => void;
  canBook?: boolean;
  className?: string;
}) {
  const bookable = isBookable(equipment.status);
  const tags = equipment.tags ?? [];
  const visibleTags = tags.slice(0, 3);
  const extraTagCount = Math.max(0, tags.length - visibleTags.length);
  const institutionName = equipment.institution?.name ?? "—";
  const departmentName = equipment.department?.name ?? "—";
  const addedByName = equipment.addedByUsername ?? "—";

  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float",
        className,
      )}
    >
      <button
        onClick={() => onView?.(equipment)}
        className="flex flex-1 flex-col gap-3 p-5 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
            <CategoryIcon category={equipment.category} className="size-5" />
          </div>
          <StatusBadge status={equipment.status} type="equipment" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-foreground">
            {equipment.equipmentName}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {equipment.category} · S/N {equipment.serial}
          </p>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {equipment.description || "No description provided."}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleTags.map((t) => (
              <Badge
                key={t.id}
                variant="secondary"
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              >
                {t.name}
              </Badge>
            ))}
            {extraTagCount > 0 && (
              <Badge
                variant="outline"
                className="rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                +{extraTagCount}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-auto space-y-1 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Building2 className="size-3" />
            <span className="truncate">
              {institutionName} · {departmentName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wrench className="size-3" />
            <span className="truncate">Added by {addedByName}</span>
          </div>
        </div>
      </button>
      <div className="flex items-center gap-2 border-t border-border/60 bg-muted/20 px-5 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-lg"
          onClick={() => onView?.(equipment)}
        >
          View details
        </Button>
        {canBook && (
          <Button
            size="sm"
            className="flex-1 rounded-lg"
            disabled={!bookable}
            onClick={() => bookable && onBook?.(equipment)}
            title={!bookable ? `Not bookable: ${equipment.status}` : undefined}
          >
            {bookable ? "Book" : "Unavailable"}
          </Button>
        )}
      </div>
    </Card>
  );
}
