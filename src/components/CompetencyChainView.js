import React, { Component } from "react";

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

class CompetencyChainView extends Component {
  handleBackClick = () => {
    const { onBack } = this.props;
    if (onBack) {
      onBack();
    }
  };

  handleNeighborActivate = (uid) => {
    const { onSelectNeighbor } = this.props;
    if (uid && onSelectNeighbor) {
      onSelectNeighbor(uid);
    }
  };

  handleNeighborCardKeyDown = (event, uid) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    this.handleNeighborActivate(uid);
  };

  renderCard = (item, variant) => {
    const { getZyklusColor, getFachColor } = this.props;
    if (!item) {
      const label =
        variant === "prev"
          ? "Anfang der Aufbau-Kette"
          : "Ende der Aufbau-Kette";
      return (
        <div className={`chain-card chain-card-empty chain-card-${variant}`}>
          <p className="chain-card-placeholder">{label}</p>
        </div>
      );
    }

    const zyklusColor = getZyklusColor(item.zyklus);
    const fachColor = getFachColor(item.fach);
    const isNeighbor = variant === "prev" || variant === "next";
    const neighborUid = item.uid;

    const cardStyle = {
      "--chain-zyklus": zyklusColor,
      "--chain-fach": fachColor,
    };

    const body = (
      <>
        <div className="chain-card-meta">
          {item.code ? <span className="chain-code">{item.code}</span> : null}
          <span className="chain-zyklus-pill" style={{ borderColor: zyklusColor, color: zyklusColor }}>
            Zyklus {formatZyklusLabel(item.zyklus)}
          </span>
        </div>
        {item.fach ? <p className="chain-fach-name">{item.fach}</p> : null}
        <p className="chain-text">{item.text}</p>
        {item.url ? (
          <a
            className="chain-source-link"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Auf Lehrplan.ch öffnen
          </a>
        ) : null}
      </>
    );

    if (isNeighbor && neighborUid) {
      return (
        <div
          className={`chain-card chain-card-${variant} chain-card-interactive`}
          role="button"
          tabIndex={0}
          style={cardStyle}
          onClick={() => this.handleNeighborActivate(neighborUid)}
          onKeyDown={(e) => this.handleNeighborCardKeyDown(e, neighborUid)}
          aria-label={`Diese Stufe im Aufbau öffnen: ${item.code || item.text?.slice(0, 80) || ""}`}
        >
          {body}
        </div>
      );
    }

    return (
      <div
        className={`chain-card chain-card-${variant} chain-card-highlight`}
        style={cardStyle}
      >
        {body}
      </div>
    );
  };

  render() {
    const { loading, error, chainData } = this.props;

    return (
      <section className="competency-chain-panel" aria-labelledby="chain-panel-title">
        <div className="chain-toolbar">
          <button
            type="button"
            className="chain-back-button"
            onClick={this.handleBackClick}
            aria-label="Zurück zur Suchergebnisliste"
          >
            ← Zurück zur Suche
          </button>
          <h2 id="chain-panel-title" className="chain-panel-title">
            Aufbau-Kontext
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
          <div className="chain-columns">
            <div className="chain-column">
              <h3 className="chain-column-title">Vorherige Stufe</h3>
              {this.renderCard(chainData.previous, "prev")}
            </div>
            <div className="chain-column chain-column-center">
              <h3 className="chain-column-title">Ausgewählt</h3>
              {this.renderCard(chainData.current, "current")}
            </div>
            <div className="chain-column">
              <h3 className="chain-column-title">Nächste Stufe</h3>
              {this.renderCard(chainData.next, "next")}
            </div>
          </div>
        ) : null}
      </section>
    );
  }
}

export default CompetencyChainView;
