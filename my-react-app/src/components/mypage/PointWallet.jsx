import styles from "./PointWallet.module.css";

export default function PointWallet({ wallet }) {
  return (
    <section className={styles.card}>
      <h3>포인트 지갑</h3>

      <div className={styles.now}>
        {wallet.nowPoint.toLocaleString()} P
      </div>

      <ul>
        <li>누적 획득 {wallet.totalEarnedPoint}P</li>
        <li>누적 사용 {wallet.totalSpentPoint}P</li>
      </ul>
    </section>
  );
}
