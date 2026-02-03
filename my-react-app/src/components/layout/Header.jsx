import styles from './Header.module.css';

const Header = () => {
  const menuItems = [
    { id: 1, title: '지도 탐색', link: '#' },
    { id: 2, title: '테마별 장소', link: '#' },
    { id: 3, title: '추천 코스', link: '#' },
    { id: 4, title: '커뮤니티', link: '#' },
    { id: 5, title: '공지사항', link: '#' },
    { id: 6, title: '마이페이지', link: '#' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <a href="/">EasyEarth</a>
      </div>
      
      <nav className={styles.nav}>
        <ul className={styles.menuList}>
          {menuItems.map((item) => (
            <li key={item.id} className={styles.menuItem}>
              <a href={item.link}>{item.title}</a>
            </li>
          ))}
        </ul>
      </nav>

      {/* 우측 균형을 맞추기 위한 빈 공간 또는 로그인 버튼 자리 */}
      <div className={styles.auth}>
        <button className={styles.loginBtn}>Login</button>
      </div>
    </header>
  );
};

export default Header;