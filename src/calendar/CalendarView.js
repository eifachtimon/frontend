import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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
import { applyEventDropToPlanningStore } from "./calendarActions";
import { applyStundenplanEventDrop } from "./stundenplanActions";
import { updateLocalEvent, upsertStundenplanSlot } from "./calendarStore";
import {
  applyFachEventElementStyles,
  resolvePlanningEventColors,
} from "../planning/fachColors";
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
      onStundenplanSlotClick,
      showExternalEvents = false,
      showDragStrip,
      compactExternal = false,
      spacious = false,
      height = "100%",
      /** Nur heutiger Tag, Tagesraster ohne Toolbar (Home) */
      dayViewToday = false,
      initialDate,
    },
    ref
  ) => {
    const calendarRef = useRef(null);
    const externalRef = useRef(null);
    const todayAnchor = useMemo(() => {
      const d = initialDate ? new Date(initialDate) : new Date();
      if (Number.isNaN(d.getTime())) {
        return new Date();
      }
      return d;
    }, [initialDate]);
    const [visibleRange, setVisibleRange] = useState(() => {
      const now = initialDate ? new Date(initialDate) : new Date();
      if (dayViewToday) {
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

    const allEvents = useMemo(() => {
      const merged = [...subscriptionEvents, ...localEvents, ...planningEvents];
      const filtered = filterCalendarEvents(merged, filters);
      return [...stundenplanEvents, ...filtered];
    }, [subscriptionEvents, localEvents, planningEvents, stundenplanEvents, filters]);

    const draftVorhaben = draftVorhabenId
      ? getVorhabenById(planningStore, draftVorhabenId)
      : planningStore?.vorhaben?.[0] || null;

    const setupDraggable = useCallback(
      (containerEl) => {
        if (!containerEl) {
          return undefined;
        }
        return new Draggable(containerEl, {
          itemSelector: ".fc-external-event:not(.cal-external-event--add)",
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
      draggables.push(setupDraggable(document.body));
      return () => draggables.forEach((d) => d?.destroy?.());
    }, [showExternalEvents, draftVorhabenId, draftVorhaben?.lektionen, setupDraggable]);

    useEffect(() => {
      const onPointerDown = (e) => {
        const el = e.target.closest?.(".fc-external-event");
        if (!el || el.classList.contains("cal-external-event--add")) {
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

    const eventClassNames = useCallback((arg) => {
      const props = arg.event.extendedProps || {};
      const classes = [...(arg.event.classNames || [])];
      const end = arg.event.end || arg.event.start;
      if (end && end < new Date()) {
        classes.push("cal-event--past");
      }
      return classes;
    }, []);

    const handleEventDidMount = useCallback((info) => {
      const props = info.event.extendedProps || {};
      applyFachEventElementStyles(
        info.el,
        props.fach,
        props.vorhabenId,
        props.cardType
      );
      applyDragAccent(info.el, props.eventAccent);
    }, []);

    const slotMin = calendarStore.settings?.slotMinTime || "06:00:00";
    const slotMax = calendarStore.settings?.slotMaxTime || "20:00:00";

    const dragStripVisible =
      showDragStrip !== undefined ? showDragStrip : showExternalEvents;

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
        className={`cal-view-wrap ${compactExternal ? "cal-view-wrap--compact" : ""}`}
      >
        <div
          className={`cal-fullcalendar-host cal-fullcalendar-host--modern ${
            spacious ? "cal-fullcalendar-host--spacious" : ""
          }`}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            locale={deLocale}
            initialView={
              dayViewToday
                ? "timeGridDay"
                : calendarStore.settings?.defaultView || "timeGridWeek"
            }
            initialDate={dayViewToday ? todayAnchor : undefined}
            headerToolbar={
              dayViewToday
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
            height={height}
            slotMinTime={slotMin}
            slotMaxTime={slotMax}
            expandRows
            stickyHeaderDates
            allDaySlot
            nowIndicator
            weekNumbers={!dayViewToday}
            weekNumberCalculation="ISO"
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
            eventClick={handleEventClick}
            datesSet={(info) => {
              if (dayViewToday && info?.start) {
                const anchor = new Date(todayAnchor);
                anchor.setHours(0, 0, 0, 0);
                const seen = new Date(info.start);
                seen.setHours(0, 0, 0, 0);
                if (seen.getTime() !== anchor.getTime()) {
                  calendarRef.current?.getApi?.()?.gotoDate(todayAnchor);
                }
                const start = new Date(todayAnchor);
                start.setHours(0, 0, 0, 0);
                const end = new Date(start);
                end.setDate(end.getDate() + 1);
                setVisibleRange({ start, end });
                return;
              }
              handleDatesSet(info);
            }}
          />
        </div>
        {externalStrip}
      </div>
    );
  }
);

CalendarView.displayName = "CalendarView";

export default CalendarView;
