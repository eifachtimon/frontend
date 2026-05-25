import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  computeAnchoredPopoverStyle,
  measureCompactPopoverWidth,
} from "./calendarEventAnchor";
import useOverlayPresentation from "../ui/useOverlayPresentation";

/** Schritt A: false. Schritt B (Pfeil): true — nach deinem OK zu Schritt A. */
const POPOVER_BEAK_ENABLED = false;

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

const pad2 = (n) => String(n).padStart(2, "0");

const toLocalInput = (iso) => {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const toDateInput = (iso) => (iso ? iso.slice(0, 10) : "");

const toTimeInput = (iso) => {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const fromLocalInput = (value) => {
  if (!value) {
    return new Date().toISOString();
  }
  return new Date(value).toISOString();
};

const fromDateTimeParts = (dateStr, timeStr) => {
  if (!dateStr) {
    return new Date().toISOString();
  }
  return new Date(`${dateStr}T${timeStr || "08:00"}`).toISOString();
};

const formatTimeLabel = (iso) => {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const getDurationMin = (form) => {
  const n = Number(form.durationMin);
  return Number.isFinite(n) && n > 0 ? n : 45;
};

const withSyncedEnd = (form, patch = {}) => {
  const merged = { ...form, ...patch };
  if (merged.allDay) {
    return merged;
  }
  const durationMin = getDurationMin(merged);
  const startMs = new Date(merged.start || Date.now()).getTime();
  return {
    ...merged,
    durationMin,
    end: new Date(startMs + durationMin * 60000).toISOString(),
  };
};

const cardTypeLabel = (type) => {
  if (type === "ritual") {
    return "Ritual";
  }
  if (type === "lektion") {
    return "Lektion";
  }
  return "Termin";
};

const CompactEventForm = ({
  form,
  canEdit,
  canDelete,
  isPlanning,
  vorhabenOptions,
  lektionOptions,
  onChange,
  onClose,
  onDelete,
  onExpand,
  titleId,
  firstFieldRef,
}) => {
  const durationMin = getDurationMin(form);
  const endLabel = formatTimeLabel(form.end);

  return (
    <>
      <header className="cal-event-modal-header cal-event-modal-header--quick">
        <input
          ref={firstFieldRef}
          id="cal-ev-title"
          className="cal-event-quick-title"
          type="text"
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          readOnly={!canEdit}
          required
          placeholder="Titel eingeben"
          aria-labelledby={titleId}
        />
        <span id={titleId} className="cal-sr-only">
          {form.mode === "create" ? "Neuer Termin" : "Termin bearbeiten"}
        </span>
        <button
          type="button"
          className="cal-event-quick-expand"
          onClick={onExpand}
          aria-label="Erweiterte Ansicht"
          title="Erweitern"
        >
          ⤢
        </button>
        <button
          type="button"
          className="cal-modal-close cal-event-quick-close"
          onClick={onClose}
          aria-label="Schliessen"
        >
          ×
        </button>
      </header>

      <div className="cal-event-modal-body cal-event-modal-body--quick">
        {form.vorhabenTitle ? (
          <p className="cal-event-quick-meta">{form.vorhabenTitle}</p>
        ) : null}

        {form.allDay ? (
          <div className="cal-event-quick-when">
            <label className="cal-event-quick-field">
              <span>Datum</span>
              <input
                id="cal-ev-start-date"
                type="date"
                value={toDateInput(form.start)}
                onChange={(e) =>
                  onChange({
                    ...form,
                    start: new Date(`${e.target.value}T08:00`).toISOString(),
                  })
                }
                readOnly={!canEdit}
              />
            </label>
          </div>
        ) : (
          <>
            <div className="cal-event-quick-when">
              <label className="cal-event-quick-field">
                <span>Datum</span>
                <input
                  id="cal-ev-start-date"
                  type="date"
                  value={toDateInput(form.start)}
                  onChange={(e) =>
                    onChange(
                      withSyncedEnd(form, {
                        start: fromDateTimeParts(e.target.value, toTimeInput(form.start)),
                      })
                    )
                  }
                  readOnly={!canEdit}
                />
              </label>
              <label className="cal-event-quick-field">
                <span>Beginn</span>
                <input
                  id="cal-ev-start-time"
                  type="time"
                  step={900}
                  value={toTimeInput(form.start)}
                  onChange={(e) =>
                    onChange(
                      withSyncedEnd(form, {
                        start: fromDateTimeParts(toDateInput(form.start), e.target.value),
                      })
                    )
                  }
                  readOnly={!canEdit}
                />
              </label>
            </div>
            {canEdit ? (
              <div className="cal-event-dur-chips" role="group" aria-label="Dauer">
                {DURATION_OPTIONS.map((min) => (
                  <button
                    key={min}
                    type="button"
                    className={`cal-event-dur-chip${
                      durationMin === min ? " cal-event-dur-chip--active" : ""
                    }`}
                    aria-pressed={durationMin === min}
                    onClick={() => onChange(withSyncedEnd(form, { durationMin: min }))}
                  >
                    {min}′
                  </button>
                ))}
              </div>
            ) : null}
            {endLabel ? (
              <p className="cal-event-quick-end">Ende {endLabel}</p>
            ) : null}
          </>
        )}

        {canEdit ? (
          <label className="cal-event-allday-inline">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => onChange({ ...form, allDay: e.target.checked })}
            />
            Ganztägig
          </label>
        ) : null}

        <details className="cal-event-modal-more">
          <summary>Mehr Optionen</summary>
          {canEdit && vorhabenOptions.length > 0 ? (
            <label className="cal-event-quick-field">
              <span>Thema</span>
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
                <option value="">Nur Kalender</option>
                {vorhabenOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {canEdit && isPlanning ? (
            <>
              <label className="cal-event-quick-field">
                <span>Art</span>
                <select
                  id="cal-ev-type"
                  value={form.cardType || "notiz"}
                  onChange={(e) => onChange({ ...form, cardType: e.target.value })}
                >
                  <option value="notiz">Termin / Notiz</option>
                  <option value="ritual">Ritual</option>
                  <option value="lektion">Lektion</option>
                </select>
              </label>
              {form.cardType === "lektion" && lektionOptions.length > 0 ? (
                <label className="cal-event-quick-field">
                  <span>Lektion</span>
                  <select
                    id="cal-ev-lek"
                    value={form.lektionId || ""}
                    onChange={(e) => {
                      const lek = lektionOptions.find((l) => l.id === e.target.value);
                      onChange(
                        withSyncedEnd({
                          ...form,
                          lektionId: e.target.value,
                          title: lek ? lek.title : form.title,
                          durationMin: lek?.durationMin ?? form.durationMin,
                        })
                      );
                    }}
                  >
                    <option value="">— wählen —</option>
                    {lektionOptions.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </>
          ) : null}

          {!form.allDay ? (
            <label className="cal-event-quick-field">
              <span>Ende</span>
              <input
                id="cal-ev-end-time"
                type="time"
                step={900}
                value={toTimeInput(form.end)}
                onChange={(e) =>
                  onChange({
                    ...form,
                    end: fromDateTimeParts(toDateInput(form.end || form.start), e.target.value),
                  })
                }
                readOnly={!canEdit}
              />
            </label>
          ) : (
            <label className="cal-event-quick-field">
              <span>Ende (Datum)</span>
              <input
                id="cal-ev-end-date"
                type="date"
                value={toDateInput(form.end)}
                onChange={(e) =>
                  onChange({
                    ...form,
                    end: new Date(`${e.target.value}T17:00`).toISOString(),
                  })
                }
                readOnly={!canEdit}
              />
            </label>
          )}

          <label className="cal-event-quick-field">
            <span>Notizen</span>
            <textarea
              id="cal-ev-notes"
              rows={2}
              value={form.notes || ""}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
              readOnly={!canEdit}
              placeholder="Optional …"
            />
          </label>
        </details>

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
      </div>

      <footer className="cal-modal-footer cal-event-modal-footer cal-event-modal-footer--quick">
        <div className="cal-event-quick-actions">
          {canDelete ? (
            <button
              type="button"
              className="cal-event-text-btn cal-event-text-btn--danger"
              onClick={onDelete}
            >
              Löschen
            </button>
          ) : null}
          <button type="button" className="cal-event-text-btn" onClick={onClose}>
            Abbrechen
          </button>
        </div>
        {canEdit ? (
          <button type="submit" className="planning-btn planning-btn--primary cal-event-quick-save">
            Speichern
          </button>
        ) : null}
      </footer>
    </>
  );
};

const CalendarEventModal = ({
  open,
  form,
  anchor = null,
  onChange,
  onClose,
  onSave,
  onDelete,
  vorhabenOptions = [],
  lektionOptions = [],
}) => {
  const titleId = useId();
  const firstFieldRef = useRef(null);
  const modalRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState(null);
  const [compactStyle, setCompactStyle] = useState(null);
  const [borderFrame, setBorderFrame] = useState(null);
  const overlayClass = useOverlayPresentation(open && expanded);

  const showCompact = !expanded;
  const isAnchored = showCompact && Boolean(anchor);
  const effectiveOverlayClass = showCompact
    ? isAnchored
      ? "cal-modal-overlay--anchored"
      : "cal-modal-overlay--compact-standalone"
    : overlayClass || "app-overlay--float-panel";

  useEffect(() => {
    if (!open) {
      setExpanded(false);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !showCompact || !modalRef.current) {
      setPopoverStyle(null);
      setCompactStyle(null);
      setBorderFrame(null);
      return undefined;
    }

    const updateLayout = () => {
      const el = modalRef.current;
      if (!el) {
        return;
      }
      const width = measureCompactPopoverWidth(el, form?.title);
      el.style.width = `${width}px`;
      el.style.maxWidth = `${width}px`;

      const height = Math.max(el.offsetHeight, el.getBoundingClientRect().height);

      if (isAnchored && anchor) {
        const layout = computeAnchoredPopoverStyle(anchor, { width, height });
        const { beakSide: side, beakTop, top, left, width: panelWidth, maxHeight } = layout;
        setPopoverStyle({
          top,
          left,
          width: panelWidth,
          maxHeight,
        });
        setBorderFrame(
          POPOVER_BEAK_ENABLED && side && side !== "none"
            ? { width, height, beakTop, side }
            : null
        );
        setCompactStyle(null);
      } else {
        setPopoverStyle(null);
        setBorderFrame(null);
        setCompactStyle({ width, maxWidth: width });
      }
    };

    updateLayout();
    const raf = window.requestAnimationFrame(updateLayout);
    const ro = new ResizeObserver(updateLayout);
    ro.observe(modalRef.current);
    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, true);
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout, true);
      if (modalRef.current) {
        modalRef.current.style.width = "";
        modalRef.current.style.maxWidth = "";
      }
    };
  }, [open, showCompact, isAnchored, anchor, form?.title, form]);

  useEffect(() => {
    if (open) {
      firstFieldRef.current?.focus();
    }
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
  const modalStyle = {
    ...(showCompact && compactStyle ? compactStyle : {}),
    ...(isAnchored && popoverStyle ? popoverStyle : {}),
  };
  return (
    <div
      className={`cal-modal-overlay cal-event-modal-overlay ${effectiveOverlayClass}`}
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={`cal-modal cal-event-modal${showCompact ? " cal-event-modal--compact" : ""}${
          borderFrame ? " cal-event-modal--beaked" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={Object.keys(modalStyle).length ? modalStyle : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {showCompact ? (
          <form
            className="cal-modal-form cal-event-modal-form cal-event-modal-form--quick"
            onSubmit={(e) => {
              e.preventDefault();
              if (canEdit) {
                onSave();
              }
            }}
          >
            <CompactEventForm
              form={form}
              canEdit={canEdit}
              canDelete={canDelete}
              isPlanning={isPlanning}
              vorhabenOptions={vorhabenOptions}
              lektionOptions={lektionOptions}
              onChange={onChange}
              onClose={onClose}
              onDelete={onDelete}
              onExpand={() => setExpanded(true)}
              titleId={titleId}
              firstFieldRef={firstFieldRef}
            />
          </form>
        ) : (
          <>
            <header className="cal-modal-header cal-event-modal-header">
              <div className="cal-event-modal-head-text">
                {form.mode === "edit" ? (
                  <p className="cal-event-modal-eyebrow">
                    Bearbeiten
                    {form.cardType ? ` · ${cardTypeLabel(form.cardType)}` : ""}
                  </p>
                ) : null}
                <h2 id={titleId} className="cal-modal-title">
                  {form.mode === "create" ? "Neuer Termin" : form.title || "Termin"}
                </h2>
              </div>
              <div className="cal-event-modal-header-actions">
                <button
                  type="button"
                  className="cal-event-quick-expand"
                  onClick={() => setExpanded(false)}
                  aria-label="Kompakte Ansicht"
                  title="Verkleinern"
                >
                  ⤡
                </button>
                <button
                  type="button"
                  className="cal-modal-close"
                  onClick={onClose}
                  aria-label="Schliessen"
                >
                  ×
                </button>
              </div>
            </header>

            <form
              className="cal-modal-form cal-event-modal-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (canEdit) {
                  onSave();
                }
              }}
            >
              <div className="cal-event-modal-body">
                {form.vorhabenTitle || form.fach ? (
                  <p className="cal-modal-meta">
                    {form.vorhabenTitle ? (
                      <span className="cal-modal-meta-badge">{form.vorhabenTitle}</span>
                    ) : null}
                    {form.fach ? <span className="cal-modal-meta-sub">{form.fach}</span> : null}
                    {form.templateLabel ? (
                      <span className="cal-modal-meta-sub">{form.templateLabel}</span>
                    ) : null}
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
                    placeholder="Bezeichnung des Termins"
                  />
                </div>

                {canEdit && vorhabenOptions.length > 0 ? (
                  <div className="cal-modal-field">
                    <label htmlFor="cal-ev-vorhaben">Thema</label>
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
                            onChange(
                              withSyncedEnd({
                                ...form,
                                lektionId: e.target.value,
                                title: lek ? lek.title : form.title,
                                durationMin: lek?.durationMin ?? form.durationMin,
                              })
                            );
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
                        form.allDay ? form.start?.slice(0, 10) : toLocalInput(form.start)
                      }
                      onChange={(e) => {
                        const start = form.allDay
                          ? new Date(`${e.target.value}T08:00`).toISOString()
                          : fromLocalInput(e.target.value);
                        onChange(
                          form.allDay ? { ...form, start } : withSyncedEnd(form, { start })
                        );
                      }}
                      readOnly={!canEdit}
                    />
                  </div>
                  <div className="cal-modal-field">
                    <label htmlFor="cal-ev-end">Ende</label>
                    <input
                      id="cal-ev-end"
                      type={form.allDay ? "date" : "datetime-local"}
                      value={form.allDay ? form.end?.slice(0, 10) : toLocalInput(form.end)}
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
                        onChange(withSyncedEnd(form, { durationMin: Number(e.target.value) }))
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
              </div>

              <footer className="cal-modal-footer cal-event-modal-footer">
                {canDelete ? (
                  <button
                    type="button"
                    className="planning-btn planning-btn--ghost cal-modal-delete"
                    onClick={onDelete}
                  >
                    Löschen
                  </button>
                ) : (
                  <span />
                )}
                <div className="cal-modal-footer-right">
                  <button type="button" className="planning-btn planning-btn--ghost" onClick={onClose}>
                    Abbrechen
                  </button>
                  {canEdit ? (
                    <button type="submit" className="planning-btn planning-btn--primary">
                      Speichern
                    </button>
                  ) : null}
                </div>
              </footer>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarEventModal;
