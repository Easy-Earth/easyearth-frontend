// src/context/AuthContext.js
import { createContext, useState, useEffect, useContext } from "react";
import authApi from "../apis/authApi";
import { updateOnlineStatus } from "../apis/chatApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  //로컬 스토리지에 토큰과 유저 정보가 있다면 해당 정보로 로그인
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) setUser(JSON.parse(savedUser));
    setIsLoading(false);
  }, []);

  const isAuthenticated = !!user;

  //로그인 함수
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

  //로그아웃 함수
  const logout = async () => {
    // 온라인 상태 업데이트 (로그아웃 시 오프라인으로 설정)
    if (user?.memberId) {
      try {
        await updateOnlineStatus(user.memberId, 0);
      } catch (err) {
        console.error("온라인 상태 업데이트 실패", err);
      }
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  //회원가입 함수
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
