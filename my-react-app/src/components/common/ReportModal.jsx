import { useState } from "react";
import styles from "./ReportModal.module.css";

function ReportModal({ isOpen, onClose, reporterId,reporterName, targetId, targetName,onSubmit,esrId}) {
  const [reportTag, setReportTag] = useState("부적절한 콘텐츠");
  const [details, setDetails] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      reporterId,
      targetId,
      reportTag,
      details,
    }); 
    setDetails("");
    setReportTag("부적절한 콘텐츠");
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>🚨 신고하기</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.infoGroup}>
            <div className={styles.infoItem}>
              <span className={styles.label}>신고자</span>
              <span className={styles.value}>{reporterName}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>신고 대상</span>
              <span className={styles.value}>{targetName}</span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>신고 사유</label>
            <select 
              className={styles.select}
              value={reportTag} 
              onChange={(e) => setReportTag(e.target.value)}
            >
              <option value="부적절한 콘텐츠">부적절한 콘텐츠</option>
              <option value="스팸/홍보성">스팸/홍보성</option>
              <option value="욕설/비방">욕설/비방</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>상세 내용</label>
            <textarea
              className={styles.textarea}
              placeholder="상세한 사유를 적어주세요."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
            />
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>취소</button>
            <button type="submit" className={styles.submitBtn}>제출하기</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;