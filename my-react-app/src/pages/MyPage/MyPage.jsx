import { useCallback, useEffect, useMemo, useState } from "react";
import * as itemApi from "../../apis/itemApi";
import Profile from "../../components/common/Profile";
import InventoryModal from "../../components/item/InventoryModal";
import ItemCssPreview from "../../components/item/ItemCssPreview";
import EcoTreeSection from "../../components/main/EcoTreeSection";
import DeleteAccount from "../../components/member/DeleteMember";
import EditProfile from "../../components/member/EditProfilePage";
import { useAuth } from "../../context/AuthContext";
import "../../styles/itemEffects.css";
import styles from "./MyPage.module.css";

const MyPage = () => {
  const { user, logout } = useAuth(); // 탈퇴 처리를 위해 logout 함수를 가져옵니다.
  const userId = user?.memberNo || user?.memberId || user?.id;

  const [activeTab, setActiveTab] = useState("inventory");
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterRarity, setFilterRarity] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState(null);
  const [equipUpdateKey, setEquipUpdateKey] = useState(0);

  // 프로필 클릭 핸들러 (추후 유저 정보 모달 연결용)
  const handleProfileClick = () => {
    console.log("유저 정보 모달 오픈 예정");
  };

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

  const handleEquipToggle = async (item) => {
    if (!userId) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      const itemId = item.itemId || item.ITEM_ID;
      const category = item.category || item.itemCategory || "BADGE";
      if (!itemId) return;
      await itemApi.equipItem(itemId, userId, category);
      await fetchMyInventory();
      setEquipUpdateKey(prev => prev + 1);
      setSelectedItem(null);
    } catch (error) {
      const errorData = error.response?.data;
      if (typeof errorData === 'string' && errorData.includes("완료")) {
        await fetchMyInventory();
        setEquipUpdateKey(prev => prev + 1);
        setSelectedItem(null);
        return;
      }
      alert(error.response?.data || "아이템 처리 중 오류 발생");
      fetchMyInventory();
      setSelectedItem(null);
    }
  };

  const getItemImage = (item) => {
    if (!item) return null;
    const category = (item.category || "BADGE").toUpperCase();
    const rarity = (item.rarity || "COMMON").toLowerCase();
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

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.profileSection} style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', cursor: 'pointer' }}>
          <div onClick={handleProfileClick} style={{ transition: 'transform 0.2s' }}>
            <Profile
              key={`big-${userId}-${equipUpdateKey}`}
              memberId={userId}
              userName={user?.name || "사용자"}
              size="big"
            />
          </div>
          <div onClick={handleProfileClick} style={{ transition: 'transform 0.2s' }}>
            <Profile
              key={`small-top-${userId}-${equipUpdateKey}`}
              memberId={userId}
              userName={user?.name || "사용자"}
              size="small"
            />
          </div>
        </section>

        <div className={styles.mainLayout}>
          <aside className={styles.sidebar}>
            <div className={styles.userBrief}>
              <p className={styles.welcome}>반가워요!</p>
              <p className={styles.nameTag}>{user?.name || "사용자"}님</p>
            </div>

            <nav className={styles.navMenu}>
              <button className={activeTab === "inventory" ? styles.activeNav : ""} onClick={() => setActiveTab("inventory")}>
                🎒 내 인벤토리
              </button>
              <button className={activeTab === "ecotree" ? styles.activeNav : ""} onClick={() => setActiveTab("ecotree")}>
                🌲 나의 에코트리
              </button>
              <button className={activeTab === "edit" ? styles.activeNav : ""} onClick={() => setActiveTab("edit")}>
                ⚙️ 정보 수정
              </button>
              <button className={activeTab === "delete" ? styles.activeNav : ""} onClick={() => setActiveTab("delete")}>
                👤 회원 탈퇴
              </button>
            </nav>
          </aside>

          <main className={styles.contentArea}>
            {activeTab === "ecotree" && (
              <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                <EcoTreeSection memberId={userId} />
              </div>
            )}

            {activeTab === "inventory" && (
              <div className={styles.inventoryWrapper}>
                <div className={styles.contentHeader}>
                  <div className={styles.headerLeft}>
                    <h3>소지품 ({filteredItems.length}/{myItems.length})</h3>
                  </div>
                  <div className={styles.filterControls}>
                    <div className={styles.categoryTabs}>
                      {["ALL", "BADGE", "TITLE", "BACKGROUND"].map((cat) => (
                        <span key={cat} className={filterCategory === cat ? styles.activeCat : ""} onClick={() => setFilterCategory(cat)}>
                          {cat === "ALL" ? "전체" : cat === "BADGE" ? "뱃지" : cat === "TITLE" ? "칭호" : "배경"}
                        </span>
                      ))}
                    </div>
                    <select className={styles.raritySelect} value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)}>
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
                          className={`${styles.itemCard} ${isEquipped ? styles.equipped : ""} border-${rarity}`}
                          onClick={() => setSelectedItem(item)}
                          style={{ position: 'relative', overflow: 'hidden' }}
                        >
                          <div className={`fx-background-layer rarity-${rarity} fx-bg-only`} style={{ filter: 'blur(20px)', transform: 'scale(1.2)', opacity: 0.6 }}>
                            <div className="fx-glow" />
                          </div>
                          {isEquipped && <span className={styles.equippedBadge} style={{ zIndex: 2 }}>장착됨</span>}
                          <div className={styles.imgBox} style={{ position: 'relative', zIndex: 1, background: 'transparent' }}>
                            {category === "BADGE" ? (
                              <img src={getItemImage(item)} alt={item.name} />
                            ) : (
                              <ItemCssPreview item={item} />
                            )}
                          </div>
                          <div className={styles.itemCardInfo} style={{ position: 'relative', zIndex: 1 }}>
                            <span className={`${styles.itemRarityTag} bg-${rarity}`}>{item.rarity}</span>
                            <p className={styles.itemCardName}>{item.name}</p>
                          </div>
                          <button className={styles.equipActionBtn} style={{ zIndex: 1 }} onClick={(e) => { e.stopPropagation(); handleEquipToggle(item); }}>
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
            {activeTab === "edit" && <div className={styles.editWrapper}><EditProfile user={user} /></div>}
            {activeTab === "delete" && (
              <div className={styles.deleteWrapper}>
                {/* onLogout 프롭스에 logout 함수를 전달합니다. */}
                <DeleteAccount user={user} onLogout={logout} />
              </div>
            )}
          </main>
        </div>
      </div>
      {selectedItem && (
        <InventoryModal item={selectedItem} imageSrc={getItemImage(selectedItem)} onClose={() => setSelectedItem(null)} onEquipToggle={handleEquipToggle} />
      )}
    </div>
  );
};

export default MyPage;