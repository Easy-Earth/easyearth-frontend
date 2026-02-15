import { useEffect, useMemo, useState } from "react";
import { weatherApi } from "../../apis/weather";
import AttendanceModal from "../../components/main/AttendanceModal";
import EcoCalendar from "../../components/main/EcoCalendar";
import QuestModal from "../../components/main/QuestModal";
import QuizModal from "../../components/main/QuizModal";
import { ECO_DAYS } from "../../utils/ecoDays";
import styles from "./MainPage.module.css";

function MainPage() {
    const [modalType, setModalType] = useState(null);
    const [weather, setWeather] = useState(null);
    const [weatherList, setWeatherList] = useState([]);
    const [secretaryMsg, setSecretaryMsg] = useState("");
    const [loading, setLoading] = useState(true);

    const openModal = (type) => setModalType(type);
    const closeModal = () => setModalType(null);

    const ecoInfo = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const todayMonth = now.getMonth() + 1;
        const todayDate = now.getDate();

        const todayEvent = ECO_DAYS.find(e => e.month === todayMonth && e.day === todayDate);

        const upcoming = ECO_DAYS.map(day => {
            let targetDate = new Date(currentYear, day.month - 1, day.day);
            if (targetDate < new Date(currentYear, todayMonth - 1, todayDate)) {
                targetDate.setFullYear(currentYear + 1);
            }
            const diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
            return { ...day, diffDays };
        }).sort((a, b) => a.diffDays - b.diffDays)[0];

        return { todayEvent, upcoming };
    }, []);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [summary, list, msg] = await Promise.all([
                    weatherApi.getForecast(),
                    weatherApi.getForecastList(),
                    weatherApi.getSecretaryMessage()
                ]);
                
                setWeather(summary);
                setWeatherList(list);
                setSecretaryMsg(msg);
            } catch (err) {
                console.error("데이터 로드 중 오류 발생:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const getSkyStatus = (sky, pty) => {
        if (pty > 0) return "🌧️ 비/눈";
        if (sky === "1") return "☀️ 맑음";
        if (sky === "3") return "☁️ 구름많음";
        if (sky === "4") return "🌥️ 흐림";
        return "☀️";
    };

    return (
        <div className={styles.container}>
            {/* 상단 레이아웃 분리: 날씨(왼쪽) / 달력(오른쪽) */}
            <div className={styles.topLayout}>
                <div className={styles.leftSection}>
                    {weather && (
                        <div className={styles.weatherWidget}>
                            <div className={styles.weatherMain}>
                                <span className={styles.weatherIcon}>{getSkyStatus(weather.sky, weather.pty)}</span>
                                <span className={styles.temp}>{weather.tmp}°C</span>
                            </div>
                            <div className={styles.weatherDivider}></div>
                            <div className={styles.weatherSub}>
                                <span className={styles.subItem}>미세: {weather.pm10 <= 30 ? "좋음" : "보통"}</span>
                                <span className={styles.subItem}>자외선: {weather.uvIndex ?? "-"}</span>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className={styles.rightSection}>
                    <EcoCalendar />
                </div>
            </div>

            <div className={styles.hero}>
                <h1>🌍 EasyEarth</h1>
                
                <div className={styles.secretaryContainer}>
                    <div className={styles.speechBubble}>
                        {ecoInfo.todayEvent ? (
                            <p className={styles.todayEventText}>
                                🎉 오늘은 <strong>[{ecoInfo.todayEvent.name}]</strong>입니다.<br/>
                                {ecoInfo.todayEvent.desc}
                            </p>
                        ) : (
                            <p className={styles.dDayText}>
                                🌱 <strong>[{ecoInfo.upcoming.name}]</strong>까지 {ecoInfo.upcoming.diffDays}일 남았습니다.
                            </p>
                        )}
                        <hr className={styles.msgDivider} />
                        {loading ? (
                            <p>에코봇이 메시지를 준비 중입니다... 🤖</p>
                        ) : (
                            secretaryMsg.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                            ))
                        )}
                    </div>
                </div>

                <div className={styles.weatherScroll}>
                    {!loading && weatherList.length > 0 ? (
                        weatherList.map((w, idx) => (
                            <div key={idx} className={styles.largeCard}>
                                <span className={styles.cardTime}>{w.displayTime}</span>
                                <span className={styles.cardIcon}>
                                    {getSkyStatus(w.sky, w.pty).split(' ')[0]}
                                </span>
                                <span className={styles.cardTmp}>{w.tmp}°</span>
                                <div className={styles.cardDetails}>
                                    <span>💧 습도 {w.reh}%</span>
                                    <span>💨 {w.wsd}m/s</span>
                                    <span className={w.pm10 > 80 ? styles.badDust : ""}>
                                        😷 미세 {w.pm10 ?? "-"}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : !loading && (
                        <p className={styles.loadingText}>표시할 날씨 정보가 없습니다.</p>
                    )}
                </div>
            </div>

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
            </aside>

            <QuizModal isOpen={modalType === "quiz"} onClose={closeModal} />
            <QuestModal isOpen={modalType === "quest"} onClose={closeModal} />
            <AttendanceModal isOpen={modalType === "attendance"} onClose={closeModal} />
        </div>
    );
}

export default MainPage;