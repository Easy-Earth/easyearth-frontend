import styles from "./MyPageTabs.module.css";

export default function MyPageTabs({ tabs, activeTab, onChange }) {
  return (
    <div className={styles.tabs}>
      {tabs.map((t) => (
        <button
          key={t.key}
          className={activeTab === t.key ? styles.active : ""}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
