import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  // ✨ LocalStorage에서 초기값 로드
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("알림 로드 실패", e);
      return [];
    }
  });

  // ✨ 상태 변경 시 LocalStorage에 저장
  React.useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // 알림 추가
  const addNotification = (notification) => {
    const safeNotification = {
      ...notification,
      id: notification.id || `noti-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: notification.read || false,
      createdAt: notification.createdAt || new Date().toISOString()
    };
    setNotifications(prev => [safeNotification, ...prev].slice(0, 50)); // 최대 50개
  };

  // 알림 읽음 처리
  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  // 알림 제거
  const removeNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
  };

  // 특정 채팅방의 모든 알림 읽음 처리
  const markNotificationsAsReadForRoom = (chatRoomId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.chatRoomId === String(chatRoomId) || n.chatRoomId === Number(chatRoomId) 
          ? { ...n, read: true } 
          : n
      )
    );
  };

  // 모든 알림 제거
  const clearAll = () => {
    setNotifications([]);
  };

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        markNotificationsAsReadForRoom,
        removeNotification,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
