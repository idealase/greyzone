import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserRead } from "../types/user";

interface AuthState {
  user: UserRead | null;
  setUser: (user: UserRead | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clear: () => set({ user: null }),
    }),
    {
      name: "greyzone-auth",
    }
  )
);
