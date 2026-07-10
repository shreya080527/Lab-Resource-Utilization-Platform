// Shared constants

// Base URL for the backend API. The app makes REAL HTTP calls to this URL —
// there is no mock/interceptor in the frontend. Set VITE_API_BASE_URL in .env.
// Default: http://localhost:8080 (the real backend; a development stand-in
// implementing all 23 documented endpoints runs at mini-services/api-backend).
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const TOKEN_KEY = "lab-booking-access-token";
export const DEFAULT_OTP = "123456"; // OTP surfaced by the development backend
