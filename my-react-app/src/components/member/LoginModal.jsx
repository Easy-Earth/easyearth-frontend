import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Link 추가
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import Modal from "../common/Modal";
import Input from "../common/Input";
import styles from "./LoginModal.module.css";

function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ loginId: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await login(formData);

    if (result.success) {
      onClose();
      setFormData({ loginId: "", password: "" });
      navigate("/"); // 로그인 성공 시 메인으로 이동 (필요시)
    } else {
      setError(result.message || "아이디 또는 비밀번호를 확인해주세요.");
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setFormData({ loginId: "", password: "" });
    setError("");
    onClose();
  };

  // 회원가입 클릭 시 모달 닫기
  const handleSignupClick = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="로그인" size="sm">
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="아이디"
            type="text"
            name="loginId"
            value={formData.loginId}
            onChange={handleChange}
            placeholder="아이디를 입력하세요"
            required
            fullWidth
          />
          <Input
            label="비밀번호"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요"
            required
            fullWidth
          />

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.buttons}>
            <button
              type="submit"
              disabled={isLoading} // loading 대신 disabled 속성 사용
              className={styles.submitBtn} // fullWidth 등 스타일은 CSS 클래스에 포함시키세요
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </form>

        <div className={styles.footer}>
          <p>
            아직 회원이 아니신가요?{" "}
            <Link to="/join" onClick={handleSignupClick} className={styles.signupLink}>
              회원가입
            </Link>
          </p>
          <button 
            type="button" 
            className={styles.findPwdBtn} 
            onClick={() => { onClose(); navigate("/find-password"); }}
          >
            비밀번호를 잊으셨나요?
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default LoginModal;