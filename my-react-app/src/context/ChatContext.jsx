import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { getChatRooms } from '../apis/chatApi';

//채팅 관련 기능을 담을 Context 생성
const ChatContext = createContext();

//채팅 관련 기능을 사용하기 위한 훅
export const useChat = () => useContext(ChatContext);

//채팅 관련 기능을 제공하는 컴포넌트
export const ChatProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const { addNotification } = useNotification();
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // 전역 클라이언트 ref (재렌더링 방지)
  const stompClientRef = useRef(null);

  // 1. 채팅방 목록 로딩 함수
  const loadChatRooms = useCallback(async () => {
    if (!user?.id) return;
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

    loadChatRooms();

    //WebSocket 연결
    const socket = new SockJS('/spring/ws-chat');
    
    //STOMP 클라이언트 생성
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      //연결 성공 시
      onConnect: () => {
        console.log('Chat/Global WebSocket Connected');
        setConnected(true);

        // 내 전용 알림 채널 구독 (새 메시지, 초대 등)
        stompClient.subscribe(`/topic/user/${user.id}`, (message) => {
          const notification = JSON.parse(message.body);
          console.log('Global Notification:', notification);
          
          // [Real-time] 채팅방 목록 갱신 전용 이벤트
          if (notification.type === 'LEAVE_ROOM_SUCCESS' || notification.type === 'CHAT_LIST_REFRESH') {
              loadChatRooms();
              return; 
          }

          // [Real-time] 프로필 업데이트 이벤트
          if (notification.type === 'PROFILE_UPDATE') {
              console.log('🖼️ 프로필 업데이트 수신:', notification);
              if (updateUser) {
                  updateUser({ profileImageUrl: notification.profileImageUrl });
              }
              loadChatRooms(); // 채팅 목록 내, 상대방 프로필 갱신 등을 위해 목록 다시 로드
              return;
          }

          // [Fix] 현재 보고 있는 채팅방이면 알림(종)에 추가하지 않음
          const currentPath = window.location.pathname;
          // notification.url이 있을 경우 그 방에 있는지 확인, 없으면 chatRoomId로 확인
          const targetRoomId = notification.chatRoomId;
          const isViewingChat = currentPath.includes(`/chat/${targetRoomId}`);

          if (!isViewingChat) {
              // NotificationContext에 알림 추가
              addNotification({
                id: Date.now() + Math.random(), // 고유 ID 생성
                ...notification,
                read: false
              });
          }
          
          // 알림 오면 목록 갱신 (보고 있는 방이어도 목록은 갱신해야 함 - ex: 읽음 수, 마지막 메시지)
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
