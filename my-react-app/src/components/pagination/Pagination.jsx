import styles from "./Pagination.module.css";

const Pagination = ({ pageInfo, onChangePage, disabled = false }) => {
  const { currentPage = 1, startPage = 1, endPage = 1, maxPage = 1 } =
    pageInfo || {};

  const pages = [];
  for (let i = startPage; i <= endPage; i += 1) pages.push(i);

  return (
    <div className={styles.pagination}>
      {/* 이전 페이지 이동 */}
      <button
        type="button"
        className={styles.arrow}
        onClick={() => onChangePage(currentPage - 1)}
        disabled={disabled || currentPage <= 1}
      >
        ‹
      </button>

      {/* 페이지 번호 */}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`${styles.num} ${p === currentPage ? styles.active : ""}`}
          onClick={() => onChangePage(p)}
          disabled={disabled}
        >
          {p}
        </button>
      ))}

      {/* 다음 페이지 이동 */}
      <button
        type="button"
        className={styles.arrow}
        onClick={() => onChangePage(currentPage + 1)}
        disabled={disabled || currentPage >= maxPage}
      >
        ›
      </button>
    </div>
  );
};

export default Pagination;
