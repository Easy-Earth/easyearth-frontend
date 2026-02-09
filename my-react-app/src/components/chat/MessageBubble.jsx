import React from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './MessageBubble.module.css';

const MessageBubble = ({ message }) => {
    const { user } = useAuth();
    
    // 메시지가 없거나 시스템 메시지인 경우 처리
    if (!message) return null;
    
    const isMine = message.senderId === user?.id;
    const isSystem = message.type === 'SYSTEM';

    // 시간 포맷팅
    const formatTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isSystem) {
        return (
            <div className={styles.systemMessage}>
                <span>{message.content}</span>
            </div>
        );
    }

    return (
        <div className={`${styles.wrapper} ${isMine ? styles.myMessage : ''}`}>
            {/* 상대방일 경우에만 아바타 표시 */}
            {!isMine && (
                <div className={styles.avatar}>
                    <img 
                        src={message.senderProfile || "/default-profile.png"} 
                        alt="Profile"
                        onError={(e) => {
                            if (e.target.dataset.failed) return;
                            e.target.dataset.failed = 'true';
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
                        }}
                    />
                </div>
            )}
            
            <div className={styles.content}>
                {!isMine && <div className={styles.name}>{message.senderName || "알 수 없음"}</div>}
                
                <div className={styles.bubbleRow}>
                    <div className={styles.bubble}>
                        {/* 텍스트 메시지 */}
                        {message.contentType === 'TEXT' && message.content}
                        
                        {/* 이미지 메시지 */}
                        {message.contentType === 'IMAGE' && (
                            <img src={message.content} alt="Image" className={styles.imageContent} />
                        )}
                        
                        {/* 파일 메시지 (추가 확장 가능) */}
                        {message.contentType === 'FILE' && (
                            <a href={message.content} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                                📎 파일 다운로드
                            </a>
                        )}
                    </div>
                    
                    <div className={styles.info}>
                        {/* 읽지 않음 카운트 (0이면 숨김) */}
                        {message.unreadCount > 0 && (
                            <span className={styles.unread}>{message.unreadCount}</span>
                        )}
                        <span className={styles.time}>{formatTime(message.createdAt)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
