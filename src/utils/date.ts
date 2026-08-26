import { CafeStatus } from '../types';

export const WEEKLY_SCHEDULE = {
  weekday: {
    openHour: 7,
    openMinute: 0,
    closeHour: 21,
    closeMinute: 0,
    openLabel: '7:00 AM',
    closeLabel: '9:00 PM',
  },
  weekend: {
    openHour: 8,
    openMinute: 0,
    closeHour: 22,
    closeMinute: 0,
    openLabel: '8:00 AM',
    closeLabel: '10:00 PM',
  },
  hoursDisplay: 'Mon–Fri: 7:00 AM – 9:00 PM • Sat–Sun: 8:00 AM – 10:00 PM',
  kitchenHoursDisplay: 'Kitchen serves hot brunch & dishes until 45 mins before closing.'
};

export const AVAILABLE_TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM'
];

export const getMinReservationDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const getMaxReservationDate = (): string => {
  const future = new Date();
  future.setDate(future.getDate() + 60); // 60 days ahead
  return future.toISOString().split('T')[0];
};

export const getCafeLiveStatus = (overrideDate?: Date): CafeStatus => {
  const now = overrideDate || new Date();
  const dayIndex = now.getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  const currentSchedule = isWeekend ? WEEKLY_SCHEDULE.weekend : WEEKLY_SCHEDULE.weekday;
  const tomorrowDayIndex = (dayIndex + 1) % 7;
  const isTomorrowWeekend = tomorrowDayIndex === 0 || tomorrowDayIndex === 6;
  const tomorrowSchedule = isTomorrowWeekend ? WEEKLY_SCHEDULE.weekend : WEEKLY_SCHEDULE.weekday;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentMinutesFromMidnight = currentHour * 60 + currentMinute;

  const openMinutes = currentSchedule.openHour * 60 + currentSchedule.openMinute;
  const closeMinutes = currentSchedule.closeHour * 60 + currentSchedule.closeMinute;

  const isOpen = currentMinutesFromMidnight >= openMinutes && currentMinutesFromMidnight < closeMinutes;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[dayIndex];
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let statusText = '';
  let nextTransition = '';

  if (isOpen) {
    const minutesUntilClose = closeMinutes - currentMinutesFromMidnight;
    if (minutesUntilClose <= 45) {
      statusText = `Closing Soon (${minutesUntilClose}m)`;
      nextTransition = `Closes at ${currentSchedule.closeLabel}`;
    } else {
      statusText = 'Open Now';
      nextTransition = `Closes at ${currentSchedule.closeLabel}`;
    }
  } else {
    if (currentMinutesFromMidnight < openMinutes) {
      const minutesUntilOpen = openMinutes - currentMinutesFromMidnight;
      const hours = Math.floor(minutesUntilOpen / 60);
      const mins = minutesUntilOpen % 60;
      statusText = `Opens at ${currentSchedule.openLabel}`;
      nextTransition = hours > 0 ? `Opens today in ${hours}h ${mins}m` : `Opens today in ${mins} mins`;
    } else {
      statusText = 'Closed for Tonight';
      nextTransition = `Opens tomorrow at ${tomorrowSchedule.openLabel}`;
    }
  }

  return {
    isOpen,
    statusText,
    nextTransition,
    currentDay,
    currentTime: timeFormatted,
  };
};

export const formatDate = (timestamp: number | string | Date): string => {
  if (!timestamp) return '–';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (timestamp: number | string): string => {
  if (!timestamp) return '–';
  const numTime = typeof timestamp === 'string' ? (isNaN(Number(timestamp)) ? new Date(timestamp).getTime() : Number(timestamp)) : timestamp;
  const now = Date.now();
  const diff = now - numTime;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};
