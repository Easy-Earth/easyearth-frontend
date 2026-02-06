import axios from "axios";
import { memo, useEffect, useState } from "react";
import routeApi from "../../apis/routeApi";
import Button from "../common/Button";
import CustomModal from "../common/CustomModal";
import KeywordTags from "./KeywordTags";
import styles from "./MapModal.module.css";
import ReviewList from "./ReviewList";

function MapModal({ item, theme, onClose, onDrawRoute }) {
  const [reviews, setReviews] = useState([]);
  const [detailData, setDetailData] = useState(null);
  // --- 길찾기 관련 상태 ---
  const [isRouteOpen, setIsRouteOpen] = useState(false); 
  const [routeMode, setRouteMode] = useState(null); 
  const [routeInfo, setRouteInfo] = useState(null); 
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert', 
    message: '',
    onConfirm: () => {}
  });

  const loginUser = JSON.parse(localStorage.getItem("user"));
  const currentMemberId = loginUser ? loginUser.memberId : null;

  const fetchDetailAndReviews = async () => {
    if (!item?.COT_CONTS_ID) return;
    try {
      const response = await axios.get(`http://localhost:8080/spring/api/seoul/detail`, {
        params: {
          themeId: item.COT_THEME_ID,
          contsId: item.COT_CONTS_ID
        }
      });
      const data = response.data.body[0];
      if (data) {
        setDetailData(data);
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("데이터 로딩 실패:", err);
      setReviews([]);
    }
  };
  
  useEffect(() => {
    if (item) fetchDetailAndReviews();
  }, [item]);

  const handleGetRoute = async (mode) => {
    setLoadingRoute(true);
    setRouteMode(mode);
    setRouteInfo(null);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { longitude: startX, latitude: startY } = pos.coords;
      const goalX = item.COT_COORD_X;
      const goalY = item.COT_COORD_Y;

      try {
        let data;
        if (mode === "public-transit") {
          data = await routeApi.getTransitRoute({ startX, startY, goalX, goalY });
        } else {
          data = await routeApi.getOrsRoute({ startX, startY, goalX, goalY, mode });
        }
        setRouteInfo(data);
      } catch (err) {
        alert("경로를 가져오는 데 실패했습니다.");
      } finally {
        setLoadingRoute(false);
      }
    });
  };

  const handleShowRouteOnMap = () => {
    if (!routeInfo) return;
    const pathData = routeMode === "public-transit" ? routeInfo : routeInfo.geometry;
    if (pathData) {
      onDrawRoute(pathData);
      setIsRouteOpen(false);
    }
  };

  if (!item) return null;
  const displayItem = detailData || item;
  const rawImg = displayItem.COT_IMG_MAIN_URL || displayItem.COT_IMG_MAIN_URL1;
  const imageUrl = rawImg ? (rawImg.startsWith("http") ? rawImg : "https://map.seoul.go.kr" + rawImg) : null;

  return (
    <>
      <div className={styles.modalContainer}>
        <div className={styles.closeBtnWrapper}>
          <Button width="70px" height="36px" color="var(--green-100)" onClick={onClose}>
            <span style={{ fontSize: "15px", fontWeight: "600", color: "#14b8a6" }}>닫기</span>
          </Button>
        </div>
        
        <div className={styles.scrollContent}>
          <div className={styles.imageBox}>
            {imageUrl ? <img src={imageUrl} alt={displayItem.COT_CONTS_NAME} /> : <div className={styles.noImage}>이미지 준비중</div>}
          </div>
          <div className={styles.infoBox}>
            <div className={styles.categoryTag}>{theme || "미지정"}</div>
            <h2 className={styles.title}>{displayItem.COT_CONTS_NAME}</h2>
           
            <div className={styles.ratingAndRouteRow}>
              <div className={styles.ratingScoreBox}>
                <span className={styles.starIconLarge}>★</span>
                <span className={styles.ratingValue}>{displayItem.avgRating?.toFixed(1) || "0.0"}</span>
                <span className={styles.ratingMax}>/ 5.0</span>
              </div>
              <button className={styles.routeTriggerBtn} onClick={() => setIsRouteOpen(true)}>📍 길찾기</button>
            </div>

            <div className={styles.divider} />
            <div className={styles.detailList}>
              <div className={styles.detailItem}>
                <strong>주소</strong>
                <span>{displayItem.COT_ADDR_FULL_NEW || "정보 없음"}</span>
              </div>
              <div className={styles.detailItem}>
                  <strong>연락처</strong>
                  <span>{displayItem.COT_TEL_NO || "정보 없음"}</span>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '0 24px 20px 24px' }}>
              {displayItem.COT_KW && <KeywordTags keywords={displayItem.COT_KW} />}
          </div> 

          <div className={styles.reviewBox}>
            <ReviewList 
              reviews={reviews} 
              currentMemberId={currentMemberId}
              shopId={displayItem.shopId || item.shopId}
              shopName={displayItem.COT_CONTS_NAME}
              refreshReviews={fetchDetailAndReviews}
            />
          </div>
        </div>
      </div>

      {isRouteOpen && (
        <div className={styles.overlay} onClick={() => setIsRouteOpen(false)}>
          <div className={`${styles.modal} ${styles.md}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h3>길찾기 수단 선택</h3>
              <button className={styles.closeBtn} onClick={() => setIsRouteOpen(false)}>✕</button>
            </div>
            <div className={styles.body}>
              <div className={styles.tabContainer}>
                <button onClick={() => handleGetRoute("foot-walking")} className={routeMode === "foot-walking" ? styles.activeTab : ""}>도보</button>
                <button onClick={() => handleGetRoute("cycling-regular")} className={routeMode === "cycling-regular" ? styles.activeTab : ""}>자전거</button>
                <button onClick={() => handleGetRoute("public-transit")} className={routeMode === "public-transit" ? styles.activeTab : ""}>대중교통</button>
                <button onClick={() => handleGetRoute("driving-car")} className={routeMode === "driving-car" ? styles.activeTab : ""}>자동차</button>
              </div>

              <div className={styles.routeResultArea}>
                {loadingRoute ? (
                  <div className={styles.routeLoading}>계산 중...</div>
                ) : routeInfo ? (
                  <div className={styles.routeDataCard}>
                    <div className={styles.topInfoRow}>
                      <div className={styles.timeMain}>
                        <span className={styles.resTime}>{routeInfo.durationMinutes}</span>
                        <span className={styles.resUnit}>분</span>
                      </div>
                      <div className={styles.resDist}>{routeInfo.distanceKm}km</div>
                      
                      <div className={styles.ecoStatsCol}>
                        <div className={styles.ecoItem}>
                          <span className={styles.ecoIcon}>🌱</span>
                          <span className={styles.ecoLabel}>탄소 절감 :</span>
                          <span className={styles.ecoValue}>{routeInfo.co2Saved}kg</span>
                        </div>
                        <div className={styles.ecoItem}>
                          <span className={styles.ecoIcon}>🌳</span>
                          <span className={styles.ecoLabel}>나무 심기 :</span>
                          <span className={styles.ecoValue}>{routeInfo.treeEffect}그루</span>
                        </div>
                      </div>
                    </div>

                    {routeMode === "driving-car" && (
                      <div className={styles.ecoRecommendation} style={{ 
                        backgroundColor: '#f0fdf4', 
                        padding: '12px', 
                        borderRadius: '10px', 
                        marginBottom: '15px', 
                        border: '1px solid #dcfce7',
                        textAlign: 'center'
                      }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#166534', fontWeight: '600', lineHeight: '1.6' }}>
                          🚗 자동차 보다는 <span style={{ color: '#14b8a6' }}>대중교통</span>을 이용해<br/> 
                          지구의 온도를 낮춰보는 건 어떨까요? 🌏
                        </p>
                      </div>
                    )}

                    {routeMode === "public-transit" && routeInfo.subPaths && (
                      <div className={styles.transitSummaryBox}>
                        <div className={styles.transitTotalInfo}>
                          <span className={styles.transitIcon}>🚌</span>
                          <strong>{routeInfo.transitCount}회 환승</strong> 
                          <span className={styles.bar}>|</span>
                        </div>
                        <div className={styles.pathSteps}>
                          {routeInfo.subPaths
                            .filter(sub => sub.trafficType !== 3) 
                            .map((sub, idx) => (
                              <div key={idx} className={styles.stepItem}>
                                <span className={styles.lineBadge} style={{backgroundColor: sub.lane?.[0]?.busColor || '#64748b'}}>
                                  {sub.lane?.[0]?.busNo || sub.lane?.[0]?.name}
                                </span>
                                <span className={styles.stationName}>{sub.startName} 승차</span>
                              </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button className={styles.submitBtn} onClick={handleShowRouteOnMap}>
                      지도에서 경로보기
                    </button>
                  </div>
                ) : (
                  <div className={styles.placeholder}>이동 수단을 클릭해 주세요.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}

export default memo(MapModal);