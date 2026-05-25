import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import deLocale from "@fullcalendar/core/locales/de";
import {
  addDayCard,
  addLektion,
  getOrCreateWeek,
  getIsoWeek,
  getVorhabenById,
  linkLektionToWeekDay,
} from "../planning/planningStore";
import { filterCalendarEvents } from "./calendarFilters";
import {
  allVorhabenToCalendarEvents,
  localToCalendarEvents,
  subscriptionToCalendarEvents,
} from "./planningEvents";
import {
  applyEventDropToPlanningStore,
  dropLektionOnCalendarAtPointer,
} from "./calendarActions";
import { slotFromCalendarPointer } from "./calendarDropFromPointer";
import { hasLektionDrag, readLektionDragId } from "../planning/planningDragMime";
import { applyStundenplanEventDrop } from "./stundenplanActions";
import { updateLocalEvent, upsertStundenplanSlot } from "./calendarStore";
import {
  applyFachEventElementStyles,
  resolvePlanningEventColors,
} from "../planning/fachColors";
import {
  DRAFT_PREVIEW_DEFAULT_TITLE,
  DRAFT_PREVIEW_EVENT_ID,
  formToDraftPreviewEvent,
  LEKTION_DRAG_PREVIEW_EVENT_ID,
  lektionDragPreviewToEvent,
} from "./calendarEventResolve";
import {
  accentForExternalKind,
  externalDragEventData,
  withBauhausEventStyle,
} from "./calendarEventStyles";
import {
  findStundenplanSlotAt,
  slotFromFcEvent,
  stundenplanToCalendarEvents,
} from "./stundenplanEvents";

/** FullCalendar nutzt fc-event-mirror sowohl für neue Auswahl als auch für Event-Drag. */
const isNewAppointmentSelectMirror = (info) => {
  const props = info.event.extendedProps || {};
  if (props.isDraftPreview) {
    return false;
  }
  const isMirror =
    Boolean(info.isMirror) ||
    info.event.classNames?.includes?.("fc-event-mirror") ||
    info.el?.classList?.contains?.("fc-event-mirror");
  if (!isMirror) {
    return false;
  }
  const eventId = String(info.event.id || "");
  if (/^(local-|plan-)/.test(eventId)) {
    return false;
  }
  if (
    props.source &&
    ["planning", "local", "subscription", "stundenplan"].includes(props.source)
  ) {
    return false;
  }
  if (props.source?.startsWith?.("external")) {
    return false;
  }
  const classNames = info.event.classNames || [];
  if (
    classNames.includes("cal-event--drag-preview") ||
    classNames.includes("cal-event--active-drag")
  ) {
    return false;
  }
  return true;
};

const formatDayHeaderHtml = (date, viewType) => {
  const isDayHeader = viewType === "timeGridDay";
  const weekday = date.toLocaleDateString("de-DE", {
    weekday: isDayHeader ? "long" : "short",
  });
  if (viewType === "dayGridMonth") {
    return `<span class="cal-day-head-weekday">${weekday}</span>`;
  }
  const dateLine = isDayHeader
    ? date.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : date.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "numeric",
      });
  const mod = isDayHeader ? " cal-day-head--day-view" : " cal-day-head--week-view";
  return `<div class="cal-day-head${mod}"><span class="cal-day-head-weekday">${weekday}</span><span class="cal-day-head-date">${dateLine}</span></div>`;
};

const buildWeekBadgeEl = (kw, year, extraClass = "") => {
  const badge = document.createElement("div");
  badge.className = `cal-week-badge${extraClass ? ` ${extraClass}` : ""}`;
  badge.setAttribute("aria-label", `Kalenderwoche ${kw}, ${year}`);
  badge.innerHTML = `<span class="cal-week-badge-kw">KW ${kw}</span><span class="cal-week-badge-year">${year}</span>`;
  return badge;
};

const applyDragAccent = (el, accent) => {
  if (!el || !accent) {
    return;
  }
  el.style.setProperty("--cal-event-accent", accent);
};

