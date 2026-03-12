import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null, // { id, email, role }
            isAuthenticated: false,

            setAuth: (token, user) => set({ token, user, isAuthenticated: true }),

            logout: () => set({ token: null, user: null, isAuthenticated: false }),

            hasRole: (allowedRoles) => {
                const { user, isAuthenticated } = get();
                if (!isAuthenticated || !user) return false;
                return allowedRoles.includes(user.role);
            }
        }),
        {
            name: 'performpro-auth', // unique name for localStorage key
        }
    )
);

export default useAuthStore;
