import React, { useState, useEffect, useCallback, useMemo } from "react";
import Profile from "../../components/common/Profile";
import InventoryModal from "../../components/item/InventoryModal";
import EditProfile from "../../components/member/EditProfilePage";
import DeleteAccount from "../../components/member/DeleteMember";
import * as itemApi from "../../apis/itemApi";
import { useAuth } from "../../context/AuthContext";
import styles from "./MyPage.module.css";
import { TITLE_BG_PRESETS } from "../../utils/profileBackgrounds";

/**
 * 인벤토리 그리드 내에서만 사용하는 CSS 프리뷰 컴포넌트
 */
const ItemCssPreview = ({ item }) => {
  const category = (item.category || "").toUpperCase();
  const rarity = (item.rarity || "common").toLowerCase();
  const rarityList = TITLE_BG_PRESETS[rarity] || TITLE_BG_PRESETS.common || [];
  
  if (rarityList.length === 0) return <div className={styles.badgeCard}></div>;

  const itemIdNum = parseInt(item.itemId || 1);
  const presetIndex = (itemIdNum - 1) % rarityList.length;
  const preset = rarityList[presetIndex];

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  const dynamicStyle = {
    "--g1": preset.g1,
    "--g2": preset.g2,
    "--g3": preset.g3,
    "--b1": preset.b1,
    "--b2": preset.b2,
    "--ring": preset.ring,
    "--ring-rgb": hexToRgb(preset.ring),
  };

  return (
    <div 
      className={`
        ${styles.badgeCard} 
        ${styles[rarity]} 
        ${category === "TITLE" ? styles.isTitleOnly : styles.isBackgroundOnly}
      `} 
      style={dynamicStyle}
    >
      <div className={styles.badgeGlow}></div>
      {category === "BACKGROUND" && (
        <>
          <div className={styles.rays}></div>
          <div className={styles.ring}></div>
        </>
      )}
      {category === "TITLE" && (
        <div className={styles.badgeContent}>
          <div className={styles.titleArea}>
            <span className={styles.mainTitle}>{item.name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const MyPage = () => {
  const { user, logout } = useAuth();
  const userId = user?.memberNo || user?.memberId || user?.id;

  const [activeTab, setActiveTab] = useState("inventory");
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterRarity, setFilterRarity] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState(null);

  // 1. 인벤토리 데이터 로드
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

  // 2. 아이템 필터링 로직 (장착된 아이템 우선 정렬 추가)
  const filteredItems = useMemo(() => {
    return myItems
      .filter((item) => {
        const matchCategory =
          filterCategory === "ALL" ||
          (item.category && item.category.toUpperCase() === filterCategory.toUpperCase());
        const matchRarity =
          filterRarity === "ALL" ||
          (item.rarity && item.rarity.toUpperCase() === filterRarity.toUpperCase());
        return matchCategory && matchRarity;
      })
      .sort((a, b) => (b.isEquipped === "Y" ? 1 : -1) - (a.isEquipped === "Y" ? 1 : -1));
  }, [myItems, filterCategory, filterRarity]);

  // 3. 장착 및 해제 핸들러
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

  // 4. 아이템 이미지 경로 생성 (Profile 컴포넌트 전달용)
  const getItemImage = (item) => {
    if (!item) return null;
    const category = (item.category || "BADGE").toUpperCase();
    const rarity = (item.rarity || "COMMON").toLowerCase();
    
    // 카테고리별 접두사 설정
    let prefix = "badge";
    if (category === "TITLE") prefix = "title";
    if (category === "BACKGROUND") prefix = "bg";

    const fileName = `${prefix}_${String(item.itemId || 0).padStart(2, "0")}.png`;

    try {
      return new URL(`../../assets/badges/${rarity}/${fileName}`, import.meta.url).href;
    } catch {
      return null;
    }
  };

  // 장착 중인 아이템 찾기
  const equippedBadge = myItems.find((i) => i.category === "BADGE" && i.isEquipped === "Y");
  const equippedTitle = myItems.find((i) => i.category === "TITLE" && i.isEquipped === "Y");
  const equippedBg = myItems.find((i) => i.category === "BACKGROUND" && i.isEquipped === "Y");

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.profileSection}>
          {/* Profile 컴포넌트 원본 기능 유지 */}
          <Profile
            presetId={equippedBg ? `${equippedBg.rarity.toLowerCase()}-${equippedBg.itemId}` : "normal-1"}
            userName={user?.name || "사용자"}
            badgeImage={getItemImage(equippedBadge)}
            // titleImage={getItemImage(equippedTitle)}
          />
        </section>

        <div className={styles.mainLayout}>
          <aside className={styles.sidebar}>
            <div className={styles.userBrief}>
              <p className={styles.welcome}>반가워요!</p>
              <p className={styles.nameTag}>{user?.name || "사용자"}님</p>
            </div>
            <nav className={styles.navMenu}>
              <button
                className={activeTab === "inventory" ? styles.activeNav : ""}
                onClick={() => setActiveTab("inventory")}
              >
                🎒 내 인벤토리
              </button>
              <button
                className={activeTab === "edit" ? styles.activeNav : ""}
                onClick={() => setActiveTab("edit")}
              >
                ⚙️ 정보 수정
              </button>
              <button
                className={activeTab === "delete" ? styles.activeNav : ""}
                onClick={() => setActiveTab("delete")}
              >
                👤 회원 탈퇴
              </button>
            </nav>
            <button className={`${styles.navMenu} ${styles.logoutBtn}`} onClick={logout} style={{border:'none', background:'none', cursor:'pointer', padding:'12px 15px', color:'#ef4444', fontWeight:'500'}}>
              로그아웃
            </button>
          </aside>

          <main className={styles.contentArea}>
            {activeTab === "inventory" && (
              <div className={styles.inventoryWrapper}>
                <div className={styles.contentHeader}>
                  <div className={styles.headerLeft}>
                    <h3>소지품 ({filteredItems.length}/{myItems.length})</h3>
                  </div>
                  <div className={styles.filterControls}>
                    <div className={styles.categoryTabs}>
                      {["ALL", "BADGE", "TITLE", "BACKGROUND"].map((cat) => (
                        <span
                          key={cat}
                          className={filterCategory === cat ? styles.activeCat : ""}
                          onClick={() => setFilterCategory(cat)}
                        >
                          {cat === "ALL" ? "전체" : cat === "BADGE" ? "뱃지" : cat === "TITLE" ? "칭호" : "배경"}
                        </span>
                      ))}
                    </div>
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
                    {filteredItems.map((item) => {
                      const isEquipped = item.isEquipped === "Y";
                      const rarity = (item.rarity || "COMMON").toLowerCase();
                      const category = (item.category || "BADGE").toUpperCase();

                      return (
                        <div
                          key={item.uiId}
                          className={`${styles.itemCard} ${isEquipped ? styles.equipped : ""} ${styles["border_" + rarity]}`}
                          onClick={() => setSelectedItem(item)}
                        >
                          {isEquipped && <span className={styles.equippedBadge}>장착됨</span>}
                          <div className={styles.imgBox}>
                            {category === "BADGE" ? (
                              <img src={getItemImage(item)} alt={item.name} />
                            ) : (
                              <ItemCssPreview item={item} />
                            )}
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
                    {filteredItems.length === 0 && <div className={styles.noItemMsg}>아이템이 없습니다.</div>}
                  </div>
                )}
              </div>
            )}

            {activeTab === "edit" && (
              <div className={styles.editWrapper}>
                <div className={styles.contentHeader}><h3>⚙️ 회원 정보 수정</h3></div>
                <EditProfile user={user} />
              </div>
            )}

            {activeTab === "delete" && (
              <div className={styles.deleteWrapper}>
                <div className={styles.contentHeader}><h3>👤 회원 탈퇴</h3></div>
                <DeleteAccount user={user} onLogout={logout} />
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