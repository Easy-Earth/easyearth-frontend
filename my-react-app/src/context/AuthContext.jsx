// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import authApi from "../apis/authApi";
import { updateOnlineStatus } from "../apis/chatApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 로컬 스토리지에 토큰과 유저 정보가 있다면 해당 정보로 로그인
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // 자동 로그인 시 온라인 상태 업데이트
      updateOnlineStatus(parsedUser.memberId, 1).catch(err => {
        console.error("자동 로그인 온라인 상태 업데이트 실패", err);
      });
    }
    setIsLoading(false);
  }, []);

  const isAuthenticated = !!user;

  // 로그인 함수
  const login = async ({ loginId, password }) => {
    try {
      const res = await authApi.login({ loginId, password });
      const { token, user } = res;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      // 온라인 상태 업데이트 (로그인 시 온라인으로 설정)
      try {
        await updateOnlineStatus(user.memberId, 1);
      } catch (err) {
        console.error("온라인 상태 업데이트 실패", err);
      }

      return { success: true };
    } catch (err) {
      console.error(err.response?.data);
      return { success: false, message: err.response?.data || "로그인 실패" };
    }
  };

  // 로그아웃 함수 (에러 방지 로직 적용)
  const logout = async () => {
    try {
      // 온라인 상태 업데이트 (로그아웃 시 오프라인으로 설정)
      if (user?.memberId) {
        // 서버 응답을 기다리지만, 실패해도 catch 블록으로 넘어가서 로그아웃은 계속됨
        await updateOnlineStatus(user.memberId, 0);
      }
    } catch (err) {
      // 탈퇴한 유저이거나 서버 장애 시 발생하는 500 에러를 여기서 차단
      console.warn("서버 상태 업데이트 실패(무시됨):", err);
    } finally {
      // 서버 에러 여부와 상관없이 클라이언트의 인증 정보는 무조건 삭제
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  // 회원가입 함수
  const register = async (data) => {
    try {
      await authApi.register(data);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data || "회원가입 실패" };
    }
  };

  // 유저 정보 업데이트 (채팅 서비스에서 실시간 프로필 변경 시 사용)
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