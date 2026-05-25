import React, { useState } from "react";
import { APP_ROUTES, planungEntwurfPath } from "../config/appUrls";
import { getIsoWeek } from "../planning/planningStore";
import { getTodayWeekdayId } from "../planning/planningLevels";
import { WEEKDAYS } from "../planning/planningDefaults";
import SidebarBibliothek from "./SidebarBibliothek";
import SidebarNavLink from "./SidebarNavLink";
import SidebarIcon from "./SidebarIcon";
import SidebarVorhabenTree from "./SidebarVorhabenTree";

const WEEKDAY_LABELS = Object.fromEntries(WEEKDAYS.map((d) => [d.id, d.label]));

const AppSidebar = ({
  collapsed,
  isMobile,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}) => {
  const [toast, setToast] = useState("");
  const { kw } = getIsoWeek();
  const todayWd = getTodayWeekdayId();
  const todayLabel = todayWd ? WEEKDAY_LABELS[todayWd] : null;
  const rail = collapsed && !isMobile;

  const handleDropToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3200);
  };

  const shellClass = [
    "app-sidebar",
    rail ? "app-sidebar--collapsed" : "",
    isMobile ? "app-sidebar--mobile" : "",
    isMobile && mobileOpen ? "app-sidebar--mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {isMobile && mobileOpen ? (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="Navigation schliessen"
          onClick={onCloseMobile}
        />
      ) : null}
      <aside id="app-sidebar" className={shellClass} aria-label="Hauptnavigation und Bibliothek">
        <nav className="app-sidebar-group" aria-label="Orientierung">
          {!rail ? (
            <span className="app-sidebar-group-label">Orientierung</span>
          ) : (
            <span className="app-sidebar-rail-spacer" aria-hidden="true" />
          )}
          <SidebarNavLink
            to={APP_ROUTES.home}
            end
            icon="plan"
            label="Mein Unterricht"
            collapsed={rail}
          />
          <SidebarNavLink
            to={APP_ROUTES.kalender}
            icon="calendar"
            label="Kalender"
            collapsed={rail}
          />
        </nav>

        <nav className="app-sidebar-group" aria-label="Kompetenzen">
          {!rail ? (
            <span className="app-sidebar-group-label">Kompetenzen</span>
          ) : (
            <span className="app-sidebar-rail-spacer app-sidebar-rail-spacer--thin" aria-hidden="true" />
          )}
          <SidebarNavLink
            to={APP_ROUTES.search}
            icon="search"
            label="Suche"
            collapsed={rail}
          />
          <SidebarNavLink
            to={APP_ROUTES.landkarte}
            icon="map"
            label="Landkarte"
            collapsed={rail}
          />
        </nav>

        {rail ? <span className="app-sidebar-rail-divider" aria-hidden="true" /> : null}

        <SidebarVorhabenTree collapsed={rail} onDropToast={handleDropToast} />

        {rail ? <span className="app-sidebar-rail-divider" aria-hidden="true" /> : null}

        <SidebarBibliothek
          collapsed={rail}
          onOpenMobileClose={onCloseMobile}
          onExpandRequest={rail ? onToggleCollapsed : undefined}
        />

        <footer className="app-sidebar-footer">
          <SidebarNavLink
            to={planungEntwurfPath()}
            icon="draft"
            label="Stundenentwurf"
            collapsed={rail}
          />
          {todayLabel && !rail ? (
            <p className="app-sidebar-today" role="status">
              Heute · KW {kw} · {todayLabel}
            </p>
          ) : null}
          {!isMobile ? (
            <button
              type="button"
              className={`app-sidebar-collapse-btn${rail ? " app-sidebar-rail-btn" : " app-sidebar-nav-link"}`}
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Seitenleiste erweitern" : "Seitenleiste einklappen"}
              title={collapsed ? "Erweitern" : "Einklappen"}
            >
              <SidebarIcon name={rail ? "chevron-right" : "chevron-left"} />
              {!rail ? (
                <span className="app-sidebar-nav-text">Einklappen</span>
              ) : null}
            </button>
          ) : null}
        </footer>

        {toast ? (
          <p className="app-sidebar-toast" role="status">
            {toast}
          </p>
        ) : null}
      </aside>
    </>
  );
};

export default AppSidebar;
