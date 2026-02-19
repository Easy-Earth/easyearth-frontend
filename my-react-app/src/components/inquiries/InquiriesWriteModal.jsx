import { useState, useEffect } from "react";
import { inquiriesApi } from "../../apis/inquiriesApi";
import { useAuth } from "../../context/AuthContext";
import Modal from "../common/Modal";
import Input from "../common/Input";
import CustomModal from "../common/CustomModal";
import styles from "./InquiriesWriteModal.module.css";

const InquiriesWriteModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const { user } = useAuth();
  const isEdit = !!editData;

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isPublic: "Y",
    isFaq: "N",
  });

  const [originalData, setOriginalData] = useState({
    title: "",
    content: "",
    isPublic: "Y",
    isFaq: "N",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    message: "",
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    if (isOpen && editData) {
      const data = {
        title: editData.title || "",
        content: editData.content || "",
        isPublic: editData.isPublic || "Y",
        isFaq: editData.isFaq || "N",
      };
      setFormData(data);
      setOriginalData(data);
    } else if (isOpen && !editData) {
      resetForm();
    }
  }, [isOpen, editData]);

  const resetForm = () => {
    const defaultData = { title: "", content: "", isPublic: "Y", isFaq: "N" };
    setFormData(defaultData);
    setOriginalData(defaultData);
  };

  const resetToOriginal = () => {
    setConfirmModal({
      isOpen: true,
      message: "원본 상태로 되돌리시겠습니까?",
      onConfirm: () => {
        setFormData(originalData);
        setConfirmModal({ isOpen: false, message: "", onConfirm: () => {} });
      },
    });
  };

  const handleReset = () => {
    if (isEdit) {
      resetToOriginal();
    } else {
      if (formData.title || formData.content) {
        setConfirmModal({
          isOpen: true,
          message: "작성 중인 내용을 모두 지우시겠습니까?",
          onConfirm: () => {
            resetForm();
            setConfirmModal({ isOpen: false, message: "", onConfirm: () => {} });
          },
        });
      }
    }
  };

  const hasChanges = () => {
    if (!isEdit) return false;
    return (
      formData.title !== originalData.title ||
      formData.content !== originalData.content ||
      formData.isPublic !== originalData.isPublic ||
      formData.isFaq !== originalData.isFaq
    );
  };

  const handleChange = (field, value) => {
    if (field === "isFaq" && value === "Y") {
      // FAQ로 선택하면 자동으로 공개로 변경
      setFormData((prev) => ({ ...prev, isFaq: "Y", isPublic: "Y" }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.title.trim()) {
      setValidationModal({ isOpen: true, message: "제목을 입력하세요." });
      return;
    }
    if (!formData.content.trim()) {
      setValidationModal({ isOpen: true, message: "내용을 입력하세요." });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        memberId: user.memberId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        isPublic: formData.isPublic,
        isFaq: formData.isFaq,
      };

      if (isEdit) {
        await inquiriesApi.inquiriesUpdate(editData.inquiriesId, payload);
        resetForm();
        onClose();
        if (onSuccess) onSuccess("건의글이 수정되었습니다.");
      } else {
        await inquiriesApi.inquiriesInsert(payload);
        resetForm();
        onClose();
        if (onSuccess) onSuccess("건의글이 등록되었습니다.");
      }
    } catch (error) {
      console.error(error);
      setValidationModal({
        isOpen: true,
        message: isEdit ? "수정 중 오류가 발생했습니다." : "등록 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isEdit && hasChanges()) {
      setConfirmModal({
        isOpen: true,
        message: "변경된 내용이 있습니다. 정말 닫으시겠습니까?",
        onConfirm: () => {
          resetForm();
          onClose();
          setConfirmModal({ isOpen: false, message: "", onConfirm: () => {} });
        },
      });
      return;
    }

    if (!isEdit && (formData.title || formData.content)) {
      setConfirmModal({
        isOpen: true,
        message: "작성 중인 내용이 있습니다. 정말 닫으시겠습니까?",
        onConfirm: () => {
          resetForm();
          onClose();
          setConfirmModal({ isOpen: false, message: "", onConfirm: () => {} });
        },
      });
      return;
    }

    resetForm();
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "건의글 수정" : "건의글 작성"} size="md">
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>
                <span className={styles.required}>*</span> 제목
              </label>
              <div className={styles.titleInput}>
                <Input
                  placeholder="제목을 입력하세요 (최대 200자)"
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  fullWidth
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <label className={styles.formLabel}>
                <span className={styles.required}>*</span> 내용
              </label>
              <textarea
                className={styles.textareaContent}
                placeholder="건의 내용을 자세히 작성해주세요"
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
            <label className={styles.formLabel}>공개 설정</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="isPublic"
                  value="Y"
                  checked={formData.isPublic === "Y"}
                  onChange={(e) => handleChange("isPublic", e.target.value)}
                />
                <span>공개</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="isPublic"
                  value="N"
                  checked={formData.isPublic === "N"}
                  onChange={(e) => handleChange("isPublic", e.target.value)}
                  disabled={formData.isFaq === "Y"} // FAQ일 때 비활성화
                />
                <span>비공개 🔒</span>
              </label>
            </div>
            {formData.isFaq === "Y" && (
              <span style={{ fontSize: "12px", color: "var(--gray-500)", marginTop: "4px" }}>
                ※ FAQ는 공개로만 등록할 수 있습니다.
              </span>
            )}
          </div>

            {user?.memberId === 1 && (
              <div className={`${styles.formRow} ${styles.adminOnly}`}>
                <label className={styles.formLabel}>FAQ 설정 (관리자 전용)</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="isFaq"
                      value="N"
                      checked={formData.isFaq === "N"}
                      onChange={(e) => handleChange("isFaq", e.target.value)}
                    />
                    <span>일반</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="isFaq"
                      value="Y"
                      checked={formData.isFaq === "Y"}
                      onChange={(e) => handleChange("isFaq", e.target.value)}
                    />
                    <span>⭐ FAQ</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={handleReset} disabled={isSubmitting}>
              초기화
            </button>
            <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
              {isSubmitting ? "처리 중..." : isEdit ? "수정 완료" : "등록"}
            </button>
          </div>
        </form>
      </Modal>

      <CustomModal
        isOpen={validationModal.isOpen}
        type="confirm"
        message={validationModal.message}
        onConfirm={() => setValidationModal({ isOpen: false, message: "" })}
        onCancel={() => setValidationModal({ isOpen: false, message: "" })}
        zIndex={15000}
      />

      <CustomModal
        isOpen={confirmModal.isOpen}
        type="confirm"
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, message: "", onConfirm: () => {} })}
        zIndex={15000}
      />
    </>
  );
};

export default InquiriesWriteModal;