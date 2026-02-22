import React, { useState, useRef } from 'react'; // useRef added
import { uploadFile } from '../../apis/chatApi'; // ✨ import added
import { getFullUrl } from '../../utils/chatImageUtil'; // ✨ import added
import styles from './ChatRoomTypeModal.module.css';
import Modal from '../common/Modal'; 

const ChatRoomTypeModal = ({ onClose, onCreate, showAlert, isAlertOpen }) => { //isAlertOpen 추가
    const [roomType, setRoomType] = useState('SINGLE'); 
    const [searchValue, setSearchValue] = useState('');
    const [roomTitle, setRoomTitle] = useState('');
    const [invitedMemberIds, setInvitedMemberIds] = useState([]);
    
    // ✨ 이미지 관련 State
    const [roomImage, setRoomImage] = useState(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null); // ✨ 포커스용 Ref

    // ✨ 모달 열릴 때 및 타입 변경 시 자동 포커스
    React.useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [roomType]);

    // ✨ Alert 닫힘 시 입력창 포커스 복원
    React.useEffect(() => {
        if (!isAlertOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAlertOpen]);

    // ✨ 이미지 변경 핸들러
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileUrl = await uploadFile(file);
            setRoomImage(fileUrl);
        } catch (error) {
            console.error("이미지 업로드 실패", error);
            showAlert("이미지 업로드에 실패했습니다.");
        }
    };

    const handleSubmit = () => {
        if (roomType === 'SINGLE') {
            if (!searchValue.trim()) {
                showAlert("대화할 상대방의 닉네임을 입력해주세요.");
                return;
            }
            onCreate({ roomType, value: searchValue });
        } else {
            if (!roomTitle.trim()) {
                showAlert("채팅방 제목을 입력해주세요.");
                return;
            }
            // Pass roomImage to onCreate
            onCreate({ roomType, value: roomTitle, invitedMemberIds, roomImage });
        }
    };

    return (
        <Modal
            isOpen={true} 
            onClose={onClose}
            title="새 채팅방 만들기"
            closeOnEsc={!isAlertOpen} //Alert가 떠있으면 ESC 닫기 비활성화
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
                            <label>상대방 닉네임</label>
                            <input 
                                type="text" 
                                ref={inputRef} // Ref 연결
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="상대방 닉네임을 입력하세요"
                                className={styles.input}
                                disabled={isAlertOpen} //Alert 떠있으면 입력 방지 (엔터 중복 방지)
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSubmit();
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            {/*그룹 채팅 이미지 업로드 */}
                            <div className={styles.inputGroup}>
                                <label>대표 이미지</label>
                                <div className={styles.imageUpload}>
                                    <div 
                                        className={styles.imagePreview} 
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <img 
                                            src={getFullUrl(roomImage) || "/default-room.svg"}  // ✨ .svg로 변경
                                            alt="Room Preview" 
                                            className={styles.roomImg}
                                            onError={(e) => { e.target.src = "/default-room.svg"; }} // ✨ .svg로 변경
                                        />
                                        <div className={styles.cameraOverlay}>📷</div>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>채팅방 제목</label>
                                <input 
                                    type="text" 
                                    ref={inputRef} //Ref 연결
                                    value={roomTitle}
                                    onChange={(e) => setRoomTitle(e.target.value)}
                                    placeholder="채팅방 제목을 입력하세요(최대 15자)"
                                    className={styles.input}
                                    maxLength={15} //10글자 제한
                                    disabled={isAlertOpen} //Alert 떠있으면 입력 방지
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSubmit();
                                    }}
                                />
                                <p className={styles.hint}>* 그룹 채팅 멤버 초대는 방 생성 후에도 가능합니다.</p>
                            </div>
                        </>
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
