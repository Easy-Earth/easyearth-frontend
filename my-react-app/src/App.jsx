import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import TestPage from "./Test/TestPage";
import QuizPage from "./pages/QuizPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div>
            <h1>메인 페이지</h1>
            <TestPage />
          </div>
        } />
        {/* ** 테스트용 퀴즈 페이지 라우트 추가 ** */}
        <Route path="/test/quiz" element={<QuizPage />} />
      </Routes>
    </Router>
  );
}

export default App;
