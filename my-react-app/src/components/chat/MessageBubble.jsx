import React, { useState, useRef, memo } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './MessageBubble.module.css';
import { getFullUrl } from '../../utils/imageUtil';
import MessageContextMenu from './MessageContextMenu';
import { toggleReaction, deleteMessage } from '../../apis/chatApi';
import UserDatailModal from '../common/UserDatailModal';
import { extractOriginalFileName } from './chatFileUtil'; // Import local utility

const MessageBubble = memo(({ message, onReply, onSetNotice, isOwner, onRefresh, onImageLoad, isHighlighted, showAlert, onReplyClick }) => {
    const { user } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [showProfileModal, setShowProfileModal] = useState(false);
    const longPressTimer = useRef(null);

    // 메시지가 없거나 시스템 메시지인 경우 처리
    if (!message) return null;
    
    const isMine = message.senderId === user?.memberId;
    const isSystem = message.messageType === 'ENTER' || 
                     message.messageType === 'LEAVE' || 
                     message.messageType === 'SYSTEM' ||
                     message.messageType === 'NOTICE' ||
                     message.senderId === 1 || 
                     message.senderName === '시스템' || 
                     message.senderName === '관리자';

    // 시간 포맷팅
    const formatTime = (isoString) => {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return "";
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return "";
        }
    };

    // 컨텍스트 메뉴 핸들러
    const handleContextMenu = (e) => {
        e.preventDefault();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setShowMenu(true);
    };

    const handleTouchStart = (e) => {
        longPressTimer.current = setTimeout(() => {
            const touch = e.touches[0];
            setMenuPosition({ x: touch.clientX, y: touch.clientY });
            setShowMenu(true);
        }, 800);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    // 메뉴 액션
    const handleReaction = async (emoji) => {
        try {
            await toggleReaction(message.messageId, user.memberId, emoji);
        } catch (error) {
            console.error("리액션 실패", error);
            if (showAlert) {
                showAlert("리액션을 추가하는데 실패했습니다.");
            }
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMessage(message.messageId, user.memberId);
        } catch (error) {
            console.error("삭제 실패", error);
            if (showAlert) {
                showAlert("메시지 삭제에 실패했습니다.");
            }
        }
    };

    const menuOptions = [
        { label: "답장", icon: "↩️", action: () => onReply(message) },
        ...(isOwner ? [{ label: "공지 등록", icon: "📢", action: () => onSetNotice(message) }] : []),
        ...(isMine ? [{ label: "삭제", icon: "🗑️", action: handleDelete }] : [])
    ];

    if (isSystem) {
        return (
            <div className={styles.systemMessage}>
                <span className={styles.systemText}>{message.content}</span>
            </div>
        );
    }

    return (
        <div 
            className={`${styles.wrapper} ${isMine ? styles.myMessage : ''} ${isHighlighted ? styles.highlighted : ''}`}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* 상대방일 경우에만 아바타 표시 */}
            {!isMine && (
                <div className={styles.avatar} onClick={() => setShowProfileModal(true)}>
                    <img 
                        src={getFullUrl(message.senderProfileImage) || "/default-profile.svg"} 
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
                
                {/* 답장 인용 표시 */}
                {message.parentMessageId && (
                     <div 
                        className={styles.replyPreview} 
                        onClick={() => {
                            if (onReplyClick) {
                                onReplyClick(message.parentMessageId);
                            } else {
                                console.warn("onReplyClick prop is missing");
                            }
                        }}
                        style={{ cursor: 'pointer' }}
                        title="클릭하여 원본 메시지로 이동"
                     >
                        <span className={styles.replyName}>{message.parentMessageSenderName}에게 답장:</span>
                        <div className={styles.replyContent}>
                            {extractOriginalFileName(message.parentMessageContent)}
                        </div>
                     </div>
                )}

                <div className={styles.bubbleRow} style={{ opacity: message.isOptimistic ? 0.7 : 1 }}>
                    <div className={`${styles.bubble} ${message.messageType === 'DELETED' ? styles.deletedBubble : ''}`}>
                        {/* 삭제된 메시지 */}
                        {message.messageType === 'DELETED' ? (
                            <span className={styles.deletedText}>삭제된 메시지입니다.</span>
                        ) : (
                            <>
                                {/* 텍스트 메시지 */}
                                {(message.contentType === 'TEXT' || message.messageType === 'TEXT') && message.content}
                                
                                {/* 이미지 메시지 */}
                                {(message.contentType === 'IMAGE' || message.messageType === 'IMAGE') && (
                                    <a 
                                        href={getFullUrl(message.content)} 
                                        download={extractOriginalFileName(message.content)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={styles.imageLink} 
                                        onClick={() => console.log("Image URL:", getFullUrl(message.content), "Original:", message.content)}
                                    >
                                        <img 
                                            src={getFullUrl(message.content)} 
                                            alt="Image" 
                                            className={styles.imageContent} 
                                            onLoad={onImageLoad} 
                                            title={extractOriginalFileName(message.content)} 
                                        />
                                    </a>
                                )}
                                
                                {/* 파일 메시지 */}
                                {(message.contentType === 'FILE' || message.messageType === 'FILE') && (
                                    <a 
                                        href={getFullUrl(message.content)} 
                                        download={extractOriginalFileName(message.content)} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className={styles.fileLink}
                                    >
                                        📎 {extractOriginalFileName(message.content)}
                                    </a>
                                )}
                            </>
                        )}
                    </div>
                    
                    <div className={styles.info}>
                        {message.unreadCount > 0 && (
                            <span className={styles.unread}>{message.unreadCount}</span>
                        )}
                        <span className={styles.time}>{formatTime(message.createdAt)}</span>
                    </div>

                    {message.reactions && message.reactions.length > 0 && (
                        <div className={styles.reactions}>
                            {message.reactions.map((r, i) => (
                                <button 
                                    key={i} 
                                    className={`${styles.reaction} ${r.selectedByMe ? styles.myReaction : ''}`}
                                    onClick={() => handleReaction(r.emojiType)}
                                >
                                    {r.emojiType} {r.count}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showMenu && (
                <MessageContextMenu 
                    x={menuPosition.x} 
                    y={menuPosition.y} 
                    options={menuOptions} 
                    onClose={() => setShowMenu(false)} 
                    onReaction={handleReaction} // ✨ Pass handler
                />
            )}

            {showProfileModal && (
                <UserDatailModal
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    memberId={message.senderId}
                    zIndex={15000}
                />
            )}
        </div>
    );
});

export default MessageBubble;
