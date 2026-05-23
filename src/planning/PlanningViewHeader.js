import React from "react";

/**
 * Einheitlicher Seitenkopf für Hub, Jahr, Monat, Kalender, Entwurf.
 *
 * @param {string} title
 * @param {string} [lead]
 * @param {React.ReactNode} [nav] — z. B. Monats-/Jahresnavigation
 * @param {React.ReactNode} [actions] — Toolbar-Buttons rechts
 * @param {React.ReactNode} [children] — Zusatz unter Titel (z. B. Hinweise)
 * @param {"default"|"yellow"|"blue"} [band] — optionaler Farbstreifen
 * @param {boolean} [compact] — weniger Padding, kleinere Lead-Zeile
 */
const PlanningViewHeader = ({
  title,
  lead,
  nav = null,
  actions = null,
  children = null,
  band = "default",
  compact = false,
}) => (
  <header
    className={`planning-view-header planning-view-header--${band} ${
      compact ? "planning-view-header--compact" : ""
    }`}
  >
    <div className="planning-view-header__main">
      <h1 className="planning-view-header__title">{title}</h1>
      {lead ? <p className="planning-view-header__lead">{lead}</p> : null}
    </div>
    {nav ? <div className="planning-view-header__nav">{nav}</div> : null}
    {actions ? (
      <div className="planning-view-header__actions">{actions}</div>
    ) : null}
    {children ? (
      <div className="planning-view-header__extra">{children}</div>
    ) : null}
  </header>
);

export default PlanningViewHeader;
