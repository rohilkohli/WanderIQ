// ============================================================
// WanderIQ — Auth Store (Zustand)
// ============================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/types';

interface AuthState {
  user:       User | null;
  profile:    UserProfile | null;
  loading:    boolean;
  error:      string | null;
  isGuest:    boolean;

  setUser:    (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError:   (error: string | null) => void;
  setIsGuest: (isGuest: boolean) => void;
  reset:      () => void;
}

const initialState = {
  user:     null,
  profile:  null,
  loading:  true,
  error:    null,
  isGuest:  false,
};

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      ...initialState,
      setUser:    (user)    => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      setError:   (error)   => set({ error }),
      setIsGuest: (isGuest) => set({ isGuest }),
      reset:      ()        => set(initialState),
    }),
    { name: 'wanderiq-auth' }
  )
);
