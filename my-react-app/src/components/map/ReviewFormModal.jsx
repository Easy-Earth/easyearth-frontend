import { useState } from "react";
import styles from "./ReviewFormModal.module.css";

function ReviewFormModal({ 
  isOpen, onClose,test, title, content, setContent, rating, setRating, onSubmit ,shopName
}) {
  const [hover, setHover] = useState(0);
console.log("shopName:", shopName);
console.log(test);
  if (!isOpen) return null;

  return (
    <div className={styles.reviewModalOverlay} onClick={onClose}>
      <div className={styles.reviewModalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeCircleBtn} onClick={onClose}>✕</button>

        <div className={styles.modalInner}>
          <h4 className={styles.newWriteTitle}>{title}</h4>
          
          <div className={styles.newShopCard}>
            <span className={styles.newShopLabel}>방문한 장소</span>
            <p className={styles.newShopName}>{shopName}</p>
          </div>

          <div className={styles.newStarSection}>
            <p className={styles.newStarQuestion}>이곳에서의 경험은 어떠셨나요?</p>
            <div className={styles.newStarsContainer}>
              {[1, 2, 3, 4, 5].map((num) => (
                <span
                  key={num}
                  className={`${styles.starIcon} ${num <= (hover || rating) ? styles.starOn : styles.starOff}`}
                  onClick={() => setRating(num)}
                  onMouseEnter={() => setHover(num)}
                  onMouseLeave={() => setHover(0)}
                >
                  ★
                </span>
              ))}
            </div>
            <div className={styles.ratingBadgeText}>{rating}점</div>
          </div>

          <textarea 
            placeholder="공간에 대한 솔직한 소감을 들려주세요."
            className={styles.newTextArea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className={styles.newBtnGroup}>
            <button className={styles.newCancelBtn} onClick={onClose} type="button">취소</button>
            <button 
              className={styles.newSubmitBtn} 
              onClick={onSubmit}
              disabled={!content.trim()}
              type="button"
            >
              리뷰 등록하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewFormModal;