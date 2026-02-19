import api from "./axios";

export const inquiriesApi = {
  // 목록 조회
  inquiriesList: async (params) => {
    const response = await api.get("/inquiries/post/list", { params });
    return response.data;
  },

  // 상세 조회
  inquiriesDetail: async (inquiriesId, memberId) => {
    const response = await api.get(`/inquiries/post/detail/${inquiriesId}`, {
      params: { memberId },
    });
    return response.data;
  },

  // 등록
  inquiriesInsert: async (data) => {
    const response = await api.post("/inquiries/post/insert", null, {
      params: data,
    });
    return response.data;
  },

  // 수정
  inquiriesUpdate: async (inquiriesId, data) => {
    const response = await api.put(`/inquiries/post/update/${inquiriesId}`, null, {
      params: data,
    });
    return response.data;
  },

  // 삭제
  inquiriesDelete: async (inquiriesId, memberId) => {
    const response = await api.delete(`/inquiries/post/delete/${inquiriesId}`, {
      params: { memberId },
    });
    return response.data;
  },

  // 관리자 상태 변경
  inquiriesStatusChange: async (memberId, inquiriesId, status) => {
    const response = await api.put("/inquiries/changeStatus", null, {
      params: { memberId, inquiriesId, status },
    });
    return response.data;
  },

  // 관리자 답변
  inquiriesAdminReply: async (inquiriesId, memberId, adminReply) => {
    const response = await api.put(`/inquiries/adminReply/${inquiriesId}`, null, {
      params: { memberId, adminReply },
    });
    return response.data;
  },
};