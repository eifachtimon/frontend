import { apiUrl } from "../api/lehrplanApi";

/** Querverweise-Nachladen: Fokus-UID kann in einer zusammengeführten Ketten-Stufe stecken. */
export const chainStepContainsFocusUid = (step, focusUid) => {
  if (!step || focusUid == null || focusUid === "") {
    return false;
  }
  const f = String(focusUid).trim();
  if (step.uid != null && String(step.uid).trim() === f) {
    return true;
  }
  const mus = step.merged_uids;
  return Array.isArray(mus) && mus.some((u) => u != null && String(u).trim() === f);
};

/**
 * Fehlende Querverweise zur aktuellen Stufe nachladen (Backend ohne network_links in /competency-chain).
 */
export const enrichChainDataWithNetworkApi = async (chainPayload) => {
  if (!chainPayload?.current?.uid) {
    return chainPayload;
  }
  const focusUid = chainPayload.current.uid;
  if (
    Array.isArray(chainPayload.current.network_links) &&
    chainPayload.current.network_links.length > 0
  ) {
    const has =
      chainPayload._has_network === true || chainPayload.current.network_links.length > 0;
    return {
      ...chainPayload,
      _has_network: chainPayload._has_network ?? has,
    };
  }
  const tryUrls = [
    apiUrl(`/api/competency-network/${encodeURIComponent(focusUid)}`),
    apiUrl(`/competency-network/${encodeURIComponent(focusUid)}`),
  ];

  for (const url of tryUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        continue;
      }
      const net = await response.json();
      const outgoing = net && net.outgoing;
      if (!Array.isArray(outgoing) || outgoing.length === 0) {
        continue;
      }
      const links = outgoing.map((o) => ({
        uid: o.uid,
        code: o.code,
        fach: o.fach,
      }));
      const fullChain = Array.isArray(chainPayload.full_chain)
        ? chainPayload.full_chain.map((step) =>
            step && chainStepContainsFocusUid(step, focusUid)
              ? { ...step, network_links: links }
              : step
          )
        : chainPayload.full_chain;
      return {
        ...chainPayload,
        _has_network: true,
        current: { ...chainPayload.current, network_links: links },
        full_chain: fullChain,
      };
    } catch (_err) {
      continue;
    }
  }
  return chainPayload;
};
