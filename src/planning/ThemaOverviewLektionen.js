import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../config/appUrls";
import { reorderLektion } from "./planningStore";
import { getFachCssVars, getFachToneClassName } from "./fachColors";
import {
  formatLektionSchedule,
  groupLektionenByPhase,
  isLektionScheduled,
  lektionHasTimeMismatch,
  lektionHasZiel,
} from "./themaOverviewUtils";

const LEKTION_REORDER_MIME = "application/x-lp21-lektion-reorder";

const ThemaOverviewLektionen = ({
  vorhaben,
  onChange,
  onOpenLektion,
  onAddLektion,
  unscheduledCount = 0,
}) => {
  const [dragLektionId, setDragLektionId] = useState(null);
  const [dropBeforeId, setDropBeforeId] = useState(null);

  const phaseGroups = groupLektionenByPhase(vorhaben);
  const toneClass = getFachToneClassName(vorhaben.fach);
  const fachStyle = toneClass ? getFachCssVars(vorhaben.fach, vorhaben.id) : undefined;

  const handleReorderStart = useCallback((e, lektionId) => {
    e.dataTransfer.setData(LEKTION_REORDER_MIME, lektionId);
    e.dataTransfer.effectAllowed = "move";
    setDragLektionId(lektionId);
  }, []);

  const handleReorderEnd = useCallback(() => {
    setDragLektionId(null);
    setDropBeforeId(null);
  }, []);

  const handleReorderOver = useCallback((e, beforeLektionId, phaseId) => {
    if (!e.dataTransfer.types.includes(LEKTION_REORDER_MIME)) {
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropBeforeId(beforeLektionId);
    if (phaseId !== undefined) {
      e.currentTarget.dataset.dropPhaseId = phaseId ?? "";
    }
  }, []);

  const handleReorderDrop = useCallback(
    (e, beforeLektionId, phaseId) => {
      const lektionId = e.dataTransfer.getData(LEKTION_REORDER_MIME);
      if (!lektionId || lektionId === beforeLektionId) {
        handleReorderEnd();
        return;
      }
      e.preventDefault();
      const targetPhase =
        phaseId !== undefined ? phaseId : vorhaben.lektionen.find((l) => l.id === beforeLektionId)?.phaseId;
      onChange(reorderLektion(vorhaben, lektionId, beforeLektionId, targetPhase));
      handleReorderEnd();
    },
    [vorhaben, onChange, handleReorderEnd]
  );

  const handlePhaseDrop = useCallback(
    (e, phaseId) => {
      const lektionId = e.dataTransfer.getData(LEKTION_REORDER_MIME);
      if (!lektionId) {
        return;
      }
      e.preventDefault();
      const group = phaseGroups.find((g) => (g.phaseId || null) === (phaseId || null));
      const beforeId = group?.lektionen?.[0]?.id ?? null;
      onChange(reorderLektion(vorhaben, lektionId, beforeId, phaseId ?? null));
      handleReorderEnd();
    },
    [vorhaben, onChange, phaseGroups, handleReorderEnd]
  );

  return (
    <section
      id="thema-section-lektionen"
      className="thema-unified-section thema-dashboard__lektionen"
      aria-labelledby="thema-lek-title"
    >
      <div className="thema-overview-section-head">
        <div>
          <h2 id="thema-lek-title" className="thema-overview-section-title">
            Lektionen
          </h2>
          <p className="thema-unified-section-lead thema-unified-section-lead--desktop">
            Griff = Reihenfolge · Karte auf Kalender ziehen = Termin
          </p>
        </div>
        <div className="thema-overview-section-actions">
          {unscheduledCount > 0 ? (
            <span className="thema-overview-inline-alert" role="status">
              {unscheduledCount} ohne Termin
            </span>
          ) : null}
          <button
            type="button"
            className="planning-btn planning-btn--primary planning-btn--small"
            onClick={onAddLektion}
          >
            + Lektion
          </button>
          <Link to={APP_ROUTES.kalender} className="thema-overview-cal-link">
            Alle Fächer
          </Link>
        </div>
      </div>

      <div className="thema-overview-lektionen-body">
        {(vorhaben.lektionen || []).length === 0 ? (
          <div className="planning-empty-state">
            <p>Noch keine Lektionen.</p>
          </div>
        ) : (
          phaseGroups
            .filter((g) => g.lektionen.length > 0)
            .map((group) => (
            <div
              key={group.phaseId || "unassigned"}
              className={`thema-overview-phase${group.isFallback ? " thema-overview-phase--fallback" : ""}`}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes(LEKTION_REORDER_MIME)) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => handlePhaseDrop(e, group.phaseId ?? null)}
            >
              <h3 className="thema-overview-phase-title">{group.title}</h3>
              <ul className="thema-overview-lek-list">
                {group.lektionen.map((lek) => {
                  const scheduled = isLektionScheduled(lek, vorhaben);
                  const mismatch = lektionHasTimeMismatch(lek);
                  const scheduleLabel = formatLektionSchedule(lek, vorhaben);
                  const isDragging = dragLektionId === lek.id;
                  const isDropTarget = dropBeforeId === lek.id && dragLektionId !== lek.id;

                  return (
                    <li
                      key={lek.id}
                      className={`thema-overview-lek-item${isDragging ? " thema-overview-lek-item--dragging" : ""}${isDropTarget ? " thema-overview-lek-item--drop-target" : ""}`}
                      onDragOver={(e) =>
                        handleReorderOver(e, lek.id, group.phaseId ?? null)
                      }
                      onDrop={(e) =>
                        handleReorderDrop(e, lek.id, group.phaseId ?? null)
                      }
                    >
                      <article
                        className={`thema-overview-lek-card${toneClass ? ` ${toneClass}` : ""}${scheduled ? " thema-overview-lek-card--scheduled" : ""}${mismatch ? " thema-overview-lek-card--warn" : ""}`}
                        style={fachStyle}
                      >
                        <button
                          type="button"
                          className="thema-overview-lek-drag-handle"
                          draggable
                          aria-label={`„${lek.title}“ in der Liste verschieben`}
                          title="Reihenfolge ändern"
                          onDragStart={(e) => handleReorderStart(e, lek.id)}
                          onDragEnd={handleReorderEnd}
                        >
                          <span aria-hidden="true">⠿</span>
                        </button>
                        <div
                          className="thema-overview-lek-cal-drag fc-external-event cal-external-event--lektion"
                          data-kind="lektion"
                          data-lektion-id={lek.id}
                          data-title={lek.title}
                          data-duration={lek.durationMin}
                          title="In die Kalenderwoche ziehen"
                        >
                          <button
                            type="button"
                            className="thema-overview-lek-card-btn"
                            onClick={() => onOpenLektion(lek.id)}
                          >
                            <span className="thema-overview-lek-title">{lek.title}</span>
                            <span className="thema-overview-lek-meta">
                              <span>{lek.durationMin}′</span>
                              {lektionHasZiel(lek) ? <span>Ziel</span> : null}
                              {(lek.competencies?.length || 0) > 0 ? (
                                <span>{lek.competencies.length} K</span>
                              ) : null}
                            </span>
                          </button>
                        </div>
                        <span
                          className={`thema-overview-lek-cal${scheduled ? " thema-overview-lek-cal--on" : ""}`}
                          title={scheduled ? scheduleLabel || "Terminiert" : "Noch nicht terminiert"}
                        >
                          {scheduled ? "●" : "○"}
                        </span>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </div>
            ))
        )}
      </div>
    </section>
  );
};

export default ThemaOverviewLektionen;
