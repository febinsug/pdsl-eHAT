import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,

      login: async (username: string, password: string) => {
        set({ loading: true });
        try {
          const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password_hash', password)
            .single();

          if (error || !users) {
            throw new Error('Invalid credentials');
          }

          const { password_hash, ...user } = users;
          set({ user });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      logout: async () => {
        set({ user: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);