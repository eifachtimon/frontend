/** UID-Auflösung aus Suchtreffern (gleiche Logik wie App.js). */

export const resolveCompetencyUidFromSearchResult = (result) => {
  if (!result) {
    return null;
  }
  const chain = result.prefetchedChain || result.metadata?._competency_chain;
  const fromDocKey =
    chain?.current?.doc_key != null && String(chain.current.doc_key).trim()
      ? String(chain.current.doc_key).trim()
      : "";
  const fromChainUid =
    chain?.current?.uid != null && String(chain.current.uid).trim()
      ? String(chain.current.uid).trim()
      : "";
  const fromDoc =
    result.documentUid != null && String(result.documentUid).trim()
      ? String(result.documentUid).trim()
      : "";
  const fromMeta =
    result.metadata?.lp21_row_index != null &&
    String(result.metadata.lp21_row_index).trim() !== ""
      ? `lp21:${String(result.metadata.lp21_row_index).trim()}`
      : "";
  return fromDocKey || fromChainUid || fromDoc || fromMeta || null;
};

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
