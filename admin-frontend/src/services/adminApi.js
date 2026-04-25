import axios from "axios";

/**
 * ================= BASE CONFIG =================
 */
const BASE_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

const adminApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ================= INTERCEPTOR =================
 */
adminApi.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("adminToken");
    const volunteerToken = localStorage.getItem("volunteerToken");

    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (volunteerToken) {
      config.headers.Authorization = `Bearer ${volunteerToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "";
    const isAuthError = error.response?.status === 401;
    const isMissingAccount =
      message.toLowerCase().includes("admin not found") ||
      message.toLowerCase().includes("volunteer not found") ||
      message.toLowerCase().includes("not authorized");

    if (isAuthError && isMissingAccount) {
      removeAdminToken();
      removeVolunteerToken();
      localStorage.removeItem("admin");
      localStorage.removeItem("volunteer");

      if (!window.location.pathname.includes("/login")) {
        window.location.href = window.location.pathname.startsWith("/volunteer")
          ? "/volunteer/login"
          : "/admin/login";
      }
    }

    return Promise.reject(error);
  }
);

/**
 * ================= TOKEN HELPERS =================
 * (App.js & components REQUIRE these exports)
 */
export const setAdminToken = (token) => {
  token
    ? localStorage.setItem("adminToken", token)
    : localStorage.removeItem("adminToken");
};

export const setVolunteerToken = (token) => {
  token
    ? localStorage.setItem("volunteerToken", token)
    : localStorage.removeItem("volunteerToken");
};

export const getAdminToken = () => localStorage.getItem("adminToken");
export const getVolunteerToken = () => localStorage.getItem("volunteerToken");

export const removeAdminToken = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
};

export const removeVolunteerToken = () => {
  localStorage.removeItem("volunteerToken");
  localStorage.removeItem("volunteerUser");
};

/**
 * ================= ADMIN AUTH API =================
 */
export const adminAuthAPI = {
  login: async (data) => {
    const res = await adminApi.post("/admin/auth/login", data);
    return res.data;
  },

  register: async (data) => {
    const res = await adminApi.post("/admin/auth/register", data);
    return res.data;
  },

  createAdmin: async (data) => {
    const res = await adminApi.post("/admin/auth/register", data);
    return res.data;
  },

  getMe: async () => {
    const res = await adminApi.get("/admin/auth/me");
    return res.data;
  },

  getAdmins: async () => {
    const res = await adminApi.get("/admin/auth/admins");
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await adminApi.post("/admin/auth/forgot-password", { email });
    return res.data;
  },

  resetPassword: async (token, password) => {
    const res = await adminApi.put(`/admin/auth/reset-password/${token}`, { password });
    return res.data;
  },
};

/**
 * ================= VOLUNTEER AUTH API =================
 */
export const volunteerAuthAPI = {
  register: async (data) => {
    const res = await adminApi.post("/admin/volunteers/register", data);
    return res.data;
  },

  login: async (data) => {
    const res = await adminApi.post("/admin/volunteers/login", data);
    return res.data;
  },

  getMe: async () => {
    const res = await adminApi.get("/admin/volunteers/me");
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await adminApi.post("/admin/volunteers/forgot-password", { email });
    return res.data;
  },

  resetPassword: async (token, password) => {
    const res = await adminApi.put(`/admin/volunteers/reset-password/${token}`, { password });
    return res.data;
  },
};

/**
 * ================= ADMIN COMPLAINTS API =================
 */
export const adminComplaintsAPI = {
  getAll: async (params) => {
    const res = await adminApi.get("/admin/complaints", { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await adminApi.get(`/admin/complaints/${id}`);
    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await adminApi.put(`/admin/complaints/${id}/status`, { status });
    return res.data;
  },

  assignToVolunteer: async (id, volunteerId) => {
    const res = await adminApi.put(`/admin/complaints/${id}/assign`, {
      volunteerId,
    });
    return res.data;
  },

  unassign: async (id) => {
    const res = await adminApi.put(`/admin/complaints/${id}/unassign`);
    return res.data;
  },

  deleteComplaint: async (id) => {
    const res = await adminApi.delete(`/admin/complaints/${id}`);
    return res.data;
  },

  deleteComment: async (complaintId, commentId) => {
    const res = await adminApi.delete(`/admin/complaints/${complaintId}/comments/${commentId}`);
    return res.data;
  },

  getDashboardStats: async () => {
    const res = await adminApi.get("/admin/complaints/stats/dashboard");
    return res.data;
  },
};

/**
 * ================= VOLUNTEER COMPLAINTS API =================
 * 🔥 THIS EXPORT WAS MISSING (CAUSE OF ALL ERRORS)
 */
export const volunteerComplaintsAPI = {
  getAll: async () => {
    const res = await adminApi.get("/volunteer/complaints");
    return res.data;
  },

  getById: async (id) => {
    const res = await adminApi.get(`/volunteer/complaints/${id}`);
    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await adminApi.put(`/volunteer/complaints/${id}/status`, { status });
    return res.data;
  },

  getDashboardStats: async () => {
    const res = await adminApi.get("/volunteer/complaints/stats/dashboard");
    return res.data;
  },
};

/**
 * ================= ADMIN VOLUNTEERS API =================
 */
export const adminVolunteersAPI = {
  getAll: async () => {
    const res = await adminApi.get("/admin/volunteers");
    return res.data;
  },

  getById: async (id) => {
    const res = await adminApi.get(`/admin/volunteers/${id}`);
    return res.data;
  },

  createVolunteer: async (data) => {
    const res = await adminApi.post("/admin/volunteers", data);
    return res.data;
  },

  approve: async (id) => {
    const res = await adminApi.put(`/admin/volunteers/${id}/approve`);
    return res.data;
  },

  block: async (id) => {
    const res = await adminApi.put(`/admin/volunteers/${id}/block`);
    return res.data;
  },

  delete: async (id) => {
    const res = await adminApi.delete(`/admin/volunteers/${id}`);
    return res.data;
  },
};

/**
 * ================= ADMIN USERS API =================
 */
export const adminUsersAPI = {
  getAll: async () => {
    const res = await adminApi.get("/admin/users");
    return res.data;
  },

  getById: async (id) => {
    const res = await adminApi.get(`/admin/users/${id}`);
    return res.data;
  },

  block: async (id) => {
    const res = await adminApi.put(`/admin/users/${id}/block`);
    return res.data;
  },

  delete: async (id) => {
    const res = await adminApi.delete(`/admin/users/${id}`);
    return res.data;
  },
};

export default adminApi;
