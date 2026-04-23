import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://performpro-api.onrender.com";

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
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error);
    }
);

export const authApi = {
    login: (credentials) => api.post("/auth/login", credentials),
    googleLogin: (credential) => api.post("/auth/google", { credential }),
    signup: (data) => api.post("/auth/signup", data),
    getMe: () => api.get("/auth/me"),
};

export const employeeApi = {
    getAll: (params) => api.get("/employee/", { params }),
    getById: (id) => api.get(`/employee/${id}`),
    getMe: () => api.get("/employee/me"),
    update: (id, data) => api.put(`/employee/${id}`, data),
    updateMe: (data) => api.put("/employee/me", data),
};

export const skillApi = {
    getByEmployeeId: (id) => api.get(`/employee/skills/?employee_id=${id}`),
    add: (data) => api.post("/employee/skills/", data),
};

export const feedbackApi = {
    getByEmployeeId: (id) => api.get(`/employee/feedback/?employee_id=${id}`),
    create: (data) => api.post("/employee/feedback/", data),
};

export const uploadApi = {
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const token = useAuthStore.getState().token;
        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
};

export const dashboardApi = {
    getMetrics: () => api.get("/dashboard/metrics"),
    getActivity: () => api.get('/dashboard/activity'),
};

export const analyticsApi = {
    getPerformance: () => api.get("/analytics/performance"),
    getDepartments: () => api.get("/analytics/departments"),
    getAppraisals: () => api.get("/analytics/appraisals"),
    getTopPerformers: () => api.get("/analytics/top-performers"),
    getPrediction: (employeeId) => api.get(`/analytics/predict/${employeeId}`),
    getMyPrediction: () => api.get("/analytics/predict-me"),
    getOrgInsights: () => api.get("/analytics/org-insights"),
};

export const appraisalApi = {
    getAll: () => api.get("/appraisals/"),
    getMy: () => api.get("/appraisals/my"),
    submit: (data) => api.post("/appraisals/", data),
    create: (data) => api.post("/appraisals/", data),
    approve: (id, data) => api.put(`/appraisals/${id}/approve`, data),
    reject: (id, data) => api.put(`/appraisals/${id}/reject`, data),
};

export const goalApi = {
    getAll: () => api.get("/goals/"),
    getMy: () => api.get("/goals/my"),
    create: (data) => api.post("/goals/", data),
    update: (id, data) => api.put(`/goals/${id}`, data),
    approve: (id) => api.put(`/goals/${id}/approve`, {}),
    deny: (id) => api.put(`/goals/${id}/deny`, {}),
    complete: (id) => api.put(`/goals/${id}/complete`, {}),
    delete: (id) => api.delete(`/goals/${id}`)
};

export const searchApi = {
    globalSearch: (query) => api.get(`/search/?query=${encodeURIComponent(query)}`)
};

export const notificationApi = {
    getAll: (unread_only = false) => api.get("/notifications/", { params: { unread_only } }),
    markRead: (id) => api.put(`/notifications/${id}/read/`),
};

export const reportApi = {
    exportReport: () => api.get("/reports/export", { responseType: 'blob' }),
    downloadEmployeeCSV: (deptId) => api.get("/reports/employees", { params: deptId ? { department_id: deptId } : {}, responseType: 'blob' })
};

export const chatbotApi = {
    query: (intent) => api.post("/chatbot/query", { intent }),
    ping:  ()       => api.get("/chatbot/ping"),
};

export default api;
