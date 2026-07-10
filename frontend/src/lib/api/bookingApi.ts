import { api, unwrap } from "@/lib/api/client";
import type {
  Booking,
  MyDashboard,
  UtilizationReport,
} from "@/types";

// IMPORTANT: the booking lifecycle endpoints return PLAIN TEXT, not JSON.
// Axios leaves text/plain bodies as strings, so these are typed as `string`.
// Callers must not treat the return value as a Booking object — refetch the
// relevant list to refresh state.
//
// NOTE: the generic status-update endpoint (POST /{id}/status) is COMMENTED
// OUT in the real backend — it does not exist. The lifecycle actions
// (accept/reject/cancel/complete/start) are the only way to change status.

export interface CreateBookingPayload {
  userId: number;
  equipmentId: number;
  startTime: string;
  endTime: string;
}

// The real backend's calendar endpoint (BookingController.getCalendar) REQUIRES
// `userId` as a @RequestParam and does NOT support `equipmentId` — the query is
// `WHERE b.user.id = :userId` (user-scoped, not equipment-scoped). RESEARCHER only.
export interface CalendarParams {
  userId: number;
  start: string;
  end: string;
}

export interface UtilizationParams {
  equipmentId: number;
  start: string;
  end: string;
}

// The create-booking endpoint returns a plain-text message. Two distinct
// outcomes share HTTP 200 in the documented contract:
//   • success   -> "Booking request submitted successfully. Awaiting Manager approval."
//   • waitlist  -> "Slot conflicting with an active timeline. Auto-added to the Waitlist."
// We match on message content (defensive) rather than assuming distinct codes.
export function isWaitlistMessage(msg: string): boolean {
  return /waitlist/i.test(msg);
}

export const bookingApi = {
  create: (payload: CreateBookingPayload) =>
    api.post<string>("/api/bookings/create", payload).then(unwrap),

  // User-scoped calendar (RESEARCHER only, requires userId, returns the user's OWN bookings)
  calendar: (params: CalendarParams) =>
    api
      .get<Booking[]>("/api/bookings/calendar", { params })
      .then(unwrap),

  myDashboard: (userId: number) =>
    api.get<MyDashboard>(`/api/bookings/my-dashboard/${userId}`).then(unwrap),

  // All bookings system-wide. LAB_MANAGER only.
  allBookings: () => api.get<Booking[]>("/api/bookings/all").then(unwrap),

  // ── Lifecycle actions (plain text responses) ──
  accept: (bookingId: number) =>
    api.put<string>(`/api/bookings/${bookingId}/accept`).then(unwrap),

  reject: (bookingId: number) =>
    api.put<string>(`/api/bookings/${bookingId}/reject`).then(unwrap),

  start: (bookingId: number) =>
    api.put<string>(`/api/bookings/${bookingId}/start`).then(unwrap),

  cancel: (bookingId: number) =>
    api.put<string>(`/api/bookings/${bookingId}/cancel`).then(unwrap),

  complete: (bookingId: number) =>
    api.put<string>(`/api/bookings/${bookingId}/complete`).then(unwrap),

  // ── Per-equipment utilization (LAB_MANAGER) ──
  // The ONLY utilization endpoint the real backend has. Department/institution/
  // heatmap/idle are computed CLIENT-SIDE in the UtilizationPage from this +
  // the equipment list + allBookings.
  utilization: (params: UtilizationParams) =>
    api
      .get<UtilizationReport>("/api/bookings/utilization", { params })
      .then(unwrap),
};
