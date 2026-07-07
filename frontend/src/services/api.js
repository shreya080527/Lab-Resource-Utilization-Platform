import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:8080",
    headers: {
        "Content-Type": "application/json"
    }
});

API.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    // Don't send token for public auth endpoints
    const publicEndpoints = [
        '/api/auth/register',
        '/api/auth/verify',
        '/api/auth/login',
        '/api/auth/resend-otp',
        '/api/auth/reset-password-request',
        '/api/auth/reset-password'
    ];

    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url.includes(endpoint));

    if (token && token.trim() !== "" && !isPublicEndpoint) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

});

export default API;