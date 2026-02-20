import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { getQuizByDifficulty, saveQuizAttempt, getQuizStatus } from "../../apis/quizApi";
import { useAuth } from "../../context/AuthContext";
import styles from "./QuizModal.module.css";

const QuizModal = ({ isOpen, onClose }) => {
    const { user, isLoading } = useAuth();
    const [step, setStep] = useState("difficulty"); // difficulty, loading, quiz, result
    const [quizzes, setQuizzes] = useState([]);
    const [difficulty, setDifficulty] = useState(""); // Easy, Normal, Hard
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [picks, setPicks] = useState([]); // Verified answers
    const [selectedPicks, setSelectedPicks] = useState([]); // Selected but not verified
    const [verifiedStatus, setVerifiedStatus] = useState([]); // boolean array
    const [quizStatus, setQuizStatus] = useState({ Easy: true, Normal: true, Hard: true }); // Default true

    useEffect(() => {
        if (isOpen) {
            resetQuiz();
            if (user?.memberId) {
                checkStatus(user.memberId);
            }
        }
    }, [isOpen, user?.memberId]);

    const checkStatus = async (userId) => {
        try {
            const status = await getQuizStatus(userId);
            setQuizStatus(status);
        } catch (error) {
            console.error("Failed to load quiz status", error);
        }
    };

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
        if (!user || !user.memberId) {
            alert("로그인이 필요한 서비스입니다.");
            return;
        }

        // 이미 비활성화되어 클릭 안 되겠지만, 이중 체크
        if (quizStatus && !quizStatus[diff]) {
            return;
        }

        setStep("loading");
        try {
            // ... (기존 로직)
            const data = await getQuizByDifficulty(diff, user.memberId);

            if (!data || data.length === 0) {
                // 혹시라도 여기서 걸리면 상태 갱신
                checkStatus(user.memberId);
                setStep("difficulty");
                return;
            }

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

    const handlePick = (optionNumber) => {
        if (verifiedStatus[currentIndex]) return; // 이미 검증된 퀴즈는 선택 불가
        const newSelectedPicks = [...selectedPicks];
        newSelectedPicks[currentIndex] = optionNumber;
        setSelectedPicks(newSelectedPicks);
    };

    const handleVerify = async () => {
        if (selectedPicks[currentIndex] === null) return; // 선택된 옵션이 없으면 검증 불가

        const currentQuiz = quizzes[currentIndex];

        // 정답 여부 확인
        const isCorrect = selectedPicks[currentIndex] === currentQuiz.quizAnswer;

        // UI 상태 업데이트 (검증 완료 표시)
        const newVerifiedStatus = [...verifiedStatus];
        newVerifiedStatus[currentIndex] = true;
        setVerifiedStatus(newVerifiedStatus);

        const newPicks = [...picks];
        newPicks[currentIndex] = selectedPicks[currentIndex];
        setPicks(newPicks);

        if (isCorrect) {
            setScore(prevScore => prevScore + currentQuiz.point);
        }

        // API 호출: 결과 저장 (매 문제마다 호출)
        try {
            await saveQuizAttempt(user.memberId, currentQuiz.quizNo, isCorrect, currentQuiz.point);

            // 마지막 문제였다면 전체 상태 재조회 (버튼 비활성화 위해)
            if (currentIndex === quizzes.length - 1) {
                checkStatus(user.memberId);
            }
        } catch (error) {
            console.error("Failed to save quiz attempt", error);
            // 에러가 나도 진행은 계속하도록 함 (사용자 경험 위해)
        }
    };

    const handleNext = () => {
        if (currentIndex < quizzes.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setStep("result");
        }
    };

    const getDisabledStyle = (enabled) => {
        return enabled ? {} : { opacity: 0.4, cursor: "not-allowed", pointerEvents: "none", filter: "grayscale(100%)" };
    };

    const currentQuiz = quizzes[currentIndex];
    const currentSelected = selectedPicks[currentIndex];
    const isCurrentVerified = verifiedStatus[currentIndex];

    if (step === "quiz" && !currentQuiz) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="📝 환경 퀴즈">
                <div style={{ padding: "40px", textAlign: "center" }}>
                    <p>퀴즈 데이터를 불러오지 못했습니다.</p>
                    <button onClick={resetQuiz} style={{ marginTop: "20px", padding: "8px 16px", cursor: "pointer" }}>
                        돌아가기
                    </button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📝 환경 퀴즈">
            {isLoading ? (
                <div className={styles.spinner} style={{ padding: "40px 0" }}></div>
            ) : !user ? (
                <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
                    로그인이 필요한 서비스입니다.
                </p>
            ) : (
                <>
                    {step === "difficulty" && (
                        <div className={styles.body}>
                            <p style={{ marginBottom: "14px", color: "#555", fontWeight: "600" }}>
                                난이도를 선택하세요
                                <span style={{ fontSize: "0.8em", fontWeight: "normal", marginLeft: "8px", color: "#888" }}>
                                    (일일 5문제, 완료 시 비활성화)
                                </span>
                            </p>
                            <div className={styles.diffRow}>
                                <div
                                    className={`${styles.diffBtn} ${styles.easy}`}
                                    onClick={() => quizStatus.Easy && handleStartQuiz("Easy")}
                                    style={getDisabledStyle(quizStatus.Easy)}
                                >
                                    <span className={styles.dLabel}>🟢 Easy</span>
                                    <span className={styles.dPt}>100P / 문제</span>
                                </div>
                                <div
                                    className={`${styles.diffBtn} ${styles.normal}`}
                                    onClick={() => quizStatus.Normal && handleStartQuiz("Normal")}
                                    style={getDisabledStyle(quizStatus.Normal)}
                                >
                                    <span className={styles.dLabel}>🟠 Normal</span>
                                    <span className={styles.dPt}>200P / 문제</span>
                                </div>
                                <div
                                    className={`${styles.diffBtn} ${styles.hard}`}
                                    onClick={() => quizStatus.Hard && handleStartQuiz("Hard")}
                                    style={getDisabledStyle(quizStatus.Hard)}
                                >
                                    <span className={styles.dLabel}>🔴 Hard</span>
                                    <span className={styles.dPt}>300P / 문제</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "loading" && (
                        <div className={styles.spinner} style={{ padding: "40px 0" }}></div>
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
                            <div className={styles.quizHeader}>
                                <span className={styles.qNum}>Q{currentIndex + 1}</span>
                                <span className={styles.qDiff}>{difficulty}</span>
                            </div>
                            <div className={styles.quizContent}>
                                {currentQuiz.quizQuestion}
                            </div>
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
                </>
            )}
        </Modal>
    );
};

export default QuizModal;
