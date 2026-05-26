import React, { useState } from "react";
import { APP_ROUTES, planungEntwurfPath } from "../config/appUrls";
import { getIsoWeek } from "../planning/planningStore";
import { getTodayWeekdayId } from "../planning/planningLevels";
import { WEEKDAYS } from "../planning/planningDefaults";
import SidebarBibliothek from "./SidebarBibliothek";
import SidebarNavLink from "./SidebarNavLink";
import SidebarIcon from "./SidebarIcon";
import SidebarResizeHandle from "./SidebarResizeHandle";
import SidebarVorhabenTree from "./SidebarVorhabenTree";

const WEEKDAY_LABELS = Object.fromEntries(WEEKDAYS.map((d) => [d.id, d.label]));

const AppSidebar = ({
  collapsed,
  sidebarWidth,
  isMobile,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
  onSidebarResize,
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

  const sidebarStyle =
    !rail && !isMobile
      ? { width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }
      : undefined;

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
      <aside
        id="app-sidebar"
        className={shellClass}
        style={sidebarStyle}
        aria-label="Hauptnavigation und Bibliothek"
      >
        <div className="app-sidebar-primary">
          <nav className="app-sidebar-group" aria-label="Orientierung">
            {!rail ? (
              <span className="app-sidebar-section-label">Orientierung</span>
            ) : null}
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
              <span className="app-sidebar-section-label">Kompetenzen</span>
            ) : null}
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
        </div>

        {rail ? <span className="app-sidebar-rail-divider" aria-hidden="true" /> : null}

        <div className="app-sidebar-panels">
          <SidebarVorhabenTree collapsed={rail} onDropToast={handleDropToast} />

          {rail ? <span className="app-sidebar-rail-divider" aria-hidden="true" /> : null}

          <SidebarBibliothek
            collapsed={rail}
            onOpenMobileClose={onCloseMobile}
            onExpandRequest={rail ? onToggleCollapsed : undefined}
          />
        </div>

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

        {!rail && !isMobile ? (
          <SidebarResizeHandle
            currentWidth={sidebarWidth}
            onResize={onSidebarResize}
          />
        ) : null}
      </aside>
    </>
  );
};

export default AppSidebar;
