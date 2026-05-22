import React, { Component } from "react";
import AddToVorhabenControl from "./AddToVorhabenControl";
import LessonDraftLink from "./LessonDraftLink";

class SearchResult extends Component {
  state = {
    copied: false,
    expandedNetworkUid: null,
    linkedDetailOverrideByUid: {},
    linkedDetailLoadingUid: null,
  };

  handleOpenUrl = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  handleCopy = async () => {
    const { fach, zyklus, themenbereich, code, text } = this.props;
    const payload = [
      `Fach: ${fach || "-"}`,
      `Zyklus: ${zyklus || "-"}`,
      `Themenbereich: ${themenbereich || "-"}`,
      `Code: ${code || "-"}`,
      `Kompetenz: ${text || "-"}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(payload);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 1500);
    } catch (_error) {
      this.setState({ copied: false });
    }
  };

  formatZyklusLabel = (zyklus) => {
    const value = String(zyklus || "").trim();
    if (value === "12") {
      return "1 & 2";
    }
    if (value === "23") {
      return "2 & 3";
    }
    return value || "-";
  };

  parseZyklusParts = (zyklus) => {
    const rawValue = String(zyklus || "").trim();
    if (!rawValue) {
      return [];
    }
    const matches = rawValue.match(/[1-3]/g);
    if (!matches || matches.length === 0) {
      return [];
    }
    return Array.from(new Set(matches));
  };

  handleCardActivate = (event) => {
    const { competencyUid, prefetchedChain, metadata, onOpenCompetencyChain } = this.props;
    if (!onOpenCompetencyChain) {
      return;
    }
    const chain = prefetchedChain || (metadata && metadata._competency_chain);
    const chainDocKey =
      chain?.current?.doc_key != null && String(chain.current.doc_key).trim()
        ? String(chain.current.doc_key).trim()
        : "";
    const chainUid =
      chain?.current?.uid != null && String(chain.current.uid).trim()
        ? String(chain.current.uid).trim()
        : "";
    const docUid =
      competencyUid != null && String(competencyUid).trim()
        ? String(competencyUid).trim()
        : "";
    const lp21FromMeta =
      metadata?.lp21_row_index != null &&
      String(metadata.lp21_row_index).trim() !== ""
        ? `lp21:${String(metadata.lp21_row_index).trim()}`
        : "";
    const uid = chainDocKey || chainUid || docUid || lp21FromMeta || null;
    if (!chain?.current && !uid) {
      return;
    }
    onOpenCompetencyChain(uid, chain);
  };

  handleCardKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    this.handleCardActivate(event);
  };

  handleBookmarkClick = (event) => {
    event.stopPropagation();
    const { bookmarkUid, onToggleBookmark } = this.props;
    if (!bookmarkUid || !onToggleBookmark) {
      return;
    }
    onToggleBookmark();
  };

  handleBookmarkKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    this.handleBookmarkClick(event);
  };

  resolveNetworkLinks = () => {
    const { prefetchedChain, metadata } = this.props;
    const chainData = prefetchedChain || metadata?._competency_chain;
    const raw = chainData?.current?.network_links;
    return Array.isArray(raw) ? raw : [];
  };

  resolveExpandedLink = () => {
    const { expandedNetworkUid, linkedDetailOverrideByUid } = this.state;
    if (!expandedNetworkUid) {
      return null;
    }
    const links = this.resolveNetworkLinks();
    const base = links.find((l) => l && l.uid === expandedNetworkUid);
    if (!base) {
      return null;
    }
    const extra = linkedDetailOverrideByUid[expandedNetworkUid];
    return extra ? { ...base, ...extra } : base;
  };

  fetchLinkedDetailIfNeeded = (link) => {
    const { getCompetencyChainUrl } = this.props;
    const uid = link && link.uid;
    if (!uid || link.text || !getCompetencyChainUrl) {
      return;
    }
    this.setState({ linkedDetailLoadingUid: uid });
    fetch(getCompetencyChainUrl(uid))
      .then((response) => {
        if (!response.ok) {
          throw new Error("skip");
        }
        return response.json();
      })
      .then((data) => {
        const cur = data && data.current;
        if (!cur) {
          this.setState({ linkedDetailLoadingUid: null });
          return;
        }
        this.setState((prev) => ({
          linkedDetailLoadingUid: null,
          linkedDetailOverrideByUid: {
            ...prev.linkedDetailOverrideByUid,
            [uid]: {
              code: cur.code,
              text: cur.text,
              fach: cur.fach,
            },
          },
        }));
      })
      .catch(() => {
        this.setState({ linkedDetailLoadingUid: null });
      });
  };

  handleLinkedCompetencyToggle = (event, link) => {
    event.stopPropagation();
    const uid = link && link.uid;
    if (!uid) {
      return;
    }
    const closing = this.state.expandedNetworkUid === uid;
    const nextExpanded = closing ? null : uid;
    this.setState(
      { expandedNetworkUid: nextExpanded, linkedDetailLoadingUid: null },
      () => {
        if (nextExpanded === uid && !link.text) {
          this.fetchLinkedDetailIfNeeded(link);
        }
      }
    );
  };

  handleLinkedCompetencyKeyDown = (event, link) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.handleLinkedCompetencyToggle(event, link);
  };

  formatNetworkLinkLabel = (lnk) => {
    const parts = [lnk.code, lnk.fach].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : lnk.uid || "Verknüpfung";
  };

  /** Mehrere Kompetenztexte (Backend: \\n\\n) für Darstellung mit Trennstrich. */
  splitMergedDocumentSegments = (raw) => {
    if (raw == null || raw === "") {
      return [];
    }
    return String(raw)
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  renderHighlightedText = (text, queryText) => {
    if (!text) {
      return "";
    }
    const terms = String(queryText || "")
      .toLowerCase()
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 4);

    if (terms.length === 0) {
      return text;
    }

    const uniqueTerms = Array.from(new Set(terms))
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = new RegExp(`(${uniqueTerms.join("|")})`, "gi");
    const parts = text.split(pattern);

    return parts.map((part, index) => {
      const isMatch = uniqueTerms.some((term) => new RegExp(`^${term}$`, "i").test(part));
      if (!isMatch) {
        return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
      }
      return (
        <mark key={`mark-${index}`} className="text-highlight">
          {part}
        </mark>
      );
    });
  };

  render() {
    const {
      zyklus,
      code,
      text,
      url,
      queryText,
      competencyUid,
      prefetchedChain,
      metadata,
      onOpenCompetencyChain,
      bookmarkUid,
      isBookmarked,
      onToggleBookmark,
      lessonDraftUid,
      lessonDraftCode,
      lessonDraftFach,
      lessonDraftText,
      competencyEntry,
      onAddedToVorhaben,
    } = this.props;
    const { copied, expandedNetworkUid, linkedDetailLoadingUid } = this.state;
    const chainData = prefetchedChain || metadata?._competency_chain;
    const canOpenChain = Boolean(
      onOpenCompetencyChain && (chainData?.current || competencyUid)
    );
    const zyklusParts = this.parseZyklusParts(zyklus);
    const borderColors = zyklusParts.map((part) => this.props.getZyklusColorByPart(part)).filter(Boolean);
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
    const cardStyle = markerGradient
      ? {
          "--zyklus-marker": markerGradient,
        }
      : undefined;

    const networkLinks = this.resolveNetworkLinks();
    const expandedLink = this.resolveExpandedLink();
    const showBookmark =
      Boolean(bookmarkUid) && typeof onToggleBookmark === "function";
    const showVorhabenAction = Boolean(competencyEntry);
    const actionsLayoutClass =
      showBookmark && showVorhabenAction
        ? "result-actions--full"
        : showBookmark
          ? "result-actions--bookmark-layout"
          : "";
    const textSegments = this.splitMergedDocumentSegments(text);

    return (
      <article className="result-card" style={cardStyle}>
        <div className="result-card-layout">
          <div
            className={`result-card-left ${canOpenChain ? "result-card-left-interactive" : ""}`}
            role={canOpenChain ? "button" : undefined}
            tabIndex={canOpenChain ? 0 : undefined}
            onClick={canOpenChain ? this.handleCardActivate : undefined}
            onKeyDown={canOpenChain ? this.handleCardKeyDown : undefined}
            aria-label={
              canOpenChain
                ? "Kompetenz im Aufbau-Kontext anzeigen"
                : undefined
            }
          >
            {(code || expandedLink || networkLinks.length > 0) && (
              <div className="result-code-peer-row">
                <div className="result-code-peer-left">
                  {(code || expandedLink) && (
                    <>
                      {code ? (
                        <span className="result-code-text">{code}</span>
                      ) : null}
                      {expandedLink ? (
                        <span className="result-linked-peer-wrap">
                          {code ? (
                            <span
                              className="result-code-peer-sep"
                              aria-hidden="true"
                            >
                              ·
                            </span>
                          ) : null}
                          {linkedDetailLoadingUid === expandedLink.uid &&
                          !expandedLink.text ? (
                            <span className="result-linked-peer-loading">
                              lädt …
                            </span>
                          ) : (
                            <>
                              {expandedLink.code ? (
                                <span className="result-linked-peer-code">
                                  {expandedLink.code}
                                </span>
                              ) : null}
                              {expandedLink.text ? (
                                <span className="result-linked-peer-text">
                                  {expandedLink.text}
                                </span>
                              ) : null}
                            </>
                          )}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>
                {networkLinks.length > 0 ? (
                  <ul
                    className="result-network-links-inline"
                    aria-label="Offizielle Querverweise zu anderen Kompetenzstufen"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {networkLinks.map((lnk) => {
                      const active = expandedNetworkUid === lnk.uid;
                      return (
                        <li key={lnk.uid}>
                          <button
                            type="button"
                            className={`result-network-link-ref ${active ? "result-network-link-ref--active" : ""}`}
                            onClick={(e) =>
                              this.handleLinkedCompetencyToggle(e, lnk)
                            }
                            onKeyDown={(e) =>
                              this.handleLinkedCompetencyKeyDown(e, lnk)
                            }
                            aria-expanded={active}
                            aria-label={`Verknüpfte Kompetenz: ${this.formatNetworkLinkLabel(lnk)}`}
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
                            <span className="result-network-link-label">
                              {this.formatNetworkLinkLabel(lnk)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            )}
            {textSegments.length <= 1 ? (
              <p className="result-text">
                {this.renderHighlightedText(textSegments[0] || text || "", queryText)}
              </p>
            ) : (
              <div className="result-text-merge-stack">
                {textSegments.map((seg, si) => (
                  <React.Fragment key={`result-text-seg-${si}`}>
                    {si > 0 ? (
                      <hr className="result-text-merge-sep" aria-hidden="true" />
                    ) : null}
                    <p className="result-text result-text--merge-block">
                      {this.renderHighlightedText(seg, queryText)}
                    </p>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
          <div
            className={`result-actions ${actionsLayoutClass}`.trim()}
          >
            <button
              className="copy-button"
              onClick={this.handleCopy}
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
                onClick={this.handleBookmarkClick}
                onKeyDown={this.handleBookmarkKeyDown}
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
            {competencyEntry ? (
              <AddToVorhabenControl
                entry={competencyEntry}
                className="result-add-vorhaben"
                onAdded={onAddedToVorhaben}
              />
            ) : null}
            {url ? (
              <button
                type="button"
                className="source-button"
                onClick={() => this.handleOpenUrl(url)}
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
            {lessonDraftUid ? (
              <LessonDraftLink
                uid={lessonDraftUid}
                code={lessonDraftCode}
                fach={lessonDraftFach}
                text={lessonDraftText}
                className="lesson-draft-link result-lesson-draft-link"
              />
            ) : null}
          </div>
        </div>
      </article>
    );
  }
}

export default SearchResult;