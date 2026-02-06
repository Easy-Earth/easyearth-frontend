import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { getChatRooms } from '../apis/chatApi';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // 전역 클라이언트 ref (재렌더링 방지)
  const stompClientRef = useRef(null);

  // 1. 채팅방 목록 로드
  const loadChatRooms = useCallback(async () => {
    if (!user?.id) return;
    console.log("ChatContext user object:", user); // Debugging user structure
    try {
      const rooms = await getChatRooms(user.id);
      setChatRooms(rooms);
      
      // 전체 안 읽은 메시지 수 계산
      const totalUnread = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
      setTotalUnreadCount(totalUnread);
    } catch (error) {
      console.error("채팅방 목록 로드 실패", error);
    }
  }, [user?.id]);

  // 2. WebSocket 연결 (앱 실행 시 1번만)
  useEffect(() => {
    if (!user?.id) return; // user.id가 없으면 연결 시도 안 함

    loadChatRooms(); // 초기 로드

    const socket = new SockJS('/spring/ws-chat');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Chat/Global WebSocket Connected');
        setConnected(true);

        // 내 전용 알림 채널 구독 (새 메시지, 초대 등)
        stompClient.subscribe(`/topic/user/${user.id}`, (message) => {
          const notification = JSON.parse(message.body);
          console.log('Global Notification:', notification);
          
          // NotificationContext에 알림 추가
          addNotification({
            id: Date.now() + Math.random(), // 고유 ID 생성
            ...notification,
            read: false
          });
          
          // 알림 오면 목록 갱신
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
  }, [user?.id, loadChatRooms]);

  return (
    <ChatContext.Provider value={{ 
      client, 
      connected, 
      chatRooms, 
      loadChatRooms, 
      totalUnreadCount 
    }}>
      {children}
    </ChatContext.Provider>
  );
};
