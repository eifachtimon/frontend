import React from "react";
import { NavLink, useParams } from "react-router-dom";
import { PLANUNG_STEPPER_LEVELS, vorhabenLevelPath } from "../config/appUrls";
import { getLevelBadge, LEVEL_META } from "./planningLevels";

const STEPPER_META = LEVEL_META.filter(
  (m) => PLANUNG_STEPPER_LEVELS.includes(m.id) && !m.hiddenInStepper
);

const VorhabenLevelNav = ({ vorhaben }) => {
  const { id: vorhabenId, level: currentLevel } = useParams();

  return (
    <nav className="vorhaben-stepper" aria-label="Planungsebenen">
      <ol className="vorhaben-stepper-list">
        {STEPPER_META.map((meta, index) => {
          const badge = getLevelBadge(vorhaben, meta.id);
          const isLast = index === LEVEL_META.length - 1;
          return (
            <li key={meta.id} className="vorhaben-stepper-item">
              {!isLast ? (
                <span className="vorhaben-stepper-connector" aria-hidden="true" />
              ) : null}
              <NavLink
                to={vorhabenLevelPath(vorhabenId, meta.id)}
                className={({ isActive }) =>
                  `vorhaben-stepper-link${isActive ? " vorhaben-stepper-link--active" : ""}${
                    currentLevel === meta.id ? " vorhaben-stepper-link--current" : ""
                  }`
                }
              >
                <span className="vorhaben-stepper-step" aria-hidden="true">
                  {meta.step}
                </span>
                <span className="vorhaben-stepper-text">
                  <span className="vorhaben-stepper-label">{meta.label}</span>
                  <span className="vorhaben-stepper-hint">{meta.hint}</span>
                </span>
                {badge ? (
                  <span className="vorhaben-stepper-badge" aria-label={`${badge} Einträge`}>
                    {badge}
                  </span>
                ) : null}
              </NavLink>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default VorhabenLevelNav;
