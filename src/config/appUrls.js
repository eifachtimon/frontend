/** Internal SPA routes — no external localhost:3003 links. */

export const APP_ROUTES = {
  search: "/",
  landkarte: "/landkarte",
  kalender: "/kalender",
  planung: "/planung",
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

export const PLANUNG_LEVELS = ["grob", "zwei-wochen", "woche", "lektion"];

export const vorhabenPath = (id) => `/planung/vorhaben/${encodeURIComponent(id)}`;

export const vorhabenLevelPath = (id, level) =>
  `${vorhabenPath(id)}/${encodeURIComponent(level)}`;

export const chainPath = (uid) => {
  const id = uid != null ? String(uid).trim() : "";
  if (!id) {
    return APP_ROUTES.search;
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
