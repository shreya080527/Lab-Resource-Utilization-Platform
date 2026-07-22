// ---------------------------------------------------------------------------
// Shared domain types — aligned with the upgraded backend (32 endpoints).
// ---------------------------------------------------------------------------

export type Role =
  | "RESEARCHER"
  | "LAB_TECHNICIAN"
  | "LAB_MANAGER"
  | "DEPARTMENT_HEAD"
  | "INSTITUTION_ADMIN"
  | "SYSTEM_ADMIN";

export const ROLES: Role[] = [
  "RESEARCHER",
  "LAB_TECHNICIAN",
  "LAB_MANAGER",
  "DEPARTMENT_HEAD",
  "INSTITUTION_ADMIN",
  "SYSTEM_ADMIN",
];

// ─── Institution / Department ───
export interface Institution {
  id: number;
  name: string;
  code: string | null;
  createdAt: string;
}
export interface Department {
  id: number;
  name: string;
  institution: Institution;
  createdAt: string;
}

// ─── User ───
export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  department: Department | null;
  institution: Institution | null;
  // Profile fields
  name?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  designation?: string | null;
  profilePictureUrl?: string | null;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  username?: string;
  role?: Role;
  exp?: number;
  [key: string]: unknown;
}

// ─── Tag ───
export interface Tag {
  id: number;
  name: string;
}

// ─── Equipment ───
export type EquipmentStatus =
  | "AVAILABLE"
  | "BOOKED"
  | "UNDER_MAINTENANCE"
  | "OUT_OF_SERVICE"
  | "RETIRED";

export const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  "AVAILABLE",
  "BOOKED",
  "UNDER_MAINTENANCE",
  "OUT_OF_SERVICE",
  "RETIRED",
];

export interface Equipment {
  id: number;
  serial: string;
  equipmentName: string;
  category: string;
  description: string;
  acquisitionDate: string;
  institution: Institution | null;
  department: Department | null;
  addedByUsername: string | null;
  status: EquipmentStatus;
  tags: Tag[];
  createdAt: string;
  updatedAt: string | null;
}

export interface EquipmentInput {
  serial: string;
  equipmentName: string;
  category: string;
  description: string;
  institutionId: number | null;
  departmentId: number | null;
}

export interface EquipmentFilter {
  category?: string;
  tag?: string;
  departmentId?: number;
  institutionId?: number;
  status?: EquipmentStatus;
  search?: string;
  page?: number;
  size?: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

// ─── Equipment Documents ───
export type DocumentType =
  | "MANUAL"
  | "DATASHEET"
  | "SPEC_SHEET"
  | "CERTIFICATE"
  | "OTHER";

export interface EquipmentDocument {
  id: number;
  equipmentId: number;
  docName: string;
  docUrl: string;
  docType: DocumentType;
  uploadedAt: string;
}

// ─── Calibration ───
export type CalibrationRecordType =
  | "CALIBRATION"
  | "CERTIFICATION"
  | "INSPECTION"
  | "MAINTENANCE_CHECK";

export interface CalibrationRecord {
  id: number;
  equipmentId: number;
  equipmentName: string;
  recordType: CalibrationRecordType;
  performedDate: string;
  nextDueDate: string | null;
  performedBy: string | null;
  result: string | null;
  certificateRef: string | null;
  notes: string | null;
  createdAt: string;
}

// ─── Booking ───
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "NO_SHOW";

export const BOOKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "NO_SHOW",
];

export interface Booking {
  id: number;
  equipmentId: number;
  equipmentName: string;
  userId: number;
  username: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  recurrencePattern: string | null;
  parentBookingId: number | null;
  createdAt: string;
  updatedAt: string | null;
  // Department info for frontend permission checks
  equipmentDepartmentId?: number | null;
  equipmentDepartmentName?: string | null;
}

export type RecurrencePattern = "DAILY" | "WEEKLY" | "MONTHLY";

export interface RecurringBookingRequest {
  userId: number;
  equipmentId: number;
  startTime: string;
  endTime: string;
  recurrencePattern: RecurrencePattern;
  recurrenceCount: number;
}

export interface RecurringBookingResponse {
  parentBookingId: number;
  totalBookingsCreated: number;
  totalWaitlisted: number;
  bookings: Booking[];
  waitlistedSlots: { startTime: string; endTime: string; message: string }[];
}

// ─── Waitlist ───
export interface WaitlistEntry {
  id: number;
  equipmentId: number;
  equipmentName: string;
  userId: number;
  username: string;
  startTime: string;
  endTime: string;
  position: number;
  notified: boolean;
  createdAt: string;
  // Enhanced fields
  waitingDurationMinutes?: number;
  waitingDurationFormatted?: string;
  equipmentDepartmentId?: number | null;
  equipmentDepartmentName?: string | null;
}

export interface MyDashboard {
  bookings: Booking[];
  waitlistEntries: WaitlistEntry[];
}

// ─── Booking Audit ───
export interface BookingAudit {
  id: number;
  bookingId: number;
  action: string;
  fromStatus: string | null;
  toStatus: string;
  performedByUsername: string;
  notes: string | null;
  createdAt: string;
}

// ─── Utilization ───
export interface UtilizationReport {
  equipmentId: number;
  equipmentName: string;
  bookedHours: number;
  availableHours: number;
  utilizationPercentage: number;
}

