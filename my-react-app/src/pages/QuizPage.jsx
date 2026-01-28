import { useState, useEffect } from "react";

const QuizPage = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [difficulty, setDifficulty] = useState("Easy");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchQuizzes = async (diff) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/quiz/${diff}`);
            if (!response.ok) {
                throw new Error("네트워크 응답이 올바르지 않습니다.");
            }
            const data = await response.json();
            setQuizzes(data);
        } catch (err) {
            setError(err.message);
            setQuizzes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes(difficulty);
    }, [difficulty]);

    return (
        <div style={{ padding: "20px" }}>
            <h2>퀴즈 테스트 페이지 (난이도: {difficulty})</h2>

            <div style={{ marginBottom: "20px" }}>
                <button onClick={() => setDifficulty("Easy")} style={{ marginRight: "10px" }}>Easy</button>
                <button onClick={() => setDifficulty("Normal")} style={{ marginRight: "10px" }}>Normal</button>
                <button onClick={() => setDifficulty("Hard")}>Hard</button>
            </div>

            {loading && <p>로딩 중...</p>}
            {error && <p style={{ color: "red" }}>에러: {error}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {quizzes.map((quiz) => (
                    <div key={quiz.quizNo} style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px" }}>
                        <h4>Q{quiz.quizNo}. {quiz.quizQuestion} (점수: {quiz.point})</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "10px 0" }}>
                            <div style={{ backgroundColor: quiz.quizAnswer === 1 ? "#d4edda" : "#f8f9fa", padding: "8px" }}>① {quiz.option1}</div>
                            <div style={{ backgroundColor: quiz.quizAnswer === 2 ? "#d4edda" : "#f8f9fa", padding: "8px" }}>② {quiz.option2}</div>
                            <div style={{ backgroundColor: quiz.quizAnswer === 3 ? "#d4edda" : "#f8f9fa", padding: "8px" }}>③ {quiz.option3}</div>
                            <div style={{ backgroundColor: quiz.quizAnswer === 4 ? "#d4edda" : "#f8f9fa", padding: "8px" }}>④ {quiz.option4}</div>
                        </div>
                        <p style={{ color: "blue", fontSize: "0.9em" }}>▶ 해설: {quiz.quizExplanation}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuizPage;
