import api from "./axios";

// ============================================
// 채팅방 관련
// ============================================

// 1. 채팅방 목록 조회 (안 읽은 메시지 포함)
export const getChatRooms = async (memberId) => {
  try {
    const response = await api.get(`/chat/rooms`, {
      params: { memberId }
    });
    return response.data;
  } catch (error) {
    console.error("채팅방 목록 조회 실패", error);
    throw error;
  }
};

// 1.1 회원 검색 (이름/닉네임 - 목록 반환)
export const searchMember = async (keyword) => {
  try {
    const response = await api.get(`/chat/users/search`, {
      params: { keyword }
    });
    return response.data; // List of members
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error("회원 검색 실패", error);
    throw error;
  }
};

// 2. 채팅방 생성 (1:1 또는 그룹)
export const createChatRoom = async (roomData) => {
  try {
    const response = await api.post("/chat/room", roomData);
    return response.data;
  } catch (error) {
    console.error("채팅방 생성 실패", error);
    throw error;
  }
};

// 3. 채팅방 상세 정보 조회
export const getChatRoomDetail = async (roomId) => {
  try {
    const response = await api.get(`/chat/room/${roomId}`);
    return response.data;
  } catch (error) {
    console.error("채팅방 상세 조회 실패", error);
    throw error;
  }
};

// 3.1 채팅방 멤버 조회
export const getChatRoomUsers = async (roomId) => {
    try {
      const response = await api.get(`/chat/room/${roomId}/members`); // Backend endpoint needs verification
      return response.data;
    } catch (error) {
      console.error("채팅방 멤버 조회 실패", error);
      throw error;
    }
  };

// 4. 채팅방 참여
export const joinChatRoom = async (roomId, memberId) => {
  try {
    await api.post(`/chat/room/${roomId}/join`, null, {
      params: { memberId }
    });
  } catch (error) {
    console.error("채팅방 참여 실패", error);
    throw error;
  }
};

// 5. 채팅방 나가기
export const leaveChatRoom = async (roomId, memberId) => {
  try {
    await api.delete(`/chat/room/${roomId}/leave`, {
      params: { memberId }
    });
  } catch (error) {
    console.error("채팅방 나가기 실패", error);
    throw error;
  }
};
// export const leaveChatRoom = async (roomId, memberId) => {
//   try {
//     // URL 뒤에 직접 쿼리 스트링을 붙여서 전달
//     await api.delete(`/chat/room/${roomId}/leave?memberId=${memberId}`);
//   } catch (error) {
//     console.error("채팅방 나가기 실패", error);
//     throw error;
//   }
// };
// ============================================
// 메시지 관련
// ============================================

// 6. 메시지 내역 조회 (페이징 지원 가능)
export const getMessages = async (roomId, cursorId, memberId) => {
  try {
    const response = await api.get(`/chat/room/${roomId}/messages`, {
      params: { cursorId, memberId }
    });
    return response.data;
  } catch (error) {
    console.error("메시지 내역 조회 실패", error);
    throw error;
  }
};

// 7. 메시지 읽음 처리
export const markAsRead = async (roomId, memberId, lastMessageId) => {
  try {
    await api.post(`/chat/room/${roomId}/read`, null, {
      params: { memberId, lastMessageId }
    });
  } catch (error) {
    console.error("메시지 읽음 처리 실패", error);
    throw error;
  }
};

// 8. 메시지 검색 (페이징 지원)
export const searchMessages = async (roomId, memberId, keyword, limit = 10, offset = 0) => {
  try {
    const response = await api.get(`/chat/room/${roomId}/search`, {
      params: { memberId, keyword, limit, offset }
    });
    return response.data;
  } catch (error) {
    console.error("메시지 검색 실패", error);
    throw error;
  }
};

// 8.1. 메시지 삭제 (Soft Delete)
export const deleteMessage = async (messageId, memberId) => {
  try {
    await api.put(`/chat/message/${messageId}/delete`, null, {
      params: { memberId }
    });
  } catch (error) {
    console.error("메시지 삭제 실패", error);
    throw error;
  }
};


// 9. 파일 업로드
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await api.post("/chat/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; // URL 반환
  } catch (error) {
    console.error("파일 업로드 실패", error);
    throw error;
  }
};

// ============================================
// 멤버 관리 (그룹 채팅)
// ============================================

// 9. 권한 변경 (방장 위임)
export const updateRole = async (roomId, targetMemberId, requesterId, newRole) => {
  try {
    await api.patch(`/chat/room/${roomId}/user/${targetMemberId}/role`, null, {
      params: { requesterId, newRole }
    });
  } catch (error) {
    console.error("권한 변경 실패", error);
    throw error;
  }
};

