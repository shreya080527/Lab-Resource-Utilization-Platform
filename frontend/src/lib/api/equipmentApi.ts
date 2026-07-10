import { api, unwrap } from "@/lib/api/client";
import type { Equipment, EquipmentInput, EquipmentStatus } from "@/types";

export const equipmentApi = {
  addEquipment: (input: EquipmentInput) =>
    api.post<Equipment>("/api/equipment/add-equipment", input).then(unwrap),

  updateEquipment: (id: number, partial: Partial<EquipmentInput>) =>
    api.put<Equipment>(`/api/equipment/update-equipment/${id}`, partial).then(unwrap),

  deleteEquipment: (id: number) =>
    api.delete<string>(`/api/equipment/delete-equipment/${id}`).then(unwrap),

  getAllEquipment: () =>
    api.get<Equipment[]>("/api/equipment/get-all-equipments").then(unwrap),

  updateEquipmentStatus: (id: number, status: EquipmentStatus) =>
    api.put<Equipment>(`/api/equipment/update-equipment-status/${id}`, { status }).then(unwrap),

  getMyEquipment: () =>
    api.get<Equipment[]>("/api/equipment/get-my-equipments").then(unwrap),

  // Get a single equipment's details by id. Available to all authed roles.
  getEquipment: (id: number) =>
    api.get<Equipment>(`/api/equipment/get-equipment/${id}`).then(unwrap),
};
