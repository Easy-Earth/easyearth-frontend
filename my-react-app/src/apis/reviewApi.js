import api from "./axios";

export const reviewApi = {
    getReviews: async (shopId) => { 
        if (!shopId) throw new Error("shopId is required");
        
        const response = await api.get(`/eco/review/list/${shopId}`);
        return response.data;
    }
}