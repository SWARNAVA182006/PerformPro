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
                const currentToken = res.data.token;
                
                // Set initial auth state so interceptor works
                set({
                    token: currentToken,
                    isAuthenticated: true
                });

                // Fetch full user profile including employee_id
                const meRes = await authApi.getMe();
                
                set({
                    user: { ...res.data, ...meRes.data }
                });
            },

            googleLogin: async (credential) => {
                const res = await authApi.googleLogin(credential);
                const currentToken = res.data.token;
                
                set({
                    token: currentToken,
                    isAuthenticated: true
                });

                // Fetch full user profile including employee_id
                const meRes = await authApi.getMe();
                
                set({
                    user: { ...res.data, ...meRes.data }
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
