import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { reportsApi } from "../../apis/reportsApi";
import ReportStatusModal from "../../components/reports/ReportStatusModal";
import CustomModal from "../../components/common/CustomModal";
import styles from "./ReportsDetailPage.module.css";

const ReportsDetailPage = () => {
  const { reportsId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "alert",
    message: "",
    onConfirm: () => {},
  });

  const loadReport = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await reportsApi.reportsDetail(reportsId);
      setReport(data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setError("존재하지 않는 신고입니다.");
      } else {
        setError("신고 내역을 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportsId]);

  const getTypeBadgeClass = (t) => {
    if (t === "POST") return styles.badgePost;
    if (t === "REPLY") return styles.badgeReply;
    if (t === "REVIEW") return styles.badgeReview;
    return styles.badgeDefault;
  };

  const getStatusBadgeClass = (st) => {
    if (st === "RECEIVED") return styles.badgeReceived;
    if (st === "RESOLVED") return styles.badgeResolved;
    if (st === "REJECTED") return styles.badgeRejected;
    return styles.badgeDefault;
  };

  const handleStatusSuccess = (message) => {
    setAlertConfig({
      isOpen: true,
      type: "confirm",
      message: message || "상태가 변경되었습니다.",
      onConfirm: () => {
        setAlertConfig({ isOpen: false, type: "alert", message: "", onConfirm: () => {} });
        loadReport();
      },
    });
  };

  const handleViewOriginal = () => {
    if (report.type === 'POST' && report.postId) {
      window.open(`/community/detail/${report.postId}`, '_blank');
    } else if (report.type === 'REPLY' && report.postId) {
      window.open(`/community/detail/${report.postId}?targetReply=${report.replyId}`, '_blank');
    } else if (report.type === 'REVIEW' && report.reviewId) {
      window.open(`/shop/review/${report.reviewId}`, '_blank');
    }
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;
  if (error) return <div className={styles.errorPage}>{error}</div>;
  if (!report) return <div className={styles.errorPage}>신고 내역을 찾을 수 없습니다.</div>;

  return (
    <div className={styles.page}>
      <div className={styles.frame}>

        {/* 상단 액션 버튼 */}
        <div className={styles.topActions}>
          <div className={styles.leftActions}>
            <button className={styles.viewOriginalBtn} onClick={handleViewOriginal}>
              원본 게시글 보기 ↗
            </button>
            {user?.memberId === 1 && (
              <button className={styles.statusBtn} onClick={() => setIsStatusModalOpen(true)}>
                ⚙️ 상태 관리
              </button>
            )}
          </div>
          <button className={styles.backBtn} onClick={() => navigate("/reports")}>
            ← 목록으로 
          </button>
        </div>

        {/* 메인 카드 */}
        <article className={styles.detailCard}>
          {/* 헤더 */}
          <header className={styles.detailHeader}>
            <div className={styles.headerTop}>
              <div className={styles.badgeGroup}>
                <span className={`${styles.badge} ${getTypeBadgeClass(report.type)}`}>
                  {report.type === "POST" && "게시글"}
                  {report.type === "REPLY" && "댓글"}
                  {report.type === "REVIEW" && "리뷰"}
                </span>
                <span className={`${styles.badge} ${getStatusBadgeClass(report.status)}`}>
                  {report.status === "RECEIVED" && "접수완료"}
                  {report.status === "RESOLVED" && "처리완료"}
                  {report.status === "REJECTED" && "반려"}
                </span>
              </div>
              <span className={styles.date}>
                신고일: {String(report.createdAt ?? "").slice(0, 10)}
              </span>
            </div>
            <h1 className={styles.detailTitle}>신고 사유: {report.reason}</h1>
          </header>

          {/* 정보 섹션 */}
          <div className={styles.infoSection}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>신고자</span>
              <div className={styles.infoValue}>
                <span className={styles.userIcon}>👤</span>
                <span>{report.memberName || report.memberId}</span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>신고 대상</span>
              <div className={styles.infoValue}>
                <span className={styles.userIcon}>🎯</span>
                <span>{report.targetMemberName || report.targetMemberId}</span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>신고 ID</span>
              <div className={styles.infoValue}>
                <span>#{report.reportsId}</span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>콘텐츠 유형</span>
              <div className={styles.infoValue}>
                <span>
                  {report.type === "POST" && "게시글"}
                  {report.type === "REPLY" && "댓글"}
                  {report.type === "REVIEW" && "리뷰"}
                </span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>콘텐츠 ID</span>
              <div className={styles.infoValue}>
                <span>
                  #{report.postId || report.replyId || report.reviewId}
                </span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>처리 상태</span>
              <div className={styles.infoValue}>
                <span>
                  {report.status === "RECEIVED" && "접수완료"}
                  {report.status === "RESOLVED" && "처리완료"}
                  {report.status === "REJECTED" && "반려"}
                </span>
              </div>
            </div>
          </div>

          {/* 신고 내용 */}
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>📄 신고 내용</h2>
            <div className={styles.contentBox}>
              {report.detail || "신고 내용이 없습니다."}
            </div>
          </div>
        </article>

        <ReportStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          report={report}
          onSuccess={handleStatusSuccess}
        />

        <CustomModal
          isOpen={alertConfig.isOpen}
          type={alertConfig.type}
          message={alertConfig.message}
          onConfirm={alertConfig.onConfirm}
          onCancel={() => setAlertConfig({ isOpen: false, type: "alert", message: "", onConfirm: () => {} })}
        />

      </div>
    </div>
  );
};

export default ReportsDetailPage;