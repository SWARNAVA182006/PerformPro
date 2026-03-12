import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    (response) => {
        // We use the new enterprise standard JSON response wrapper
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Token expired or invalid
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error);
    }
);

export const authApi = {
    login: (email, password) => api.post("/auth/login", { email, password }),
    register: (userData) => api.post("/auth/register", userData),
    getMe: () => api.get("/auth/me")
};

export const dashboardApi = {
    getStats: () => api.get("/dashboard/stats"),
};

export const employeeApi = {
    getAll: (params) => api.get("/employees/", { params }),
    getById: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post("/employees/", data),
};

export const departmentApi = {
    getAll: () => api.get("/departments/"),
};

export const appraisalApi = {
    submitSelf: (data) => api.post("/appraisal/self-evaluation", data),
    submitManagerReview: (data) => api.post("/appraisal/manager-review", data),
};

export const notificationApi = {
    getAll: (unread_only = false) => api.get("/notifications/", { params: { unread_only } }),
    markRead: (id) => api.put(`/notifications/${id}/read`),
};

export const reportApi = {
    downloadEmployeeCSV: (deptId) => api.get("/reports/employees/csv", {
        params: { department_id: deptId },
        responseType: 'blob'
    })
};

export default api;
