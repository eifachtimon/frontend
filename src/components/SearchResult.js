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
    const { zyklus, code, text, url, queryText } = this.props;
    const { copied } = this.state;
    const zyklusParts = this.parseZyklusParts(zyklus);
    const borderColors = zyklusParts.map((part) => this.props.getZyklusColorByPart(part)).filter(Boolean);
    const uniqueBorderColors = Array.from(new Set(borderColors));
    const borderGradient = (() => {
      if (uniqueBorderColors.length === 0) {
        return null;
      }
      if (uniqueBorderColors.length === 1) {
        return `linear-gradient(to right, ${uniqueBorderColors[0]} 0 100%)`;
      }
      if (uniqueBorderColors.length === 2) {
        return `linear-gradient(to right, ${uniqueBorderColors[0]} 0 50%, ${uniqueBorderColors[1]} 50% 100%)`;
      }
      return `linear-gradient(to right, ${uniqueBorderColors[0]} 0 33.33%, ${uniqueBorderColors[1]} 33.33% 66.66%, ${uniqueBorderColors[2]} 66.66% 100%)`;
    })();
    const cardStyle = borderGradient
      ? {
          backgroundImage: `linear-gradient(#0f0f0f, #0f0f0f), ${borderGradient}`,
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
          border: "2px solid transparent",
        }
      : undefined;

    return (
      <article className="result-card" style={cardStyle}>
        <div className="result-card-top">
          {code && <span className="result-code-text">{code}</span>}
          <div className="result-actions">
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
            {url && (
              <button
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
            )}
          </div>
        </div>

        <p className="result-text">{this.renderHighlightedText(text, queryText)}</p>
      </article>
    );
  }
}

export default SearchResult;