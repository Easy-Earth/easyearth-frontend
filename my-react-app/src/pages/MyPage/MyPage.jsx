import badgeImg25 from "../../assets/badges/epic/badge_25.png";
import badgeImg33 from "../../assets/badges/legendary/badge_33.png";
import titleImg from "../../assets/titles/common/normal-1.png";
import Profile from "../../components/common/Profile";
const MyPage = () => {
  return (
    <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "20px", background: "#f0f0f0" }}>
      <Profile 
        presetId="epic-7" 
        userName="Name1" 
        badgeImage={badgeImg33} 
        titleImage={titleImg}
      />
      <Profile 
        presetId="legendary-4" 
        userName="Name2" 
        badgeImage={badgeImg25} 
        titleImage={titleImg}
      />
    </div>
  );
};

export default MyPage;