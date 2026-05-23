import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppTopNav from "../components/AppTopNav";
import AppSidebar from "./AppSidebar";
import useSidebarLayout from "./useSidebarLayout";
import "./app-shell.css";

const AppShellLayout = ({ children }) => {
  const location = useLocation();
  const {
    collapsed,
    mobileOpen,
    isMobile,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
  } = useSidebarLayout();

  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  const mainClass = [
    "app-shell-main",
    collapsed && !isMobile ? "app-shell-main--sidebar-collapsed" : "",
    isMobile ? "app-shell-main--mobile" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="app-shell-layout">
      <AppTopNav
        onMenuClick={isMobile ? toggleMobile : toggleCollapsed}
        menuExpanded={isMobile ? mobileOpen : !collapsed}
        showMenuButton
        isMobile={isMobile}
      />
      <div className="app-shell-body">
        <AppSidebar
          collapsed={collapsed}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          onToggleCollapsed={toggleCollapsed}
          onCloseMobile={closeMobile}
        />
        <main
          id="app-main-content"
          className={mainClass}
          key={location.pathname}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShellLayout;
