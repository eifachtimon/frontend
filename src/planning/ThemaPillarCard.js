import React from "react";

const ThemaPillarCard = ({
  title,
  metric,
  caption,
  hint,
  accent,
  kicker,
  onOpen,
  variant = "default",
}) => {
  const isFeatured = variant === "featured";

  return (
    <button
      type="button"
      className={`thema-pillar-card${isFeatured ? " thema-pillar-card--featured" : ""}${accent ? ` thema-pillar-card--${accent}` : ""}`}
      onClick={onOpen}
      aria-haspopup="dialog"
    >
      {kicker ? <span className="thema-pillar-card-kicker">{kicker}</span> : null}
      <span className="thema-pillar-card-title">{title}</span>
      {metric != null && metric !== "" ? (
        <span className="thema-pillar-card-metric">{metric}</span>
      ) : null}
      {caption ? (
        <span className={`thema-pillar-card-caption${isFeatured ? " thema-pillar-card-caption--featured" : ""}`}>
          {caption}
        </span>
      ) : null}
      {hint ? <span className="thema-pillar-card-hint">{hint}</span> : null}
      {isFeatured ? (
        <span className="thema-pillar-card-cta" aria-hidden="true">
          Öffnen →
        </span>
      ) : null}
    </button>
  );
};

export default ThemaPillarCard;
