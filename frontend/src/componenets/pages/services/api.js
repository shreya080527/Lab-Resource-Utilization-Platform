import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8080/', // Adjust to match your Spring Boot port/context-path
});

// Interceptor to automatically add JWT to requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;