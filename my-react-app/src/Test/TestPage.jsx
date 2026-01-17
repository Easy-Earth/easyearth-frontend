import Button from "../components/common/Button";
import { COLORS } from "../styles/tokens/colors";

const TestPage = () => {
  return (
    <div style={{ display: "flex", gap: "12px" }}>
      <Button
        color={COLORS.GREEN}
        width="120px"
        height="48px"
        onClick={() => alert("확인")}
      >
        확인
      </Button>

      <Button
        color={COLORS.BTN_NEGATIVE}
        width="120px"
        height="48px"
      >
        취소
      </Button>

      <Button>+</Button>
    </div>
  );
};

export default TestPage;
