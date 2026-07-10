// ---------------------------------------------------------------------------
// Shared domain types for the Lab Equipment Booking & Management System
// Matches the real backend entities (Booking, Equipment, Waitlist, etc.)
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

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  department: string;
  institution: string;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  username?: string;
  role?: Role;
  exp?: number;
  [key: string]: unknown;
}

// --- Equipment ---------------------------------------------------------------

export type EquipmentStatus =
  | "AVAILABLE"
  | "BOOKED"
  | "UNDER_MAINTENANCE"
  | "OUT_OF_SERVICE"
  | "RETIRED"
  | string;

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
  /** ISO datetime, server-assigned */
  acquisitionDate: string;
  institution: string;
  /** username of the Lab Manager who added it */
  addedBy: string;
  status: EquipmentStatus;
}

export type EquipmentInput = {
  serial: string;
  equipmentName: string;
  category: string;
  description: string;
  institution: string;
};

// --- Bookings ----------------------------------------------------------------

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "WAITLIST";

export const BOOKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "WAITLIST",
];

export interface BookingUser {
  id: number;
  username: string;
  email: string;
  role: string;
  institution: string;
  department: string;
}

export interface Booking {
  id: number;
  equipment: Equipment;
  user: BookingUser;
  /** ISO datetime */
  startTime: string;
  /** ISO datetime */
  endTime: string;
  status: BookingStatus;
}

// Matches the real backend's Waitlist entity: {id, equipment, user, startTime, endTime, createdAt}.
// `position` is derived client-side (sort by createdAt, enumerate).
export interface WaitlistEntry {
  id: number;
  equipment: Equipment;
  user: BookingUser;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface MyDashboard {
  bookings: Booking[];
  waitlistEntries: WaitlistEntry[];
}

// --- Utilization (Module 4) -------------------------------------------------

export interface UtilizationReport {
  equipmentId: number;
  equipmentName: string;
  bookedHours: number;
  availableHours: number;
  utilizationPercentage: number;
}

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

// --- Auth payloads -----------------------------------------------------------

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  institution: string;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
}

// Booking lifecycle action descriptor
export type BookingAction =
  | "accept"
  | "reject"
  | "start"
  | "cancel"
  | "complete";
