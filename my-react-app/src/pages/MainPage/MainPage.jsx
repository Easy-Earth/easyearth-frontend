import { useEffect, useState } from "react";
import { weatherApi } from "../../apis/weather";
import AttendanceModal from "../../components/main/AttendanceModal";
import EcoCalendar from "../../components/main/EcoCalendar";
import QuestModal from "../../components/main/QuestModal";
import QuizModal from "../../components/main/QuizModal";
import GlobalEcoNews from "../../components/main/GlobalEcoNews";

import styles from "./MainPage.module.css";

function MainPage() {
    const [modalType, setModalType] = useState(null);
    const [weather, setWeather] = useState(null);
    const [weatherList, setWeatherList] = useState([]);
    const [secretaryMsg, setSecretaryMsg] = useState("");
    const [loading, setLoading] = useState(true);

    const openModal = (type) => setModalType(type);
    const closeModal = () => setModalType(null);

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
            {/* 좌측 상단 날씨 섹션 */}
            <div className={styles.absoluteLeft}>
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

            {/* 우측 상단 달력 섹션 - 위치 고정됨 */}
            <div className={styles.absoluteRight}>
                <EcoCalendar />
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className={styles.hero}>
                <h1>🌍 EasyEarth</h1>

                <div className={styles.secretaryContainer}>
                    <button 
                        onClick={async () => {
                            if(window.confirm("날씨와 뉴스 정보를 최신으로 갱신하시겠습니까? (약 3~5초 소요)")) {
                                setLoading(true);
                                await weatherApi.refreshCache();
                                window.location.reload(); 
                            }
                        }}
                        style={{
                            position: 'absolute',
                            top: '-30px',
                            right: '0',
                            padding: '5px 10px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            zIndex: 10
                        }}
                    >
                        🔄 데이터 갱신
                    </button>
                    <div className={styles.speechBubble}>
                        {/* 🚩 기념일 문구는 삭제하고 순수 비서 메시지만 출력 */}
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

                {/* 🌍 글로벌 환경 뉴스 섹션 추가 */}
                {!loading && <GlobalEcoNews />}
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