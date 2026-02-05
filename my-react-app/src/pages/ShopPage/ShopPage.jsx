import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as itemApi from "../../apis/itemApi";
import Button from "../../components/common/Button";
import CustomModal from "../../components/common/CustomModal";
import ItemModal from "../../components/item/ItemModal";
import { useAuth } from "../../context/AuthContext";
import styles from "./ShopPage.module.css";

const ShopPage = () => {
  const navigate = useNavigate();
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
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {}
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

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const itemCat = item.itemCategory || item.category || "";
      const itemRar = item.rarity || item.RARITY || "";
      const matchCategory = categoryFilter === "ALL" || itemCat === categoryFilter;
      const matchRarity = rarityFilter === "ALL" || itemRar === rarityFilter;
      return matchCategory && matchRarity;
    });
  }, [allItems, categoryFilter, rarityFilter]);

  const handleBuy = (item) => {
    if (!memberId) {
      setModalConfig({
        isOpen: true,
        type: 'alert',
        message: '로그인이 필요한 서비스입니다.',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const itemId = item.itemId || item.ITEM_ID;
    const price = item.price || item.PRICE;

    setModalConfig({
      isOpen: true,
      type: 'confirm',
      message: `[${item.name || item.itemName}] 구매하시겠습니까?`,
      onConfirm: async () => {
        try {
          await itemApi.buyItem({ userId: memberId, itemId, price });
          setMyItems(prev => [...prev, String(itemId)]);
          setSelectedItem(null);
          setModalConfig({
            isOpen: true,
            type: 'alert',
            message: '🎉 구매 완료되었습니다!',
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
          });
        } catch (error) {
          setModalConfig({
            isOpen: true,
            type: 'alert',
            message: error.response?.data || "구매 중 오류가 발생했습니다.",
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
      }
    });
  };

  const handleRandomPull = () => {
    if (!memberId) {
      setModalConfig({
        isOpen: true,
        type: 'alert',
        message: '로그인이 필요합니다.',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
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
          setModalConfig({
            isOpen: true,
            type: 'alert',
            message: error.response?.data || "포인트가 부족하거나 오류가 발생했습니다.",
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
      }
    });
  };

  const closePullResult = () => {
    setIsPulling(false);
    setPullResult(null);
    setIsDuplicate(false);
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
                  className={`${styles.categoryTab} ${categoryFilter === menu.value ? styles.active : ""}`}
                  onClick={() => setCategoryFilter(menu.value)}
                >{menu.label}</button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>등급별</span>
            <div className={styles.categoryBar}>
              {rarityMenu.map((menu) => (
                <button
                  key={menu.value}
                  className={`${styles.categoryTab} ${rarityFilter === menu.value ? styles.active : ""}`}
                  onClick={() => setRarityFilter(menu.value)}
                >{menu.label}</button>
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
            const isOnSale = (item.isOnSale || item.IS_ON_SALE) === 'Y';
            const rarity = (item.rarity || item.RARITY || 'COMMON').toLowerCase();

            return (
              <div 
                key={itemId} 
                className={`${styles.itemCard} ${styles[rarity]}`}
                onClick={() => setSelectedItem(item)}
              >
                <span className={styles.rarityBadge}>{item.rarity || item.RARITY}</span>
                <div className={styles.itemImage}>
                  <img src={item.itemImage || "/default-item.png"} alt={item.name} />
                </div>
                <div className={styles.itemContent}>
                  <h3 className={styles.itemName}>{item.name || item.itemName}</h3>
                  <div className={styles.itemFooter}>
                    <span className={styles.price}>
                      {isOnSale ? (
                        <>
                          <i className={styles.coinIcon}>P</i> {(item.price || item.PRICE)?.toLocaleString()}
                        </>
                      ) : (
                        <span className={styles.notForSaleLabel}>비매품</span>
                      )}
                    </span>
                    <div className={styles.buttonWrapper}>
                      {isOwned ? (
                        <span className={styles.ownedText}>보유 중</span>
                      ) : isOnSale ? (
                        <Button 
                          color="#14b8a6" 
                          onClick={(e) => { e.stopPropagation(); handleBuy(item); }} 
                          width="70px" height="34px"
                        >구매</Button>
                      ) : (
                        <span className={styles.notForSaleText}>획득 전용</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isPulling && (
        <div className={styles.pullOverlay}>
          <div className={`${styles.pullCard} ${pullResult ? styles.isFlipped : ""}`}>
            <div className={styles.cardFront}>
              <div className={styles.questionMark}>?</div>
              <p className={styles.pulseText}>과연 무엇이 나올까요?</p>
            </div>
            <div className={`${styles.cardBack} ${pullResult?.rarity ? styles[pullResult.rarity.toLowerCase()] : ""}`}>
              {pullResult && (
                <>
                  {isDuplicate && (
                    <div className={styles.refundBadge}>
                      <span className={styles.refundIcon}></span>
                      이미 보유한 아이템입니다!<br/>
                      <strong>500P 반환 완료</strong>
                    </div>
                  )}
                  <div className={styles.resultImage}>
                    <img src={pullResult.itemImage || "/default-item.png"} alt="result" />
                  </div>
                  <h3 className={styles.resultRarity}>{pullResult.rarity}</h3>
                  <p className={styles.resultName}>{pullResult.itemName || pullResult.name}</p>
                  <div className={styles.confirmBtnWrapper}>
                    <Button color="#2cdfd0" onClick={closePullResult} width="130px" height="40px">확인</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ItemModal 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
        onBuy={handleBuy} 
        isOwned={myItems.includes(String(selectedItem?.itemId || selectedItem?.ITEM_ID || ""))}
      />

      <CustomModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ShopPage;