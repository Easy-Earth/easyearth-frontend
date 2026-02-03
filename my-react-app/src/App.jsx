import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import "./App.css";
import Header from "./components/layout/Header";
import CommunityPage from "./pages/CommunityPage/CommunityPage";
import MainPage from './pages/MainPage/MainPage';
import MapPage from "./pages/MapPage/MapPage";
import MyPage from "./pages/MyPage/MyPage";
import ShopPage from "./pages/ShopPage/ShopPage";
import SignupPage from "./pages/SignupPage/SignupPage";
import SuggestionPage from "./pages/SuggestionPage/SuggestionPage";
function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/suggestions" element={<SuggestionPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </main>
        
      </div>
    </Router>
  );
}

export default App;