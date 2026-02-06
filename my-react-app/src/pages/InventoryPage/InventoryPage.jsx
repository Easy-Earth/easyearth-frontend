import React, { useState, useEffect, useCallback } from "react";
import * as itemApi from "../../apis/itemApi"; 
import { useAuth } from "../../context/AuthContext"; 
import Button from "../../components/common/Button";
import styles from "./InventoryPage.module.css";

const defaultImg = "https://via.placeholder.com/150?text=No+Image";

const InventoryPage = () => {
  const { user } = useAuth();
  const userId = user?.memberNo || user?.memberId || user?.id;

  const [myItems, setMyItems] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  // 필터 상태
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeRarity, setActiveRarity] = useState("ALL");

  /**
   * 이미지 경로 생성 함수
   */
  const getItemImage = (item) => {
    if (!item) return defaultImg;
    // itemCategory가 없으면 category 필드를 참조하도록 방어 코드 작성
    const category = (item.itemCategory || item.category || "BADGE").toUpperCase();
    const folderName = category === "TITLE" ? "titles" : category === "BACKGROUND" ? "backgrounds" : "badges";
    const prefix = category === "TITLE" ? "title" : category === "BACKGROUND" ? "background" : "badge";
    const rarity = (item.rarity || "COMMON").toLowerCase();
    const itemId = item.itemId || item.ITEM_ID || 0;
    const fileName = `${prefix}_${String(itemId).padStart(2, '0')}.png`;

    try {
      return new URL(`../../assets/${folderName}/${rarity}/${fileName}`, import.meta.url).href;
    } catch {
      return defaultImg;
    }
  };

  /**
   * 보유 아이템 데이터 로드
   */
  const fetchInventory = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await itemApi.getMyItems(userId); 
      const data = Array.isArray(response) ? response : (response?.data || []);
      
      // 데이터가 들어올 때 필드명을 통일시키면 필터링이 훨씬 수월합니다.
      const normalizedData = data.map(item => ({
        ...item,
        // 카테고리 필드명을 itemCategory로 통일하고 대문자로 변환
        itemCategory: (item.itemCategory || item.category || "BADGE").toUpperCase(),
        rarity: (item.rarity || "COMMON").toUpperCase()
      }));

      setMyItems(normalizedData);
    } catch (error) {
      console.error("인벤토리 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  /**
   * 아이템 장착/해제 핸들러
   */
  const handleEquipToggle = async (targetItem) => {
    const { uiId, itemCategory } = targetItem;
    
    try {
      await itemApi.equipItem(uiId, userId);

      setMyItems((prevItems) =>
        prevItems.map((item) => {
          if (item.uiId === uiId) {
            return { ...item, isEquipped: item.isEquipped === "Y" ? "N" : "Y" };
          }
          // 장착 시 같은 카테고리 내의 다른 아이템은 해제
          if (item.itemCategory === itemCategory && item.uiId !== uiId) {
            return { ...item, isEquipped: "N" };
          }
          return item;
        })
      );
    } catch (error) {
      if (error.response?.status === 401 && error.response?.data.includes("해제")) {
        setMyItems((prevItems) =>
          prevItems.map((item) =>
            item.uiId === uiId ? { ...item, isEquipped: "N" } : item
          )
        );
      } else {
        alert(error.response?.data || "처리 중 오류가 발생했습니다.");
      }
    }
  };

  /**
   * 🔍 필터링 로직 (유형 AND 등급)
   * .toUpperCase()를 사용하여 대소문자 구분 없이 비교합니다.
   */
  const filteredItems = myItems.filter((item) => {
    const itemCat = item.itemCategory.toUpperCase();
    const itemRarity = item.rarity.toUpperCase();
    
    const categoryMatch = activeCategory === "ALL" || itemCat === activeCategory;
    const rarityMatch = activeRarity === "ALL" || itemRarity === activeRarity;
    
    return categoryMatch && rarityMatch;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>내 소지품</h1>
        
        <div className={styles.filterSection}>
          {/* 유형 필터 (탭) */}
          <div className={styles.tabBar}>
            {["ALL", "BADGE", "TITLE", "BACKGROUND"].map((cat) => (
              <button 
                key={cat}
                className={`${styles.tab} ${activeCategory === cat ? styles.activeTab : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === "ALL" ? "전체" : cat === "BADGE" ? "뱃지" : cat === "TITLE" ? "칭호" : "배경"}
              </button>
            ))}
          </div>

          {/* 등급 필터 (셀렉트) */}
          <div className={styles.selectWrapper}>
            <select 
              className={styles.raritySelect}
              value={activeRarity}
              onChange={(e) => setActiveRarity(e.target.value)}
            >
              <option value="ALL">모든 등급</option>
              <option value="COMMON">COMMON</option>
              <option value="RARE">RARE</option>
              <option value="EPIC">EPIC</option>
              <option value="LEGENDARY">LEGENDARY</option>
            </select>
          </div>
        </div>
      </header>

      {loading ? (
        <div className={styles.status}>데이터 로딩 중...</div>
      ) : (
        <>
          <div className={styles.resultInfo}>
            검색 결과: <b>{filteredItems.length}</b>개
          </div>
          <div className={styles.grid}>
            {filteredItems.map((item) => {
              const isEquipped = item.isEquipped === "Y";
              const rarityLower = item.rarity?.toLowerCase() || "common";
              return (
                <div 
                  key={item.uiId} 
                  className={`${styles.card} ${isEquipped ? styles.equippedCard : ""} ${styles[`border_${rarityLower}`]}`}
                >
                  {isEquipped && <div className={styles.equippedLabel}>장착 중</div>}
                  
                  <div className={styles.imageWrapper}>
                    <img src={getItemImage(item)} alt={item.itemName} />
                  </div>

                  <div className={styles.info}>
                    <span className={`${styles.rarityText} ${styles[rarityLower]}`}>
                      {item.rarity}
                    </span>
                    <h3 className={styles.itemName}>{item.itemName}</h3>
                    
                    <Button 
                      color={isEquipped ? "#64748b" : "#14b8a6"} 
                      onClick={() => handleEquipToggle(item)}
                      width="100%"
                      height="40px"
                    >
                      {isEquipped ? "장착 해제" : "장착하기"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && filteredItems.length === 0 && (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>🔍</div>
          <p className={styles.emptyText}>해당 조건에 맞는 아이템이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;