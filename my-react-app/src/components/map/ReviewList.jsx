import { memo, useState } from "react";
import { reviewApi } from "../../apis/reviewApi";
import Button from "../common/Button";
import CustomModal from "../common/CustomModal";
import ReviewFormModal from "./ReviewFormModal";
import styles from "./ReviewList.module.css";

function ReviewList({ reviews, currentMemberId, shopId, shopName, refreshReviews }) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEsrId, setSelectedEsrId] = useState(null);

  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {}
  });

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString.split('T')[0];
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const onReviewEdit = (rev) => {
    setIsEditMode(true);
    setSelectedEsrId(rev.esrId);
    setContent(rev.content);
    setRating(Number(rev.rating));
    setIsReviewModalOpen(true);
  };

  const handleOpenWriteModal = () => {
    setIsEditMode(false);
    setSelectedEsrId(null);
    setContent("");
    setRating(5);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!content.trim()) {
        setModalConfig({
            isOpen: true,
            type: 'alert',
            message: '리뷰 내용을 입력해주세요.',
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
        return;
    }
    
    // ✅ 변수 선언을 API 호출 전으로 배치 (ReferenceError 해결)
    const reviewData = {
        esrId: isEditMode ? selectedEsrId : 0,
        shopId: Number(shopId), 
        rating: rating,
        content: content,
        memberId: currentMemberId,
        updateAt: new Date().toISOString()
    };

    try {
        if (isEditMode) {
          await reviewApi.reviewUpdate(reviewData);
        } else {
          await reviewApi.reviewWrite({ ...reviewData, createdAt: new Date().toISOString() }); 
        }

        setIsReviewModalOpen(false);

        setModalConfig({
            isOpen: true,
            type: 'alert',
            message: isEditMode ? '리뷰가 수정되었습니다.' : '리뷰가 등록되었습니다.',
            onConfirm: () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                // ✅ 부모 목록 즉시 새로고침
                if (refreshReviews) refreshReviews(); 
            }
        });
    } catch (error) {
        console.error("실패:", error);
        setModalConfig({
            isOpen: true,
            type: 'alert',
            message: '처리에 실패했습니다.',
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
    }
  };

  const onReviewDelete = async (esrId) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      message: '정말로 삭제하시겠습니까?',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await reviewApi.reviewDelete(esrId);
          setModalConfig({
            isOpen: true,
            type: 'alert',
            message: '게시글이 삭제되었습니다.',
            onConfirm: () => {
              setModalConfig(prev => ({ ...prev, isOpen: false }));
              // ✅ 삭제 후 부모 목록 즉시 새로고침
              if (refreshReviews) refreshReviews(); 
            }
          });
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const renderHeader = (
    <h3 className={styles.sectionTitle}>
      <div className={styles.titleGroup}>
        방문자 리뷰 <span className={styles.count}>{reviews?.length || 0}</span>
      </div>
      <Button 
        width="100px" 
        height="34px" 
        color="var(--eco-teal)" 
        onClick={handleOpenWriteModal} 
      >
        <span style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>리뷰 작성</span>
      </Button>
    </h3>
  );

  return (
    <div className={styles.reviewSection}>
      {renderHeader}
      <div className={styles.list}>
        {reviews?.map((rev) => (
          <div key={rev.esrId} className={styles.reviewCard}>
            <div className={styles.header}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{rev.name || "익명"}</span>
                <span className={styles.rating}>{"★".repeat(Number(rev.rating))}</span>
              </div>
              {currentMemberId && Number(rev.memberId) === Number(currentMemberId) && (
                <div className={styles.authButtons}>
                  <button className={styles.editBtn} onClick={() => onReviewEdit(rev)}>수정</button>
                  <button className={styles.deleteBtn} onClick={() => onReviewDelete(rev.esrId)}>삭제</button>
                </div>
              )}
            </div>
            <p className={styles.content}>{rev.content}</p>
            <div className={styles.reviewFooter}>
              <span className={styles.date}>{formatDate(rev.createdAt || rev.createAt)}</span>
            </div>
          </div>
        ))}
      </div>

      <ReviewFormModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={isEditMode ? "리뷰 수정" : "리뷰 작성"} 
        content={content}
        setContent={setContent}
        rating={rating}
        setRating={setRating}
        onSubmit={handleReviewSubmit}
        shopName={shopName}
        isEditMode={isEditMode}
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