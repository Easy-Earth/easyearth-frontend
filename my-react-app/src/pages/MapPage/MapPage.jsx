import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import seoulApi from "../../apis/seoulApi";
import Button from "../../components/common/Button";
import { SEOUL_THEMES, THEME_COLOR_MAP } from "../../shared/constants/seoulThemes";
import styles from "./MapPage.module.css";

// CSS 변수를 JS에서 읽어오는 유틸리티 함수
function getCssVar(name, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

function MapPage() {
  /** * [1] useRef 영역 */
  const mapElRef = useRef(null);      
  const mapRef = useRef(null);        
  const markersRef = useRef([]);      
  const userMarkerRef = useRef(null); 
  const polylinesRef = useRef([]);    
  const circleRef = useRef(null);     
  const infoWindowRef = useRef(null); 

  /** [2] useState 영역 */
  const [pos, setPos] = useState(null);               
  const [distance, setDistance] = useState(2000);       
  const [keyword, setKeyword] = useState("");           
  const [selectedThemeIds, setSelectedThemeIds] = useState(["11103395"]); 
  const [loading, setLoading] = useState(false);        
  const [error, setError] = useState("");               
  const [items, setItems] = useState([]);               

  const ecoTeal = useMemo(() => getCssVar("--eco-teal", "#14b8a6"), []);

  /** [3] 핸들러 */
  const handleAllSelect = useCallback(() => {
    if (selectedThemeIds.length === SEOUL_THEMES.length) {
      setSelectedThemeIds([]); 
    } else {
      setSelectedThemeIds(SEOUL_THEMES.map(t => t.id)); 
    }
  }, [selectedThemeIds]);

  const toggleTheme = useCallback((id) => {
    setSelectedThemeIds((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const moveToMyLocation = useCallback(() => {
    const naver = window.naver;
    if (!naver?.maps || !mapRef.current || !pos) return;
    mapRef.current.setCenter(new naver.maps.LatLng(pos.lat, pos.lng));
    mapRef.current.setZoom(16);
  }, [pos]);

  /** [4] 지도 오버레이 관리 */
  const clearMapOverlays = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    if (infoWindowRef.current) infoWindowRef.current.close();
  }, []);

  const renderDistanceCircle = useCallback((centerPos, radius) => {
    const naver = window.naver;
    if (!naver?.maps || !mapRef.current || !centerPos) return;
    if (circleRef.current) circleRef.current.setMap(null); 

    circleRef.current = new naver.maps.Circle({
      map: mapRef.current,
      center: centerPos,
      radius: radius,
      fillColor: ecoTeal,
      fillOpacity: 0.1,
      strokeColor: ecoTeal,
      strokeWeight: 2,
      strokeOpacity: 0.5,
      clickable: false,
    });
  }, [ecoTeal]);

  // [수정] 에러가 났던 좌표 파싱 함수 - 방어 로직 강화
  const drawAreaLine = useCallback((data, color) => {
    const naver = window.naver;
    if (!naver?.maps || !mapRef.current || !data) return;
    try {
      let pathArray = typeof data === "string" ? JSON.parse(data) : data;
      
      // MultiPolygon 또는 중첩 배열 처리 ([[[lng, lat], ...]])
      while (Array.isArray(pathArray) && pathArray.length > 0 && Array.isArray(pathArray[0]) && !Number.isFinite(pathArray[0][0])) {
        pathArray = pathArray[0];
      }

      if (!Array.isArray(pathArray) || pathArray.length === 0) return;

      const path = pathArray.map(coord => {
        if (Array.isArray(coord) && coord.length >= 2) {
          return new naver.maps.LatLng(coord[1], coord[0]);
        }
        return null;
      }).filter(p => p !== null);

      if (path.length < 2) return;

      const polyline = new naver.maps.Polyline({
        map: mapRef.current,
        path: path,
        strokeColor: color,
        strokeWeight: 5,
        strokeOpacity: 0.7,
        strokeLineJoin: 'round',
        zIndex: 90
      });
      polylinesRef.current.push(polyline);
    } catch (e) { console.warn("영역 그리기 실패:", e); }
  }, []);

  const renderMarkers = useCallback((list) => {
    const naver = window.naver;
    if (!naver?.maps || !mapRef.current || !list) return;
    clearMapOverlays(); 
    const bounds = new naver.maps.LatLngBounds(); 

    if (!infoWindowRef.current) {
      infoWindowRef.current = new naver.maps.InfoWindow({
        backgroundColor: "transparent",
        borderWidth: 0,
        disableAnchor: true,
        pixelOffset: new naver.maps.Point(0, -10),
      });
    }

    list.forEach((it) => {
      const themeId = String(it.COT_THEME_ID || it.cotThemeId || "");
      const lat = parseFloat(it.COT_COORD_Y || it.cotCoordY);
      const lng = parseFloat(it.COT_COORD_X || it.cotCoordX);
      if (isNaN(lat) || isNaN(lng)) return;
      
      const position = new naver.maps.LatLng(lat, lng);
      bounds.extend(position); 

      const markerColor = THEME_COLOR_MAP[themeId] || "#666666";
      if (it.COT_COORD_DATA) drawAreaLine(it.COT_COORD_DATA, markerColor);

      const marker = new naver.maps.Marker({
        position,
        map: mapRef.current,
        icon: {
          content: `
            <div style="cursor:pointer; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
              <svg width="40" height="40" viewBox="0 0 24 24">
                <path d="M12 21C16 17.5 19 14.4 19 10.5C19 6.6 15.8 3.5 12 3.5C8.2 3.5 5 6.6 5 10.5C5 14.4 8 17.5 12 21Z" 
                      fill="${markerColor}" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="10.5" r="2.5" fill="white"/>
              </svg>
            </div>
          `,
          anchor: new naver.maps.Point(20, 40),
        },
      });

      naver.maps.Event.addListener(marker, "mouseover", async () => {
        try {
          const res = await seoulApi.getDetail({
            themeId: themeId,
            contsId: it.COT_CONTS_ID || it.cotContsId
          });

          if (res?.body && res.body.length > 0) {
            const d = res.body[0];
            const SEOUL_BASE_URL = "https://map.seoul.go.kr";
            const rawImg = d.COT_IMG_MAIN_URL || d.COT_IMG_MAIN_URL1;
            
            // 이미지 및 주소 예외 처리 (삼항 연산자 사용)
            const imgUrl = rawImg ? (rawImg.startsWith("http") ? rawImg : SEOUL_BASE_URL + rawImg) : "";
            const addrText = d.COT_ADDR_FULL_NEW ? d.COT_ADDR_FULL_NEW : "등록된 주소가 없습니다.";
            
            infoWindowRef.current.setContent(`
              <div style="padding: 0; margin-bottom: 35px;">
                <div style="background: white; border: 1px solid #ddd; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); width: 220px; overflow: hidden; position: relative;">
                  ${imgUrl ? `<img src="${imgUrl}" style="width:100%; height:110px; object-fit:cover; display:block;" />` : `<div style="width:100%; height:110px; background:#f8fafc; display:flex; align-items:center; justify-content:center; color:#cbd5e1; font-size:12px;">이미지 준비중</div>`}
                  <div style="padding: 12px;">
                    <div style="font-size:14px; font-weight:700; color:#222; margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${d.COT_CONTS_NAME}</div>
                    <div style="font-size:12px; color:#666; line-height:1.4; word-break:keep-all;">${addrText}</div>
                  </div>
                  <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); border-top: 10px solid white; border-left: 10px solid transparent; border-right: 10px solid transparent;"></div>
                </div>
              </div>
            `);
            infoWindowRef.current.open(mapRef.current, marker);
          }
        } catch (err) { console.error("데이터 로딩 중 에러:", err); }
      });

      naver.maps.Event.addListener(marker, "mouseout", () => {
        if (infoWindowRef.current) infoWindowRef.current.close();
      });

      markersRef.current.push(marker); 
    });

    if (list.length > 0) mapRef.current.fitBounds(bounds);
  }, [clearMapOverlays, drawAreaLine]);

  /** [5] 생명주기 */
  useEffect(() => {
    const naver = window.naver;
    if (!naver?.maps || !mapElRef.current || mapRef.current) return;
    mapRef.current = new naver.maps.Map(mapElRef.current, {
      center: new naver.maps.LatLng(37.5665, 126.978),
      zoom: 14,
    });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      null, { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    const naver = window.naver;
    if (!naver?.maps || !mapRef.current || !pos) return;
    const currentPos = new naver.maps.LatLng(pos.lat, pos.lng); 
    if (!userMarkerRef.current) {
      userMarkerRef.current = new naver.maps.Marker({
        position: currentPos,
        map: mapRef.current,
        icon: {
          content: `<div style="width: 24px; height: 24px; border-radius: 50%; background: ${ecoTeal}; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
          anchor: new naver.maps.Point(12, 12),
        }
      });
    } else { userMarkerRef.current.setPosition(currentPos); }
  }, [pos, ecoTeal]);

  const handleSearch = useCallback(async () => {
    if (!pos) return;
    if (selectedThemeIds.length === 0) {
      setError("테마를 최소 하나 선택해야 합니다.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await seoulApi.getThemesContents({
        themeIds: selectedThemeIds,
        x: pos.lng,
        y: pos.lat,
        distance,
        keyword: keyword.trim() || undefined,
      });
      const list = res?.body || [];
      setItems(list);
      renderDistanceCircle(new window.naver.maps.LatLng(pos.lat, pos.lng), distance);
      renderMarkers(list);
      if (list.length === 0) setError("주변에 검색 결과가 없습니다.");
    } catch (e) { setError("데이터 통신 에러"); }
    finally { setLoading(false); }
  }, [pos, selectedThemeIds, distance, keyword, renderMarkers, renderDistanceCircle]);

  return (
    <div className={styles.page}>
      <div className={styles.mapWrap}>
        <div ref={mapElRef} className={styles.mapEl} />
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>내 주변 검색</div>
            <button className={styles.panelToggle} type="button" onClick={(e) => e.currentTarget.closest(`.${styles.panel}`).classList.toggle(styles.closed)}>
              <span className={styles.toggleText}>필터</span><span className={styles.chev}>▾</span>
            </button>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>현위치</span>
                <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '700', fontFamily: 'monospace' }}>
                  {pos ? `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}` : "위치 파악 중..."}
                </span>
              </div>
              <Button width="100%" height="48px" color="transparent" onClick={moveToMyLocation} style={{ border: `2px solid ${ecoTeal}`, borderRadius: '24px' }}>
                <span style={{ color: ecoTeal, fontSize: '16px', fontWeight: '600' }}>내 위치로</span>
              </Button>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>키워드</div>
              <input type="text" className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="장소명 입력..." />
            </div>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>반경 설정: <span className={styles.highlight}>{distance >= 1000 ? `${distance/1000}km` : `${distance}m`}</span></div>
              <div className={styles.chips}>
                {[500, 1000, 2000, 5000, 10000, 50000].map((m) => (
                  <Button key={m} width="100%" height="40px" color={distance === m ? "var(--green-500)" : "var(--gray-100)"} onClick={() => setDistance(m)}>
                    <div className={styles.btnContent}><span style={{ fontSize: '13px', fontWeight: distance === m ? '600' : '400', color: distance === m ? "#fff" : "var(--gray-600)" }}>{m >= 1000 ? `${m/1000}km` : `${m}m`}</span></div>
                  </Button>
                ))}
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.themeHeader}>
                <div className={styles.sectionTitle}>테마 선택</div>
                <Button width="auto" height="30px" color="var(--gray-50)" onClick={handleAllSelect}>
                  <div className={styles.btnContent} style={{ padding: '0 12px' }}><span style={{ fontSize: '11px', color: 'var(--gray-600)' }}>{selectedThemeIds.length === SEOUL_THEMES.length ? "전체 해제" : "전체 선택"}</span></div>
                </Button>
              </div>
              <div className={styles.themeList}>
                {SEOUL_THEMES.map((t) => (
                  <label key={t.id} className={styles.themeRow}>
                    <div className={styles.themeInfo}><div className={styles.colorIndicator} style={{ backgroundColor: THEME_COLOR_MAP[t.id] }} /><span className={styles.themeLabel}>{t.label}</span></div>
                    <div className={styles.checkboxWrapper}><input type="checkbox" className={styles.hiddenCheckbox} checked={selectedThemeIds.includes(t.id)} onChange={() => toggleTheme(t.id)} /><div className={styles.customCheck} /></div>
                  </label>
                ))}
              </div>
            </div>
            <Button width="100%" height="50px" color="var(--btn-primary)" disabled={loading} onClick={handleSearch}>
              <div className={styles.btnContent}><span style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>{loading ? "검색 중..." : "조건으로 검색하기"}</span></div>
            </Button>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.count}>검색 결과: <b>{items.length}</b>건</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MapPage);