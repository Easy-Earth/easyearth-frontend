import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import CustomModal from "../common/CustomModal";
import { inquiriesApi } from "../../apis/inquiriesApi";
import styles from "./InquiriesStatusModal.module.css";
import { useAuth } from "../../context/AuthContext";

const InquiriesStatusModal = ({ isOpen, onClose, inquiry, onSuccess }) => {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(inquiry?.status || "SUBMITTED");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(inquiry?.status || "SUBMITTED");
    }
  }, [isOpen]);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    message: "",
  });

  const statusOptions = [
    { value: "SUBMITTED", label: "접수완료", color: "#dbeafe", textColor: "#1e40af", icon: "📝" },
    { value: "PROCESSING", label: "진행중", color: "#fef3c7", textColor: "#92400e", icon: "⚙️" },
    { value: "COMPLETED", label: "답변완료", color: "#dcfce7", textColor: "#166534", icon: "✅", requireReply: true },
  ];

  const handleSubmit = async () => {
    if (selectedStatus === inquiry.status) {
      setAlertConfig({
        isOpen: true,
        message: "변경된 상태가 없습니다.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await inquiriesApi.inquiriesStatusChange(user.memberId, inquiry.inquiriesId, selectedStatus);
      onSuccess("상태가 변경되었습니다.");
      onClose();
    } catch (error) {
      console.error(error);
      setAlertConfig({
        isOpen: true,
        message: "상태 변경 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="건의글 상태 관리" size="sm">
        <div className={styles.modalBody}>
          <div className={styles.inquiryInfo}>
            <div className={styles.infoLabel}>건의글</div>
            <div className={styles.infoTitle}>{inquiry?.title}</div>
            <div className={styles.infoMeta}>
              작성자: {inquiry?.name} | 작성일: {String(inquiry?.updatedAt || "").slice(0, 10)}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.statusSection}>
            <div className={styles.sectionLabel}>상태 변경</div>
            <div className={styles.statusGrid}>
              {statusOptions.map((option) => (
                <div
                  key={option.value}
                  className={`${styles.statusCard} ${selectedStatus === option.value ? styles.active : ""} ${
                    option.requireReply && !inquiry?.adminReply ? styles.disabled : ""
                  }`}
                  onClick={() => {
                    if (option.requireReply && !inquiry?.adminReply) return; // 답변 없으면 클릭 막기
                    setSelectedStatus(option.value);
                  }}
                  style={{
                    backgroundColor: selectedStatus === option.value ? option.color : "#fff",
                    borderColor: selectedStatus === option.value ? option.textColor : "#e5e7eb",
                    opacity: option.requireReply && !inquiry?.adminReply ? 0.5 : 1,
                    cursor: option.requireReply && !inquiry?.adminReply ? "not-allowed" : "pointer",
                  }}
                >
                  <div className={styles.statusIcon}>{option.icon}</div>
                  <div
                    className={styles.statusLabel}
                    style={{ color: selectedStatus === option.value ? option.textColor : "#6b7280" }}
                  >
                    {option.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose} disabled={isSubmitting}>
            취소
          </button>
          <button className={styles.btnSubmit} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "처리 중..." : "변경"}
          </button>
        </div>
      </Modal>

      <CustomModal
        isOpen={alertConfig.isOpen}
        type="confirm"
        message={alertConfig.message}
        onConfirm={() => setAlertConfig({ isOpen: false, message: "" })}
        onCancel={() => setAlertConfig({ isOpen: false, message: "" })}
        zIndex={15000}
      />
    </>
  );
};

export default InquiriesStatusModal;