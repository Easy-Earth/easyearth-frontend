import React from 'react';
import { useChat } from '../../context/ChatContext';
import ChatRoomList from '../../components/chat/ChatRoomList';
import ChatRoomDetail from '../../components/chat/ChatRoomDetail';
import styles from './ChatPage.module.css';
import { useParams } from 'react-router-dom';

const ChatPage = () => {
  const { roomId } = useParams();

  return (
    <div className={styles.container}>
      {/* 왼쪽 사이드바 (채팅 목록) */}
      <div className={styles.sidebar}>
        <ChatRoomList />
      </div>

      {/* 오른쪽 메인 (채팅 상세) */}
      <div className={styles.main}>
        {roomId ? (
          <ChatRoomDetail roomId={roomId} />
        ) : (
          <div className={styles.emptyState}>
            <p>채팅방을 선택하거나 새로운 대화를 시작해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
