import API from "./api";

export const loginUser = (data) => {
    return API.post("/api/auth/login", data);
};

export const signupUser = (data) => {
    return API.post("/api/auth/signup", data);
};