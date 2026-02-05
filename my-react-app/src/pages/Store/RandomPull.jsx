import { useState } from "react";
import CustomModal from "../../components/common/CustomModal";
import { randomPull } from "../api/itemApi";

const RandomPull = () => {
  const [result, setResult] = useState(null);
  const memberId = 1; // 테스트용

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {}
  });

  const handlePull = async () => {
    try {
      const data = await randomPull(memberId);
      setResult(data);
    } catch (error) {
      console.error(error);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        message: '포인트가 부족하거나 오류가 발생했습니다.',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
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

      <CustomModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default RandomPull;