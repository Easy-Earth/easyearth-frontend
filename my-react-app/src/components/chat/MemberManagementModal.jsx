import React, { useState, useEffect } from 'react';
import { searchMember, inviteUser, kickMember, updateRole } from '../../apis/chatApi';
import Modal from '../common/Modal'; // Using common Modal housing
import styles from './MemberManagementModal.module.css';

const MemberManagementModal = ({ onClose, roomId, currentMembers, currentUserId, isOwner, showAlert, showConfirm }) => {
    const [activeTab, setActiveTab] = useState('MANAGE'); // 'INVITE' or 'MANAGE' -> Default to MANAGE for quick access
    const [searchValue, setSearchValue] = useState('');
    const [searchResult, setSearchResult] = useState(null);

    // Filter members for management list (exclude self)
    const otherMembers = currentMembers.filter(m => String(m.memberId) !== String(currentUserId));

    const handleSearch = async () => {
        if (!searchValue.trim()) return;
        try {
            const member = await searchMember(searchValue);
            if (member) {
                // Check if already in room
                const exists = currentMembers.some(m => String(m.memberId) === String(member.memberId));
                setSearchResult({ ...member, exists });
            } else {
                setSearchResult(null);
                showAlert("사용자를 찾을 수 없습니다.");
            }
        } catch (error) {
            console.error(error);
            showAlert("검색 중 오류가 발생했습니다.");
        }
    };

    const handleInvite = async () => {
        if (!searchResult) return;
        try {
            await inviteUser(roomId, searchResult.memberId, currentUserId);
            showAlert(`${searchResult.name}님을 초대했습니다.`);
            setSearchResult(null);
            setSearchValue('');
        } catch (error) {
            console.error(error);
            showAlert("초대 실패.");
        }
    };

    // ✨ Kick Member with Custom Confirm
    const handleKick = (targetId, targetName) => {
        showConfirm(`${targetName}님을 강퇴하시겠습니까?`, async () => {
            try {
                await kickMember(roomId, targetId, currentUserId);
                showAlert(`${targetName}님을 강퇴했습니다.`);
                // Parent component should ideally refresh member list via socket update or reloading
                // For now, we rely on parent's re-render or socket
            } catch (error) {
                console.error(error);
                showAlert("강퇴 실패.");
            }
        });
    };

    // ✨ Delegate Owner (Grant Authority) with Custom Confirm
    const handleDelegate = (targetId, targetName) => {
        showConfirm(`${targetName}님에게 방장 권한을 위임하시겠습니까?\n위임 후에는 일반 멤버로 변경됩니다.`, async () => {
             try {
                await updateRole(roomId, targetId, currentUserId, "OWNER");
                showAlert(`${targetName}님에게 방장 권한을 위임했습니다.`);
                onClose(); // Close modal as my permissions changed
            } catch (error) {
                console.error(error);
                showAlert("권한 위임 실패.");
            }
        }, "권한 위임");
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="멤버 관리"
        >
            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${activeTab === 'INVITE' ? styles.active : ''}`}
                    onClick={() => setActiveTab('INVITE')}
                >
                    초대하기
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'MANAGE' ? styles.active : ''}`}
                    onClick={() => setActiveTab('MANAGE')}
                >
                    멤버 목록 ({currentMembers.length})
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'INVITE' && (
                    <div className={styles.inviteSection}>
                        <div className={styles.searchBox}>
                            <input 
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="회원 ID 검색"
                                className={styles.input}
                            />
                            <button onClick={handleSearch} className={styles.searchBtn}>검색</button>
                        </div>
                        
                        {searchResult && (
                            <div className={styles.resultItem}>
                                <span>{searchResult.name} ({searchResult.loginId})</span>
                                {searchResult.exists ? (
                                    <span className={styles.existsBadge}>이미 참여중</span>
                                ) : (
                                    <button onClick={handleInvite} className={styles.inviteBtn}>초대</button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'MANAGE' && (
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
                                    {isOwner && (
                                        <div className={styles.actionBtns}>
                                            {/* ✨ Delegate Button */}
                                            <button 
                                                className={styles.delegateBtn}
                                                onClick={() => handleDelegate(member.memberId, member.name)}
                                            >
                                                위임
                                            </button>
                                            {/* Kick Button */}
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
                )}
            </div>
            
            <div className={styles.footer}>
                <button className={styles.closeBtn} onClick={onClose}>닫기</button>
            </div>
        </Modal>
    );
};

export default MemberManagementModal;
