import { api, unwrap } from "@/lib/api/client";
import type { LoginResponse, RegisterPayload, User } from "@/types";

export const authApi = {
  register: (payload: RegisterPayload) =>
    api
      .post<{ message: string; email: string }>("/api/auth/register", payload)
      .then(unwrap),

  verify: (email: string, otp: string) =>
    api.post("/api/auth/verify", { email, otp }).then(unwrap),

  login: (email: string, password: string) =>
    api.post<LoginResponse>("/api/auth/login", { email, password }).then(unwrap),

  resendOtp: (email: string) =>
    api.post("/api/auth/resend-otp", { email }).then(unwrap),

  resetPasswordRequest: (email: string) =>
    api.post<string>("/api/auth/reset-password-request", { email }).then(unwrap),

  resetPassword: (email: string, newPassword: string, otp: string) =>
    api
      .post<string>("/api/auth/reset-password", { email, newPassword, otp })
      .then(unwrap),

  getUserDetails: () =>
    api.get<User>("/api/auth/get-user-details").then(unwrap),
};
