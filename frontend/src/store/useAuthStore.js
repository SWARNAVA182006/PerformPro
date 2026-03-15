import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api';

const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null, // { id, email, role }
            isAuthenticated: false,

            login: async (email, password) => {
                const res = await authApi.login({ email, password });
                const { token } = res.data;
                
                set({ token, isAuthenticated: true });
                
                // Fetch full profile immediately
                const profileRes = await authApi.getMe();
                set({ user: profileRes.data });
            },

            googleLogin: async (credential) => {
                const res = await authApi.googleLogin(credential);
                const { token } = res.data;
                
                set({ token, isAuthenticated: true });
                
                // Fetch full profile
                const profileRes = await authApi.getMe();
                set({ user: profileRes.data });
            },

            // Fetch full profile manually (useful after profile updates)
            fetchProfile: async () => {
                const profileRes = await authApi.getMe();
                set({ user: profileRes.data });
            },

            // Action to manually set auth (useful for signup or SSR)
            setAuth: (token, user) => set({ token, user, isAuthenticated: !!token }),

            logout: () => {
                set({ token: null, user: null, isAuthenticated: false });
                localStorage.removeItem('performpro-auth');
            },

            hasRole: (allowedRoles) => {
                const { user, isAuthenticated } = get();
                if (!isAuthenticated || !user) return false;
                return allowedRoles.includes(user.role);
            },

            getCurrentUser: () => get().user
        }),
        {
            name: 'performpro-auth', // unique name for localStorage key
        }
    )
);

export default useAuthStore;
