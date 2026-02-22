import { createContext, useContext, useEffect, useState } from "react";
import authApi from "../apis/authApi";
import { updateOnlineStatus } from "../apis/chatApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 실행 시 로그인 상태 복구
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Spring Security 적용 시, 토큰이 유효한지 서버에 가볍게 체크하는 로직이 있으면 좋습니다.
          // 여기서는 일단 기존대로 온라인 상태 업데이트만 유지합니다.
          await updateOnlineStatus(parsedUser.memberId, 1);
        } catch (err) {
          console.error("인증 정보 복구 실패:", err);
          // 토큰이 손상되었거나 만료되었을 가능성이 있으므로 청소
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const isAuthenticated = !!user;

  // 로그인 함수
  const login = async ({ loginId, password }) => {
    try {
      // ⚠️ authApi.login 내부에서 사용하는 axios가 
      // 우리가 만든 api 인터셉터를 사용하는지 확인하세요.
      const res = await authApi.login({ loginId, password });
      const { token, user: userData } = res;

      // 1. 스토리지 저장
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      
      // 2. 상태 업데이트
      setUser(userData);

      // 3. 온라인 상태 업데이트
      try {
        await updateOnlineStatus(userData.memberId, 1);
      } catch (err) {
        console.warn("로그인 후 상태 업데이트 실패 (비중요):", err);
      }

      return { success: true };
    } catch (err) {
      console.error("Login Error:", err);
      return { 
        success: false, 
        message: err.response?.data?.message || err.response?.data || "아이디 또는 비밀번호를 확인해주세요." 
      };
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      if (user?.memberId) {
        await updateOnlineStatus(user.memberId, 0);
      }
      // 백엔드에 시큐리티 로그아웃 엔드포인트가 있다면 호출 (선택)
      // await api.post("/member/logout");
    } catch (err) {
      console.warn("서버 로그아웃 처리 중단 (클라이언트 로그아웃 계속):", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("notifications");
      setUser(null);
      // 로그아웃 시 메인이나 로그인 페이지로 강제 이동이 필요할 수 있습니다.
      window.location.href = "/"; 
    }
  };

  const register = async (data) => {
    try {
      await authApi.register(data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data || "회원가입 실패" };
    }
  };

  const updateUser = (updates) => {
    setUser(prev => {
      const newUser = { ...prev, ...updates };
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);