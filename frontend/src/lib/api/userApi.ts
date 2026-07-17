import { api, unwrap } from "./client";
import type { User } from "@/types";

export interface ProfileUpdatePayload {
  username?: string;
  name?: string;
  phoneNumber?: string;
  address?: string;
  designation?: string;
  departmentId?: number;
}

export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
}

export const userApi = {
  getProfile: () =>
    api.get<User>("/api/users/me").then(unwrap),
  
  updateProfile: (payload: ProfileUpdatePayload) =>
    api.put<User>("/api/users/me", payload).then(unwrap),
  
  changePassword: (payload: PasswordChangePayload) =>
    api.put<{ message: string }>("/api/users/me/password", payload).then(unwrap),
};
