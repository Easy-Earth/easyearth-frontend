import { memo, useCallback, useMemo, useState } from "react";
import styles from "./TitleBadges.module.css";

/**
 * ✅ 9개 카드 팔레트
 * - g1,g2,g3: 배경 글로우/그라데이션 포인트
 * - b1,b2: 왼쪽 아이콘 박스 톤
 * - ring: 링/광선 강조색(legendary에서 특히 예쁨)
 */
const PALETTES = {
  normal: [
    { g1: "rgba(120,255,210,.22)", g2: "rgba(120,190,255,.18)", g3: "rgba(255,255,255,.06)", b1: "rgba(190,255,235,.10)", b2: "rgba(120,255,210,.10)", ring: "rgba(200,245,255,.22)" },
    { g1: "rgba(160,255,140,.22)", g2: "rgba(100,210,255,.16)", g3: "rgba(255,255,255,.06)", b1: "rgba(200,255,200,.10)", b2: "rgba(140,255,180,.10)", ring: "rgba(180,255,220,.22)" },
    { g1: "rgba(255,210,120,.18)", g2: "rgba(140,255,200,.14)", g3: "rgba(255,255,255,.06)", b1: "rgba(255,230,180,.08)", b2: "rgba(170,255,210,.08)", ring: "rgba(255,230,180,.22)" },
    { g1: "rgba(150,200,255,.20)", g2: "rgba(160,255,230,.14)", g3: "rgba(255,255,255,.06)", b1: "rgba(190,220,255,.10)", b2: "rgba(160,255,230,.08)", ring: "rgba(190,220,255,.22)" },
    { g1: "rgba(255,160,200,.16)", g2: "rgba(140,220,255,.14)", g3: "rgba(255,255,255,.06)", b1: "rgba(255,190,220,.08)", b2: "rgba(160,220,255,.08)", ring: "rgba(255,200,240,.22)" },
    { g1: "rgba(180,160,255,.18)", g2: "rgba(120,255,210,.14)", g3: "rgba(255,255,255,.06)", b1: "rgba(210,200,255,.08)", b2: "rgba(140,255,220,.08)", ring: "rgba(210,200,255,.22)" },
    { g1: "rgba(255,220,150,.18)", g2: "rgba(110,255,190,.14)", g3: "rgba(255,255,255,.06)", b1: "rgba(255,235,200,.08)", b2: "rgba(160,255,220,.08)", ring: "rgba(255,235,200,.22)" },
    { g1: "rgba(120,255,180,.18)", g2: "rgba(120,210,255,.16)", g3: "rgba(255,255,255,.06)", b1: "rgba(180,255,220,.08)", b2: "rgba(140,210,255,.08)", ring: "rgba(180,255,220,.22)" },
    { g1: "rgba(255,190,120,.16)", g2: "rgba(190,255,210,.14)", g3: "rgba(255,255,255,.06)", b1: "rgba(255,210,160,.08)", b2: "rgba(190,255,220,.08)", ring: "rgba(255,210,160,.22)" },
  ],
  rare: [
    { g1: "rgba(255,180,110,.42)", g2: "rgba(255,235,170,.30)", g3: "rgba(70,255,210,.20)", b1: "rgba(255,210,160,.11)", b2: "rgba(255,220,170,.10)", ring: "rgba(255,220,160,.26)" },
    { g1: "rgba(255,140,90,.40)", g2: "rgba(255,210,140,.28)", g3: "rgba(80,255,230,.18)", b1: "rgba(255,190,140,.11)", b2: "rgba(255,230,170,.08)", ring: "rgba(255,210,150,.26)" },
    { g1: "rgba(255,210,120,.38)", g2: "rgba(140,255,210,.22)", g3: "rgba(110,200,255,.16)", b1: "rgba(255,230,170,.10)", b2: "rgba(170,255,230,.08)", ring: "rgba(255,230,170,.24)" },
    { g1: "rgba(170,255,220,.30)", g2: "rgba(255,235,170,.24)", g3: "rgba(255,150,200,.14)", b1: "rgba(190,255,235,.10)", b2: "rgba(255,220,170,.08)", ring: "rgba(220,255,240,.22)" },
    { g1: "rgba(255,235,170,.34)", g2: "rgba(255,170,220,.18)", g3: "rgba(120,210,255,.16)", b1: "rgba(255,240,200,.10)", b2: "rgba(255,190,230,.08)", ring: "rgba(255,235,170,.24)" },
    { g1: "rgba(200,170,255,.26)", g2: "rgba(255,220,150,.22)", g3: "rgba(80,255,210,.18)", b1: "rgba(220,210,255,.10)", b2: "rgba(255,230,170,.08)", ring: "rgba(230,210,255,.22)" },
    { g1: "rgba(110,220,255,.26)", g2: "rgba(255,220,150,.22)", g3: "rgba(140,255,200,.18)", b1: "rgba(160,230,255,.10)", b2: "rgba(255,230,170,.08)", ring: "rgba(160,230,255,.22)" },
    { g1: "rgba(255,200,120,.34)", g2: "rgba(120,255,190,.22)", g3: "rgba(255,255,255,.10)", b1: "rgba(255,220,160,.10)", b2: "rgba(170,255,220,.08)", ring: "rgba(255,220,160,.24)" },
    { g1: "rgba(255,170,120,.34)", g2: "rgba(120,210,255,.20)", g3: "rgba(120,255,190,.18)", b1: "rgba(255,210,160,.10)", b2: "rgba(160,220,255,.08)", ring: "rgba(255,210,160,.24)" },
  ],
  epic: [
    { g1: "rgba(210,110,255,.62)", g2: "rgba(90,255,225,.42)", g3: "rgba(255,120,210,.28)", b1: "rgba(170,110,255,.13)", b2: "rgba(90,255,225,.10)", ring: "rgba(240,220,255,.26)" },
    { g1: "rgba(255,90,190,.56)", g2: "rgba(120,170,255,.36)", g3: "rgba(90,255,225,.22)", b1: "rgba(255,120,220,.12)", b2: "rgba(150,190,255,.10)", ring: "rgba(255,210,240,.24)" },
    { g1: "rgba(120,170,255,.58)", g2: "rgba(210,110,255,.40)", g3: "rgba(255,210,120,.18)", b1: "rgba(160,200,255,.12)", b2: "rgba(200,150,255,.10)", ring: "rgba(200,220,255,.24)" },
    { g1: "rgba(90,255,225,.52)", g2: "rgba(255,120,210,.34)", g3: "rgba(210,110,255,.22)", b1: "rgba(120,255,230,.12)", b2: "rgba(255,160,230,.10)", ring: "rgba(190,255,240,.24)" },
    { g1: "rgba(255,210,120,.30)", g2: "rgba(210,110,255,.44)", g3: "rgba(90,255,225,.22)", b1: "rgba(255,230,160,.10)", b2: "rgba(200,150,255,.10)", ring: "rgba(255,230,160,.22)" },
    { g1: "rgba(170,255,140,.26)", g2: "rgba(210,110,255,.44)", g3: "rgba(255,120,210,.20)", b1: "rgba(200,255,180,.10)", b2: "rgba(200,150,255,.10)", ring: "rgba(220,255,200,.22)" },
    { g1: "rgba(255,120,210,.52)", g2: "rgba(90,255,225,.36)", g3: "rgba(120,170,255,.22)", b1: "rgba(255,150,230,.12)", b2: "rgba(120,255,230,.10)", ring: "rgba(255,210,240,.24)" },
    { g1: "rgba(210,110,255,.54)", g2: "rgba(255,210,120,.26)", g3: "rgba(90,255,225,.22)", b1: "rgba(200,150,255,.12)", b2: "rgba(255,230,160,.10)", ring: "rgba(240,220,255,.24)" },
    { g1: "rgba(90,255,225,.48)", g2: "rgba(120,170,255,.34)", g3: "rgba(255,120,210,.22)", b1: "rgba(120,255,230,.12)", b2: "rgba(150,190,255,.10)", ring: "rgba(190,255,240,.24)" },
  ],
  legendary: [
    { g1: "rgba(220,245,255,.72)", g2: "rgba(255,200,120,.60)", g3: "rgba(140,255,210,.46)", b1: "rgba(255,215,150,.11)", b2: "rgba(220,245,255,.10)", ring: "rgba(230,245,255,.34)" },
    { g1: "rgba(255,235,190,.68)", g2: "rgba(170,240,255,.52)", g3: "rgba(255,160,220,.30)", b1: "rgba(255,235,190,.12)", b2: "rgba(190,245,255,.10)", ring: "rgba(255,235,190,.34)" },
    { g1: "rgba(200,255,230,.66)", g2: "rgba(255,210,140,.54)", g3: "rgba(220,245,255,.30)", b1: "rgba(200,255,230,.12)", b2: "rgba(255,230,170,.10)", ring: "rgba(200,255,230,.34)" },
    { g1: "rgba(255,210,140,.64)", g2: "rgba(140,255,210,.50)", g3: "rgba(220,245,255,.30)", b1: "rgba(255,210,140,.12)", b2: "rgba(140,255,210,.10)", ring: "rgba(255,210,140,.34)" },
    { g1: "rgba(220,245,255,.70)", g2: "rgba(255,160,220,.40)", g3: "rgba(255,210,140,.34)", b1: "rgba(220,245,255,.12)", b2: "rgba(255,190,230,.10)", ring: "rgba(220,245,255,.34)" },
    { g1: "rgba(140,255,210,.62)", g2: "rgba(255,235,190,.52)", g3: "rgba(170,240,255,.32)", b1: "rgba(140,255,210,.12)", b2: "rgba(255,235,190,.10)", ring: "rgba(190,255,240,.34)" },
    { g1: "rgba(255,200,120,.64)", g2: "rgba(220,245,255,.56)", g3: "rgba(140,255,210,.34)", b1: "rgba(255,200,120,.12)", b2: "rgba(220,245,255,.10)", ring: "rgba(255,230,170,.34)" },
    { g1: "rgba(170,240,255,.66)", g2: "rgba(255,235,190,.50)", g3: "rgba(255,160,220,.32)", b1: "rgba(190,245,255,.12)", b2: "rgba(255,235,190,.10)", ring: "rgba(190,245,255,.34)" },
    { g1: "rgba(255,235,190,.66)", g2: "rgba(140,255,210,.52)", g3: "rgba(220,245,255,.32)", b1: "rgba(255,235,190,.12)", b2: "rgba(140,255,210,.10)", ring: "rgba(255,235,190,.34)" },
  ],
};

