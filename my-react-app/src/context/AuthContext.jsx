// src/context/AuthContext.js
import { createContext, useState, useEffect, useContext } from "react";
import authApi from "../apis/authApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) setUser(JSON.parse(savedUser));
    setIsLoading(false);
  }, []);

  const isAuthenticated = !!user;

  const login = async ({ loginId, password }) => {
    try {
      const res = await authApi.login({ loginId, password });
      const { token, user } = res;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data || "로그인 실패" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const register = async (data) => {
    try {
      await authApi.register(data);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data || "회원가입 실패" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
