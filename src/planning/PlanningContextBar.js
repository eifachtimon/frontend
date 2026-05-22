import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  APP_ROUTES,
  jahresplanPath,
  monatsplanPath,
  vorhabenLevelPath,
} from "../config/appUrls";
import { getSchoolYearStart } from "./calendarUtils";
import usePlanningStore from "./usePlanningStore";
import { getActiveVorhaben } from "./planningHubUtils";

/**
 * @param {"hub"|"jahr"|"monat"|"woche"|"vorhaben"} activeSection
 * @param {string} [vorhabenId]
 */
const PlanningContextBar = ({ activeSection = "hub", vorhabenId }) => {
  const { store } = usePlanningStore();
  const location = useLocation();
  const startYear = getSchoolYearStart();
  const now = new Date();
  const active = vorhabenId
    ? store.vorhaben.find((v) => v.id === vorhabenId)
    : getActiveVorhaben(store);

  const sectionClass = (id) =>
    `planning-context-link${activeSection === id ? " planning-context-link--active" : ""}`;

  return (
    <nav className="planning-context-bar" aria-label="Mein Unterricht">
      <div className="planning-context-primary">
        <NavLink
          to={APP_ROUTES.planung}
          end
          className={({ isActive }) =>
            `planning-context-home${isActive && location.pathname === APP_ROUTES.planung ? " planning-context-home--active" : ""}`
          }
        >
          Mein Unterricht
        </NavLink>
        {active ? (
          <Link
            to={vorhabenLevelPath(
              active.id,
              active.lastVisitedLevel || "grob"
            )}
            className={`planning-context-vorhaben${activeSection === "vorhaben" ? " planning-context-vorhaben--current" : ""}`}
            title={active.title}
          >
            <span className="planning-context-vorhaben-label">Aktiv:</span>
            <span className="planning-context-vorhaben-title">{active.title}</span>
          </Link>
        ) : (
          <span className="planning-context-vorhaben planning-context-vorhaben--empty">
            Kein aktives Vorhaben
          </span>
        )}
      </div>
      <div className="planning-context-views" role="group" aria-label="Zeitliche Ansichten">
        <Link to={jahresplanPath(startYear)} className={sectionClass("jahr")}>
          Jahr
        </Link>
        <Link
          to={monatsplanPath(now.getFullYear(), now.getMonth() + 1)}
          className={sectionClass("monat")}
        >
          Monat
        </Link>
        <Link to={APP_ROUTES.kalender} className={sectionClass("woche")}>
          Woche
        </Link>
      </div>
    </nav>
  );
};

export default PlanningContextBar;