/** 등급별 이펙트 강도 */
const FX_BY_GRADE = {
  normal: 0.2,
  rare: 0.55,
  epic: 0.85,
  legendary: 1.25,
};

const TITLE_SECTIONS = [
  {
    grade: "normal",
    headerTitle: "NORMAL 칭호",
    headerDesc: "가볍게 시작하는 친환경 습관",
    items: [
      { id: "n-1", title: "오늘도 지구 생각중", subtitle: "선택 하나에 마음이 움직이는 중", icon: "earth" },
      { id: "n-2", title: "에코 입문자", subtitle: "초록 루틴을 막 시작한 단계", icon: "sprout" },
      { id: "n-3", title: "작은 실천가", subtitle: "하루 하나, 꾸준함을 쌓는다", icon: "check" },
      { id: "n-4", title: "텀블러 챙기는 사람", subtitle: "일회용 컵을 자연스럽게 거절", icon: "tumbler" },
      { id: "n-5", title: "분리수거 연습생", subtitle: "헷갈려도 포기하지 않는 사람", icon: "recycle" },
      { id: "n-6", title: "비닐 거절러", subtitle: "“봉투 필요 없어요”를 말할 수 있음", icon: "noPlastic" },
      { id: "n-7", title: "환경 관심러", subtitle: "뉴스 한 줄도 그냥 못 지나침", icon: "magnifier" },
      { id: "n-8", title: "녹색 한 걸음", subtitle: "작지만 분명한 시작", icon: "foot" },
      { id: "n-9", title: "착한 소비 연습중", subtitle: "가격표 옆에 환경을 같이 본다", icon: "tag" },
    ],
  },
  {
    grade: "rare",
    headerTitle: "RARE 칭호",
    headerDesc: "습관이 눈에 띄기 시작한 단계",
    items: [
      { id: "r-1", title: "지구 지킴이", subtitle: "일상 속 선택이 지구 편", icon: "shieldLeaf" },
      { id: "r-2", title: "친환경 행동가", subtitle: "말보다 실천이 먼저", icon: "hero" },
      { id: "r-3", title: "환경 지식인", subtitle: "왜 하는지 알고 하는 사람", icon: "book" },
      { id: "r-4", title: "에코 도전자", subtitle: "불편함을 감수하고 바꿔나감", icon: "flag" },
      { id: "r-5", title: "제로웨이스트 도전자", subtitle: "쓰레기 최소화 루틴을 만든다", icon: "bag" },
      { id: "r-6", title: "일회용품 슬레이어", subtitle: "일회용 유혹을 이겨낸다", icon: "noPlastic" },
      { id: "r-7", title: "자연을 사랑한 자", subtitle: "풍경이 아니라 ‘미래’를 지킨다", icon: "leafHeart" },
      { id: "r-8", title: "분리수거 에이스", subtitle: "망설임 없이 정확하게", icon: "recycleTarget" },
      { id: "r-9", title: "재활용 미스터리", subtitle: "분류 정확도가 올라가는 중", icon: "recycle" },
    ],
  },
  {
    grade: "epic",
    headerTitle: "EPIC 칭호",
    headerDesc: "실천이 ‘정체성’이 되는 단계",
    items: [
      { id: "e-1", title: "플라스틱 파괴자", subtitle: "일회용을 ‘의식적으로’ 줄이는 단계", icon: "noPlastic" },
      { id: "e-2", title: "기후 위기 영웅", subtitle: "작은 실천이 모여 큰 변화를 만든다", icon: "hero" },
      { id: "e-3", title: "에코 캠페이너", subtitle: "혼자보다 함께, 주변까지 움직이는 사람", icon: "megaphone" },
      { id: "e-4", title: "환경 리더", subtitle: "기준을 세우고 습관을 만든다", icon: "crownLeaf" },
      { id: "e-5", title: "제로웨이스트 선구자", subtitle: "쓰레기 ‘최소화 루틴’이 몸에 밴", icon: "bag" },
      { id: "e-6", title: "자연 지킴이 헌신", subtitle: "불편함보다 지구를 먼저 생각", icon: "shieldLeaf" },
      { id: "e-7", title: "에코 워리어", subtitle: "꾸준함이 스펙이 되는 사람", icon: "swordLeaf" },
      { id: "e-8", title: "저탄소 개척자", subtitle: "이동·소비·에너지를 설계하는 단계", icon: "path" },
      { id: "e-9", title: "분리수거 명사수", subtitle: "망설임 없이 정확하게 분류", icon: "recycleTarget" },
    ],
  },
  {
    grade: "legendary",
    headerTitle: "LEGENDARY 칭호",
    headerDesc: "오라가 다른, 진짜 레전드",
    items: [
      { id: "l-1", title: "탄소중립 수호신", subtitle: "선택이 곧 영향력인 사람", icon: "earth" },
      { id: "l-2", title: "지구의 최후 방벽", subtitle: "끝까지 지키는 의지", icon: "shieldLeaf" },
      { id: "l-3", title: "초록 전설", subtitle: "모두가 본받는 기준점", icon: "leafHeart" },
      { id: "l-4", title: "제로웨이스트 마스터", subtitle: "낭비가 없는 삶을 설계", icon: "crownLeaf" },
      { id: "l-5", title: "기후변화 저격수", subtitle: "문제의 핵심을 정확히 겨눈다", icon: "recycleTarget" },
      { id: "l-6", title: "환경의 심장", subtitle: "가치가 생활 속에 흐른다", icon: "leafHeart" },
      { id: "l-7", title: "지속가능성의 상징", subtitle: "행동으로 증명하는 사람", icon: "book" },
      { id: "l-8", title: "에코 대현자", subtitle: "실천·지식·영향력을 모두 갖춤", icon: "book" },
      { id: "l-9", title: "푸른 행성의 왕관", subtitle: "지구를 위한 선택의 정점", icon: "earth" },
    ],
  },
];

