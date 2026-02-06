import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import { toggleReaction, deleteMessage, setNotice } from '../../apis/chatApi';
import styles from './MessageBubble.module.css';

const MessageBubble = ({ message, onReactionUpdate, userRole }) => {
    const { user } = useAuth();
    const { roomId } = useParams();
    const isMine = user && message.senderId === user.id;
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [longPressTimer, setLongPressTimer] = useState(null);
    const menuRef = useRef(null);

    // 시간 포맷 (오후 2:30)
    const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    // 리액션 이모지 목록
    const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢'];

    // 외부 클릭 감지 (메뉴 닫기)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowContextMenu(false);
            }
        };

        if (showContextMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showContextMenu]);

    // 1초 꾹 누르기 시작
    const handleLongPressStart = () => {
        const timer = setTimeout(() => {
            setShowContextMenu(true);
        }, 1000); // 1초
        setLongPressTimer(timer);
    };

    // 꾹 누르기 취소
    const handleLongPressEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    // 리액션 토글 핸들러
    const handleReaction = async (emojiType) => {
        try {
            await toggleReaction(message.messageId, user.id, emojiType);
            setShowContextMenu(false);
            if (onReactionUpdate) {
                onReactionUpdate();
            }
        } catch (error) {
            console.error("리액션 추가 실패", error);
            alert("공감 추가에 실패했습니다.");
        }
    };

    // 메시지 삭제 핸들러
    const handleDelete = async () => {
        if (!window.confirm("메시지를 삭제하시겠습니까?")) {
            setShowContextMenu(false);
            return;
        }

        try {
            await deleteMessage(message.messageId, user.id);
            setShowContextMenu(false);
            if (onReactionUpdate) {
                onReactionUpdate();
            }
        } catch (error) {
            console.error("메시지 삭제 실패", error);
            alert(error.response?.data || "메시지 삭제에 실패했습니다.");
        }
    };

    // 공지 설정 핸들러
    const handleSetNotice = async () => {
        try {
            await setNotice(roomId, user.id, message.messageId);
            setShowContextMenu(false);
            alert("공지가 설정되었습니다.");
            if (onReactionUpdate) {
                onReactionUpdate();
            }
        } catch (error) {
            console.error("공지 설정 실패", error);
            alert(error.response?.data || "공지 설정 권한이 없거나 실패했습니다.");
        }
    };

    const renderContent = () => {
        const msgType = message.messageType ? message.messageType.toUpperCase() : 'TEXT';

        if (msgType === 'DELETED') {
            return <span className={styles.deletedMessage}>삭제된 메시지입니다</span>;
        } else if (msgType === 'SYSTEM') {
            return <span className={styles.systemMessage}>{message.content}</span>;
        } else if (msgType === 'IMAGE') {
            return (
                <img 
                    src={message.content} 
                    alt="uploaded image" 
                    className={styles.messageImage}
                    loading="lazy"
                    onError={(e) => {
                        if (e.target.src !== message.content) return;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23ddd' width='300' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='14'%3E이미지 로드 실패%3C/text%3E%3C/svg%3E";
                    }}
                />
            );
        } else if (msgType === 'FILE') {
            const fileName = message.content ? message.content.split('/').pop() : 'Unknown File';
            return (
                <a 
                    href={message.content} 
                    download 
                    className={styles.fileLink}
                    target="_blank" 
                    rel="noopener noreferrer"
                >
                    📎 {fileName}
                </a>
            );
        } else {
            return message.content;
        }
    };

    // 리액션 집계 (백엔드에서 제공되는 reactions 배열 사용)
    const renderReactions = () => {
        if (!message.reactions || message.reactions.length === 0) return null;

        return (
            <div className={styles.reactions}>
                {message.reactions.map((reaction, idx) => (
                    <span 
                        key={idx} 
                        className={`${styles.reactionBadge} ${reaction.selectedByMe ? styles.myReaction : ''}`}
                        onClick={() => handleReaction(reaction.emojiType)}
                        style={{ cursor: 'pointer' }}
                        title={reaction.selectedByMe ? "공감 취소" : "공감하기"}
                    >
                        {reaction.emojiType} {reaction.count}
                    </span>
                ))}
            </div>
        );
    };

    // 시스템 메시지는 중앙 정렬로 특별 처리
    if (message.messageType === 'SYSTEM' || message.messageType === 'ENTER' || message.messageType === 'LEAVE') {
        return (
            <div className={styles.systemMessageWrapper}>
                <span className={styles.systemMessage}>{message.content}</span>
            </div>
        );
    }

    return (
        <div className={`${styles.wrapper} ${isMine ? styles.myMessage : styles.otherMessage}`}>
            {!isMine && (
                <div className={styles.profile}>
                    <img 
                        src={message.senderProfileImage || "/default-profile.png"} 
                        alt={message.senderName}
                        loading="lazy"
                        onError={(e) => {
                            if (e.target.dataset.failed) return;
                            e.target.dataset.failed = 'true';
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23ccc'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='16'%3EU%3C/text%3E%3C/svg%3E";
                        }}
                    />
                </div>
            )}
            
            <div className={styles.contentGroup}>
                {!isMine && <span className={styles.senderName}>{message.senderName}</span>}
                
                <div className={styles.bubbleRow}>
                    {isMine && message.unreadCount > 0 && (
                        <span className={styles.unreadCount}>{message.unreadCount}</span>
                    )}
                    {isMine && <span className={styles.time}>{formattedTime}</span>}
                    
                    <div className={styles.bubbleContainer}>
                        <div 
                            className={styles.bubble} 
                            onMouseDown={handleLongPressStart}
                            onMouseUp={handleLongPressEnd}
                            onMouseLeave={handleLongPressEnd}
                            onTouchStart={handleLongPressStart}
                            onTouchEnd={handleLongPressEnd}
                            style={{ cursor: 'pointer' }}
                            title="1초간 꾹 눌러서 메뉴 열기"
                        >
                            {renderContent()}
                        </div>
                        
                        {/* 리액션 표시 */}
                        {renderReactions()}
                        
                        {/* 컨텍스트 메뉴 (2초 꾹 누르기) */}
                        {showContextMenu && (
                            <div 
                                ref={menuRef}
                                className={styles.contextMenu} 
                                style={{
                                    position: 'absolute',
                                    bottom: 'auto',
                                    top: '100%',
                                    left: isMine ? 'auto' : '0',
                                    right: isMine ? '0' : 'auto',
                                    zIndex: 100
                                }}
                            >
                                {/* 공감 메뉴 */}
                                <div className={styles.menuSection}>
                                    <div className={styles.menuLabel}>공감하기</div>
                                    <div className={styles.emojiRow}>
                                        {reactionEmojis.map(emoji => (
                                            <button
                                                key={emoji}
                                                className={styles.emojiBtn}
                                                onClick={() => handleReaction(emoji)}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 구분선 */}
                                <div className={styles.menuDivider}></div>

                                {/* 메시지 관리 메뉴 */}
                                <div className={styles.menuSection}>
                                    {/* 본인 메시지인 경우에만 삭제 버튼 표시 */}
                                    {isMine && message.messageType !== 'DELETED' && (
                                        <button 
                                            className={styles.menuItem}
                                            onClick={handleDelete}
                                        >
                                            🗑️ 메시지 삭제
                                        </button>
                                    )}
                                    
                                    {/* 방장/관리자만 공지 설정 가능 */}
                                    {(userRole === 'OWNER' || userRole === 'ADMIN') && message.messageType !== 'DELETED' && (
                                        <button 
                                            className={styles.menuItem}
                                            onClick={handleSetNotice}
                                        >
                                            📌 공지로 설정
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {!isMine && <span className={styles.time}>{formattedTime}</span>}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
