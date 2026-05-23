import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "lp21-sidebar-collapsed";
const MOBILE_BREAK = 1024;

export const useSidebarLayout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch (_e) {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAK
  );

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAK;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch (_e) {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    document.body.classList.add("app-has-sidebar");
    return () => document.body.classList.remove("app-has-sidebar");
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((o) => !o);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return {
    collapsed,
    mobileOpen,
    isMobile,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
  };
};

export default useSidebarLayout;
