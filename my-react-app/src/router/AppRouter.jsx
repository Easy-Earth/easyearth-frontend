// src/router/AppRouter.jsx
import { Routes, Route } from "react-router-dom";
import MainPage from "../pages/MainPage/MainPage";
import SignupPage from "../pages/SignupPage/SignupPage";
import MapPage from "../pages/MapPage/MapPage";
import CommunityPage from "../pages/CommunityPage/CommunityPage";
import SuggestionPage from "../pages/SuggestionPage/SuggestionPage";
import ShopPage from "../pages/ShopPage/ShopPage";
import MyPage from "../pages/MyPage/MyPage";
import DashboardPage from "../pages/DashboardPage";

import { PrivateRoute, PublicRoute } from "./PrivateRouter";

function AppRouter() {
  return (
    <Routes>
      {/* 1. 공통 페이지: 누구나 접근 가능 */}
      <Route path="/" element={<MainPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/suggestions" element={<SuggestionPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/find-password" element={<PasswordFindPage />} />

      {/* 2. 로그인 안 한 유저만 접근 가능 (회원가입/로그인 등) */}
      <Route
        path="/join"
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />

      {/* 3. 로그인한 유저만 접근 가능 (마이페이지/대시보드 등) */}
      <Route
        path="/mypage"
        element={
          <PrivateRoute>
            <MyPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />

      {/* 4. 404 페이지 (선택사항) */}
      <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
    </Routes>
  );
}

export default AppRouter;