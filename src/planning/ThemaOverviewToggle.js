import React from "react";

/**
 * Einheitlicher Aufklapp-Block für die Themen-Übersicht (gleicher Rand, Summary, Body).
 */
const ThemaOverviewToggle = ({ sectionId, title, meta, children, bodyClassName = "" }) => {
  const bodyClasses = ["thema-overview-tm-body", "thema-overview-tm-body--single", bodyClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <details
      id={sectionId ? `thema-section-${sectionId}` : undefined}
      className="thema-overview-tm"
    >
      <summary className="thema-overview-tm-summary">
        <span className="thema-overview-tm-summary-title">{title}</span>
        {meta ? <span className="thema-overview-tm-summary-meta">{meta}</span> : null}
      </summary>
      <div className={bodyClasses}>{children}</div>
    </details>
  );
};

export default ThemaOverviewToggle;
