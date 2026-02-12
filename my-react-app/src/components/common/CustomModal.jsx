import styles from './CustomModal.module.css';

function CustomModal({ isOpen, title, message, onConfirm, onCancel, type = 'alert', zIndex }) {
  if (!isOpen) return null;

  const overlayStyle = zIndex ? { zIndex } : {};

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