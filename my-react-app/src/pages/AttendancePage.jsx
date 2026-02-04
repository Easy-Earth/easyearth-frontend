import React, { useState, useEffect } from "react";
import "./AttendancePage.css";

const AttendancePage = () => {
    const [attendanceList, setAttendanceList] = useState([]);
    const [consecutiveDays, setConsecutiveDays] = useState(0);
    const [todayPoints, setTodayPoints] = useState(0);
    const [isCheckedToday, setIsCheckedToday] = useState(false);
    const [loading, setLoading] = useState(false);

    // 테스트용 유저 ID (실제 로그인 연동 필요)
    const TEST_USER_ID = 1;

    useEffect(() => {
        fetchAttendanceData();
    }, []);

    const fetchAttendanceData = async () => {
        try {
            const response = await fetch(`/attendance/list?userId=${TEST_USER_ID}`);
            if (response.ok) {
                const data = await response.json();
                setAttendanceList(data);
                calculateStats(data);
            }
        } catch (error) {
            console.error("출석 데이터 로딩 실패:", error);
        }
    };

    const calculateStats = (data) => {
        const today = new Date().toISOString().split("T")[0];
        const todayRecord = data.find(
            (item) => new Date(item.attendanceDate).toISOString().split("T")[0] === today
        );

        if (todayRecord) {
            setIsCheckedToday(true);
            setTodayPoints(todayRecord.pointsEarned);
            setConsecutiveDays(todayRecord.consecutiveDays);
        } else {
            setIsCheckedToday(false);
            // 가장 최근 기록 찾아서 연속 일수 표시 (단, 어제 기록 없으면 0 or 1일차 예정 등 표시 필요)
            // 여기서는 심플하게 최근 기록의 연속일수를 보여주거나 0으로 처리
            if (data.length > 0) {
                const last = data[data.length - 1]; // 날짜순 정렬 가정
                setConsecutiveDays(last.consecutiveDays);
            } else {
                setConsecutiveDays(0);
            }
        }
    };

    const handleCheckAttendance = async () => {
        setLoading(true);
        try {
            // POST 요청 시 쿼리 파라미터로 보냄 (컨트롤러 @RequestParam userId)
            const response = await fetch(`/attendance/check?userId=${TEST_USER_ID}`, {
                method: "POST",
            });

            const result = await response.json();

            if (response.ok && result.status === "success") {
                alert(result.message);
                fetchAttendanceData(); // 데이터 갱신
            } else {
                alert(result.message || "출석 체크 실패");
            }
        } catch (error) {
            console.error("출석 체크 에러:", error);
            alert("서버 연결에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 달력 생성 로직
    const renderCalendar = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-indexed

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];

        // 빈 칸 (지난 달)
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // 이번 달 날짜
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isAttended = attendanceList.some(item => {
                // DB Date 포맷이 다를 수 있으므로 앞부분만 비교
                return item.attendanceDate && item.attendanceDate.startsWith(currentDateStr);
            });
            const isToday = day === today.getDate();

            days.push(
                <div key={day} className={`calendar-day ${isAttended ? 'attended' : ''} ${isToday ? 'today' : ''}`}>
                    <span>{day}</span>
                    {isAttended && <span className="stamp">🌱</span>}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="attendance-container">
            <div className="intro-section">
                <h2>🌿 매일매일 출석체크</h2>
                <p>환경을 지키는 작은 습관, 이지에어스와 함께해요!</p>

                <div className="status-card">
                    현재 연속 <strong>{consecutiveDays}일</strong> 출석 중!
                    {isCheckedToday && <span style={{ marginLeft: '10px' }}>오늘 획득: <span className="point-highlight">+{todayPoints}P</span></span>}
                </div>
            </div>

            <div className="calendar-section">
                <div className="calendar-header">
                    <h3>{new Date().getFullYear()}년 {new Date().getMonth() + 1}월</h3>
                </div>
                <div className="calendar-grid">
                    <div className="day-name">일</div>
                    <div className="day-name">월</div>
                    <div className="day-name">화</div>
                    <div className="day-name">수</div>
                    <div className="day-name">목</div>
                    <div className="day-name">금</div>
                    <div className="day-name">토</div>
                    {renderCalendar()}
                </div>

                <button
                    className="check-btn"
                    onClick={handleCheckAttendance}
                    disabled={isCheckedToday || loading}
                >
                    {loading ? "처리 중..." : isCheckedToday ? "오늘 출석 완료! ✅" : "출석 체크하고 포인트 받기 🎁"}
                </button>
            </div>

            <div className="rules-section">
                <h4>📢 포인트 지급 안내</h4>
                <p>1일 ~ 5일: <strong>100P</strong></p>
                <p>6일 ~ 계속: <strong>150P</strong></p>
                <p>15일 연속 개근: <strong>+250P</strong> 보너스!</p>
                <p>30일 연속 개근: <strong>+500P</strong> 보너스!</p>
                <p>※ 연속 출석이 끊기면 다시 1일(100P)부터 시작됩니다.</p>
            </div>
        </div>
    );
};

export default AttendancePage;
