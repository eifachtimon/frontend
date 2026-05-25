import React from "react";

const ThemaMaterialTodosPillarCard = ({
  openTodos,
  openTodoPreview,
  openTodoExtra,
  materialCount,
  materialPreview,
  accent,
  onOpen,
}) => {
  const muted = openTodos === 0 && materialCount === 0;

  return (
    <button
      type="button"
      className={`thema-pillar-card thema-pillar-card--featured thema-pillar-card--dual${muted ? " thema-pillar-card--muted" : ""}${accent === "warn" ? " thema-pillar-card--warn" : ""}`}
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label="Todos und Material öffnen"
    >
      <div className="thema-pillar-dual">
        <div className="thema-pillar-dual-section thema-pillar-dual-section--todos">
          <span className="thema-pillar-dual-label">Todos</span>
          <span className="thema-pillar-dual-metric">{openTodos}</span>
          <span className="thema-pillar-dual-caption">
            {openTodoPreview ||
              (openTodos > 0 ? `${openTodos} offen` : "Keine offenen Todos")}
          </span>
          {openTodoExtra ? (
            <span className="thema-pillar-dual-hint">{openTodoExtra}</span>
          ) : null}
        </div>
        <div className="thema-pillar-dual-divider" aria-hidden="true" />
        <div className="thema-pillar-dual-section thema-pillar-dual-section--material">
          <span className="thema-pillar-dual-label">Material</span>
          <span className="thema-pillar-dual-metric">{materialCount}</span>
          <span className="thema-pillar-dual-caption">
            {materialPreview ||
              (materialCount > 0 ? `${materialCount} Einträge` : "Material notieren")}
          </span>
        </div>
      </div>
      <span className="thema-pillar-card-cta" aria-hidden="true">
        Öffnen →
      </span>
    </button>
  );
};

export default ThemaMaterialTodosPillarCard;
