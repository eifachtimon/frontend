import { WEEKDAYS } from "./planningDefaults";
import { getIsoWeek } from "./planningStore";
import { getTodayWeekdayId } from "./planningLevels";
import { vorhabenLevelPath } from "../config/appUrls";

const WEEKDAY_LABELS = Object.fromEntries(WEEKDAYS.map((d) => [d.id, d.label]));

const FULL_WEEKDAY = {
  mo: "Montag",
  di: "Dienstag",
  mi: "Mittwoch",
  do: "Donnerstag",
  fr: "Freitag",
};

export const getTodayIsoDate = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const formatGermanDateLabel = (date = new Date()) => {
  return date.toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const isReminderForToday = (item, { isoDate, kw, todayWd }) => {
  if (!item || item.done) {
    return false;
  }
  if (item.dueDate && String(item.dueDate).slice(0, 10) === isoDate) {
    return true;
  }
  if (todayWd && item.weekday === todayWd && item.kw === kw) {
    return true;
  }
  if (!item.dueDate && item.kw == null && item.weekday == null) {
    return true;
  }
  return false;
};

const getWeekForVorhaben = (vorhaben, kw, year) =>
  (vorhaben.wochen || []).find((w) => w.kw === kw && w.year === year) || null;

/** Alle Themen-Einträge für den heutigen Planungstag. */
export const getTodayBriefing = (store, date = new Date()) => {
  const isoDate = getTodayIsoDate(date);
  const { kw, year } = getIsoWeek(date);
  const todayWd = getTodayWeekdayId();
  const weekdayLabel = todayWd ? FULL_WEEKDAY[todayWd] : null;
  const shortLabel = todayWd ? WEEKDAY_LABELS[todayWd] : null;

  const vorhabenRows = (store?.vorhaben || []).map((v) => {
    const week = getWeekForVorhaben(v, kw, year);
    const day = todayWd && week?.days?.[todayWd] ? week.days[todayWd] : null;
    const cards = (day?.cards || []).map((c) => ({
      id: c.id,
      label: c.label || "Eintrag",
      type: c.type,
      lektionId: c.lektionId || null,
    }));
    const dayNotiz = day?.notiz?.trim() || "";
    const sonderHeute = (week?.sonderTage || []).filter((s) => s.weekday === todayWd);
    const reminders = (v.erinnerungen || [])
      .filter((e) => isReminderForToday(e, { isoDate, kw, todayWd }))
      .map((e) => ({ id: e.id, text: e.text || "" }));
    const lektionenHeute = (v.lektionen || []).filter(
      (l) =>
        l.weekday === todayWd &&
        (!l.weekId || !week || l.weekId === week.id)
    );

    return {
      vorhabenId: v.id,
      title: v.title,
      fach: (v.fach || "").trim() || "Ohne Fach",
      cards,
      dayNotiz,
      sonderHeute,
      reminders,
      lektionenHeute: lektionenHeute.map((l) => ({
        id: l.id,
        title: l.title || "Lektion",
      })),
      weekPath: vorhabenLevelPath(v.id, todayWd ? "woche" : v.lastVisitedLevel || "grob"),
      hasContent:
        cards.length > 0 ||
        Boolean(dayNotiz) ||
        reminders.length > 0 ||
        lektionenHeute.length > 0 ||
        sonderHeute.length > 0,
    };
  });

  const withContent = vorhabenRows.filter((r) => r.hasContent);
  const totalCards = vorhabenRows.reduce((n, r) => n + r.cards.length, 0);
  const totalReminders = vorhabenRows.reduce((n, r) => n + r.reminders.length, 0);

  return {
    isoDate,
    dateLabel: formatGermanDateLabel(date),
    kw,
    year,
    todayWd,
    weekdayLabel,
    shortLabel,
    isWeekend: !todayWd,
    vorhabenRows,
    withContent,
    totalCards,
    totalReminders,
    hasAnyPlanung: withContent.length > 0,
  };
};

/** Vorhaben nach Fach — Ordner für die Home-Übersicht. */
export const groupVorhabenByFach = (vorhabenList = []) => {
  const map = new Map();
  for (const v of vorhabenList) {
    const key = (v.fach || "").trim() || "Ohne Fach";
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(v);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "de"))
    .map(([fach, items]) => ({
      fach,
      items: [...items].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    }));
};

export const getCalendarNotesForToday = (calStore, isoDate = getTodayIsoDate()) => {
  const events = [];
  for (const ev of calStore?.localEvents || []) {
    if (!ev?.start) {
      continue;
    }
    const start = new Date(ev.start);
    if (getTodayIsoDate(start) !== isoDate) {
      continue;
    }
    events.push({
      id: ev.id,
      title: ev.title || "Termin",
      notes: (ev.notes || ev.description || "").trim(),
      allDay: Boolean(ev.allDay),
    });
  }
  return events;
};
