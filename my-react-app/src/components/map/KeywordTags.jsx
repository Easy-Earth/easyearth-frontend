import { memo } from "react";
import styles from "./KeywordTags.module.css";

function KeywordTags({ keywords }) {
  if (!keywords) return null;

  const tagList = keywords
    .split(",")
    .map((word) => word.trim())
    .filter((word) => word !== "")
    .map((word) => (word.startsWith("#") ? word : `#${word}`));

  return (
    <div className={styles.tagContainer}>
      {tagList.map((tag, idx) => (
        <span key={`${tag}-${idx}`} className={styles.tag}>
          {tag}
        </span>
      ))}
    </div>
  );
}

export default memo(KeywordTags);