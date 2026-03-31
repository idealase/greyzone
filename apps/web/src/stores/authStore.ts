import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserRead } from "../types/user";

interface AuthState {
  user: UserRead | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (payload: {
    user: UserRead;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setAccessToken: (accessToken: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "greyzone-auth",
    }
  )
);
