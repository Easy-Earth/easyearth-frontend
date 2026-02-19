import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import "./App.css";
import CustomModal from "./components/common/CustomModal"; // 추가됨
import Header from "./components/layout/Header";
import LoginModal from "./components/member/LoginModal";

import CommunityPage from "./pages/CommunityPage/CommunityPage";
import MainPage from "./pages/MainPage/MainPage";
import MapPage from "./pages/MapPage/MapPage";
import MyPage from "./pages/MyPage/MyPage";
import ShopPage from "./pages/ShopPage/ShopPage";
import SignupPage from "./pages/SignupPage/SignupPage";

import PasswordFindPage from "./components/member/PasswordFindPage";
import KakaoCallback from "./pages/Auth/KakaoCallback";
import InventoryPage from "./pages/InventoryPage/InventoryPage";
import { PrivateRoute, PublicRoute } from "./router/PrivateRouter";

import { ChatProvider } from "./context/ChatContext";
import { NotificationProvider } from "./context/NotificationContext";
import ChatJoinPage from "./pages/ChatPage/ChatJoinPage";
import ChatPage from "./pages/ChatPage/ChatPage";
import CommunityDetailPage from "./pages/CommunityPage/CommunityDetailPage";
import InquiriesPage from "./pages/InquiriesPage/InquiriesPage";
import InquiriesDetailPage from "./pages/InquiriesPage/InquiriesDetailPage";

// 🚀 수정된 모달 관리자: 네비게이션 state를 감시하고 즉시 비웁니다.
import NotFoundPage from "./pages/NotFound/NotFoundPage";
// 모달 관리자
const ModalManager = ({ openLoginModal }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openLogin) {
      openLoginModal();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, openLoginModal, navigate]);

  return null;
};

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // 시큐리티 에러 모달 상태 추가
  const [securityModal, setSecurityModal] = useState({
    isOpen: false,
    message: ""
  });

  const openLoginModal = () => setIsLoginOpen(true);
  const closeLoginModal = () => setIsLoginOpen(false);

  // 전역 시큐리티 에러 감시 (api.js에서 보낸 신호를 받음)
  useEffect(() => {
    const handleSecurityError = (e) => {
      setSecurityModal({
        isOpen: true,
        message: e.detail.message
      });
    };

    window.addEventListener("security-error", handleSecurityError);
    return () => window.removeEventListener("security-error", handleSecurityError);
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <ChatProvider>
          <Router>
            <ModalManager openLoginModal={openLoginModal} />
            
            <div className="app-container">
              <Header openLoginModal={openLoginModal} />
              <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} />

              {/* 시큐리티 차단 알림 모달 */}
              <CustomModal
                isOpen={securityModal.isOpen}
                type="alert"
                message={securityModal.message}
                onConfirm={() => {
                  setSecurityModal({ isOpen: false, message: "" });
                  // 403 발생 시 이전 페이지로 강제 리다이렉트
                  window.history.back();
                }}
              />

              <main className="main-content">
                <Routes>
                  <Route path="/" element={<MainPage />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/community/detail/:postId" element={<CommunityDetailPage />} />
                  <Route path="/inquiries" element={<InquiriesPage />} />
                  <Route path="/inquiries/detail/:inquiriesId" element={<InquiriesDetailPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/find-password" element={<PasswordFindPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  
                  <Route path="/join" element={
                    <PublicRoute>
                      <SignupPage />
                    </PublicRoute>
                  } />

                  <Route path="/mypage" element={
                    <PrivateRoute>
                      <MyPage />
                    </PrivateRoute>
                  } />

                  <Route path="/chat" element={
                    <PrivateRoute>
                      <ChatPage />
                    </PrivateRoute>
                  } />
                  <Route path="/chat/:roomId" element={
                    <PrivateRoute>
                      <ChatPage />
                    </PrivateRoute>
                  } />
                  <Route path="/chat/join/:roomId" element={
                    <PrivateRoute>
                      <ChatJoinPage />
                    </PrivateRoute>
                  } />
                  <Route path="/kakao/callback" element={<KakaoCallback />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
            </div>
          </Router>
        </ChatProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;