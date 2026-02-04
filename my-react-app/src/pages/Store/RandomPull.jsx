import { useState } from "react";
import { randomPull } from "../api/itemApi";

const RandomPull = () => {
  const [result, setResult] = useState(null);
  const memberId = 1; // 테스트용

  const handlePull = async () => {
    try {
      const data = await randomPull(memberId);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("랜덤 뽑기 실패");
    }
  };

  return (
    <div>
      <h2>랜덤 뽑기</h2>
      <button onClick={handlePull}>뽑기</button>
      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>당첨 결과:</h3>
          {typeof result === "string" ? result : JSON.stringify(result)}
        </div>
      )}
    </div>
  );
};

export default RandomPull;
