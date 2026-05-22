import { WEEKDAYS } from "./planningDefaults";
import { getIsoWeek, getOrCreateCurrentWeek } from "./planningStore";

const WEEKDAY_ALIASES = {
  montag: "mo",
  mo: "mo",
  dienstag: "di",
  di: "di",
  mittwoch: "mi",
  mi: "mi",
  donnerstag: "do",
  do: "do",
  freitag: "fr",
  fr: "fr",
};

const SONDER_KEYWORDS = [
  { pattern: /elternabend|elterninfo|elterngespräch|elterngespraech/i, type: "elterninfo", label: "Elternabend" },
  { pattern: /ausflug|exkursion|excursion/i, type: "ausflug", label: "Ausflug" },
  { pattern: /prüfung|pruefung|test|lernzielkontrolle/i, type: "pruefung", label: "Prüfung / Test" },
  { pattern: /teamtag|konferenz|dienstbesprechung/i, type: "teamtag", label: "Teamtag" },
  { pattern: /ferien|brückentag|brueckentag/i, type: "ferien", label: "Ferien / frei" },
  { pattern: /vertretung|ersatz/i, type: "ersatz", label: "Vertretung" },
];

const ERINNERUNG_PATTERNS = [
  /material/i,
  /bestellen/i,
  /nicht vergessen/i,
  /vergiss/i,
  /vorbereiten/i,
  /kopieren/i,
  /elternmail/i,
  /raum buchen/i,
];

/**
 * @returns {Array<{ id: string, kind: string, title: string, detail: string, payload: object }>}
 */
export const parsePlanningReport = (text) => {
  const raw = String(text || "").trim();
  if (!raw) {
    return [];
  }
  const lower = raw.toLowerCase();
  const suggestions = [];
  let sid = 0;
  const push = (kind, title, detail, payload) => {
    suggestions.push({
      id: `sug-${sid++}`,
      kind,
      title,
      detail,
      payload,
    });
  };

  for (const [word, wd] of Object.entries(WEEKDAY_ALIASES)) {
    if (lower.includes(word)) {
      const label = WEEKDAYS.find((d) => d.id === wd)?.label || wd;
      push(
        "weekday_hint",
        `Bezug: ${label}`,
        `In der Wochenplanung ${label} berücksichtigen.`,
        { weekday: wd }
      );
      break;
    }
  }

  for (const sk of SONDER_KEYWORDS) {
    if (sk.pattern.test(raw)) {
      let weekday = null;
      for (const [word, wd] of Object.entries(WEEKDAY_ALIASES)) {
        if (lower.includes(word)) {
          weekday = wd;
          break;
        }
      }
      push(
        "sonder_tag",
        `Sondertag: ${sk.label}`,
        raw.length > 80 ? `${raw.slice(0, 80)}…` : raw,
        { type: sk.type, label: sk.label, weekday }
      );
    }
  }

  if (ERINNERUNG_PATTERNS.some((p) => p.test(raw))) {
    push(
      "erinnerung",
      "Erinnerung / To-do",
      raw.length > 120 ? `${raw.slice(0, 120)}…` : raw,
      { text: raw }
    );
  }

  if (/nächste woche|naechste woche|diese woche|kw\s*\d+/i.test(raw)) {
    push(
      "wochen_fokus",
      "Wochenfokus",
      "Als Schwerpunkt in der aktuellen Kalenderwoche notieren.",
      { focus: raw }
    );
  }

  if (/abschliessen|abschließen|ziel|kompetenz|thema|projekt/i.test(raw)) {
    push(
      "zwei_wochen_notiz",
      "Meilenstein / Ziel",
      raw,
      { text: raw }
    );
  }

  if (suggestions.length === 0) {
    push(
      "notiz",
      "Freie Notiz",
      "Als allgemeine Notiz zum Vorhaben speichern.",
      { text: raw }
    );
  }

  const seen = new Set();
  return suggestions.filter((s) => {
    const key = `${s.kind}-${s.title}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const applySuggestion = (vorhaben, suggestion, store) => {
  const v = { ...vorhaben };
  const { kind, payload } = suggestion;

  if (kind === "sonder_tag") {
    getOrCreateCurrentWeek(v);
    const { kw, year } = getIsoWeek();
    const week = v.wochen.find((w) => w.kw === kw && w.year === year);
    if (week) {
      const tag = {
        id: `s-${Date.now()}`,
        weekday: payload.weekday || "mi",
        type: payload.type,
        label: payload.label,
      };
      v.wochen = v.wochen.map((w) =>
        w.id === week.id
          ? { ...w, sonderTage: [...(w.sonderTage || []), tag] }
          : w
      );
    }
  }

  if (kind === "erinnerung") {
    v.erinnerungen = [
      ...v.erinnerungen,
      {
        id: `e-${Date.now()}`,
        text: payload.text,
        done: false,
        dueDate: null,
        kw: null,
        weekday: payload.weekday || null,
      },
    ];
  }

  if (kind === "wochen_fokus") {
    const withWeek = { ...v };
    getOrCreateCurrentWeek(withWeek);
    const { kw, year } = getIsoWeek();
    v.wochen = withWeek.wochen.map((w) =>
      w.kw === kw && w.year === year ? { ...w, focus: payload.focus } : w
    );
  }

  if (kind === "zwei_wochen_notiz") {
    v.zweiWochen = {
      ...v.zweiWochen,
      meilensteine: [
        ...v.zweiWochen.meilensteine,
        { id: `m-${Date.now()}`, text: payload.text, done: false },
      ],
    };
  }

  if (kind === "notiz") {
    v.grob = { ...v.grob, notizen: [v.grob.notizen, payload.text].filter(Boolean).join("\n\n") };
  }

  return v;
};
