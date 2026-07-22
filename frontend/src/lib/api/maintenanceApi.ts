import { api, unwrap } from "./client";
import type {
  MaintenanceRequest,
  CreateMaintenanceRequestPayload,
  CompleteMaintenancePayload,
} from "@/types";

/**
 * API client for the Maintenance Request feature.
 *
 * Endpoints:
 *   POST   /api/maintenance                     — create (LAB_MANAGER)
 *   PUT    /api/maintenance/{id}/start          — technician starts (LAB_TECHNICIAN)
 *   PUT    /api/maintenance/{id}/complete       — technician completes (LAB_TECHNICIAN)
 *   PUT    /api/maintenance/{id}/cancel         — manager cancels (LAB_MANAGER)
 *   GET    /api/maintenance                     — all requests (LAB_MANAGER)
 *   GET    /api/maintenance/{id}                — one request (any authed)
 *   GET    /api/maintenance/my-assigned         — assigned to current technician (LAB_TECHNICIAN)
 *   GET    /api/maintenance/my-requested        — raised by current manager (LAB_MANAGER)
 *   GET    /api/maintenance/equipment/{id}      — requests for an equipment (any authed)
 *   GET    /api/maintenance/my-active-count     — count of active assigned (LAB_TECHNICIAN)
 */
export const maintenanceApi = {
  // ─── Create ───
  create: (payload: CreateMaintenanceRequestPayload) =>
    api
      .post<MaintenanceRequest>("/api/maintenance", payload)
      .then(unwrap),

  // ─── Lifecycle ───
  start: (id: number) =>
    api.put<MaintenanceRequest>(`/api/maintenance/${id}/start`).then(unwrap),

  complete: (id: number, payload: CompleteMaintenancePayload) =>
    api
      .put<MaintenanceRequest>(`/api/maintenance/${id}/complete`, payload)
      .then(unwrap),

  cancel: (id: number) =>
    api.put<MaintenanceRequest>(`/api/maintenance/${id}/cancel`).then(unwrap),

  // ─── Queries ───
  getById: (id: number) =>
    api.get<MaintenanceRequest>(`/api/maintenance/${id}`).then(unwrap),

  findAll: () =>
    api.get<MaintenanceRequest[]>("/api/maintenance").then(unwrap),

  findMyAssigned: () =>
    api.get<MaintenanceRequest[]>("/api/maintenance/my-assigned").then(unwrap),

  findMyRequested: () =>
    api
      .get<MaintenanceRequest[]>("/api/maintenance/my-requested")
      .then(unwrap),

  findByEquipment: (equipmentId: number) =>
    api
      .get<MaintenanceRequest[]>(`/api/maintenance/equipment/${equipmentId}`)
      .then(unwrap),

  countMyActiveAssigned: () =>
    api.get<number>("/api/maintenance/my-active-count").then(unwrap),
};
