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
const PANEL_MAX_H = 300;
const WHEN_ROW_MIN_W = 272;
/** Abstand Popover-Kante → Auswahl; Pfeil ragt ~11px nach links */
const GAP = 5;
const MARGIN = 12;
export const BEAK_HALF = 7;
/**
 * Breite an Titel + Header-Buttons anpassen.
 * @param {HTMLElement | null} modalEl
 * @param {string} [title]
 */
export const measureCompactPopoverWidth = (modalEl, title = "") => {
  const vw = typeof window !== "undefined" ? window.innerWidth : 800;
  const maxW = Math.min(PANEL_MAX_W, vw - MARGIN * 2);
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

  const whenRow = modalEl.querySelector(".cal-event-quick-when");
  const whenW = whenRow
    ? Math.max(WHEN_ROW_MIN_W, whenRow.scrollWidth + 24)
    : WHEN_ROW_MIN_W;

  const body = modalEl.querySelector(".cal-event-modal-body--quick");
  const bodyW = body ? body.scrollWidth + 20 : 0;

  return Math.round(Math.min(maxW, Math.max(minW, headerW, whenW, bodyW)));
};

/**
 * @param {AnchorRect} anchor
 * @param {{ width?: number, height?: number }} [measured]
 */
export const computeAnchoredPopoverStyle = (anchor, measured = {}) => {
  const panelW = measured.width || PANEL_MIN_W;
  const panelH = measured.height || 0;
  const expandFull = Boolean(measured.expandFull);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const viewportMax = vh - MARGIN * 2;

  const anchorRight = anchor.left + anchor.width;
  const anchorCenterY = anchor.top + anchor.height / 2;

  const roomRight = vw - MARGIN - (anchorRight + GAP);
  const roomLeft = anchor.left - GAP - MARGIN;
  let beakSide = "left";
  let left = anchorRight + GAP;

  /* Seite nur nach Platz am Anker — nicht nach gemessener Popup-Breite (verhindert Sprung) */
  if (roomRight < PANEL_MIN_W && roomLeft > roomRight) {
    beakSide = "right";
    left = anchor.left - panelW - GAP;
  }
  if (left < MARGIN) {
    left = MARGIN;
  }
  if (beakSide === "right" && left + panelW > vw - MARGIN) {
    left = Math.max(MARGIN, vw - MARGIN - panelW);
  }

  const maxH = expandFull && panelH > 0
    ? Math.min(panelH, viewportMax)
    : Math.min(PANEL_MAX_H, viewportMax);
  const layoutHeight =
    expandFull && panelH > 0 ? Math.min(panelH, viewportMax) : maxH;

  let top = anchor.top;
  if (top + layoutHeight > vh - MARGIN) {
    top = Math.max(MARGIN, vh - MARGIN - layoutHeight);
  }
  if (top < MARGIN) {
    top = MARGIN;
  }

  const beakTop = Math.max(
    BEAK_HALF + 4,
    Math.min(layoutHeight - BEAK_HALF - 4, anchorCenterY - top - BEAK_HALF)
  );

  return {
    top: Math.round(top),
    left: Math.round(left),
    width: panelW,
    maxHeight: expandFull ? undefined : maxH,
    beakSide,
    beakTop: Math.round(beakTop),
  };
};
