import api from "./axios";

export const getDailyQuests = async () => {
    const response = await api.get('/api/quest/daily');
    return response.data;
};

export const certifyQuest = async (questNo, userId, formData) => {
    const response = await api.post(`/api/quest/certify/${questNo}?userId=${userId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
