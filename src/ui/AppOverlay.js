import React, { useEffect, useId } from "react";
import useOverlayPresentation from "./useOverlayPresentation";

/**
 * Einheitliches Overlay: Desktop = schwebendes Panel rechts, Mobile = Sheet.
 */
const AppOverlay = ({
  open,
  onClose,
  title,
  children,
  footer = null,
  size = "md",
  className = "",
  labelledBy,
  showBeak = true,
}) => {
  const autoId = useId();
  const titleId = labelledBy || autoId;
  const variantClass = useOverlayPresentation(open);
  const isSheet = variantClass.includes("sheet");
  const isFloat = variantClass.includes("float-panel");

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={`app-overlay ${variantClass}`}
      role="presentation"
      onClick={onClose}
      data-overlay-variant={isFloat ? "float-panel" : "sheet"}
    >
      <div
        className={`app-overlay-panel app-overlay-panel--${size}${isFloat && showBeak ? " app-overlay-panel--beak" : ""} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        {isSheet ? <div className="app-overlay-grabber" aria-hidden="true" /> : null}
        <header className="app-overlay-header">
          <h2 id={titleId} className="app-overlay-title">
            {title}
          </h2>
          <button
            type="button"
            className="app-overlay-close"
            onClick={onClose}
            aria-label="Schliessen"
          >
            ×
          </button>
        </header>
        <div className="app-overlay-body">{children}</div>
        {footer ? <footer className="app-overlay-footer">{footer}</footer> : null}
      </div>
    </div>
  );
};

export default AppOverlay;
