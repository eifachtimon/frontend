import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PlanningContextBar from "../planning/PlanningContextBar";
import {
  getSchoolYearMonthList,
  getSchoolYearStart,
  getWeeksInMonth,
  monthKey,
} from "../planning/calendarUtils";
import { normalizeKalender, updateMonthEntry } from "../planning/planningKalender";
import usePlanningStore from "../planning/usePlanningStore";
import { APP_ROUTES, jahresplanPath, monatsplanPath } from "../config/appUrls";
import "../planning/planning.css";

const countVorhabenInMonth = (vorhabenList, year, month) => {
  const weeksInMonth = getWeeksInMonth(year, month);
  return vorhabenList.filter((v) =>
    (v.wochen || []).some((w) =>
      weeksInMonth.some((wm) => wm.kw === w.kw && wm.year === w.year)
    )
  ).length;
};

const JahresplanPage = () => {
  const navigate = useNavigate();
  const { startYear: startYearParam } = useParams();
  const { store, patchStore } = usePlanningStore();

  const startYear = startYearParam
    ? Number(startYearParam)
    : store.kalender?.schoolYearStart ?? getSchoolYearStart();

  const kalender = normalizeKalender({
    ...store.kalender,
    schoolYearStart: startYear,
  });
  const months = getSchoolYearMonthList(startYear);
  const now = new Date();
  const currentKey = monthKey(now.getFullYear(), now.getMonth() + 1);

  const handleYearShift = (delta) => {
    const next = startYear + delta;
    patchStore((s) => ({
      ...s,
      kalender: normalizeKalender({
        schoolYearStart: next,
        months: s.kalender?.months,
      }),
    }));
    navigate(jahresplanPath(next));
  };

  const handleMonthFocus = (year, month, focus) => {
    patchStore((s) => updateMonthEntry(s, year, month, { focus }));
  };

  return (
    <div className="app-shell planning-hub planning-surface">
      <main className="planning-hub-main layout">
        <PlanningContextBar activeSection="jahr" />
        <nav className="planung-breadcrumb" aria-label="Brotkrumen">
          <Link to={APP_ROUTES.planung}>Mein Unterricht</Link>
          <span aria-hidden="true"> / </span>
          <span>Jahresplan</span>
        </nav>

        <header className="kalender-page-header">
          <div>
            <h1>Jahresplan</h1>
            <p className="planning-hub-lead">
              Schuljahr {startYear}/{String(startYear + 1).slice(-2)} — Überblick pro Monat
            </p>
          </div>
          <div className="kalender-year-nav">
            <button
              type="button"
              className="planning-btn planning-btn--ghost"
              onClick={() => handleYearShift(-1)}
              aria-label="Vorheriges Schuljahr"
            >
              ←
            </button>
            <span className="kalender-year-label">
              {startYear}/{startYear + 1}
            </span>
            <button
              type="button"
              className="planning-btn planning-btn--ghost"
              onClick={() => handleYearShift(1)}
              aria-label="Nächstes Schuljahr"
            >
              →
            </button>
          </div>
        </header>

        <div className="jahresplan-grid" role="list">
          {months.map((m) => {
            const entry = kalender.months[m.key] || { focus: "", notizen: "" };
            const isCurrent = m.key === currentKey;
            const vorhabenCount = countVorhabenInMonth(store.vorhaben, m.year, m.month);
            return (
              <article
                key={m.key}
                role="listitem"
                className={`jahresplan-month-card ${isCurrent ? "jahresplan-month-card--current" : ""}`}
              >
                <div className="jahresplan-month-head">
                  <Link
                    to={monatsplanPath(m.year, m.month)}
                    className="jahresplan-month-title"
                  >
                    {m.shortLabel}
                    <span className="jahresplan-month-year">{m.year}</span>
                  </Link>
                  {isCurrent ? (
                    <span className="jahresplan-now-badge">Aktuell</span>
                  ) : null}
                </div>
                <input
                  type="text"
                  className="jahresplan-month-focus"
                  value={entry.focus || ""}
                  onChange={(e) => handleMonthFocus(m.year, m.month, e.target.value)}
                  placeholder="Monatsschwerpunkt …"
                  aria-label={`Schwerpunkt ${m.label}`}
                />
                {vorhabenCount > 0 ? (
                  <p className="jahresplan-month-meta">{vorhabenCount} Vorhaben mit Wochen</p>
                ) : null}
                <Link
                  to={monatsplanPath(m.year, m.month)}
                  className="jahresplan-month-open"
                >
                  Monatsplan →
                </Link>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default JahresplanPage;
