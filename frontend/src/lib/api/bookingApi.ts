import { api, unwrap } from "./client";
import type {
  Booking,
  MyDashboard,
  UtilizationReport,
  BookingAudit,
  WaitlistEntry,
  RecurringBookingRequest,
  RecurringBookingResponse,
  ScopeUtilizationReport,
  HeatmapReport,
  IdleReport,
  PeakReport,
  BenchmarkReport,
  SharedVsExclusiveReport,
  RealtimeUsage,
  DashboardStats,
} from "@/types";

export interface CreateBookingPayload {
  userId: number;
  equipmentId: number;
  startTime: string;
  endTime: string;
}
export interface CalendarParams {
  equipmentId: number;
  start: string;
  end: string;
}
export interface UserCalendarParams {
  userId: number;
  start: string;
  end: string;
}
export interface UtilizationParams {
  equipmentId: number;
  start: string;
  end: string;
}

export function isWaitlistMessage(msg: string): boolean {
  return /waitlist/i.test(msg);
}

export const bookingApi = {
  // ─── Create ───
  create: (payload: CreateBookingPayload) =>
    api.post<Booking>("/api/bookings/create", payload).then(unwrap),
  createRecurring: (payload: RecurringBookingRequest) =>
    api.post<RecurringBookingResponse>("/api/bookings/create-recurring", payload).then(unwrap),

  // ─── Calendars ───
  userCalendar: (params: UserCalendarParams) =>
    api.get<Booking[]>("/api/bookings/calendar", { params }).then(unwrap),
  equipmentCalendar: (params: CalendarParams) =>
    api.get<Booking[]>("/api/bookings/equipment-calendar", { params }).then(unwrap),

  // ─── Dashboard / Lists ───
  myDashboard: (userId: number) =>
    api.get<MyDashboard>(`/api/bookings/my-dashboard/${userId}`).then(unwrap),
  allBookings: () => api.get<Booking[]>("/api/bookings/all").then(unwrap),

  // ─── Lifecycle ───
  accept: (id: number) => api.put<Booking>(`/api/bookings/${id}/accept`).then(unwrap),
  reject: (id: number) => api.put<Booking>(`/api/bookings/${id}/reject`).then(unwrap),
  start: (id: number) => api.put<Booking>(`/api/bookings/${id}/start`).then(unwrap),
  cancel: (id: number) => api.put<Booking>(`/api/bookings/${id}/cancel`).then(unwrap),
  complete: (id: number) => api.put<Booking>(`/api/bookings/${id}/complete`).then(unwrap),
  noShow: (id: number) => api.put<Booking>(`/api/bookings/${id}/no-show`).then(unwrap),

  // ─── Audit ───
  bookingAudit: (bookingId: number) =>
    api.get<BookingAudit[]>(`/api/bookings/${bookingId}/audit`).then(unwrap),
  equipmentAudit: (equipmentId: number) =>
    api.get<BookingAudit[]>(`/api/bookings/equipment-audit/${equipmentId}`).then(unwrap),

  // ─── Utilization ───
  utilization: (params: UtilizationParams) =>
    api.get<UtilizationReport>("/api/bookings/utilization", { params }).then(unwrap),
  realtimeUsage: () =>
    api.get<RealtimeUsage>("/api/bookings/utilization/realtime").then(unwrap),
  departmentUtilization: (departmentId: number, start: string, end: string) =>
    api
      .get<ScopeUtilizationReport>("/api/bookings/utilization/department", {
        params: { departmentId, start, end },
      })
      .then(unwrap),
  institutionUtilization: (institutionId: number, start: string, end: string) =>
    api
      .get<ScopeUtilizationReport>("/api/bookings/utilization/institution", {
        params: { institutionId, start, end },
      })
      .then(unwrap),
  heatmap: (equipmentId: number, start: string, end: string) =>
    api
      .get<HeatmapReport>("/api/bookings/utilization/heatmap", {
        params: { equipmentId, start, end },
      })
      .then(unwrap),
  idleReport: (start: string, end: string, thresholdHours = 500) =>
    api
      .get<IdleReport>("/api/bookings/utilization/idle", {
        params: { start, end, thresholdHours },
      })
      .then(unwrap),
  peakAnalysis: (start: string, end: string) =>
    api.get<PeakReport>("/api/bookings/utilization/peak", { params: { start, end } }).then(unwrap),
  benchmark: (equipmentId: number, start: string, end: string) =>
    api
      .get<BenchmarkReport>("/api/bookings/utilization/benchmark", {
        params: { equipmentId, start, end },
      })
      .then(unwrap),
  sharedVsExclusive: (start: string, end: string) =>
    api
      .get<SharedVsExclusiveReport>("/api/bookings/utilization/shared-vs-exclusive", {
        params: { start, end },
      })
      .then(unwrap),
};

// ─── Waitlist management ───
export const waitlistApi = {
  listAll: () => api.get<WaitlistEntry[]>("/api/waitlist").then(unwrap),
  byEquipment: (equipmentId: number) =>
    api.get<WaitlistEntry[]>(`/api/waitlist/equipment/${equipmentId}`).then(unwrap),
  promote: (equipmentId: number, waitlistId?: number) =>
    api
      .post<{ promoted: boolean; message: string }>(
        `/api/waitlist/equipment/${equipmentId}/promote`,
        waitlistId ? { waitlistId } : {},
      )
      .then(unwrap),
  remove: (waitlistId: number) =>
    api.delete<{ message: string }>(`/api/waitlist/${waitlistId}`).then(unwrap),
};

// ─── Dashboard stats ───
export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/api/dashboard/stats").then(unwrap),
};
