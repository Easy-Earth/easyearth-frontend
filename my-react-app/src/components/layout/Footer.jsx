import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* 상단: 브랜드 및 간단한 설명 */}
        <div className={styles.topSection}>
          <div className={styles.logo}>EasyEarth</div>
          <p className={styles.description}>
            지속 가능한 지구를 위한 첫 걸음, <br />
            우리 동네 친환경 지도를 탐색해보세요.
          </p>
        </div>

        {/* 중앙: 6개 메뉴와 동일한 카테고리 또는 정보 */}
        <div className={styles.linkSection}>
          <ul className={styles.footerLinks}>
            <li><a href="#">서비스 소개</a></li>
            <li><a href="#">이용약관</a></li>
            <li><a href="#">개인정보처리방침</a></li>
            <li><a href="#">고객센터</a></li>
            <li><a href="#">제휴문의</a></li>
            <li><a href="#">사이트맵</a></li>
          </ul>
        </div>

        {/* 하단: 저작권 및 SNS (생략 가능) */}
        <div className={styles.bottomSection}>
          <p className={styles.copyright}>
            © 2026 EasyEarth Team. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;