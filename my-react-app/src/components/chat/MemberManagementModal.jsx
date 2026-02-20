import React, { useState, useEffect, useRef } from 'react';
import { searchMember, inviteUser, kickMember, updateRole, updateChatRoomTitle, updateRoomImage, uploadFile, getInvitedUsers, cancelInvitation } from '../../apis/chatApi';
import { getFullUrl } from '../../utils/chatImageUtil';
import Modal from '../common/Modal'; 
import styles from './MemberManagementModal.module.css';

// 채팅방 멤버 관리 모달 (초대, 강퇴, 권한 위임, 방 설정)
const MemberManagementModal = ({ onClose, roomId, currentRoomTitle, currentRoomImage, currentMembers, currentUserId, isOwner, roomType, showAlert, showConfirm, onMemberUpdate, isAlertOpen }) => { //isAlertOpen 추가
    const [activeTab, setActiveTab] = useState('MANAGE');
    const [searchValue, setSearchValue] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [newTitle, setNewTitle] = useState(currentRoomTitle || '');
    const [previewImage, setPreviewImage] = useState(currentRoomImage || null);
    const fileInputRef = useRef(null);
    const [invitedMembers, setInvitedMembers] = useState([]);
    const searchInputRef = useRef(null);

    // 초대 대기 멤버 조회
    const fetchInvitedMembers = async () => {
        try {
            const data = await getInvitedUsers(roomId);
            setInvitedMembers(data || []);
        } catch (error) {
            console.error("초대 대기 멤버 조회 실패", error);
        }
    };

    useEffect(() => {
        if (activeTab === 'MANAGE' && roomType !== 'SINGLE') {
            fetchInvitedMembers();
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }
    }, [activeTab, roomId, roomType]);

    // currentRoomImage 변경 시 previewImage 동기화
    useEffect(() => {
        setPreviewImage(currentRoomImage);
    }, [currentRoomImage]);

    //Alert 닫힘 시 검색창 포커스 복원
    useEffect(() => {
        if (!isAlertOpen && activeTab === 'MANAGE' && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isAlertOpen, activeTab]);

    // currentMembers 변경 시 검색 결과 내 멤버 여부 업데이트
    useEffect(() => {
        if (searchResult) {
            setSearchResult(prev => prev.map(member => ({
                ...member,
                exists: currentMembers.some(m => String(m.memberId) === String(member.memberId))
            })));
        }
    }, [currentMembers]);

    const otherMembers = currentMembers.filter(m => String(m.memberId) !== String(currentUserId));

    // 닉네임으로 멤버 검색
    const handleSearch = async () => {
        if (!searchValue.trim()) return;
        try {
            const members = await searchMember(searchValue);
            if (members && members.length > 0) {
                const resultsWithStatus = members.map(member => ({
                    ...member,
                    exists: currentMembers.some(m => String(m.memberId) === String(member.memberId))
                }));
                setSearchResult(resultsWithStatus);
            } else {
                setSearchResult([]);
                showAlert("검색 결과가 없습니다. (정확한 닉네임을 입력해주세요)");
            }
        } catch (error) {
            console.error(error);
            showAlert("검색 중 오류가 발생했습니다.");
        }
    };

    // 멤버 초대
    const handleInvite = async (targetMember) => {
        if (!targetMember) return;
        try {
            await inviteUser(roomId, targetMember.memberId, currentUserId);
            showAlert(`${targetMember.name || targetMember.loginId}님을 초대했습니다!`);
            onMemberUpdate();
            fetchInvitedMembers();
        } catch (error) {
            console.error(error);
            showAlert("초대에 실패했습니다.");
        }
    };

    // 멤버 강퇴
    const handleKick = (targetId, targetName) => {
        showConfirm(`${targetName}님을 강퇴하시겠습니까?`, async () => {
             try {
                await kickMember(roomId, targetId, currentUserId);
                showAlert(`${targetName}님을 강퇴했습니다.`);
                onMemberUpdate();
            } catch (error) {
                console.error(error);
                showAlert("강퇴 실패.");
            }
        });
    };

    // 방장 권한 위임
    const handleDelegate = (targetId, targetName, invitationStatus) => {
        if (invitationStatus === 'PENDING') {
            showAlert("초대 수락 대기중인 사용자에게는 위임할 수 없습니다.");
            return;
        }
        
        showConfirm(`${targetName}님에게 방장 권한을 위임하시겠습니까?\n위임 후에는 일반 멤버로 변경됩니다.`, async () => {
             try {
                await updateRole(roomId, targetId, currentUserId, "OWNER");
                showAlert(`${targetName}님에게 방장 권한을 위임했습니다.`);
                onClose(); 
            } catch (error) {
                console.error(error);
                showAlert("권한 위임 실패.");
            }
        }, "권한 위임");
    };

    // 채팅방 제목 변경
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

    // 채팅방 이미지 변경
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileUrl = await uploadFile(file);
            setPreviewImage(fileUrl);
            await updateRoomImage(roomId, currentUserId, fileUrl);
            showAlert("채팅방 이미지가 변경되었습니다.");
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

    // 초대 취소
    const handleCancelInvitation = async (targetId, targetName) => {
        showConfirm(`${targetName}님의 초대를 취소하시겠습니까?`, async () => {
            try {
                await cancelInvitation(roomId, targetId, currentUserId);
                showAlert(`${targetName}님의 초대를 취소했습니다.`);
                fetchInvitedMembers();
            } catch (error) {
                console.error("초대 취소 실패", error);
                showAlert("초대 취소에 실패했습니다.");
            }
        }, "초대 취소");
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
                        {roomType !== 'SINGLE' && (
                            <div className={styles.inviteSection}>
                                <div className={styles.searchBox}>
                                    <input 
                                        type="text"
                                        ref={searchInputRef}
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        placeholder="초대할 닉네임 검색"
                                        className={styles.input}
                                        disabled={isAlertOpen}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSearch();
                                        }}
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

                        {invitedMembers.length > 0 && (
                            <div className={styles.sectionHeader}>
                                <span>초대 대기 ({invitedMembers.length})</span>
                            </div>
                        )}
                        <ul className={styles.memberList}>
                             {invitedMembers.map(member => (
                                <li key={member.memberId} className={styles.memberItem}>
                                    <div className={styles.memberInfo}>
                                        <span className={styles.memberName}>{member.name}</span>
                                        <span className={styles.pendingBadge}>수락 대기중</span>
                                    </div>
                                    {(isOwner || member.inviterId === currentUserId) && (
                                        <button 
                                            className={styles.cancelBtn} 
                                            onClick={() => handleCancelInvitation(member.memberId, member.name)}
                                            title="초대 취소"
                                        >
                                            X
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>

                        <div className={styles.sectionHeader}>
                            <span>참여 멤버 ({currentMembers.length})</span>
                        </div>
                        <ul className={styles.memberList}>
                            <li className={styles.memberItem}>
                                <div className={styles.memberInfo}>
                                    <span className={styles.memberName}>{currentMembers.find(m => String(m.memberId) === String(currentUserId))?.name} (나)</span>
                                    {isOwner && <span className={styles.roleBadge}>방장</span>}
                                </div>
                            </li>
                            
                            {otherMembers.map(member => (
                                <li key={member.memberId} className={styles.memberItem}>
                                    <div className={styles.memberInfo}>
                                        <span className={styles.memberName}>{member.name}</span>
                                        {member.invitationStatus === 'PENDING' && (
                                            <span className={styles.pendingBadge}>초대 대기중</span>
                                        )}
                                    </div>
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
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {/* 방 설정 탭 */}
                {activeTab === 'SETTINGS' && (
                    <div className={styles.settingsSection}>
                        {isOwner ? (
                            <>
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
                                            <div className={styles.cameraOverlay}>사진</div>
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

                                <div className={styles.settingItem}>
                                    <label className={styles.settingLabel}>채팅방 이름</label>
                                    <div className={styles.settingRow}>
                                        <input 
                                            type="text" 
                                            className={styles.input}
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="채팅방 이름을 입력하세요(최대 15글자)"
                                            maxLength={15}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleUpdateTitle();
                                            }}
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
                                방장만 채팅방 설정을 변경할 수 있습니다.
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
