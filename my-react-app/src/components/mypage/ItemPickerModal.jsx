import styles from "./ItemPickerModal.module.css";

export default function ItemPickerModal({ type, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{type} 변경</h3>
        <p>보유 아이템 중에서 선택 (기능 연결 예정)</p>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
