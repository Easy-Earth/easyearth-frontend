import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import TestPage from "./Test/TestPage";
import QuizPage from "./pages/QuizPage";
import QuestPage from "./pages/QuestPage";
import AttendancePage from "./pages/AttendancePage";

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
        {/* ** 테스트용 퀘스트 페이지 라우트 추가 ** */}
        <Route path="/test/quest" element={<QuestPage />} />
        {/* ** 테스트용 출석 페이지 라우트 추가 ** */}
        <Route path="/test/attendance" element={<AttendancePage />} />
      </Routes>
    </Router>
  );
}

export default App;
