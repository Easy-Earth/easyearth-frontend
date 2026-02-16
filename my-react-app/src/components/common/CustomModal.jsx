import { useEffect } from 'react';
import styles from './CustomModal.module.css';

function CustomModal({ isOpen, title, message, onConfirm, onCancel, type = 'alert', zIndex }) {
  if (!isOpen) return null;

  const overlayStyle = zIndex ? { zIndex } : {};

  // ✨ 사용자 경험을 위헤 엔터 키 입력시 확인 버튼 동작 추가/ESC도 동작(기본)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onConfirm]);

  return (
    <div className={styles.overlay} style={overlayStyle}>
      <div className={styles.modal}>
        <div className={styles.content}>
          {title && <h4 className={styles.title}>{title}</h4>}
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.buttonGroup}>
          {type === 'confirm' && (
            <button className={styles.cancelBtn} onClick={onCancel}>
              취소
            </button>
          )}
          <button className={styles.confirmBtn} onClick={onConfirm}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomModal;