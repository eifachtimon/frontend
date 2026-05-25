import React from "react";
import { Link } from "react-router-dom";
import { vorhabenLevelPath } from "../config/appUrls";

/** Nur auf Detail-Ebenen ohne eigene Zurück-Nav (z. B. Grobplanung). */
const SHOW_ON = new Set(["grob", "zwei-wochen", "lektion"]);

const VorhabenCircularityHint = ({ vorhabenId, currentLevel }) => {
  if (!SHOW_ON.has(currentLevel)) {
    return null;
  }

  return (
    <p className="vorhaben-circularity-hint">
      <Link to={vorhabenLevelPath(vorhabenId, "uebersicht")}>← Zur Übersicht</Link>
    </p>
  );
};

export default VorhabenCircularityHint;
