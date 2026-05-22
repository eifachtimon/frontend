import React, { Component } from "react";
import LessonDraftLink from "./LessonDraftLink";
import {
  aspectCodeFromCompetencyCode,
  clusterHeadingPrefixFromCode,
  describeLp21Code,
  kbCodeFromCompetencyCode,
  parseLp21Parts,
  splitThemenbereichOnFirstWord,
} from "../lp21Code";

/** doc_key oder uid (inkl. zusammengeführter Stufen mit gleichem Code). */
const chainStepMatchesLookupKey = (item, key) => {
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

/** Gleiche Logik wie SearchResult für --zyklus-marker (linker Streifen). */
const buildZyklusMarkerStyle = (zyklus, getZyklusColorByPart) => {
  const rawValue = String(zyklus || "").trim();
  if (!rawValue) {
    return {};
  }
  const matches = rawValue.match(/[1-3]/g);
  if (!matches || matches.length === 0) {
    return {};
  }
  const zyklusParts = Array.from(new Set(matches));
  const borderColors = zyklusParts.map((part) => getZyklusColorByPart(part)).filter(Boolean);
  const uniqueBorderColors = Array.from(new Set(borderColors));
  const markerGradient = (() => {
    if (uniqueBorderColors.length === 0) {
      return null;
    }
    if (uniqueBorderColors.length === 1) {
      return uniqueBorderColors[0];
    }
    if (uniqueBorderColors.length === 2) {
      return `linear-gradient(to bottom, ${uniqueBorderColors[0]} 0 50%, ${uniqueBorderColors[1]} 50% 100%)`;
    }
    return `linear-gradient(to bottom, ${uniqueBorderColors[0]} 0 33.33%, ${uniqueBorderColors[1]} 33.33% 66.66%, ${uniqueBorderColors[2]} 66.66% 100%)`;
  })();
  return markerGradient ? { "--zyklus-marker": markerGradient } : {};
};

const MapNavTriangleUp = () => (
  <svg className="chain-map-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
    <polygon fill="currentColor" points="12,6.5 6.2,16.5 17.8,16.5" />
  </svg>
);

const MapNavTriangleDown = () => (
  <svg className="chain-map-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
    <polygon fill="currentColor" points="12,17.5 6.2,7.5 17.8,7.5" />
  </svg>
);

class CompetencyChainView extends Component {
  constructor(props) {
    super(props);
    this.currentFullChainRef = React.createRef();
    this.state = {
      copiedUid: null,
      /** Fallback wenn /competency-chain noch keine network_links liefert (alter Server) */
      networkHintsByUid: {},
      /** Landkarte: „Lade …“ erst nach `chainLoadingStatusDelayMs`. */
      deferredChainLoadingVisible: false,
    };
    this.copyFeedbackTimer = null;
    this._chainLoadingStatusTimer = null;
    this.hintFetchPending = new Set();
  }

  componentWillUnmount() {
    if (this.copyFeedbackTimer != null) {
      window.clearTimeout(this.copyFeedbackTimer);
      this.copyFeedbackTimer = null;
    }
    if (this._chainLoadingStatusTimer != null) {
      window.clearTimeout(this._chainLoadingStatusTimer);
      this._chainLoadingStatusTimer = null;
    }
  }

  componentDidMount() {
    this.scheduleScrollToSelected();
    this.fetchNetworkHintsForChain();
    this.syncDeferredChainLoading();
  }

  componentDidUpdate(prevProps) {
    const cur = this.props.chainData?.current;
    const key =
      (cur?.doc_key && String(cur.doc_key).trim()) || cur?.uid || undefined;
    const prevCur = prevProps.chainData?.current;
    const prevKey =
      (prevCur?.doc_key && String(prevCur.doc_key).trim()) ||
      prevCur?.uid ||
      undefined;
    if (key && key !== prevKey) {
      this.scheduleScrollToSelected();
    }

    if (!prevProps.chainData && this.props.chainData) {
      this.scheduleScrollToSelected();
    }

    if (prevProps.loading && !this.props.loading && this.props.chainData) {
      this.scheduleScrollToSelected();
    }

    if (key !== prevKey && key) {
      this.setState({ networkHintsByUid: {} });
    }

    if (this.props.chainData && !this.props.loading) {
      this.fetchNetworkHintsForChain();
    }

    if (
      prevProps.loading &&
      !this.props.loading &&
      this.props.chainData &&
      (this.props.mapChainNavDirection === "prev" ||
        this.props.mapChainNavDirection === "next") &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const cb = this.props.onMapChainNavAnimationEnd;
      if (typeof cb === "function") {
        requestAnimationFrame(() => cb());
      }
    }

    if (
      prevProps.loading !== this.props.loading ||
      Number(prevProps.chainLoadingStatusDelayMs || 0) !==
        Number(this.props.chainLoadingStatusDelayMs || 0)
    ) {
      this.syncDeferredChainLoading();
    }
  }

  syncDeferredChainLoading = () => {
    const delayMs = Number(this.props.chainLoadingStatusDelayMs) || 0;
    if (this._chainLoadingStatusTimer != null) {
      window.clearTimeout(this._chainLoadingStatusTimer);
      this._chainLoadingStatusTimer = null;
    }
    if (!this.props.loading) {
      if (this.state.deferredChainLoadingVisible) {
        this.setState({ deferredChainLoadingVisible: false });
      }
      return;
    }
    if (delayMs <= 0) {
      if (!this.state.deferredChainLoadingVisible) {
        this.setState({ deferredChainLoadingVisible: true });
      }
      return;
    }
    if (this.state.deferredChainLoadingVisible) {
      this.setState({ deferredChainLoadingVisible: false });
    }
    this._chainLoadingStatusTimer = window.setTimeout(() => {
      this._chainLoadingStatusTimer = null;
      if (this.props.loading) {
        this.setState({ deferredChainLoadingVisible: true });
      }
    }, delayMs);
  };

  /**
   * Lädt Querverweise nach, wenn die Kette aus einer älteren API ohne network_links kommt.
   */
  fetchNetworkHintsForChain = () => {
    const { getCompetencyNetworkUrl, chainData } = this.props;
    if (!getCompetencyNetworkUrl || !chainData) {
      return;
    }
    const items = this.resolveFullChain(chainData);
    items.forEach((item) => {
      if (!item) {
        return;
      }
      const hintUid =
        (item.uid != null && String(item.uid).trim()) ||
        (Array.isArray(item.merged_uids) && item.merged_uids.length > 0
          ? String(item.merged_uids[0]).trim()
          : "");
      if (!hintUid) {
        return;
      }
      if (item.network_links && item.network_links.length > 0) {
        return;
      }
      if (this.state.networkHintsByUid[hintUid]?.length) {
        return;
      }
      if (this.hintFetchPending.has(hintUid)) {
        return;
      }
      this.hintFetchPending.add(hintUid);
      fetch(getCompetencyNetworkUrl(hintUid))
        .then((response) => {
          if (!response.ok) {
            throw new Error("skip");
          }
          return response.json();
        })
        .then((payload) => {
          const outgoing = payload && payload.outgoing;
          if (!Array.isArray(outgoing) || outgoing.length === 0) {
            return;
          }
          const mapped = outgoing.map((o) => ({
            uid: o.uid,
            code: o.code,
            fach: o.fach,
          }));
          this.setState((prev) => ({
            networkHintsByUid: {
              ...prev.networkHintsByUid,
              [hintUid]: mapped,
            },
          }));
        })
        .catch(() => {})
        .finally(() => {
          this.hintFetchPending.delete(hintUid);
        });
    });
  };

  prefersReducedMotion = () => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  scheduleScrollToSelected = () => {
    const { chainData, loading, searchSelectionHighlight = false } = this.props;
    if (loading || !chainData?.current || !searchSelectionHighlight) {
      return;
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        this.scrollSelectedChainStepIntoView();
      });
    });
  };

  scrollSelectedChainStepIntoView = () => {
    const el = this.currentFullChainRef.current;
    if (!el) {
      return;
    }
    const smooth = !this.prefersReducedMotion();
    el.scrollIntoView({
      block: "center",
      behavior: smooth ? "smooth" : "auto",
      inline: "nearest",
    });
  };

  handleOpenUrl = (url) => {
    if (!url) {
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  handleCopyChainItem = async (event, item) => {
    event.stopPropagation();
    const texts =
      Array.isArray(item.text_variants) && item.text_variants.length > 0
        ? item.text_variants.map((t) => String(t || "").trim()).filter(Boolean)
        : item.text != null && String(item.text).trim()
          ? [String(item.text).trim()]
          : [];
    const kompBlock = texts.length > 0 ? texts.join("\n\n") : "-";
    const payload = [
      `Fach: ${item.fach || "-"}`,
      `Zyklus: ${item.zyklus || "-"}`,
      `Themenbereich: ${item.themenbereich || "-"}`,
      `Code: ${item.code || "-"}`,
      `Kompetenz:\n${kompBlock}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(payload);
      if (this.copyFeedbackTimer != null) {
        window.clearTimeout(this.copyFeedbackTimer);
      }
      const copyFeedbackKey =
        (Array.isArray(item.merged_doc_keys) && item.merged_doc_keys.length > 0
          ? item.merged_doc_keys.join("|")
          : null) ||
        item.uid ||
        "__anon__";
      this.setState({ copiedUid: copyFeedbackKey });
      this.copyFeedbackTimer = window.setTimeout(() => {
        this.copyFeedbackTimer = null;
        this.setState({ copiedUid: null });
      }, 1500);
    } catch (_err) {
      this.setState({ copiedUid: null });
    }
  };

  resolveChainItemNetworkLinks = (item) => {
    if (!item) {
      return [];
    }
    let links = item.network_links;
    if (Array.isArray(links) && links.length > 0) {
      return links;
    }
    const hintUid =
      (item.uid != null && String(item.uid).trim()) ||
      (Array.isArray(item.merged_uids) && item.merged_uids.length > 0
        ? String(item.merged_uids[0]).trim()
        : "");
    if (!hintUid) {
      return [];
    }
    const hinted = this.state.networkHintsByUid[hintUid];
    return Array.isArray(hinted) ? hinted : [];
  };

  formatChainNetworkLinkLabel = (lnk) => {
    const parts = [lnk && lnk.code, lnk && lnk.fach].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : (lnk && lnk.uid) || "Verknüpfung";
  };

  handleChainNetworkLinkKeyDown = (event, lnk) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (lnk && lnk.uid) {
      this.handleFullChainStepActivate(lnk.uid);
    }
  };

  /** Wie Suchtreffer: Code links, Querverweise als dezente Links rechts oben. */
  renderChainNetworkPeerRow = (item) => {
    const links = this.resolveChainItemNetworkLinks(item);
    const hasLinks = links.length > 0;
    if (!item.code && !hasLinks) {
      return null;
    }
    return (
      <div className="result-code-peer-row chain-aufbau-code-peer-row">
        <div className="result-code-peer-left">
          {item.code ? (
            <div className="chain-comp-meta">
              <span className="result-code-text">{item.code}</span>
            </div>
          ) : null}
        </div>
        {hasLinks ? (
          <ul
            className="result-network-links-inline"
            aria-label="Offizielle Querverweise zu anderen Kompetenzstufen"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {links.map((lnk) => {
              const label = this.formatChainNetworkLinkLabel(lnk);
              return (
                <li key={lnk.uid || label}>
                  <button
                    type="button"
                    className="result-network-link-ref"
                    onClick={(e) => {
                      e.stopPropagation();
                      this.handleFullChainStepActivate(lnk.uid);
                    }}
                    onKeyDown={(e) => this.handleChainNetworkLinkKeyDown(e, lnk)}
                    aria-label={`Verknüpfte Kompetenz: ${label}`}
                  >
                    <svg
                      className="result-network-link-icon"
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      aria-hidden="true"
                    >
                      <path
                        fill="currentColor"
                        d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2z"
                      />
                    </svg>
                    <span className="result-network-link-label">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    );
  };

  handleChainBookmarkClick = (event, item) => {
    event.stopPropagation();
    const { onToggleBookmarkStep } = this.props;
    if (!item || typeof onToggleBookmarkStep !== "function") {
      return;
    }
    const bookmarkId =
      (item.doc_key != null && String(item.doc_key).trim()) ||
      (item.uid != null && String(item.uid).trim()) ||
      "";
    if (!bookmarkId) {
      return;
    }
    onToggleBookmarkStep(item);
  };

  handleChainBookmarkKeyDown = (event, item) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    this.handleChainBookmarkClick(event, item);
  };

  renderChainActions = (item) => {
    const { copiedUid } = this.state;
    const { bookmarkUids, onToggleBookmarkStep } = this.props;
    const copyKey =
      (Array.isArray(item.merged_doc_keys) && item.merged_doc_keys.length > 0
        ? item.merged_doc_keys.join("|")
        : null) ||
      item.uid ||
      "__anon__";
    const copied = copiedUid === copyKey;
    const showBookmark = typeof onToggleBookmarkStep === "function";
    const bookmarkId =
      (item.doc_key != null && String(item.doc_key).trim()) ||
      (item.uid != null && String(item.uid).trim()) ||
      "";
    const isBookmarked =
      showBookmark &&
      bookmarkId &&
      bookmarkUids instanceof Set &&
      bookmarkUids.has(bookmarkId);

    return (
      <div
        className={`result-actions ${showBookmark ? "result-actions--bookmark-layout" : ""}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="copy-button"
          onClick={(e) => this.handleCopyChainItem(e, item)}
          aria-label={copied ? "Kopiert" : "Kompetenz in Zwischenablage kopieren"}
          title={copied ? "Kopiert" : "Kopieren"}
        >
          <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2m0 16H8V7h11z"
            />
          </svg>
        </button>
        {showBookmark ? (
          <button
            type="button"
            className={`bookmark-toggle-button ${isBookmarked ? "bookmark-toggle-button--active" : ""}`}
            onClick={(e) => this.handleChainBookmarkClick(e, item)}
            onKeyDown={(e) => this.handleChainBookmarkKeyDown(e, item)}
            aria-pressed={Boolean(isBookmarked)}
            aria-label={isBookmarked ? "Von Merkliste entfernen" : "Kompetenz merken"}
            title={isBookmarked ? "Von Merkliste entfernen" : "Merken"}
          >
            <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
              {isBookmarked ? (
                <path
                  fill="currentColor"
                  d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"
                />
              ) : (
                <path
                  fill="currentColor"
                  d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"
                />
              )}
            </svg>
          </button>
        ) : null}
        {item.url ? (
          <button
            type="button"
            className="source-button"
            onClick={(e) => {
              e.stopPropagation();
              this.handleOpenUrl(item.url);
            }}
            aria-label="Quelle in neuem Tab öffnen"
            title="Quelle öffnen"
          >
            <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3zM5 5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7H5z"
              />
            </svg>
          </button>
        ) : null}
        {item.uid || item.doc_key ? (
          <LessonDraftLink
            uid={
              (item.doc_key != null && String(item.doc_key).trim()) ||
              (item.uid != null && String(item.uid).trim()) ||
              ""
            }
            code={item.code}
            fach={item.fach}
            text={item.text}
            className="lesson-draft-link chain-lesson-draft-link"
          />
        ) : null}
      </div>
    );
  };

  handleBackClick = () => {
    const { onBack } = this.props;
    if (onBack) {
      onBack();
    }
  };

  handleFullChainStepActivate = (uid) => {
    const { chainData, onSelectNeighbor } = this.props;
    const cur = chainData && chainData.current;
    if (!uid || !cur || !onSelectNeighbor) {
      return;
    }
    const uidStr = String(uid).trim();
    if (chainStepMatchesLookupKey(cur, uidStr)) {
      return;
    }
    onSelectNeighbor(uid);
  };

  resolveFullChain = (chainData) => {
    if (!chainData) {
      return [];
    }
    const fromApi = chainData.full_chain;
    if (Array.isArray(fromApi) && fromApi.length > 0) {
      return fromApi;
    }
    return chainData.current ? [chainData.current] : [];
  };

  handleMapChainNavAnimationEnd = (event) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    const name = String(event.animationName || "");
    if (!name.includes("chainNavSwipe")) {
      return;
    }
    const cb = this.props.onMapChainNavAnimationEnd;
    if (typeof cb === "function") {
      cb();
    }
  };

  wrapContextMapClickableRow = (rowClassName, mapPayload, children) => {
    const { onOpenInCurriculumMap } = this.props;
    const base = `chain-aufbau-context-line ${rowClassName}`.trim();
    const fachOk = mapPayload && String(mapPayload.fachName || "").trim();
    if (typeof onOpenInCurriculumMap !== "function" || !fachOk) {
      return <div className={base}>{children}</div>;
    }
    const fk = mapPayload.focusKind;
    const ariaLabel =
      fk === "fach"
        ? `Fach in der Landkarte: ${String(mapPayload.fachName).trim()}`
        : fk === "kb"
          ? `Kompetenzbereich in der Landkarte zu ${String(mapPayload.fachName).trim()}`
          : `Kette in der Landkarte zu ${String(mapPayload.fachName).trim()}`;
    return (
      <button
        type="button"
        className={`${base} chain-aufbau-context-hit`}
        onClick={() => onOpenInCurriculumMap(mapPayload)}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  };

  renderFullChainList = () => {
    const {
      chainData,
      getZyklusColorByPart,
      getFachColor,
      highlightAnchorUid,
      searchSelectionHighlight = false,
    } = this.props;
    if (!chainData) {
      return null;
    }
    const fullChain = this.resolveFullChain(chainData);
    if (fullChain.length === 0) {
      return null;
    }
    const currentUid = chainData.current && chainData.current.uid;
    const currentDocKey =
      chainData.current &&
      chainData.current.doc_key &&
      String(chainData.current.doc_key).trim()
        ? String(chainData.current.doc_key).trim()
        : "";
    const currentKey = currentDocKey || currentUid;
    const anchor = chainData.current || fullChain[0];
    const contextFach = anchor && anchor.fach;
    const contextThema = anchor && anchor.themenbereich;
    const anchorCode = anchor && anchor.code;
    const fachToken = parseLp21Parts(anchorCode)[0] || "";
    const contextKbCode = kbCodeFromCompetencyCode(anchorCode);
    const aspectCode = aspectCodeFromCompetencyCode(anchorCode);
    const clusterPrefix = clusterHeadingPrefixFromCode(anchorCode);
    const headingRaw =
      chainData &&
      typeof chainData.chain_heading === "string" &&
      chainData.chain_heading.trim()
        ? chainData.chain_heading.trim()
        : "";
    const apiKbRaw =
      chainData &&
      chainData.themenbereich_kb != null &&
      String(chainData.themenbereich_kb).trim()
        ? String(chainData.themenbereich_kb).trim()
        : "";
    const apiAspRaw =
      chainData &&
      chainData.themenbereich_aspect != null &&
      String(chainData.themenbereich_aspect).trim()
        ? String(chainData.themenbereich_aspect).trim()
        : "";
    const splitFb = splitThemenbereichOnFirstWord(contextThema);
    const useApiThemenSplit = Boolean(apiKbRaw && apiAspRaw);
    const themaFirst = useApiThemenSplit ? apiKbRaw : splitFb.first;
    const themaRest = useApiThemenSplit ? apiAspRaw : splitFb.rest;
    const canSplitThema =
      Boolean(themaRest) &&
      Boolean(contextKbCode) &&
      Boolean(aspectCode) &&
      aspectCode !== contextKbCode &&
      Boolean(clusterPrefix) &&
      clusterPrefix !== aspectCode;
    const anchorUid =
      chainData.current && chainData.current.uid != null
        ? String(chainData.current.uid).trim()
        : "";
    const rawClusterCode =
      chainData && chainData.cluster_code != null
        ? String(chainData.cluster_code).trim()
        : "";
    const headCluster = rawClusterCode || clusterPrefix || "";

    const showContextBlock =
      contextFach ||
      contextThema ||
      contextKbCode ||
      fachToken ||
      headingRaw;

    return (
      <div className="chain-aufbau-section">
        {showContextBlock ? (
          <header
            className="chain-aufbau-context-head"
            style={
              contextFach
                ? { "--fach-color": getFachColor(contextFach) }
                : undefined
            }
          >
            {(fachToken || contextFach) &&
              this.wrapContextMapClickableRow(
                "chain-aufbau-context-line--fach",
                contextFach
                  ? { fachName: contextFach, focusKind: "fach" }
                  : null,
                <>
                  <span className="chain-aufbau-context-code-cell">
                    {fachToken ? (
                      <span
                        className="result-code-text chain-aufbau-context-code"
                        title={describeLp21Code(fachToken)}
                      >
                        {fachToken}
                      </span>
                    ) : null}
                  </span>
                  {contextFach ? (
                    <span className="chain-aufbau-context-text-cell chain-aufbau-context-fachname">
                      {contextFach}
                    </span>
                  ) : null}
                </>,
              )}
            {(contextKbCode || contextThema) && (
              <>
                {canSplitThema ? (
                  <>
                    {this.wrapContextMapClickableRow(
                      "chain-aufbau-context-line--thema chain-aufbau-context-line--kb",
                      contextFach && contextKbCode
                        ? {
                            fachName: contextFach,
                            focusKind: "kb",
                            kbCode: contextKbCode,
                          }
                        : null,
                      <>
                        <span className="chain-aufbau-context-code-cell">
                          {contextKbCode ? (
                            <span
                              className="result-code-text chain-aufbau-context-code"
                              title={describeLp21Code(contextKbCode)}
                            >
                              {contextKbCode}
                            </span>
                          ) : null}
                        </span>
                        {themaFirst ? (
                          <span className="chain-aufbau-context-text-cell chain-aufbau-thema chain-aufbau-thema--context">
                            {themaFirst}
                          </span>
                        ) : null}
                      </>,
                    )}
                    {this.wrapContextMapClickableRow(
                      "chain-aufbau-context-line--thema chain-aufbau-context-line--aspect",
                      contextFach
                        ? {
                            fachName: contextFach,
                            focusKind: "cluster",
                            kbCode: contextKbCode || undefined,
                            clusterCode: aspectCode || clusterPrefix || headCluster || undefined,
                            anchorUid: anchorUid || undefined,
                          }
                        : null,
                      <>
                        <span className="chain-aufbau-context-code-cell">
                          {aspectCode ? (
                            <span
                              className="result-code-text chain-aufbau-context-code"
                              title={describeLp21Code(aspectCode)}
                            >
                              {aspectCode}
                            </span>
                          ) : null}
                        </span>
                        {themaRest ? (
                          <span className="chain-aufbau-context-text-cell chain-aufbau-thema chain-aufbau-thema--context">
                            {themaRest}
                          </span>
                        ) : null}
                      </>,
                    )}
                  </>
                ) : (
                  this.wrapContextMapClickableRow(
                    "chain-aufbau-context-line--thema",
                    contextFach && contextKbCode
                      ? {
                          fachName: contextFach,
                          focusKind: "kb",
                          kbCode: contextKbCode,
                        }
                      : null,
                    <>
                      <span className="chain-aufbau-context-code-cell">
                        {contextKbCode ? (
                          <span
                            className="result-code-text chain-aufbau-context-code"
                            title={describeLp21Code(contextKbCode)}
                          >
                            {contextKbCode}
                          </span>
                        ) : null}
                      </span>
                      {contextThema ? (
                        <span className="chain-aufbau-context-text-cell chain-aufbau-thema chain-aufbau-thema--context">
                          {contextThema}
                        </span>
                      ) : null}
                    </>,
                  )
                )}
              </>
            )}
            {headingRaw
              ? this.wrapContextMapClickableRow(
                  "chain-aufbau-context-line--cluster",
                  contextFach
                    ? {
                        fachName: contextFach,
                        focusKind: "cluster",
                        kbCode: contextKbCode || undefined,
                        clusterCode: headCluster || clusterPrefix || undefined,
                        anchorUid: anchorUid || undefined,
                      }
                    : null,
                  <>
                    <span className="chain-aufbau-context-code-cell">
                      {clusterPrefix ? (
                        <span
                          className="result-code-text chain-aufbau-context-code"
                          title={describeLp21Code(clusterPrefix)}
                        >
                          {clusterPrefix}
                        </span>
                      ) : null}
                    </span>
                    <span className="chain-aufbau-context-text-cell chain-aufbau-chain-heading">
                      {headingRaw}
                    </span>
                  </>,
                )
              : null}
          </header>
        ) : null}

        <div className="chain-aufbau-stack" role="list" aria-label="Stufen dieser Aufbau-Kette">
          {fullChain.map((item, index) => {
            if (!item) {
              return null;
            }
            const itemKey =
              (item.doc_key && String(item.doc_key).trim()) || item.uid;
            /** Nur Such-Klick: aktuelle Stufe hervorheben / scrollen — nicht in der Landkarten-ChainView. */
            const isCurrent = Boolean(
              searchSelectionHighlight &&
                currentKey &&
                chainStepMatchesLookupKey(item, currentKey),
            );
            const itemUid =
              item && item.uid != null ? String(item.uid).trim() : "";
            const itemDocKey =
              item && item.doc_key != null ? String(item.doc_key).trim() : "";
            const isHighlightAnchor = Boolean(
              searchSelectionHighlight &&
                highlightAnchorUid &&
                (chainStepMatchesLookupKey(item, highlightAnchorUid) ||
                  (itemKey && itemKey === highlightAnchorUid) ||
                  (itemUid && itemUid === highlightAnchorUid) ||
                  (itemDocKey && itemDocKey === highlightAnchorUid))
            );
            const markerStyle = buildZyklusMarkerStyle(item.zyklus, getZyklusColorByPart);

            const textVariants =
              Array.isArray(item.text_variants) && item.text_variants.length > 0
                ? item.text_variants.map((t) => String(t || "").trim()).filter(Boolean)
                : [];
            const innerBody = (
              <>
                {this.renderChainNetworkPeerRow(item)}
                {textVariants.length > 0
                  ? textVariants.map((tx, ti) => (
                      <React.Fragment key={`${item.code || "c"}-tx-${ti}`}>
                        {ti > 0 ? (
                          <hr className="chain-aufbau-merge-sep" aria-hidden="true" />
                        ) : null}
                        <p className="result-text chain-aufbau-card-text">{tx}</p>
                      </React.Fragment>
                    ))
                  : (
                      <p className="result-text chain-aufbau-card-text">{item.text}</p>
                    )}
              </>
            );

            const cardClass = [
              "result-card",
              "chain-aufbau-card",
              isCurrent ? "chain-aufbau-card--current" : "",
              isHighlightAnchor ? "chain-aufbau-card--selected" : "",
            ]
              .filter(Boolean)
              .join(" ");

            const stepKey =
              (Array.isArray(item.merged_doc_keys) && item.merged_doc_keys.length > 0
                ? item.merged_doc_keys.join("|")
                : null) ||
              (item.doc_key && String(item.doc_key).trim()) ||
              item.uid ||
              `step-${index}`;

            return (
              <article
                key={stepKey}
                ref={isCurrent ? this.currentFullChainRef : undefined}
                className={cardClass}
                style={markerStyle}
                aria-current={isCurrent ? "step" : undefined}
                role="listitem"
              >
                <div className="result-card-layout chain-aufbau-layout">
                  <div className="result-card-left">{innerBody}</div>
                  {this.renderChainActions(item)}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  };

  render() {
    const {
      loading,
      error,
      chainData,
      backButtonLabel,
      backButtonAriaLabel,
      mapOutlineChainNav,
      mapChainNavDirection,
      chainLoadingStatusDelayMs,
    } = this.props;

    const delayMs = Number(chainLoadingStatusDelayMs) || 0;
    const showChainBodyWhileLoading = Boolean(
      chainData && !error && (!loading || delayMs > 0),
    );
    const showLoadingStatusLine = Boolean(
      loading &&
        (delayMs <= 0 || this.state.deferredChainLoadingVisible),
    );

    const navSwipeClass =
      mapChainNavDirection === "next"
        ? "chain-panel-flow--nav-swipe-next"
        : mapChainNavDirection === "prev"
          ? "chain-panel-flow--nav-swipe-prev"
          : "";

    return (
      <section className="competency-chain-panel" aria-labelledby="chain-panel-title">
        <div className="chain-toolbar">
          <button
            type="button"
            className="chain-back-button"
            onClick={this.handleBackClick}
            aria-label={
              typeof backButtonAriaLabel === "string" && backButtonAriaLabel.trim()
                ? backButtonAriaLabel.trim()
                : "Zurück zur Suchergebnisliste"
            }
          >
            {typeof backButtonLabel === "string" && backButtonLabel.trim()
              ? backButtonLabel.trim()
              : "← Zurück zur Suche"}
          </button>
          <h2 id="chain-panel-title" className="chain-panel-title chain-panel-title--visually-hidden">
            Aufbau-Kette
          </h2>
          {mapOutlineChainNav &&
          typeof mapOutlineChainNav.onPrevious === "function" &&
          typeof mapOutlineChainNav.onNext === "function" ? (
            <div
              className="chain-toolbar-map-nav"
              role="group"
              aria-label="Kette in der Landkarte wechseln"
            >
              <button
                type="button"
                className="chain-map-nav-btn chain-map-nav-btn--up"
                disabled={!mapOutlineChainNav.hasPrevious || loading}
                onClick={mapOutlineChainNav.onPrevious}
                aria-label="Vorherige Kette in der Landkarte"
                title="Vorherige Kette"
              >
                <MapNavTriangleUp />
              </button>
              <button
                type="button"
                className="chain-map-nav-btn chain-map-nav-btn--down"
                disabled={!mapOutlineChainNav.hasNext || loading}
                onClick={mapOutlineChainNav.onNext}
                aria-label="Nächste Kette in der Landkarte"
                title="Nächste Kette"
              >
                <MapNavTriangleDown />
              </button>
            </div>
          ) : null}
        </div>

        {showLoadingStatusLine ? (
          <p className="chain-status">Lade Kontext …</p>
        ) : null}

        {!loading && error ? (
          <p className="chain-status chain-status-error" role="alert">
            {error}
          </p>
        ) : null}

        {showChainBodyWhileLoading ? (
          <div
            className={[
              "chain-panel-flow",
              loading && delayMs > 0 ? "chain-panel-flow--map-loading-stale" : "",
              navSwipeClass,
            ]
              .filter(Boolean)
              .join(" ")}
            onAnimationEnd={this.handleMapChainNavAnimationEnd}
          >
            <div className="chain-main">
              <div
                id="chain-tabpanel-aufbau"
                role="region"
                aria-labelledby="chain-panel-title"
              >
                {this.renderFullChainList()}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    );
  }
}

export default CompetencyChainView;
