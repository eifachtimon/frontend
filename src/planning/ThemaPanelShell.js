import React from "react";
import { getFachCssVars, getFachToneClassName } from "./fachColors";
import { getLevelMeta } from "./planningLevels";

/**
 * @param {"default"|"compact"} variant — compact: ohne „Ebene N“, FHNW-Fließtext (z. B. Wochenplan)
 */
const ThemaPanelShell = ({
  levelId,
  fach = "",
  vorhabenId = "",
  children,
  variant = "default",
}) => {
  const meta = getLevelMeta(levelId);
  const toneClass = getFachToneClassName(fach);
  const isCompact = variant === "compact";

  return (
    <article
      className={`thema-panel-card${isCompact ? " thema-panel-card--compact" : ""}${
        toneClass ? ` ${toneClass}` : ""
      }`}
      style={toneClass ? getFachCssVars(fach, vorhabenId) : undefined}
      aria-labelledby={`thema-panel-${levelId}`}
    >
      <header className="thema-panel-card-head">
        <div className="thema-panel-card-head-main">
          {!isCompact ? (
            <span className="thema-panel-card-step">Ebene {meta.step}</span>
          ) : null}
          <h2 id={`thema-panel-${levelId}`} className="thema-panel-card-title">
            {meta.label}
          </h2>
        </div>
        {!isCompact ? (
          <p className="thema-panel-card-focus">{meta.fhnwFocus}</p>
        ) : (
          <p className="thema-panel-card-focus thema-panel-card-focus--compact">
            Lektionen in die Woche ziehen oder Slot anklicken.
          </p>
        )}
      </header>
      <div className="thema-panel-card-body">{children}</div>
    </article>
  );
};

export default ThemaPanelShell;
