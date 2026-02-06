import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { createChatRoom } from '../../apis/chatApi'; // API 직접 호출 or Context 위임
import styles from './ChatRoomList.module.css';

const ChatRoomList = () => {
    const { chatRooms, loadChatRooms } = useChat();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { roomId } = useParams();

    const handleCreateRoom = async () => {
        // 1. 초대할 사용자 ID 입력
        const inviteeId = prompt("초대할 사용자의 ID(Login ID)를 입력하세요.\n(빈 칸으로 두면 방 제목을 입력하여 그룹 채팅을 생성합니다)");
        
        if (inviteeId === null) return; // 취소

        if (inviteeId.trim() === "") {
            // 빈 칸이면 기존 그룹 채팅 로직
            const roomName = prompt("새로운 채팅방 이름을 입력하세요:");
            if (!roomName) return;

            try {
                const newRoom = await createChatRoom({
                    title: roomName,
                    roomType: "GROUP",
                    creatorId: user.id
                });
                loadChatRooms();
                navigate(`/chat/${newRoom.chatRoomId}`);
            } catch (error) {
                alert("채팅방 생성에 실패했습니다.");
            }
        } else {
            // ID가 입력되면 1:1 채팅 시도
            try {
                // 1. 회원 검색
                const { searchMember } = await import('../../apis/chatApi');
                const targetMember = await searchMember(inviteeId);

                if (!targetMember) {
                    alert("해당 사용자를 찾을 수 없습니다.");
                    return;
                }

                // 2. 1:1 방 생성 요청
                const newRoom = await createChatRoom({
                    title: "", // 1:1은 제목 없음 (상대방 이름 표시)
                    roomType: "SINGLE",
                    creatorId: user.id,
                    targetMemberId: targetMember.memberId
                });
                
                loadChatRooms();
                navigate(`/chat/${newRoom.chatRoomId}`);

            } catch (error) {
                console.error(error);
                alert("채팅방 생성에 실패했습니다.");
            }
        }
    };

    // 시간 포맷팅 (예: "오후 2:30" or "어제")
    const formatTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>채팅 <span className={styles.count}>{chatRooms.length}</span></h2>
                <div className={styles.actions}>
                    <button className={styles.iconBtn} onClick={handleCreateRoom} title="새 채팅방">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>
                    {/* 추가 아이콘(검색, 설정 등) 가능 */}
                </div>
            </div>

            <ul className={styles.list}>
                {chatRooms.map((room) => (
                    <li 
                        key={room.chatRoomId} 
                        className={`${styles.item} ${parseInt(roomId) === room.chatRoomId ? styles.active : ''}`}
                        onClick={() => navigate(`/chat/${room.chatRoomId}`)}
                    >
                        <div className={styles.avatar}>
                            {/* 1:1 채팅은 상대방 프로필, 그룹 채팅은 기본 이미지 */}
                            <img 
                                src={room.otherMemberProfile || "/default-profile.png"} 
                                alt="Profile"
                                onError={(e) => {
                                    if (e.target.dataset.failed) return;
                                    e.target.dataset.failed = 'true';
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%23ccc'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='20'%3ER%3C/text%3E%3C/svg%3E";
                                }}
                            />
                        </div>
                        <div className={styles.content}>
                            <div className={styles.topRow}>
                                <span className={styles.name}>{room.title || "알 수 없는 대화방"}</span>
                                <span className={styles.time}>{formatTime(room.lastMessageAt)}</span>
                            </div>
                            <div className={styles.bottomRow}>
                                <span className={styles.message}>
                                    {room.lastMessageContent || "대화가 없습니다."}
                                </span>
                                {room.unreadCount > 0 && (
                                    <span className={styles.badge}>{room.unreadCount}</span>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ChatRoomList;
