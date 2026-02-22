import api from "./axios";

export const reportsApi = {
  // 신고 목록 조회
  reportsList: async (params) => {
    const response = await api.get("/reports/list", { params });
    return response.data;
  },

  // 신고 상세 조회
  reportsDetail: async (reportsId) => {
    const response = await api.get(`/reports/detail/${reportsId}`);
    return response.data;
  },

  // 신고 등록 (일반 사용자)
  reportsInsert: async (data) => {
    const response = await api.post("/reports/insert", null, {
      params: data,
    });
    return response.data;
  },

  // // 신고 수정
  // reportsUpdate: async (reportsId, data) => {
  //   const response = await api.put(`/reports/update/${reportsId}`, null, {
  //     params: data,
  //   });
  //   return response.data;
  // },

  // // 신고 삭제
  // reportsDelete: async (reportsId, memberId) => {
  //   const response = await api.delete(`/reports/delete/${reportsId}`, {
  //     params: { memberId },
  //   });
  //   return response.data;
  // },

  
  // 신고 상태 변경 (관리자)
  reportsStatusChange: async (memberId, reportsId, status) => {
    const response = await api.put("/reports/changeStatus", null, {
      params: { memberId, reportsId, status },
    });
    return response.data;
  },

   // 누적 신고 10회 블라인드 처리
  reportsBlind: async (data) => {
    const response = await api.put("/reports/blind", null, { params: data });
    return response.data;
  },

  // 신고 중복 체크
  reportsCheck: async (memberId, targetMemberId, postId = 0, replyId = 0, reviewId = 0) => {
    const response = await api.get(`/reports/check/${memberId}/${targetMemberId}`, {
      params: { postId, replyId, reviewId },
    });
    return response.data;
  },
};