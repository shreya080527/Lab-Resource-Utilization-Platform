import API from "./api";

// ================= GET ALL EQUIPMENT =================

export const getAllEquipment = () => {
    return API.get("/api/equipment/get-all-equipments");
};

// ================= GET MY EQUIPMENT =================

export const getMyEquipment = () => {
    return API.get("/api/equipment/get-my-equipments");
};

// ================= GET EQUIPMENT BY ID =================

export const getEquipmentById = (id) =>
    API.get(`/api/equipment/${id}`);
// ================= ADD EQUIPMENT =================

export const addEquipment = (equipment) => {
    return API.post("/api/equipment/add-equipment", equipment);
};

// ================= UPDATE EQUIPMENT =================

export const updateEquipment = (id, equipment) => {
    return API.put(`/api/equipment/update-equipment/${id}`, equipment);
};

// ================= DELETE EQUIPMENT =================

export const deleteEquipment = (id) => {
    return API.delete(`/api/equipment/delete-equipment/${id}`);
};

// ================= UPDATE EQUIPMENT STATUS =================

export const updateEquipmentStatus = (id, data) => {
    return API.put(`/api/equipment/update-equipment-status/${id}`, data);
};