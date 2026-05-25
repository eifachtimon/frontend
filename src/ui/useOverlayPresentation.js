import { useEffect, useState } from "react";
import {
  getOverlayVariant,
  overlayLocksBodyScroll,
  overlayVariantClass,
  rememberOverlayVariant,
} from "./overlayUiPrefs";

const MOBILE_MQ = "(max-width: 768px)";

/**
 * Desktop: schwebendes Panel rechts (Kalender bleibt sichtbar).
 * Mobile: Bottom-Sheet.
 */
const useOverlayPresentation = (open) => {
  const [variant, setVariant] = useState(getOverlayVariant);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const next = getOverlayVariant();
    setVariant(next);
    rememberOverlayVariant(next);

    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => {
      const v = mq.matches ? "sheet" : "float-panel";
      setVariant(v);
      rememberOverlayVariant(v);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    document.body.classList.add("app-overlay-open");
    if (overlayLocksBodyScroll(variant)) {
      document.body.classList.add("cal-modal-open");
    }
    return () => {
      document.body.classList.remove("app-overlay-open", "cal-modal-open");
    };
  }, [open, variant]);

  return overlayVariantClass(variant);
};

export default useOverlayPresentation;
