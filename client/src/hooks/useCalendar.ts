import { useState, useMemo } from 'react';

export const useCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // First day of the month (0-6, where 0 is Sunday)
    const firstDayIndex = date.getDay();
    
    // Get days of previous month for padding
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex; i > 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDate - i + 1),
        currentMonth: false
      });
    }
    
    // Get days of current month
    const lastDate = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDate; i++) {
      days.push({
        date: new Date(year, month, i),
        currentMonth: true
      });
    }
    
    // Get days of next month for padding (to fill a 6-row grid usually)
    const totalDaysVisible = 42; // 6 rows * 7 days
    const nextMonthDays = totalDaysVisible - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        currentMonth: false
      });
    }

    return days;
  }, [currentDate]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return {
    currentDate,
    daysInMonth,
    nextMonth,
    prevMonth,
    goToToday
  };
};
