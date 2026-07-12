import { api, unwrap } from "./client";
import type {
  Equipment,
  EquipmentInput,
  EquipmentStatus,
  EquipmentFilter,
  Page,
  EquipmentDocument,
  CalibrationRecord,
  CalibrationRecordType,
  Tag,
  Institution,
  Department,
} from "@/types";

export const equipmentApi = {
  // ─── CRUD ───
  addEquipment: (input: EquipmentInput) =>
    api.post<Equipment>("/api/equipment/add-equipment", input).then(unwrap),
  updateEquipment: (id: number, partial: Partial<EquipmentInput>) =>
    api.put<Equipment>(`/api/equipment/update-equipment/${id}`, partial).then(unwrap),
  deleteEquipment: (id: number) =>
    api.delete<{ message: string }>(`/api/equipment/delete-equipment/${id}`).then(unwrap),
  getAllEquipment: () =>
    api.get<Equipment[]>("/api/equipment/get-all-equipments").then(unwrap),
  getMyEquipment: () =>
    api.get<Equipment[]>("/api/equipment/get-my-equipments").then(unwrap),
  getEquipment: (id: number) =>
    api.get<Equipment>(`/api/equipment/get-equipment/${id}`).then(unwrap),
  updateEquipmentStatus: (id: number, status: EquipmentStatus) =>
    api.put<Equipment>(`/api/equipment/update-equipment-status/${id}`, { status }).then(unwrap),

  // ─── Filter ───
  filter: (f: EquipmentFilter) =>
    api.get<Page<Equipment>>("/api/equipment/filter", { params: f }).then(unwrap),

  // ─── Documents ───
  listDocuments: (equipmentId: number) =>
    api.get<EquipmentDocument[]>(`/api/equipment/${equipmentId}/documents`).then(unwrap),
  addDocument: (
    equipmentId: number,
    body: { docName: string; docUrl: string; docType: string },
  ) =>
    api.post<EquipmentDocument>(`/api/equipment/${equipmentId}/documents`, body).then(unwrap),
  deleteDocument: (equipmentId: number, documentId: number) =>
    api.delete<{ message: string }>(`/api/equipment/${equipmentId}/documents/${documentId}`).then(unwrap),

  // ─── Calibration ───
  listCalibrations: (equipmentId: number) =>
    api.get<CalibrationRecord[]>(`/api/equipment/${equipmentId}/calibrations`).then(unwrap),
  addCalibration: (
    equipmentId: number,
    body: {
      recordType: CalibrationRecordType;
      performedDate: string;
      nextDueDate?: string;
      performedBy?: string;
      result?: string;
      certificateRef?: string;
      notes?: string;
    },
  ) =>
    api.post<CalibrationRecord>(`/api/equipment/${equipmentId}/calibrations`, body).then(unwrap),
  calibrationsDue: (equipmentId: number, from: string, to: string) =>
    api
      .get<CalibrationRecord[]>(`/api/equipment/${equipmentId}/calibrations/due`, {
        params: { from, to },
      })
      .then(unwrap),

  // ─── Tags ───
  addTags: (equipmentId: number, tagNames: string[]) =>
    api.post<Tag[]>(`/api/equipment/${equipmentId}/tags`, { tagNames }).then(unwrap),
  removeTag: (equipmentId: number, tagId: number) =>
    api.delete<{ message: string }>(`/api/equipment/${equipmentId}/tags/${tagId}`).then(unwrap),
  listAllTags: () => api.get<Tag[]>("/api/equipment/tags").then(unwrap),
};

// ─── Institutions & Departments ───
export const institutionApi = {
  create: (body: { name: string; code?: string }) =>
    api.post<Institution>("/api/institutions", body).then(unwrap),
  list: () => api.get<Institution[]>("/api/institutions").then(unwrap),
};

export const departmentApi = {
  create: (body: { name: string; institutionId: number }) =>
    api.post<Department>("/api/departments", body).then(unwrap),
  list: (institutionId?: number) =>
    api
      .get<Department[]>("/api/departments", {
        params: institutionId ? { institutionId } : {},
      })
      .then(unwrap),
};
