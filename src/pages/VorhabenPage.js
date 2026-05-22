import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { APP_ROUTES, PLANUNG_LEVELS, vorhabenLevelPath } from "../config/appUrls";
import ReportOrganizer from "../planning/ReportOrganizer";
import PlanningPhaseBanner from "../planning/PlanningPhaseBanner";
import PlanningContextBar from "../planning/PlanningContextBar";
import VorhabenCircularityHint from "../planning/VorhabenCircularityHint";
import VorhabenLevelNav from "../planning/VorhabenLevelNav";
import PlanningSaveToast from "../planning/PlanningSaveToast";
import GrobplanungPanel from "../planning/panels/GrobplanungPanel";
import ZweiWochenPanel from "../planning/panels/ZweiWochenPanel";
import WochePanel from "../planning/panels/WochePanel";
import LektionPanel from "../planning/panels/LektionPanel";
import usePlanningStore from "../planning/usePlanningStore";
import { loadPlanningStore } from "../planning/planningStore";
import "../planning/planning.css";

const VorhabenPage = () => {
  const { id, level } = useParams();
  const { store, saveVorhaben } = usePlanningStore();
  const [vorhaben, setVorhaben] = useState(null);
  const [savePulse, setSavePulse] = useState(0);
  const skipNextSaveToast = useRef(true);

  useEffect(() => {
    const v = store.vorhaben.find((x) => x.id === id) || null;
    setVorhaben(v);
    skipNextSaveToast.current = true;
  }, [store, id]);

  useEffect(() => {
    if (!vorhaben || !PLANUNG_LEVELS.includes(level)) {
      return;
    }
    if (vorhaben.lastVisitedLevel === level) {
      return;
    }
    saveVorhaben({ ...vorhaben, lastVisitedLevel: level });
  }, [level, vorhaben?.id]);

  const persist = useCallback(
    (next) => {
      setVorhaben(next);
      saveVorhaben(next);
      if (skipNextSaveToast.current) {
        skipNextSaveToast.current = false;
        return;
      }
      setSavePulse((p) => p + 1);
    },
    [saveVorhaben]
  );

  if (!PLANUNG_LEVELS.includes(level)) {
    return <Navigate to={vorhabenLevelPath(id, "grob")} replace />;
  }

  if (!vorhaben) {
    return (
      <div className="app-shell planning-hub planning-surface">
        <main className="planning-hub-main">
          <p className="planning-empty">Vorhaben nicht gefunden.</p>
          <Link to={APP_ROUTES.planung}>← Mein Unterricht</Link>
        </main>
      </div>
    );
  }

  const rituals = store.rituals || loadPlanningStore().rituals;

  const renderPanel = () => {
    switch (level) {
      case "grob":
        return <GrobplanungPanel vorhaben={vorhaben} onChange={persist} />;
      case "zwei-wochen":
        return (
          <ZweiWochenPanel vorhaben={vorhaben} rituals={rituals} onChange={persist} />
        );
      case "woche":
        return <WochePanel vorhaben={vorhaben} rituals={rituals} onChange={persist} />;
      case "lektion":
        return <LektionPanel vorhaben={vorhaben} rituals={rituals} onChange={persist} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell vorhaben-page planning-surface">
      <PlanningSaveToast pulseKey={savePulse} />
      <main
        className={`vorhaben-main layout${level === "woche" ? " vorhaben-main--woche" : ""}`}
      >
        <PlanningContextBar activeSection="vorhaben" vorhabenId={id} />
        <nav className="planung-breadcrumb" aria-label="Brotkrumen">
          <Link to={APP_ROUTES.planung}>Mein Unterricht</Link>
          <span aria-hidden="true"> / </span>
          <span>{vorhaben.title}</span>
        </nav>

        <header className="vorhaben-header">
          <input
            type="text"
            className="vorhaben-title-input"
            value={vorhaben.title}
            onChange={(e) => persist({ ...vorhaben, title: e.target.value })}
            aria-label="Titel des Vorhabens"
          />
          <div className="vorhaben-meta-row">
            <input
              type="text"
              placeholder="Fach"
              value={vorhaben.fach || ""}
              onChange={(e) => persist({ ...vorhaben, fach: e.target.value })}
              aria-label="Fach"
            />
            <input
              type="text"
              placeholder="Zyklus"
              value={vorhaben.zyklus || ""}
              onChange={(e) => persist({ ...vorhaben, zyklus: e.target.value })}
              aria-label="Zyklus"
              className="vorhaben-meta-short"
            />
            <input
              type="text"
              placeholder="Klasse (z. B. 5b)"
              value={vorhaben.klasse || ""}
              onChange={(e) => persist({ ...vorhaben, klasse: e.target.value })}
              aria-label="Klasse"
              className="vorhaben-meta-short"
            />
          </div>
        </header>

        <div className="vorhaben-stepper-sticky">
          <VorhabenLevelNav vorhaben={vorhaben} />
        </div>
        <VorhabenCircularityHint vorhabenId={vorhaben.id} currentLevel={level} />

        <ReportOrganizer
          vorhaben={vorhaben}
          onApply={persist}
          defaultOpen={level === "grob"}
        />

        <PlanningPhaseBanner levelId={level} />
        <div className="vorhaben-panel-area">{renderPanel()}</div>
      </main>
    </div>
  );
};

export default VorhabenPage;
