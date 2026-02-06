import { useCallback, useEffect, useMemo, useState } from "react";
import * as itemApi from "../../apis/itemApi";
import Button from "../../components/common/Button";
import CustomModal from "../../components/common/CustomModal";
import ItemModal from "../../components/item/ItemModal";
import { useAuth } from "../../context/AuthContext";
import styles from "./ShopPage.module.css";
import { TITLE_BG_PRESETS } from "../../utils/profileBackgrounds"; 

const defaultImg = "https://via.placeholder.com/150?text=No+Image";

const ItemCssPreview = ({ item }) => {
  const category = (item.itemCategory || item.category || "").toUpperCase();
  const rarity = (item.rarity || item.RARITY || "common").toLowerCase();
  const rarityList = TITLE_BG_PRESETS[rarity] || TITLE_BG_PRESETS.common || [];
  
  if (rarityList.length === 0) return <div className={styles.badgeCard}></div>;

  const itemIdNum = parseInt(item.itemId || item.ITEM_ID || 1);
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
      {category === "BACKGROUND" && (
        <>
          <div className={styles.badgeGlow}></div>
          <div className={styles.rays}></div>
          <div className={styles.ring}></div>
        </>
      )}

      {category === "TITLE" && (
        <div className={styles.badgeContent}>
          <div className={styles.titleArea}>
            <span className={styles.mainTitle}>{item.name || item.itemName}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ShopPage = () => {
  const { user } = useAuth();
  const memberId = user?.memberNo || user?.memberId || user?.id;

  const [allItems, setAllItems] = useState([]);      
  const [myItems, setMyItems] = useState([]);        
  const [loading, setLoading] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullResult, setPullResult] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false); 
  const [selectedItem, setSelectedItem] = useState(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false, type: 'alert', message: '', onConfirm: () => {}
  });

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [rarityFilter, setRarityFilter] = useState("ALL");

  const categoryMenu = [
    { label: "전체", value: "ALL" },
    { label: "뱃지", value: "BADGE" },
    { label: "칭호", value: "TITLE" },
    { label: "배경", value: "BACKGROUND" },
  ];

  const rarityMenu = [
    { label: "전체", value: "ALL" },
    { label: "COMMON", value: "COMMON" },
    { label: "RARE", value: "RARE" },
    { label: "EPIC", value: "EPIC" },
    { label: "LEGENDARY", value: "LEGENDARY" },
  ];

  const getItemImage = (item) => {
    if (!item) return defaultImg;
    const category = (item.itemCategory || item.category || "BADGE").toUpperCase();
    if (category !== "BADGE") return null;

    const rarity = (item.rarity || item.RARITY || "common").toLowerCase();
    const itemId = item.itemId || item.ITEM_ID || 0;
    const formattedId = String(itemId).padStart(2, '0');
    const fileName = `badge_${formattedId}.png`;

    try {
      return new URL(`../../assets/badges/${rarity}/${fileName}`, import.meta.url).href;
    } catch (err) {
      return defaultImg;
    }
  };

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [storeData, myDataResponse] = await Promise.all([
        itemApi.getStoreItems(),
        memberId ? itemApi.getMyItems(memberId) : Promise.resolve([])
      ]);
      setAllItems(Array.isArray(storeData) ? storeData : []);
      const myData = Array.isArray(myDataResponse) ? myDataResponse : (myDataResponse?.data || []);
      setMyItems(myData.map(item => String(item.itemId || item.ITEM_ID || "")));
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const itemCat = item.itemCategory || item.category || "";
      const itemRar = (item.rarity || item.RARITY || "").toUpperCase();
      const matchCategory = categoryFilter === "ALL" || itemCat === categoryFilter;
      const matchRarity = rarityFilter === "ALL" || itemRar === rarityFilter;
      return matchCategory && matchRarity;
    });
  }, [allItems, categoryFilter, rarityFilter]);

  const handleBuy = (item) => {
    const id = item.itemId || item.ITEM_ID; 
    if (!memberId) {
      setModalConfig({
        isOpen: true, type: 'alert', message: '로그인이 필요한 서비스입니다.',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setModalConfig({
      isOpen: true,
      type: 'confirm',
      message: `[${item.name || item.itemName}] 구매하시겠습니까?`,
      onConfirm: async () => {
        try {
          await itemApi.buyItem({ userId: memberId, itemId: id, price: item.price || item.PRICE });
          setMyItems(prev => [...prev, String(id)]);
          setSelectedItem(null);
          setModalConfig({
            isOpen: true, type: 'alert', message: '🎉 구매 완료되었습니다!',
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
          });
        } catch (error) {
          setModalConfig({
            isOpen: true, type: 'alert', message: error.response?.data || "구매 중 오류가 발생했습니다.",
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
      }
    });
  };

  const handleRandomPull = () => {
    if (!memberId) {
      setModalConfig({ isOpen: true, type: 'alert', message: '로그인이 필요합니다.' });
      return;
    }
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      message: '1,000P를 사용하여 랜덤 뽑기를 진행하시겠습니까?',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setIsPulling(true);
        setPullResult(null);
        setIsDuplicate(false);
        try {
          const result = await itemApi.randomPull(memberId);
          setTimeout(() => {
            setPullResult(result);
            const newItemId = String(result.itemId || result.ITEM_ID || "");
            if (myItems.includes(newItemId)) {
              setIsDuplicate(true);
            } else {
              setMyItems(prev => [...prev, newItemId]);
            }
          }, 1500);
        } catch (error) {
          setIsPulling(false);
          setModalConfig({ isOpen: true, type: 'alert', message: "포인트 부족 또는 오류 발생" });
        }
      }
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>🌱 에코 포인트 상점</h1>
        <div className={styles.gachaBanner}>
          <div className={styles.gachaText}>
            <h3>행운의 랜덤 뽑기</h3>
            <p>1,000P로 전설 등급 아이템에 도전하세요!</p>
          </div>
          <div className={styles.gachaBtnWrapper}>
            <Button color="#ff9f43" onClick={handleRandomPull} width="160px" height="50px">
              <span className={styles.btnText}>뽑기 시작</span>
            </Button>
          </div>
        </div>

        <div className={styles.filterWrapper}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>유형별</span>
            <div className={styles.categoryBar}>
              {categoryMenu.map((m) => (
                <button
                  key={m.value}
                  className={`${styles.categoryTab} ${categoryFilter === m.value ? styles.active : ""}`}
                  onClick={() => setCategoryFilter(m.value)}
                >{m.label}</button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>등급별</span>
            <div className={styles.categoryBar}>
              {rarityMenu.map((m) => (
                <button
                  key={m.value}
                  className={`${styles.categoryTab} ${rarityFilter === m.value ? styles.active : ""}`}
                  onClick={() => setRarityFilter(m.value)}
                >{m.label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className={styles.statusMsg}>아이템 로드 중...</div>
      ) : (
        <div className={styles.itemGrid}>
          {filteredItems.map((item) => {
            const itemId = String(item.itemId || item.ITEM_ID || "");
            const isOwned = myItems.includes(itemId);
            const category = (item.itemCategory || item.category || "BADGE").toUpperCase();
            const rarity = (item.rarity || item.RARITY || 'COMMON').toUpperCase();

            return (
              <div 
                key={itemId} 
                className={`${styles.itemCard} ${styles[`card_${rarity.toLowerCase()}`]}`}
                onClick={() => setSelectedItem(item)}
              >
                <span className={styles.rarityTag}>{rarity}</span>
                <div className={styles.imageArea}>
                  {/* 카드 등급별 배경 효과를 위한 요소 */}
                  <div className={styles.cardRarityBg}></div>
                  
                  {category === "BADGE" ? (
                    <img src={getItemImage(item)} alt={item.name} className={styles.badgeImg} />
                  ) : (
                    <ItemCssPreview item={item} />
                  )}
                </div>
                <div className={styles.infoArea}>
                  <h3 className={styles.itemName}>{item.name || item.itemName}</h3>
                  <div className={styles.cardFooter}>
                    <div className={styles.priceArea}>
                      {rarity === 'LEGENDARY' ? (
                        <span className={styles.notForSale}>비매품</span>
                      ) : (
                        <span className={styles.priceTag}>
                          <i className={styles.pCircle}>P</i> 
                          {(item.price || item.PRICE)?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className={styles.btnActionArea}>
                      {isOwned ? (
                        <span className={styles.ownedLabel}>보유 중</span>
                      ) : rarity === 'LEGENDARY' ? (
                        <span className={styles.gachaOnlyLabel}>뽑기 전용</span>
                      ) : (
                        <Button color="#14b8a6" onClick={(e) => { e.stopPropagation(); handleBuy(item); }} width="70px" height="34px">
                          <span className={styles.btnText}>구매</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 뽑기 애니메이션 오버레이 */}
      {isPulling && (
        <div className={styles.pullOverlay}>
          <div className={`${styles.pullCard} ${pullResult ? styles.isFlipped : ""}`}>
            <div className={styles.cardFront}>?</div>
            <div className={styles.cardBack}>
              {pullResult && (
                <>
                  <div className={styles.resultVisual}>
                    <div className={styles.cardRarityBg}></div>
                    {(pullResult.itemCategory || pullResult.category) === "BADGE" ? (
                       <img src={getItemImage(pullResult)} alt="res" className={styles.badgeImg} />
                    ) : (
                       <ItemCssPreview item={pullResult} />
                    )}
                  </div>
                  <h3 className={styles.resultTitle}>{pullResult.itemName || pullResult.name}</h3>
                  {isDuplicate && <p className={styles.duplicateMsg}>이미 보유 중 (500P 반환)</p>}
                  <Button color="#14b8a6" onClick={() => setIsPulling(false)} width="100px">
                    <span className={styles.btnText}>확인</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ItemModal 
        item={selectedItem} onClose={() => setSelectedItem(null)} onBuy={handleBuy} 
        isOwned={myItems.includes(String(selectedItem?.itemId || selectedItem?.ITEM_ID || ""))}
        imageSrc={getItemImage(selectedItem)}
      />

      <CustomModal 
        isOpen={modalConfig.isOpen} type={modalConfig.type} message={modalConfig.message}
        onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ShopPage;