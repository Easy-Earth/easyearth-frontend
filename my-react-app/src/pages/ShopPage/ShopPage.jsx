import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import * as itemApi from "../../apis/itemApi"; 
import { useAuth } from "../../context/AuthContext"; // ✨ AuthContext 사용
import Button from "../../components/common/Button";
import ItemModal from "../../components/item/ItemModal"; 
import styles from "./ShopPage.module.css";

const ShopPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✨ 로그인된 유저 정보 직접 추출
  
  // 프로젝트 DB 설계에 따라 user.id 또는 user.memberId 등을 사용하세요.
  // 보통 PK값인 숫자가 들어갑니다.
  const memberId = user?.memberNo || user?.memberId || user?.id;

  const [items, setItems] = useState([]);
  const [filterMode, setFilterMode] = useState("CATEGORY");
  const [currentFilter, setCurrentFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullResult, setPullResult] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const categoryMenu = [
    { label: "전체", value: "ALL" },
    { label: "일반", value: "NORMAL" },
    { label: "레어 기어", value: "RARE_GEAR" },
    { label: "에픽 기어", value: "EPIC_GEAR" },
    { label: "레전드", value: "LEGEND" },
  ];

  const rarityMenu = [
    { label: "COMMON", value: "COMMON" },
    { label: "RARE", value: "RARE" },
    { label: "EPIC", value: "EPIC" },
    { label: "LEGENDARY", value: "LEGENDARY" },
  ];

  useEffect(() => {
    fetchItems();
  }, [filterMode, currentFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let data;
      if (currentFilter === "ALL") {
        data = await itemApi.getStoreItems();
      } else if (filterMode === "CATEGORY") {
        data = await itemApi.getItemsByCategory(currentFilter);
      } else if (filterMode === "RARITY") {
        data = await itemApi.getItemsByRarity(currentFilter);
      }
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("아이템 로드 실패:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (mode, value) => {
    setFilterMode(mode);
    setCurrentFilter(value);
  };

  // 💰 일반 아이템 구매
  const handleBuy = async (item) => {
    if (!memberId) {
      alert("로그인이 필요한 서비스입니다.");
      return;
    }

    if (!window.confirm(`[${item.name || item.itemName}] 아이템을 구매하시겠습니까?`)) return;

    try {
      await itemApi.buyItem({
        memberId: memberId,
        itemId: item.itemId,
        price: item.price
      });

      setSelectedItem(null);
      if (window.confirm("🎉 구매 완료! 인벤토리 페이지로 이동하여 확인하시겠습니까?")) {
        navigate("/inventory");
      } else {
        fetchItems();
      }
    } catch (error) {
      alert(error.response?.data || "구매 중 오류가 발생했습니다.");
    }
  };

  // 🎰 랜덤 뽑기 실행 (memberId 자동 연동)
  const handleRandomPull = async () => {
    if (!memberId) {
      alert("로그인이 필요한 서비스입니다.");
      return;
    }

    if (!window.confirm("1,000P를 사용하여 랜덤 뽑기를 진행하시겠습니까?")) return;
    
    setIsPulling(true);
    setPullResult(null);

    try {
      const result = await itemApi.randomPull(memberId);
      
      // 결과 공개 전 1.5초간 긴장감 연출
      setTimeout(() => {
        setPullResult(result);
      }, 1500);

    } catch (error) {
      setIsPulling(false);
      alert(error.response?.data || "포인트가 부족하거나 오류가 발생했습니다.");
    }
  };

  const closePullResult = () => {
    setIsPulling(false);
    setPullResult(null);
    if (window.confirm("인벤토리로 이동하여 당첨된 아이템을 확인하시겠습니까?")) {
      navigate("/inventory");
    } else {
      fetchItems(); 
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>🌱 에코 포인트 상점</h1>
        
        <div className={styles.gachaBanner}>
          <div className={styles.gachaText}>
            <h3>행운의 랜덤 뽑기</h3>
            <p>1,000P로 전설 등급 아이템에 도전하세요!</p>
          </div>
          <div className={styles.gachaButtonWrapper}>
            <Button color="#ff9f43" onClick={handleRandomPull} width="180px" height="48px">
              뽑기 시작
            </Button>
          </div>
        </div>

        <div className={styles.filterWrapper}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>유형별</span>
            <div className={styles.categoryBar}>
              {categoryMenu.map((menu) => (
                <button
                  key={menu.value}
                  className={`${styles.categoryTab} ${filterMode === "CATEGORY" && currentFilter === menu.value ? styles.active : ""}`}
                  onClick={() => handleFilterChange("CATEGORY", menu.value)}
                >
                  {menu.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>등급별</span>
            <div className={styles.categoryBar}>
              {rarityMenu.map((menu) => (
                <button
                  key={menu.value}
                  className={`${styles.categoryTab} ${filterMode === "RARITY" && currentFilter === menu.value ? styles.active : ""}`}
                  onClick={() => handleFilterChange("RARITY", menu.value)}
                >
                  {menu.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className={styles.statusMsg}>아이템 목록을 가져오는 중...</div>
      ) : (
        <div className={styles.itemGrid}>
          {items.map((item) => (
            <div 
              key={item.itemId} 
              className={`${styles.itemCard} ${styles[item.rarity?.toLowerCase() || 'common']}`}
              onClick={() => setSelectedItem(item)}
            >
              <span className={styles.rarityBadge}>{item.rarity}</span>
              <div className={styles.itemImage}>
                <img src={item.itemImage || "/default-item.png"} alt={item.name || item.itemName} />
              </div>
              <div className={styles.itemContent}>
                <h3 className={styles.itemName}>{item.name || item.itemName}</h3>
                <p className={styles.itemDesc}>{item.itemDescription}</p>
                <div className={styles.itemFooter}>
                  <span className={styles.price}>
                    <i className={styles.coinIcon}>P</i> {item.price?.toLocaleString()}
                  </span>
                  <div className={styles.buttonWrapper}>
                    <Button 
                      color="#14b8a6" 
                      onClick={(e) => { e.stopPropagation(); handleBuy(item); }} 
                      width="70px" height="34px"
                    >
                      구매
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🎰 뽑기 연출 오버레이 */}
      {isPulling && (
        <div className={styles.pullOverlay}>
          <div className={`${styles.pullCard} ${pullResult ? styles.isFlipped : ""}`}>
            {/* 카드 앞면 */}
            <div className={styles.cardFront}>
              <div className={styles.questionMark}>?</div>
              <p className={styles.pulseText}>과연 무엇이 나올까요?</p>
            </div>
            
            {/* 카드 뒷면 (결과 공개) */}
            <div className={`${styles.cardBack} ${pullResult?.rarity ? styles[pullResult.rarity.toLowerCase()] : ""}`}>
              {/* 중복 당첨 문자열 처리 */}
              {typeof pullResult === "string" ? (
                <div className={styles.duplicateWrapper}>
                  <p className={styles.resultName}>{pullResult}</p>
                </div>
              ) : (
                <>
                  {pullResult?.rarity === "LEGENDARY" && <div className={styles.confetti}>✨ 전설 획득! ✨</div>}
                  <div className={styles.resultImage}>
                     <img src={pullResult?.itemImage || "/default-item.png"} alt="result" />
                  </div>
                  <h3 className={styles.resultRarity}>{pullResult?.rarity}</h3>
                  <p className={styles.resultName}>{pullResult?.itemName || pullResult?.name}</p>
                </>
              )}
              <div style={{marginTop: '20px'}}>
                <Button color="#1e293b" onClick={closePullResult} width="130px" height="40px">
                  확인
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onBuy={handleBuy} />
    </div>
  );
};

export default ShopPage;