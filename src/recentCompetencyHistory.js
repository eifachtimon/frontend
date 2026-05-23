/** localStorage key schema for „Zuletzt angesehen“ (Kompetenzen). */
export const RECENT_COMPETENCIES_STORAGE_KEY = "lp21-recent-competencies-v1";
export const RECENT_COMPETENCIES_MAX = 15;

/**
 * @typedef {{ uid: string, code?: string, fach?: string, label: string, ts: number }} RecentCompetencyEntry
 */

/**
 * @param {string} text
 * @param {number} maxLen
 */
export const truncateCompetencyLabel = (text, maxLen = 120) => {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (!raw) {
    return "";
  }
  if (raw.length <= maxLen) {
    return raw;
  }
  return `${raw.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
};

/**
 * @returns {RecentCompetencyEntry[]}
 */
export const readRecentCompetencies = () => {
  try {
    const raw = window.localStorage.getItem(RECENT_COMPETENCIES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => {
        const uid =
          item && typeof item.uid === "string"
            ? item.uid.trim()
            : item && item.uid != null
              ? String(item.uid).trim()
              : "";
        if (!uid) {
          return null;
        }
        const ts =
          typeof item.ts === "number" && Number.isFinite(item.ts)
            ? item.ts
            : Date.now();
        const code =
          item.code != null && String(item.code).trim()
            ? String(item.code).trim()
            : undefined;
        const fach =
          item.fach != null && String(item.fach).trim()
            ? String(item.fach).trim()
            : undefined;
        const labelRaw =
          item.label != null && String(item.label).trim()
            ? String(item.label).trim()
            : uid;
        return {
          uid,
          code,
          fach,
          label: truncateCompetencyLabel(labelRaw, 160),
          ts,
        };
      })
      .filter(Boolean);
  } catch (_err) {
    return [];
  }
};

/**
 * @param {Omit<RecentCompetencyEntry, 'ts'> & { ts?: number }} entry
 * @returns {RecentCompetencyEntry[]}
 */
export const pushRecentCompetency = (entry) => {
  const uid =
    typeof entry.uid === "string"
      ? entry.uid.trim()
      : entry.uid != null
        ? String(entry.uid).trim()
        : "";
  if (!uid) {
    return readRecentCompetencies();
  }
  const label = truncateCompetencyLabel(entry.label || uid, 160);
  const code =
    entry.code != null && String(entry.code).trim()
      ? String(entry.code).trim()
      : undefined;
  const fach =
    entry.fach != null && String(entry.fach).trim()
      ? String(entry.fach).trim()
      : undefined;
  const ts =
    typeof entry.ts === "number" && Number.isFinite(entry.ts)
      ? entry.ts
      : Date.now();

  const previous = readRecentCompetencies();
  const rest = previous.filter((item) => item.uid !== uid);
  const next = [{ uid, code, fach, label, ts }, ...rest].slice(
    0,
    RECENT_COMPETENCIES_MAX
  );
  try {
    window.localStorage.setItem(
      RECENT_COMPETENCIES_STORAGE_KEY,
      JSON.stringify(next)
    );
    window.dispatchEvent(new CustomEvent("lp21-recent-updated"));
  } catch (_err) {
    // quota / private mode
  }
  return next;
};

export const clearRecentCompetencies = () => {
  try {
    window.localStorage.removeItem(RECENT_COMPETENCIES_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("lp21-recent-updated"));
  } catch (_err) {
    // ignore
  }
};
