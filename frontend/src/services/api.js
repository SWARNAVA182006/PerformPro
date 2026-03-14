import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
    login: async (email, password) => {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
        return response.data;
    },
    signup: (userData) => api.post("/auth/signup", userData),
    googleLogin: (credential) => api.post("/auth/google", { credential }),
    getMe: () => api.get("/auth/me"),
    updateMe: (profileData) => api.put("/auth/me", profileData)
};

export const dashboardApi = {
    getAnalytics: () => api.get("/analytics/dashboard"),
    getPerformanceTrends: () => api.get("/analytics/performance-trends"),
    getDepartmentEngagement: () => api.get("/analytics/department-engagement"),
    getActivityFeed: () => api.get("/analytics/activity-feed")
};

export const employeeApi = {
    getAll: (params) => api.get("/employees/", { params }),
    getById: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post("/employees/", data),
    update: (id, data) => api.put(`/employees/${id}`, data)
};

export const departmentApi = {
    getAll: () => api.get("/departments/"),
};

export const appraisalApi = {
    getAll: () => api.get("/appraisal/"),
    submitSelf: (data) => api.post("/appraisal/self-evaluation", data),
    submitManagerReview: (data) => api.post("/appraisal/manager-review", data),
};

export const notificationApi = {
    getAll: (unread_only = false) => api.get("/notifications/", { params: { unread_only } }),
    markRead: (id) => api.put(`/notifications/${id}/read`),
};

export const reportApi = {
    downloadEmployeeReport: (deptId, format = "csv") => api.get("/reports/employees", {
        params: { department_id: deptId, format },
        responseType: 'blob'
    })
};

export default api;
