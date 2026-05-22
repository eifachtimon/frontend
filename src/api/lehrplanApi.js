const rawApiBase = process.env.REACT_APP_API_BASE_URL;
export const API_ROOT =
  rawApiBase != null && String(rawApiBase).trim() !== ""
    ? String(rawApiBase).replace(/\/$/, "")
    : process.env.NODE_ENV === "development"
      ? ""
      : "http://127.0.0.1:5001";

export const apiUrl = (path) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_ROOT}${normalized}`;
};

/**
 * @param {string} query
 * @param {{ nResults?: number, fach?: string[], zyklus?: string[] }} [options]
 */
export const searchCompetencies = async (query, options = {}) => {
  const q = String(query || "").trim();
  if (!q) {
    return { results: [], error: "" };
  }
  const body = {
    query: q,
    n_results: options.nResults ?? 8,
  };
  if (Array.isArray(options.fach) && options.fach.length > 0) {
    body.filter = { ...(body.filter || {}), fach: options.fach };
  }
  if (Array.isArray(options.zyklus) && options.zyklus.length > 0) {
    body.filter = { ...(body.filter || {}), zyklus: options.zyklus };
  }

  try {
    const response = await fetch(apiUrl("/search"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return { results: [], error: "Suche fehlgeschlagen." };
    }
    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];
    return { results, error: "" };
  } catch (_err) {
    return {
      results: [],
      error: "Keine Verbindung zur API. Backend auf Port 5001 starten?",
    };
  }
};