const CalendarView = forwardRef(
  (
    {
      planningStore,
      saveVorhaben,
      calendarStore,
      onCalendarStoreChange,
      filters,
      draftVorhabenId,
      rituals = [],
      onEventClick,
      onDateSelect,
      onDateClick,
      onStundenplanSlotClick,
      showExternalEvents = false,
      showDragStrip,
      compactExternal = false,
      spacious = false,
      height = "100%",
      /** Einzeltag ohne Toolbar (Home) */
      dayView = false,
      /** @deprecated — alias für dayView */
      dayViewToday = false,
      /** FullCalendar-Ansicht (z. B. timeGridWeek) */
      initialView: initialViewProp,
      /** Kein gelbes Heute-Raster (Home) */
      muteTodayHighlight = false,
      initialDate,
      /** Formular „Neuer Termin“ → Live-Vorschau im Raster */
      draftPreviewForm = null,
      onDraftPreviewMount = null,
      /** { lektionId, vorhabenId, slot } — Pointer-Drag aus Themen-Übersicht */
      lektionDragPreview = null,
      focusedFcEventId = null,
    },
    ref
  ) => {
    const calendarRef = useRef(null);
    const wrapRef = useRef(null);
    const externalRef = useRef(null);
    const [measuredHeight, setMeasuredHeight] = useState(null);
    const isDayView = dayView || dayViewToday;
    const dayAnchor = useMemo(() => {
      const d = initialDate ? new Date(initialDate) : new Date();
      if (Number.isNaN(d.getTime())) {
        return new Date();
      }
      return d;
    }, [initialDate]);

    useEffect(() => {
      if (!isDayView || !initialDate) {
        return;
      }
      const api = calendarRef.current?.getApi?.();
      if (api) {
        api.gotoDate(dayAnchor);
      }
    }, [isDayView, initialDate, dayAnchor]);

    const [visibleRange, setVisibleRange] = useState(() => {
      const now = initialDate ? new Date(initialDate) : new Date();
      if (isDayView) {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { start, end };
      }
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      const end = new Date(now);
      end.setDate(end.getDate() + 21);
      return { start, end };
    });

    useImperativeHandle(ref, () => ({
      getApi: () => calendarRef.current?.getApi?.(),
    }));

    useEffect(() => {
      if (height !== "100%") {
        setMeasuredHeight(null);
        return undefined;
      }
      const el = wrapRef.current;
      if (!el) {
        return undefined;
      }
      const measure = () => {
        const next = Math.floor(el.getBoundingClientRect().height);
        if (next > 120) {
          setMeasuredHeight((prev) => (prev === next ? prev : next));
        }
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      window.addEventListener("resize", measure);
      const t = window.setTimeout(measure, 50);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", measure);
        window.clearTimeout(t);
      };
    }, [height]);

    useEffect(() => {
      if (!measuredHeight) {
        return;
      }
      calendarRef.current?.getApi?.()?.updateSize();
    }, [measuredHeight]);

    const planningEvents = useMemo(
      () => allVorhabenToCalendarEvents(planningStore?.vorhaben || []),
      [planningStore?.vorhaben]
    );

    const subscriptionEvents = useMemo(() => {
      const list = [];
      for (const sub of calendarStore.subscriptions || []) {
        list.push(
          ...subscriptionToCalendarEvents(
            sub,
            calendarStore.subscriptionCache?.[sub.id]
          )
        );
      }
      return list;
    }, [calendarStore.subscriptions, calendarStore.subscriptionCache]);

    const localEvents = useMemo(
      () => localToCalendarEvents(calendarStore.localEvents),
      [calendarStore.localEvents]
    );

    const stundenplanEvents = useMemo(() => {
      if (filters?.showStundenplan === false || !calendarStore.stundenplan?.enabled) {
        return [];
      }
      const raw = stundenplanToCalendarEvents(
        calendarStore.stundenplan,
        visibleRange.start,
        visibleRange.end
      );
      return raw.map((ev) => {
        const vid = ev.extendedProps?.vorhabenId;
        if (!vid) {
          return ev;
        }
        const v = getVorhabenById(planningStore, vid);
        if (!v?.fach) {
          return ev;
        }
        const colors = resolvePlanningEventColors(v, "lektion");
        return withBauhausEventStyle({
          ...ev,
          extendedProps: {
            ...ev.extendedProps,
            fach: v.fach,
            vorhabenId: v.id,
            eventAccent: colors.accent || ev.extendedProps?.eventAccent,
            eventBg: colors.bg,
          },
        });
      });
    }, [
      calendarStore.stundenplan,
      planningStore?.vorhaben,
      visibleRange.start,
      visibleRange.end,
      filters?.showStundenplan,
    ]);

    const draftPreviewEvent = useMemo(
      () => formToDraftPreviewEvent(draftPreviewForm, planningStore),
      [draftPreviewForm, planningStore]
    );

    const allEvents = useMemo(() => {
      const merged = [...subscriptionEvents, ...localEvents, ...planningEvents];
      const filtered = filterCalendarEvents(merged, filters);
      const base = [...stundenplanEvents, ...filtered];
      return draftPreviewEvent ? [...base, draftPreviewEvent] : base;
    }, [
      subscriptionEvents,
      localEvents,
      planningEvents,
      stundenplanEvents,
      filters,
      draftPreviewEvent,
    ]);

    useEffect(() => {
      if (lektionDragPreview?.slot) {
        document.body.classList.add("cal-lektion-drag-preview-active");
      } else {
        document.body.classList.remove("cal-lektion-drag-preview-active");
      }
      return () => document.body.classList.remove("cal-lektion-drag-preview-active");
    }, [lektionDragPreview]);

    useEffect(() => {
      const api = calendarRef.current?.getApi?.();
      if (!api) {
        return undefined;
      }

      const preview = lektionDragPreviewToEvent(lektionDragPreview, planningStore);
      const existing = api.getEventById(LEKTION_DRAG_PREVIEW_EVENT_ID);

      if (!preview) {
        existing?.remove();
        return undefined;
      }

      if (existing) {
        existing.setProp("title", preview.title);
        existing.setDates(preview.start, preview.end);
        return undefined;
      }

      api.addEvent(preview);
      return () => {
        api.getEventById(LEKTION_DRAG_PREVIEW_EVENT_ID)?.remove();
      };
    }, [lektionDragPreview, planningStore]);

    useLayoutEffect(() => {
      if (!draftPreviewForm || draftPreviewForm.mode !== "create") {
        document.body.classList.remove("cal-draft-preview-active");
        return undefined;
      }
      document.body.classList.add("cal-draft-preview-active");

      let frame = 0;
      const unselectWhenDraftReady = () => {
        const api = calendarRef.current?.getApi?.();
        const draftEl = api?.getEventById(DRAFT_PREVIEW_EVENT_ID)?.el;
        if (draftEl) {
          api?.unselect?.();
          return;
        }
        frame = window.requestAnimationFrame(unselectWhenDraftReady);
      };
      frame = window.requestAnimationFrame(unselectWhenDraftReady);

      return () => {
        window.cancelAnimationFrame(frame);
        document.body.classList.remove("cal-draft-preview-active");
      };
    }, [draftPreviewForm]);

    useEffect(() => {
      const api = calendarRef.current?.getApi?.();
      if (!draftPreviewForm) {
        return;
      }
      const ev = api?.getEventById(DRAFT_PREVIEW_EVENT_ID);
      if (!ev) {
        return;
      }
      const title = draftPreviewForm.title?.length
        ? draftPreviewForm.title
        : DRAFT_PREVIEW_DEFAULT_TITLE;
      ev.setProp("title", title);
      ev.setAllDay(Boolean(draftPreviewForm.allDay));
      if (draftPreviewForm.start) {
        ev.setStart(draftPreviewForm.start);
      }
      const end =
        draftPreviewForm.end ||
        new Date(
          new Date(draftPreviewForm.start).getTime() +
            (draftPreviewForm.durationMin || 45) * 60000
        ).toISOString();
      ev.setEnd(end);

      const preview = formToDraftPreviewEvent(draftPreviewForm, planningStore);
      if (preview?.extendedProps) {
        Object.entries(preview.extendedProps).forEach(([key, value]) => {
          ev.setExtendedProp(key, value);
        });
      }
      if (preview?.classNames) {
        ev.setProp("classNames", preview.classNames);
      }
      const el = ev.el;
      if (el && preview?.extendedProps) {
        el.classList.remove("cal-event--plain", "cal-event--fach");
        Array.from(el.classList)
          .filter((cls) => cls.startsWith("fach-tone"))
          .forEach((cls) => el.classList.remove(cls));
        el.style.removeProperty("--cal-event-bg");
        if (preview.extendedProps.plain) {
          el.classList.add("cal-event--plain");
          applyDragAccent(el, "#121212");
        } else {
          applyFachEventElementStyles(
            el,
            preview.extendedProps.fach,
            preview.extendedProps.vorhabenId,
            preview.extendedProps.cardType
          );
          applyDragAccent(el, preview.extendedProps.eventAccent);
        }
      }
    }, [draftPreviewForm, planningStore]);

    useEffect(() => {
      if (!draftPreviewForm || !onDraftPreviewMount) {
        return undefined;
      }
      const frame = window.requestAnimationFrame(() => {
        const api = calendarRef.current?.getApi?.();
        const el = api?.getEventById(DRAFT_PREVIEW_EVENT_ID)?.el;
        if (el) {
          onDraftPreviewMount(el);
        }
      });
      return () => window.cancelAnimationFrame(frame);
    }, [
      draftPreviewForm?.start,
      draftPreviewForm?.end,
      draftPreviewForm?.allDay,
      onDraftPreviewMount,
    ]);

    const draftVorhaben = draftVorhabenId
      ? getVorhabenById(planningStore, draftVorhabenId)
      : planningStore?.vorhaben?.[0] || null;

    const setupDraggable = useCallback(
      (containerEl) => {
        if (!containerEl) {
          return undefined;
        }
        return new Draggable(containerEl, {
          itemSelector: ".fc-external-event:not(.cal-external-event--add):not(.thema-lek-card)",
          eventData: (eventEl) =>
            externalDragEventData(eventEl, draftVorhabenId, draftVorhaben?.fach),
        });
      },
      [draftVorhabenId, draftVorhaben?.fach]
    );

    useEffect(() => {
      const draggables = [];
      if (showExternalEvents && externalRef.current) {
        draggables.push(setupDraggable(externalRef.current));
      }
      return () => draggables.forEach((d) => d?.destroy?.());
    }, [showExternalEvents, setupDraggable]);

    const calHostRef = useRef(null);

    const handleCalendarHostDragOver = useCallback((e) => {
      if (!hasLektionDrag(e.dataTransfer)) {
        return;
      }
      e.preventDefault();
      const slot = slotFromCalendarPointer(calHostRef.current, e.clientX, e.clientY);
      e.dataTransfer.dropEffect = slot ? "copy" : "none";
    }, []);

    const handleCalendarHostDrop = useCallback(
      (e) => {
        if (!hasLektionDrag(e.dataTransfer)) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        const lektionId = readLektionDragId(e.dataTransfer);
        dropLektionOnCalendarAtPointer({
          planningStore,
          draftVorhabenId,
          lektionId,
          clientX: e.clientX,
          clientY: e.clientY,
          calendarRoot: calHostRef.current,
          saveVorhaben,
        });
      },
      [planningStore, draftVorhabenId, saveVorhaben]
    );

    useEffect(() => {
      const onPointerDown = (e) => {
        const el = e.target.closest?.(".fc-external-event");
        if (
          !el ||
          el.classList.contains("cal-external-event--add") ||
          el.classList.contains("thema-lek-card")
        ) {
          return;
        }
        const kind = el.dataset.kind || "generic";
        applyFachEventElementStyles(
          el,
          draftVorhaben?.fach,
          draftVorhabenId,
          kind
        );
        applyDragAccent(
          el,
          accentForExternalKind(kind, draftVorhabenId, draftVorhaben?.fach)
        );
        el.classList.add("fc-external-event--lifting");
        document.body.classList.add("cal-is-dragging");
      };
      const clearDragChrome = () => {
        document.body.classList.remove("cal-is-dragging");
        document.querySelectorAll(".fc-external-event--lifting").forEach((node) => {
          node.classList.remove("fc-external-event--lifting");
        });
      };
      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("pointerup", clearDragChrome);
      document.addEventListener("pointercancel", clearDragChrome);
      return () => {
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("pointerup", clearDragChrome);
        document.removeEventListener("pointercancel", clearDragChrome);
        clearDragChrome();
      };
    }, [draftVorhabenId, draftVorhaben?.fach]);

    const handleEventDragStart = useCallback((info) => {
      document.body.classList.add("cal-is-dragging");
      info.el.classList.add("cal-event--active-drag");
      applyDragAccent(info.el, info.event.extendedProps?.eventAccent);
    }, []);

    const handleEventDragStop = useCallback(() => {
      document.body.classList.remove("cal-is-dragging");
      document.querySelectorAll(".cal-event--active-drag").forEach((el) => {
        el.classList.remove("cal-event--active-drag");
      });
    }, []);

    const handleEventResizeStart = useCallback((info) => {
      document.body.classList.add("cal-is-resizing");
      applyDragAccent(info.el, info.event.extendedProps?.eventAccent);
    }, []);

    const handleEventResizeStop = useCallback(() => {
      document.body.classList.remove("cal-is-resizing");
    }, []);

    const handleEventDrop = useCallback(
      (info) => {
        const source = info.event.extendedProps?.source;
        if (source === "subscription") {
          info.revert();
          return;
        }
        if (source === "stundenplan" && onCalendarStoreChange) {
          applyStundenplanEventDrop(calendarStore, info, onCalendarStoreChange);
          return;
        }
        if (source === "planning" && saveVorhaben) {
          applyEventDropToPlanningStore(planningStore, info, saveVorhaben);
          return;
        }
        if (source === "local" && onCalendarStoreChange) {
          const id = info.event.extendedProps.localEventId;
          onCalendarStoreChange(
            updateLocalEvent(calendarStore, id, {
              start: info.event.start?.toISOString(),
              end: info.event.end?.toISOString() || info.event.start?.toISOString(),
              allDay: info.event.allDay,
            })
          );
        }
      },
      [planningStore, saveVorhaben, calendarStore, onCalendarStoreChange]
    );

    const handleEventReceive = useCallback(
      (info) => {
        const props = info.event.extendedProps || {};
        const start = info.event.start;
        if (!start) {
          info.revert();
          return;
        }

        if (props.source === "external-stundenplan-lektion" && onCalendarStoreChange) {
          const times = slotFromFcEvent(info.event);
          const existing = findStundenplanSlotAt(
            calendarStore.stundenplan,
            times.weekday,
            times.startMin
          );
          const lekTitle = info.event.title || "Lektion";
          if (existing) {
            onCalendarStoreChange(
              upsertStundenplanSlot(calendarStore, {
                ...existing,
                lektionId: props.lektionId,
                vorhabenId: props.vorhabenId,
                label: lekTitle,
              })
            );
          } else {
            onCalendarStoreChange(
              upsertStundenplanSlot(calendarStore, {
                id: `stp-${Date.now()}`,
                weekday: times.weekday,
                startMin: times.startMin,
                endMin: times.endMin,
                durationMin: times.durationMin,
                label: lekTitle,
                lektionId: props.lektionId,
                vorhabenId: props.vorhabenId,
              })
            );
          }
          info.event.remove();
          return;
        }

        if (!saveVorhaben || !draftVorhabenId) {
          info.revert();
          return;
        }
        let vorhaben = getVorhabenById(planningStore, draftVorhabenId);
        if (!vorhaben) {
          info.revert();
          return;
        }
        const { kw, year } = getIsoWeek(start);
        const { vorhaben: v, week } = getOrCreateWeek(vorhaben, kw, year);
        const weekday = ["so", "mo", "di", "mi", "do", "fr", "sa"][start.getDay()];
        if (!["mo", "di", "mi", "do", "fr"].includes(weekday)) {
          info.revert();
          return;
        }
        const startMin = start.getHours() * 60 + start.getMinutes();

        if (props.source === "external-ritual") {
          const rit = rituals.find((r) => r.id === props.ritualId);
          if (rit) {
            saveVorhaben(
              addDayCard({ ...v }, week.id, weekday, {
                type: "ritual",
                label: rit.name,
                durationMin: rit.durationMin,
                ritualId: rit.id,
                startMin,
              })
            );
          }
        } else if (props.source === "external-lektion") {
          saveVorhaben(
            linkLektionToWeekDay({ ...v }, week.id, weekday, props.lektionId, startMin)
          );
        } else {
          saveVorhaben(
            addDayCard({ ...v }, week.id, weekday, {
              type: "notiz",
              label: info.event.title || "Termin",
              durationMin: 45,
              startMin,
            })
          );
        }
        info.event.remove();
      },
      [planningStore, saveVorhaben, draftVorhabenId, rituals, calendarStore, onCalendarStoreChange]
    );

    const handleEventClick = useCallback(
      (info) => {
        if (info.event.extendedProps?.source === "stundenplan" && onStundenplanSlotClick) {
          info.jsEvent.preventDefault();
          onStundenplanSlotClick(info);
          return;
        }
        onEventClick?.(info);
      },
      [onEventClick, onStundenplanSlotClick]
    );

    const handleDateClick = useCallback(
      (info) => {
        onDateClick?.(info);
      },
      [onDateClick]
    );

    const handleDateSelect = useCallback(
      (selectInfo) => {
        if (onDateSelect) {
          onDateSelect(selectInfo);
        }
      },
      [onDateSelect]
    );

    const handleDatesSet = useCallback((arg) => {
      setVisibleRange({ start: arg.start, end: arg.end });
    }, []);

    const syncWeekBadge = useCallback(() => {
      const root = wrapRef.current;
      if (!root) {
        return;
      }
      root.querySelectorAll(".cal-week-badge").forEach((node) => node.remove());

      if (isDayView) {
        return;
      }

      const api = calendarRef.current?.getApi?.();
      const viewType = api?.view?.type || "";
      const focal = api?.getDate?.() || visibleRange.start;
      if (!focal || !api) {
        return;
      }
      const { kw, year } = getIsoWeek(focal);

      if (viewType.startsWith("list")) {
        const toolbarChunk = root.querySelector(
          ".fc-header-toolbar .fc-toolbar-chunk:first-child"
        );
        if (toolbarChunk) {
          toolbarChunk.prepend(buildWeekBadgeEl(kw, year, "cal-week-badge--toolbar"));
        }
        return;
      }

      if (viewType === "dayGridMonth") {
        const corner = root.querySelector(
          ".fc-dayGridMonth-view .fc-scrollgrid-section-header .fc-scrollgrid-shrink-frame"
        );
        if (corner) {
          corner.replaceChildren(buildWeekBadgeEl(kw, year));
        }
        return;
      }

      const axisCell =
        root.querySelector(
          ".fc-timeGridWeek-view .fc-scrollgrid-section-header .fc-timegrid-axis"
        ) ||
        root.querySelector(
          ".fc-timeGridDay-view .fc-scrollgrid-section-header .fc-timegrid-axis"
        );

      if (axisCell) {
        axisCell.replaceChildren(buildWeekBadgeEl(kw, year));
      }
    }, [isDayView, visibleRange.start]);

    const renderDayHeader = useCallback(
      (arg) => ({ html: formatDayHeaderHtml(arg.date, arg.view.type) }),
      []
    );

    useLayoutEffect(() => {
      syncWeekBadge();
    }, [syncWeekBadge]);

    const handleDatesSetWithBadge = useCallback(
      (info) => {
        if (isDayView && info?.start) {
          const start = new Date(info.start);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          setVisibleRange({ start, end });
        } else {
          handleDatesSet(info);
        }
        info.view.calendar.setOption(
          "stickyHeaderDates",
          info.view.type !== "timeGridDay"
        );
        requestAnimationFrame(() => syncWeekBadge());
      },
      [handleDatesSet, isDayView, syncWeekBadge]
    );

    const eventClassNames = useCallback(
      (arg) => {
        const classes = [...(arg.event.classNames || [])];
        const end = arg.event.end || arg.event.start;
        if (!arg.event.extendedProps?.isDraftPreview && end && end < new Date()) {
          classes.push("cal-event--past");
        }
        if (focusedFcEventId && arg.event.id === focusedFcEventId) {
          classes.push("cal-event--selected");
        }
        return classes;
      },
      [focusedFcEventId]
    );

    const handleEventDidMount = useCallback(
      (info) => {
        const props = info.event.extendedProps || {};
        const isMirror =
          Boolean(info.isMirror) ||
          info.event.classNames?.includes?.("fc-event-mirror") ||
          info.el?.classList?.contains?.("fc-event-mirror");

        if (isNewAppointmentSelectMirror(info) && info.el) {
          info.el.classList.add(
            "cal-event",
            "cal-event--local",
            "cal-event--plain",
            "cal-event--select-preview"
          );
          info.el.style.background = "#fff";
          info.el.style.boxShadow = "none";
          applyDragAccent(info.el, "#121212");
          try {
            info.event.setProp("title", DRAFT_PREVIEW_DEFAULT_TITLE);
          } catch {
            /* mirror may not support setProp in all views */
          }
          const titleEl = info.el.querySelector(".fc-event-title");
          if (titleEl) {
            titleEl.textContent = DRAFT_PREVIEW_DEFAULT_TITLE;
          } else {
            const main = info.el.querySelector(".fc-event-main");
            if (main) {
              const node = document.createElement("div");
              node.className = "fc-event-title";
              node.textContent = DRAFT_PREVIEW_DEFAULT_TITLE;
              main.prepend(node);
            }
          }
        } else if (isMirror && !props.isDraftPreview && info.el) {
          if (props.plain) {
            info.el.classList.add("cal-event--plain");
            applyDragAccent(info.el, "#121212");
          } else {
            applyFachEventElementStyles(
              info.el,
              props.fach,
              props.vorhabenId,
              props.cardType
            );
            applyDragAccent(info.el, props.eventAccent);
          }
        } else if (props.isDraftPreview && info.el) {
          info.el.classList.add("cal-event--select-preview");
          if (props.plain) {
            info.el.classList.add("cal-event--plain");
            applyDragAccent(info.el, "#121212");
          } else {
            applyFachEventElementStyles(
              info.el,
              props.fach,
              props.vorhabenId,
              props.cardType
            );
            applyDragAccent(info.el, props.eventAccent);
          }
        } else if (props.isLektionDragPreview && info.el) {
          applyFachEventElementStyles(
            info.el,
            props.fach,
            props.vorhabenId,
            props.cardType
          );
          applyDragAccent(info.el, props.eventAccent);
        } else if (props.plain && info.el) {
          info.el.classList.add("cal-event--plain");
          applyDragAccent(info.el, "#121212");
        } else {
          applyFachEventElementStyles(
            info.el,
            props.fach,
            props.vorhabenId,
            props.cardType
          );
          applyDragAccent(info.el, props.eventAccent);
        }
      },
      []
    );

    const slotMin = calendarStore.settings?.slotMinTime || "06:00:00";
    const slotMax = calendarStore.settings?.slotMaxTime || "20:00:00";

    const dragStripVisible =
      showDragStrip !== undefined ? showDragStrip : showExternalEvents;

    const resolvedHeight =
      height === "100%"
        ? measuredHeight || Math.max(360, Math.floor(window.innerHeight * 0.55))
        : height;

    const externalStrip =
      showExternalEvents && draftVorhaben && dragStripVisible ? (
        <div
          ref={externalRef}
          className={compactExternal ? "cal-external-strip" : "cal-external-events"}
          aria-label="Ziehen auf Kalender"
        >
          {compactExternal ? (
            <span className="cal-external-strip-label">Ziehen:</span>
          ) : (
            <h3 className="cal-external-title">Auf Kalender ziehen</h3>
          )}
          <div className={compactExternal ? "cal-external-strip-scroll" : ""}>
            {rituals.map((rit) => (
              <div
                key={rit.id}
                className="fc-external-event fc-external-event--ritual"
                data-kind="ritual"
                data-title={rit.name}
                data-duration={rit.durationMin}
                data-ritual-id={rit.id}
              >
                {rit.name}
                <span className="cal-external-dur">{rit.durationMin}′</span>
              </div>
            ))}
            {draftVorhaben.lektionen?.map((lek) => (
              <div
                key={lek.id}
                className="fc-external-event cal-external-event--lektion"
                data-testid={`cal-external-lektion-${lek.id}`}
                data-kind="lektion"
                data-title={lek.title}
                data-duration={lek.durationMin}
                data-lektion-id={lek.id}
              >
                {lek.title}
                <span className="cal-external-dur">{lek.durationMin}′</span>
              </div>
            ))}
            <button
              type="button"
              className="fc-external-event cal-external-event--add"
              onClick={() => saveVorhaben(addLektion(draftVorhaben))}
            >
              + Lektion
            </button>
          </div>
        </div>
      ) : null;

    return (
      <div
        ref={wrapRef}
        className={`cal-view-wrap ${compactExternal ? "cal-view-wrap--compact" : ""}`}
      >
        <div
          ref={calHostRef}
          className={`cal-fullcalendar-host cal-fullcalendar-host--modern ${
            spacious ? "cal-fullcalendar-host--spacious" : ""
          }${muteTodayHighlight ? " cal-fullcalendar-host--mute-today" : ""}`}
          onDragOver={handleCalendarHostDragOver}
          onDrop={handleCalendarHostDrop}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            locale={deLocale}
            initialView={
              isDayView
                ? "timeGridDay"
                : initialViewProp || calendarStore.settings?.defaultView || "timeGridWeek"
            }
            initialDate={isDayView ? dayAnchor : undefined}
            headerToolbar={
              isDayView
                ? false
                : {
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                  }
            }
            buttonText={{
              today: "Heute",
              month: "Monat",
              week: "Woche",
              day: "Tag",
              list: "Liste",
            }}
            height={resolvedHeight}
            slotMinTime={slotMin}
            slotMaxTime={slotMax}
            expandRows
            stickyHeaderDates
            allDaySlot
            nowIndicator
            weekNumbers={false}
            weekNumberCalculation="ISO"
            dayHeaderContent={renderDayHeader}
            listDayFormat={{ weekday: "long", day: "numeric", month: "long" }}
            listDaySideFormat={false}
            editable
            droppable
            selectable
            selectMirror
            selectLongPressDelay={280}
            eventLongPressDelay={280}
            longPressDelay={280}
            dayMaxEvents={4}
            moreLinkClick="popover"
            weekends
            firstDay={1}
            slotDuration="00:15:00"
            snapDuration="00:15:00"
            slotLabelInterval="01:00:00"
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            events={allEvents}
            eventDisplay="block"
            eventClassNames={eventClassNames}
            eventDidMount={handleEventDidMount}
            eventDragStart={handleEventDragStart}
            eventDragStop={handleEventDragStop}
            eventResizeStart={handleEventResizeStart}
            eventResizeStop={handleEventResizeStop}
            eventDrop={handleEventDrop}
            eventResize={handleEventDrop}
            eventReceive={handleEventReceive}
            select={handleDateSelect}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={handleDatesSetWithBadge}
          />
        </div>
        {externalStrip}
      </div>
    );
  }
);

CalendarView.displayName = "CalendarView";

export default CalendarView;
