import { getIsoWeek } from "./planningStore";

export const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

/** Schuljahr beginnt im August (CH). */
export const getSchoolYearStart = (date = new Date()) => {
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return m >= 8 ? y : y - 1;
};

export const monthKey = (year, month) =>
  `${year}-${String(month).padStart(2, "0")}`;

export const weekKey = (year, kw) => `${year}-W${String(kw).padStart(2, "0")}`;

/** Aug (startYear) … Jul (startYear+1) */
export const getSchoolYearMonthList = (startYear) => {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const month = ((8 + i - 1) % 12) + 1;
    const year = month >= 8 ? startYear : startYear + 1;
    months.push({
      key: monthKey(year, month),
      year,
      month,
      label: MONTH_NAMES[month - 1],
      shortLabel: MONTH_NAMES_SHORT[month - 1],
    });
  }
  return months;
};

/** ISO-Kalenderwochen, die diesen Monat berühren */
export const getWeeksInMonth = (year, month) => {
  const lastDay = new Date(year, month, 0).getDate();
  const seen = new Map();
  for (let day = 1; day <= lastDay; day++) {
    const { kw, year: kwYear } = getIsoWeek(new Date(year, month - 1, day));
    const key = weekKey(kwYear, kw);
    if (!seen.has(key)) {
      seen.set(key, { kw, year: kwYear, key });
    }
  }
  return Array.from(seen.values()).sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    return a.kw - b.kw;
  });
};

export const parseMonthRoute = (yearStr, monthStr) => {
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  return { year, month };
};

/** Montag der ISO-Kalenderwoche (lokale Zeit). */
export const getMondayOfIsoWeek = (kw, year) => {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - (dayOfWeek - 1));
  const monday = new Date(mondayWeek1);
  monday.setDate(mondayWeek1.getDate() + (kw - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/** Datums-Labels Mo–Fr für eine KW (z. B. «12.05.»). */
export const getWeekdayDatesForIsoWeek = (kw, year) => {
  const monday = getMondayOfIsoWeek(kw, year);
  const fmt = (d) =>
    `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}.`;
  const ids = ["mo", "di", "mi", "do", "fr"];
  return Object.fromEntries(
    ids.map((id, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return [id, { date: d, label: fmt(d) }];
    })
  );
};

export const shiftMonth = (year, month, delta) => {
  let m = month + delta;
  let y = year;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return { year: y, month: m };
};
