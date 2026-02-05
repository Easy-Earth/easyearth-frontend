import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as itemApi from "../../apis/itemApi";
import Button from "../../components/common/Button";
import CustomModal from "../../components/common/CustomModal";
import ItemModal from "../../components/item/ItemModal";
import { useAuth } from "../../context/AuthContext";
import styles from "./ShopPage.module.css";

// 기본 이미지 설정
const defaultImg = "https://via.placeholder.com/150?text=No+Image";

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

  /**
   * [이미지 동적 로드 함수 - 카테고리 확장 버전]
   * 경로 규칙: src/assets/[카테고리별폴더]/[등급]/[파일명]
   */
  const getItemImage = (item) => {
    if (!item) return defaultImg;

    // 1. 카테고리에 따른 폴더 결정 (BADGE -> badges, TITLE -> titles, BACKGROUND -> backgrounds)
    const category = (item.itemCategory || item.category || "BADGE").toUpperCase();
    let folderName = "badges"; // 기본값
    let prefix = "badge";      // 파일명 접두사 (badge_01, title_01 등)

    if (category === "TITLE") {
      folderName = "titles";
      prefix = "title";
    } else if (category === "BACKGROUND") {
      folderName = "backgrounds";
      prefix = "background";
    }

    // 2. 등급 소문자 변환 (폴더명 일치)
    const rarity = (item.rarity || item.RARITY || "common").toLowerCase();
    
    // 3. ID 포맷팅 (badge_01.png, title_01.png 등)
    const itemId = item.itemId || item.ITEM_ID || 0;
    const formattedId = String(itemId).padStart(2, '0');
    const fileName = `${prefix}_${formattedId}.png`;

    try {
      // 수정된 경로: ../../assets/[folderName]/[rarity]/[fileName]
      return new URL(`../../assets/${folderName}/${rarity}/${fileName}`, import.meta.url).href;
    } catch (err) {
      console.warn("이미지 경로 생성 실패:", fileName);
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
    const id = item.itemId || item.ITEM_ID; 
    console.log("구매 시도 아이템 ID:", id);
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
          console.log("랜덤뽑기 결과 : " + result.itemId);
          setTimeout(() => {
            setPullResult(result);
            const newItemId = String(result.itemId || result.ITEM_ID || "");
            if (myItems.includes(newItemId) || result==undefined) {
              setIsDuplicate(true);
            } else {
              console.log(newItemId);
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
                  <img src={getItemImage(item)} alt={item.name || item.itemName} />
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
                  {(isDuplicate || pullResult.itemId === undefined) && (
                    <div className={styles.refundBadge}>
                      이미 보유한 아이템입니다!<br/>
                      <strong>500P 반환 완료</strong>
                    </div>
                  )}
                  {pullResult.itemId!=undefined && (
                    <div className={styles.resultImage}>
                    <img src={getItemImage(pullResult)} alt="result" />
                  </div>
                  )}
                  
                  {/* <div className={styles.resultImage}>
                    <img src={getItemImage(pullResult)} alt="result" />
                  </div> */}
                  <h3 className={styles.resultRarity}>{pullResult.rarity}</h3>
                  <p className={styles.resultName}>{pullResult.itemName || pullResult.name} </p>
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
        imageSrc={getItemImage(selectedItem)}
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