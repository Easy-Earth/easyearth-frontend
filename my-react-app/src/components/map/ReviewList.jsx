import { memo, useState } from "react";
import { reviewApi } from "../../apis/reviewApi";
import Button from "../common/Button";
import CustomModal from "../common/CustomModal";
import Profile from "../common/Profile";
import UserDetailModal from "../common/UserDatailModal";
import ReportModal from "./ReportModal";
import ReviewFormModal from "./ReviewFormModal";
import styles from "./ReviewList.module.css";

function ReviewList({ reviews, currentMemberId, currentMemberName, shopId, shopName, refreshReviews }) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEsrId, setSelectedEsrId] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportReviewId, setSelectedReportReviewId] = useState(null); 
  const [reportTargetId, setReportTargetId] = useState(null);
  const [reportTargetInfo, setReportTargetInfo] = useState({ id: null, name: "" });
 
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

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

  const handleProfileClick = (memberId) => {
    setSelectedMemberId(memberId);
    setIsUserModalOpen(true);
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
  const onReport = async (currentMemberId, currentMemberName, targetMemberId, targetName, esrId) => {
      try {
      const data = {
        reviewId : esrId,
        postId : 0,
        replyId : 0
      };
      await reviewApi.reviewCheck(currentMemberId,targetMemberId, data);
      setSelectedReportReviewId(esrId);
      setReportTargetInfo({ id: targetMemberId, name: targetName });
      setIsReportModalOpen(true);
    } catch (err) {
      // setModalConfig({
      //   isOpen: true,
      //   type: 'alert',
      //   message: "신고 내역이 존재합니다.",
      //   onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      // });
      const serverErrorMessage = err.response?.data || "서버 오류가 발생했습니다.";

        setModalConfig({
          isOpen: true,
          type: 'alert',
          message: serverErrorMessage,
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
      setIsReportModalOpen(false);
    }
    
  };
  const handleReportSubmit = async (reportData) => {
    try {
      const data = {
        memberId : reportData.reporterId,
        targetMemberId : reportData.targetId,
        postId: 0,
        replyId: 0,
        reviewId : selectedReportReviewId,
        type: "REVIEW",
        reason : reportData.reportTag,
        detail : reportData.details
      };
      
      await reviewApi.reviewReport(data);
      
      setModalConfig({
        isOpen: true,
        type: 'alert',
        message: '신고가 정상적으로 접수되었습니다.',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      
    } catch (error) {
      console.error("신고 실패:", error);
      alert(error.response?.data || "신고 처리 중 오류가 발생했습니다.");
    }
    
    setIsReportModalOpen(false);
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
      {currentMemberId &&
      <Button 
        width="100px" 
        height="34px" 
        color="var(--eco-teal)" 
        onClick={handleOpenWriteModal} 
      >{}
        <span style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>리뷰 작성</span>
      </Button>}
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
                <div className={styles.profileArea}>
                  <Profile 
                    size="small" 
                    memberId={rev.memberId} 
                    userName={rev.name} 
                    onClick={handleProfileClick} 
                  />
                  
                  <div className={styles.ratingAndActions}>
                    <div className={styles.ratingWrapper}>
                      <span className={styles.rating}>{"★".repeat(Number(rev.rating))}</span>
                    </div>

                    {currentMemberId && Number(rev.memberId) === Number(currentMemberId) && (
                      <div className={styles.authButtons}>
                        <button className={styles.editBtn} onClick={() => onReviewEdit(rev)}>수정</button>
                        <button className={styles.deleteBtn} onClick={() => onReviewDelete(rev.esrId)}>삭제</button>
                      </div>
                    )}
                    {currentMemberId && Number(rev.memberId)!=Number(currentMemberId) && (
                      <div onClick={() => onReport(currentMemberId, currentMemberName, rev.memberId, rev.name, rev.esrId)} style={{ cursor: 'pointer' }}>🚨</div>
                    )}
                  </div>
                </div>
              </div>
              
              <p className={styles.content}>{rev.content}</p>
              
              <div className={styles.reviewFooter}>
                <span className={styles.date}>{formatDate(rev.createdAt || rev.createAt)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noReview}>첫 번째 리뷰를 작성해보세요! 🌱</div>
        )}
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

      <UserDetailModal 
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        memberId={selectedMemberId}
      />

      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reporterId={currentMemberId}
        reporterName={currentMemberName} 
        targetName={reportTargetInfo.name}
        targetId={reportTargetInfo.id} 
        onSubmit={handleReportSubmit}
        esrId = {selectedReportReviewId}
      />
    </div>
  );
}

export default memo(ReviewList);