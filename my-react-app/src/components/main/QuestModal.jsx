import { useState, useEffect, useRef } from "react";
import Modal from "../common/Modal";
import { getDailyQuests, certifyQuest } from "../../apis/questApi";
import { useAuth } from "../../context/AuthContext";
import styles from "./QuestModal.module.css";

const QuestModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [submittedQuests, setSubmittedQuests] = useState({}); // questNo -> true
    const fileInputRefs = useRef({});

    useEffect(() => {
        if (isOpen) {
            loadQuests();
        }
    }, [isOpen, user?.memberId]);

    const loadQuests = async () => {
        if (!user?.memberId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await getDailyQuests(user.memberId);
            setQuests(data);

            const initialSubmitted = {};
            data.forEach(q => {
                if (q.completed) {
                    initialSubmitted[q.questNo] = true;
                }
            });
            setSubmittedQuests(initialSubmitted);

        } catch (error) {
            console.error("Failed to load quests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerFile = (questNo) => {
        if (!user?.memberId) return;
        if (submittedQuests[questNo]) return;
        fileInputRefs.current[questNo]?.click();
    };

    const handleUploadFile = async (questNo, event) => {
        const file = event.target.files[0];
        if (!file || !user?.memberId) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const resultMsg = await certifyQuest(questNo, user.memberId, formData);
            setSubmittedQuests((prev) => ({ ...prev, [questNo]: true }));
            setMsg({ text: resultMsg, type: "ok" });
        } catch (error) {
            const errorMsg = error.response?.data || "업로드 실패. 다시 시도해주세요.";
            setMsg({ text: errorMsg, type: "fail" });
        }
        event.target.value = ""; // reset
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="🌱 데일리 퀘스트">
            {loading ? (
                <div className={styles.spinner}></div>
            ) : !user ? (
                <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
                    로그인이 필요한 서비스입니다.
                </p>
            ) : quests.length === 0 ? (
                <p style={{ textAlign: "center", color: "#999", padding: "28px 0" }}>
                    오늘의 퀘스트가 없습니다.
                </p>
            ) : (
                <div className={styles.body}>
                    <div className={styles.questList}>
                        {quests.map((q) => (
                            <div key={q.questNo} className={styles.questCard}>
                                <div>
                                    <h4>{q.questTitle}</h4>
                                    <div className={styles.questMeta}>
                                        카테고리: {q.category || "-"}{" "}
                                        <span className={styles.ptBadge}>10P</span>
                                    </div>
                                </div>
                                <button
                                    className={`${styles.btnCertify} ${submittedQuests[q.questNo] ? styles.done : ""
                                        }`}
                                    onClick={() => handleTriggerFile(q.questNo)}
                                >
                                    {submittedQuests[q.questNo] ? "완료" : "인증"}
                                </button>
                                <input
                                    type="file"
                                    style={{ display: "none" }}
                                    ref={(el) => (fileInputRefs.current[q.questNo] = el)}
                                    accept="image/*"
                                    onChange={(e) => handleUploadFile(q.questNo, e)}
                                />
                            </div>
                        ))}
                    </div>
                    {msg.text && (
                        <div className={`${styles.questMsg} ${styles[msg.type]}`}>
                            {msg.text}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default QuestModal;
