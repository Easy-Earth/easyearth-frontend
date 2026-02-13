import React, { useState } from 'react';
import styles from './ChatRoomTypeModal.module.css';
import Modal from '../common/Modal'; // Using common Modal for the container

const ChatRoomTypeModal = ({ onClose, onCreate, showAlert }) => {
    const [roomType, setRoomType] = useState('SINGLE'); // 'SINGLE' or 'GROUP'
    const [searchValue, setSearchValue] = useState('');
    const [roomTitle, setRoomTitle] = useState('');
    const [invitedMemberIds, setInvitedMemberIds] = useState([]);

    const handleSubmit = () => {
        if (roomType === 'SINGLE') {
            if (!searchValue.trim()) {
                showAlert("대화할 상대방의 ID를 입력해주세요.");
                return;
            }
            onCreate({ roomType, value: searchValue });
        } else {
            if (!roomTitle.trim()) {
                showAlert("채팅방 제목을 입력해주세요.");
                return;
            }
            // Group chat logic would go here (adding members logic needed)
            // For now, simple version
            onCreate({ roomType, value: roomTitle, invitedMemberIds });
        }
    };

    return (
        <Modal
            isOpen={true} // Controlled by parent rendering
            onClose={onClose}
            title="새 채팅방 만들기"
        >
            <div className={styles.content}>
                <div className={styles.typeSelector}>
                    <button 
                        className={`${styles.typeBtn} ${roomType === 'SINGLE' ? styles.active : ''}`}
                        onClick={() => setRoomType('SINGLE')}
                    >
                        1:1 채팅
                    </button>
                    <button 
                        className={`${styles.typeBtn} ${roomType === 'GROUP' ? styles.active : ''}`}
                        onClick={() => setRoomType('GROUP')}
                    >
                        그룹 채팅
                    </button>
                </div>

                <div className={styles.formBody}>
                    {roomType === 'SINGLE' ? (
                        <div className={styles.inputGroup}>
                            <label>상대방 아이디 (Login ID)</label>
                            <input 
                                type="text" 
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="상대방 아이디를 입력하세요"
                                className={styles.input}
                            />
                        </div>
                    ) : (
                        <div className={styles.inputGroup}>
                            <label>채팅방 제목</label>
                            <input 
                                type="text" 
                                value={roomTitle}
                                onChange={(e) => setRoomTitle(e.target.value)}
                                placeholder="채팅방 제목을 입력하세요"
                                className={styles.input}
                            />
                            {/* Member invitation UI would be here */}
                            <p className={styles.hint}>* 그룹 채팅 멤버 초대는 방 생성 후에도 가능합니다.</p>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>취소</button>
                    <button className={styles.createBtn} onClick={handleSubmit}>만들기</button>
                </div>
            </div>
        </Modal>
    );
};

export default ChatRoomTypeModal;
