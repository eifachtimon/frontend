import React from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../config/appUrls";
import CompetencyPicker from "../components/CompetencyPicker";
import ReportOrganizer from "./ReportOrganizer";
import PlanningPhaseBanner from "./PlanningPhaseBanner";
import VorhabenCircularityHint from "./VorhabenCircularityHint";

const ThemaPageAside = ({ vorhaben, level, onChange }) => {
  const compCount = vorhaben.competencies?.length || 0;

  return (
    <aside className="thema-aside" aria-label="Kompetenzen und Werkzeuge">
      <section className="thema-aside-block" aria-labelledby="thema-aside-comp-title">
        <div className="thema-aside-block-head">
          <h2 id="thema-aside-comp-title" className="thema-aside-title">
            Kompetenzen
          </h2>
          <span className="thema-aside-count" aria-live="polite">
            {compCount}
          </span>
        </div>
        <p className="thema-aside-hint">
          Am ganzen Thema — aus{" "}
          <Link to={APP_ROUTES.search}>Suche</Link> oder Merkliste.
        </p>
        <CompetencyPicker
          variant="thema"
          selected={vorhaben.competencies || []}
          onChange={(competencies) => onChange({ ...vorhaben, competencies })}
          maxSelected={12}
        />
      </section>

      <section className="thema-aside-block thema-aside-block--tools">
        <ReportOrganizer vorhaben={vorhaben} onApply={onChange} defaultOpen={false} />
      </section>

      <footer className="thema-aside-footer">
        <VorhabenCircularityHint vorhabenId={vorhaben.id} currentLevel={level} />
        <details className="thema-aside-help">
          <summary>Phasenmodell (Referenz)</summary>
          <PlanningPhaseBanner levelId={level} compact />
        </details>
      </footer>
    </aside>
  );
};

export default ThemaPageAside;