// 10. 멤버 강퇴
export const kickMember = async (roomId, targetMemberId, requesterId) => {
  try {
    await api.delete(`/chat/room/${roomId}/user/${targetMemberId}`, {
      params: { requesterId }
    });
  } catch (error) {
    console.error("멤버 강퇴 실패", error);
    throw error;
  }
};

// ============================================
// 채팅방 공지 관리
// ============================================

// 11. 채팅방 공지 설정
export const setNotice = async (roomId, memberId, messageId) => {
  try {
    await api.post(`/chat/room/${roomId}/notice`, null, {
      params: { memberId, messageId }
    });
  } catch (error) {
    console.error("공지 설정 실패", error);
    throw error;
  }
};

// 12. 채팅방 공지 해제
export const clearNotice = async (roomId, memberId) => {
  try {
    await api.delete(`/chat/room/${roomId}/notice`, {
      params: { memberId }
    });
  } catch (error) {
    console.error("공지 해제 실패", error);
    throw error;
  }
};

// ============================================
// 추가 기능
// ============================================

// 11. 메시지 리액션 토글
export const toggleReaction = async (messageId, memberId, emojiType) => {
  try {
    const response = await api.post(`/chat/message/${messageId}/reaction`, null, {
      params: { memberId, emojiType }
    });
    return response.data;
  } catch (error) {
    console.error("리액션 토글 실패", error);
    throw error;
  }
};

// ============================================
// 즐겨찾기 및 초대 관리
// ============================================

// 12. 채팅방 즐겨찾기 토글
export const toggleFavorite = async (roomId, memberId) => {
  try {
    await api.put(`/chat/rooms/${roomId}/favorite`, null, {
      params: { memberId }
    });
  } catch (error) {
    console.error("즐겨찾기 토글 실패", error);
    throw error;
  }
};

// 13. 사용자 초대
export const inviteUser = async (roomId, invitedMemberId, requesterId) => {
  try {
    await api.post(`/chat/rooms/${roomId}/invite`, null, {
      params: { invitedMemberId, requesterId }
    });
  } catch (error) {
    console.error("사용자 초대 실패", error);
    throw error;
  }
};

// 14. 초대 수락
export const acceptInvitation = async (roomId, memberId) => {
  try {
    await api.put(`/chat/rooms/${roomId}/invitation/accept`, null, {
      params: { memberId }
    });
  } catch (error) {
    console.error("초대 수락 실패", error);
    throw error;
  }
};

// 15. 초대 거절
export const rejectInvitation = async (roomId, memberId) => {
  try {
    await api.put(`/chat/rooms/${roomId}/invitation/reject`, null, {
      params: { memberId }
    });
  } catch (error) {
    console.error("초대 거절 실패", error);
    throw error;
  }
};

// 15.1 초대 중인 사용자 목록 조회
export const getInvitedUsers = async (roomId) => {
    try {
      const response = await api.get(`/chat/rooms/${roomId}/invitations`);
      return response.data;
    } catch (error) {
      console.error("초대 중인 사용자 목록 조회 실패", error);
      throw error;
    }
  };
  
  // 15.2 초대 취소
  export const cancelInvitation = async (roomId, targetMemberId, requesterId) => {
    try {
      await api.delete(`/chat/rooms/${roomId}/invitations/${targetMemberId}`, {
        params: { requesterId }
      });
    } catch (error) {
      console.error("초대 취소 실패", error);
      throw error;
    }
  };

// 16. 프로필 이미지 변경 (채팅 전용)
export const updateProfile = async (memberId, profileImageUrl) => {
  try {
    await api.patch(`/chat/user/profile`, null, {
      params: { memberId, profileImageUrl }
    });
  } catch (error) {
    console.error("프로필 변경 실패", error);
    throw error;
  }
};

// 17. 방 제목 변경 (방장 전용)
export const updateChatRoomTitle = async (roomId, memberId, newTitle) => {
  try {
    await api.patch(`/chat/room/${roomId}/title`, null, {
      params: { memberId, newTitle }
    });
  } catch (error) {
    console.error("방 이름 변경 실패", error);
    throw error;
  }
};
// 18. 방 이미지 변경 (방장 전용)
export const updateRoomImage = async (roomId, memberId, imageUrl) => {
  try {
    await api.patch(`/chat/room/${roomId}/image`, null, {
      params: { memberId, imageUrl }
    });
  } catch (error) {
    console.error("방 이미지 변경 실패", error);
    throw error;
  }
};

// ============================================
// 회원 온라인 상태 업데이트
// ============================================

export const updateOnlineStatus = async (memberId, isOnline) => {
  try {
    const response = await api.put(`/member/status/${memberId}`, null, {
      params: { isOnline }
    });
    return response.data;
  } catch (error) {
    console.error("온라인 상태 업데이트 실패", error);
    throw error;
  }
};
