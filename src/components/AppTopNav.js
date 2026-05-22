import React from "react";
import { NavLink } from "react-router-dom";
import { APP_ROUTES } from "../config/appUrls";

const navItems = [
  { to: APP_ROUTES.search, label: "Suche", end: true },
  { to: APP_ROUTES.planung, label: "Mein Unterricht", end: false },
];

const BauhausBrandMark = () => (
  <span className="bh-brand-shapes" aria-hidden="true">
    <span className="bh-shape bh-shape--circle" />
    <span className="bh-shape bh-shape--square" />
    <span className="bh-shape bh-shape--triangle" />
  </span>
);

const AppTopNav = () => (
  <nav className="app-top-nav bh-band" aria-label="Hauptnavigation">
    <div className="app-top-nav-inner">
      <NavLink to={APP_ROUTES.search} className="app-top-nav-brand" end>
        <BauhausBrandMark />
        Lehrplan 21
      </NavLink>
      <ul className="app-top-nav-list">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `app-top-nav-link${isActive ? " app-top-nav-link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  </nav>
);

export default AppTopNav;
