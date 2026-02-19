import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import "./App.css";
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
// 채팅 관련 Import
import { ChatProvider } from "./context/ChatContext";
import { NotificationProvider } from "./context/NotificationContext";
import ChatJoinPage from "./pages/ChatPage/ChatJoinPage";
import ChatPage from "./pages/ChatPage/ChatPage";
import CommunityDetailPage from "./pages/CommunityPage/CommunityDetailPage";
import InquiriesPage from "./pages/InquiriesPage/InquiriesPage";
import InquiriesDetailPage from "./pages/InquiriesPage/InquiriesDetailPage";

// 🚀 수정된 모달 관리자: 네비게이션 state를 감시하고 즉시 비웁니다.
const ModalManager = ({ openLoginModal }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. state에 openLogin이 true인지 확인
    if (location.state?.openLogin) {
      // 2. 부모의 모달 열기 함수 실행
      openLoginModal();
      
      // 💡 3. 핵심 수정: navigate를 사용하여 현재 경로의 state를 비워버립니다.
      // 이렇게 해야 로그인 후 재렌더링될 때 useEffect가 다시 돌아도 
      // location.state.openLogin이 없어 모달이 다시 열리지 않습니다.
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, openLoginModal, navigate]);

  return null;
};

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const openLoginModal = () => setIsLoginOpen(true);
  const closeLoginModal = () => setIsLoginOpen(false);

  return (
    <AuthProvider>
      <NotificationProvider>
        <ChatProvider>
          <Router>
            {/* Router 내부에 위치해야 useLocation과 useNavigate를 사용할 수 있습니다 */}
            <ModalManager openLoginModal={openLoginModal} />
            
            <div className="app-container">
              <Header openLoginModal={openLoginModal} />
              
              {/* 로그인 성공 시 내부에서 호출하는 onClose가 closeLoginModal(false)을 실행합니다 */}
              <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} />

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

                  {/* 채팅 관련 라우트 */}
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