import { useState, useEffect } from "react";

const QuizPage = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [difficulty, setDifficulty] = useState("Easy");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResult, setShowResult] = useState(false);

    const fetchQuizzes = async (diff) => {
        setLoading(true);
        setError(null);
        setShowResult(false);
        setSelectedAnswers({});
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

    const handleOptionClick = (quizNo, optionNo) => {
        if (showResult) return; // 결과 나온 뒤엔 수정 불가
        setSelectedAnswers(prev => ({
            ...prev,
            [quizNo]: optionNo
        }));
    };

    const handleSubmit = () => {
        const unansweredCount = quizzes.filter(q => !selectedAnswers[q.quizNo]).length;
        if (unansweredCount > 0) {
            if (!confirm(`${unansweredCount}문제를 풀지 않았습니다. 그래도 채점하시겠습니까?`)) return;
        }
        setShowResult(true);
    };

    const getOptionLabel = (index) => String.fromCharCode(65 + index); // 0->A, 1->B ...
    const getDifficultyButtonStyle = (level) => {
        const isActive = difficulty === level;
        return {
            marginRight: level !== "Hard" ? "10px" : undefined,
            padding: "8px 16px",
            borderRadius: "6px",
            border: isActive ? "2px solid #007bff" : "1px solid #ddd",
            backgroundColor: isActive ? "#e7f1ff" : "#fff",
            color: isActive ? "#0056b3" : "#333",
            fontWeight: isActive ? "600" : "400",
            cursor: "pointer"
        };
    };

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
            <h2>퀴즈 테스트 페이지 (난이도: {difficulty})</h2>

            <div style={{ marginBottom: "20px" }}>
                <button onClick={() => setDifficulty("Easy")} style={getDifficultyButtonStyle("Easy")}>Easy</button>
                <button onClick={() => setDifficulty("Normal")} style={getDifficultyButtonStyle("Normal")}>Normal</button>
                <button onClick={() => setDifficulty("Hard")} style={getDifficultyButtonStyle("Hard")}>Hard</button>
            </div>

            {loading && <p>로딩 중...</p>}
            {error && <p style={{ color: "red" }}>에러: {error}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                {quizzes.map((quiz) => {
                    const myAnswer = selectedAnswers[quiz.quizNo];
                    const isCorrect = myAnswer === quiz.quizAnswer;

                    return (
                        <div key={quiz.quizNo} style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", backgroundColor: "#fff" }}>
                            <h4>Q{quiz.quizNo}. {quiz.quizQuestion} (점수: {quiz.point})</h4>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "15px 0" }}>
                                {[quiz.option1, quiz.option2, quiz.option3, quiz.option4].map((opt, idx) => {
                                    const optionNo = idx + 1;
                                    let bgColor = "#f8f9fa";

                                    // 선택한 보기 표시
                                    if (myAnswer === optionNo) bgColor = "#e2e6ea";

                                    // 결과 결과 표시
                                    if (showResult) {
                                        if (quiz.quizAnswer === optionNo) bgColor = "#d4edda"; // 정답은 초록
                                        else if (myAnswer === optionNo && myAnswer !== quiz.quizAnswer) bgColor = "#f8d7da"; // 내가 틀린 답은 빨강
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleOptionClick(quiz.quizNo, optionNo)}
                                            style={{
                                                backgroundColor: bgColor,
                                                padding: "12px",
                                                borderRadius: "5px",
                                                cursor: showResult ? "default" : "pointer",
                                                border: myAnswer === optionNo ? "2px solid #007bff" : "1px solid #ddd"
                                            }}
                                        >
                                            {getOptionLabel(idx)}. {opt}
                                        </div>
                                    );
                                })}
                            </div>

                            {showResult && (
                                <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f1f1f1", borderRadius: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: isCorrect ? "green" : "red" }}>
                                        {isCorrect ? "⭕ 정답입니다!" : `❌ 오답입니다. (정답: ${getOptionLabel(quiz.quizAnswer - 1)})`}
                                    </p>
                                    <p style={{ color: "blue", fontSize: "0.9em", marginTop: "5px" }}>▶ 해설: {quiz.quizExplanation}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {!loading && quizzes.length > 0 && !showResult && (
                <div style={{ marginTop: "30px", textAlign: "center" }}>
                    <button
                        onClick={handleSubmit}
                        style={{
                            padding: "15px 40px",
                            fontSize: "1.2em",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer"
                        }}
                    >
                        채점하기
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuizPage;
