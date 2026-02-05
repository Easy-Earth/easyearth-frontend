import api from "./axios";

export const reviewApi = {
    getReviews: async (shopId) => { 
        const response = await api.get(`/eco/review/list/${shopId}`);
        return response.data;
    },

    reviewWrite: async (reviewData) => {
        const response = await api.post('/eco/review/write', null, {
        params: reviewData 
    });
    return response.data;
    },
    reviewDelete : async (esrId) => {
        const response = await api.delete(`/eco/review/delete/${esrId}`);
        return response.data;
    },
    
    reviewUpdate: async (reviewData) => {
        const response = await api.put(`/eco/review/update`, reviewData);
        return response.data;
    }
    
}