import API from "./api";
import { Journey } from "../types/journey";

export default {
    getParentJourneys: async (page: number = 1, status: string = "all", search: string = "") => {
        const res = await API.get<{ success: boolean; data: Journey[]; pagination: { last_page: number } }>("/parent/journeys", {
            params: { page, status, search }
        });
        return res.data;
    },

    deleteJourney: async (id: number) => {
        const res = await API.delete<{ success: boolean; message: string }>(`/journeys/${id}`);
        return res.data;
    },

    uploadDocument: async (journeyId: number, formData: FormData) => {
        return API.post(`/journeys/${journeyId}/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    createJourney: async (payload: { child_id: number; start_location: string; end_location: string; duration_minutes: number }) => {
        return API.post("/parent/journeys", payload);
    },

    updateJourney: async (id: number, payload: { start_location?: string; end_location?: string; duration_minutes?: number }) => {
        return API.put(`/journeys/${id}`, payload);
    },
};
