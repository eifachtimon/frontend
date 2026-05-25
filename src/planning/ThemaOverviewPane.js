import React from "react";

/** Unterabschnitt innerhalb eines kombinierten Toggles (Sprungmarke + optional Titel). */
const ThemaOverviewPane = ({ sectionId, title, children, className = "" }) => {
  const classes = ["thema-overview-tm-pane", className].filter(Boolean).join(" ");

  return (
    <section
      id={sectionId ? `thema-section-${sectionId}` : undefined}
      className={classes}
      aria-labelledby={title && sectionId ? `thema-pane-${sectionId}` : undefined}
    >
      {title ? (
        <h3 id={sectionId ? `thema-pane-${sectionId}` : undefined} className="thema-overview-tm-pane-title">
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  );
};

export default ThemaOverviewPane;
