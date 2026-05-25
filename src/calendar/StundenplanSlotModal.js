import React, { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import useOverlayPresentation from "../ui/useOverlayPresentation";
import { vorhabenLevelPath } from "../config/appUrls";
import { WEEKDAYS } from "../planning/planningDefaults";
import { addLektion } from "../planning/planningStore";
import { allLektionenFromPlanning } from "./stundenplanEvents";

const formatMin = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const StundenplanSlotModal = ({
  open,
  slot,
  onChange,
  onClose,
  onSave,
  onDelete,
  planningStore,
  saveVorhaben,
  draftVorhabenId,
}) => {
  const titleId = useId();
  const listRef = useRef(null);
  const overlayClass = useOverlayPresentation(open);
  const allLektionen = allLektionenFromPlanning(planningStore);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onSave]);

  if (!open || !slot) {
    return null;
  }

  const handleAssignLektion = (lek) => {
    onChange({
      ...slot,
      lektionId: lek.id,
      vorhabenId: lek.vorhabenId,
      label: lek.title,
      durationMin: lek.durationMin || slot.durationMin,
    });
  };

  const handleCreateLektion = () => {
    const v = planningStore.vorhaben.find((x) => x.id === (slot.vorhabenId || draftVorhabenId));
    if (!v || !saveVorhaben) {
      return;
    }
    const next = addLektion(v, { title: slot.label || "Neue Lektion" });
    saveVorhaben(next);
    const created = next.lektionen[next.lektionen.length - 1];
    handleAssignLektion({
      ...created,
      vorhabenId: v.id,
      vorhabenTitle: v.title,
    });
  };

  return (
    <div
      className={`cal-modal-overlay ${overlayClass}`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className="cal-modal cal-modal--stundenplan"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cal-modal-header">
          <h2 id={titleId} className="cal-modal-title">
            Lektionsplatz — Stundenplan
          </h2>
          <button type="button" className="cal-modal-close" onClick={onClose} aria-label="Schliessen">
            ×
          </button>
        </header>

        <div className="cal-modal-form">
          <p className="cal-stundenplan-modal-hint">
            Wöchentliches Raster über dem Kalender. Lektion zuweisen, neu anlegen oder Zeit
            anpassen — echte Termine liegen darüber.
          </p>

          <div className="cal-modal-row">
            <div className="cal-modal-field">
              <label htmlFor="stp-label">Bezeichnung</label>
              <input
                id="stp-label"
                type="text"
                value={slot.label || ""}
                onChange={(e) => onChange({ ...slot, label: e.target.value })}
                placeholder="z. B. Mathematik"
              />
            </div>
            <div className="cal-modal-field">
              <label htmlFor="stp-wd">Wochentag</label>
              <select
                id="stp-wd"
                value={slot.weekday || "mo"}
                onChange={(e) => onChange({ ...slot, weekday: e.target.value })}
              >
                {WEEKDAYS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="cal-modal-row">
            <div className="cal-modal-field">
              <label htmlFor="stp-start">Von</label>
              <input
                id="stp-start"
                type="time"
                value={formatMin(slot.startMin ?? 480)}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  const startMin = h * 60 + m;
                  const dur = (slot.endMin ?? startMin + 45) - (slot.startMin ?? startMin);
                  onChange({
                    ...slot,
                    startMin,
                    endMin: startMin + Math.max(15, dur),
                  });
                }}
              />
            </div>
            <div className="cal-modal-field">
              <label htmlFor="stp-end">Bis</label>
              <input
                id="stp-end"
                type="time"
                value={formatMin(slot.endMin ?? 525)}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  onChange({ ...slot, endMin: h * 60 + m });
                }}
              />
            </div>
          </div>

          {slot.lektionId ? (
            <p className="cal-stundenplan-linked">
              Verknüpft mit Lektion
              {slot.vorhabenId ? (
                <>
                  {" "}
                  <Link to={vorhabenLevelPath(slot.vorhabenId, "lektion")} onClick={onClose}>
                    im Thema öffnen →
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}

          <section className="cal-stundenplan-lektion-pick" aria-label="Lektionen">
            <div className="cal-stundenplan-lektion-head">
              <h3>Lektionen zuweisen</h3>
              <button
                type="button"
                className="planning-btn planning-btn--ghost"
                onClick={handleCreateLektion}
              >
                + Neue Lektion
              </button>
            </div>
            <p className="cal-stundenplan-drag-hint">Klicken zum Zuweisen — oder in den Platz im Kalender ziehen.</p>
            <ul ref={listRef} className="cal-stundenplan-lektion-list">
              {allLektionen.length === 0 ? (
                <li className="cal-stundenplan-lektion-empty">Noch keine Lektionen in Themen.</li>
              ) : (
                allLektionen.map((lek) => (
                  <li key={`${lek.vorhabenId}-${lek.id}`}>
                    <button
                      type="button"
                      className={`cal-stundenplan-lektion-item fc-external-event fc-external-event--stundenplan ${
                        slot.lektionId === lek.id ? "cal-stundenplan-lektion-item--active" : ""
                      }`}
                      data-kind="stundenplan-lektion"
                      data-title={lek.title}
                      data-duration={lek.durationMin}
                      data-lektion-id={lek.id}
                      data-vorhaben-id={lek.vorhabenId}
                      onClick={() => handleAssignLektion(lek)}
                    >
                      <span className="cal-stundenplan-lektion-title">{lek.title}</span>
                      <span className="cal-stundenplan-lektion-meta">
                        {lek.vorhabenTitle} · {lek.durationMin}′
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <footer className="cal-modal-footer">
            {slot.id && !String(slot.id).startsWith("stp-new") ? (
              <button
                type="button"
                className="planning-btn planning-btn--ghost cal-modal-delete"
                onClick={onDelete}
              >
                Platz löschen
                <span className="cal-kbd-hint">Entf</span>
              </button>
            ) : (
              <span />
            )}
            <div className="cal-modal-footer-right">
              <button type="button" className="planning-btn planning-btn--ghost" onClick={onClose}>
                Abbrechen
              </button>
              <button type="button" className="planning-btn planning-btn--primary" onClick={onSave}>
                Speichern
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default StundenplanSlotModal;
