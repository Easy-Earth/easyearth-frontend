import "./App.css";
import Header from "./components/layout/Header";
import MapPage from "./pages/MapPage/MapPage";

function App() {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <MapPage />
      </main>
      {/* <Footer /> */}
    </div>
  );
}

export default App;