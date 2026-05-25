import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { vorhabenLevelPath, vorhabenLektionPath } from "../config/appUrls";
import LektionPlanEditor from "../planning/LektionPlanEditor";
import PlanningSaveToast from "../planning/PlanningSaveToast";
import usePlanningStore from "../planning/usePlanningStore";
import { getFachCssVars, getFachToneClassName } from "../planning/fachColors";
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

const LektionPlanPage = () => {
  const { id, lektionId } = useParams();
  const navigate = useNavigate();
  const { store, saveVorhaben } = usePlanningStore();
  const [vorhaben, setVorhaben] = useState(() => findVorhabenById(loadPlanningStore(), id));
  const [savePulse, setSavePulse] = useState(0);
  const skipNextSaveToast = useRef(true);

  useEffect(() => {
    const v = findVorhabenById(store, id);
    setVorhaben(v);
    skipNextSaveToast.current = true;
  }, [store, id]);

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

  if (!vorhaben) {
    return (
      <div className="app-shell vorhaben-page planning-surface">
        <main className="vorhaben-main lektion-plan-page">
          <p className="planning-empty">Thema nicht gefunden.</p>
          <Link to="/">← Mein Unterricht</Link>
        </main>
      </div>
    );
  }

  const lektion = (vorhaben.lektionen || []).find((l) => l.id === lektionId);
  if (!lektion) {
    return <Navigate to={vorhabenLevelPath(id, "uebersicht")} replace />;
  }

  const rituals = store.rituals || loadPlanningStore().rituals;
  const heroTone = getFachToneClassName(vorhaben.fach);
  const heroStyle = heroTone ? getFachCssVars(vorhaben.fach, vorhaben.id) : undefined;

  const handleDelete = (deletedId) => {
    persist({
      ...vorhaben,
      lektionen: vorhaben.lektionen.filter((l) => l.id !== deletedId),
    });
  };

  return (
    <div className="app-shell vorhaben-page planning-surface lektion-plan-shell">
      <PlanningSaveToast pulseKey={savePulse} />
      <main className="vorhaben-main lektion-plan-page">
        <header className="lektion-plan-header">
          <Link
            to={vorhabenLevelPath(id, "uebersicht")}
            className="lektion-plan-back"
          >
            ← Thema
          </Link>
          <div
            className={`lektion-plan-header-main${heroTone ? ` ${heroTone}` : ""}`}
            style={heroStyle}
          >
            <p className="lektion-plan-eyebrow">{vorhaben.title}</p>
            <h1 className="lektion-plan-title">{lektion.title || "Lektion planen"}</h1>
          </div>
        </header>

        <LektionPlanEditor
          lektion={lektion}
          vorhaben={vorhaben}
          rituals={rituals}
          onChange={persist}
          onDelete={() => {
            handleDelete(lektion.id);
            navigate(vorhabenLevelPath(id, "uebersicht"), { replace: true });
          }}
        />

        {vorhaben.lektionen.filter((l) => l.id !== lektion.id).length > 0 ? (
          <nav className="lektion-plan-siblings" aria-label="Weitere Lektionen">
            <span className="lektion-plan-siblings-label">Weitere Lektionen</span>
            <ul className="lektion-plan-siblings-list">
              {vorhaben.lektionen
                .filter((l) => l.id !== lektion.id)
                .map((l) => (
                  <li key={l.id}>
                    <Link
                      to={vorhabenLektionPath(id, l.id)}
                      className="lektion-plan-sibling-link"
                    >
                      {l.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        ) : null}
      </main>
    </div>
  );
};

export default LektionPlanPage;
