import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import CalendarView from "../calendar/CalendarView";
import { DEFAULT_CAL_FILTERS } from "../calendar/calendarFilters";
import { loadCalendarStore, saveCalendarStore } from "../calendar/calendarStore";
import { APP_ROUTES, vorhabenLevelPath } from "../config/appUrls";
import PlanningViewHeader from "../planning/PlanningViewHeader";
import PlanningOnboarding from "../planning/PlanningOnboarding";
import NeuesVorhabenModal from "../planning/NeuesVorhabenModal";
import { getContinuePlanningTarget } from "../planning/planningHubUtils";
import { groupVorhabenByFach } from "../planning/planningHomeUtils";
import TagesTodosPanel from "../planning/TagesTodosPanel";
import {
  addTagesTodoItem,
  createVorhaben,
  getTagesEintrag,
  loadPlanningStore,
  removeTagesTodoItem,
  setTagesEintrag,
  toggleTagesTodoItem,
} from "../planning/planningStore";
import { applyMockPlanningStore } from "../planning/planningMockData";
import { getFachCssVars, getFachToneClassName } from "../planning/fachColors";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { store, saveVorhaben, removeVorhaben, patchStore } = usePlanningStore();
  const [calStore, setCalStore] = useState(() => loadCalendarStore());
  const [createOpen, setCreateOpen] = useState(false);
  const [folderExpanded, setFolderExpanded] = useState({});

  const today = useMemo(() => new Date(), []);
  const dateLabel = useMemo(
    () =>
      today.toLocaleDateString("de-CH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [today]
  );
  const isoDate = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [today]);

  const fachFolders = useMemo(() => groupVorhabenByFach(store.vorhaben), [store.vorhaben]);
  const continueTarget = getContinuePlanningTarget(store);
  const draftVorhabenId =
    store.lastActiveVorhabenId || store.vorhaben[0]?.id || "";

  const tagesEintrag = getTagesEintrag(store, isoDate);
  const [draftNotizen, setDraftNotizen] = useState(tagesEintrag.notizen);

  useEffect(() => {
    setDraftNotizen(tagesEintrag.notizen);
  }, [tagesEintrag.notizen, isoDate]);

  useEffect(() => {
    const refreshCal = () => setCalStore(loadCalendarStore());
    window.addEventListener("lp21-calendar-updated", refreshCal);
    window.addEventListener("storage", refreshCal);
    return () => {
      window.removeEventListener("lp21-calendar-updated", refreshCal);
      window.removeEventListener("storage", refreshCal);
    };
  }, []);

  const persistCal = useCallback((next) => {
    setCalStore(saveCalendarStore(next));
  }, []);

  const persistTagesEintrag = useCallback(
    (partial) => {
      patchStore((current) => setTagesEintrag(current, isoDate, partial));
    },
    [patchStore, isoDate]
  );

  useEffect(() => {
    if (draftNotizen === tagesEintrag.notizen) {
      return undefined;
    }
    const timer = window.setTimeout(
      () => persistTagesEintrag({ notizen: draftNotizen }),
      500
    );
    return () => window.clearTimeout(timer);
  }, [draftNotizen, tagesEintrag.notizen, persistTagesEintrag]);

  const handleToggleTodo = useCallback(
    (todoId) => {
      patchStore((current) => toggleTagesTodoItem(current, isoDate, todoId));
    },
    [patchStore, isoDate]
  );

  const handleAddTodo = useCallback(
    (text) => {
      patchStore((current) => addTagesTodoItem(current, isoDate, text));
    },
    [patchStore, isoDate]
  );

  const handleRemoveTodo = useCallback(
    (todoId) => {
      patchStore((current) => removeTagesTodoItem(current, isoDate, todoId));
    },
    [patchStore, isoDate]
  );

  const handleCreateVorhaben = ({ templateId, title }) => {
    const v = createVorhaben({
      templateId,
      title: title || undefined,
    });
    const saved = saveVorhaben(v);
    setCreateOpen(false);
    navigate(vorhabenLevelPath(saved.id, "grob"));
  };

  const handleLoadMockData = () => {
    if (
      !window.confirm(
        "Demo-Daten laden? Bestehende Themen und heutige Todos/Notizen werden ersetzt."
      )
    ) {
      return;
    }
    const next = applyMockPlanningStore({ replace: true });
    const first = next.vorhaben[0];
    if (first) {
      navigate(vorhabenLevelPath(first.id, first.lastVisitedLevel || "woche"));
    }
  };

  useEffect(() => {
    if (searchParams.get("demo") !== "1") {
      return;
    }
    applyMockPlanningStore({ replace: true });
    const next = new URLSearchParams(searchParams);
    next.delete("demo");
    setSearchParams(next, { replace: true });
    const first = loadPlanningStore().vorhaben[0];
    if (first) {
      navigate(vorhabenLevelPath(first.id, first.lastVisitedLevel || "woche"), {
        replace: true,
      });
    }
  }, [searchParams, setSearchParams, navigate]);

  const toggleFolder = (fach) => {
    setFolderExpanded((prev) => ({ ...prev, [fach]: !prev[fach] }));
  };

  const isFolderOpen = (fach, count) => {
    if (folderExpanded[fach] !== undefined) {
      return folderExpanded[fach];
    }
    return count <= 4;
  };

  const headerActions = (
    <>
      {continueTarget ? (
        <Link
          to={continueTarget.path}
          className="planning-btn planning-btn--ghost unterricht-header-link"
        >
          Weiter planen
        </Link>
      ) : null}
      <Link
        to={APP_ROUTES.kalender}
        className="planning-btn planning-btn--ghost unterricht-header-link"
      >
        Kalender
      </Link>
      <button
        type="button"
        className="planning-btn planning-btn--ghost unterricht-header-link"
        onClick={handleLoadMockData}
        title="Beispiel-Themen mit allen Planungsebenen laden"
      >
        Demo-Daten
      </button>
      <button
        type="button"
        className="unterricht-btn-neu bh-btn bh-btn--red"
        onClick={() => setCreateOpen(true)}
        aria-haspopup="dialog"
      >
        + Neu
      </button>
    </>
  );

  return (
    <div className="app-shell planning-hub planning-surface unterricht-home">
      <main className="planning-hub-main layout unterricht-home-main">
        <PlanningViewHeader
          band="yellow"
          title="Mein Unterricht"
          lead={dateLabel}
          actions={headerActions}
        />

        <div className="unterricht-home-columns">
          <section
            className="unterricht-home-col unterricht-home-col--calendar"
            aria-labelledby="home-calendar-title"
          >
            <div className="unterricht-home-col-head">
              <h2 id="home-calendar-title" className="unterricht-section-title">
                Heute
              </h2>
              <Link to={APP_ROUTES.kalender} className="unterricht-col-link">
                Voller Kalender →
              </Link>
            </div>
            <div className="unterricht-home-calendar-host">
              <CalendarView
                dayViewToday
                initialDate={today}
                planningStore={store}
                saveVorhaben={saveVorhaben}
                calendarStore={calStore}
                onCalendarStoreChange={persistCal}
                filters={DEFAULT_CAL_FILTERS}
                draftVorhabenId={draftVorhabenId}
                rituals={store.rituals}
                showExternalEvents={false}
                showDragStrip={false}
                height="100%"
              />
            </div>
          </section>

          <section
            className="unterricht-home-col unterricht-home-col--notes"
            aria-label="Todos und Notizen für heute"
          >
            <div className="unterricht-tagesfeld">
              <h3 id="unterricht-tages-todos" className="unterricht-section-title">
                Todos für heute
              </h3>
              <p className="unterricht-tagesnotiz-hint">
                Abhaken, wenn erledigt — bleibt für heute gespeichert.
              </p>
              <TagesTodosPanel
                items={tagesEintrag.todos}
                onToggle={handleToggleTodo}
                onAdd={handleAddTodo}
                onRemove={handleRemoveTodo}
              />
            </div>
            <div className="unterricht-tagesfeld unterricht-tagesfeld--notizen">
              <label htmlFor="unterricht-tages-notizen" className="unterricht-section-title">
                Notizen für heute
              </label>
              <p className="unterricht-tagesnotiz-hint">
                Gedanken und Ideen — später kann KI sie einem Vorhaben zuordnen.
              </p>
              <textarea
                id="unterricht-tages-notizen"
                className="unterricht-tagesnotiz-input unterricht-tagesnotiz-input--fill"
                value={draftNotizen}
                onChange={(e) => setDraftNotizen(e.target.value)}
                onBlur={() => persistTagesEintrag({ notizen: draftNotizen })}
                placeholder="Reflexion, Ideen für den Einstieg, Gesprächsnotizen …"
                aria-label="Notizen für heute"
              />
            </div>
          </section>
        </div>

        <PlanningOnboarding />

        <section
          className="unterricht-folders"
          aria-labelledby="planungen-fach-title"
        >
          <h2 id="planungen-fach-title" className="unterricht-section-title">
            Planungen nach Fach
          </h2>
          {fachFolders.length === 0 ? (
            <div className="planning-empty-state">
              <p>Noch keine Themen.</p>
              <p className="planning-empty-state-hint">
                <button
                  type="button"
                  className="unterricht-inline-link"
                  onClick={() => setCreateOpen(true)}
                >
                  + Neu
                </button>{" "}
                oder Kompetenzen in der{" "}
                <Link to={APP_ROUTES.search}>Suche</Link> ins Thema legen.
              </p>
            </div>
          ) : (
            <div className="unterricht-folders-list">
              {fachFolders.map(({ fach, items }) => {
                const open = isFolderOpen(fach, items.length);
                const folderTone = getFachToneClassName(fach);
                return (
                  <section key={fach} className="unterricht-fach-folder">
                    <button
                      type="button"
                      className={`unterricht-fach-folder-head${folderTone ? ` ${folderTone}` : ""}`}
                      style={folderTone ? getFachCssVars(fach) : undefined}
                      onClick={() => toggleFolder(fach)}
                      aria-expanded={open}
                    >
                      <span aria-hidden="true">{open ? "▾" : "▸"}</span>
                      <span className="unterricht-fach-folder-name">{fach}</span>
                      <span className="unterricht-fach-folder-count">{items.length}</span>
                    </button>
                    {open ? (
                      <ul className="vorhaben-card-list unterricht-fach-list">
                        {items.map((v) => {
                          const resumeLevel = v.lastVisitedLevel || "grob";
                          const cardTone = getFachToneClassName(v.fach || fach);
                          return (
                            <li key={v.id}>
                              <article
                                className={`vorhaben-card${cardTone ? ` ${cardTone}` : ""}`}
                                style={cardTone ? getFachCssVars(v.fach || fach, v.id) : undefined}
                              >
                                <Link
                                  to={vorhabenLevelPath(v.id, resumeLevel)}
                                  className="vorhaben-card-link"
                                >
                                  <h3>{v.title}</h3>
                                  <p className="vorhaben-card-meta">
                                    {[v.zyklus && `Zyklus ${v.zyklus}`, v.klasse]
                                      .filter(Boolean)
                                      .join(" · ") || "Klasse ergänzen"}
                                  </p>
                                  <p className="vorhaben-card-stats">
                                    {v.competencies?.length || 0} Kompetenzen ·{" "}
                                    {v.lektionen?.length || 0} Lektionen
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
                                      if (
                                        window.confirm(`«${v.title}» wirklich löschen?`)
                                      ) {
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
                    ) : null}
                  </section>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <NeuesVorhabenModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateVorhaben}
      />
    </div>
  );
};

export default PlanungHubPage;
