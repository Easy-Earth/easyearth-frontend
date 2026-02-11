import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { getAttendanceList, checkAttendance } from "../../apis/attendanceApi";
import { useAuth } from "../../context/AuthContext";
import styles from "./AttendanceModal.module.css";

const AttendanceModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [attDates, setAttDates] = useState(new Set());
    const [streak, setStreak] = useState(0);
    const [calDate, setCalDate] = useState(new Date()); // For navigating months
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (user?.memberId) {
                loadAttendance();
            } else {
                setLoading(false);
            }
        }
    }, [isOpen, user?.memberId, calDate]);

    const loadAttendance = async () => {
        if (!user?.memberId) return;
        setLoading(true);
        const ym = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, "0")}`;
        try {
            const list = await getAttendanceList(user.memberId, ym);
            const dates = new Set();
            let lastStreak = 0;

            if (Array.isArray(list)) {
                list.forEach((a) => {
                    if (a.attendanceDate) {
                        const d = new Date(a.attendanceDate);
                        if (!isNaN(d.getTime())) {
                            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                                d.getDate()
                            ).padStart(2, "0")}`;
                            dates.add(key);
                            lastStreak = a.consecutiveDays || 0;
                        }
                    }
                });
            }
            setAttDates(dates);
            setStreak(lastStreak);
        } catch (error) {
            console.error("Failed to load attendance", error);
            setMsg({ text: "데이터를 불러오는 데 실패했습니다.", type: "fail" });
        } finally {
            setLoading(false);
        }
    };

    const handleCheck = async () => {
        if (!user?.memberId) return;
        setChecking(true);
        try {
            const res = await checkAttendance(user.memberId);
            if (res.status === "success") {
                setMsg({ text: res.message, type: "ok" });
                loadAttendance();
            } else {
                setMsg({ text: res.message, type: "fail" });
            }
        } catch (error) {
            setMsg({ text: "출석 체크 실패. 다시 시도해주세요.", type: "fail" });
        } finally {
            setChecking(false);
        }
    };

    const changeMonth = (delta) => {
        const newDate = new Date(calDate.getFullYear(), calDate.getMonth() + delta, 1);
        setCalDate(newDate);
    };

    const renderCalendar = () => {
        const headers = ["일", "월", "화", "수", "목", "금", "토"];
        const year = calDate.getFullYear();
        const month = calDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
            today.getDate()
        ).padStart(2, "0")}`;

        const days = [];
        // Padding
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className={styles.calDay}></div>);
        }
        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            let dayClass = styles.calDay;
            if (attDates.has(key)) dayClass += ` ${styles.att}`;
            if (key === todayKey) dayClass += ` ${styles.today}`;
            days.push(
                <div key={d} className={dayClass}>
                    {d}
                </div>
            );
        }

        return (
            <>
                <div className={styles.calGrid}>
                    {headers.map((h) => (
                        <div key={h} className={styles.calHdr}>
                            {h}
                        </div>
                    ))}
                    {days}
                </div>
            </>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📅 출석">
            <div className={styles.attCheckin}>
                <div className={styles.streak}>
                    연속 출석: <em>{streak}일</em>
                </div>
                <button
                    className={`${styles.btn} ${styles.btnGreen}`}
                    onClick={handleCheck}
                    disabled={checking}
                >
                    {checking ? "처리 중…" : "📌 출석 체크"}
                </button>
                <div className={`${styles.attMsg} ${styles[msg.type]}`}>{msg.text}</div>
            </div>

            <div className={styles.calNav}>
                <button onClick={() => changeMonth(-1)}>◀</button>
                <span className={styles.calLabel}>
                    {calDate.getFullYear()}년 {calDate.getMonth() + 1}월
                </span>
                <button onClick={() => changeMonth(1)}>▶</button>
            </div>

            {loading ? (
                <div className={styles.spinner}></div>
            ) : !user ? (
                <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
                    로그인이 필요한 서비스입니다.
                </p>
            ) : (
                renderCalendar()
            )}
        </Modal>
    );
};

export default AttendanceModal;
