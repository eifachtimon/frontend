import React from "react";
import { NavLink } from "react-router-dom";
import { APP_ROUTES } from "../config/appUrls";

const BauhausBrandMark = () => (
  <span className="bh-brand-shapes" aria-hidden="true">
    <span className="bh-shape bh-shape--circle" />
    <span className="bh-shape bh-shape--square" />
    <span className="bh-shape bh-shape--triangle" />
  </span>
);

const AppTopNav = ({
  showMenuButton = false,
  onMenuClick,
  menuExpanded = false,
  isMobile = false,
}) => (
  <nav className="app-top-nav bh-band app-top-nav--shell" aria-label="Kopfzeile">
    <div className="app-top-nav-inner app-top-nav-inner--shell">
      {showMenuButton ? (
        <button
          type="button"
          className="app-top-nav-menu-btn"
          onClick={onMenuClick}
          aria-expanded={menuExpanded}
          aria-controls="app-sidebar"
          aria-label={
            isMobile
              ? menuExpanded
                ? "Menü schliessen"
                : "Menü öffnen"
              : menuExpanded
                ? "Seitenleiste einblenden"
                : "Seitenleiste einklappen"
          }
        >
          {isMobile ? (menuExpanded ? "×" : "☰") : menuExpanded ? "☰" : "☰"}
        </button>
      ) : null}
      <NavLink to={APP_ROUTES.home} className="app-top-nav-brand" end>
        <BauhausBrandMark />
        <span>Lehrplan 21</span>
      </NavLink>
    </div>
  </nav>
);

export default AppTopNav;
