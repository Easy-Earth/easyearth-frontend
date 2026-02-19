import api from "./axios.jsx";

export const communityApi = {
  // 목록 조회
  communityList: async (params) => {
    const response = await api.get('/community/post/list', { params });
    return response.data;
  },

  // 상세 조회
  communityDetail: async (postId) => {
    const response = await api.get(`/community/post/detail/${postId}`);
    return response.data;
  },

  // 게시글 등록
  communityInsert: async (formData) => {
    const response = await api.post('/community/post/insert', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // 게시글 수정
  communityUpdate: async (postId, formData) => {
    const response = await api.put(`/community/post/update/${postId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // 게시글 삭제
  communityDelete: async (postId) => {
    const response = await api.delete(`/community/post/delete/${postId}`);
    return response.data;
  },

  // 게시글 좋아요
  communityLikes: async (postId, memberId) => {
    const response = await api.post(
      `/community/post/${postId}/likes`,
      null,
      { params: { memberId } }
    );
    return response.data;
  },

  // 게시글 좋아요 상태 확인
  getPostLikeStatus: async (postId, memberId) => {
    try {
      const response = await api.get(`/community/post/${postId}/likes/status`,
        { params: { memberId }}
      );
      return response.data;
    } catch {
      return "N";
    }
  },

  // 댓글 목록
  replyList: async (postId) => {
    const response = await api.get(`/community/reply/list/${postId}`);
    return response.data;
  },

  // 댓글 등록
  replyInsert: async (postId, replyData) => {
    const response = await api.post(
      `/community/reply/insert/${postId}`,
      null,
      { params: replyData }
    );
    return response.data;
  },

  // 댓글 수정
  replyUpdate: async (postId, replyId, content, memberId) => {
    const response = await api.put(
      `/community/reply/update/${postId}`,
      null,
      { params: { replyId, content, memberId } }
    );
    return response.data;
  },

  // 댓글 삭제
  replyDelete: async (postId, replyId, memberId) => {
    console.log("API 호출: ", {postId, replyId, memberId});
    const response = await api.delete(
      `/community/reply/delete/${postId}`,
      { params: { replyId, memberId } }
    );
    return response.data;
  },

  // 댓글 좋아요
  replyLikes: async (postId, replyId, memberId) => {
    const response = await api.post(
      `/community/reply/${postId}/${replyId}/likes`,
      null,
      { params: { memberId } }
    );
    return response.data;
  },

  // 댓글 좋아요 상태 확인
  getReplyLikeStatus: async (postId, replyId, memberId) => {
    try {
      const response = await api.get(`/community/reply/${postId}/${replyId}/likes/status`,
        { params: { memberId } }
      );
      return response.data;
    } catch {
      return "N";
    }
  },

  
};