// src/router/AppRouter.jsx
import { Route, Routes } from "react-router-dom";
import CommunityPage from "../pages/CommunityPage/CommunityPage";
import DashboardPage from "../pages/DashboardPage";
import MainPage from "../pages/MainPage/MainPage";
import MapPage from "../pages/MapPage/MapPage";
import MyPage from "../pages/MyPage/MyPage";
import ShopPage from "../pages/ShopPage/ShopPage";
import SignupPage from "../pages/SignupPage/SignupPage";

import { PrivateRoute, PublicRoute } from "./PrivateRouter";
import InventoryPage from "../pages/InventoryPage/InventoryPage";
import CommunityDetailPage from "../pages/CommunityPage/CommunityDetailPage";
import InquiriesPage from "../pages/InquiriesPage/InquiriesPage";
import InquiriesDetailPage from "../pages/InquiriesPage/InquiriesDetailPage";

function AppRouter() {
  return (
    <Routes>
      {/* 1. 공통 페이지: 누구나 접근 가능 */}
      <Route path="/" element={<MainPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/community/detail/:postId" element={<CommunityDetailPage />} />
      <Route path="/inquiries" element={<InquiriesPage />} />
      <Route path="/inquiries/detail/:inquiriesId" element={<InquiriesDetailPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/find-password" element={<PasswordFindPage />} />
      <Route path="/inventory" element={<InventoryPage />} />

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