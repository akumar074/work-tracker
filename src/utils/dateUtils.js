import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subWeeks, subMonths, eachDayOfInterval, getISOWeek, getYear,
  parseISO, isToday, isSameMonth, isSameDay, addMonths, subDays,
  addDays, addWeeks
} from 'date-fns';

export const fmt = (date, pattern = 'yyyy-MM-dd') => format(date, pattern);
export const fmtDisplay = (date) => format(date, 'MMM d, yyyy');
export const fmtMonth = (date) => format(date, 'MMMM yyyy');
export const fmtWeekKey = (date) => `${getYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`;
export const fmtMonthKey = (date) => format(date, 'yyyy-MM');

export const todayStr = () => fmt(new Date());
export const nowDate = () => new Date();

export { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths,
         eachDayOfInterval, isToday, isSameMonth, isSameDay, addMonths, subDays,
         addDays, addWeeks, parseISO, format };

export function getDateRangePreset(preset) {
  const today = new Date();
  switch (preset) {
    case 'last7':
      return { start: fmt(subDays(today, 6)), end: fmt(today), label: 'Last 7 days' };
    case 'lastWeek': {
      const ws = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      const we = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      return { start: fmt(ws), end: fmt(we), label: 'Last week' };
    }
    case 'lastMonth': {
      const ms = startOfMonth(subMonths(today, 1));
      const me = endOfMonth(subMonths(today, 1));
      return { start: fmt(ms), end: fmt(me), label: 'Last month' };
    }
    case 'last3Months': {
      const ms = startOfMonth(subMonths(today, 3));
      return { start: fmt(ms), end: fmt(today), label: 'Last 3 months' };
    }
    case 'last6Months': {
      const ms = startOfMonth(subMonths(today, 6));
      return { start: fmt(ms), end: fmt(today), label: 'Last 6 months' };
    }
    default:
      return { start: fmt(today), end: fmt(today), label: 'Today' };
  }
}

export function getWeekDays(date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthGrid(date) {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}
