import React, { Component } from "react";
import CompetencyChainView from "./CompetencyChainView";
import { truncateCompetencyLabel } from "../recentCompetencyHistory";
import { describeLp21Code } from "../lp21Code";

function normOutlineToken(s) {
  return String(s || "").toLowerCase();
}

function countOutlineStats(outline) {
  const kbCount = Array.isArray(outline) ? outline.length : 0;
  let chainCount = 0;
  if (Array.isArray(outline)) {
    outline.forEach((kb) => {
      (kb.aspects || []).forEach((asp) => {
        chainCount += (asp.chains || []).length;
      });
    });
  }
  return { kbCount, chainCount };
}

/** Filtert KB / Aspekte / Ketten nach Teilstring (Label, Code, Stufentext). */
function filterOutlineByQuery(outline, query) {
  const q = normOutlineToken(query).trim();
  if (!q) {
    return Array.isArray(outline) ? outline : [];
  }

  const chainMatches = (ch) => {
    const heading = (ch.heading || "").trim();
    const clusterCode = String(ch.cluster_code || "").trim();
    const anchorUid = String(ch.anchor_uid || "").trim();
    if (
      normOutlineToken(heading).includes(q) ||
      normOutlineToken(clusterCode).includes(q) ||
      normOutlineToken(anchorUid).includes(q)
    ) {
      return true;
    }
    const stages = Array.isArray(ch.stages) ? ch.stages : [];
    return stages.some(
      (st) =>
        normOutlineToken(st && st.text).includes(q) ||
        normOutlineToken(st && st.code).includes(q),
    );
  };

  const filterAspect = (aspect) => {
    const chainsIn = aspect.chains || [];
    const filteredChains = chainsIn.filter(chainMatches);
    const aspLabel = String(aspect.aspect_label || "").trim();
    const aspCode =
      aspect.aspect_code != null ? String(aspect.aspect_code).trim() : "";

    if (!aspect.aspect_code) {
      if (filteredChains.length === 0) {
        return null;
      }
      return { ...aspect, chains: filteredChains };
    }
    if (filteredChains.length > 0) {
      return { ...aspect, chains: filteredChains };
    }
    if (
      normOutlineToken(aspLabel).includes(q) ||
      normOutlineToken(aspCode).includes(q)
    ) {
      return { ...aspect, chains: chainsIn };
    }
    return null;
  };

  const filterKb = (kb) => {
    const kbLabel = String(kb.kb_label || "").trim();
    const kbCode = kb.kb_code != null ? String(kb.kb_code).trim() : "";
    if (
      normOutlineToken(kbLabel).includes(q) ||
      normOutlineToken(kbCode).includes(q)
    ) {
      return kb;
    }
    const aspects = (kb.aspects || []).map(filterAspect).filter(Boolean);
    if (aspects.length === 0) {
      return null;
    }
    return { ...kb, aspects };
  };

  return outline.map(filterKb).filter(Boolean);
}

function expandAllMapsFromOutline(outline) {
  const kb = {};
  const aspect = {};
  const chain = {};
  if (!Array.isArray(outline)) {
    return { kb, aspect, chain };
  }
  outline.forEach((kbNode) => {
    const kbCode = kbNode.kb_code != null ? String(kbNode.kb_code) : "";
    kb[kbCode] = true;
    (kbNode.aspects || []).forEach((asp, ai) => {
      aspect[`${kbCode}__${ai}`] = true;
      (asp.chains || []).forEach((ch) => {
        const uid = ch.anchor_uid != null ? String(ch.anchor_uid).trim() : "";
        const stages = Array.isArray(ch.stages) ? ch.stages : [];
        if (uid && stages.length > 0) {
          chain[uid] = true;
        }
      });
    });
  });
  return { kb, aspect, chain };
}

function mergeExpandedForFiltered(baseExp, forcedKeys) {
  return {
    kb: { ...baseExp.kb, ...forcedKeys.kb },
    aspect: { ...baseExp.aspect, ...forcedKeys.aspect },
    chain: { ...baseExp.chain, ...forcedKeys.chain },
  };
}

/**
 * Landkarte: Fach → Outline (Kompetenzbereiche, Aspekte, Ketten, Stufen) → CompetencyChainView.
 * State der Kette ist getrennt vom Such-„chainView“ in App.js.
 */
