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
  findStundenplanSlotAt,
  slotFromFcEvent,
  stundenplanToCalendarEvents,
} from "./stundenplanEvents";

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
      compactExternal = false,
      height = "100%",
    },
    ref
  ) => {
    const calendarRef = useRef(null);
    const externalRef = useRef(null);
    const [visibleRange, setVisibleRange] = useState(() => {
      const now = new Date();
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
      return stundenplanToCalendarEvents(
        calendarStore.stundenplan,
        visibleRange.start,
        visibleRange.end
      );
    }, [
      calendarStore.stundenplan,
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
          itemSelector: ".fc-external-event",
          eventData: (eventEl) => {
            const kind = eventEl.dataset.kind;
            if (kind === "ritual") {
              return {
                title: eventEl.dataset.title,
                duration: { minutes: Number(eventEl.dataset.duration) || 15 },
                extendedProps: {
                  source: "external-ritual",
                  ritualId: eventEl.dataset.ritualId,
                  vorhabenId: draftVorhabenId,
                },
              };
            }
            if (kind === "lektion") {
              return {
                title: eventEl.dataset.title,
                duration: { minutes: Number(eventEl.dataset.duration) || 45 },
                extendedProps: {
                  source: "external-lektion",
                  lektionId: eventEl.dataset.lektionId,
                  vorhabenId: draftVorhabenId,
                },
              };
            }
            if (kind === "stundenplan-lektion") {
              return {
                title: eventEl.dataset.title,
                duration: { minutes: Number(eventEl.dataset.duration) || 45 },
                extendedProps: {
                  source: "external-stundenplan-lektion",
                  lektionId: eventEl.dataset.lektionId,
                  vorhabenId: eventEl.dataset.vorhabenId,
                },
              };
            }
            return {
              title: eventEl.dataset.title || "Termin",
              duration: { minutes: 45 },
              extendedProps: { source: "external-generic", vorhabenId: draftVorhabenId },
            };
          },
        });
      },
      [draftVorhabenId]
    );

    useEffect(() => {
      const draggables = [];
      if (showExternalEvents && externalRef.current) {
        draggables.push(setupDraggable(externalRef.current));
      }
      draggables.push(setupDraggable(document.body));
      return () => draggables.forEach((d) => d?.destroy?.());
    }, [showExternalEvents, draftVorhabenId, draftVorhaben?.lektionen, setupDraggable]);

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
      const src = arg.event.extendedProps?.source;
      if (src === "stundenplan") {
        return ["cal-stundenplan-slot"];
      }
      const end = arg.event.end || arg.event.start;
      if (end && end < new Date()) {
        return ["cal-event--past"];
      }
      return [];
    }, []);

    const slotMin = calendarStore.settings?.slotMinTime || "06:00:00";
    const slotMax = calendarStore.settings?.slotMaxTime || "20:00:00";

    const externalStrip =
      showExternalEvents && draftVorhaben ? (
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
                className="fc-external-event"
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
        <div className="cal-fullcalendar-host cal-fullcalendar-host--modern">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            locale={deLocale}
            initialView={calendarStore.settings?.defaultView || "timeGridWeek"}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
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
            weekNumbers
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
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            events={allEvents}
            eventDisplay="block"
            eventClassNames={eventClassNames}
            eventDrop={handleEventDrop}
            eventResize={handleEventDrop}
            eventReceive={handleEventReceive}
            select={handleDateSelect}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
          />
        </div>
        {externalStrip}
      </div>
    );
  }
);

CalendarView.displayName = "CalendarView";

export default CalendarView;
