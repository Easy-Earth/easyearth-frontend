import React, { useState, useEffect, useCallback, useMemo } from "react";
import Profile from "../../components/common/Profile";
import Button from "../../components/common/Button";
import InventoryModal from "../../components/item/InventoryModal";
import * as itemApi from "../../apis/itemApi";
import { useAuth } from "../../context/AuthContext";
import styles from "./MyPage.module.css";

const MyPage = () => {
  const { user, logout } = useAuth();
  const userId = user?.memberNo || user?.memberId || user?.id;

  const [activeTab, setActiveTab] = useState("inventory");
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ✅ 필터 상태 (초기값 ALL)
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterRarity, setFilterRarity] = useState("ALL");
  
  const [selectedItem, setSelectedItem] = useState(null);

  // 데이터 로드
  const fetchMyInventory = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await itemApi.getMyItems(userId);
      setMyItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("인벤토리 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMyInventory();
  }, [fetchMyInventory]);

  // ✅ [핵심] 다중 필터링 로직: 따로 또 같이 작동하는 조건문
  const filteredItems = useMemo(() => {
    return myItems.filter(item => {
      // 1. 유형 체크: "ALL"이면 통과, 아니면 해당 유형만 통과
      const matchCategory = filterCategory === "ALL" || 
        (item.category && item.category.toUpperCase() === filterCategory.toUpperCase());

      // 2. 등급 체크: "ALL"이면 통과, 아니면 해당 등급만 통과
      const matchRarity = filterRarity === "ALL" || 
        (item.rarity && item.rarity.toUpperCase() === filterRarity.toUpperCase());

      // 3. 두 조건이 모두 만족(AND)해야 함
      // 유형만 선택하면 등급은 ALL이라 무시되고, 등급만 선택하면 유형은 ALL이라 무시됩니다.
      return matchCategory && matchRarity;
    });
  }, [myItems, filterCategory, filterRarity]);

  // 장착/해제 핸들러
  const handleEquipToggle = async (item) => {
    try {
      await itemApi.equipItem(item.uiId, userId);
      fetchMyInventory();
      setSelectedItem(null);
    } catch (error) {
      if (error.response?.status === 401 && error.response?.data.includes("해제")) {
        fetchMyInventory();
        setSelectedItem(null);
      } else {
        alert(error.response?.data || "아이템 처리 중 오류 발생");
      }
    }
  };

  // 이미지 경로 생성 로직
  const getItemImage = (item) => {
    if (!item) return null;
    const category = (item.category || "BADGE").toUpperCase();
    const folder = category === "TITLE" ? "titles" : category === "BACKGROUND" ? "backgrounds" : "badges";
    const prefix = category === "TITLE" ? "title" : category === "BACKGROUND" ? "background" : "badge";
    const rarity = (item.rarity || "COMMON").toLowerCase();
    const fileName = `${prefix}_${String(item.itemId || 0).padStart(2, '0')}.png`;
    
    try {
      return new URL(`../../assets/${folder}/${rarity}/${fileName}`, import.meta.url).href;
    } catch {
      return null;
    }
  };

  const equippedBadge = myItems.find(i => i.category === "BADGE" && i.isEquipped === "Y");
  const equippedTitle = myItems.find(i => i.category === "TITLE" && i.isEquipped === "Y");
  const equippedBg = myItems.find(i => i.category === "BACKGROUND" && i.isEquipped === "Y");

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.profileSection}>
          <Profile 
            presetId={equippedBg ? `${equippedBg.rarity.toLowerCase()}-${equippedBg.itemId}` : "normal-1"}
            userName={user?.name || "사용자"}
            badgeImage={getItemImage(equippedBadge)}
            titleImage={getItemImage(equippedTitle)}
          />
        </section>

        <div className={styles.mainLayout}>
          <aside className={styles.sidebar}>
            <div className={styles.userBrief}>
              <p className={styles.welcome}>반가워요!</p>
              <p className={styles.nameTag}>{user?.name || "사용자"}님</p>
            </div>
            <nav className={styles.navMenu}>
              <button className={activeTab === "inventory" ? styles.activeNav : ""} onClick={() => setActiveTab("inventory")}>🎒 내 인벤토리</button>
              <button className={activeTab === "edit" ? styles.activeNav : ""} onClick={() => setActiveTab("edit")}>⚙️ 정보 수정</button>
              <button className={styles.logoutBtn} onClick={logout}>로그아웃</button>
            </nav>
          </aside>

          <main className={styles.contentArea}>
            {activeTab === "inventory" ? (
              <div className={styles.inventoryWrapper}>
                <div className={styles.contentHeader}>
                  <div className={styles.headerLeft}>
                    <h3>소지품 ({filteredItems.length}/{myItems.length})</h3>
                  </div>
                  <div className={styles.filterControls}>
                    {/* 유형별 필터 탭 */}
                    <div className={styles.categoryTabs}>
                      {["ALL", "BADGE", "TITLE", "BACKGROUND"].map(cat => (
                        <span 
                          key={cat} 
                          className={filterCategory === cat ? styles.activeCat : ""}
                          onClick={() => setFilterCategory(cat)}
                        >
                          {cat === "ALL" ? "전체" : cat === "BADGE" ? "뱃지" : cat === "TITLE" ? "칭호" : "배경"}
                        </span>
                      ))}
                    </div>
                    {/* 등급별 필터 셀렉트박스 */}
                    <select 
                      className={styles.raritySelect} 
                      value={filterRarity} 
                      onChange={(e) => setFilterRarity(e.target.value)}
                    >
                      <option value="ALL">전체 등급</option>
                      <option value="COMMON">COMMON</option>
                      <option value="RARE">RARE</option>
                      <option value="EPIC">EPIC</option>
                      <option value="LEGENDARY">LEGENDARY</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className={styles.loading}>데이터 로딩 중...</div>
                ) : (
                  <div className={styles.itemGrid}>
                    {filteredItems.map(item => {
                      const isEquipped = item.isEquipped === "Y";
                      const rarity = (item.rarity || "COMMON").toLowerCase();
                      return (
                        <div 
                          key={item.uiId} 
                          className={`${styles.itemCard} ${isEquipped ? styles.equipped : ""} ${styles['border_' + rarity]}`}
                          onClick={() => setSelectedItem(item)}
                        >
                          {isEquipped && <span className={styles.equippedBadge}>장착됨</span>}
                          <div className={styles.imgBox}>
                            <img src={getItemImage(item)} alt={item.name} />
                          </div>
                          <div className={styles.itemCardInfo}>
                            <span className={`${styles.itemRarityTag} ${styles[rarity]}`}>{item.rarity}</span>
                            <p className={styles.itemCardName}>{item.name}</p>
                          </div>
                          <button 
                            className={styles.equipActionBtn} 
                            onClick={(e) => { e.stopPropagation(); handleEquipToggle(item); }}
                          >
                            {isEquipped ? "해제" : "장착"}
                          </button>
                        </div>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <div className={styles.noItemMsg}>아이템이 없습니다.</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.editProfileForm}>
                <h3>회원 정보 수정</h3>
                {/* 정보 수정 폼 UI */}
              </div>
            )}
          </main>
        </div>
      </div>

      {selectedItem && (
        <InventoryModal 
          item={selectedItem}
          imageSrc={getItemImage(selectedItem)}
          onClose={() => setSelectedItem(null)}
          onEquipToggle={handleEquipToggle}
        />
      )}
    </div>
  );
};

export default MyPage;