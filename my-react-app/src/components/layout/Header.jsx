// src/components/layout/Header.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./Header.module.css";

const Header = ({ openLoginModal }) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const menuItems = [
    { id: 1, title: "메인 페이지", link: "/" },
    { id: 2, title: "지도 탐색", link: "/map" },
    { id: 3, title: "커뮤니티", link: "/community" },
    { id: 4, title: "건의사항", link: "/suggestions" },
    { id: 5, title: "포인트샵", link: "/shop" },
    { id: 6, title: "채팅", link: "/chat" },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/">EasyEarth</Link>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.menuList}>
          {menuItems.map(item => (
            <li key={item.id} className={styles.menuItem}>
              <Link to={item.link}>{item.title}</Link>
            </li>
          ))}
          {isAuthenticated && (
            <li className={styles.menuItem}><Link to="/mypage">마이페이지</Link></li>
          )}
        </ul>
      </nav>

      <div className={styles.auth}>
        {!isAuthenticated ? (
          <>
            <button className={styles.loginBtn} onClick={openLoginModal}>Sign in</button>
            <button className={styles.registerBtn} onClick={() => navigate("/join")}>Sign up</button>
          </>
        ) : (
          <>
            <span className={styles.welcome}>{user?.name || "회원"}님</span>
            <button className={styles.logoutBtn} onClick={() => { logout(); navigate("/"); }}>로그아웃</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;