import api from "./axios";

export const getAttendanceList = async (memberId, yearMonth) => {
    const response = await api.get('/attendance/list', {
        params: { userId: memberId, yearMonth }
    });
    return response.data;
};

export const checkAttendance = async (memberId) => {
    const response = await api.post('/attendance/check', null, {
        params: { userId: memberId }
    });
    return response.data;
};
