/** Internal SPA routes — no external localhost:3003 links. */

export const APP_ROUTES = {
  /** Startseite — Mein Unterricht */
  home: "/",
  search: "/suche",
  landkarte: "/landkarte",
  kalender: "/kalender",
  /** Alias für Links (gleich wie home) */
  planung: "/",
  planungEntwurf: "/planung/entwurf",
  jahresplan: "/planung/jahr",
  monatsplan: "/planung/monat",
};

export const jahresplanPath = (startYear) => {
  const y = Number(startYear);
  if (!Number.isFinite(y)) {
    return `${APP_ROUTES.jahresplan}`;
  }
  return `${APP_ROUTES.jahresplan}/${y}`;
};

export const monatsplanPath = (year, month) => {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    return APP_ROUTES.monatsplan;
  }
  return `${APP_ROUTES.monatsplan}/${y}/${m}`;
};

export const PLANUNG_LEVELS = [
  "uebersicht",
  "grob",
  "zwei-wochen",
  "woche",
  "lektion",
];

/** Nur Übersicht im Haupt-Nav; Woche/Meilensteine als sekundäre Links */
export const PLANUNG_STEPPER_LEVELS = ["uebersicht"];

export const vorhabenPath = (id) => `/planung/vorhaben/${encodeURIComponent(id)}`;

export const vorhabenLevelPath = (id, level) =>
  `${vorhabenPath(id)}/${encodeURIComponent(level)}`;

/** Einheitliche Themen-Übersicht mit Sprungmarke (lektionen | todos | woche). */
export const vorhabenOverviewSectionPath = (id, section) => {
  const base = vorhabenLevelPath(id, "uebersicht");
  const hash = section != null ? String(section).trim() : "";
  return hash ? `${base}#${encodeURIComponent(hash)}` : base;
};

export const vorhabenLektionPath = (vorhabenId, lektionId) =>
  `${vorhabenPath(vorhabenId)}/lektion/${encodeURIComponent(lektionId)}`;

/** @param {string} slug Kompetenzcode oder fetch-UID für die Route */
export const chainPath = (slug) => {
  const id = slug != null ? String(slug).trim() : "";
  if (!id) {
    return APP_ROUTES.home;
  }
  return `/kette/${encodeURIComponent(id)}`;
};

/**
 * @param {{ uid?: string, code?: string, fach?: string, text?: string, vorhabenId?: string }} params
 */
export const planungEntwurfPath = (params = {}) => {
  const search = new URLSearchParams();
  const uid = params.uid != null ? String(params.uid).trim() : "";
  const code = params.code != null ? String(params.code).trim() : "";
  const fach = params.fach != null ? String(params.fach).trim() : "";
  const text = params.text != null ? String(params.text).trim() : "";
  const vorhabenId =
    params.vorhabenId != null ? String(params.vorhabenId).trim() : "";
  if (uid) {
    search.set("uid", uid);
  }
  if (code) {
    search.set("code", code);
  }
  if (fach) {
    search.set("fach", fach);
  }
  if (text) {
    search.set("text", text);
  }
  if (vorhabenId) {
    search.set("vorhaben", vorhabenId);
  }
  const qs = search.toString();
  return qs ? `${APP_ROUTES.planungEntwurf}?${qs}` : APP_ROUTES.planungEntwurf;
};
