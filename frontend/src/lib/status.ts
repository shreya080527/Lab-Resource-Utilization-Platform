import type {
  Booking,
  BookingAction,
  BookingStatus,
  EquipmentStatus,
  User,
  MaintenanceRequestStatus,
  MaintenancePriority,
  MaintenanceResult,
  MaintenanceAction,
} from "@/types";

// ---------------------------------------------------------------------------
// Status visual config
// ---------------------------------------------------------------------------

export interface StatusConfig {
  label: string;
  chip: string;
  dot: string;
  color: string;
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, StatusConfig> = {
  PENDING: {
    label: "Pending",
    chip: "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/25",
    dot: "bg-amber-500",
    color: "#f59e0b",
  },
  CONFIRMED: {
    label: "Confirmed",
    chip: "bg-blue-500/12 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/25",
    dot: "bg-blue-500",
    color: "#3b82f6",
  },
  IN_PROGRESS: {
    label: "In Progress",
    chip: "bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/25",
    dot: "bg-cyan-500",
    color: "#06b6d4",
  },
  COMPLETED: {
    label: "Completed",
    chip: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25",
    dot: "bg-emerald-500",
    color: "#10b981",
  },
  CANCELLED: {
    label: "Cancelled",
    chip: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-500/25",
    dot: "bg-zinc-400",
    color: "#a1a1aa",
  },
  REJECTED: {
    label: "Rejected",
    chip: "bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/25",
    dot: "bg-rose-500",
    color: "#f43f5e",
  },
  NO_SHOW: {
    label: "No Show",
    chip: "bg-purple-500/12 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/25",
    dot: "bg-purple-500",
    color: "#a855f7",
  },
};

export function bookingStatusConfig(status: string): StatusConfig {
  const known = BOOKING_STATUS_CONFIG[status as BookingStatus];
  if (known) return known;
  return {
    label: status ? toTitle(status) : "Unknown",
    chip: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-500/25",
    dot: "bg-zinc-400",
    color: "#a1a1aa",
  };
}

export const EQUIPMENT_STATUS_CONFIG: Record<string, StatusConfig> = {
  AVAILABLE: {
    label: "Available",
    chip: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25",
    dot: "bg-emerald-500",
    color: "#10b981",
  },
  BOOKED: {
    label: "Booked",
    chip: "bg-blue-500/12 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/25",
    dot: "bg-blue-500",
    color: "#3b82f6",
  },
  UNDER_MAINTENANCE: {
    label: "Under Maintenance",
    chip: "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/25",
    dot: "bg-amber-500",
    color: "#f59e0b",
  },
  OUT_OF_SERVICE: {
    label: "Out of Service",
    chip: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-500/25",
    dot: "bg-zinc-500",
    color: "#71717a",
  },
  RETIRED: {
    label: "Retired",
    chip: "bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/25",
    dot: "bg-rose-500",
    color: "#f43f5e",
  },
};

export function equipmentStatusConfig(status: EquipmentStatus | string): StatusConfig {
  const known = EQUIPMENT_STATUS_CONFIG[status];
  if (known) return known;
  return {
    label: status ? toTitle(status) : "Unknown",
    chip: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-500/25",
    dot: "bg-zinc-400",
    color: "#a1a1aa",
  };
}

function toTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Booking lifecycle — single source of truth
// ---------------------------------------------------------------------------

/**
 * Check if a Lab Manager can manage bookings for a specific equipment.
 * Lab Managers can only manage bookings for equipment in their department.
 */
function canManageEquipmentForUser(booking: Booking, currentUser: User): boolean {
  // System Admin and Institution Admin can manage all bookings
  if (currentUser.role === "SYSTEM_ADMIN" || currentUser.role === "INSTITUTION_ADMIN") {
    return true;
  }
  
  // Lab Manager: can only manage bookings for equipment in their department
  if (currentUser.role === "LAB_MANAGER") {
    if (!currentUser.department) return false;
    if (booking.equipmentDepartmentId === undefined || booking.equipmentDepartmentId === null) return false;
    return currentUser.department.id === booking.equipmentDepartmentId;
  }
  
  return false;
}

export function getAvailableActions(
  booking: Booking,
  currentUser: User | null,
): BookingAction[] {
  if (!currentUser) return [];
  const status = booking.status as BookingStatus;
  const isOwner = booking.userId === currentUser.id;
  const isManager = currentUser.role === "LAB_MANAGER";
  const isSystemOrInstitutionAdmin = currentUser.role === "SYSTEM_ADMIN" || currentUser.role === "INSTITUTION_ADMIN";
  const isResearcher = currentUser.role === "RESEARCHER";
  const canManageThisBooking = canManageEquipmentForUser(booking, currentUser);
  const actions: BookingAction[] = [];

  switch (status) {
    case "PENDING":
      // Lab Managers can accept/reject if equipment is in their department
      if (isManager && canManageThisBooking) {
        actions.push("accept", "reject");
      }
      // Lab Managers can cancel any booking in their department
      if (isManager && canManageThisBooking) {
        actions.push("cancel");
      }
      // System/Institution Admins can manage all bookings
      if (isSystemOrInstitutionAdmin) {
        actions.push("accept", "reject", "cancel");
      }
      if (isOwner && isResearcher) actions.push("cancel");
      break;
    case "CONFIRMED":
      if (isManager && canManageThisBooking) {
        actions.push("noShow");
        actions.push("cancel");
      }
      if (isSystemOrInstitutionAdmin) {
        actions.push("noShow", "cancel");
      }
      if (isOwner && isResearcher) actions.push("start", "cancel");
      break;
    case "IN_PROGRESS":
      if (isOwner && isResearcher) actions.push("complete");
      if (isManager && canManageThisBooking) actions.push("complete");
      if (isSystemOrInstitutionAdmin) actions.push("complete");
      break;
    case "NO_SHOW":
    case "COMPLETED":
    case "CANCELLED":
    case "REJECTED":
    default:
      break;
  }
  return Array.from(new Set(actions));
}

export const ACTION_LABELS: Record<BookingAction, string> = {
  accept: "Accept",
  reject: "Reject",
  start: "Start",
  cancel: "Cancel",
  complete: "Complete",
  noShow: "Mark No-Show",
};

export const ACTION_VARIANTS: Record<
  BookingAction,
  "default" | "destructive" | "outline" | "secondary"
> = {
  accept: "default",
  reject: "destructive",
  start: "default",
  cancel: "outline",
  complete: "default",
  noShow: "destructive",
};

export function isBookable(status: EquipmentStatus): boolean {
  return status === "AVAILABLE";
}

export const ACTION_SUCCESS: Record<BookingAction, string> = {
  accept: "Booking accepted",
  reject: "Booking rejected",
  start: "Booking started",
  cancel: "Booking cancelled",
  complete: "Booking completed",
  noShow: "Booking marked as no-show",
};

// ═══════════════════════════════════════════════════════════════════
// MAINTENANCE REQUEST — status config + action state machine
// ═══════════════════════════════════════════════════════════════════

export interface MaintenanceStatusConfig {
  label: string;
  chip: string;
  dot: string;
  color: string;
}

export const MAINTENANCE_STATUS_CONFIG: Record<
  MaintenanceRequestStatus,
  MaintenanceStatusConfig
> = {
  REQUESTED: {
    label: "Requested",
    chip: "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/25",
    dot: "bg-amber-500",
    color: "#f59e0b",
  },
  IN_PROGRESS: {
    label: "In Progress",
    chip: "bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/25",
    dot: "bg-cyan-500",
    color: "#06b6d4",
  },
  COMPLETED: {
    label: "Completed",
    chip: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25",
    dot: "bg-emerald-500",
    color: "#10b981",
  },
  CANCELLED: {
    label: "Cancelled",
    chip: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-500/25",
    dot: "bg-zinc-400",
    color: "#a1a1aa",
  },
};

export function maintenanceStatusConfig(
  status: string,
): MaintenanceStatusConfig {
  return (
    MAINTENANCE_STATUS_CONFIG[status as MaintenanceRequestStatus] ?? {
      label: status,
      chip: "bg-zinc-500/12 text-zinc-600 ring-1 ring-zinc-500/25",
      dot: "bg-zinc-400",
      color: "#a1a1aa",
    }
  );
}

// ─── Priority config ───
export interface PriorityConfig {
  label: string;
  chip: string;
  color: string;
}

export const MAINTENANCE_PRIORITY_CONFIG: Record<
  MaintenancePriority,
  PriorityConfig
> = {
  LOW: {
    label: "Low",
    chip: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-500/25",
    color: "#a1a1aa",
  },
  MEDIUM: {
    label: "Medium",
    chip: "bg-blue-500/12 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/25",
    color: "#3b82f6",
  },
  HIGH: {
    label: "High",
    chip: "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/25",
    color: "#f59e0b",
  },
  CRITICAL: {
    label: "Critical",
    chip: "bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/25",
    color: "#f43f5e",
  },
};

export function maintenancePriorityConfig(
  priority: string,
): PriorityConfig {
  return (
    MAINTENANCE_PRIORITY_CONFIG[priority as MaintenancePriority] ?? {
      label: priority,
      chip: "bg-zinc-500/12 text-zinc-600 ring-1 ring-zinc-500/25",
      color: "#a1a1aa",
    }
  );
}

// ─── Result config ───
export const MAINTENANCE_RESULT_CONFIG: Record<
  MaintenanceResult,
  { label: string; color: string }
> = {
  PASS: { label: "Pass", color: "#10b981" },
  FAIL: { label: "Fail", color: "#f43f5e" },
  "N/A": { label: "N/A", color: "#a1a1aa" },
};

// ─── Maintenance action labels + variants ───
export const MAINTENANCE_ACTION_LABELS: Record<MaintenanceAction, string> = {
  start: "Start Work",
  complete: "Complete",
  cancel: "Cancel Request",
};

export const MAINTENANCE_ACTION_VARIANTS: Record<
  MaintenanceAction,
  "default" | "destructive" | "outline" | "secondary"
> = {
  start: "default",
  complete: "default",
  cancel: "outline",
};

/**
 * Returns the actions available on a maintenance request given the current user's role.
 *
 *   REQUESTED    → technician: start | manager: cancel
 *   IN_PROGRESS  → technician: complete | manager: cancel
 *   COMPLETED    → (none)
 *   CANCELLED    → (none)
 */
export function getAvailableMaintenanceActions(
  request: {
    status: MaintenanceRequestStatus;
    assignedToId: number;
    requestedById: number;
  },
  currentUser: { id: number; role: string } | null,
): MaintenanceAction[] {
  if (!currentUser) return [];
  const isTechnician =
    currentUser.role === "LAB_TECHNICIAN" &&
    request.assignedToId === currentUser.id;
  const isManager =
    (currentUser.role === "LAB_MANAGER" ||
      currentUser.role === "SYSTEM_ADMIN") &&
    request.requestedById === currentUser.id;
  const isAdmin = currentUser.role === "SYSTEM_ADMIN";

  const actions: MaintenanceAction[] = [];
  switch (request.status) {
    case "REQUESTED":
      if (isTechnician) actions.push("start");
      if (isManager || isAdmin) actions.push("cancel");
      break;
    case "IN_PROGRESS":
      if (isTechnician) actions.push("complete");
      if (isManager || isAdmin) actions.push("cancel");
      break;
    case "COMPLETED":
    case "CANCELLED":
      break;
  }
  return Array.from(new Set(actions));
}
