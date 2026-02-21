import { useState, useEffect } from "react";
import { reportsApi } from "../../apis/reportsApi";
import { useAuth } from "../../context/AuthContext";
import styles from "./ReportStatusModal.module.css";

const ReportStatusModal = ({ isOpen, onClose, report, onSuccess }) => {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState("");

  const isReceived = report?.status === "RECEIVED";

  const statusOptions = [
    { 
      label: "처리완료", 
      value: "RESOLVED", 
      icon: "✅"
    },
    { 
      label: "반려", 
      value: "REJECTED", 
      icon: "🚫"
    },
  ];

  useEffect(() => {
    if (isOpen && report) {
      setSelectedStatus("");
    }
  }, [isOpen, report]);

  const handleSubmit = async () => {
    if (!selectedStatus) {
      alert("처리 상태를 선택해주세요.");
      return;
    }

    try {
      await reportsApi.reportsStatusChange(user.memberId, report.reportsId, selectedStatus);
      onSuccess("상태가 변경되었습니다.");
      onClose();
    } catch (error) {
      console.error(error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isReceived ? "⚙️ 신고 처리 상태 관리" : "📋 신고 처리 내역"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {/* 신고 정보 */}
          <div className={styles.reportInfo}>
            <h3 className={styles.infoTitle}>신고 내용</h3>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>신고 사유:</span>
              <span className={styles.infoValue}>{report?.reason}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>신고자:</span>
              <span className={styles.infoValue}>{report?.memberName || report?.memberId}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>신고 대상:</span>
              <span className={styles.infoValue}>{report?.targetMemberName || report?.targetMemberId}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>신고일:</span>
              <span className={styles.infoValue}>{String(report?.createdAt ?? "").slice(0, 10)}</span>
            </div>
          </div>

          {/* 상태 선택 - 접수완료일 때만 */}
          {isReceived && (
            <div className={styles.statusSection}>
              <h3 className={styles.sectionTitle}>처리 상태 선택</h3>
              <div className={styles.statusOptions}>
                {statusOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`${styles.statusOption} ${
                      selectedStatus === option.value ? styles.selected : ""
                    }`}
                    onClick={() => setSelectedStatus(option.value)}
                  >
                    <div className={styles.optionIcon}>{option.icon}</div>
                    <span className={styles.optionLabel}>{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 처리 기록 */}
          <div className={styles.historySection}>
            <h3 className={styles.sectionTitle}>📋 처리 기록</h3>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineContent}>
                  <span className={styles.timelineDate}>
                    {String(report?.createdAt ?? "").slice(0, 10)}
                  </span>
                  <span className={styles.timelineText}>신고 접수</span>
                </div>
              </div>
              {report?.resolvedAt && (
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineDate}>
                      {String(report.resolvedAt).slice(0, 10)}
                    </span>
                    <span className={styles.timelineText}>
                      {report.status === "RESOLVED" && "처리 완료"}
                      {report.status === "REJECTED" && "반려 처리"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            {isReceived ? "취소" : "닫기"}
          </button>
          {isReceived && (
            <button className={styles.submitBtn} onClick={handleSubmit}>
              변경하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportStatusModal;