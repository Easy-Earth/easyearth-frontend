import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import "./App.css";
import Header from "./components/layout/Header";
import LoginModal from "./components/member/LoginModal";

import MainPage from "./pages/MainPage/MainPage";
import CommunityPage from "./pages/CommunityPage/CommunityPage";
import MapPage from "./pages/MapPage/MapPage";
import ShopPage from "./pages/ShopPage/ShopPage";
import MyPage from "./pages/MyPage/MyPage";
import SignupPage from "./pages/SignupPage/SignupPage";
import SuggestionPage from "./pages/SuggestionPage/SuggestionPage";
import QuizPage from "./pages/QuizPage";

import { PrivateRoute, PublicRoute } from "./router/PrivateRouter";
import PasswordFindPage from "./components/member/PasswordFindPage";

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
              <Route path="/suggestions" element={<SuggestionPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/find-password" element={<PasswordFindPage />} />
              <Route path="/test/quiz" element={<QuizPage />} />
              
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
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
