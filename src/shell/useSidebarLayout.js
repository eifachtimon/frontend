import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "lp21-sidebar-collapsed";
const STORAGE_WIDTH_KEY = "lp21-sidebar-width";
const MOBILE_BREAK = 1024;
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 420;

const readStoredWidth = () => {
  try {
    const stored = Number.parseInt(window.localStorage.getItem(STORAGE_WIDTH_KEY), 10);
    if (Number.isFinite(stored) && stored >= MIN_WIDTH && stored <= MAX_WIDTH) {
      return stored;
    }
  } catch (_e) {
    // ignore
  }
  return DEFAULT_WIDTH;
};

export const useSidebarLayout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch (_e) {
      return false;
    }
  });
  const [sidebarWidth, setSidebarWidth] = useState(readStoredWidth);
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
    try {
      window.localStorage.setItem(STORAGE_WIDTH_KEY, String(sidebarWidth));
    } catch (_e) {
      // ignore
    }
  }, [sidebarWidth]);

  useEffect(() => {
    document.body.classList.add("app-has-sidebar");
    return () => document.body.classList.remove("app-has-sidebar");
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-expanded-width",
      `${sidebarWidth}px`
    );
  }, [sidebarWidth]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((o) => !o);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const handleSidebarResize = useCallback((nextWidth) => {
    const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(nextWidth)));
    setSidebarWidth(clamped);
  }, []);

  return {
    collapsed,
    sidebarWidth,
    mobileOpen,
    isMobile,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
    handleSidebarResize,
    sidebarMinWidth: MIN_WIDTH,
    sidebarMaxWidth: MAX_WIDTH,
  };
};

export default useSidebarLayout;
