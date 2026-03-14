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
                const res = await authApi.login(email, password);
                set({
                    token: res.data.token,
                    user: { role: res.data.role, ...res.data },
                    isAuthenticated: true
                });
            },

            googleLogin: async (credential) => {
                const res = await authApi.googleLogin(credential);
                set({
                    token: res.data.token,
                    user: { role: res.data.role, ...res.data },
                    isAuthenticated: true
                });
            },

            logout: () => set({ token: null, user: null, isAuthenticated: false }),

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
