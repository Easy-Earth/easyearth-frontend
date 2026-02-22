import { useEffect, useState } from "react";
import { communityApi } from "../../apis/communityApi";
import { useAuth } from "../../context/AuthContext";
import { getFullUrl2 } from "../../utils/communityImageUtil";
import CustomModal from "../common/CustomModal";
import Input from "../common/Input";
import Modal from "../common/Modal";
import styles from "./CommunityWriteModal.module.css";

function CommunityWriteModal({ isOpen, onClose, postId, onSuccess }) {
  const { user } = useAuth();

  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── [기존 유지] 유효성 검사 모달 ──
  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    message: "",
  });

  // ── [기존 유지] 확인 모달 (여기서 type만 alert으로 바꿈) ──
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });

  // ── [기존 유지] 수정 모드: 원본 데이터 저장 ──
  const [originalData, setOriginalData] = useState({
    category: "",
    title: "",
    content: "",
    existingFiles: [],
  });

  const categories = ["나눔", "자유", "인증", "정보", "기타"];

  useEffect(() => {
    if (isOpen && postId) {
      loadPostData();
    } else if (isOpen && !postId) {
      resetForm();
    }
  }, [isOpen, postId]);

  const loadPostData = async () => {
    try {
      const data = await communityApi.communityDetail(postId);
      if (data) {
        const post = data.cp || data;
        const fileList = data.fileList || [];
        
        setCategory(post.category || "");
        setTitle(post.title || "");
        setContent(post.content || "");
        setExistingFiles(fileList);
        setFilesToDelete([]);
        setSelectedFiles([]);
        
        setOriginalData({
          category: post.category || "",
          title: post.title || "",
          content: post.content || "",
          existingFiles: fileList,
        });
      }
    } catch (error) {
      console.error("게시글 로드 실패:", error);
      alert("게시글을 불러오는데 실패했습니다.");
      onClose();
    }
  };

  const resetForm = () => {
    setCategory("");
    setTitle("");
    setContent("");
    setSelectedFiles([]);
    setExistingFiles([]);
    setFilesToDelete([]);
    setOriginalData({
      category: "",
      title: "",
      content: "",
      existingFiles: [],
    });
  };

  // 수정 모드: 원본으로 복원
  const resetToOriginal = () => {
    setConfirmModal({
      isOpen: true,
      message: "원본 상태로 되돌리시겠습니까?", 
      onConfirm: () => {
        setCategory(originalData.category);
        setTitle(originalData.title);
        setContent(originalData.content);
        setExistingFiles(originalData.existingFiles);
        setFilesToDelete([]);
        setSelectedFiles([]);
        setConfirmModal({ isOpen: false, message: "", onConfirm: () => {} })
      }
    });
  };

  // 초기화 핸들러
  const handleReset = () => {
    if (postId) {
      resetToOriginal();
    } else {
      if (title || content || selectedFiles.length > 0) {
        setConfirmModal({
          isOpen: true,
          message: "작성 중인 내용을 모두 지우시겠습니까?", // 알림 메시지 형태로 변경
          onConfirm: () => {
            resetForm();
            setConfirmModal({ isOpen: false, message: "", onConfirm: () => {} })
          }
        })
      }
    }
  };

  // 수정 모드: 변경 여부 확인
  const hasChanges = () => {
    if (!postId) return false;
    return (
      category !== originalData.category ||
      title !== originalData.title ||
      content !== originalData.content ||
      selectedFiles.length > 0 ||
      filesToDelete.length > 0
    );
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDeleteExisting = (fileId) => {
    setFilesToDelete((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!category) {
      setValidationModal({ isOpen: true, message: "카테고리를 선택해주세요." });
      return;
    }
    if (!title.trim()) {
      setValidationModal({ isOpen: true, message: "제목을 입력해주세요." });
      return;
    }
    if (!content.trim()) {
      setValidationModal({ isOpen: true, message: "내용을 입력해주세요." });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("memberId", user.memberId);
      formData.append("title", title);
      formData.append("content", content);
      formData.append("category", category);

      selectedFiles.forEach((file) => {
        formData.append("uploadFile", file);
      });

      if (postId) {
        filesToDelete.forEach((fileId) => {
          formData.append("delFileIds", fileId);
        });
        await communityApi.communityUpdate(postId, formData);
        resetForm();
        onClose();
        if (onSuccess) onSuccess("게시글이 수정되었습니다.");
      } else {
        await communityApi.communityInsert(formData);
        resetForm();
        onClose();
        if (onSuccess) onSuccess("게시글이 등록되었습니다.");
      }
    } catch (error) {
        console.error("제출 실패:", error);
        setValidationModal({
          isOpen: true,
          message: postId ? "수정 중 오류가 발생했습니다." : "등록 중 오류가 발생했습니다.",
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (postId && hasChanges()) {
      setConfirmModal({
        isOpen: true,
        message: "변경된 내용이 있습니다. 정말 닫으시겠습니까?", 
        onConfirm: () => {
          resetForm();
          onClose();
          setConfirmModal({ isOpen: false, message: "", onConfirm: () => {} })
        },
      });
      return;
    }
    
    if (!postId && (title || content || selectedFiles.length > 0)) {
      setConfirmModal({
        isOpen: true,
        message: "작성 중인 내용이 있습니다. 정말 닫으시겠습니까?", 
        onConfirm: () => {
          resetForm();
          onClose();
          setConfirmModal({ isOpen: false, message: "", onConfirm: () => {} })
        },
      });
      return;
    }
    
    resetForm();
    onClose();
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={postId ? "게시글 수정" : "게시글 작성"}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <label className={styles.formLabel}><span className={styles.required}>*</span> 카테고리</label>
            <div className={styles.categoryGroup}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.categoryBtn} ${category === cat ? styles.active : ""}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}><span className={styles.required}>*</span> 제목</label>
            <div className={styles.titleInput}>  
              <Input
                placeholder="제목을 입력하세요 (최대 200자)"
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}><span className={styles.required}>*</span> 내용</label>
            <textarea
              className={styles.textareaContent}
              placeholder="내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {postId && existingFiles.length > 0 && (
            <div className={styles.formRow}>
              <label className={styles.formLabel}>기존 파일 (삭제할 이미지 선택)</label>
              <div className={styles.existingFiles}>
                {existingFiles.map((file) => (
                  <div
                    key={file.filesId}
                    className={`${styles.existingFileItem} ${filesToDelete.includes(file.filesId) ? styles.toDelete : ""}`}
                    onClick={() => toggleDeleteExisting(file.filesId)}
                  >
                    <img
                      src={getFullUrl2(`/community/file/${file.changeName}`)}
                      alt={file.originName}
                      className={styles.existingFileImg}
                    />
                    <input
                      type="checkbox"
                      className={styles.deleteCheckbox}
                      checked={filesToDelete.includes(file.filesId)}
                      onChange={() => toggleDeleteExisting(file.filesId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className={styles.deleteOverlay}>삭제 예정</div>
                  </div>
                ))}
              </div>
              <div className={styles.divider} />
            </div>
          )}

          <div className={styles.formRow}>
            <label className={styles.formLabel}>{postId ? "새 파일 추가" : "파일 첨부"}</label>
            <div className={styles.fileArea}>
              <input type="file" id="fileInput" className={styles.fileInput} multiple accept="image/*" onChange={handleFileChange} />
              <label htmlFor="fileInput" className={styles.fileLabel}>📎 파일 선택</label>
              <p style={{color: "var(--gray-600)"}}>이미지 파일만 첨부 가능합니다</p>
            </div>
            {selectedFiles.length > 0 && (
              <div className={styles.fileList}>
                {selectedFiles.map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                    <span className={styles.fileName}>📷 {file.name}</span>
                    <button type="button" className={styles.fileRemove} onClick={() => removeFile(index)}>삭제</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={handleReset} disabled={isSubmitting}>초기화</button>
          <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>{isSubmitting ? "처리 중..." : postId ? "수정 완료" : "등록"}</button>
        </div>
      </form>
    </Modal>

    {/* ── [기존 유지] 유효성 검사 모달 (type="alert" 적용) ── */}
    <CustomModal
      isOpen={validationModal.isOpen}
      type="alert" 
      message={validationModal.message}
      onConfirm={() => setValidationModal({ isOpen: false, message: "" })}
      zIndex={15000}
    />

    {/* ── [기존 유지] 확인 모달 (type="alert" 적용하여 확인 버튼만 노출) ── */}
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
}

export default CommunityWriteModal;