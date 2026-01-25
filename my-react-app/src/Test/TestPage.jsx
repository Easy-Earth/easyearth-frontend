import Button from "../components/common/Button";
import Profile from "../components/common/Profile";


const TestPage = () => {
  return (
    <div style={{ display: "flex", gap: "12px" }}>
      <Button color="var(--btn-primary)" width="120px" height="44px">
        확인
      </Button>

      <Button color="var(--btn-danger)" width="120px" height="44px" hover="var(--eco-mint)">
        삭제
      </Button>

      <Button color="var(--green-300)" width="300px">
        초록 버튼
      </Button>

      <Profile
        presetId="legendary-6"
        profileImage="https://placehold.co/72x72"
        titleId="normal-1"
        badgeId="legendary-1"
        userName="유지훈"
      />


    </div>
  );
};

export default TestPage;
