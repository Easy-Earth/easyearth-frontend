// src/router/PrivateRouter.jsx
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import CustomModal from "../components/common/CustomModal";

export function PrivateRoute({ children, alertLogin = false }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // 모달 상태 관리 (초기값: alertLogin 옵션이 켜져있고 인증 안됐으면 true)
  const [showModal, setShowModal] = useState(alertLogin && !isAuthenticated && !isLoading);

  if (isLoading) return <div>데이터 로딩 중...</div>;

  if (!isAuthenticated) {
    // 1. 알림 모달을 띄워야 하는 경우
    if (alertLogin) {
      return (
        <CustomModal
          isOpen={true} // 항상 열림 상태 유지 (사용자가 확인 누를 때까지)
          type="alert"
          message="로그인이 필요합니다."
          onConfirm={() => {
            // 확인 누르면 메인으로 이동 (로그인 모달 열기 x)
            navigate("/", { replace: true });
          }}
        />
      );
    }
    
    // 2. 알림 없이 바로 리다이렉트
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>로딩 중...</div>;

  // 이미 로그인했다면 메인으로 튕겨냄 (회원가입 페이지 방지)
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}