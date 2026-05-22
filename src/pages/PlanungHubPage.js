import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  APP_ROUTES,
  jahresplanPath,
  monatsplanPath,
  vorhabenLevelPath,
} from "../config/appUrls";
import PlanningContextBar from "../planning/PlanningContextBar";
import PlanningOnboarding from "../planning/PlanningOnboarding";
import {
  getContinuePlanningTarget,
  getTodayHubSummary,
  suggestNextStepLabel,
} from "../planning/planningHubUtils";
import { getSchoolYearStart } from "../planning/calendarUtils";
import { VORHABEN_TEMPLATES } from "../planning/planningDefaults";
import { createVorhaben } from "../planning/planningStore";
import usePlanningStore from "../planning/usePlanningStore";
import "../planning/planning.css";

const formatRelative = (ts) => {
  if (!ts) {
    return "";
  }
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 2) {
    return "gerade eben";
  }
  if (min < 60) {
    return `vor ${min} Min`;
  }
  const h = Math.floor(min / 60);
  if (h < 48) {
    return `vor ${h} Std`;
  }
  const d = Math.floor(h / 24);
  return `vor ${d} T`;
};

const PlanungHubPage = () => {
  const navigate = useNavigate();
  const { store, saveVorhaben, removeVorhaben } = usePlanningStore();
  const [templateId, setTemplateId] = useState("thema");
  const [newTitle, setNewTitle] = useState("");

  const continueTarget = getContinuePlanningTarget(store);
  const todaySummary = getTodayHubSummary(store);
  const nextHint = suggestNextStepLabel(continueTarget?.vorhaben);

  const handleCreate = () => {
    const v = createVorhaben({
      templateId,
      title: newTitle.trim() || undefined,
    });
    const saved = saveVorhaben(v);
    navigate(vorhabenLevelPath(saved.id, "grob"));
  };

  const sorted = [...store.vorhaben].sort(
    (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
  );

  return (
    <div className="app-shell planning-hub planning-surface">
      <main className="planning-hub-main layout">
        <PlanningContextBar activeSection="hub" />

        <header className="planning-hub-header">
          <h1>Mein Unterricht</h1>
          <p className="planning-hub-lead">
            Ein Vorhaben als roter Faden — von der Grobplanung bis zur Lektion, mit
            Jahres- und Wochenüberblick.
          </p>
        </header>

        <PlanningOnboarding />

        {continueTarget ? (
          <section className="planning-primary-cta" aria-labelledby="continue-planning-title">
            <div className="planning-primary-cta-text">
              <h2 id="continue-planning-title">Weiter planen</h2>
              <p className="planning-primary-cta-vorhaben">{continueTarget.vorhaben.title}</p>
              <p className="planning-primary-cta-hint">{nextHint}</p>
            </div>
            <Link
              to={continueTarget.path}
              className="planning-btn planning-btn--primary planning-primary-cta-btn"
            >
              {continueTarget.todayLabel
                ? `Heute — ${continueTarget.todayLabel}`
                : "Weiter öffnen"}
            </Link>
          </section>
        ) : (
          <section className="planning-primary-cta planning-primary-cta--empty">
            <p>Starte mit einem Vorhaben — Kompetenzen kommen aus der Suche.</p>
            <Link to={APP_ROUTES.search} className="planning-btn planning-btn--ghost">
              Zur Suche
            </Link>
          </section>
        )}

        {todaySummary && !todaySummary.isWeekend ? (
          <section className="planning-today-card" aria-labelledby="today-planning-title">
            <h2 id="today-planning-title" className="planning-today-title">
              Heute · KW {todaySummary.kw}
            </h2>
            <p className="planning-today-meta">
              {todaySummary.cardCount > 0
                ? `${todaySummary.cardCount} Karte(n) am ${todaySummary.todayLabel}`
                : `Noch keine Karten am ${todaySummary.todayLabel}`}
              {todaySummary.openReminders > 0
                ? ` · ${todaySummary.openReminders} Erinnerung(en)`
                : ""}
            </p>
            <div className="planning-today-actions">
              <Link
                to={vorhabenLevelPath(todaySummary.vorhaben.id, "woche")}
                className="planning-btn planning-btn--ghost"
              >
                Wochenplan
              </Link>
              <Link to={APP_ROUTES.kalender} className="planning-btn planning-btn--ghost">
                Kalender
              </Link>
            </div>
          </section>
        ) : null}

        <nav className="planning-hub-entries planning-hub-entries--secondary" aria-label="Überblick">
          <Link
            to={jahresplanPath(getSchoolYearStart())}
            className="planning-hub-entry planning-hub-entry--jahr"
          >
            <span className="planning-hub-entry-title">Jahresplan</span>
            <span className="planning-hub-entry-desc">12 Monate, Schwerpunkte</span>
          </Link>
          <Link
            to={monatsplanPath(new Date().getFullYear(), new Date().getMonth() + 1)}
            className="planning-hub-entry planning-hub-entry--monat"
          >
            <span className="planning-hub-entry-title">Monatsplan</span>
            <span className="planning-hub-entry-desc">KW und Vorhaben im Monat</span>
          </Link>
        </nav>

        <section className="planning-create-card" aria-labelledby="create-vorhaben-title">
          <h2 id="create-vorhaben-title">Neues Vorhaben</h2>
          <div className="template-chip-row" role="group" aria-label="Vorlage wählen">
            {VORHABEN_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`template-chip ${templateId === t.id ? "template-chip--active" : ""}`}
                onClick={() => setTemplateId(t.id)}
                aria-pressed={templateId === t.id}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="planning-create-row">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Titel (z. B. Bruchteile im Alltag)"
              aria-label="Titel des Vorhabens"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreate();
                }
              }}
            />
            <button
              type="button"
              className="planning-btn planning-btn--primary"
              onClick={handleCreate}
            >
              Anlegen
            </button>
          </div>
        </section>

        <section className="planning-vorhaben-list-section" aria-labelledby="vorhaben-list-title">
          <h2 id="vorhaben-list-title">Deine Vorhaben</h2>
          {sorted.length === 0 ? (
            <div className="planning-empty-state">
              <p>Noch kein Vorhaben.</p>
              <p className="planning-empty-state-hint">
                Wähle oben eine Vorlage oder starte in der Suche mit «Ins Vorhaben».
              </p>
            </div>
          ) : (
            <ul className="vorhaben-card-list">
              {sorted.map((v) => {
                const resumeLevel = v.lastVisitedLevel || "grob";
                return (
                  <li key={v.id}>
                    <article className="vorhaben-card">
                      <Link
                        to={vorhabenLevelPath(v.id, resumeLevel)}
                        className="vorhaben-card-link"
                      >
                        <h3>{v.title}</h3>
                        <p className="vorhaben-card-meta">
                          {[v.fach, v.zyklus && `Zyklus ${v.zyklus}`, v.klasse]
                            .filter(Boolean)
                            .join(" · ") || "Fach & Klasse ergänzen"}
                        </p>
                        <p className="vorhaben-card-stats">
                          {v.competencies?.length || 0} Kompetenzen · {v.lektionen?.length || 0}{" "}
                          Lektionen
                          {v.updatedAt ? (
                            <span className="vorhaben-card-time">
                              {" "}
                              · {formatRelative(v.updatedAt)}
                            </span>
                          ) : null}
                        </p>
                      </Link>
                      <div className="vorhaben-card-quick">
                        <Link
                          to={vorhabenLevelPath(v.id, "woche")}
                          className="vorhaben-quick-link"
                        >
                          Woche
                        </Link>
                        <Link
                          to={vorhabenLevelPath(v.id, "lektion")}
                          className="vorhaben-quick-link"
                        >
                          Lektion
                        </Link>
                        <button
                          type="button"
                          className="vorhaben-card-delete"
                          onClick={() => {
                            if (window.confirm(`«${v.title}» wirklich löschen?`)) {
                              removeVorhaben(v.id);
                            }
                          }}
                          aria-label={`${v.title} löschen`}
                        >
                          ×
                        </button>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default PlanungHubPage;
