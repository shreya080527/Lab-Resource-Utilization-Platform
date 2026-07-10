
import * as React from "react";
import { Check, X, Play, Square, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ACTION_LABELS,
  ACTION_VARIANTS,
  getAvailableActions,
} from "@/lib/status";
import type { Booking, BookingAction, User } from "@/types";

const ACTION_ICONS: Record<BookingAction, React.ComponentType<{ className?: string }>> = {
  accept: Check,
  reject: X,
  start: Play,
  cancel: Ban,
  complete: Square,
};

export function ActionButtonGroup({
  booking,
  currentUser,
  onAction,
  size = "sm",
  className,
}: {
  booking: Booking;
  currentUser: User | null;
  onAction: (action: BookingAction) => void;
  size?: "sm" | "default";
  className?: string;
}) {
  const actions = getAvailableActions(booking, currentUser);
  const [pending, setPending] = React.useState<BookingAction | null>(null);

  if (actions.length === 0) return null;

  const handle = async (a: BookingAction) => {
    setPending(a);
    try {
      await Promise.resolve(onAction(a));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {actions.map((a) => {
        const Icon = ACTION_ICONS[a];
        const variant = ACTION_VARIANTS[a];
        return (
          <Button
            key={a}
            variant={variant}
            size={size}
            onClick={() => handle(a)}
            disabled={pending !== null}
            className="gap-1.5 rounded-lg"
          >
            <Icon className="size-3.5" />
            {ACTION_LABELS[a]}
            {pending === a && (
              <span className="ml-1 size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
          </Button>
        );
      })}
    </div>
  );
}
