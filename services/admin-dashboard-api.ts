import API from "./api";

export default {
  getAdminDashboard: async () => {
    const res = await API.get<{ success: boolean; data: any }>("/admin/dashboard");
    return res.data.data;
  },
  getParentDashboard: async () => {
    const res = await API.get<{ success: boolean; data: any }>("/parent/dashboard");
    return res.data.data;
  },
  getChildDashboard: async () => {
    const res = await API.get<{ success: boolean; data: any }>("/child/dashboard");
    return res.data.data;
  },
};

