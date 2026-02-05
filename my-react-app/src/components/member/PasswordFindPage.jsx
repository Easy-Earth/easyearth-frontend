import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../../apis/authApi";
import CustomModal from "../common/CustomModal";
import styles from "./PasswordFindPage.module.css";

function PasswordFindPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ 
    loginId: "", 
    name: "" 
  });
  
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState(""); 
  const [copied, setCopied] = useState(false); 

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); 
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authApi.findPassword(formData);

      if (result && result.tempPassword) {
        setTempPassword(result.tempPassword);
      } else {
        setModalConfig({
          isOpen: true,
          message: "일치하는 회원 정보가 없습니다."
        });
      }
    } catch (err) {
      console.error("비밀번호 찾기 오류:", err);
      const errorMsg = err.response?.data || "입력하신 정보와 일치하는 계정이 없습니다.";
      setModalConfig({
        isOpen: true,
        message: typeof errorMsg === 'string' ? errorMsg : "정보가 일치하지 않습니다."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>비밀번호 찾기</h2>
        
        {!tempPassword ? (
          <>
            <p className={styles.description}>
              가입하신 아이디와 이름을 입력하시면<br />
              임시 비밀번호를 발급해 드립니다.
            </p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <input
                  name="loginId"
                  value={formData.loginId || ""}
                  onChange={handleChange}
                  placeholder="아이디를 입력하세요"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <input
                  name="name" 
                  value={formData.name || ""}
                  onChange={handleChange}
                  placeholder="이름을 입력하세요"
                  className={styles.input}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className={styles.mainBtn}>
                {loading ? "조회 중..." : "임시 비밀번호 발급"}
              </button>
            </form>
          </>
        ) : (
          <div className={styles.resultView}>
            <div className={styles.successIcon}>🔑</div>
            <p className={styles.successMsg}>
              회원님의 정보가 확인되었습니다.<br />
              임시 비밀번호는 아래와 같습니다.
            </p>
            
            <div className={styles.tempPasswordWrapper}>
              <div className={styles.tempPasswordBox}>
                {tempPassword}
              </div>
              <button 
                onClick={handleCopy} 
                className={styles.copyBtn}
              >
                {copied ? "복사완료!" : "복사하기"}
              </button>
            </div>

            <p className={styles.notice}>
              보안을 위해 로그인 후 반드시<br />
              <strong>비밀번호를 변경</strong>해 주시기 바랍니다.
            </p>
            
            <button 
                onClick={() => navigate("/", { state: { openLogin: true } })} 
                className={styles.mainBtn}
                >
                로그인하러 가기
            </button>
          </div>
        )}
        
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          이전으로 돌아가기
        </button>
      </div>

      <CustomModal 
        isOpen={modalConfig.isOpen}
        type="alert"
        message={modalConfig.message}
        onConfirm={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  );
}

export default PasswordFindPage;