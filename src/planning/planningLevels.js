import { isLektionScheduled } from "./themaOverviewUtils";

/** App-Ebenen ↔ FHNW Phasenmodell Unterrichtsplanung (IP FHNW) */

export const LEVEL_META = [
  {
    id: "uebersicht",
    step: 1,
    label: "Thema",
    hint: "Übersicht",
    fhnwPhases: ["Klären", "Entscheiden", "Gestalten"],
    fhnwFocus: "Ziele, Kompetenzen, Lektionen und Termine auf einen Blick.",
  },
  {
    id: "grob",
    step: 0,
    label: "Grobplanung",
    hint: "Ziele & Phasen (Detail)",
    fhnwPhases: ["Klären", "Entscheiden"],
    fhnwFocus: "Voraussetzungen, Lernziele, Phasen — ausführliche Grobplanung.",
    hiddenInStepper: true,
  },
  {
    id: "zwei-wochen",
    step: 2,
    label: "Zwischenziele",
    hint: "Material",
    fhnwPhases: ["Gestalten"],
    fhnwFocus: "Material, Medien, Rituale — Oberflächenstrukturen passend zu Lernprozessen.",
  },
  {
    id: "woche",
    step: 3,
    label: "Woche",
    hint: "Mo–Fr",
    fhnwPhases: ["Konkretisieren"],
    fhnwFocus: "Feinplanung, Schritte, Binnendifferenzierung im Wochenüberblick.",
  },
  {
    id: "lektion",
    step: 4,
    label: "Lektion",
    hint: "Ablauf",
    fhnwPhases: ["Konkretisieren", "Sichern"],
    fhnwFocus: "Lernaufgaben, Zeitblöcke, formative & summative Ergebnissicherung.",
  },
];

export const FHNW_PHASES_RING = [
  "klären",
  "entscheiden",
  "gestalten",
  "konkretisieren",
  "sichern",
  "durchführen",
];

export const getLevelMeta = (levelId) =>
  LEVEL_META.find((m) => m.id === levelId) || LEVEL_META[0];

export const getLevelBadge = (vorhaben, levelId) => {
  if (!vorhaben) {
    return null;
  }
  switch (levelId) {
    case "uebersicht": {
      const lek = vorhaben.lektionen?.length ?? 0;
      const unscheduled = (vorhaben.lektionen || []).filter(
        (l) => !isLektionScheduled(l, vorhaben)
      ).length;
      if (unscheduled > 0) {
        return String(unscheduled);
      }
      return lek > 0 ? String(lek) : null;
    }
    case "grob": {
      const n = vorhaben.grob?.phasen?.length ?? 0;
      const c = vorhaben.competencies?.length ?? 0;
      if (c > 0) {
        return String(c);
      }
      return n > 0 ? String(n) : null;
    }
    case "zwei-wochen": {
      const mat = (vorhaben.zweiWochen?.material || "").trim();
      return mat ? "✓" : null;
    }
    case "woche": {
      const open = (vorhaben.erinnerungen || []).filter((e) => !e.done).length;
      return open > 0 ? String(open) : null;
    }
    case "lektion": {
      const n = vorhaben.lektionen?.length ?? 0;
      return n > 0 ? String(n) : null;
    }
    default:
      return null;
  }
};

/** Heute als Planungstag (Mo–Fr), sonst null */
export const getTodayWeekdayId = () => {
  const d = new Date().getDay();
  const map = { 1: "mo", 2: "di", 3: "mi", 4: "do", 5: "fr" };
  return map[d] || null;
};
