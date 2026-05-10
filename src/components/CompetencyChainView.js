import React, { Component } from "react";

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

class CompetencyChainView extends Component {
  constructor(props) {
    super(props);
    this.currentFullChainRef = React.createRef();
    this.state = {
      copiedUid: null,
      /** Fallback wenn /competency-chain noch keine network_links liefert (alter Server) */
      networkHintsByUid: {},
    };
    this.copyFeedbackTimer = null;
    this.hintFetchPending = new Set();
  }

  componentWillUnmount() {
    if (this.copyFeedbackTimer != null) {
      window.clearTimeout(this.copyFeedbackTimer);
      this.copyFeedbackTimer = null;
    }
  }

  componentDidMount() {
    this.scheduleScrollToSelected();
    this.fetchNetworkHintsForChain();
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
  }

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
      if (!item || !item.uid) {
        return;
      }
      if (item.network_links && item.network_links.length > 0) {
        return;
      }
      if (this.state.networkHintsByUid[item.uid]?.length) {
        return;
      }
      if (this.hintFetchPending.has(item.uid)) {
        return;
      }
      this.hintFetchPending.add(item.uid);
      fetch(getCompetencyNetworkUrl(item.uid))
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
              [item.uid]: mapped,
            },
          }));
        })
        .catch(() => {})
        .finally(() => {
          this.hintFetchPending.delete(item.uid);
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
    const { chainData, loading } = this.props;
    if (loading || !chainData?.current) {
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
    const payload = [
      `Fach: ${item.fach || "-"}`,
      `Zyklus: ${item.zyklus || "-"}`,
      `Themenbereich: ${item.themenbereich || "-"}`,
      `Code: ${item.code || "-"}`,
      `Kompetenz: ${item.text || "-"}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(payload);
      if (this.copyFeedbackTimer != null) {
        window.clearTimeout(this.copyFeedbackTimer);
      }
      this.setState({ copiedUid: item.uid || "__anon__" });
      this.copyFeedbackTimer = window.setTimeout(() => {
        this.copyFeedbackTimer = null;
        this.setState({ copiedUid: null });
      }, 1500);
    } catch (_err) {
      this.setState({ copiedUid: null });
    }
  };

  renderNetworkLinksForItem = (item) => {
    if (!item || !item.uid) {
      return null;
    }
    let links = item.network_links;
    if (!Array.isArray(links) || links.length === 0) {
      links = this.state.networkHintsByUid[item.uid];
    }
    if (!Array.isArray(links) || links.length === 0) {
      return null;
    }
    return (
      <div
        className="chain-network-links"
        role="group"
        aria-label="Offizielle Querverweise zu anderen Kompetenzstufen"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <span className="chain-network-links-caption">
          Querverweise zu anderen Kompetenzstufen (laut Lehrplan)
        </span>
        <div className="chain-network-links-buttons">
          {links.map((lnk) => {
            const label = [lnk.code, lnk.fach].filter(Boolean).join(" · ") || "Verknüpfte Kompetenz";
            return (
              <button
                key={lnk.uid}
                type="button"
                className="chain-network-link-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  this.handleFullChainStepActivate(lnk.uid);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
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
    const copyKey = item.uid || "__anon__";
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
    const currentKey =
      (cur && cur.doc_key && String(cur.doc_key).trim()) ||
      (cur && cur.uid) ||
      "";
    if (!uid || uid === currentKey || !onSelectNeighbor) {
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

  renderFullChainList = () => {
    const { chainData, getZyklusColorByPart, getFachColor, highlightAnchorUid } = this.props;
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

    return (
      <div className="chain-aufbau-section">
        {(contextFach || contextThema) && (
          <header
            className="chain-aufbau-context-head"
            style={
              contextFach
                ? { "--fach-color": getFachColor(contextFach) }
                : undefined
            }
          >
            {contextFach ? (
              <span className="group-fach-pill">{contextFach}</span>
            ) : null}
            {contextThema ? (
              <h3 className="chain-aufbau-thema">{contextThema}</h3>
            ) : null}
          </header>
        )}

        <div className="chain-aufbau-stack" role="list" aria-label="Stufen dieser Aufbau-Kette">
          {fullChain.map((item, index) => {
            if (!item) {
              return null;
            }
            const itemKey =
              (item.doc_key && String(item.doc_key).trim()) || item.uid;
            const isCurrent = Boolean(
              currentKey && itemKey && itemKey === currentKey
            );
            const isHighlightAnchor = Boolean(
              highlightAnchorUid &&
                itemKey &&
                itemKey === highlightAnchorUid
            );
            const markerStyle = buildZyklusMarkerStyle(item.zyklus, getZyklusColorByPart);

            const innerBody = (
              <>
                {item.code ? (
                  <div className="chain-comp-meta">
                    <span className="result-code-text">{item.code}</span>
                  </div>
                ) : null}
                <p className="result-text chain-aufbau-card-text">{item.text}</p>
                {this.renderNetworkLinksForItem(item)}
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

            const stepKey = item.uid || `step-${index}`;

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
    } = this.props;

    const headingRaw =
      chainData &&
      typeof chainData.chain_heading === "string" &&
      chainData.chain_heading.trim()
        ? chainData.chain_heading.trim()
        : "";
    const panelTitle = headingRaw || "Aufbau-Kontext";

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
          <h2
            id="chain-panel-title"
            className={`chain-panel-title ${headingRaw ? "chain-panel-title--from-lehrplan" : ""}`}
          >
            {panelTitle}
          </h2>
        </div>

        {loading ? (
          <p className="chain-status">Lade Kontext …</p>
        ) : null}

        {!loading && error ? (
          <p className="chain-status chain-status-error" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error && chainData ? (
          <div className="chain-panel-flow">
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
