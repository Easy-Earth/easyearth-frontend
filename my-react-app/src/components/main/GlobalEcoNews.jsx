import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './GlobalEcoNews.module.css';

const GlobalEcoNews = () => {
  const [selectedCategory, setSelectedCategory] = useState("Climate");
  const [newsData, setNewsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGlobalNews();
  }, []);

  const fetchGlobalNews = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/spring/global/news');
      
      let data = response.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error("JSON Parse Error", e);
        }
      }
      
      // 데이터가 없을 경우 처리
      if (!data || Object.keys(data).length === 0) {
          setNewsData({});
      } else {
          setNewsData(data);
      }
      setLoading(false);

    } catch (err) {
      console.error("Global News Fetch Error:", err);
      setError("글로벌 뉴스를 불러오는 데 실패했습니다.");
      setLoading(false);
    }
  };

  const currentList = newsData[selectedCategory] || [];

  if (loading) return <div className={styles.loadingText}>🌍 전 세계의 환경 소식을 모으는 중...</div>;
  if (error) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
            <h2 className={styles.title}>🌍 Global Eco News</h2>
            <span className={styles.subtitle}>New York Times × Gemini AI</span>
        </div>
        <div className={styles.tabs}>
            {["Climate", "Weather"].map(cat => (
                <button 
                    key={cat}
                    className={`${styles.tabButton} ${selectedCategory === cat ? styles.activeTab : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>
      
      <div className={styles.scrollContainer}>
        {currentList.length > 0 ? (
            currentList.map((news, index) => (
            <a key={index} className={styles.newsCard} href={news.originalUrl} target="_blank" rel="noopener noreferrer">
                <div className={styles.imageArea} style={{ backgroundImage: `url(${news.imageUrl || '/default-news.jpg'})` }}>
                {!news.imageUrl && <span className={styles.noImage}>No Image</span>}
                </div>
                <div className={styles.contentArea}>
                <h3 className={styles.newsTitle}>{news.title}</h3>
                <p className={styles.newsSummary}>{news.summary}</p>
                <span className={styles.aiLabel}>Summarized by Gemini</span>
                </div>
            </a>
            ))
        ) : (
            <div className={styles.emptyState}>해당 카테고리의 뉴스가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default GlobalEcoNews;
