import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ECO_DAYS } from '../../utils/ecoDays';
import styles from './EcoCalendar.module.css';

const EcoCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 1. 선택한 날짜의 기념일 찾기
  const selectedEvent = useMemo(() => {
    return ECO_DAYS.find(
      (e) => e.month === selectedDate.getMonth() + 1 && e.day === selectedDate.getDate()
    );
  }, [selectedDate]);

  // 2. 가장 가까운 기념일 D-Day 계산
  const upcomingEvent = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    return ECO_DAYS.map(day => {
      let targetDate = new Date(currentYear, day.month - 1, day.day);
      if (targetDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        targetDate.setFullYear(currentYear + 1);
      }
      const diffTime = targetDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...day, diffDays };
    }).sort((a, b) => a.diffDays - b.diffDays)[0];
  }, []);

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const ecoDay = ECO_DAYS.find(
        (e) => e.month === date.getMonth() + 1 && e.day === date.getDate()
      );
      if (ecoDay) return <div className={styles.dot}></div>; // 날짜 밑에 점 표시
    }
    return null;
  };

  return (
    <div className={styles.calendarWrapper}>
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        locale="ko-KR"
        calendarType="gregory"
        formatDay={(locale, date) => date.getDate()}
        tileContent={tileContent}
        next2Label={null}
        prev2Label={null}
      />

      <div className={styles.infoSection}>
        <div className={styles.ddayBox}>
            <span className={styles.leafIcon}>🌱</span>
            {upcomingEvent.diffDays === 0 ? (
                <span>오늘은 <strong>[{upcomingEvent.name}]</strong>입니다.</span>
            ) : (
                <span><strong>[{upcomingEvent.name}]</strong>까지 {upcomingEvent.diffDays}일 남았습니다.</span>
            )}
        </div>

        
        {selectedEvent && (
          <div className={styles.detailBox}>
            <div className={styles.eventDate}> {selectedEvent.month}월 {selectedEvent.day}일</div>
            <h4 className={styles.eventName}>{selectedEvent.name}</h4>
            <p className={styles.eventDesc}>{selectedEvent.desc}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EcoCalendar;