class CurriculumMapOverlay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      overview: null,
      overviewLoading: false,
      overviewError: null,
      selectedFach: null,
      mapChainView: null,
      /** Landkarte-Outline: standardmäßig zugeklappt (nur Kopfzeilen sichtbar). */
      mapOutlineExpanded: { kb: {}, aspect: {}, chain: {} },
      /** Teilfilter für Outline (Client-seitig); bei Treffern werden Zweige automatisch sichtbar gemacht. */
      mapOutlineFilter: "",
    };
    this.escapeHandler = null;
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.ensureOverviewLoaded();
      this.attachEscapeListener();
      document.body.style.overflow = "hidden";
    }
    if (prevProps.isOpen && !this.props.isOpen) {
      this.removeEscapeListener();
      document.body.style.overflow = "";
      this.setState({
        selectedFach: null,
        mapChainView: null,
        mapOutlineExpanded: { kb: {}, aspect: {}, chain: {} },
        mapOutlineFilter: "",
      });
    }
  }

  componentWillUnmount() {
    this.removeEscapeListener();
    document.body.style.overflow = "";
  }

  attachEscapeListener = () => {
    this.removeEscapeListener();
    this.escapeHandler = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.props.onClose();
      }
    };
    document.addEventListener("keydown", this.escapeHandler);
  };

  removeEscapeListener = () => {
    if (this.escapeHandler) {
      document.removeEventListener("keydown", this.escapeHandler);
      this.escapeHandler = null;
    }
  };

  resolveOverviewErrorMessage = (error) => {
    const code = error && error.message;
    if (code === "overview_404") {
      return (
        "Übersicht nicht gefunden (404). Meist läuft noch eine ältere Backend-Version ohne diese Route — " +
        "Backend einmal beenden und neu starten: cd backend && python3 server.py (Port 5001)."
      );
    }
    if (code === "overview_500") {
      return "Die Übersicht konnte auf dem Server nicht erzeugt werden (HTTP 500). Prüfe die Konsole von server.py.";
    }
    if (code === "overview_http") {
      return "Die Übersicht konnte nicht geladen werden (unerwartete Server-Antwort).";
    }
    const looksLikeNetwork =
      error &&
      (error.name === "TypeError" ||
        (typeof error.message === "string" &&
          (error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError"))));
    if (looksLikeNetwork) {
      return (
        "Keine Verbindung zum Backend. Erwartet unter der konfigurierten API-URL " +
        "(lokal: python3 server.py auf Port 5001, danach Seite neu laden)."
      );
    }
    return "Die Übersicht konnte nicht geladen werden.";
  };

  ensureOverviewLoaded = () => {
    const { apiUrl } = this.props;
    if (this.state.overview || this.state.overviewLoading) {
      return;
    }
    this.setState({ overviewLoading: true, overviewError: null });

    const fetchOverviewJson = async () => {
      let response = await fetch(apiUrl("/api/curriculum-overview"));
      if (response.status === 404) {
        response = await fetch(apiUrl("/curriculum-overview"));
      }
      if (response.status === 404) {
        throw new Error("overview_404");
      }
      if (response.status === 500) {
        throw new Error("overview_500");
      }
      if (!response.ok) {
        throw new Error("overview_http");
      }
      return response.json();
    };

    fetchOverviewJson()
      .then((data) => {
        const subjects = Array.isArray(data.subjects) ? data.subjects : [];
        this.setState({
          overview: { subjects },
          overviewLoading: false,
          overviewError: null,
        });
      })
      .catch((error) => {
        this.setState({
          overviewLoading: false,
          overviewError: this.resolveOverviewErrorMessage(error),
        });
      });
  };

  handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      this.props.onClose();
    }
  };

  handleSelectFach = (name) => {
    this.setState({
      selectedFach: name,
      mapChainView: null,
      mapOutlineExpanded: { kb: {}, aspect: {}, chain: {} },
      mapOutlineFilter: "",
    });
  };

  handleOutlineFilterChange = (event) => {
    this.setState({ mapOutlineFilter: event.target.value });
  };

  handleExpandAllOutline = () => {
    const { overview, selectedFach } = this.state;
    const sub = overview && overview.subjects
      ? overview.subjects.find((s) => s.name === selectedFach)
      : null;
    if (!sub || !Array.isArray(sub.outline)) {
      return;
    }
    this.setState({
      mapOutlineExpanded: expandAllMapsFromOutline(sub.outline),
    });
  };

  handleCollapseAllOutline = () => {
    this.setState({
      mapOutlineExpanded: { kb: {}, aspect: {}, chain: {} },
    });
  };

  handleToggleOutlineKb = (kbCode) => {
    const key = String(kbCode || "");
    this.setState((prev) => {
      const m = prev.mapOutlineExpanded || { kb: {}, aspect: {}, chain: {} };
      const cur = Boolean(m.kb[key]);
      return {
        mapOutlineExpanded: {
          ...m,
          kb: { ...m.kb, [key]: !cur },
        },
      };
    });
  };

  handleToggleOutlineAspect = (kbCode, aspectIndex) => {
    const id = `${String(kbCode || "")}__${aspectIndex}`;
    this.setState((prev) => {
      const m = prev.mapOutlineExpanded || { kb: {}, aspect: {}, chain: {} };
      const cur = Boolean(m.aspect[id]);
      return {
        mapOutlineExpanded: {
          ...m,
          aspect: { ...m.aspect, [id]: !cur },
        },
      };
    });
  };

  handleToggleOutlineChain = (anchorUid) => {
    const key = String(anchorUid || "");
    this.setState((prev) => {
      const m = prev.mapOutlineExpanded || { kb: {}, aspect: {}, chain: {} };
      const cur = Boolean(m.chain[key]);
      return {
        mapOutlineExpanded: {
          ...m,
          chain: { ...m.chain, [key]: !cur },
        },
      };
    });
  };

  renderOutlineToggle = (isExpanded, onToggle, ariaLabel) => (
    <button
      type="button"
      className="map-outline-toggle"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      aria-expanded={isExpanded}
      aria-label={ariaLabel}
    >
      <span
        className={`map-outline-chevron ${isExpanded ? "map-outline-chevron--open" : ""}`}
        aria-hidden="true"
      >
        ▶
      </span>
    </button>
  );

  handleBreadcrumbRoot = () => {
    this.setState({
      selectedFach: null,
      mapChainView: null,
    });
  };

  /** Von Aufbau-Kette zurück zur Outline; von Outline zurück zur Fächerliste. */
  handleBreadcrumbFach = () => {
    if (this.state.mapChainView) {
      this.setState({ mapChainView: null });
      return;
    }
    this.setState({ selectedFach: null });
  };

  handleOpenChain = (uid, labelHint, codeHint, fachHint) => {
    const trimmed =
      typeof uid === "string"
        ? uid.trim()
        : uid != null
          ? String(uid).trim()
          : "";
    if (!trimmed) {
      return;
    }
    const { apiUrl, enrichChainDataWithNetworkApi, onRecordRecentView } = this.props;
    const highlightAnchorUid = trimmed;

    if (typeof onRecordRecentView === "function") {
      onRecordRecentView({
        uid: highlightAnchorUid,
        code: codeHint,
        fach: fachHint,
        label: labelHint || highlightAnchorUid,
      });
    }

    this.setState({
      mapChainView: {
        loading: true,
        error: null,
        data: null,
        highlightAnchorUid,
      },
    });

    fetch(apiUrl(`/competency-chain/${encodeURIComponent(trimmed)}`))
      .then((response) => {
        if (response.status === 404) {
          throw new Error("not_found");
        }
        if (!response.ok) {
          throw new Error("network");
        }
        return response.json();
      })
      .then((data) => enrichChainDataWithNetworkApi(data))
      .then((data) => {
        const cur = data && data.current;
        if (typeof onRecordRecentView === "function" && cur) {
          onRecordRecentView({
            uid: String(cur.uid).trim(),
            code: cur.code,
            fach: cur.fach,
            label: truncateCompetencyLabel(cur.text || cur.code || cur.uid, 120),
          });
        }
        this.setState((prev) => ({
          mapChainView: prev.mapChainView
            ? {
                ...prev.mapChainView,
                loading: false,
                error: null,
                data,
              }
            : {
                loading: false,
                error: null,
                data,
                highlightAnchorUid,
              },
        }));
      })
      .catch((error) => {
        const message =
          error.message === "not_found"
            ? "Für diese Kompetenz wurde kein Aufbau-Kontext gefunden."
            : "Der Aufbau-Kontext konnte nicht geladen werden.";
        this.setState((prev) => ({
          mapChainView: prev.mapChainView
            ? {
                ...prev.mapChainView,
                loading: false,
                error: message,
                data: null,
              }
            : {
                loading: false,
                error: message,
                data: null,
                highlightAnchorUid,
              },
        }));
      });
  };

  handleMapChainBack = () => {
    this.setState({ mapChainView: null });
  };

  handleMapChainSelectNeighbor = (nextUid) => {
    const { mapChainView } = this.state;
    const { enrichChainDataWithNetworkApi, onRecordRecentView } = this.props;
    const fullChain = mapChainView && mapChainView.data && mapChainView.data.full_chain;
    if (fullChain && Array.isArray(fullChain) && nextUid) {
      const idx = fullChain.findIndex((step) => step && step.uid === nextUid);
      if (idx !== -1) {
        const cur = fullChain[idx];
        const data = {
          previous: idx > 0 ? fullChain[idx - 1] : null,
          current: cur,
          next: idx < fullChain.length - 1 ? fullChain[idx + 1] : null,
          full_chain: fullChain,
          chain_heading: mapChainView.data.chain_heading,
          _has_network: Boolean(cur && cur.network_links && cur.network_links.length > 0),
        };
        const stepUid = (cur && cur.uid) || nextUid;
        const stepLabel =
          truncateCompetencyLabel(cur && cur.text, 120) ||
          (cur && cur.code ? String(cur.code).trim() : "") ||
          stepUid;
        if (typeof onRecordRecentView === "function") {
          onRecordRecentView({
            uid: stepUid,
            code: cur && cur.code ? String(cur.code).trim() : undefined,
            fach: cur && cur.fach ? String(cur.fach).trim() : undefined,
            label: stepLabel,
          });
        }
        enrichChainDataWithNetworkApi(data).then((enriched) => {
          this.setState({
            mapChainView: {
              ...mapChainView,
              loading: false,
              error: null,
              data: enriched,
            },
          });
        });
        return;
      }
    }
    if (!nextUid) {
      return;
    }
    this.handleOpenChain(nextUid, nextUid, undefined, undefined);
  };

  handleToggleBookmarkStepFromMapChain = (item) => {
    const { onBookmarkToggle } = this.props;
    if (!item || typeof onBookmarkToggle !== "function") {
      return;
    }
    const bookmarkId =
      (item.doc_key != null && String(item.doc_key).trim()) ||
      (item.uid != null && String(item.uid).trim()) ||
      "";
    if (!bookmarkId) {
      return;
    }
    onBookmarkToggle({
      uid: bookmarkId,
      label: truncateCompetencyLabel(item.text || item.code || bookmarkId, 200),
      code: item.code,
      fach: item.fach,
      zyklus: item.zyklus,
      themenbereich: item.themenbereich,
    });
  };

  renderSubjectChips = (subjects) => (
    <div
      className="curriculum-map-chip-scroll"
      role="group"
      aria-label="Fach auswählen"
    >
      {subjects.map((subj) => (
        <button
          key={subj.name}
          type="button"
          className={`quick-chip curriculum-map-fach-chip ${this.state.selectedFach === subj.name ? "active" : ""}`}
          style={{ "--chip-accent": this.props.getFachColor(subj.name) }}
          onClick={() => this.handleSelectFach(subj.name)}
        >
          <span className="curriculum-map-fach-chip-label">{subj.name}</span>
          {subj.fach_code ? (
            <span
              className="curriculum-map-fach-token"
              title="Fachbereich-Kürzel (Lehrplan 21)"
            >
              {subj.fach_code}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );

  renderFachOutline = (subject) => {
    const fachName = subject.name;
    const fachCode = subject.fach_code ? String(subject.fach_code).trim() : "";
    const outlineRaw = Array.isArray(subject.outline) ? subject.outline : [];
    const filterRaw = (this.state.mapOutlineFilter || "").trim();
    const filterActive = filterRaw.length > 0;
    const filteredOutline = filterActive
      ? filterOutlineByQuery(outlineRaw, filterRaw)
      : outlineRaw;
    const statsFull = countOutlineStats(outlineRaw);
    const statsShown = countOutlineStats(filteredOutline);
    const baseExp = this.state.mapOutlineExpanded || { kb: {}, aspect: {}, chain: {} };
    const forcedKeys = expandAllMapsFromOutline(filteredOutline);
    const exp = filterActive
      ? mergeExpandedForFiltered(baseExp, forcedKeys)
      : baseExp;

    const renderChainBlock = (chain, chainIndentClass) => {
      const anchorUid = chain.anchor_uid ? String(chain.anchor_uid).trim() : "";
      const clusterCode = chain.cluster_code ? String(chain.cluster_code).trim() : "";
      const heading = (chain.heading || "").trim();
      const stages = Array.isArray(chain.stages) ? chain.stages : [];
      const expandedChain = Boolean(exp.chain[anchorUid]);
      const stageLabel =
        heading || clusterCode || anchorUid || "Kompetenzkette";

      return (
        <div key={anchorUid || heading} className={`map-outline-chain-block ${chainIndentClass}`}>
          <div className="map-outline-chain-head">
            {stages.length > 0 ? (
              this.renderOutlineToggle(
                expandedChain,
                () => this.handleToggleOutlineChain(anchorUid),
                `Stufen zu „${stageLabel}“ ein- oder ausblenden`,
              )
            ) : (
              <span className="map-outline-toggle-gap" aria-hidden="true" />
            )}
            <button
              type="button"
              className="map-outline-row map-outline-row--heading map-outline-chain-open map-outline-click"
              title={clusterCode ? describeLp21Code(clusterCode) : undefined}
              disabled={!anchorUid}
              onClick={() =>
                anchorUid
                  ? this.handleOpenChain(
                      anchorUid,
                      heading || clusterCode,
                      clusterCode || undefined,
                      fachName,
                    )
                  : undefined
              }
            >
              <span className="map-outline-text map-outline-heading-text">
                {heading || clusterCode || anchorUid}
              </span>
              {clusterCode ? <span className="map-outline-code">{clusterCode}</span> : null}
            </button>
          </div>
          {expandedChain && stages.length > 0 ? (
            <ul className="map-outline-stage-list" aria-label="Stufen dieser Kompetenzkette">
              {stages.map((st, si) => {
                const stUid = st && st.uid != null ? String(st.uid).trim() : "";
                const sc = st && st.code != null ? String(st.code).trim() : "";
                const tx = st && st.text != null ? String(st.text).trim() : "";
                return (
                  <li key={stUid || `${si}-${sc}`}>
                    <button
                      type="button"
                      className="map-outline-row map-outline-row--stage map-outline-click map-outline-indent-4"
                      title={sc ? describeLp21Code(sc) : undefined}
                      disabled={!stUid}
                      onClick={() =>
                        stUid
                          ? this.handleOpenChain(stUid, tx || sc, sc || undefined, fachName)
                          : undefined
                      }
                    >
                      <span className="map-outline-text">{tx || sc || stUid}</span>
                      {sc ? <span className="map-outline-code">{sc}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      );
    };

    return (
      <div
        className="map-outline"
        role="region"
        aria-label={`Lehrplan-Outline: ${fachName}`}
      >
        <div className="map-outline-row map-outline-row--fach">
          <span className="map-outline-text">{fachName}</span>
          {fachCode ? (
            <span className="map-outline-code" title="Fachbereich-Kürzel (Lehrplan 21)">
              {fachCode}
            </span>
          ) : null}
        </div>

        <div className="map-outline-toolbar" role="search">
          <p className="map-outline-toolbar-stats" aria-live="polite">
            <span className="map-outline-stat">
              Kompetenzbereiche{" "}
              <strong>{filterActive ? statsShown.kbCount : statsFull.kbCount}</strong>
              {!filterActive || statsShown.kbCount === statsFull.kbCount ? null : (
                <span className="map-outline-stat-sub"> / {statsFull.kbCount}</span>
              )}
            </span>
            <span className="map-outline-stat-sep" aria-hidden="true">
              ·
            </span>
            <span className="map-outline-stat">
              Ketten{" "}
              <strong>{filterActive ? statsShown.chainCount : statsFull.chainCount}</strong>
              {!filterActive || statsShown.chainCount === statsFull.chainCount ? null : (
                <span className="map-outline-stat-sub"> / {statsFull.chainCount}</span>
              )}
            </span>
          </p>
          <div className="map-outline-toolbar-actions">
            <input
              type="search"
              className="map-outline-filter-input"
              placeholder="Filtern nach Text oder LP21-Code …"
              aria-label="Outline filtern"
              value={this.state.mapOutlineFilter || ""}
              onChange={this.handleOutlineFilterChange}
            />
            <button
              type="button"
              className="map-outline-tool-btn"
              onClick={this.handleExpandAllOutline}
              disabled={filterActive}
              title={
                filterActive
                  ? "Zum massiven Aufklappen Filter leeren"
                  : "Alle Bereiche und Stufen aufklappen"
              }
            >
              Alle aufklappen
            </button>
            <button
              type="button"
              className="map-outline-tool-btn"
              onClick={this.handleCollapseAllOutline}
              disabled={filterActive}
              title={
                filterActive
                  ? "Zum Zuklappen Filter leeren"
                  : "Alles zuklappen"
              }
            >
              Alle zuklappen
            </button>
            {filterActive ? (
              <button
                type="button"
                className="map-outline-tool-btn map-outline-tool-btn--accent"
                onClick={() => this.setState({ mapOutlineFilter: "" })}
              >
                Filter löschen
              </button>
            ) : null}
          </div>
        </div>

        {filteredOutline.length === 0 && filterActive ? (
          <p className="map-outline-empty" role="status">
            Keine Treffer für „{filterRaw}“. Begriff ändern oder Filter löschen.
          </p>
        ) : null}

        {filteredOutline.map((kb) => {
          const kbCode = kb.kb_code != null ? String(kb.kb_code) : "";
          const expandedKb = Boolean(exp.kb[kbCode]);
          return (
            <div key={kbCode || kb.kb_label} className="map-outline-kb-block">
              <div className="map-outline-row map-outline-row--kb map-outline-indent-1 map-outline-row--with-toggle">
                {this.renderOutlineToggle(
                  expandedKb,
                  () => this.handleToggleOutlineKb(kbCode),
                  `Unterpunkte zu „${kb.kb_label || kbCode}“ ein- oder ausblenden`,
                )}
                <span className="map-outline-text">{kb.kb_label}</span>
                <span
                  className="map-outline-code"
                  title={kbCode ? describeLp21Code(kbCode) : undefined}
                >
                  {kbCode}
                </span>
              </div>
              {expandedKb ? (
                <div className="map-outline-kb-children">
                  {(kb.aspects || []).map((aspect, ai) => {
                    const aspectKey = `${kbCode}__${ai}`;
                    const expandedAspect = Boolean(exp.aspect[aspectKey]);
                    const hasAspectHeader = Boolean(aspect.aspect_code);

                    if (!hasAspectHeader) {
                      return (
                        <div
                          key={aspectKey}
                          className="map-outline-aspect-block map-outline-aspect-block--flat"
                        >
                          {(aspect.chains || []).map((chain) =>
                            renderChainBlock(chain, "map-outline-indent-2"),
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={aspectKey} className="map-outline-aspect-block">
                        <div className="map-outline-row map-outline-row--aspect map-outline-indent-2 map-outline-row--with-toggle">
                          {this.renderOutlineToggle(
                            expandedAspect,
                            () => this.handleToggleOutlineAspect(kbCode, ai),
                            `Ketten zu „${aspect.aspect_label || aspect.aspect_code}“ ein- oder ausblenden`,
                          )}
                          <span className="map-outline-text">{aspect.aspect_label}</span>
                          <span
                            className="map-outline-code"
                            title={describeLp21Code(aspect.aspect_code)}
                          >
                            {aspect.aspect_code}
                          </span>
                        </div>
                        {expandedAspect
                          ? (aspect.chains || []).map((chain) =>
                              renderChainBlock(chain, "map-outline-indent-3"),
                            )
                          : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  renderBreadcrumb = () => {
    const { selectedFach, mapChainView } = this.state;
    const crumbs = [
      <button
        key="root"
        type="button"
        className="curriculum-map-crumb"
        onClick={this.handleBreadcrumbRoot}
      >
        Fächer
      </button>,
    ];
    if (selectedFach) {
      crumbs.push(
        <span key="s1" className="curriculum-map-crumb-sep" aria-hidden="true">
          ›
        </span>,
        <button
          key="fach"
          type="button"
          className="curriculum-map-crumb"
          onClick={this.handleBreadcrumbFach}
        >
          {selectedFach}
        </button>
      );
    }
    if (mapChainView) {
      crumbs.push(
        <span key="s3" className="curriculum-map-crumb-sep" aria-hidden="true">
          ›
        </span>,
        <span key="chain" className="curriculum-map-crumb curriculum-map-crumb--current">
          Aufbau-Kette
        </span>
      );
    }
    return (
      <nav className="curriculum-map-breadcrumb" aria-label="Landkarte Navigation">
        {crumbs}
      </nav>
    );
  };

  renderInner = () => {
    const {
      overview,
      overviewLoading,
      overviewError,
      selectedFach,
      mapChainView,
    } = this.state;
    const { bookmarkUids, getFachColor } = this.props;

    if (overviewLoading) {
      return <p className="curriculum-map-status">Lade Übersicht …</p>;
    }
    if (overviewError) {
      return (
        <p className="curriculum-map-status curriculum-map-status--error" role="alert">
          {overviewError}
        </p>
      );
    }
    if (!overview || !Array.isArray(overview.subjects)) {
      return null;
    }

    if (mapChainView) {
      return (
        <CompetencyChainView
          loading={Boolean(mapChainView.loading)}
          error={mapChainView.error}
          chainData={mapChainView.data}
          highlightAnchorUid={mapChainView.highlightAnchorUid}
          onBack={this.handleMapChainBack}
          onSelectNeighbor={this.handleMapChainSelectNeighbor}
          getZyklusColorByPart={this.props.getZyklusColorByPart}
          getFachColor={getFachColor}
          getCompetencyNetworkUrl={(uid) =>
            this.props.apiUrl(`/api/competency-network/${encodeURIComponent(uid)}`)
          }
          backButtonLabel="← Zurück zur Landkarte"
          backButtonAriaLabel="Zurück zur Landkarte"
          bookmarkUids={bookmarkUids}
          onToggleBookmarkStep={this.handleToggleBookmarkStepFromMapChain}
        />
      );
    }

    const subjects = overview.subjects;
    if (!selectedFach) {
      return this.renderSubjectChips(subjects);
    }

    const fachEntry = subjects.find((s) => s.name === selectedFach);
    if (!fachEntry || !Array.isArray(fachEntry.outline)) {
      return (
        <p className="curriculum-map-status">
          Keine Outline-Daten für dieses Fach. Backend neu starten (Cache), dann erneut laden.
        </p>
      );
    }

    return this.renderFachOutline(fachEntry);
  };

  render() {
    const { isOpen } = this.props;
    if (!isOpen) {
      return null;
    }

    return (
      <div
        className="curriculum-map-backdrop"
        role="presentation"
        onClick={this.handleBackdropClick}
      >
        <div
          id="curriculum-map-root"
          className="curriculum-map-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="curriculum-map-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="curriculum-map-header">
            <div className="curriculum-map-header-text">
              <h2 id="curriculum-map-title">Landkarte Lehrplan 21</h2>
              <p className="curriculum-map-subtitle">
                Fach wählen: Filtern, alle auf- oder zuklappen; Überschrift oder Stufe antippen öffnet den Aufbau.
              </p>
            </div>
            <button
              type="button"
              className="curriculum-map-close"
              onClick={this.props.onClose}
              aria-label="Landkarte schließen"
            >
              ×
            </button>
          </header>

          {this.renderBreadcrumb()}

          <div className="curriculum-map-body">{this.renderInner()}</div>
        </div>
      </div>
    );
  }
}

export default CurriculumMapOverlay;
