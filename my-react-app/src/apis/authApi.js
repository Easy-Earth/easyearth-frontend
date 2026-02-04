import axios from "axios";

// Vite 프록시 사용: /member → localhost:8080/spring/member
const api = axios.create({
  baseURL: "/spring/member", // 프록시 처리
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 시 JWT 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =====================================
// 회원 관련 API
// =====================================
const authApi = {
  register: async (data) => {
    const res = await api.post("/join", data);
    return res.data;
  },

  login: async (data) => {
    const res = await api.post("/login", data);
    return res.data;
  },

  checkIdDuplicate: async (loginId) => {
    const res = await api.get(`/checkId/${loginId}`);
    return res.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getUser: async (memberId) => {
    const res = await api.get(`/${memberId}`);
    return res.data;
  },

  // 🚀 비밀번호 찾기 추가
  findPassword: async (data) => {
    // 서버의 엔드포인트가 /findPassword 라고 가정 (백엔드 설계에 맞게 수정 필요)
    const res = await api.post("/findPassword", data); 
    return res.data;
  },

  // (선택) 비밀번호 재설정
  resetPassword: async (data) => {
    const res = await api.post("/resetPassword", data);
    return res.data;
  }
};

export default authApi;
