import axios from 'axios';

const API_BASE_URL = '/spring/ecotree';

export const getEcoTreeInfo = async (memberId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${memberId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch EcoTree info", error);
        throw error;
    }
};

export const growEcoTree = async (memberId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/grow/${memberId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to grow EcoTree", error);
        throw error;
    }
};
