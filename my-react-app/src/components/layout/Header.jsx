import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/easyearthLOGO.png";
import kakaoBtnImg from "../../assets/images/kakaoBtn.png";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { useChat } from "../../context/ChatContext";
import CustomModal from "../common/CustomModal";
import styles from "./Header.module.css";

const Header = ({ openLoginModal }) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'alert',
    onConfirm: () => {} 
  });

  const KAKAO_CLIENT_ID = "061190308402a6afceaaba4ac72b5c83";
  const KAKAO_REDIRECT_URI = "http://localhost:5173/kakao/callback";
  const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;

  const handleKakaoLogin = () => {
    window.location.href = kakaoURL;
  };

  const handleLogoutClick = () => {
    setModalConfig({
      isOpen: true,
      title: '로그아웃',
      message: '정말 로그아웃 하시겠습니까?',
      type: 'confirm',
      onConfirm: () => {
        logout();
        navigate("/");
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const menuItems = [
    { id: 1, title: "메인 페이지", link: "/" },
    { id: 2, title: "지도 탐색", link: "/map" },
    { id: 3, title: "커뮤니티", link: "/community" },
    { id: 4, title: "건의사항", link: "/inquiries" },
    { id: 5, title: "포인트샵", link: "/shop" },
    { id: 6, title: "채팅", link: "/chat" },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/">
          <img src={logo} alt="EasyEarth Logo" className={styles.logoImg} />
        </Link>
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
          {isAuthenticated && user?.memberId === 1 && (
            <li className={styles.menuItem}><Link to="/reports">신고 관리</Link></li>
          )}
        </ul>
      </nav>

      <div className={styles.auth}>
        {!isAuthenticated ? (
          <>
            <img 
              src={kakaoBtnImg} 
              alt="카카오 로그인" 
              onClick={handleKakaoLogin}
              style={{ cursor: 'pointer', height: '35px', marginRight: '10px' }} 
            />
            <button className={styles.loginBtn} onClick={openLoginModal}>Sign In</button>
            <button className={styles.registerBtn} onClick={() => navigate("/join")}>Sign Up</button>
          </>
        ) : (
          <>
            <span className={styles.welcome}>{user?.name || "회원"}님</span>
            <button className={styles.logoutBtn} onClick={handleLogoutClick}>Sign Out</button>
          </>
        )}
        {isAuthenticated && <NotificationCenter setModalConfig={setModalConfig} />}
      </div>

      <CustomModal 
        {...modalConfig} 
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </header>
  );
};

const NotificationCenter = ({ setModalConfig }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotification();
    const { loadChatRooms } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        if (notification.type === 'INVITATION') {
            navigate('/chat');
        } else if (notification.type === 'CHAT') {
             navigate(`/chat/${notification.chatRoomId}`);
             loadChatRooms(); // 채팅 목록 unreadCount 즉시 갱신
        } else if (notification.type === 'KICK') {
             setModalConfig({
                 isOpen: true,
                 title: '알림',
                 message: notification.content,
                 type: 'alert',
                 onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
             });
        }
        setIsOpen(false);
    };

    const getNotificationMessage = (notification) => {
        if (notification.messageType === 'IMAGE') return '사진을 보냈습니다.';
        if (notification.messageType === 'FILE') return '파일을 보냈습니다.';
        return notification.content;
    };

    return (
        <div className={styles.notificationCenter} ref={dropdownRef}>
            <button className={`${styles.bellBtn} ${unreadCount > 0 ? styles.activeBell : ''}`} onClick={() => setIsOpen(!isOpen)}>
                🔔{unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>
            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <span>알림</span>
                        {unreadCount > 0 && <button className={styles.markAllBtn} onClick={markAllAsRead}>모두 읽음</button>}
                    </div>
                    <ul className={styles.notificationList}>
                        {notifications.length === 0 ? (
                            <li className={styles.emptyItem}>새로운 알림이 없습니다.</li>
                        ) : (
                            [...notifications]
                                .sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1))
                                .map(n => (
                                <li 
                                    key={n.id} 
                                    className={`${styles.notificationItem} ${n.read ? styles.read : ''}`}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <div className={styles.notificationContent}>
                                        <div className={styles.notificationHeader}>
                                            <div className={styles.headerText}>
                                                <div className={styles.senderInfo}>
                                                    {n.roomName && (
                                                        <span className={styles.roomName}>[{n.roomName}]</span>
                                                    )}
                                                    <span className={styles.notificationSender}>{n.senderName}</span>
                                                </div>
                                                <span className={styles.notificationTime}>
                                                    {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.notificationText}>{getNotificationMessage(n)}</div>
                                    </div>
                                    <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}>×</button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Header;