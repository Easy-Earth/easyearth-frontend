import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Store from "../pages/Store";
import MyItems from "../pages/MyItems";
import RandomPull from "../pages/RandomPull";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <div>
        <h1>EasyEarth 상점</h1>

        <nav style={{ marginBottom: "20px" }}>
          <Link to="/">상점</Link> |{" "}
          <Link to="/my">내 아이템</Link> |{" "}
          <Link to="/random">랜덤뽑기</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Store />} />
          <Route path="/my" element={<MyItems />} />
          <Route path="/random" element={<RandomPull />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default AppRouter;
