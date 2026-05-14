import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = { id: number; name: string; email: string; avatar?: string; is_admin: boolean; level: number; xp: number };

type State = {
  user: User | null;
  token: string | null;
  setSession: (u: User, t: string) => void;
  clear: () => void;
};

export const useAuth = create<State>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (user, token) => {
        if (typeof window !== 'undefined') localStorage.setItem('token', token);
        set({ user, token });
      },
      clear: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('token');
        set({ user: null, token: null });
      },
    }),
    { name: 'bolao-auth' },
  ),
);
