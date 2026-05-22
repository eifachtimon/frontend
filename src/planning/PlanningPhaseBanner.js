import React from "react";
import { getLevelMeta } from "./planningLevels";

const PlanningPhaseBanner = ({ levelId }) => {
  const meta = getLevelMeta(levelId);
  return (
    <aside className="planning-phase-banner" aria-label="Bezug Phasenmodell Unterrichtsplanung">
      <p className="planning-phase-banner-fhnw">
        <span className="planning-phase-banner-label">Phasenmodell:</span>{" "}
        {meta.fhnwPhases.join(" · ")}
      </p>
      <p className="planning-phase-banner-text">{meta.fhnwFocus}</p>
      <p className="planning-phase-banner-note">
        Planung verläuft zirkulär — du kannst jederzeit zwischen den Ebenen wechseln.
      </p>
    </aside>
  );
};

export default PlanningPhaseBanner;
