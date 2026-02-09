import API from "./api";
import { Journey } from "../types/journey";

export default {
    getChildJourneys: async (): Promise<Journey[]> => {
        const res = await API.get<{ success: boolean; data: Journey[] }>("/child/journeys");
        return res.data.data;
    },

    startJourney: async (payload: { journey_id?: number; start_location?: string; end_location?: string }) => {
        return API.post("/journeys/start", payload);
    },

    stopJourney: async () => {
        return API.post("/journeys/stop");
    },

    sendSOS: async (payload: { journey_id?: number; message?: string }) => {
        return API.post("/journeys/sos", payload);
    },

    uploadDocument: async (journeyId: number, formData: FormData) => {
        return API.post(`/journeys/${journeyId}/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};
