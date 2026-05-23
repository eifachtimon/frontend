import React from "react";
import { NavLink } from "react-router-dom";
import SidebarIcon from "./SidebarIcon";

const navLinkClass = ({ isActive }) =>
  `app-sidebar-nav-link${isActive ? " app-sidebar-nav-link--active" : ""}`;

/**
 * @param {string} to
 * @param {keyof import("./SidebarIcon").default} icon
 * @param {string} label
 * @param {boolean} collapsed
 * @param {boolean} [end]
 */
const SidebarNavLink = ({ to, icon, label, collapsed, end = false }) => (
  <NavLink
    to={to}
    end={end}
    className={navLinkClass}
    title={label}
    aria-label={collapsed ? label : undefined}
  >
    <SidebarIcon name={icon} />
    {!collapsed ? <span className="app-sidebar-nav-text">{label}</span> : null}
  </NavLink>
);

export default SidebarNavLink;
