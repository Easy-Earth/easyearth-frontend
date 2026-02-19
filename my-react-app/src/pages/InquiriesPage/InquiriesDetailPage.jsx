import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { inquiriesApi } from "../../apis/inquiriesApi";
import CustomModal from "../../components/common/CustomModal";
import Profile from "../../components/common/Profile";
import UserDetailModal from "../../components/common/UserDatailModal";
import InquiriesWriteModal from "../../components/inquiries/InquiriesWriteModal";
import { useAuth } from "../../context/AuthContext";
import styles from "./InquiriesDetailPage.module.css";

const InquiriesDetailPage = () => {
  const { inquiriesId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const [adminReplyContent, setAdminReplyContent] = useState("");

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "alert",
    message: "",
    onConfirm: () => {},
  });

  const loadInquiry = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await inquiriesApi.inquiriesDetail(inquiriesId, user?.memberId || 0);
      setInquiry(data);
      setAdminReplyContent(data.adminReply || "");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setError("비공개 건의글은 작성자와 관리자만 확인할 수 있습니다.");
      } else if (err.response?.status === 404) {
        setError("존재하지 않는 건의글입니다.");
      } else {
        setError("건의글을 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user || isAuthenticated === false) {
      loadInquiry();
    }
  }, [inquiriesId, user, isAuthenticated]);

  const handleProfileClick = (memberId) => {
    setSelectedMemberId(memberId);
    setIsUserModalOpen(true);
  };

  const handleDelete = () => {
    setAlertConfig({
      isOpen: true,
      type: "confirm",
      message: "정말 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          await inquiriesApi.inquiriesDelete(inquiriesId, user.memberId);
          setAlertConfig({
            isOpen: true,
            type: "confirm",
            message: "건의글이 삭제되었습니다.",
            onConfirm: () => {
              setAlertConfig({ isOpen: false, type: "alert", message: "", onConfirm: () => {} });
              navigate("/inquiries");
            },
          });
        } catch (error) {
          console.error(error);
          setAlertConfig({
            isOpen: true,
            type: "confirm",
            message: "삭제 중 오류가 발생했습니다.",
            onConfirm: () => setAlertConfig({ isOpen: false, type: "alert", message: "", onConfirm: () => {} }),
          });
        }
      },
    });
  };

  const handleEditSuccess = (message) => {
    setAlertConfig({
      isOpen: true,
      type: "confirm",
      message: message || "건의글이 수정되었습니다.",
      onConfirm: () => {
        setAlertConfig((prev) => ({ ...prev, isOpen: false }));
        loadInquiry();
      },
    });
  };

  const handleAdminReplySubmit = async () => {
    if (!adminReplyContent.trim()) {
      setAlertConfig({
        isOpen: true,
        type: "confirm",
        message: "답변 내용을 입력하세요.",
        onConfirm: () => setAlertConfig({ isOpen: false, type: "alert", message: "", onConfirm: () => {} }),
      });
      return;
    }

    try {
      await inquiriesApi.inquiriesAdminReply(inquiriesId, user.memberId, adminReplyContent);
      setAlertConfig({
        isOpen: true,
        type: "confirm",
        message: inquiry.adminReply ? "답변이 수정되었습니다." : "답변이 등록되었습니다.",
        onConfirm: () => {
          setAlertConfig({ isOpen: false, type: "alert", message: "", onConfirm: () => {} });
          loadInquiry();
        },
      });
    } catch (error) {
      console.error(error);
      setAlertConfig({
        isOpen: true,
        type: "confirm",
        message: "답변 처리 중 오류가 발생했습니다.",
        onConfirm: () => setAlertConfig({ isOpen: false, type: "alert", message: "", onConfirm: () => {} }),
      });
    }
  };

  const handleAdminReplyDelete = () => {
    setAlertConfig({
      isOpen: true,
      type: "confirm",
      message: "정말 답변을 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          await inquiriesApi.inquiriesAdminReply(inquiriesId, user.memberId, "");
          setAlertConfig({
            isOpen: true,
            type: "confirm",
            message: "답변이 삭제되었습니다.",
            onConfirm: () => {
              setAlertConfig({ isOpen: false, type: "alert", message: "", onConfirm: () => {} });
              loadInquiry();
            },
          });
        } catch (error) {
          console.error(error);
          setAlertConfig({
            isOpen: true,
            type: "confirm",
            message: "답변 삭제 중 오류가 발생했습니다.",
            onConfirm: () => setAlertConfig({ isOpen: false, type: "alert", message: "", onConfirm: () => {} }),
          });
        }
      },
    });
  };

  const getStatusBadgeClass = (st) => {
    if (st === "SUBMITTED") return styles.badgeSubmitted;
    if (st === "PROCESSING") return styles.badgeProcessing;
    if (st === "COMPLETED") return styles.badgeCompleted;
    return styles.badgeDefault;
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!inquiry) return <div className={styles.error}>건의글을 찾을 수 없습니다.</div>;

  return (
    <div className={styles.page}>
      <div className={styles.frame}>

        <div className={styles.topActions}>
          <div className={styles.leftBtns}></div>
          <div className={styles.rightBtns}>
            {user?.memberId === inquiry.memberId && (
              <>
                <button className={styles.editBtn} onClick={() => setIsEditModalOpen(true)}>
                  ✏️ 수정
                </button>
                <button className={styles.deleteBtn} onClick={handleDelete}>
                  🗑️ 삭제
                </button>
              </>
            )}
            <button className={styles.backBtn} onClick={() => navigate("/inquiries")}>
              ← 목록으로
            </button>
          </div>
        </div>

        <article className={styles.detailCard}>
          <header className={styles.detailHeader}>
            <div className={styles.headerMeta}>
              <div className={styles.headerTop}>
                <div className={styles.headerLeft}>
                  <div className={styles.headerRow1}>
                    {inquiry.isFaq === "Y" && <span className={styles.badgeFaq}>FAQ</span>}
                    <span className={`${styles.badge} ${getStatusBadgeClass(inquiry.status)}`}>
                      {inquiry.status === "SUBMITTED" && "접수완료"}
                      {inquiry.status === "PROCESSING" && "진행중"}
                      {inquiry.status === "COMPLETED" && "답변완료"}
                    </span>
                    {inquiry.isPublic === "N" && <span className={styles.badgePrivate}>🔒 </span>}
                  </div>
                  <div className={styles.headerRow2}>
                    <span>작성일 : {String(inquiry.updatedAt || "").slice(0, 10)}</span>
                    <span className={styles.metaDivider}>|</span>
                    <span>조회수 : {inquiry.viewCount}</span>
                  </div>
                </div>
                <div className={styles.headerRight}>
                  <Profile
                    size="small"
                    memberId={inquiry.memberId}
                    userName={inquiry.name || String(inquiry.memberId)}
                    onClick={handleProfileClick}
                  />
                </div>
              </div>
            </div>
            <h1 className={styles.detailTitle}>{inquiry.title}</h1>
          </header>

          <div className={styles.detailContent}>{inquiry.content}</div>
        </article>

        {/* 관리자 답변 섹션 */}
        <section className={styles.adminReplySection}>
          <div className={styles.adminReplyHeader}>
            ✅ 관리자 답변
          </div>
          
          {user?.memberId === 1 ? (
            <div>
              <textarea 
                className={styles.adminReplyInput}
                placeholder="답변을 입력하세요"
                value={adminReplyContent}
                onChange={(e) => setAdminReplyContent(e.target.value)}
              />
              <div className={styles.adminReplyBtns}>
                <button className={styles.btnAdminSubmit} onClick={handleAdminReplySubmit}>
                  {inquiry.adminReply ? "답변 수정" : "답변 등록"}
                </button>
                {inquiry.adminReply && (
                  <button className={styles.btnAdminDelete} onClick={handleAdminReplyDelete}>
                    답변 삭제
                  </button>
                )}
              </div>
              
              {inquiry.adminReply && (
                <div className={styles.adminReplyPreview}>
                  <div className={styles.previewLabel}>현재 답변:</div>
                  <div className={styles.adminReply}>
                    <div className={styles.adminReplyContent}>{inquiry.adminReply}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            inquiry.adminReply ? (
              <div className={styles.adminReply}>
                <div className={styles.adminReplyContent}>{inquiry.adminReply}</div>
              </div>
            ) : (
              <div className={styles.noReply}>
                아직 답변이 등록되지 않았습니다. 답변을 기다려주세요.
              </div>
            )
          )}
        </section>

        <InquiriesWriteModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          editData={inquiry}
        />

        <UserDetailModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          memberId={selectedMemberId}
          zIndex={20000}
        />

        <CustomModal
          isOpen={alertConfig.isOpen}
          type={alertConfig.type}
          message={alertConfig.message}
          onConfirm={alertConfig.onConfirm}
          onCancel={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        />

      </div>
    </div>
  );
};

export default InquiriesDetailPage;