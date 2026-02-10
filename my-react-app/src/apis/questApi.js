import api from "./axios";

export const getDailyQuests = async () => {
    const response = await api.get('/api/quest/daily');
    return response.data;
};

export const certifyQuest = async (questNo, formData) => {
    const response = await api.post(`/api/quest/certify/${questNo}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
