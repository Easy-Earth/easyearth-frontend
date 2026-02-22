import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { getChatRooms } from '../apis/chatApi';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const { addNotification } = useNotification();
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [lastReadEvent, setLastReadEvent] = useState(null); // 개인 채널 READ_UPDATE 공유용

  const stompClientRef = useRef(null);

  // 채팅방 목록 조회 및 전체 안 읽은 수 갱신
  const loadChatRooms = useCallback(async () => {
    if (!user?.memberId) return;
    try {
      const rooms = await getChatRooms(user.memberId);
      setChatRooms(rooms);
      const totalUnread = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
      setTotalUnreadCount(totalUnread);
    } catch (error) {
      console.error("채팅방 목록 로드 실패", error);
    }
  }, [user?.memberId]);

  // WebSocket 연결 및 전역 알림 구독
  useEffect(() => {
    if (!user?.memberId) return;

    loadChatRooms();

    const token = localStorage.getItem('token');
    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${window.location.protocol}//${window.location.hostname}:8080/spring/ws-chat`),
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Chat/Global WebSocket Connected');
        setConnected(true);

        stompClient.subscribe(`/topic/user/${user.memberId}`, (message) => {
          const notification = JSON.parse(message.body);
          console.log('Global Notification:', notification);
          
          if (notification.type === 'LEAVE_ROOM_SUCCESS' || notification.type === 'CHAT_LIST_REFRESH') {
              loadChatRooms();
              return; 
          }
          
          if (notification.type === 'READ_UPDATE') {
              setLastReadEvent(notification); // ChatRoomDetail에서 useEffect로 감지
              return;
          }

          if (notification.type === 'PROFILE_UPDATE') {
              console.log('Profile Update:', notification);
              if (updateUser) {
                  updateUser({ profileImageUrl: notification.profileImageUrl });
              }
              loadChatRooms();
              return;
          }

          if (notification.type === 'KICK') {
              console.log('Kick notification:', notification);
              loadChatRooms();
              
              const currentPath = window.location.pathname;
              if (currentPath.includes(`/chat/${notification.chatRoomId}`)) {
                  alert("강퇴당했습니다.");
                  window.location.href = '/chat';
              }
              
              addNotification({
                  ...notification,
                  id: Date.now() + Math.random(),
                  read: false
              });
              return;
           }

          if (notification.type === 'INVITATION') {
              console.log('Invitation received:', notification);
              loadChatRooms();
          }

          const currentPath = window.location.pathname;
          const targetRoomId = notification.chatRoomId;
          const isViewingChat = currentPath.includes(`/chat/${targetRoomId}`);

          if (!isViewingChat) {
              addNotification({
                ...notification,
                id: Date.now() + Math.random(),
                read: false
              });
          }
          
          loadChatRooms();
        });
      },
      onStompError: (frame) => {
        console.error('WebSocket Error', frame);
      },
      onDisconnect: () => {
        setConnected(false);
      }
    });

    stompClient.activate();
    stompClientRef.current = stompClient;
    setClient(stompClient);

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [user?.memberId, loadChatRooms]);

  return (
    <ChatContext.Provider value={{ 
      client, 
      connected, 
      chatRooms, 
      loadChatRooms, 
      totalUnreadCount,
      lastReadEvent
    }}>
      {children}
    </ChatContext.Provider>
  );
};
