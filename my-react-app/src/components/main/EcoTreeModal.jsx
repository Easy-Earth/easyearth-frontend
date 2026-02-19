/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import api from '../../apis/axios';
import { useAuth } from '../../context/AuthContext';
import styles from './EcoTreeModal.module.css';

// 새로 생성된 고퀄리티 이미지 임포트
import stage1 from '../../assets/ecotree/stage1.png';
import stage2 from '../../assets/ecotree/stage2.png';
import stage3 from '../../assets/ecotree/stage3.png';
import stage4 from '../../assets/ecotree/stage4.png';

const EcoTreeModal = ({ isOpen, onClose, memberId: propMemberId }) => {
    const { user } = useAuth();
    const memberId = propMemberId || user?.memberId;
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGrowing, setIsGrowing] = useState(false);

    // 레벨별 필요 포인트 (백엔드 로직과 동일)
    const thresholds = [0, 500000, 1500000, 3780000];

    const fetchTreeInfo = async () => {
        if (!memberId) return;
        try {
            setLoading(true);
            const response = await api.get(`/ecotree/${memberId}`);
            setTreeData(response.data);
        } catch (error) {
            console.error("에코 트리 정보를 불러오는 중 오류 발생:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && memberId) {
            fetchTreeInfo();
        }
    }, [isOpen, memberId]);

    const handleGrow = async () => {
        if (!treeData || !memberId || treeData.totalEarnedPoint <= treeData.syncedExp) return;

        setIsGrowing(true);
        try {
            const response = await api.post(`/ecotree/grow/${memberId}`);
            setTreeData(response.data);
            // 애니메이션 효과를 위해 약간의 지연 후 상태 해제
            setTimeout(() => setIsGrowing(false), 800);
        } catch (error) {
            console.error("트리 성장 중 오류 발생:", error);
            setIsGrowing(false);
            alert("성장에 실패했습니다. 다시 시도해주세요.");
        }
    };

    if (!isOpen) return null;

    const getTreeImage = (level) => {
        if (level >= 4) return stage4;
        if (level === 3) return stage3;
        if (level === 2) return stage2;
        return stage1;
    };

    const getLevelName = (level) => {
        const names = ["씨앗", "새싹", "어린 나무", "성숙한 나무", "전설의 나무"];
        return names[level] || names[names.length - 1];
    };

    // 현재 레벨 내에서의 진행도 계산
    const calculateProgress = () => {
        if (!treeData || treeData.treeLevel >= 4) return 100;

        // 현재 레벨의 기준점과 다음 레벨의 기준점 사이에서의 위치
        const currentLevelMin = thresholds[treeData.treeLevel - 1] || 0;
        const nextLevelMin = thresholds[treeData.treeLevel];

        const progress = ((treeData.totalEarnedPoint - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;
        return Math.min(Math.max(progress, 0), 100);
    };

    const availablePoints = treeData ? treeData.totalEarnedPoint - treeData.syncedExp : 0;
    const progress = calculateProgress();

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>&times;</button>

                <h2 className={styles.title}>🌳 나의 에코 트리</h2>

                {loading ? (
                    <div className={styles.loading}>정보를 불러오는 중...</div>
                ) : !user ? (
                    <div className={styles.error} style={{ color: "#999", padding: "40px 0" }}>
                        로그인이 필요한 서비스입니다.
                    </div>
                ) : treeData ? (
                    <>
                        <div className={styles.treeDisplay}>
                            <div className={styles.growthEffect}></div>
                            <img
                                src={getTreeImage(treeData.treeLevel)}
                                alt="Eco Tree"
                                className={`${styles.treeImage} ${isGrowing ? styles.growingAnim : ''}`}
                            />
                        </div>

                        <div className={styles.statsContainer}>
                            <div className={styles.levelBadge}>
                                Lv.{treeData.treeLevel} {getLevelName(treeData.treeLevel)}
                            </div>

                            <div className={styles.progressLabel}>
                                <span>다음 단계까지</span>
                                <span>{treeData.treeLevel >= 4 ? 'MAX' : `${Math.floor(progress)}%`}</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>

                            <div className={styles.pointInfo}>
                                <div className={styles.pointRow}>
                                    <span>전체 누적 포인트:</span>
                                    <span className={styles.pointValue}>{treeData.totalEarnedPoint.toLocaleString()} P</span>
                                </div>
                                <div className={styles.pointRow}>
                                    <span>성장 가능한 포인트:</span>
                                    <span className={styles.pointValue}>{availablePoints > 0 ? availablePoints.toLocaleString() : 0} P</span>
                                </div>
                            </div>

                            <button
                                className={styles.growBtn}
                                onClick={handleGrow}
                                disabled={availablePoints <= 0 || treeData.treeLevel >= 4 || isGrowing}
                            >
                                {isGrowing ? '성장 중...' : '포인트 반영하여 나무 키우기'}
                            </button>
                        </div>
                        <p className={styles.desc}>
                            환경 활동으로 모은 포인트가 나무의 영양분이 됩니다!<br />
                            포인트를 반영하여 나무를 더 크게 키워보세요.
                        </p>
                    </>
                ) : (
                    <div className={styles.error}>데이터를 불러오지 못했습니다.</div>
                )}
            </div>
        </div>
    );
};

export default EcoTreeModal;
