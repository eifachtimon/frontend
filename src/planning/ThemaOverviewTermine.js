import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WEEKDAYS } from "./planningDefaults";
import { vorhabenLevelPath, vorhabenLektionPath } from "../config/appUrls";
import { getIsoWeek } from "./planningStore";
import {
  findLektionSchedule,
  isLektionScheduled,
} from "./themaOverviewUtils";

const ThemaOverviewTermine = ({ vorhaben }) => {
  const navigate = useNavigate();
  const { kw, year } = getIsoWeek();

  const week = useMemo(
    () =>
      (vorhaben.wochen || []).find((w) => w.kw === kw && w.year === year) ||
      vorhaben.wochen?.[0],
    [vorhaben.wochen, kw, year]
  );

  const unscheduled = useMemo(
    () =>
      (vorhaben.lektionen || []).filter((l) => !isLektionScheduled(l, vorhaben)),
    [vorhaben]
  );

  const weekRows = useMemo(() => {
    if (!week) {
      return [];
    }
    return WEEKDAYS.map((d) => {
      const day = week.days?.[d.id];
      const cards = (day?.cards || []).filter((c) => c.lektionId || c.label);
      return { id: d.id, label: d.label, cards };
    }).filter((row) => row.cards.length > 0);
  }, [week]);

  return (
    <aside className="thema-overview-termine" aria-labelledby="thema-termine-title">
      <div className="thema-overview-termine-head">
        <h2 id="thema-termine-title" className="thema-overview-section-title">
          Termine
        </h2>
        <Link
          to={vorhabenLevelPath(vorhaben.id, "woche")}
          className="thema-overview-link"
        >
          Wochenplan →
        </Link>
      </div>

      {unscheduled.length > 0 ? (
        <div className="thema-overview-termine-alert" role="status">
          <p className="thema-overview-termine-alert-title">
            {unscheduled.length} Lektion{unscheduled.length === 1 ? "" : "en"} ohne Slot
          </p>
          <ul className="thema-overview-termine-chips">
            {unscheduled.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  className="thema-overview-termine-chip"
                  draggable
                  onClick={() => navigate(vorhabenLektionPath(vorhaben.id, l.id))}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "application/x-lp21-woche",
                      JSON.stringify({ kind: "lektion", lektionId: l.id })
                    );
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  title="Lektion planen — in Wochenplan ziehen zum Terminieren"
                >
                  {l.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="thema-overview-termine-ok">Alle Lektionen haben einen Platz in der Woche.</p>
      )}

      {week ? (
        <div className="thema-overview-week-mini">
          <p className="thema-overview-week-kw">
            KW {week.kw}
            {week.focus ? ` · ${week.focus}` : ""}
          </p>
          {weekRows.length === 0 ? (
            <p className="planning-empty">Noch keine Einträge in dieser Woche.</p>
          ) : (
            <ul className="thema-overview-week-rows">
              {weekRows.map((row) => (
                <li key={row.id} className="thema-overview-week-row">
                  <span className="thema-overview-week-day">{row.label}</span>
                  <ul className="thema-overview-week-cards">
                    {row.cards.map((c) => {
                      const lek = c.lektionId
                        ? vorhaben.lektionen?.find((l) => l.id === c.lektionId)
                        : null;
                      const scheduled = lek
                        ? findLektionSchedule(vorhaben, lek.id)
                        : null;
                      return (
                        <li key={c.id}>
                          {lek ? (
                            <button
                              type="button"
                              className="thema-overview-week-card thema-overview-week-card--btn"
                              onClick={() =>
                                navigate(vorhabenLektionPath(vorhaben.id, lek.id))
                              }
                            >
                              {c.label}
                              {scheduled?.startMin != null ? (
                                <span className="thema-overview-week-time">
                                  {String(Math.floor(scheduled.startMin / 60)).padStart(2, "0")}:
                                  {String(scheduled.startMin % 60).padStart(2, "0")}
                                </span>
                              ) : null}
                            </button>
                          ) : (
                            <span className="thema-overview-week-card">
                              {c.label}
                              {scheduled?.startMin != null ? (
                                <span className="thema-overview-week-time">
                                  {String(Math.floor(scheduled.startMin / 60)).padStart(2, "0")}:
                                  {String(scheduled.startMin % 60).padStart(2, "0")}
                                </span>
                              ) : null}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <p className="thema-overview-hint">
        Termine im{" "}
        <Link to={vorhabenLevelPath(vorhaben.id, "woche")}>Wochenplan</Link> per Drag &amp; Drop
        setzen.
      </p>
    </aside>
  );
};

export default ThemaOverviewTermine;
