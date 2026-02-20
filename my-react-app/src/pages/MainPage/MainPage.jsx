import { useCallback, useEffect, useState } from "react";
import { getEnvironmentEffectGlobal, getEnvironmentEffectPersonal } from "../../apis/staticEffect";
import { weatherApi } from "../../apis/weather";
import AttendanceModal from "../../components/main/AttendanceModal";
import EcoCalendar from "../../components/main/EcoCalendar";
import GlobalEcoNews from "../../components/main/GlobalEcoNews";
import QuestModal from "../../components/main/QuestModal";
import QuizModal from "../../components/main/QuizModal";
import styles from "./MainPage.module.css";

function MainPage() {
    const [modalType, setModalType] = useState(null);
    const [weather, setWeather] = useState(null);
    const [weatherList, setWeatherList] = useState([]);
    const [secretaryMsg, setSecretaryMsg] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeMemberId, setActiveMemberId] = useState(0);

    const [globalEffect, setGlobalEffect] = useState({ co2: 0, tree: 0 });
    const [personalEffect, setPersonalEffect] = useState({ 
        memberId: 0, co2: 0, tree: 0, quizSuccessCount: 0, quizFailCount: 0, quizRate: 0 
    });

    // 500개를 기준으로 정답률 계산 (백분율)
    const calculatedRate = Math.floor((personalEffect.quizSuccessCount / 500) * 100);
    // 프로그레스 바는 최대 100%까지만 차도록 제한
    const barWidth = Math.min(calculatedRate, 100);

    const openModal = (type) => setModalType(type);
    const closeModal = () => setModalType(null);

    const fetchAllData = useCallback(async (targetId) => {
        setLoading(true);
        try {
            const [summary, list, msg, globalData, personalData] = await Promise.all([
                weatherApi.getForecast(),
                weatherApi.getForecastList(),
                weatherApi.getSecretaryMessage(),
                getEnvironmentEffectGlobal(),
                targetId !== 0 ? getEnvironmentEffectPersonal(targetId) : Promise.resolve(null)
            ]);

            setWeather(summary);
            setWeatherList(list);
            setSecretaryMsg(msg);
            if (globalData) setGlobalEffect(globalData);
            if (personalData) setPersonalEffect(personalData);
        } catch (err) {
            console.error("데이터 로드 중 오류 발생:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const getMemberIdFromLocalStorage = () => {
            try {
                const userData = window.localStorage.getItem("user");
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    const id = parsedUser.memberId;
                    if (id && Number(id) !== activeMemberId) {
                        setActiveMemberId(Number(id));
                    }
                }
            } catch (e) {
                console.error("로컬 스토리지 파싱 에러:", e);
            }
        };
        getMemberIdFromLocalStorage();
        const tracker = setInterval(getMemberIdFromLocalStorage, 500);
        return () => clearInterval(tracker);
    }, [activeMemberId]);

    useEffect(() => {
        fetchAllData(activeMemberId);
    }, [activeMemberId, fetchAllData]);

    const getSkyStatus = (sky, pty) => {
        if (pty > 0) return "🌧️ 비/눈";
        if (sky === "1") return "☀️ 맑음";
        if (sky === "3") return "☁️ 구름많음";
        if (sky === "4") return "🌥️ 흐림";
        return "☀️";
    };

    return (
        <div className={styles.container}>
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

            <div className={styles.absoluteRight}>
                <EcoCalendar />
                
                {!loading && globalEffect && (
                    <div className={styles.reportCard}>
                        <h4 className={styles.reportTitle}>🌏 지구 누적 통계</h4>
                        <div className={styles.reportGrid}>
                            <div className={styles.reportItem}>
                                <span className={styles.reportLabel}>탄소 절감</span>
                                <span className={styles.reportValue}>{globalEffect.co2.toLocaleString()}g</span>
                            </div>
                            <div className={styles.reportItem}>
                                <span className={styles.reportLabel}>나무 효과</span>
                                <span className={styles.reportValue}>{globalEffect.tree.toFixed(4)}그루</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeMemberId !== 0 && (
                    <div className={styles.reportCard}>
                        <h4 className={styles.reportTitle}>👤 나의 에코 리포트</h4>
                        <div className={styles.reportGrid}>
                            <div className={styles.reportItem}>
                                <span className={styles.reportLabel}>나의 탄소</span>
                                <span className={styles.reportValue}>{personalEffect.co2.toLocaleString()}g</span>
                            </div>
                            <div className={styles.reportItem}>
                                <span className={styles.reportLabel}>나의 나무</span>
                                <span className={styles.reportValue}>{personalEffect.tree.toFixed(4)}그루</span>
                            </div>
                        </div>
                        
                        <div className={styles.quizSection}>
                            <div className={styles.quizHeader}>
                                <span>🎯 퀴즈 달성도 (목표: 500개)</span>
                                <span className={styles.rateHighlight}>{calculatedRate}%</span>
                            </div>
                            <div className={styles.progressBarBg}>
                                <div className={styles.progressBarFill} style={{ width: `${barWidth}%` }}></div>
                            </div>
                            <div className={styles.quizCountRow}>
                                <span className={styles.successText}>✅ 맞힘 {personalEffect.quizSuccessCount}</span>
                                <span className={styles.failText}>❌ 틀림 {personalEffect.quizFailCount}</span>
                                <span className={styles.rateText}>정답률 : {personalEffect.quizRate}%</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.hero}>
                <h1>🌍 EasyEarth</h1>
                <div className={styles.secretaryContainer}>
                    <button 
                        className={styles.refreshBtn}
                        onClick={async () => {
                            if(window.confirm("데이터를 갱신하시겠습니까?")) {
                                setLoading(true);
                                await weatherApi.refreshCache();
                                window.location.reload(); 
                            }
                        }}
                    >🔄 데이터 갱신</button>
                    <div className={styles.speechBubble}>
                        {loading ? <p>에코봇이 메시지를 준비 중입니다...</p> : 
                            secretaryMsg.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                    </div>
                </div>

                <div className={styles.weatherScroll}>
                    {!loading && weatherList.length > 0 ? (
                        weatherList.map((w, idx) => (
                            <div key={idx} className={styles.largeCard}>
                                <span className={styles.cardTime}>{w.displayTime}</span>
                                <span className={styles.cardIcon}>{getSkyStatus(w.sky, w.pty).split(' ')[0]}</span>
                                <span className={styles.cardTmp}>{w.tmp}°</span>
                                <div className={styles.cardDetails}>
                                    <span>💧 {w.reh}%</span>
                                    <span>💨 {w.wsd}m/s</span>
                                    <span className={w.pm10 > 80 ? styles.badDust : ""}>😷 {w.pm10 ?? "-"}</span>
                                </div>
                            </div>
                        ))
                    ) : !loading && <p className={styles.loadingText}>데이터가 없습니다.</p>}
                </div>
                {!loading && <GlobalEcoNews />}
            </div>

            <aside className={styles.sidebar}>
                <div className={styles.tab} onClick={() => openModal("quiz")}>📝 퀴즈</div>
                <div className={styles.tab} onClick={() => openModal("quest")}>🌱 퀘스트</div>
                <div className={styles.tab} onClick={() => openModal("attendance")}>📅 출석</div>
            </aside>

            <QuizModal isOpen={modalType === "quiz"} onClose={closeModal} />
            <QuestModal isOpen={modalType === "quest"} onClose={closeModal} />
            <AttendanceModal isOpen={modalType === "attendance"} onClose={closeModal} />
        </div>
    );
}

export default MainPage;