import axios from "axios";
import { memo, useEffect, useState } from "react";
import Button from "../common/Button";
import KeywordTags from "./KeywordTags";
import styles from "./MapModal.module.css";
import ReviewList from "./ReviewList";

function MapModal({ item, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [detailData, setDetailData] = useState(null);

  // ---------------------------------------------------------
  // [1] 로그인 유저 정보 확인
  // localStorage에 저장된 유저 정보를 가져와서 memberId를 추출합니다.
  // ---------------------------------------------------------
  const loginUser = JSON.parse(localStorage.getItem("user"));
  const currentMemberId = loginUser ? loginUser.memberId : null;
  console.log("dsd"+loginUser);
  console.log("zzz"+currentMemberId);
  useEffect(() => {
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

    if (item) fetchDetailAndReviews();
  }, [item]);

  // ---------------------------------------------------------
  // [2] 리뷰 삭제 핸들러
  // 서버에 삭제 요청을 보내고, 성공하면 화면(reviews state)에서도 지웁니다.
  // ---------------------------------------------------------
  const handleDeleteReview = async (esrId) => {
    if (!window.confirm("정말로 이 리뷰를 삭제하시겠습니까?")) return;

    try {
      // 서버의 삭제 API 호출
      await axios.delete(`http://localhost:8080/spring/api/review/delete/${esrId}`);
      
      // 삭제 성공 후, 현재 리뷰 리스트에서 해당 리뷰만 제외(filter)하여 즉시 반영
      setReviews((prev) => prev.filter((rev) => rev.esrId !== esrId));
      alert("리뷰가 삭제되었습니다.");
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("리뷰 삭제 중 오류가 발생했습니다.");
    }
  };

  // ---------------------------------------------------------
  // [3] 리뷰 수정 핸들러 (현재는 콘솔만 찍음)
  // ---------------------------------------------------------
  const handleEditReview = (review) => {
    console.log("수정 모드 진입 - 대상 데이터:", review);
    // 수정용 모달을 띄우거나 페이지 이동 로직을 여기에 구현하세요.
    alert("수정 기능을 준비 중입니다.");
  };

  if (!item) return null;

  const displayItem = detailData || item;

  const SEOUL_BASE_URL = "https://map.seoul.go.kr";
  const rawImg = displayItem.COT_IMG_MAIN_URL || displayItem.COT_IMG_MAIN_URL1;
  const imageUrl = rawImg ? (rawImg.startsWith("http") ? rawImg : SEOUL_BASE_URL + rawImg) : null;

  return (
    <div className={styles.modalContainer}>
      <div className={styles.closeBtnWrapper}>
        <Button 
          width="70px"  
          height="36px" 
          color="var(--green-100)" 
          hover="#e2f3f0"
          onClick={onClose}
        >
          <span style={{ 
            fontSize: "15px", 
            fontWeight: "600",
            color: "#14b8a6", 
            display: "block",
            width: "100%",
            textAlign: "center"
          }}>
            닫기
          </span>
        </Button>
      </div>
      
      <div className={styles.scrollContent}>
        <div className={styles.imageBox}>
          {imageUrl ? <img src={imageUrl} alt={displayItem.COT_CONTS_NAME} /> : <div className={styles.noImage}>이미지 준비중</div>}
        </div>
        <div className={styles.infoBox}>
          <div className={styles.categoryTag}>{displayItem.THM_THEME_NAME || "테마"}</div>
          <h2 className={styles.title}>{displayItem.COT_CONTS_NAME}</h2>
          <div className={styles.divider} />
          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <strong>주소</strong>
              <span>{displayItem.COT_ADDR_FULL_NEW || displayItem.COT_ADDR_FULL || "정보 없음"}</span>
            </div>
            <div className={styles.detailItem}>
                <strong>연락처</strong>
                <span>{displayItem.COT_TEL_NO || "정보 없음"}</span>
            </div>
           
            {displayItem.COT_NAME_01 && (
                <div className={styles.detailItem}> 
                    <strong>{displayItem.COT_NAME_01}</strong>
                    <span>{displayItem.COT_VALUE_01}</span>
                </div>
            )}
            {displayItem.COT_NAME_02 && (
                <div className={styles.detailItem}> 
                    <strong>{displayItem.COT_NAME_02}</strong>
                    <span>{displayItem.COT_VALUE_02}</span>
                </div>
            )}
            {displayItem.COT_NAME_03 && (
                <div className={styles.detailItem}> 
                    <strong>{displayItem.COT_NAME_03}</strong>
                    <span>{displayItem.COT_VALUE_03}</span>
                </div>
            )}
          </div>
          <div className={styles.description}>
            <p>{displayItem.COT_CONTS_DESC || "상세 설명 정보가 없습니다."}</p>
          </div>
        </div>
        
        <div style={{ padding: '0 24px 20px 24px' }}>
            {displayItem.COT_KW && (
              <div className={styles.detailItem}>
                <KeywordTags keywords={displayItem.COT_KW} />
              </div>
            )}
        </div>

        {/* --------------------------------------------------------- */}
        {/* [4] 리뷰 리스트 영역 */}
        {/* 로그인한 사용자 ID와 삭제/수정 함수를 자식에게 전달합니다. */}
        {/* --------------------------------------------------------- */}
        <div className={styles.reviewBox}>
           <ReviewList 
             reviews={reviews} 
             currentMemberId={currentMemberId}
             onDelete={handleDeleteReview}
             onEdit={handleEditReview}
           />
        </div>
      </div>
    </div>
  );
}

export default memo(MapModal);