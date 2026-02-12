import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Modal from "../common/Modal";
import Input from "../common/Input";
import styles from "./LoginModal.module.css";

function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ loginId: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.loginId.trim()) {
      setError("아이디를 입력해주세요.");
      return;
    }

    if (!formData.password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await login(formData);

      if (result.success) {
        onClose();
        setFormData({ loginId: "", password: "" });
        setShowPassword(false);
        navigate("/"); 
      } else {
        // 서버에서 success: false로 응답한 경우 (401 에러 포함)
        console.warn("로그인 실패 사유:", result.message);
        setError(result.message || "아이디 또는 비밀번호를 확인해주세요.");
      }
    } catch (err) {
      // [수정 핵심] console.err -> console.error로 변경
      // 이제 콘솔에 'TypeError: console.err is not a function' 대신 실제 에러 객체가 찍힙니다.
      console.error("로그인 통신 중 에러 발생:", err);
      setError("아이디 또는 비밀번호가 일치하지 않습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ loginId: "", password: "" });
    setError("");
    setShowPassword(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="로그인" size="sm">
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label="아이디"
            type="text"
            name="loginId"
            value={formData.loginId}
            onChange={handleChange}
            placeholder="아이디를 입력하세요"
            fullWidth
          />
          
          <div className={styles.passwordWrapper}>
            <Input
              label="비밀번호"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              fullWidth
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
            >
              {showPassword ? "숨기기" : "보기"}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.buttons}>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </form>

        <div className={styles.footer}>
          <p>
            아직 회원이 아니신가요?{" "}
            <Link to="/join" onClick={() => onClose()} className={styles.signupLink}>
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