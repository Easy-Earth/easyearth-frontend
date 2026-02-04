import { memo } from "react";
import styles from "./ReviewList.module.css";

function ReviewList({ reviews, currentMemberId, onEdit, onDelete }) {
  
  if (!reviews || reviews.length === 0) {
    return <div className={styles.noReview}>아직 작성된 리뷰가 없습니다.</div>;
  }
  console.log(reviews);
  console.log(currentMemberId);
  return (
    <div className={styles.reviewSection}>
      <h3 className={styles.sectionTitle}>
        방문자 리뷰 <span>{reviews.length}</span>
      </h3>
      <div className={styles.list}>
        {reviews.map((rev) => (
          <div key={rev.esrId} className={styles.reviewCard}>
            <div className={styles.header}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{rev.name || "익명"}</span>
                <span className={styles.rating}>{"★".repeat(rev.rating)}</span>
              </div>

              {/* --------------------------------------------------------- */}
              {/* [본인 확인 로직] */}
              {/* 로그인한 유저 ID가 존재하고, 리뷰의 작성자 ID와 일치할 때만 버튼 노출 */}
              {/* --------------------------------------------------------- */}
              {currentMemberId && Number(rev.memberId) === Number(currentMemberId) && (
                <div className={styles.authButtons}>
                  <button 
                    className={styles.editBtn} 
                    onClick={() => onEdit(rev)}
                  >
                    수정
                  </button>
                  <button 
                    className={styles.deleteBtn} 
                    onClick={() => onDelete(rev.esrId)}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
            <p className={styles.content}>{rev.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ReviewList);