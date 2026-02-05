import { memo, useState } from "react";
import { reviewApi } from "../../apis/reviewApi";
import Button from "../common/Button";
import CustomModal from "../common/CustomModal";
import ReviewFormModal from "./ReviewFormModal";
import styles from "./ReviewList.module.css";
function ReviewList({ reviews, currentMemberId, onEdit, onDelete, shopId, shopName, refreshReviews }) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  console.log("review shopName : " + shopName);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {}
  });
const handleReviewSubmit = async () => {
    if (!content.trim()) {
        alert("리뷰 내용을 입력해주세요.");
        return;
    }
    const reviewData = {
        esrId: 0,
        shopId: Number(shopId), 
        rating: rating,
        content: content,
        memberId: currentMemberId,
        createdAt: new Date().toISOString(),
        updateAt: new Date().toISOString()
    };

    try {
        await reviewApi.reviewWrite(reviewData); 
        setModalConfig({
            isOpen: true,
            type: 'alert',
            message: '리뷰가 등록되었습니다.',
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        
        setIsReviewModalOpen(false);
        setContent("");
        setRating(5);
        if (refreshReviews) refreshReviews(); 
    } catch (error) {
        console.error("리뷰 등록 실패:", error);
        alert("리뷰 등록에 실패했습니다.");
    }
};

  const renderHeader = (
    <h3 className={styles.sectionTitle}>
      <div className={styles.titleGroup}>
        방문자 리뷰 <span className={styles.count}>{reviews?.length || 0}</span>
      </div>
      <Button 
        width="100px" 
        height="34px" 
        color="#14b8a6" 
        onClick={() => setIsReviewModalOpen(true)}
      >
        <span style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>리뷰 작성</span>
      </Button>
    </h3>
  );

  return (
    <div className={styles.reviewSection}>
      {renderHeader}

      <div className={styles.list}>
        {reviews && reviews.length > 0 ? (
          reviews.map((rev) => (
            <div key={rev.esrId} className={styles.reviewCard}>
              <div className={styles.header}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{rev.name || "익명"}</span>
                  <span className={styles.rating}>{"★".repeat(rev.rating)}</span>
                </div>

                {currentMemberId && Number(rev.memberId) === Number(currentMemberId) && (
                  <div className={styles.authButtons}>
                    <button className={styles.editBtn} onClick={() => onEdit(rev)}>수정</button>
                    <button className={styles.deleteBtn} onClick={() => onDelete(rev.esrId)}>삭제</button>
                  </div>
                )}
              </div>
              <p className={styles.content}>{rev.content}</p>
            </div>
          ))
        ) : (
          <div className={styles.noReview}>아직 작성된 리뷰가 없습니다.</div>
        )}
      </div>

      <ReviewFormModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="리뷰 작성"
        content={content}
        setContent={setContent}
        rating={rating}
        setRating={setRating}
        onSubmit={handleReviewSubmit}
        shopName={shopName}
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
}

export default memo(ReviewList);