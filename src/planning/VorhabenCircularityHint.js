import React from "react";
import { Link } from "react-router-dom";
import { getLevelMeta, LEVEL_META } from "./planningLevels";
import { vorhabenLevelPath } from "../config/appUrls";

const VorhabenCircularityHint = ({ vorhabenId, currentLevel }) => {
  const idx = LEVEL_META.findIndex((m) => m.id === currentLevel);
  const prev = idx > 0 ? LEVEL_META[idx - 1] : null;
  const next = idx >= 0 && idx < LEVEL_META.length - 1 ? LEVEL_META[idx + 1] : null;
  const meta = getLevelMeta(currentLevel);

  return (
    <p className="vorhaben-circularity-hint">
      <span className="vorhaben-circularity-label">Zirkulär planen:</span>{" "}
      {prev ? (
        <Link to={vorhabenLevelPath(vorhabenId, prev.id)}>← {prev.label}</Link>
      ) : null}
      {prev && next ? " · " : null}
      {next ? (
        <Link to={vorhabenLevelPath(vorhabenId, next.id)}>{next.label} →</Link>
      ) : null}
      {!prev && !next ? null : " — "}
      <span className="vorhaben-circularity-fhnw">{meta.fhnwPhases.join(", ")}</span>
    </p>
  );
};

export default VorhabenCircularityHint;
