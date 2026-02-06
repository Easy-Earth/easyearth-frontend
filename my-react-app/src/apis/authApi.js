import axios from "axios";

// Vite 프록시 사용: /member → localhost:8080/spring/member
const api = axios.create({
  baseURL: "/spring/member", // 프록시 처리 설정
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 시 브라우저 LocalStorage에 저장된 JWT 토큰이 있다면 헤더에 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =====================================
// 회원 관련 API 모듈
// =====================================
const authApi = {
  /**
   * 회원가입
   */
  register: async (data) => {
    const res = await api.post("/join", data);
    return res.data;
  },

  /**
   * 로그인
   */
  login: async (data) => {
    const res = await api.post("/login", data);
    return res.data;
  },

  /**
   * 아이디 중복 체크
   */
  checkIdDuplicate: async (loginId) => {
    const res = await api.get(`/checkId/${loginId}`);
    return res.data;
  },

  /**
   * 로그아웃 (클라이언트 측 토큰 삭제)
   */
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  /**
   * 회원 정보 조회
   */
  getUser: async (memberId) => {
    const res = await api.get(`/${memberId}`);
    return res.data;
  },

  /**
   * 회원 정보 수정
   */
  updateMember: async (data) => {
    const res = await api.put("/update", data);
    return res.data;
  },

  /**
   * 회원 상세 정보 조회 (수정 후 갱신용)
   */
  selectMemberById: async (memberId) => {
    const res = await api.get(`/${memberId}`);
    return res.data;
  },

  /**
   * 비밀번호 찾기 (임시 비밀번호 발급)
   */
  findPassword: async (data) => {
    const res = await api.post("/findPassword", data); 
    return res.data;
  },

  /**
   * 비밀번호 재설정
   */
  resetPassword: async (data) => {
    const res = await api.post("/resetPassword", data);
    return res.data;
  },

  /**
   * 🚀 회원 탈퇴 (추가된 기능)
   * @param {string|number} memberId - 회원의 고유 번호
   * @param {string} password - 본인 확인을 위한 비밀번호
   * 백엔드에서 @RequestParam String password로 받으므로 params 객체로 전달합니다.
   */
  deleteMember: async (memberId, password) => {
    const res = await api.delete(`/delete/${memberId}`, {
      params: { password }, // URL 뒤에 ?password=... 형태로 전송됨
    });
    return res.data;
  },
};

export default authApi;