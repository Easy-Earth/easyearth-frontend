import { useEffect } from 'react';
import styles from './CustomModal.module.css';

function CustomModal({ isOpen, title, message, onConfirm, onCancel, type = 'alert', zIndex }) {
  const overlayStyle = zIndex ? { zIndex } : {};

  // ✨ 사용자 경험을 위헤 엔터 키 입력시 확인 버튼 동작 추가/ESC도 동작(기본)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // isOpen일 때만 동작하도록 가드 추가 (이중 안전장치)
      if (isOpen && e.key === 'Enter') {
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

  if (!isOpen) return null;

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