const VARIANT_KEY = "lp21-overlay-variant";
const MOBILE_MQ = "(max-width: 768px)";

const normalizeVariant = (raw) => {
  if (raw === "sheet") {
    return "sheet";
  }
  if (raw === "float-panel" || raw === "popover" || raw === "panel") {
    return "float-panel";
  }
  return null;
};

const readStoredVariant = () => {
  try {
    return normalizeVariant(localStorage.getItem(VARIANT_KEY));
  } catch {
    return null;
  }
};

const isMobileViewport = () => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(MOBILE_MQ).matches;
};

/** sheet = Bottom-Sheet (mobil), float-panel = schwebend rechts (Desktop, Apple-Kalender-Stil). */
export const getOverlayVariant = () => {
  const stored = readStoredVariant();
  if (stored) {
    return stored;
  }
  return isMobileViewport() ? "sheet" : "float-panel";
};

export const rememberOverlayVariant = (variant) => {
  const normalized = normalizeVariant(variant);
  if (!normalized) {
    return;
  }
  try {
    localStorage.setItem(VARIANT_KEY, normalized);
  } catch {
    // ignore
  }
};

export const overlayVariantClass = (variant) => {
  if (variant === "sheet") {
    return "app-overlay--sheet";
  }
  return "app-overlay--float-panel";
};

export const overlayLocksBodyScroll = (variant) => variant === "sheet";
