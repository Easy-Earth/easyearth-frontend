import { memo } from "react";
import { COLORS } from "../../styles/tokens/colors";

const Button = ({
  color = COLORS.GRAY_300,
  width = "40px",
  height = "40px",
  children,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: color,
        width,
        height,
        border: "none",
        borderRadius: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontWeight: "500",
      }}
    >
      {children}
    </button>
  );
};

export default memo(Button);
