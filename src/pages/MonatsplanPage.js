import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PlanningContextBar from "../planning/PlanningContextBar";
import {
  MONTH_NAMES,
  getSchoolYearStart,
  getWeeksInMonth,
  parseMonthRoute,
  shiftMonth,
} from "../planning/calendarUtils";
import {
  getMonthEntry,
  updateMonthEntry,
  updateWeekInMonth,
} from "../planning/planningKalender";
import usePlanningStore from "../planning/usePlanningStore";
import {
  APP_ROUTES,
  jahresplanPath,
  monatsplanPath,
  vorhabenLevelPath,
} from "../config/appUrls";
import "../planning/planning.css";

const MonatsplanPage = () => {
  const navigate = useNavigate();
  const { year: yParam, month: mParam } = useParams();
  const { store, patchStore } = usePlanningStore();

  const { year, month } = parseMonthRoute(yParam, mParam);
  const monthLabel = MONTH_NAMES[month - 1];
  const schoolYearStart = getSchoolYearStart(new Date(year, month - 1, 1));
  const weeks = getWeeksInMonth(year, month);
  const monthEntry = getMonthEntry(store, year, month);
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  const findVorhabenForWeek = (kw, kwYear) =>
    store.vorhaben.filter((v) =>
      (v.wochen || []).some((w) => w.kw === kw && w.year === kwYear)
    );

  const handleMonthPatch = (patch) => {
    patchStore((s) => updateMonthEntry(s, year, month, patch));
  };

  const handleWeekPatch = (wkYear, kw, patch) => {
    patchStore((s) => updateWeekInMonth(s, year, month, wkYear, kw, patch));
  };

  return (
    <div className="app-shell planning-hub planning-surface">
      <main className="planning-hub-main layout">
        <PlanningContextBar activeSection="monat" />
        <nav className="planung-breadcrumb" aria-label="Brotkrumen">
          <Link to={APP_ROUTES.planung}>Mein Unterricht</Link>
          <span aria-hidden="true"> / </span>
          <Link to={jahresplanPath(schoolYearStart)}>Jahresplan</Link>
          <span aria-hidden="true"> / </span>
          <span>
            {monthLabel} {year}
          </span>
        </nav>

        <header className="kalender-page-header">
          <div>
            <h1>{monthLabel}</h1>
            <p className="planning-hub-lead">Kalenderwochen und Verknüpfung zu Vorhaben</p>
          </div>
          <div className="kalender-month-nav">
            <button
              type="button"
              className="planning-btn planning-btn--ghost"
              onClick={() => navigate(monatsplanPath(prev.year, prev.month))}
            >
              ← {MONTH_NAMES[prev.month - 1].slice(0, 3)}
            </button>
            <button
              type="button"
              className="planning-btn planning-btn--ghost"
              onClick={() => navigate(monatsplanPath(next.year, next.month))}
            >
              {MONTH_NAMES[next.month - 1].slice(0, 3)} →
            </button>
          </div>
        </header>

        <div className="planning-field">
          <label htmlFor="monat-focus">Monatsschwerpunkt</label>
          <input
            id="monat-focus"
            type="text"
            value={monthEntry.focus || ""}
            onChange={(e) => handleMonthPatch({ focus: e.target.value })}
            placeholder="Was steht diesen Monat im Zentrum?"
          />
        </div>
        <div className="planning-field">
          <label htmlFor="monat-notizen">Monatsnotizen</label>
          <textarea
            id="monat-notizen"
            rows={2}
            value={monthEntry.notizen || ""}
            onChange={(e) => handleMonthPatch({ notizen: e.target.value })}
          />
        </div>

        <ul className="monatsplan-week-list">
          {weeks.map((w) => {
            const wkStoreKey = `${w.year}-W${w.kw}`;
            const weekData = monthEntry.weeks?.[wkStoreKey] || {};
            const linked = findVorhabenForWeek(w.kw, w.year);
            const vorhabenId =
              weekData.vorhabenId ||
              (linked.length === 1 ? linked[0].id : "") ||
              "";

            return (
              <li key={wkStoreKey} className="monatsplan-week-row">
                <div className="monatsplan-week-head">
                  <span className="monatsplan-kw-badge">
                    KW {w.kw}
                    <span className="monatsplan-kw-year">{w.year}</span>
                  </span>
                  {linked.length > 0 ? (
                    <span className="monatsplan-vorhaben-chips">
                      {linked.map((v) => (
                        <Link
                          key={v.id}
                          to={vorhabenLevelPath(v.id, "woche")}
                          className="monatsplan-vorhaben-chip"
                        >
                          {v.title}
                        </Link>
                      ))}
                    </span>
                  ) : (
                    <span className="monatsplan-no-vorhaben">Kein Vorhaben</span>
                  )}
                </div>
                <input
                  type="text"
                  className="monatsplan-week-focus"
                  value={weekData.focus || ""}
                  onChange={(e) =>
                    handleWeekPatch(w.year, w.kw, { focus: e.target.value })
                  }
                  placeholder="Wochenschwerpunkt …"
                  aria-label={`Schwerpunkt KW ${w.kw}`}
                />
                {store.vorhaben.length > 0 ? (
                  <label className="monatsplan-vorhaben-select-wrap">
                    <span className="planning-sr-only">Vorhaben für KW verknüpfen</span>
                    <select
                      value={vorhabenId}
                      onChange={(e) =>
                        handleWeekPatch(w.year, w.kw, {
                          vorhabenId: e.target.value,
                        })
                      }
                      aria-label={`Vorhaben für KW ${w.kw}`}
                    >
                      <option value="">— Vorhaben wählen —</option>
                      {store.vorhaben.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title}
                        </option>
                      ))}
                    </select>
                    {vorhabenId ? (
                      <Link
                        to={vorhabenLevelPath(vorhabenId, "woche")}
                        className="monatsplan-week-open"
                      >
                        Wochenplanung öffnen →
                      </Link>
                    ) : null}
                  </label>
                ) : (
                  <Link to={APP_ROUTES.planung} className="monatsplan-week-open">
                    Vorhaben anlegen →
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
};

export default MonatsplanPage;
