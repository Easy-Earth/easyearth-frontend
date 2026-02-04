// src/App.jsx
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

import { PrivateRoute, PublicRoute } from "./router/PrivateRouter";

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const openLoginModal = () => setIsLoginOpen(true);
  const closeLoginModal = () => setIsLoginOpen(false);

  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          {/* Header에 모달 제어 함수를 넘겨줍니다 */}
          <Header openLoginModal={openLoginModal} />
          
          <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} />

          <main className="main-content">
            <Routes>
              {/* 누구나 접근 가능 */}
              <Route path="/" element={<MainPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/suggestions" element={<SuggestionPage />} />
              <Route path="/shop" element={<ShopPage />} />
              
              {/* 로그인 안한 사람만 접근 (PublicRoute) */}
              <Route path="/join" element={
                <PublicRoute>
                  <SignupPage />
                </PublicRoute>
              } />

              {/* 로그인한 사람만 접근 (PrivateRoute) */}
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