export interface ScopeUtilizationReport {
  scope: "department" | "institution";
  scopeId: number;
  scopeName: string;
  periodStart: string;
  periodEnd: string;
  totalEquipment: number;
  totalBookedHours: number;
  totalAvailableHours: number;
  utilizationPercentage: number;
  perEquipment: UtilizationReport[];
}

export interface HeatmapPoint {
  dayOfWeek: string;
  hourOfDay: number;
  bookedHours: number;
  bookingCount: number;
}

export interface HeatmapReport {
  equipmentId: number;
  periodStart: string;
  periodEnd: string;
  heatmap: HeatmapPoint[];
}

export interface IdleEquipmentRow {
  equipmentId: number;
  equipmentName: string;
  serial: string;
  department: string | null;
  bookedHours: number;
  availableHours: number;
  idleHours: number;
  utilizationPercentage: number;
  status: EquipmentStatus;
}

export interface IdleReport {
  periodStart: string;
  periodEnd: string;
  thresholdHours: number;
  idleEquipment: IdleEquipmentRow[];
  totalIdleCount: number;
}

export interface PeakReport {
  periodStart: string;
  periodEnd: string;
  peakHourOfDay: number | null;
  peakDayOfWeek: string | null;
  peakHourBookedHours: number;
  peakDayBookedHours: number;
  hourlyDistribution: { hour: number; bookedHours: number }[];
  dailyDistribution: { day: string; bookedHours: number }[];
}

export interface BenchmarkReport {
  equipmentId: number;
  equipmentName: string;
  currentPeriod: { start: string; end: string; utilizationPercentage: number };
  historicalAverage: { periodMonths: number; utilizationPercentage: number };
  trend: "INCREASING" | "DECREASING" | "STABLE";
  deltaPercentage: number;
  monthlyHistory: { month: string; utilizationPercentage: number }[];
}

export interface SharedVsExclusiveReport {
  periodStart: string;
  periodEnd: string;
  sharedEquipment: {
    count: number;
    totalBookedHours: number;
    avgUniqueUsersPerEquipment: number;
  };
  exclusiveEquipment: {
    count: number;
    totalBookedHours: number;
    avgUniqueUsersPerEquipment: number;
  };
  perEquipment: {
    equipmentId: number;
    equipmentName: string;
    type: "SHARED" | "EXCLUSIVE";
    uniqueUsers: number;
    bookedHours: number;
  }[];
}

export interface RealtimeUsage {
  timestamp: string;
  inUseCount: number;
  availableCount: number;
  bookedCount: number;
  maintenanceCount: number;
  inUseEquipment: {
    equipmentId: number;
    equipmentName: string;
    user: { id: number; username: string };
    bookingId: number;
    startTime: string;
    endTime: string;
    remainingMinutes: number;
  }[];
}

export interface DashboardStats {
  totalEquipment: number;
  availableCount: number;
  bookedCount: number;
  maintenanceCount: number;
  outOfServiceCount: number;
  retiredCount: number;
  pendingApprovalCount: number;
  activeBookingsCount: number;
  waitlistCount: number;
  calibrationsDueIn30Days: number;
  generatedAt: string;
}

// ─── Auth payloads ───
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role: Role;
  departmentId: number | null;
  institutionId: number | null;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
}

// ─── Calendar / Actions ───
export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  status: BookingStatus;
  equipmentName: string;
  equipmentId: number;
  username: string;
}

export type BookingAction =
  | "accept"
  | "reject"
  | "start"
  | "cancel"
  | "complete"
  | "noShow";

// ═══════════════════════════════════════════════════════════════════
// MAINTENANCE REQUEST
// ═══════════════════════════════════════════════════════════════════

export type MaintenanceRequestStatus =
  | "REQUESTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export const MAINTENANCE_STATUSES: MaintenanceRequestStatus[] = [
  "REQUESTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const MAINTENANCE_PRIORITIES: MaintenancePriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

export type MaintenanceResult = "PASS" | "FAIL" | "N/A";

export interface MaintenanceRequest {
  id: number;
  equipmentId: number;
  equipmentName: string;
  equipmentSerial: string;
  equipmentCategory: string;
  requestedById: number;
  requestedByUsername: string;
  assignedToId: number;
  assignedToUsername: string;
  status: MaintenanceRequestStatus;
  priority: MaintenancePriority;
  description: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  completionNotes: string | null;
  result: MaintenanceResult | null;
}

export interface CreateMaintenanceRequestPayload {
  equipmentId: number;
  assignedToId: number;
  description: string;
  priority: MaintenancePriority;
}

export interface CompleteMaintenancePayload {
  completionNotes: string;
  result: MaintenanceResult;
}

export type MaintenanceAction = "start" | "complete" | "cancel";


// ─── Notification ───
export type NotificationType =
  | "BOOKING_APPROVED"
  | "BOOKING_REJECTED"
  | "BOOKING_CANCELLED"
  | "BOOKING_REMINDER"
  | "WAITLIST_PROMOTED"
  | "EQUIPMENT_AVAILABLE"
  | "NEW_BOOKING_REQUEST"
  | "MAINTENANCE_DUE"
  | "CALIBRATION_DUE"
  | "SYSTEM_ANNOUNCEMENT";

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  referenceId?: number | null;
  referenceType?: string | null;
  relatedEquipmentId?: number | null;
  createdAt: string;
}
