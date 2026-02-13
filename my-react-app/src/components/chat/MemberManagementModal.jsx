import React, { useState, useEffect, useRef } from 'react';
import { searchMember, inviteUser, kickMember, updateRole, updateChatRoomTitle, updateRoomImage, uploadFile } from '../../apis/chatApi'; // ✨ import 추가
import { getFullUrl } from '../../utils/imageUtil'; // ✨ import 추가
import Modal from '../common/Modal'; 
import styles from './MemberManagementModal.module.css';

const MemberManagementModal = ({ onClose, roomId, currentRoomTitle, currentRoomImage, currentMembers, currentUserId, isOwner, roomType, showAlert, showConfirm, onMemberUpdate }) => {
    const [activeTab, setActiveTab] = useState('MANAGE'); 
    const [searchValue, setSearchValue] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [newTitle, setNewTitle] = useState(currentRoomTitle || ''); 
    
    // ✨ 이미지 관련 State
    const [previewImage, setPreviewImage] = useState(currentRoomImage || null);
    const fileInputRef = useRef(null);

    // ✨ currentRoomImage 변경 시 previewImage 업데이트
    useEffect(() => {
        setPreviewImage(currentRoomImage);
    }, [currentRoomImage]);

    // ✨ currentMembers 변경 시 검색 결과 업데이트 (실시간 반영)
    useEffect(() => {
        if (searchResult) {
            setSearchResult(prev => prev.map(member => ({
                ...member,
                exists: currentMembers.some(m => String(m.memberId) === String(member.memberId))
            })));
        }
    }, [currentMembers]);

    // Filter members for management list (exclude self)
    const otherMembers = currentMembers.filter(m => String(m.memberId) !== String(currentUserId));

    // ... (search logic) ...
    const handleSearch = async () => {
        if (!searchValue.trim()) return;
        try {
            const members = await searchMember(searchValue); // Returns Array
            if (members && members.length > 0) {
                // 각 검색된 멤버가 현재 방에 있는지 체크
                const resultsWithStatus = members.map(member => ({
                    ...member,
                    exists: currentMembers.some(m => String(m.memberId) === String(member.memberId))
                }));
                setSearchResult(resultsWithStatus);
            } else {
                setSearchResult([]);
                showAlert("검색 결과가 없습니다.");
            }
        } catch (error) {
            console.error(error);
            showAlert("검색 중 오류가 발생했습니다.");
        }
    };

    const handleInvite = async (targetMember) => {
        if (!targetMember) return;
        try {
            await inviteUser(roomId, targetMember.memberId, currentUserId);
            showAlert(`${targetMember.name || targetMember.loginId}님을 초대했습니다!`);
            // setSearchValue(''); // ✨ 검색 값 유지
            // setSearchResult(null); // ✨ 검색 결과 유지
            onMemberUpdate(); // ✨ 멤버 목록 갱신 트리거
            // onClose(); // ✨ 계속 초대할 수 있도록 닫지 않음
        } catch (error) {
            console.error(error);
            showAlert("초대에 실패했습니다.");
        }
    };

    // ... (kick/delegate logic) ...
    const handleKick = (targetId, targetName) => {
        showConfirm(`${targetName}님을 강퇴하시겠습니까?`, async () => {
             try {
                await kickMember(roomId, targetId, currentUserId);
                showAlert(`${targetName}님을 강퇴했습니다.`);
                onMemberUpdate(); // ✨ 멤버 목록 갱신 트리거
            } catch (error) {
                console.error(error);
                showAlert("강퇴 실패.");
            }
        });
    };

    const handleDelegate = (targetId, targetName, invitationStatus) => {
        // 초대 수락한 사용자만 위임 가능
        // 초대 대기중인 사용자에게는 위임 불가
        if (invitationStatus === 'PENDING') {
            showAlert("초대 수락 대기중인 사용자에게는 위임할 수 없습니다.");
            return;
        }
        
        showConfirm(`${targetName}님에게 방장 권한을 위임하시겠습니까?\n위임 후에는 일반 멤버로 변경됩니다.`, async () => {
             try {
                await updateRole(roomId, targetId, currentUserId, "OWNER");
                showAlert(`${targetName}님에게 방장 권한을 위임했습니다.`);
                onClose(); 
                // 페이지 새로고침하여 권한 업데이트
                window.location.reload();
            } catch (error) {
                console.error(error);
                showAlert("권한 위임 실패.");
            }
        }, "권한 위임");
    };

    // ✨ 방 제목 변경 핸들러
    const handleUpdateTitle = async () => {
        if (!newTitle.trim()) return;
        try {
            await updateChatRoomTitle(roomId, currentUserId, newTitle);
            showAlert("채팅방 이름이 변경되었습니다.");
            onClose(); 
        } catch (error) {
            console.error(error);
            showAlert("방 이름 변경 실패.");
        }
    };

    // ✨ 이미지 선택 핸들러
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // 1. 파일 업로드
            const fileUrl = await uploadFile(file);
            
            // 2. 미리보기 업데이트
            setPreviewImage(fileUrl);
            
            // 3. 서버에 이미지 업데이트 요청
            await updateRoomImage(roomId, currentUserId, fileUrl);
            
            showAlert("채팅방 이미지가 변경되었습니다.");
            // onClose(); // 이미지는 바꾸고 계속 설정할 수 있으므로 닫지 않음 (선택 사항)
        } catch (error) {
            console.error("이미지 변경 실패", error);
            showAlert("이미지 변경에 실패했습니다.");
        }
    };
    
    const handleImageClick = () => {
        if (isOwner) {
            fileInputRef.current.click();
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="채팅방 관리" 
            size="md"
            zIndex={11000}
        >
            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${activeTab === 'MANAGE' ? styles.active : ''}`}
                    onClick={() => setActiveTab('MANAGE')}
                >
                    멤버 ({currentMembers.length})
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'SETTINGS' ? styles.active : ''}`}
                    onClick={() => setActiveTab('SETTINGS')}
                >
                    방 설정
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'MANAGE' && (
                    <>
                        {/* ✨ 1대1 채팅이 아닐 때만 초대 섹션 표시 */}
                        {roomType !== 'SINGLE' && (
                            <div className={styles.inviteSection}>
                                <div className={styles.searchBox}>
                                    <input 
                                        type="text"
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        placeholder="초대할 닉네임 검색"
                                        className={styles.input}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <button onClick={handleSearch} className={styles.searchBtn}>검색</button>
                                </div>
                                
                                {searchResult && searchResult.length > 0 && (
                                    <div className={styles.searchResultGrid}>
                                        {searchResult.map(member => (
                                            <button 
                                                key={member.memberId} 
                                                className={styles.searchResultChip}
                                                onClick={() => !member.exists && handleInvite(member)}
                                                disabled={member.exists}
                                                title={member.exists ? "이미 멤버입니다" : "클릭하여 초대"}
                                            >
                                                {member.name} {!member.exists ? "초대하기" : "(참여중)"}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}


                        <ul className={styles.memberList}>
                            {/* Me first */}
                            <li className={styles.memberItem}>
                                <div className={styles.memberInfo}>
                                    <span className={styles.memberName}>{currentMembers.find(m => String(m.memberId) === String(currentUserId))?.name} (나)</span>
                                    {isOwner && <span className={styles.roleBadge}>방장</span>}
                                </div>
                            </li>
                            
                            {/* Others */}
                            {otherMembers.map(member => (
                                <li key={member.memberId} className={styles.memberItem}>
                                    <div className={styles.memberInfo}>
                                        <span className={styles.memberName}>{member.name}</span>
                                        {member.invitationStatus === 'PENDING' && (
                                            <span className={styles.pendingBadge}>초대 대기중</span>
                                        )}
                                        {isOwner && (
                                            <div className={styles.actionBtns}>
                                                <button 
                                                    className={styles.delegateBtn}
                                                    onClick={() => handleDelegate(member.memberId, member.name, member.invitationStatus)}
                                                    disabled={member.invitationStatus === 'PENDING'}
                                                >
                                                    위임
                                                </button>
                                                <button 
                                                    className={styles.kickBtn}
                                                    onClick={() => handleKick(member.memberId, member.name)}
                                                >
                                                    강퇴
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {/* 설정 탭 */}
                {activeTab === 'SETTINGS' && (
                    <div className={styles.settingsSection}>
                        {isOwner ? (
                            <>
                                {/* ✨ 방 이미지 설정 */}
                                <div className={styles.settingItem}>
                                    <label className={styles.settingLabel}>채팅방 이미지</label>
                                    <div className={styles.imageSetting}>
                                        <div 
                                            className={styles.imagePreview} 
                                            onClick={() => fileInputRef.current.click()}
                                        >
                                        <img 
                                            src={getFullUrl(previewImage) || getFullUrl(currentRoomImage) || "/default-room.svg"} 
                                            alt="Room Preview" 
                                            className={styles.roomImg}
                                            onError={(e) => { e.target.src = "/default-room.svg"; }}
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

                                {/* 방 이름 설정 */}
                                <div className={styles.settingItem}>
                                    <label className={styles.settingLabel}>채팅방 이름</label>
                                    <div className={styles.settingRow}>
                                        <input 
                                            type="text" 
                                            className={styles.input}
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="채팅방 이름을 입력하세요(최대 15글자)"
                                            maxLength={15} // ✨ 10글자 제한
                                        />
                                        <button 
                                            className={styles.actionBtn}
                                            onClick={handleUpdateTitle}
                                            disabled={!newTitle.trim() || newTitle === currentRoomTitle}
                                        >
                                            변경
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className={styles.noPermission}>
                                ⚠️ 방장만 채팅방 설정을 변경할 수 있습니다.
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className={styles.footer}>
                <button className={styles.closeBtn} onClick={onClose}>닫기</button>
            </div>
        </Modal>
    );
};

export default MemberManagementModal;
