import API from "./api";

// Get all equipment
export const getAllEquipment = () => {
    return API.get("/api/equipment");
};

// Get equipment by ID
export const getEquipmentById = (id) => {
    return API.get(`/api/equipment/${id}`);
};

// Add equipment
export const addEquipment = (equipment) => {
    return API.post("/api/equipment", equipment);
};

// Update equipment
export const updateEquipment = (id, equipment) => {
    return API.put(`/api/equipment/${id}`, equipment);
};

// Delete equipment
export const deleteEquipment = (id) => {
    return API.delete(`/api/equipment/${id}`);
};