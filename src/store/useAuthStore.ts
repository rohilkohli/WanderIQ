// ============================================================
// WanderIQ — Auth Store (Zustand)
// ============================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/types';

/**
 * The shape of the global authentication state.
 * @returns The AuthState object
 */
export interface AuthState {
  user:       User | null;
  profile:    UserProfile | null;
  loading:    boolean;
  error:      string | null;
  isGuest:    boolean;

  /**
   * Set the current Firebase user.
   * @param user - The authenticated Firebase user or null
   * @returns void
   */
  setUser:    (user: User | null) => void;
  /**
   * Set the user's WanderIQ profile data.
   * @param profile - The user profile document or null
   * @returns void
   */
  setProfile: (profile: UserProfile | null) => void;
  /**
   * Update the global auth loading state.
   * @param loading - The new loading boolean
   * @returns void
   */
  setLoading: (loading: boolean) => void;
  /**
   * Set or clear a global authentication error.
   * @param error - The error message or null
   * @returns void
   */
  setError:   (error: string | null) => void;
  /**
   * Toggle the guest user mode.
   * @param isGuest - Whether the user is in guest mode
   * @returns void
   */
  setIsGuest: (isGuest: boolean) => void;
  /**
   * Reset the store to its initial empty state.
   * @returns void
   */
  reset:      () => void;
}

const initialState = {
  user:     null,
  profile:  null,
  loading:  true,
  error:    null,
  isGuest:  false,
};

/**
 * Global Zustand store for managing user authentication and profile state.
 * @returns The React hook for accessing the AuthState
 */
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
