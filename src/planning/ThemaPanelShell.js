import React from "react";
import { getFachCssVars, getFachToneClassName } from "./fachColors";
import { getLevelMeta } from "./planningLevels";

const ThemaPanelShell = ({ levelId, fach = "", vorhabenId = "", children }) => {
  const meta = getLevelMeta(levelId);
  const toneClass = getFachToneClassName(fach);

  return (
    <article
      className={`thema-panel-card${toneClass ? ` ${toneClass}` : ""}`}
      style={toneClass ? getFachCssVars(fach, vorhabenId) : undefined}
      aria-labelledby={`thema-panel-${levelId}`}
    >
      <header className="thema-panel-card-head">
        <div className="thema-panel-card-head-main">
          <span className="thema-panel-card-step">Ebene {meta.step}</span>
          <h2 id={`thema-panel-${levelId}`} className="thema-panel-card-title">
            {meta.label}
          </h2>
        </div>
        <p className="thema-panel-card-focus">{meta.fhnwFocus}</p>
      </header>
      <div className="thema-panel-card-body">{children}</div>
    </article>
  );
};

export default ThemaPanelShell;
