import React from "react";

/**
 * Raster-Zeile für Toggle-Blöcke — jede Kachel klappt unabhängig auf/zu.
 * @param {"2"|"3"} [columns]
 */
const ThemaOverviewToggleRow = ({ columns = "2", anchorId, ariaLabel, children }) => (
  <div
    id={anchorId}
    className={`thema-overview-raster thema-overview-raster--cols-${columns}`}
    role={ariaLabel ? "group" : undefined}
    aria-label={ariaLabel}
  >
    {children}
  </div>
);

export default ThemaOverviewToggleRow;
