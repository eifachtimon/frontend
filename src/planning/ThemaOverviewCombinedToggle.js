import React from "react";

/**
 * Ein Toggle mit mehreren Inhalten — layout "row" (Kompetenzen|Ziele) oder "stack" (Todos/Material).
 */
const ThemaOverviewCombinedToggle = ({
  sectionId,
  title,
  meta,
  layout = "stack",
  children,
  bodyClassName = "",
}) => {
  const layoutClass =
    layout === "row" ? "thema-overview-tm-body--duo-row" : "thema-overview-tm-body--duo-stack";
  const bodyClasses = [
    "thema-overview-tm-body",
    layoutClass,
    bodyClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <details
      id={sectionId ? `thema-section-${sectionId}` : undefined}
      className="thema-overview-tm thema-overview-tm--combined"
    >
      <summary className="thema-overview-tm-summary">
        <span className="thema-overview-tm-summary-title">{title}</span>
        {meta ? <span className="thema-overview-tm-summary-meta">{meta}</span> : null}
      </summary>
      <div className={bodyClasses}>{children}</div>
    </details>
  );
};

export default ThemaOverviewCombinedToggle;
