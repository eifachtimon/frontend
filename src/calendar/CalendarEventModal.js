import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BEAK_HALF,
  computeAnchoredPopoverStyle,
  computeStandalonePopoverStyle,
  measureCompactPopoverWidth,
} from "./calendarEventAnchor";
import { withVorhabenAssignment } from "./calendarEventResolve";
import ThemePickerCompact from "./ThemePickerCompact";
import useOverlayPresentation from "../ui/useOverlayPresentation";

const DURATION_OPTIONS = [5, 10, 15, 30, 45, 60, 90];

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
  vorhabenOptions,
  onChange,
  onClose,
  onDelete,
  onExpand,
  themeInputId,
  themeListId,
  onCreateVorhaben,
  onFachChange,
  onThemeSelect,
  planningStore,
  titleId,
  firstFieldRef,
}) => {
  const durationMin = getDurationMin(form);

  const handleEndTimeChange = (e) => {
    const newEnd = fromDateTimeParts(
      toDateInput(form.end || form.start),
      e.target.value
    );
    const startMs = new Date(form.start).getTime();
    const endMs = new Date(newEnd).getTime();
    const diffMin = Math.max(5, Math.round((endMs - startMs) / 60000));
    onChange({
      ...form,
      end: newEnd,
      durationMin: diffMin,
    });
  };

  const handleToggleAllDay = () => {
    if (form.allDay) {
      onChange(withSyncedEnd({ ...form, allDay: false }));
      return;
    }
    onChange({ ...form, allDay: true });
  };

  const renderDurationChip = (min) => (
    <button
      key={min}
      type="button"
      className={`cal-event-dur-chip${
        !form.allDay && durationMin === min ? " cal-event-dur-chip--active" : ""
      }`}
      aria-pressed={!form.allDay && durationMin === min}
      onClick={() =>
        onChange(withSyncedEnd({ ...form, allDay: false }, { durationMin: min }))
      }
    >
      {min}′
    </button>
  );

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
          className="cal-event-quick-header-btn cal-event-quick-expand"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          aria-label="Erweiterte Ansicht"
          title="Erweitern"
        >
          ⤢
        </button>
      </header>

      {canEdit ? (
        <div className="cal-event-theme-block cal-event-theme-block--compact">
          <ThemePickerCompact
            vorhabenOptions={vorhabenOptions}
            selectedId={form.vorhabenId || ""}
            draftFach={
              form.mode === "create"
                ? form.draftFach || ""
                : form.draftFach || form.fach || ""
            }
            themeInputId={themeInputId}
            listId={themeListId}
            onCreateVorhaben={onCreateVorhaben}
            onFachChange={onFachChange}
            onSelect={onThemeSelect}
            onClear={() =>
              onChange(
                withVorhabenAssignment(
                  { ...form, draftFach: "", fach: "" },
                  "",
                  planningStore,
                  vorhabenOptions
                )
              )
            }
          />
        </div>
      ) : null}

      <div className="cal-event-modal-body cal-event-modal-body--quick">
        {!canEdit && form.vorhabenTitle ? (
          <p className="cal-event-quick-meta">{form.vorhabenTitle}</p>
        ) : null}

        <div
          className={`cal-event-quick-when${
            form.allDay ? " cal-event-quick-when--allday" : ""
          }`}
        >
          <label className="cal-event-quick-field cal-event-quick-field--inline">
            <span>Datum</span>
            <input
              id="cal-ev-start-date"
              type="date"
              value={toDateInput(form.start)}
              onChange={(e) =>
                onChange(
                  form.allDay
                    ? {
                        ...form,
                        start: new Date(`${e.target.value}T08:00`).toISOString(),
                      }
                    : withSyncedEnd(form, {
                        start: fromDateTimeParts(
                          e.target.value,
                          toTimeInput(form.start)
                        ),
                      })
                )
              }
              readOnly={!canEdit}
            />
          </label>
          {!form.allDay ? (
            <div className="cal-event-quick-field cal-event-quick-field--inline cal-event-quick-field--time-col">
              <span id="cal-ev-time-range-label">Zeit</span>
              <div
                className="cal-event-time-range"
                role="group"
                aria-labelledby="cal-ev-time-range-label"
              >
                <input
                  id="cal-ev-start-time"
                  type="time"
                  step={300}
                  className="cal-event-time-range-input"
                  value={toTimeInput(form.start)}
                  onChange={(e) =>
                    onChange(
                      withSyncedEnd(form, {
                        start: fromDateTimeParts(
                          toDateInput(form.start),
                          e.target.value
                        ),
                      })
                    )
                  }
                  readOnly={!canEdit}
                  aria-label="Beginn"
                />
                <span className="cal-event-time-range-sep" aria-hidden="true">
                  –
                </span>
                <input
                  id="cal-ev-end-time"
                  type="time"
                  step={300}
                  className="cal-event-time-range-input"
                  value={toTimeInput(form.end)}
                  onChange={handleEndTimeChange}
                  readOnly={!canEdit}
                  aria-label="Ende"
                />
              </div>
            </div>
          ) : null}
        </div>

        {canEdit ? (
          <div className="cal-event-quick-duration">
            <div className="cal-event-dur-chips cal-event-dur-chips--row" role="group" aria-label="Dauer in Minuten">
              {DURATION_OPTIONS.map(renderDurationChip)}
            </div>
            <div className="cal-event-dur-chips cal-event-dur-chips--allday">
              <button
                type="button"
                className={`cal-event-dur-chip cal-event-dur-chip--allday${
                  form.allDay ? " cal-event-dur-chip--active" : ""
                }`}
                aria-pressed={form.allDay}
                onClick={handleToggleAllDay}
              >
                Ganztägig
              </button>
            </div>
          </div>
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
          <button
            type="button"
            className="cal-event-text-btn cal-event-text-btn--cancel"
            onClick={onClose}
          >
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
  planningStore = null,
  onCreateVorhaben,
}) => {
  const titleId = useId();
  const themeInputId = useId();
  const themeListId = useId();
  const firstFieldRef = useRef(null);
  const modalRef = useRef(null);
  const anchoredLeftRef = useRef({ key: "", left: null });
  const layoutWidthLockRef = useRef(null);
  const layoutAnchorKeyRef = useRef("");
  const [expanded, setExpanded] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState(null);
  const [compactStyle, setCompactStyle] = useState(null);
  const [borderFrame, setBorderFrame] = useState(null);
  const [viewportClamped, setViewportClamped] = useState(false);
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
      setViewportClamped(false);
      layoutWidthLockRef.current = null;
      layoutAnchorKeyRef.current = "";
      return;
    }
  }, [open]);

  const anchorLayoutKey =
    anchor &&
    `${Math.round(anchor.top)}|${Math.round(anchor.left)}|${Math.round(anchor.width)}|${Math.round(anchor.height)}`;

  useLayoutEffect(() => {
    if (!open || !showCompact || !modalRef.current) {
      setPopoverStyle(null);
      setCompactStyle(null);
      setBorderFrame(null);
      setViewportClamped(false);
      return undefined;
    }

    if (anchorLayoutKey !== layoutAnchorKeyRef.current) {
      layoutAnchorKeyRef.current = anchorLayoutKey || "";
      layoutWidthLockRef.current = null;
      anchoredLeftRef.current = { key: "", left: null };
    }
    const el = modalRef.current;
    let frameId = 0;
    let widthFrameId = 0;
    let lastAppliedWidth = "";
    let lastPopoverKey = "";
    let lastBorderKey = "";
    let lastCompactKey = "";

    const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

    const applyLayout = (remeasureWidth = false) => {
      if (!modalRef.current) {
        return;
      }
      const node = modalRef.current;
      let width;
      if (layoutWidthLockRef.current != null && !remeasureWidth) {
        width = layoutWidthLockRef.current;
      } else {
        const measured = measureCompactPopoverWidth(node, form?.title);
        width =
          layoutWidthLockRef.current == null
            ? measured
            : Math.max(layoutWidthLockRef.current, measured);
        layoutWidthLockRef.current = width;
      }
      const widthPx = `${width}px`;
      if (lastAppliedWidth !== widthPx) {
        lastAppliedWidth = widthPx;
        node.style.width = widthPx;
        node.style.maxWidth = widthPx;
      }

      const height = Math.max(
        node.scrollHeight,
        node.offsetHeight,
        node.getBoundingClientRect().height
      );

      if (isAnchored && anchor) {
        const anchorKey = `${Math.round(anchor.top)}|${Math.round(anchor.left)}|${Math.round(anchor.width)}|${Math.round(anchor.height)}`;
        if (anchoredLeftRef.current.key !== anchorKey) {
          anchoredLeftRef.current = { key: anchorKey, left: null };
        }
        const layout = computeAnchoredPopoverStyle(anchor, {
          width,
          height,
        });
        const {
          beakSide: side,
          beakTop,
          top,
          left,
          width: panelWidth,
          maxHeight,
          clamped,
        } = layout;
        if (anchoredLeftRef.current.left === null) {
          anchoredLeftRef.current.left = left;
        }
        const vw = window.innerWidth;
        const margin = 12;
        const popLeft = clampValue(
          anchoredLeftRef.current.left,
          margin,
          Math.max(margin, vw - margin - panelWidth)
        );
        const popoverKey = `${top}|${popLeft}|${panelWidth}|${maxHeight || 0}|${clamped ? 1 : 0}`;
        const borderKey =
          side && side !== "none" ? `${beakTop}|${side}` : "none";

        if (popoverKey !== lastPopoverKey) {
          lastPopoverKey = popoverKey;
          setPopoverStyle({
            top,
            left: popLeft,
            width: panelWidth,
            ...(maxHeight ? { maxHeight, "--cal-popover-max-h": `${maxHeight}px` } : {}),
          });
          setViewportClamped(Boolean(clamped));
        }
        if (borderKey !== lastBorderKey) {
          lastBorderKey = borderKey;
          setBorderFrame(
            side && side !== "none" ? { beakTop, side } : null
          );
        }
        if (lastCompactKey !== "") {
          lastCompactKey = "";
          setCompactStyle(null);
        }
      } else {
        const standalone = computeStandalonePopoverStyle({ width, height });
        const compactKey = `${standalone.width}|${standalone.maxHeight || 0}|${standalone.clamped ? 1 : 0}`;
        if (lastPopoverKey !== "") {
          lastPopoverKey = "";
          setPopoverStyle(null);
        }
        if (lastBorderKey !== "") {
          lastBorderKey = "";
          setBorderFrame(null);
        }
        if (compactKey !== lastCompactKey) {
          lastCompactKey = compactKey;
          setCompactStyle({
            width: standalone.width,
            maxWidth: standalone.width,
            ...(standalone.maxHeight
              ? {
                  maxHeight: standalone.maxHeight,
                  "--cal-popover-max-h": `${standalone.maxHeight}px`,
                }
              : {}),
          });
          setViewportClamped(Boolean(standalone.clamped));
        }
      }
    };

    const scheduleLayout = (remeasureWidth = false) => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        applyLayout(remeasureWidth);
      });
    };

    const scheduleWidthRemeasure = () => {
      if (widthFrameId) {
        window.clearTimeout(widthFrameId);
      }
      widthFrameId = window.setTimeout(() => {
        widthFrameId = 0;
        scheduleLayout(true);
      }, 120);
    };

    applyLayout(true);
    const ro = new ResizeObserver(() => scheduleLayout(false));
    ro.observe(el);
    const titleInput = el.querySelector(".cal-event-quick-title");
    const titleRo = titleInput
      ? new ResizeObserver(() => scheduleWidthRemeasure())
      : null;
    titleRo?.observe(titleInput);
    const themeBlock = el.querySelector(".cal-event-theme-block");
    if (themeBlock) {
      ro.observe(themeBlock);
    }
    const onWinResize = () => scheduleLayout(true);
    const onWinScroll = () => scheduleLayout(false);
    window.addEventListener("resize", onWinResize);
    window.addEventListener("scroll", onWinScroll, true);
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      if (widthFrameId) {
        window.clearTimeout(widthFrameId);
      }
      ro.disconnect();
      titleRo?.disconnect();
      window.removeEventListener("resize", onWinResize);
      window.removeEventListener("scroll", onWinScroll, true);
      anchoredLeftRef.current = { key: "", left: null };
      if (modalRef.current) {
        modalRef.current.style.width = "";
        modalRef.current.style.maxWidth = "";
      }
    };
  }, [
    open,
    showCompact,
    isAnchored,
    anchor,
    anchorLayoutKey,
    form?.allDay,
    form?.title,
    form?.draftFach,
    form?.vorhabenId,
    form?.mode,
  ]);

  useEffect(() => {
    if (open) {
      firstFieldRef.current?.focus();
    }
  }, [open, form?.mode]);

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
    ...(borderFrame
      ? { "--cal-beak-top": `${borderFrame.beakTop + BEAK_HALF}px` }
      : {}),
  };

  const handleFachChange = (fachName) => {
    if (!fachName) {
      if (form.mode === "edit" && form.cardId) {
        onChange({ ...form, draftFach: "", fach: "" });
        return;
      }
      onChange(
        withVorhabenAssignment(
          { ...form, draftFach: "", fach: "" },
          "",
          planningStore,
          vorhabenOptions
        )
      );
      return;
    }
    if (form.mode === "edit" && form.cardId && form.vorhabenId) {
      onChange({ ...form, draftFach: fachName });
      return;
    }
    onChange({
      ...withVorhabenAssignment(form, "", planningStore, vorhabenOptions),
      draftFach: fachName,
    });
  };

  const handleThemeSelect = (vorhabenId) => {
    const updated = withVorhabenAssignment(
      form,
      vorhabenId,
      planningStore,
      vorhabenOptions
    );
    const vorhaben = vorhabenOptions.find((v) => v.id === vorhabenId);
    onChange({
      ...updated,
      draftFach: vorhaben?.fach || form.draftFach || "",
    });
  };

  const compactQuickForm = (
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
        vorhabenOptions={vorhabenOptions}
        onChange={onChange}
        onClose={onClose}
        onDelete={onDelete}
        onExpand={() => setExpanded(true)}
        themeInputId={themeInputId}
        themeListId={themeListId}
        onCreateVorhaben={onCreateVorhaben}
        onFachChange={handleFachChange}
        onThemeSelect={handleThemeSelect}
        planningStore={planningStore}
        titleId={titleId}
        firstFieldRef={firstFieldRef}
      />
    </form>
  );

  return (
    <div
      className={`cal-modal-overlay cal-event-modal-overlay cal-modal-overlay--pass-through ${effectiveOverlayClass}`}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`cal-modal cal-event-modal${showCompact ? " cal-event-modal--compact" : ""}${
          viewportClamped ? " cal-event-modal--viewport-clamped" : ""
        }${
          borderFrame
            ? ` cal-event-modal--beaked${
                borderFrame.side === "left"
                  ? " cal-event-modal--beak-left"
                  : borderFrame.side === "right"
                    ? " cal-event-modal--beak-right"
                    : ""
              }`
            : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={Object.keys(modalStyle).length ? modalStyle : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {showCompact ? compactQuickForm : (
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
                {!canEdit && (form.vorhabenTitle || form.fach) ? (
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

                {canEdit ? (
                  <div className="cal-modal-field cal-modal-field--theme">
                    <ThemePickerCompact
                      vorhabenOptions={vorhabenOptions}
                      selectedId={form.vorhabenId || ""}
                      draftFach={
                        form.mode === "create"
                          ? form.draftFach || ""
                          : form.draftFach || form.fach || ""
                      }
                      themeInputId={`${themeInputId}-expanded`}
                      listId={`${themeListId}-expanded`}
                      onCreateVorhaben={onCreateVorhaben}
                      onFachChange={handleFachChange}
                      onSelect={handleThemeSelect}
                      onClear={() =>
                        onChange(
                          withVorhabenAssignment(
                            { ...form, draftFach: "", fach: "" },
                            "",
                            planningStore,
                            vorhabenOptions
                          )
                        )
                      }
                    />
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
