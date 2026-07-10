
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "@/lib/api/authApi";
import { TOKEN_KEY } from "@/lib/constants";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** true once we've attempted to hydrate the user from a stored token */
  hydrated: boolean;
  loading: boolean;

  /** Full login flow: login → store token → fetch user details */
  login: (email: string, password: string) => Promise<User>;
  /** Fetch /api/auth/get-user-details and populate `user` */
  hydrateUser: () => Promise<User | null>;
  logout: () => void;
  clearSession: () => void;
  setUser: (u: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hydrated: false,
      loading: false,

      login: async (email, password) => {
        const { accessToken } = await authApi.login(email, password);
        // Persist token where the axios interceptor reads it
        if (typeof window !== "undefined") {
          window.localStorage.setItem(TOKEN_KEY, accessToken);
        }
        set({ token: accessToken, isAuthenticated: true });
        // Per spec: block the redirect to dashboard until user details resolve
        const user = await get().hydrateUser();
        if (!user) throw { message: "Unable to load user details." };
        if (!user.emailVerified) {
          // Unverified email → never reach the dashboard
          throw { message: "EMAIL_NOT_VERIFIED", email: user.email };
        }
        return user;
      },

      hydrateUser: async () => {
        set({ loading: true });
        try {
          const user = await authApi.getUserDetails();
          set({ user, isAuthenticated: true, hydrated: true, loading: false });
          return user;
        } catch {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            hydrated: true,
            loading: false,
          });
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(TOKEN_KEY);
          }
          return null;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(TOKEN_KEY);
        }
      },

      clearSession: () => get().logout(),

      setUser: (u) => set({ user: u, isAuthenticated: !!u }),
    }),
    {
      name: "lab-booking-auth",
      storage: createJSONStorage(() => localStorage),
      // Only persist the token; user is always re-fetched via hydrateUser
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.isAuthenticated = true;
        }
      },
    },
  ),
);
