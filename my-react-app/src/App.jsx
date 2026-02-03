import "./App.css";
import MapPage from "./pages/MapPage/MapPage";
// import TestPage from "./pages/TitleBadges";
// import TitleShopTestPage from "./pages/TitleShopTestPage";
function App() {
  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>네이버 지도 테스트</h2>
      <MapPage />
      {/* <TestPage></TestPage> */}
      {/* return <TitleShopTestPage />; */}
    </div>
  );
}

export default App;
