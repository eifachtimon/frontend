import React, { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";

const toLocalInput = (iso) => {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (value) => {
  if (!value) {
    return new Date().toISOString();
  }
  return new Date(value).toISOString();
};

const CalendarEventModal = ({
  open,
  form,
  onChange,
  onClose,
  onSave,
  onDelete,
  vorhabenOptions = [],
  lektionOptions = [],
}) => {
  const titleId = useId();
  const firstFieldRef = useRef(null);

  useEffect(() => {
    if (open) {
      firstFieldRef.current?.focus();
      document.body.classList.add("cal-modal-open");
      return () => document.body.classList.remove("cal-modal-open");
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open || !form) {
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !form.readonly) {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, form, onClose, onSave]);

  if (!open || !form) {
    return null;
  }

  const isPlanning = form.source === "planning" || Boolean(form.vorhabenId);
  const canEdit = !form.readonly;
  const canDelete =
    canEdit && form.mode === "edit" && (form.cardId || form.localEventId);

  return (
    <div className="cal-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="cal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cal-modal-header">
          <h2 id={titleId} className="cal-modal-title">
            {form.mode === "create" ? "Neuer Termin" : form.title || "Termin"}
          </h2>
          <button
            type="button"
            className="cal-modal-close"
            onClick={onClose}
            aria-label="Schliessen"
          >
            ×
          </button>
        </header>

        <form
          className="cal-modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (canEdit) {
              onSave();
            }
          }}
        >
          {form.vorhabenTitle ? (
            <p className="cal-modal-meta">
              <span className="cal-modal-meta-badge">{form.vorhabenTitle}</span>
              {form.templateLabel ? (
                <span className="cal-modal-meta-sub">{form.templateLabel}</span>
              ) : null}
              {form.fach ? <span className="cal-modal-meta-sub">{form.fach}</span> : null}
            </p>
          ) : null}

          <div className="cal-modal-field">
            <label htmlFor="cal-ev-title">Titel</label>
            <input
              ref={firstFieldRef}
              id="cal-ev-title"
              type="text"
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              readOnly={!canEdit}
              required
            />
          </div>

          {canEdit && vorhabenOptions.length > 0 ? (
            <div className="cal-modal-field">
              <label htmlFor="cal-ev-vorhaben">Vorhaben</label>
              <select
                id="cal-ev-vorhaben"
                value={form.vorhabenId || ""}
                onChange={(e) =>
                  onChange({
                    ...form,
                    vorhabenId: e.target.value,
                    source: e.target.value ? "planning" : "local",
                  })
                }
              >
                <option value="">— Nur Kalender (lokal) —</option>
                {vorhabenOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {canEdit && isPlanning ? (
            <div className="cal-modal-row">
              <div className="cal-modal-field">
                <label htmlFor="cal-ev-type">Art</label>
                <select
                  id="cal-ev-type"
                  value={form.cardType || "notiz"}
                  onChange={(e) => onChange({ ...form, cardType: e.target.value })}
                >
                  <option value="notiz">Termin / Notiz</option>
                  <option value="ritual">Ritual</option>
                  <option value="lektion">Lektion</option>
                </select>
              </div>
              {form.cardType === "lektion" && lektionOptions.length > 0 ? (
                <div className="cal-modal-field">
                  <label htmlFor="cal-ev-lek">Lektion verknüpfen</label>
                  <select
                    id="cal-ev-lek"
                    value={form.lektionId || ""}
                    onChange={(e) => {
                      const lek = lektionOptions.find((l) => l.id === e.target.value);
                      onChange({
                        ...form,
                        lektionId: e.target.value,
                        title: lek ? lek.title : form.title,
                        durationMin: lek?.durationMin ?? form.durationMin,
                      });
                    }}
                  >
                    <option value="">— wählen —</option>
                    {lektionOptions.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="cal-modal-field cal-modal-field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={(e) => onChange({ ...form, allDay: e.target.checked })}
                disabled={!canEdit}
              />
              Ganztägig
            </label>
          </div>

          <div className="cal-modal-row">
            <div className="cal-modal-field">
              <label htmlFor="cal-ev-start">Beginn</label>
              <input
                id="cal-ev-start"
                type={form.allDay ? "date" : "datetime-local"}
                value={
                  form.allDay
                    ? form.start?.slice(0, 10)
                    : toLocalInput(form.start)
                }
                onChange={(e) =>
                  onChange({
                    ...form,
                    start: form.allDay
                      ? new Date(`${e.target.value}T08:00`).toISOString()
                      : fromLocalInput(e.target.value),
                  })
                }
                readOnly={!canEdit}
              />
            </div>
            <div className="cal-modal-field">
              <label htmlFor="cal-ev-end">Ende</label>
              <input
                id="cal-ev-end"
                type={form.allDay ? "date" : "datetime-local"}
                value={
                  form.allDay ? form.end?.slice(0, 10) : toLocalInput(form.end)
                }
                onChange={(e) =>
                  onChange({
                    ...form,
                    end: form.allDay
                      ? new Date(`${e.target.value}T17:00`).toISOString()
                      : fromLocalInput(e.target.value),
                  })
                }
                readOnly={!canEdit}
              />
            </div>
          </div>

          {canEdit && !form.allDay ? (
            <div className="cal-modal-field">
              <label htmlFor="cal-ev-dur">Dauer (Minuten)</label>
              <input
                id="cal-ev-dur"
                type="number"
                min={15}
                step={15}
                value={form.durationMin ?? 45}
                onChange={(e) =>
                  onChange({ ...form, durationMin: Number(e.target.value) })
                }
              />
            </div>
          ) : null}

          <div className="cal-modal-field">
            <label htmlFor="cal-ev-notes">Notizen</label>
            <textarea
              id="cal-ev-notes"
              rows={3}
              value={form.notes || ""}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
              readOnly={!canEdit}
              placeholder="Notizen, Material, Hinweise …"
            />
          </div>

          {form.weekFocus ? (
            <p className="cal-modal-extra">
              <strong>Wochenfokus:</strong> {form.weekFocus}
            </p>
          ) : null}

          {form.readonly ? (
            <p className="cal-modal-readonly-hint">
              Externes Abo — nur in der Quelle bearbeitbar.
            </p>
          ) : null}

          {form.links?.length > 0 ? (
            <nav className="cal-modal-links" aria-label="Verknüpfungen">
              {form.links.map((lnk) => (
                <Link key={lnk.to} to={lnk.to} className="cal-modal-link" onClick={onClose}>
                  {lnk.label} →
                </Link>
              ))}
            </nav>
          ) : null}

          <footer className="cal-modal-footer">
            {canDelete ? (
              <button
                type="button"
                className="planning-btn planning-btn--ghost cal-modal-delete"
                onClick={onDelete}
              >
                Löschen
                <span className="cal-kbd-hint">Entf</span>
              </button>
            ) : (
              <span />
            )}
            <div className="cal-modal-footer-right">
              <button type="button" className="planning-btn planning-btn--ghost" onClick={onClose}>
                Abbrechen
                <span className="cal-kbd-hint">Esc</span>
              </button>
              {canEdit ? (
                <button type="submit" className="planning-btn planning-btn--primary">
                  Speichern
                  <span className="cal-kbd-hint">⌘↵</span>
                </button>
              ) : null}
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CalendarEventModal;
