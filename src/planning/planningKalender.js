import {
  getSchoolYearStart,
  getSchoolYearMonthList,
  monthKey,
} from "./calendarUtils";

export const emptyMonthEntry = () => ({
  focus: "",
  notizen: "",
  weeks: {},
});

export const buildKalenderForSchoolYear = (startYear) => {
  const months = {};
  for (const m of getSchoolYearMonthList(startYear)) {
    months[m.key] = emptyMonthEntry();
  }
  return {
    schoolYearStart: startYear,
    months,
  };
};

export const normalizeKalender = (kalender) => {
  const startYear =
    kalender?.schoolYearStart != null
      ? Number(kalender.schoolYearStart)
      : getSchoolYearStart();
  const base = buildKalenderForSchoolYear(startYear);
  if (!kalender?.months) {
    return base;
  }
  const months = { ...base.months };
  for (const key of Object.keys(months)) {
    const incoming = kalender.months[key];
    if (incoming) {
      months[key] = {
        focus: incoming.focus || "",
        notizen: incoming.notizen || "",
        weeks:
          incoming.weeks && typeof incoming.weeks === "object"
            ? { ...incoming.weeks }
            : {},
      };
    }
  }
  return { schoolYearStart: startYear, months };
};

export const getMonthEntry = (store, year, month) => {
  const key = monthKey(year, month);
  const k = store.kalender || buildKalenderForSchoolYear(getSchoolYearStart());
  return k.months[key] || emptyMonthEntry();
};

export const updateMonthEntry = (store, year, month, patch) => {
  const key = monthKey(year, month);
  const kalender = normalizeKalender(store.kalender);
  kalender.months[key] = { ...kalender.months[key], ...patch };
  return { ...store, kalender };
};

export const updateWeekInMonth = (store, year, month, wkYear, kw, patch) => {
  const key = monthKey(year, month);
  const wkKey = `${wkYear}-W${kw}`;
  const kalender = normalizeKalender(store.kalender);
  const monthEntry = kalender.months[key] || emptyMonthEntry();
  monthEntry.weeks = {
    ...monthEntry.weeks,
    [wkKey]: { ...(monthEntry.weeks[wkKey] || {}), ...patch },
  };
  kalender.months[key] = monthEntry;
  return { ...store, kalender };
};
