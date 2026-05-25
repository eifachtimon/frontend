import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../config/appUrls";
import { reorderLektion } from "./planningStore";
import {
  dropTargetsEqual,
  isDropMarkerBefore,
  resolveDropTargetFromPointer,
  resolveReorderDrop,
} from "./themaOverviewDnD";
import { LEKTION_DRAG_MIME, hasLektionDrag } from "./planningDragMime";
import {
  getLektionScheduleDisplay,
  groupLektionenByPhase,
  isLektionScheduled,
  lektionHasTimeMismatch,
  lektionHasZiel,
} from "./themaOverviewUtils";
const LEKTION_OPEN_DRAG_THRESHOLD_PX = 6;

const ThemaOverviewLektionen = ({
  vorhaben,
  onChange,
  onOpenLektion,
  onAddLektion,
  unscheduledCount = 0,
}) => {
  const [dragLektionId, setDragLektionId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const dropTargetRef = useRef(null);
  const suppressOpenClickRef = useRef(false);
  const cardPointerRef = useRef(null);

  const phaseGroups = groupLektionenByPhase(vorhaben);
  const isReordering = Boolean(dragLektionId);
  const draggedLektion =
    dragLektionId && (vorhaben.lektionen || []).find((l) => l.id === dragLektionId);

  useEffect(() => {
    dropTargetRef.current = dropTarget;
  }, [dropTarget]);

  const clearDropTarget = useCallback(() => setDropTarget(null), []);

  const handleReorderStart = useCallback((e, lektionId) => {
    e.dataTransfer.setData(LEKTION_DRAG_MIME, lektionId);
    e.dataTransfer.effectAllowed = "move";
    setDragLektionId(lektionId);
    clearDropTarget();
    document.body.classList.add("cal-is-dragging");
  }, [clearDropTarget]);

  const suppressOpenAfterDrag = useCallback(() => {
    suppressOpenClickRef.current = true;
    window.setTimeout(() => {
      suppressOpenClickRef.current = false;
    }, 300);
  }, []);

  const handleReorderEnd = useCallback(() => {
    setDragLektionId(null);
    clearDropTarget();
    document.body.classList.remove("cal-is-dragging");
    suppressOpenAfterDrag();
  }, [clearDropTarget, suppressOpenAfterDrag]);

  const handleOpenLektionClick = useCallback(
    (lektionId) => {
      if (suppressOpenClickRef.current) {
        return;
      }
      onOpenLektion(lektionId);
    },
    [onOpenLektion]
  );

  const handleOpenLektionKeyDown = useCallback(
    (e, lektionId) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpenLektionClick(lektionId);
      }
    },
    [handleOpenLektionClick]
  );

  useEffect(() => {
    const onPointerDown = (e) => {
      const card = e.target.closest?.(".thema-lek-card");
      if (!card?.closest(".thema-dashboard__lektionen")) {
        return;
      }
      cardPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e) => {
      const start = cardPointerRef.current;
      cardPointerRef.current = null;
      if (!start) {
        return;
      }
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx >= LEKTION_OPEN_DRAG_THRESHOLD_PX || dy >= LEKTION_OPEN_DRAG_THRESHOLD_PX) {
        suppressOpenAfterDrag();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerUp);
    };
  }, [suppressOpenAfterDrag]);

  const allowReorder = useCallback((e) => {
    if (!hasLektionDrag(e.dataTransfer)) {
      return false;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    return true;
  }, []);

  const updateDropFromList = useCallback(
    (e, phaseId) => {
      if (!allowReorder(e)) {
        return;
      }
      e.stopPropagation();
      const listEl = e.currentTarget;
      const next = resolveDropTargetFromPointer({
        listEl,
        clientY: e.clientY,
        phaseId,
        dragLektionId,
      });
      if (!next) {
        return;
      }
      setDropTarget((prev) => {
        if (prev && dropTargetsEqual(prev, next)) {
          return prev;
        }
        return next;
      });
    },
    [allowReorder, dragLektionId]
  );

  const commitDrop = useCallback(
    (e) => {
      if (!allowReorder(e)) {
        return;
      }
      const lektionId = e.dataTransfer.getData(LEKTION_DRAG_MIME);
      const target = dropTargetRef.current;
      const resolved = resolveReorderDrop(phaseGroups, lektionId, target);
      if (resolved) {
        onChange(
          reorderLektion(
            vorhaben,
            resolved.lektionId,
            resolved.beforeLektionId,
            resolved.phaseId
          )
        );
      }
      handleReorderEnd();
    },
    [allowReorder, phaseGroups, onChange, vorhaben, handleReorderEnd]
  );

  const handleAddForPhase = (phaseId) => {
    onAddLektion(phaseId ?? null);
  };

  const renderDropPlaceholder = (key) => (
    <li key={key} className="thema-lek-drop-placeholder" aria-hidden="true">
      <div className="thema-lek-drop-placeholder__inner">
        <span className="thema-lek-drop-placeholder__label">
          {draggedLektion?.title || "Lektion"}
        </span>
      </div>
    </li>
  );

  const renderLektionCard = (lek, group) => {
    const scheduled = isLektionScheduled(lek, vorhaben);
    const mismatch = lektionHasTimeMismatch(lek);
    const scheduleDisplay = getLektionScheduleDisplay(lek, vorhaben);
    const scheduleLabel = scheduleDisplay
      ? [scheduleDisplay.weekday, scheduleDisplay.date].filter(Boolean).join(" ")
      : null;
    const isDragging = dragLektionId === lek.id;

    return (
      <li
        key={lek.id}
        className={`thema-overview-lek-item${isDragging ? " thema-overview-lek-item--dragging" : ""}`}
        data-lektion-id={lek.id}
      >
        <article
          className="thema-lek-card fc-external-event"
          draggable
          data-kind="lektion"
          data-lektion-id={lek.id}
          data-title={lek.title}
          data-duration={lek.durationMin}
          title="Ziehen: in der Liste umsortieren oder in die Kalenderwoche darunter legen"
          aria-label={
            mismatch
              ? `${lek.title}, Ablauf und Dauer passen nicht zusammen`
              : scheduled
                ? `${lek.title}, Termin ${scheduleLabel || "gesetzt"}`
                : `${lek.title}, ohne Termin`
          }
          onDragStart={(e) => handleReorderStart(e, lek.id)}
          onDragEnd={handleReorderEnd}
        >
          <div
            role="button"
            tabIndex={0}
            className="thema-lek-card__main"
            onClick={() => handleOpenLektionClick(lek.id)}
            onKeyDown={(e) => handleOpenLektionKeyDown(e, lek.id)}
          >
            <span className="thema-lek-card__title">{lek.title}</span>
            <span className="thema-lek-card__meta">
              <span className="thema-lek-chip">{lek.durationMin}′</span>
              {mismatch ? (
                <span
                  className="thema-lek-chip"
                  title="Summe der Ablauf-Blöcke und geplante Dauer stimmen nicht überein"
                >
                  Zeit!
                </span>
              ) : null}
              {lektionHasZiel(lek) ? <span className="thema-lek-chip">Ziel</span> : null}
              {(lek.competencies?.length || 0) > 0 ? (
                <span className="thema-lek-chip">{lek.competencies.length} K</span>
              ) : null}
            </span>
          </div>
          <div
            className={`thema-lek-card__status${
              scheduled ? "" : " thema-lek-card__status--offen"
            }`}
            title={
              scheduled
                ? scheduleLabel || "Im Wochenkalender terminiert"
                : "Noch kein Termin — Karte in die Woche darunter ziehen"
            }
          >
            {scheduled && scheduleDisplay ? (
              <>
                <span className="thema-lek-card__status-primary">
                  {scheduleDisplay.weekday}
                </span>
                {scheduleDisplay.date ? (
                  <span className="thema-lek-card__status-date">{scheduleDisplay.date}</span>
                ) : null}
              </>
            ) : (
              <span className="thema-lek-card__status-primary">ohne Termin</span>
            )}
          </div>
        </article>
      </li>
    );
  };

  const renderPhaseList = (group) => {
    const phaseId = group.phaseId ?? null;

    return (
      <ul
        className="thema-overview-lek-list"
        onDragOver={(e) => updateDropFromList(e, phaseId)}
        onDrop={commitDrop}
      >
        {group.lektionen.map((lek) => (
          <React.Fragment key={lek.id}>
            {isReordering && isDropMarkerBefore(dropTarget, phaseId, lek.id)
              ? renderDropPlaceholder(`ins-before-${lek.id}`)
              : null}
            {renderLektionCard(lek, group)}
          </React.Fragment>
        ))}
        {isReordering &&
        dropTarget != null &&
        (dropTarget.phaseId ?? null) === phaseId &&
        dropTarget.beforeLektionId == null
          ? renderDropPlaceholder(`ins-append-${phaseId ?? "none"}`)
          : null}
        <li
          className="thema-lek-drop-slot"
          aria-hidden={!isReordering}
          onDragOver={(e) => {
            if (!allowReorder(e)) {
              return;
            }
            e.stopPropagation();
            setDropTarget((prev) => {
              const next = { phaseId: phaseId ?? null, beforeLektionId: null };
              if (prev && dropTargetsEqual(prev, next)) {
                return prev;
              }
              return next;
            });
          }}
          onDrop={commitDrop}
        />
      </ul>
    );
  };

  return (
    <section
      id="thema-section-lektionen"
      className={`thema-unified-section thema-dashboard__lektionen${isReordering ? " thema-dashboard__lektionen--reordering" : ""}`}
      aria-labelledby="thema-lek-title"
    >
      <div className="thema-overview-section-head">
        <h2 id="thema-lek-title" className="thema-overview-section-title">
          Lektionen
        </h2>
        <div className="thema-overview-section-actions">
          {unscheduledCount > 0 ? (
            <span className="thema-overview-inline-alert" role="status">
              {unscheduledCount} ohne Termin
            </span>
          ) : null}
          <button
            type="button"
            className="planning-btn planning-btn--primary planning-btn--small"
            onClick={() => handleAddForPhase(null)}
          >
            + Lektion
          </button>
          <Link to={APP_ROUTES.kalender} className="thema-overview-cal-link">
            Alle Fächer
          </Link>
        </div>
      </div>

      <div className="thema-overview-lektionen-body">
        {phaseGroups.length === 0 ? (
          <div className="thema-overview-phase thema-overview-phase--empty-all">
            <p className="thema-overview-phase-empty-text">Noch keine Lektionen in diesem Thema.</p>
            <button
              type="button"
              className="planning-btn planning-btn--ghost planning-btn--small"
              onClick={() => handleAddForPhase(null)}
            >
              + Lektion
            </button>
          </div>
        ) : (
          phaseGroups.map((group) => {
            const phaseId = group.phaseId ?? null;

            return (
              <div
                key={group.phaseId || "unassigned"}
                className={[
                  "thema-overview-phase",
                  group.isFallback ? "thema-overview-phase--fallback" : "",
                  group.lektionen.length === 0 ? "thema-overview-phase--empty" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <h3 className="thema-overview-phase-title">{group.title}</h3>
                {group.lektionen.length === 0 ? (
                  <ul
                    className="thema-overview-lek-list thema-overview-lek-list--empty"
                    onDragOver={(e) => updateDropFromList(e, phaseId)}
                    onDrop={commitDrop}
                  >
                    {isReordering &&
                    dropTarget != null &&
                    (dropTarget.phaseId ?? null) === phaseId
                      ? renderDropPlaceholder(`ins-empty-${phaseId ?? "none"}`)
                      : null}
                    <li className="thema-overview-phase-empty">
                      <button
                        type="button"
                        className="planning-btn planning-btn--ghost planning-btn--small"
                        onClick={() => handleAddForPhase(group.phaseId)}
                      >
                        + Lektion
                      </button>
                    </li>
                  </ul>
                ) : (
                  renderPhaseList(group)
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default ThemaOverviewLektionen;
