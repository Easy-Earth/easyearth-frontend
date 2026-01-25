import styles from "./StatSummary.module.css";

export default function StatSummary({ impact }) {
  return (
    <section className={styles.card}>
      <h3>환경 기여 통계</h3>

      <ul>
        <li>
          <span>완료 퀘스트</span>
          <strong>{impact.completedQuests}회</strong>
        </li>
        <li>
          <span>CO₂ 절감</span>
          <strong>{impact.totalCo2Gram} g</strong>
        </li>
        <li>
          <span>나무 효과</span>
          <strong>{impact.totalTreeCount} 그루</strong>
        </li>
      </ul>
    </section>
  );
}
