import { memo, useCallback, useMemo, useState } from "react";
import styles from "./EpicTitleBadges.module.css";

/**
 * Epic 등급 칭호 목록 (문구 + 꾸며주는 수식)
 * - 텍스트는 폰트로 렌더링 => 한글 안 깨짐
 * - 배지 프레임/오라/반짝이 => CSS로 꾸밈
 */
const EPIC_TITLES = [
  { id: "epic-1", title: "플라스틱 파괴자", subtitle: "일회용을 ‘의식적으로’ 줄이는 단계", icon: "noPlastic" },
  { id: "epic-2", title: "기후 위기 영웅", subtitle: "작은 실천이 모여 큰 변화를 만든다", icon: "hero" },
  { id: "epic-3", title: "에코 캠페이너", subtitle: "혼자보다 함께, 주변까지 움직이는 사람", icon: "megaphone" },
  { id: "epic-4", title: "환경 리더", subtitle: "기준을 세우고 습관을 만든다", icon: "crownLeaf" },
  { id: "epic-5", title: "제로웨이스트 선구자", subtitle: "쓰레기 ‘최소화 루틴’이 몸에 밴", icon: "bag" },
  { id: "epic-6", title: "자연 지킴이 헌신", subtitle: "불편함보다 지구를 먼저 생각", icon: "shield" },
  { id: "epic-7", title: "에코 워리어", subtitle: "꾸준함이 스펙이 되는 사람", icon: "swordLeaf" },
  { id: "epic-8", title: "저탄소 개척자", subtitle: "이동·소비·에너지를 설계하는 단계", icon: "path" },
  { id: "epic-9", title: "분리수거 명사수", subtitle: "망설임 없이 정확하게 분류", icon: "recycleTarget" },
];

const Icon = memo(function Icon({ type }) {
  // SVG는 가볍고 선명해서 폰트랑 같이 써도 퀄리티가 좋아요.
  switch (type) {
    case "noPlastic":
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M7 3h6l2 3v2H7V3z" />
          <path d="M9 8v13h6V8" />
          <path d="M4 4l16 16" className={styles.iconStrike} />
        </svg>
      );
    case "hero":
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M12 2l4 3v6c0 5-2.5 8-4 9-1.5-1-4-4-4-9V5l4-3z" />
          <path d="M7 10l-4 3 4 2 1-2 2-1-1-2z" className={styles.iconSoft} />
          <path d="M17 10l4 3-4 2-1-2-2-1 1-2z" className={styles.iconSoft} />
        </svg>
      );
    case "megaphone":
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M3 11v2l10 3V8L3 11z" />
          <path d="M13 8l7-3v14l-7-3V8z" />
          <path d="M6 13l1 5c.2.9 1 1.5 1.9 1.5H10l-2-7H6z" className={styles.iconSoft} />
        </svg>
      );
    case "crownLeaf":
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M4 9l4 3 4-6 4 6 4-3v8H4V9z" />
          <path d="M12 14c-3 0-5 2-5 5 3 0 5-2 5-5z" className={styles.iconLeaf} />
        </svg>
      );
    case "bag":
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M7 7c0-2 1.7-4 5-4s5 2 5 4" className={styles.iconStroke} />
          <path d="M6 7h12l-1 14H7L6 7z" />
          <path d="M10 12c1 1 3 1 4 0" className={styles.iconStroke} />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M12 2l8 4v6c0 6-4 9-8 10C8 21 4 18 4 12V6l8-4z" />
          <path d="M8 13c2 0 4-2 4-5-4 0-6 2-6 5 0 2 1 4 2 5 2-1 4-3 4-5" className={styles.iconLeaf} />
        </svg>
      );
    case "swordLeaf":
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M14 3l7 7-6 6-7-7 6-6z" />
          <path d="M3 21l6-6" className={styles.iconStroke} />
          <path d="M10 14c-3 0-5 2-5 5 3 0 5-2 5-5z" className={styles.iconLeaf} />
        </svg>
      );
    case "path":
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M4 20c6-8 10-8 16 0" className={styles.iconStroke} />
          <path d="M7 10c2-4 8-4 10 0" className={styles.iconStroke} />
          <path d="M12 4c-2 2-2 6 0 8 2-2 2-6 0-8z" className={styles.iconLeaf} />
        </svg>
      );
    case "recycleTarget":
      return (
        <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2z" className={styles.iconSoft} />
          <path d="M12 6a6 6 0 106 6 6 6 0 00-6-6z" />
          <path d="M12 10a2 2 0 102 2 2 2 0 00-2-2z" className={styles.iconLeaf} />
        </svg>
      );
    default:
      return null;
  }
});

const EpicBadgeCard = memo(function EpicBadgeCard({ item, selected, onSelect }) {
  const handleClick = useCallback(() => onSelect(item.id), [onSelect, item.id]);

  return (
    <button
      type="button"
      className={`${styles.badge} ${selected ? styles.badgeSelected : ""}`}
      onClick={handleClick}
    >
      <div className={styles.badgeGlow} aria-hidden="true" />
      <div className={styles.badgeFrame} aria-hidden="true" />
      <div className={styles.badgeContent}>
        <div className={styles.left}>
          <Icon type={item.icon} />
        </div>

        <div className={styles.right}>
          <div className={styles.title}>{item.title}</div>
          <div className={styles.subtitle}>{item.subtitle}</div>
        </div>
      </div>
      <div className={styles.sparkles} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </button>
  );
});

function EpicTitleBadges() {
  const [selectedId, setSelectedId] = useState(EPIC_TITLES[0]?.id ?? null);

  const onSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const selected = useMemo(
    () => EPIC_TITLES.find((t) => t.id === selectedId) ?? null,
    [selectedId]
  );

  const list = useMemo(() => EPIC_TITLES, []);

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>EPIC 칭호</div>
        <div className={styles.headerDesc}>텍스트는 폰트로 렌더링해서 한글이 안 깨져요.</div>
      </header>

      <section className={styles.grid}>
        {list.map((item) => (
          <EpicBadgeCard
            key={item.id}
            item={item}
            selected={item.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </section>

      {selected && (
        <section className={styles.preview}>
          <div className={styles.previewLabel}>선택된 칭호</div>
          <div className={styles.previewBox}>
            <div className={styles.previewTitle}>{selected.title}</div>
            <div className={styles.previewSub}>{selected.subtitle}</div>
          </div>
        </section>
      )}
    </div>
  );
}

export default memo(EpicTitleBadges);
