import { useState } from "react";
import QuizModal from "../../components/main/QuizModal";
import QuestModal from "../../components/main/QuestModal";
import AttendanceModal from "../../components/main/AttendanceModal";
import EcoTreeModal from "../../components/main/EcoTreeModal";
import styles from "./MainPage.module.css";

function MainPage() {
    const [modalType, setModalType] = useState(null); // 'quiz', 'quest', 'attendance', 'ecotree', null

    const openModal = (type) => setModalType(type);
    const closeModal = () => setModalType(null);

    return (
        <div className={styles.container}>
            {/* ── Hero ── */}
            <div className={styles.hero}>
                <h1>🌍 EasyEarth</h1>
                <p>왼쪽 탭을 클릭하여 참여해보세요!</p>
            </div>

            {/* ── Sidebar Tabs ── */}
            <aside className={styles.sidebar}>
                <div className={styles.tab} onClick={() => openModal("quiz")}>
                    <span className={styles.icon}>📝</span> 퀴즈
                </div>
                <div className={styles.tab} onClick={() => openModal("quest")}>
                    <span className={styles.icon}>🌱</span> 퀘스트
                </div>
                <div className={styles.tab} onClick={() => openModal("attendance")}>
                    <span className={styles.icon}>📅</span> 출석
                </div>
                <div className={styles.tab} onClick={() => openModal("ecotree")}>
                    <span className={styles.icon}>🌲</span> 에코트리
                </div>
            </aside>

            {/* ── Modals ── */}
            <QuizModal
                isOpen={modalType === "quiz"}
                onClose={closeModal}
            />
            <QuestModal
                isOpen={modalType === "quest"}
                onClose={closeModal}
            />
            <AttendanceModal
                isOpen={modalType === "attendance"}
                onClose={closeModal}
            />
            <EcoTreeModal
                isOpen={modalType === "ecotree"}
                onClose={closeModal}
            />
        </div>
    );
}

export default MainPage;