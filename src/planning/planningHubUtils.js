import { getIsoWeek, getVorhabenById } from "./planningStore";
import { getTodayWeekdayId } from "./planningLevels";
import { vorhabenLevelPath, vorhabenOverviewSectionPath } from "../config/appUrls";
import { WEEKDAYS } from "./planningDefaults";
import { isLektionScheduled } from "./themaOverviewUtils";

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
  const level = vorhaben.lastVisitedLevel || "uebersicht";
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
    return "Lege ein Thema an, um zu planen.";
  }
  if (!(vorhaben.competencies?.length > 0)) {
    return "Kompetenzen & Ziele: Kompetenzen aus der Suche hinzufügen.";
  }
  if (!(vorhaben.grob?.ziele || "").trim()) {
    return "Kompetenzen & Ziele: Lernziele am Thema festhalten.";
  }
  const totalLek = vorhaben.lektionen?.length || 0;
  const unscheduledCount = (vorhaben.lektionen || []).filter(
    (l) => !isLektionScheduled(l, vorhaben)
  ).length;
  if (totalLek > 0 && unscheduledCount > 0) {
    const open = unscheduledCount;
    return `${open} Lektion${open === 1 ? "" : "en"} noch nicht im Wochenplan.`;
  }
  if (totalLek === 0) {
    return "Erste Lektion anlegen und planen.";
  }
  return "Alle Lektionen terminiert — weiter verfeinern.";
};

/** Ziel für den Nächster-Schritt-Hinweis (Sprungmarke auf der Übersicht). */
export const getSuggestNextStepTarget = (vorhaben, currentLevel) => {
  const label = suggestNextStepLabel(vorhaben);
  if (!vorhaben) {
    return { label, level: "uebersicht", path: null, linkLabel: null, isOnTarget: true };
  }

  const unscheduledCount = (vorhaben.lektionen || []).filter(
    (l) => !isLektionScheduled(l, vorhaben)
  ).length;

  if (!(vorhaben.competencies?.length > 0) || !(vorhaben.grob?.ziele || "").trim()) {
    return {
      label,
      level: "uebersicht",
      path: vorhabenOverviewSectionPath(vorhaben.id, "kompetenzen-ziele"),
      linkLabel: "Kompetenzen & Ziele",
      isOnTarget: currentLevel === "uebersicht",
    };
  }

  if (unscheduledCount > 0) {
    return {
      label,
      level: "woche",
      path: vorhabenOverviewSectionPath(vorhaben.id, "woche"),
      linkLabel: "Zur Woche",
      isOnTarget: false,
    };
  }

  return {
    label,
    level: "uebersicht",
    path: vorhabenLevelPath(vorhaben.id, "uebersicht"),
    linkLabel: null,
    isOnTarget: currentLevel === "uebersicht",
  };
};
