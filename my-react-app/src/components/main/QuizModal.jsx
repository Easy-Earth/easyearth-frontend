import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { getQuizByDifficulty, saveQuizResult } from "../../apis/quizApi";
import styles from "./QuizModal.module.css";

const QuizModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState("difficulty"); // difficulty, loading, quiz, result
    const [quizzes, setQuizzes] = useState([]);
    const [difficulty, setDifficulty] = useState(""); // Easy, Normal, Hard
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [picks, setPicks] = useState([]); // Verified answers
    const [selectedPicks, setSelectedPicks] = useState([]); // Selected but not verified
    const [verifiedStatus, setVerifiedStatus] = useState([]); // boolean array

    useEffect(() => {
        if (isOpen) {
            resetQuiz();
        }
    }, [isOpen]);

    const resetQuiz = () => {
        setStep("difficulty");
        setQuizzes([]);
        setDifficulty("");
        setCurrentIndex(0);
        setScore(0);
        setPicks([]);
        setSelectedPicks([]);
        setVerifiedStatus([]);
    };

    const handleStartQuiz = async (diff) => {
        setStep("loading");
        try {
            const data = await getQuizByDifficulty(diff);
            setQuizzes(data);
            setDifficulty(diff);
            setPicks(new Array(data.length).fill(null));
            setSelectedPicks(new Array(data.length).fill(null));
            setVerifiedStatus(new Array(data.length).fill(false));
            setStep("quiz");
        } catch (error) {
            console.error("Failed to load quiz", error);
            alert("퀴즈 로딩 실패");
            setStep("difficulty");
        }
    };

    const handlePick = (selection) => {
        // If already verified, clicking doesn't change anything
        if (verifiedStatus[currentIndex]) return;

        const newSelectedPicks = [...selectedPicks];
        newSelectedPicks[currentIndex] = selection;
        setSelectedPicks(newSelectedPicks);
    };

    const handleVerify = () => {
        const selection = selectedPicks[currentIndex];
        if (selection === null || verifiedStatus[currentIndex]) return;

        const newVerifiedStatus = [...verifiedStatus];
        newVerifiedStatus[currentIndex] = true;
        setVerifiedStatus(newVerifiedStatus);

        const newPicks = [...picks];
        newPicks[currentIndex] = selection;
        setPicks(newPicks);

        const quiz = quizzes[currentIndex];
        if (selection === quiz.quizAnswer) {
            setScore(score + quiz.point);
        }
    };


    const handleNext = async () => {
        if (currentIndex < quizzes.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            // 퀴즈 종료 시 결과 저장
            try {
                const userStr = localStorage.getItem("user");
                const user = userStr ? JSON.parse(userStr) : null;
                const userId = user?.memberId || 1;

                await saveQuizResult(userId, difficulty, score);
            } catch (error) {
                console.error("Failed to save quiz result", error);
            }
            setStep("result");
        }
    };

    const currentQuiz = quizzes[currentIndex];
    const isCurrentVerified = verifiedStatus[currentIndex];
    const currentSelected = selectedPicks[currentIndex];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📝 환경 퀴즈">
            {step === "difficulty" && (
                <div className={styles.body}>
                    <p style={{ marginBottom: "14px", color: "#555", fontWeight: "600" }}>
                        난이도를 선택하세요
                    </p>
                    <div className={styles.diffRow}>
                        <div className={`${styles.diffBtn} ${styles.easy}`} onClick={() => handleStartQuiz("Easy")}>
                            <span className={styles.dLabel}>🟢 Easy</span>
                            <span className={styles.dPt}>10P / 문제</span>
                        </div>
                        <div className={`${styles.diffBtn} ${styles.normal}`} onClick={() => handleStartQuiz("Normal")}>
                            <span className={styles.dLabel}>🟠 Normal</span>
                            <span className={styles.dPt}>20P / 문제</span>
                        </div>
                        <div className={`${styles.diffBtn} ${styles.hard}`} onClick={() => handleStartQuiz("Hard")}>
                            <span className={styles.dLabel}>🔴 Hard</span>
                            <span className={styles.dPt}>50P / 문제</span>
                        </div>
                    </div>
                </div>
            )}

            {step === "loading" && (
                <div className={styles.spinner}></div>
            )}

            {step === "quiz" && currentQuiz && (
                <div className={styles.body}>
                    <div className={styles.quizProgRow}>
                        <div className={styles.quizProg}>
                            {currentIndex + 1} / {quizzes.length} &nbsp;·&nbsp; 점수: {score}P
                        </div>
                        <div className={styles.progDots}>
                            {verifiedStatus.map((v, i) => (
                                <span
                                    key={i}
                                    className={`${styles.dot} ${v ? styles.dotDone : ""} ${currentIndex === i ? styles.dotActive : ""}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className={styles.quizQ}>{currentQuiz.quizQuestion}</div>
                    <div className={styles.options}>
                        {[currentQuiz.option1, currentQuiz.option2, currentQuiz.option3, currentQuiz.option4].map((text, i) => {
                            const optionNumber = i + 1;
                            const isSelected = currentSelected === optionNumber;
                            const isCorrectAtVerification = currentQuiz.quizAnswer === optionNumber;

                            let optionClass = styles.option;

                            if (isCurrentVerified) {
                                if (isCorrectAtVerification) optionClass += ` ${styles.correct}`;
                                else if (isSelected) optionClass += ` ${styles.wrong}`;
                                optionClass += ` ${styles.disabled}`;
                            } else if (isSelected) {
                                optionClass += ` ${styles.selected}`;
                            }

                            return (
                                <div key={i} className={optionClass} onClick={() => handlePick(optionNumber)}>
                                    {optionNumber}. {text}
                                </div>
                            );
                        })}
                    </div>

                    {isCurrentVerified && (
                        <div className={styles.expl}>💡 {currentQuiz.quizExplanation}</div>
                    )}

                    <div className={styles.navRow}>
                        {!isCurrentVerified ? (
                            <button
                                className={`${styles.btn} ${styles.btnBlue}`}
                                onClick={handleVerify}
                                disabled={currentSelected === null}
                            >
                                정답 확인
                            </button>
                        ) : (
                            <button
                                className={`${styles.btn} ${styles.btnGreen}`}
                                onClick={handleNext}
                            >
                                {currentIndex === quizzes.length - 1 ? "결과 보기" : "다음 →"}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {step === "result" && (
                <div className={styles.resultBox}>
                    <div style={{ fontSize: "3.2rem" }}>🎉</div>
                    <div className={styles.bigScore}>{score}P</div>
                    <div className={styles.sub}>획득 포인트 (최대 {quizzes.reduce((s, q) => s + q.point, 0)}P)</div>
                    <div className={styles.sub} style={{ marginTop: "6px" }}>
                        <strong style={{ color: "#1b5e40" }}>
                            {quizzes.filter((q, i) => verifiedStatus[i] && picks[i] === q.quizAnswer).length}문제
                        </strong>{" "}
                        정답 / {quizzes.length}문제
                    </div>
                    <div className={styles.resultBtns}>
                        <button className={`${styles.btn} ${styles.btnGreen}`} onClick={resetQuiz}>
                            다시 시작
                        </button>
                        <button className={`${styles.btn} ${styles.btnOutline}`} onClick={onClose}>
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default QuizModal;
