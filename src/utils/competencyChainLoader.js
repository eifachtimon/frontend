import { apiUrl } from "../api/lehrplanApi";
import { enrichChainDataWithNetworkApi } from "./competencyChainEnrich";

export { enrichChainDataWithNetworkApi };

/** doc_key oder uid (inkl. zusammengeführter Stufen mit gleichem Code). */
export const chainStepMatchesLookupKey = (item, key) => {
  if (!item || key == null || key === "") {
    return false;
  }
  const k = String(key).trim();
  const dk = item.doc_key != null ? String(item.doc_key).trim() : "";
  const u = item.uid != null ? String(item.uid).trim() : "";
  if (dk && dk === k) {
    return true;
  }
  if (u && u === k) {
    return true;
  }
  const mdks = item.merged_doc_keys;
  if (Array.isArray(mdks) && mdks.some((x) => x != null && String(x).trim() === k)) {
    return true;
  }
  const mus = item.merged_uids;
  if (Array.isArray(mus) && mus.some((x) => x != null && String(x).trim() === k)) {
    return true;
  }
  return false;
};

export const hasEmbeddedChain = (prefetchedChain) =>
  Boolean(
    prefetchedChain && (prefetchedChain.current || prefetchedChain["current"])
  );

export const getChainFetchErrorMessage = (error) =>
  error && error.message === "not_found"
    ? "Für diese Kompetenz wurde kein Aufbau-Kontext gefunden."
    : "Der Aufbau-Kontext konnte nicht geladen werden.";

export const resolveHighlightUidFromChainData = (data, fallbackUid) => {
  const cur = data && data.current;
  if (cur && cur.uid != null) {
    return String(cur.uid).trim();
  }
  return fallbackUid;
};

export const createInitialChainViewState = ({
  fetchUid,
  prefetchedChain,
  searchSelectionHighlight = false,
}) => {
  const highlightAnchorUid = fetchUid;
  if (hasEmbeddedChain(prefetchedChain)) {
    return {
      loading: false,
      error: null,
      data: prefetchedChain,
      highlightAnchorUid,
      searchSelectionHighlight: Boolean(searchSelectionHighlight),
    };
  }
  return {
    loading: true,
    error: null,
    data: null,
    highlightAnchorUid,
    searchSelectionHighlight: Boolean(searchSelectionHighlight),
  };
};

export const createMapChainLoadingView = ({
  highlightAnchorUid,
  staleData = null,
}) => ({
  loading: true,
  error: null,
  data: staleData,
  highlightAnchorUid,
});

/**
 * @returns {Promise<object>}
 */
export const fetchCompetencyChain = async (fetchUid) => {
  const trimmed =
    typeof fetchUid === "string"
      ? fetchUid.trim()
      : fetchUid != null
        ? String(fetchUid).trim()
        : "";
  if (!trimmed) {
    throw new Error("empty_uid");
  }
  const response = await fetch(
    apiUrl(`/competency-chain/${encodeURIComponent(trimmed)}`)
  );
  if (response.status === 404) {
    throw new Error("not_found");
  }
  if (!response.ok) {
    throw new Error("network");
  }
  const data = await response.json();
  return enrichChainDataWithNetworkApi(data);
};

/**
 * Nachbar-Stufe aus full_chain — gleiche Logik für Suche und Landkarte.
 * @returns {{ data: object, cur: object, highlightAnchorUid: string } | null}
 */
export const buildChainSliceAtLookupKey = (fullChain, nextUid, options = {}) => {
  if (!Array.isArray(fullChain) || !nextUid) {
    return null;
  }
  const idx = fullChain.findIndex(
    (step) => step && chainStepMatchesLookupKey(step, nextUid)
  );
  if (idx === -1) {
    return null;
  }
  const cur = fullChain[idx];
  const data = {
    previous: idx > 0 ? fullChain[idx - 1] : null,
    current: cur,
    next: idx < fullChain.length - 1 ? fullChain[idx + 1] : null,
    full_chain: fullChain,
    _has_network: Boolean(cur && cur.network_links && cur.network_links.length > 0),
  };
  if (options.chainHeading != null) {
    data.chain_heading = options.chainHeading;
  }
  const highlightAnchorUid =
    (cur && cur.uid != null ? String(cur.uid).trim() : "") || String(nextUid).trim();
  return { data, cur, highlightAnchorUid };
};

export const applyChainFetchFailure = ({
  prefetchedChain,
  fetchUid,
  error,
  searchSelectionHighlight = false,
}) => {
  const embedded = hasEmbeddedChain(prefetchedChain);
  const message = getChainFetchErrorMessage(error);
  return {
    loading: false,
    error: message,
    data: embedded ? prefetchedChain : null,
    highlightAnchorUid: fetchUid,
    searchSelectionHighlight: Boolean(searchSelectionHighlight),
  };
};