const Icon = memo(function Icon({ type, className }) {
  switch (type) {
    case "earth":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2z" />
          <path d="M7 7c2 1 3 1 5 0 1 2 3 3 5 3-1 4-4 6-8 6-1-3-1-6-2-9z" opacity=".35" />
        </svg>
      );
    case "sprout":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M12 22v-8" />
          <path d="M12 14c-5 0-8-3-8-8 5 0 8 3 8 8z" />
          <path d="M12 14c5 0 8-3 8-8-5 0-8 3-8 8z" opacity=".6" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      );
    case "tumbler":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M8 3h8l-1 3H9L8 3z" />
          <path d="M9 6h6l-1 15H10L9 6z" />
        </svg>
      );
    case "recycle":
    case "recycleTarget":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2z" opacity=".45" />
          <path d="M12 6a6 6 0 106 6 6 6 0 00-6-6z" />
          <path d="M12 10a2 2 0 102 2 2 2 0 00-2-2z" opacity=".6" />
        </svg>
      );
    case "noPlastic":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M7 3h6l2 3v2H7V3z" />
          <path d="M9 8v13h6V8" />
          <path d="M4 4l16 16" opacity=".75" />
        </svg>
      );
    case "magnifier":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M10 18a8 8 0 110-16 8 8 0 010 16z" />
          <path d="M21 21l-5-5" opacity=".65" />
        </svg>
      );
    case "foot":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M9 10c0-3 2-6 4-6 3 0 2 6 0 9-1 2-1 6 2 7-4 1-8-1-6-6z" />
        </svg>
      );
    case "tag":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M3 12l9-9h6l3 3v6l-9 9L3 12z" />
          <circle cx="16" cy="8" r="1.5" opacity=".6" />
        </svg>
      );
    case "shieldLeaf":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M12 2l8 4v6c0 6-4 9-8 10C8 21 4 18 4 12V6l8-4z" />
          <path d="M8 13c2 0 4-2 4-5-4 0-6 2-6 5 0 2 1 4 2 5 2-1 4-3 4-5" opacity=".55" />
        </svg>
      );
    case "hero":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M12 2l4 3v6c0 5-2.5 8-4 9-1.5-1-4-4-4-9V5l4-3z" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M5 4h9a3 3 0 013 3v13H8a3 3 0 00-3 3V4z" />
          <path d="M19 20h-9a3 3 0 00-3 3" opacity=".55" />
        </svg>
      );
    case "flag":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M6 22V3" />
          <path d="M6 4h10l-2 3 2 3H6z" />
        </svg>
      );
    case "leafHeart":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M12 21s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z" />
        </svg>
      );
    case "megaphone":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M3 11v2l10 3V8L3 11z" />
          <path d="M13 8l7-3v14l-7-3V8z" opacity=".7" />
        </svg>
      );
    case "crownLeaf":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M4 9l4 3 4-6 4 6 4-3v8H4V9z" />
        </svg>
      );
    case "bag":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M7 7c0-2 1.7-4 5-4s5 2 5 4" opacity=".7" />
          <path d="M6 7h12l-1 14H7L6 7z" />
        </svg>
      );
    case "swordLeaf":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M14 3l7 7-6 6-7-7 6-6z" />
          <path d="M3 21l6-6" opacity=".7" />
        </svg>
      );
    case "path":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M4 20c6-8 10-8 16 0" opacity=".75" />
          <path d="M7 10c2-4 8-4 10 0" />
        </svg>
      );
    default:
      return null;
  }
});

