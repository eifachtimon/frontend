import { getIsoWeek, getVorhabenById } from "./planningStore";
import { getTodayWeekdayId } from "./planningLevels";
import { vorhabenLevelPath } from "../config/appUrls";
import { WEEKDAYS } from "./planningDefaults";

const WEEKDAY_LABELS = Object.fromEntries(WEEKDAYS.map((d) => [d.id, d.label]));

export const getActiveVorhaben = (store) => {
  if (!store?.vorhaben?.length) {
    return null;
  }
  const id = store.lastActiveVorhabenId || store.vorhaben[0].id;
  return getVorhabenById(store, id);
};

export const getContinuePlanningTarget = (store) => {
  const vorhaben = getActiveVorhaben(store);
  if (!vorhaben) {
    return null;
  }
  const todayWd = getTodayWeekdayId();
  const level = todayWd ? "woche" : vorhaben.lastVisitedLevel || "grob";
  return {
    vorhaben,
    level,
    path: vorhabenLevelPath(vorhaben.id, level),
    todayWeekdayId: todayWd,
    todayLabel: todayWd ? WEEKDAY_LABELS[todayWd] : null,
  };
};

export const getTodayHubSummary = (store) => {
  const target = getContinuePlanningTarget(store);
  if (!target) {
    return null;
  }
  const { kw, year } = getIsoWeek();
  const { vorhaben, todayWeekdayId, todayLabel } = target;
  const week = (vorhaben.wochen || []).find((w) => w.kw === kw && w.year === year);
  const day = todayWeekdayId && week?.days?.[todayWeekdayId];
  const cardCount = day?.cards?.length || 0;
  const openReminders = (vorhaben.erinnerungen || []).filter((e) => !e.done).length;
  return {
    ...target,
    kw,
    year,
    cardCount,
    openReminders,
    isWeekend: !todayWeekdayId,
    todayLabel,
  };
};

export const suggestNextStepLabel = (vorhaben) => {
  if (!vorhaben) {
    return "Lege ein Vorhaben an, um zu planen.";
  }
  if (!(vorhaben.competencies?.length > 0)) {
    return "Kompetenzen aus der Suche hinzufügen.";
  }
  if (!(vorhaben.grob?.ziele || vorhaben.grob?.phasen?.length)) {
    return "Grobplanung: Ziele und Phasen skizzieren.";
  }
  const openMs = (vorhaben.zweiWochen?.meilensteine || []).filter((m) => !m.done).length;
  if (openMs > 0) {
    return `${openMs} offene Meilensteine in den nächsten 2 Wochen.`;
  }
  const todayWd = getTodayWeekdayId();
  if (todayWd) {
    return `Heute (${WEEKDAY_LABELS[todayWd]}): Wochenplan öffnen.`;
  }
  return "Weiter in der zuletzt besuchten Ebene.";
};
