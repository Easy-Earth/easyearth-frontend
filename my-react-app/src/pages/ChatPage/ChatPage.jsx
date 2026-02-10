import React from 'react';
import { useParams } from 'react-router-dom';
import ChatRoomList from '../../components/chat/ChatRoomList';
import ChatRoomDetail from '../../components/chat/ChatRoomDetail';
import styles from './ChatPage.module.css';

const ChatPage = () => {
    const { roomId } = useParams();

    return (
        <div className={styles.container}>
            <div className={`${styles.sidebar} ${roomId ? styles.mobileHidden : ''}`}>
                <ChatRoomList />
            </div>
            <div className={`${styles.main} ${!roomId ? styles.mobileHidden : ''}`}>
                {roomId ? (
                    <ChatRoomDetail roomId={roomId} />
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>💬</div>
                        <h3>대화방을 선택하세요</h3>
                        <p>왼쪽 목록에서 대화방을 선택하거나<br/>새로운 대화를 시작해보세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
