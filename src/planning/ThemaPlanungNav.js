import React from "react";
import { Link, useParams } from "react-router-dom";
import { vorhabenLevelPath } from "../config/appUrls";
import { getLevelMeta } from "./planningLevels";

/** Nur auf Unterseiten (Grobplanung, Lektionen-Liste) — Übersicht hat keine Tabs mehr. */
const ThemaPlanungNav = () => {
  const { id: vorhabenId, level: currentLevel } = useParams();
  const meta = getLevelMeta(currentLevel);

  return (
    <nav className="thema-planung-nav thema-planung-nav--sub" aria-label="Planung">
      <Link
        to={vorhabenLevelPath(vorhabenId, "uebersicht")}
        className="thema-planung-nav-back"
      >
        ← Übersicht
      </Link>
      <span className="thema-planung-nav-current" aria-current="page">
        {meta.label}
      </span>
    </nav>
  );
};

export default ThemaPlanungNav;
