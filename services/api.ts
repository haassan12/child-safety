import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

// attach token
API.interceptors.request.use(
    (config: any) => {
        if (typeof window !== "undefined") {
            const token = sessionStorage.getItem("token");
            if (token) {
                config.headers["Authorization"] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error: any) => Promise.reject(error)
);

// Dashboard API functions
export const getChildDashboard = async () => {
    const res = await API.get<{ success: boolean; data: any }>("/child/dashboard");
    return res.data.data;
};

export const getParentDashboard = async () => {
    const res = await API.get<{ success: boolean; data: any }>("/parent/dashboard");
    return res.data.data;
};

export const addChild = async (data: any) => {
    const res = await API.post("/parent/add-child", data);
    return res.data;
};

export const getChildDetails = async (id: number) => {
    const res = await API.get(`/parent/child/${id}`);
    return res.data.data;
};

export const linkChild = async (data: any) => {
    const res = await API.post("/parent/link-child", data);
    return res.data;
};

export const updateChild = async (id: number, data: { name?: string; email?: string }) => {
    const res = await API.put(`/parent/child/${id}`, data);
    return res.data;
};

export const unlinkChild = async (id: number) => {
    const res = await API.delete(`/parent/child/${id}`);
    return res.data;
};

export default API;

