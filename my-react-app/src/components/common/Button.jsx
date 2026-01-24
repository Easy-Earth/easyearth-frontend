import styles from "./Button.module.css";

const Button = ({
  color = "var(--gray-300)",
  width = "40px",
  height = "40px",
  children,
  onClick,
  hover,
  disabled = false,
}) => {
  return (
    <button
      className={styles.button}
      style={{
        backgroundColor: color,
        width,
        height,
        "--btn-hover": hover,
      }}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};

export default Button;
