const MIN_SIZE = 8;

/** @typedef {{ top: number, left: number, width: number, height: number }} AnchorRect */

/** @returns {AnchorRect | null} */
export const anchorFromSelectInfo = (selectInfo) => {
  const calEl = selectInfo?.view?.calendar?.el;
  if (calEl) {
    const candidates = [
      calEl.querySelector(".fc-event-mirror"),
      calEl.querySelector(".fc-highlight"),
      calEl.querySelector(".fc-timegrid-selection"),
    ].filter(Boolean);
    for (const el of candidates) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) {
        return { top: r.top, left: r.left, width: r.width, height: r.height };
      }
    }
  }
  const je = selectInfo?.jsEvent;
  if (je) {
    return {
      top: je.clientY,
      left: je.clientX,
      width: MIN_SIZE,
      height: MIN_SIZE,
    };
  }
  return null;
};

/** @returns {AnchorRect | null} */
export const anchorFromElement = (el) => {
  if (!el?.getBoundingClientRect) {
    return null;
  }
  const r = el.getBoundingClientRect();
  if (r.width <= 0 && r.height <= 0) {
    return null;
  }
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};

/** @returns {AnchorRect | null} */
export const anchorFromEventClick = (info) => {
  if (info?.el) {
    const r = info.el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }
  const je = info?.jsEvent;
  if (je) {
    return {
      top: je.clientY,
      left: je.clientX,
      width: MIN_SIZE,
      height: MIN_SIZE,
    };
  }
  return null;
};

const PANEL_MIN_W = 280;
const PANEL_MAX_W = 440;
const WHEN_ROW_MIN_W = 300;
/** Abstand Popover-Kante → Auswahl; Pfeil ragt ~11px nach links */
const GAP = 5;
export const VIEWPORT_MARGIN = 12;
export const BEAK_HALF = 7;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Breite an Titel + Header-Buttons anpassen.
 * @param {HTMLElement | null} modalEl
 * @param {string} [title]
 */
export const measureCompactPopoverWidth = (modalEl, title = "") => {
  const vw = typeof window !== "undefined" ? window.innerWidth : 800;
  const maxW = Math.min(PANEL_MAX_W, vw - VIEWPORT_MARGIN * 2);
  const minW = Math.min(PANEL_MIN_W, maxW);

  if (!modalEl) {
    return minW;
  }

  const header = modalEl.querySelector(".cal-event-modal-header--quick");
  const titleInput = modalEl.querySelector(".cal-event-quick-title");
  if (!header || !titleInput) {
    return minW;
  }

  const probe = document.createElement("span");
  probe.textContent = title || titleInput.placeholder || "Titel eingeben";
  probe.style.cssText = [
    "position:absolute",
    "visibility:hidden",
    "white-space:nowrap",
    "pointer-events:none",
    `font:${window.getComputedStyle(titleInput).font}`,
  ].join(";");
  document.body.appendChild(probe);
  const textW = probe.getBoundingClientRect().width;
  probe.remove();

  const headerChrome = 88;
  const padding = 28;
  const headerW = textW + headerChrome + padding;

  const themeRow = modalEl.querySelector(".cal-event-theme-fach-row");
  const themeW = themeRow ? themeRow.scrollWidth + 40 : 0;

  const body = modalEl.querySelector(".cal-event-modal-form--quick");
  const contentW = body ? body.offsetWidth : 0;

  return Math.round(
    Math.min(maxW, Math.max(minW, headerW, themeW, contentW, WHEN_ROW_MIN_W))
  );
};

/**
 * Popover neben dem Anker platzieren — vollständig im sichtbaren Bereich.
 * @param {AnchorRect} anchor
 * @param {{ width?: number, height?: number }} [measured]
 */
export const computeAnchoredPopoverStyle = (anchor, measured = {}) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = VIEWPORT_MARGIN;
  const viewportMaxW = vw - margin * 2;
  const viewportMaxH = vh - margin * 2;

  const panelW = clamp(measured.width || PANEL_MIN_W, PANEL_MIN_W, viewportMaxW);
  const naturalH = Math.max(measured.height || 0, 120);
  const needsClamp = naturalH > viewportMaxH;
  const layoutHeight = needsClamp ? viewportMaxH : naturalH;

  const anchorRight = anchor.left + anchor.width;
  const anchorCenterY = anchor.top + anchor.height / 2;

  const roomRight = vw - margin - (anchorRight + GAP);
  const roomLeft = anchor.left - GAP - margin;
  let beakSide = "left";
  let left = anchorRight + GAP;

  if (roomRight < panelW && roomLeft >= roomRight) {
    beakSide = "right";
    left = anchor.left - panelW - GAP;
  }

  left = clamp(left, margin, Math.max(margin, vw - margin - panelW));

  let top = anchor.top;
  if (top + layoutHeight > vh - margin) {
    top = vh - margin - layoutHeight;
  }
  if (top < margin) {
    top = margin;
  }

  if (needsClamp && layoutHeight >= viewportMaxH) {
    top = margin;
  }

  const beakTop = clamp(
    anchorCenterY - top - BEAK_HALF,
    BEAK_HALF + 4,
    Math.max(BEAK_HALF + 4, layoutHeight - BEAK_HALF - 4)
  );

  return {
    top: Math.round(top),
    left: Math.round(left),
    width: Math.round(panelW),
    maxHeight: needsClamp ? Math.round(viewportMaxH) : undefined,
    clamped: needsClamp,
    beakSide,
    beakTop: Math.round(beakTop),
  };
};

/**
 * Kompakt-Popup ohne Anker (z. B. Toolbar „+ Termin“) im Viewport halten.
 * @param {{ width?: number, height?: number }} measured
 */
export const computeStandalonePopoverStyle = (measured = {}) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = VIEWPORT_MARGIN;
  const viewportMaxW = vw - margin * 2;
  const viewportMaxH = vh - margin * 2;
  const panelW = clamp(measured.width || PANEL_MIN_W, PANEL_MIN_W, viewportMaxW);
  const naturalH = Math.max(measured.height || 0, 120);
  const needsClamp = naturalH > viewportMaxH;

  return {
    width: Math.round(panelW),
    maxHeight: needsClamp ? Math.round(viewportMaxH) : undefined,
    clamped: needsClamp,
  };
};
