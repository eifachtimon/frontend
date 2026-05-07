import React, { Component } from "react";

class SearchResult extends Component {
  state = {
    copied: false,
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

  render() {
    const { fach, zyklus, themenbereich, code, text, url } = this.props;
    const { copied } = this.state;

    return (
      <article className="result-card">
        <div className="result-card-top">
          <div className="result-meta">
            <span className="meta-pill">{fach || "Unbekanntes Fach"}</span>
            <span className="meta-pill">Zyklus {zyklus || "-"}</span>
            {code && <span className="meta-pill code">{code}</span>}
          </div>
          <button
            className="copy-button"
            onClick={this.handleCopy}
            aria-label="Kompetenz in Zwischenablage kopieren"
          >
            {copied ? "Kopiert" : "Kopieren"}
          </button>
        </div>

        {themenbereich && (
          <p className="result-topic">
            <strong>Themenbereich:</strong> {themenbereich}
          </p>
        )}

        <p className="result-text">{text}</p>

        {url && (
          <button
            className="source-button"
            onClick={() => this.handleOpenUrl(url)}
            aria-label="Quelle in neuem Tab öffnen"
          >
            Quelle öffnen
          </button>
        )}
      </article>
    );
  }
}

export default SearchResult;