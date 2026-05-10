import React, { Component } from "react";

const GRAPH_CAP = 16;

const formatZyklusLabel = (zyklus) => {
  const value = String(zyklus || "").trim();
  if (value === "12") {
    return "1 & 2";
  }
  if (value === "23") {
    return "2 & 3";
  }
  return value || "–";
};

const fachAbbrev = (fach) => {
  if (!fach) {
    return "?";
  }
  const parts = String(fach).trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 3).toUpperCase();
  }
  const a = parts[0][0] || "";
  const b = parts[1][0] || "";
  return `${a}${b}`.toUpperCase() || "?";
};

class CompetencyNetworkView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedUid: null,
    };
  }

  componentDidUpdate(prevProps) {
    const prevFocus = prevProps.networkPayload && prevProps.networkPayload.focus;
    const nextFocus = this.props.networkPayload && this.props.networkPayload.focus;
    const prevId = prevFocus && prevFocus.uid;
    const nextId = nextFocus && nextFocus.uid;
    if (nextId !== prevId) {
      this.setState({ selectedUid: null });
    }
  }

  resolveSelectedItem = () => {
    const { networkPayload } = this.props;
    const { selectedUid } = this.state;
    if (!networkPayload || !networkPayload.focus) {
      return null;
    }
    if (!selectedUid || selectedUid === networkPayload.focus.uid) {
      return networkPayload.focus;
    }
    const match = (networkPayload.outgoing || []).find((item) => item && item.uid === selectedUid);
    return match || networkPayload.focus;
  };

  handleSelectNode = (uid) => {
    if (!uid) {
      return;
    }
    const focusUid = this.props.networkPayload && this.props.networkPayload.focus && this.props.networkPayload.focus.uid;
    this.setState({ selectedUid: uid === focusUid ? null : uid });
  };

  handleOpenAsFocus = () => {
    const item = this.resolveSelectedItem();
    const { onOpenCompetency } = this.props;
    if (!item || !item.uid || !onOpenCompetency) {
      return;
    }
    onOpenCompetency(item.uid);
  };

  handlePanelKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    this.handleOpenAsFocus();
  };

  renderSvgGraph = () => {
    const { networkPayload, getFachColor } = this.props;
    if (!networkPayload || !networkPayload.focus) {
      return null;
    }
    const focus = networkPayload.focus;
    const rawOutgoing = networkPayload.outgoing || [];
    const outgoing = rawOutgoing.slice(0, GRAPH_CAP);
    const overflow = rawOutgoing.length - outgoing.length;
    const cx = 140;
    const cy = 140;
    const radius = 105;
    const n = Math.max(outgoing.length, 1);
    const nodes = outgoing.map((item, index) => {
      const angle = (2 * Math.PI * index) / n - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      return { item, x, y };
    });

    const focusColor = getFachColor(focus.fach);

    return (
      <div className="network-graph-wrap">
        <svg
          className="network-graph-svg"
          viewBox="0 0 280 280"
          role="img"
          aria-label="Graph offizieller Querverweise vom Lehrplan"
        >
          <rect width="280" height="280" fill="#0a0a0a" rx="12" />
          {nodes.map(({ item, x, y }) => (
            <line
              key={`edge-${item.uid}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#4a4a4a"
              strokeWidth="1.5"
            />
          ))}
          {nodes.map(({ item, x, y }) => {
            const stroke = getFachColor(item.fach);
            const label = fachAbbrev(item.fach);
            return (
              <g key={item.uid}>
                <circle
                  cx={x}
                  cy={y}
                  r="18"
                  fill="#141414"
                  stroke={stroke}
                  strokeWidth="2.5"
                  className="network-graph-node"
                  tabIndex={0}
                  role="button"
                  aria-label={`Querverweis-Ziel: ${item.fach || ""}, ${item.code || ""}`}
                  onClick={() => this.handleSelectNode(item.uid)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") {
                      return;
                    }
                    e.preventDefault();
                    this.handleSelectNode(item.uid);
                  }}
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill="#e8e8e8"
                  fontSize="9"
                  fontWeight="700"
                  style={{ pointerEvents: "none" }}
                >
                  {label}
                </text>
              </g>
            );
          })}
          <circle
            cx={cx}
            cy={cy}
            r="26"
            fill="#141414"
            stroke={focusColor}
            strokeWidth="3"
            className="network-graph-node network-graph-node--focus"
            tabIndex={0}
            role="button"
            aria-label={`Fokus-Kompetenz: ${focus.code || focus.fach || ""}`}
            onClick={() => this.handleSelectNode(focus.uid)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") {
                return;
              }
              e.preventDefault();
              this.handleSelectNode(focus.uid);
            }}
          />
          <text
            x={cx}
            y={cy + 5}
            textAnchor="middle"
            fill="#f5f5f5"
            fontSize="11"
            fontWeight="700"
            style={{ pointerEvents: "none" }}
          >
            ●
          </text>
        </svg>
        {overflow > 0 ? (
          <p className="network-graph-overflow">
            +{overflow} weitere im Listenbereich unten
          </p>
        ) : null}
      </div>
    );
  };

  render() {
    const {
      loading,
      error,
      networkPayload,
      getZyklusColor,
      getFachColor,
    } = this.props;
    const selected = this.resolveSelectedItem();

    if (loading) {
      return <p className="chain-status">Lade Vernetzung …</p>;
    }

    if (error) {
      return (
        <p className="chain-status chain-status-error" role="alert">
          {error}
        </p>
      );
    }

    if (!networkPayload || !networkPayload.focus) {
      return (
        <p className="chain-status">Keine Vernetzungsdaten.</p>
      );
    }

    const outgoing = networkPayload.outgoing || [];
    const missing = networkPayload.missing_targets || [];
    const parent = networkPayload.parent;
    const focus = networkPayload.focus;
    const listItems = outgoing;

    return (
      <div className="network-view-root">
        {parent ? (
          <div className="network-parent-strip">
            <span className="network-parent-label">Übergeordnet</span>
            {parent.code ? (
              <span className="result-code-text network-parent-code">{parent.code}</span>
            ) : null}
            <span className="network-parent-struktur">{parent.strukturtyp || ""}</span>
            {parent.url ? (
              <a
                className="chain-source-link"
                href={parent.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Auf Lehrplan.ch
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="network-split">
          <div className="network-split-graph">{this.renderSvgGraph()}</div>
          <div className="network-split-detail">
            <h3 className="network-detail-heading">Auswahl</h3>
            {selected ? (
              <>
                <div className="chain-comp-meta chain-full-meta">
                  {selected.code ? <span className="result-code-text">{selected.code}</span> : null}
                  <span
                    className="meta-pill zyklus-pill"
                    style={{ "--zyklus-color": getZyklusColor(selected.zyklus) }}
                  >
                    Zyklus {formatZyklusLabel(selected.zyklus)}
                  </span>
                  {selected.fach ? (
                    <span className="meta-pill fach-pill" style={{ "--fach-color": getFachColor(selected.fach) }}>
                      {selected.fach}
                    </span>
                  ) : null}
                </div>
                <p className="chain-full-item-text network-detail-text">{selected.text}</p>
                {selected.url ? (
                  <a
                    className="chain-source-link chain-full-link"
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Auf Lehrplan.ch öffnen
                  </a>
                ) : null}
                {selected.uid && selected.uid !== focus.uid ? (
                  <button
                    type="button"
                    className="network-open-focus-button"
                    onClick={this.handleOpenAsFocus}
                    onKeyDown={this.handlePanelKeyDown}
                  >
                    Diese Kompetenz als Fokus öffnen
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="network-list-section">
          <h3 className="network-list-heading">Offizielle Querverweise (Liste)</h3>
          {listItems.length === 0 && missing.length === 0 ? (
            <p className="chain-status">
              Keine offiziellen Querverweise zu anderen Kompetenzstufen in diesem Lehrplan-Eintrag.
            </p>
          ) : null}
          {listItems.length > 0 ? (
            <ol className="network-ref-list" aria-label="Ziele von Querverweisen">
              {listItems.map((item, index) => (
                <li key={item.uid || index}>
                  <button
                    type="button"
                    className="network-ref-row"
                    onClick={() => this.handleSelectNode(item.uid)}
                  >
                    <span className="meta-pill fach-pill" style={{ "--fach-color": getFachColor(item.fach) }}>
                      {item.fach || "–"}
                    </span>
                    {item.code ? <span className="result-code-text">{item.code}</span> : null}
                    <span className="network-ref-teaser">
                      {item.text ? `${item.text.slice(0, 120)}${item.text.length > 120 ? "…" : ""}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
          {missing.length > 0 ? (
            <p className="network-missing-hint">
              {missing.length} Verweis(se) konnten in der lokalen Datei nicht aufgelöst werden (fehlende uid).
            </p>
          ) : null}
        </div>
      </div>
    );
  }
}

export default CompetencyNetworkView;
