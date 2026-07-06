import API from "./api";

export const getInventory = () => {
    return API.get("/api/inventory");
};

export const getInventoryById = (id) => {
    return API.get(`/api/inventory/${id}`);
};

export const addInventory = (inventory) => {
    return API.post("/api/inventory", inventory);
};

export const updateInventory = (id, inventory) => {
    return API.put(`/api/inventory/${id}`, inventory);
};

export const deleteInventory = (id) => {
    return API.delete(`/api/inventory/${id}`);
};