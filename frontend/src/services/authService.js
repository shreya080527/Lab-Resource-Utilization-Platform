import API from "./api";

export const registerUser = (data) => {
    return API.post("/api/auth/register", data);
};

export const verifyEmail = (data) => {
    return API.post("/api/auth/verify", data);
};

export const loginUser = (data) => {
    return API.post("/api/auth/login", data);
};

export const resendOtp = (data) => {
    return API.post("/api/auth/resend-otp", data);
};

export const resetPasswordRequest = (data) => {
    return API.post("/api/auth/reset-password-request", data);
};

export const resetPassword = (data) => {
    return API.post("/api/auth/reset-password", data);
};

export const getUserDetails = () => {
    return API.get("/api/auth/get-user-details");
};