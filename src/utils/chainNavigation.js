/** Auflösung fetch-UID vs. lesbarer Ketten-URL (Kompetenzcode). */

const LP21_ROW_RE = /^lp21:\d+$/i;

export const isLp21RowKey = (uid) => LP21_ROW_RE.test(String(uid || "").trim());

const trimStr = (v) => (v != null && String(v).trim() ? String(v).trim() : "");

/**
 * UID für API /competency-chain (doc_key bevorzugt, lp21:Zeile nur als Fallback).
 */
export const resolveChainFetchUid = ({
  prefetchedChain,
  metadata,
  documentUid,
  competencyUid,
  explicitUid,
} = {}) => {
  const fromExplicit = trimStr(explicitUid);
  if (fromExplicit && !isLp21RowKey(fromExplicit)) {
    return fromExplicit;
  }

  const chain = prefetchedChain || metadata?._competency_chain;
  const fromDocKey = trimStr(chain?.current?.doc_key);
  const fromChainUid = trimStr(chain?.current?.uid);
  const fromMetaUid = trimStr(metadata?.uid);
  const fromDoc = trimStr(documentUid);
  const fromComp = trimStr(competencyUid);
  const fromLp21Meta =
    metadata?.lp21_row_index != null && String(metadata.lp21_row_index).trim() !== ""
      ? `lp21:${String(metadata.lp21_row_index).trim()}`
      : "";
  const fromLp21 =
    (fromDoc && isLp21RowKey(fromDoc) ? fromDoc : "") ||
    (fromComp && isLp21RowKey(fromComp) ? fromComp : "") ||
    fromLp21Meta;

  return (
    fromDocKey ||
    fromChainUid ||
    fromMetaUid ||
    (!isLp21RowKey(fromDoc) ? fromDoc : "") ||
    (!isLp21RowKey(fromComp) ? fromComp : "") ||
    fromLp21 ||
    fromExplicit ||
    null
  );
};

/**
 * Segment für /kette/:slug — bevorzugt offizieller Kompetenzcode.
 */
export const resolveChainRouteSlug = ({ code, fetchUid } = {}) => {
  const c = trimStr(code);
  if (c) {
    return c;
  }
  const u = trimStr(fetchUid);
  return u || "";
};

export const resolveChainNavFromSearchResult = (result, explicitUid) => {
  if (!result) {
    return { fetchUid: trimStr(explicitUid) || null, routeSlug: "" };
  }
  const meta = result.metadata || {};
  const fetchUid =
    resolveChainFetchUid({
      prefetchedChain: result.prefetchedChain || meta._competency_chain,
      metadata: meta,
      documentUid: result.documentUid,
      competencyUid: meta.uid,
      explicitUid,
    }) || null;
  const routeSlug = resolveChainRouteSlug({
    code: meta.code,
    fetchUid,
  });
  return { fetchUid, routeSlug };
};
