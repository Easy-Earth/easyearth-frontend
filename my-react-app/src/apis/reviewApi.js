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
    },
    reviewReport: async (reportData) => {
    const response = await api.post('/reports/insert', null, {
        params: reportData 
    });
    return response.data;
    },
    reviewCheck: async (memberId, targetMemberId, reportCheckData) => {
    const response = await api.get(`/reports/check/${memberId}/${targetMemberId}`, {
        params: reportCheckData 
    });
    return response.data;
    },
    reviewBlind: async (reviewId) => {
        const response = await api.put('/reports/blind', null, {
            params: {
                type: 'REVIEW',
                postId: 0,
                replyId: 0,
                reviewId: reviewId
            }
        });
        return response.data;
    }
}