const BadgeCard = memo(function BadgeCard({ grade, item, idx, selected, onSelect }) {
  const handleClick = useCallback(() => onSelect(item.id), [onSelect, item.id]);

  const styleVars = useMemo(() => {
    const pal = PALETTES[grade][idx % 9];
    const fx = FX_BY_GRADE[grade];
    return {
      "--g1": pal.g1,
      "--g2": pal.g2,
      "--g3": pal.g3,
      "--b1": pal.b1,
      "--b2": pal.b2,
      "--ring": pal.ring,
      "--fx": fx,
    };
  }, [grade, idx]);

  return (
    <button
      type="button"
      className={`${styles.badge} ${styles[grade]} ${selected ? styles.badgeSelected : ""}`}
      onClick={handleClick}
      style={styleVars}
    >
      <div className={styles.badgeGlow} aria-hidden="true" />
      <div className={styles.badgeFrame} aria-hidden="true" />

      {/* rare 이상에서만 눈에 띄게 동작 (CSS에서 --fx로 제어) */}
      <div className={styles.shimmer} aria-hidden="true" />

      {/* legendary 전용 레이어(하지만 CSS에서 normal/rare/epic은 자동으로 숨김) */}
      <div className={styles.rays} aria-hidden="true" />
      <div className={styles.ring} aria-hidden="true" />

      <div className={styles.badgeContent}>
        <div className={styles.left}>
          <Icon type={item.icon} className={styles.icon} />
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

function TitleBadges() {
  const initialId = useMemo(() => TITLE_SECTIONS[0]?.items?.[0]?.id ?? null, []);
  const [selectedId, setSelectedId] = useState(initialId);

  const onSelect = useCallback((id) => setSelectedId(id), []);

  const flatList = useMemo(() => TITLE_SECTIONS.flatMap((s) => s.items), []);
  const selected = useMemo(
    () => flatList.find((t) => t.id === selectedId) ?? null,
    [flatList, selectedId]
  );

  return (
    <div className={styles.wrap}>
      {TITLE_SECTIONS.map((section) => (
        <div key={section.grade} className={styles.section}>
          <header className={styles.header}>
            <div className={styles.headerTitle}>{section.headerTitle}</div>
            <div className={styles.headerDesc}>{section.headerDesc}</div>
          </header>

          <section className={styles.grid}>
            {section.items.map((item, idx) => (
              <BadgeCard
                key={item.id}
                grade={section.grade}
                item={item}
                idx={idx}
                selected={item.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </section>
        </div>
      ))}

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

export default memo(TitleBadges);
