import Profile from "../../components/common/Profile";

const MyPage = () => {
  const grades = ["normal", "rare", "epic", "legendary"];

  return (
    <div style={{ padding: "40px", background: "#111", display: "flex", flexDirection: "column", gap: "50px" }}>
      {grades.map(grade => (
        <div key={grade}>
          <h2 style={{ color: "#fff", marginBottom: "20px", textTransform: "uppercase" }}>{grade} Titles</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "20px" }}>
            {[1,2,3,4,5,6,7,8,9,10].map(num => (
              <Profile 
                key={`${grade}-${num}`}
                presetId={`${grade}-${num}`} 
                userName={`${grade.toUpperCase()} USER`} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyPage;