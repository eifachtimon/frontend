import React from "react";
import usePlanningStore from "./usePlanningStore";
import { getPlanningTimeContext } from "./planningLocationUtils";

const BreadcrumbSep = () => (
  <span className="planning-location-sep" aria-hidden="true">
    /
  </span>
);

const BreadcrumbItem = ({ children, current }) => (
  <li
    className={`planning-location-item${current ? " planning-location-item--current" : ""}`}
    {...(current ? { "aria-current": "page" } : {})}
  >
    {children}
  </li>
);

/**
 * Schmaler Kontext-Pfad nur in der Vorhaben-Ansicht (KW/Heute/Ebene).
 * Navigation (Mein Unterricht, Jahr, Monat, Kalender) → Sidebar.
 *
 * @param {"vorhaben"} context
 * @param {string} vorhabenId
 * @param {string} levelId grob | zwei-wochen | woche | lektion
 */
const PlanningLocationBar = ({ context, vorhabenId, levelId, variant = "default" }) => {
  const { store } = usePlanningStore();

  if (context !== "vorhaben" || !vorhabenId || !levelId) {
    return null;
  }

  if (levelId !== "woche" && levelId !== "uebersicht") {
    return null;
  }

  const active = store.vorhaben.find((v) => v.id === vorhabenId);
  if (!active) {
    return null;
  }

  const { kw, todayLabel } = getPlanningTimeContext();

  if (variant === "toolbar") {
    return (
      <div className="thema-toolbar-time" aria-label="Kalenderwoche">
        <span className="thema-toolbar-kw">KW {kw}</span>
        {todayLabel ? (
          <span className="thema-toolbar-today">{todayLabel}</span>
        ) : null}
      </div>
    );
  }

  return (
    <nav className="planning-location-bar planning-location-bar--slim" aria-label="Kontext">
      <ol className="planning-location-trail">
        <BreadcrumbItem>
          <span className="planning-location-vorhaben-name" title={active.title}>
            {active.title}
          </span>
        </BreadcrumbItem>
        <BreadcrumbSep />
        <BreadcrumbItem current={!todayLabel}>
          <span>KW {kw}</span>
        </BreadcrumbItem>
        {todayLabel ? (
          <>
            <BreadcrumbSep />
            <BreadcrumbItem current>
              <span>{todayLabel}</span>
            </BreadcrumbItem>
          </>
        ) : null}
      </ol>
    </nav>
  );
};

export default PlanningLocationBar;
