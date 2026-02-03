import { Link, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {
  const navigate = useNavigate(); 

  const menuItems = [
    { id: 1, title: '메인 페이지', link: '/' },
    { id: 2, title: '지도 탐색', link: '/map' },
    { id: 3, title: '커뮤니티', link: '/community' },
    { id: 4, title: '건의사항', link: '/suggestions' },
    { id: 5, title: '포인트샵', link: '/shop' },
    { id: 6, title: '마이페이지', link: '/mypage' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/">EasyEarth</Link>
      </div>
      
      <nav className={styles.nav}>
        <ul className={styles.menuList}>
          {menuItems.map((item) => (
            <li key={item.id} className={styles.menuItem}>
            
              <Link to={item.link}>{item.title}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.auth}>
        <button 
          className={styles.loginBtn} 
          //onClick={}
        >
          Sign in
        </button>
        
        <button 
          className={styles.registerBtn}
          onClick={() => navigate('/signup')}
        >
          Sign up
        </button>
      </div>
    </header>
  );
};

export default Header;