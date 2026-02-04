// components/member/LoginModal.js
import { useState } from "react";
import { useAuth } from "../../context/AuthContext"; // 상대경로
import Button from "../common/Button";
import Modal from "../common/Modal";
import Input from "../common/Input";
import styles from "./LoginModal.module.css"; // CSS 모듈 파일명 확인

function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ loginId: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setFormData({ loginId: "", password: "" });
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="로그인" size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="ID"
          type="text"
          name="loginId"
          value={formData.loginId}
          onChange={handleChange}
          placeholder="아이디를 입력하세요"
          required
          fullWidth
        />
        <Input
          label="Password"
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
          <button type="submit" variant="primary" fullWidth loading={isLoading}>
            로그인
          </button>
          <Button type="button" variant="danger" fullWidth onClick={handleClose}>
            취소
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default LoginModal;
