import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import MyPage from "../pages/MyPage/MyPage";
import MapPage from "../pages/MapPage/MapPage";

const AppRouter = () => {
  return (
    <Routes>

            {/* 메인 */}
            <Route path="/" element={<Home/>}></Route>
            {/* 인증  */}
            <Route path="/member" element={
                 <PublicRoute>
                    <RegisterPage/>
                 </PublicRoute>
                }/>
            <Route path="/mypage" element={
                        <PrivateRoute>
                            <MyPage/>
                        </PrivateRoute>
                        }/>
            <Route path="/api/seoul" element={<MapPage/>}></Route>
            

        </Routes>
  );
};

export default AppRouter;
