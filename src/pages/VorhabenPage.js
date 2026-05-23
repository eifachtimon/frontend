import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { APP_ROUTES, PLANUNG_LEVELS, vorhabenLevelPath } from "../config/appUrls";
import PlanningLocationBar from "../planning/PlanningLocationBar";
import VorhabenLevelNav from "../planning/VorhabenLevelNav";
import PlanningSaveToast from "../planning/PlanningSaveToast";
import ThemaPageAside from "../planning/ThemaPageAside";
import ThemaHeroMeta from "../planning/ThemaHeroMeta";
import GrobplanungPanel from "../planning/panels/GrobplanungPanel";
import ZweiWochenPanel from "../planning/panels/ZweiWochenPanel";
import WochePanel from "../planning/panels/WochePanel";
import LektionPanel from "../planning/panels/LektionPanel";
import usePlanningStore from "../planning/usePlanningStore";
import { getFachCssVars, getFachToneClassName } from "../planning/fachColors";
import { getSuggestNextStepTarget } from "../planning/planningHubUtils";
import { getLevelMeta } from "../planning/planningLevels";
import { getVorhabenById, loadPlanningStore } from "../planning/planningStore";
import "../planning/planning.css";
import "../planning/themaPage.css";

const findVorhabenById = (planningStore, vorhabenId) => {
  if (!vorhabenId) {
    return null;
  }
  return (
    getVorhabenById(planningStore, vorhabenId) ||
    getVorhabenById(loadPlanningStore(), vorhabenId) ||
    null
  );
};

const VorhabenPage = () => {
  const { id, level } = useParams();
  const { store, saveVorhaben } = usePlanningStore();
  const [vorhaben, setVorhaben] = useState(() => findVorhabenById(loadPlanningStore(), id));
  const [missingConfirmed, setMissingConfirmed] = useState(false);
  const [savePulse, setSavePulse] = useState(0);
  const [asideOpen, setAsideOpen] = useState(false);
  const skipNextSaveToast = useRef(true);

  useEffect(() => {
    const v = findVorhabenById(store, id);
    setVorhaben(v);
    setMissingConfirmed(!v);
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

  const nextStep = useMemo(
    () => (vorhaben ? getSuggestNextStepTarget(vorhaben, level) : null),
    [vorhaben, level]
  );

  const openReminders = (vorhaben?.erinnerungen || []).filter((e) => !e.done).length;
  const compCount = vorhaben?.competencies?.length || 0;
  const lekCount = vorhaben?.lektionen?.length || 0;

  if (!PLANUNG_LEVELS.includes(level)) {
    return <Navigate to={vorhabenLevelPath(id, "grob")} replace />;
  }

  if (!vorhaben) {
    if (!missingConfirmed) {
      return (
        <div className="app-shell planning-hub planning-surface">
          <main className="planning-hub-main">
            <p className="planning-loading" role="status">
              Thema wird geladen …
            </p>
          </main>
        </div>
      );
    }
    return (
      <div className="app-shell planning-hub planning-surface">
        <main className="planning-hub-main">
          <p className="planning-empty">Thema nicht gefunden.</p>
          <Link to={APP_ROUTES.home}>← Mein Unterricht</Link>
        </main>
      </div>
    );
  }

  const rituals = store.rituals || loadPlanningStore().rituals;
  const showActionStep = nextStep && !nextStep.isOnTarget && nextStep.path;
  const showOkStep = nextStep && nextStep.isOnTarget;

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

  const aside = (
    <ThemaPageAside vorhaben={vorhaben} level={level} onChange={persist} />
  );

  const heroTone = getFachToneClassName(vorhaben.fach);
  const heroStyle = heroTone ? getFachCssVars(vorhaben.fach, vorhaben.id) : undefined;

  const nextStepBlock = showActionStep ? (
    <div className="thema-next-step thema-next-step--action" role="status">
      <span className="thema-next-step-label">Nächster Schritt</span>
      <p className="thema-next-step-text">{nextStep.label}</p>
      <Link to={nextStep.path} className="thema-next-step-link">
        Zu {getLevelMeta(nextStep.level).label} →
      </Link>
    </div>
  ) : showOkStep ? (
    <div
      className="thema-next-step thema-next-step--ok thema-next-step--inline"
      role="status"
    >
      <span className="thema-next-step-label">Fokus</span>
      <p className="thema-next-step-text">{nextStep.label}</p>
    </div>
  ) : null;

  return (
    <div className="app-shell vorhaben-page planning-surface">
      <PlanningSaveToast pulseKey={savePulse} />
      <main
        className={`vorhaben-main layout thema-page${level === "woche" ? " vorhaben-main--woche" : ""}`}
      >
        <header
          className={`vorhaben-header thema-hero${heroTone ? ` ${heroTone}` : ""}`}
          style={heroStyle}
        >
          <input
            type="text"
            className="vorhaben-title-input"
            value={vorhaben.title}
            onChange={(e) => persist({ ...vorhaben, title: e.target.value })}
            aria-label="Titel des Themas"
          />
          <ThemaHeroMeta
            vorhaben={vorhaben}
            onChange={persist}
            compCount={compCount}
            lekCount={lekCount}
            openReminders={openReminders}
          />
        </header>

        <div className="thema-toolbar-sticky vorhaben-stepper-sticky">
          <div
            className={`thema-toolbar-inner${showOkStep ? " thema-toolbar-inner--with-hint" : ""}`}
          >
            <VorhabenLevelNav vorhaben={vorhaben} />
            {showOkStep ? nextStepBlock : null}
            <PlanningLocationBar
              context="vorhaben"
              vorhabenId={id}
              levelId={level}
              variant="toolbar"
            />
          </div>
        </div>

        {showActionStep ? nextStepBlock : null}

        <div className="thema-body">
          <div className="thema-body-main vorhaben-panel-area">{renderPanel()}</div>

          <div
            className={`thema-aside-wrap${asideOpen ? " thema-aside-wrap--open" : ""}`}
          >
            <button
              type="button"
              className="thema-aside-mobile-toggle"
              aria-expanded={asideOpen}
              onClick={() => setAsideOpen((o) => !o)}
            >
              Kompetenzen &amp; Werkzeuge
              <span className="thema-aside-mobile-chevron" aria-hidden="true">
                {asideOpen ? "▾" : "▸"}
              </span>
            </button>
            {aside}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VorhabenPage;
