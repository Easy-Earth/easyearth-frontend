// src/components/layout/Header.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import React from 'react';
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
            <button className={styles.loginBtn} onClick={openLoginModal}>Sign In</button>
            <button className={styles.registerBtn} onClick={() => navigate("/join")}>Sign Up</button>
          </>
        ) : (
          <>
            <span className={styles.welcome}>{user?.name || "회원"}님</span>
            <button className={styles.logoutBtn} onClick={() => { logout(); navigate("/"); }}>Sign Out</button>
          </>
        )}
        {isAuthenticated && <NotificationCenter />}
      </div>
    </header>
  );
};

// Helper function to get full image URL
const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8080${path}`;
};

// Internal Component for Notification Center
const NotificationCenter = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotification();
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    React.useEffect(() => {
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
        if (notification.type === 'INVITATION' || notification.type === 'CHAT') {
             navigate(`/chat/${notification.chatRoomId}`);
        } else if (notification.type === 'KICK') {
             alert(notification.content);
        }
        setIsOpen(false);
    };

    // ✨ 알림 메시지 변환 함수
    const getNotificationMessage = (notification) => {
        // 1. messageType이 있으면 우선 사용
        if (notification.messageType === 'IMAGE') return '사진을 보냈습니다.';
        if (notification.messageType === 'FILE') return '파일을 보냈습니다.';
        
        // 2. 없으면 content 패턴 매칭 (fallback - 구 버전 호환)
        if (notification.content && notification.content.includes('/chat/file/message')) {
             return '파일을 보냈습니다.';
        }
        return notification.content;
    };

    return (
        <div className={styles.notificationCenter} ref={dropdownRef}>
            <button 
                className={`${styles.bellBtn} ${unreadCount > 0 ? styles.activeBell : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
            >
                🔔
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <span>알림</span>
                        {unreadCount > 0 && (
                            <button className={styles.markAllBtn} onClick={markAllAsRead}>모두 읽음</button>
                        )}
                    </div>
                    <ul className={styles.notificationList}>
                        {notifications.length === 0 ? (
                            <li className={styles.emptyItem}>새로운 알림이 없습니다.</li>
                        ) : (
                            notifications.map(notification => (
                                <li 
                                    key={notification.id} 
                                    className={`${styles.notificationItem} ${notification.read ? styles.read : ''}`}
                                    onClick={() => handleNotificationClick(notification)} // ✨ 클릭 핸들러 상위 이동
                                >
                                    <div className={styles.notificationContent}>
                                        <div className={styles.notificationHeader}>
                                            <div className={styles.headerText}>
                                                <div className={styles.senderInfo}>
                                                    {/* ✨ 채팅방 이름이 있으면 표시 (그룹챗 등) */}
                                                    {notification.roomName && (
                                                        <span className={styles.roomName}>[{notification.roomName}]</span>
                                                    )}
                                                    <span className={styles.notificationSender}>{notification.senderName}</span>
                                                </div>
                                                <span className={styles.notificationTime}>{new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </div>
                                        <div className={styles.notificationText}>{getNotificationMessage(notification)}</div>
                                    </div>
                                    <button 
                                        className={styles.deleteBtn} 
                                        onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }}
                                    >
                                        ×
                                    </button>
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