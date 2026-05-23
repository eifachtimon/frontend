import { resolveChainNavFromSearchResult } from "./chainNavigation";

/** UID-Auflösung aus Suchtreffern (gleiche Logik wie App.js). */
export const resolveCompetencyUidFromSearchResult = (result) => {
  if (!result) {
    return null;
  }
  return resolveChainNavFromSearchResult(result).fetchUid;
};

export { resolveChainNavFromSearchResult };

export const competencyEntryFromSearchResult = (result) => {
  const uid = resolveCompetencyUidFromSearchResult(result);
  if (!uid) {
    return null;
  }
  const meta = result.metadata || {};
  const text = result.text != null ? String(result.text).trim() : "";
  const code = meta.code != null ? String(meta.code).trim() : "";
  const label = text || code || uid;
  return {
    uid,
    label: label.slice(0, 200),
    code: code || undefined,
    fach: meta.fach != null ? String(meta.fach).trim() : undefined,
    zyklus: meta.zyklus != null ? String(meta.zyklus).trim() : undefined,
    themenbereich:
      meta.themenbereich != null ? String(meta.themenbereich).trim() : undefined,
    text: text || undefined,
  };
};
