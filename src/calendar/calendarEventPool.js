import { getVorhabenById } from "../planning/planningStore";
import { resolvePlanningEventColors } from "../planning/fachColors";
import { filterCalendarEvents, matchesSearch } from "./calendarFilters";
import {
  allVorhabenToCalendarEvents,
  localToCalendarEvents,
  subscriptionToCalendarEvents,
} from "./planningEvents";
import { stundenplanToCalendarEvents } from "./stundenplanEvents";
import { withBauhausEventStyle } from "./calendarEventStyles";

/** Breiter Zeitraum für Kalender-Suche (unabhängig von der sichtbaren Woche). */
export const calendarSearchRange = () => {
  const start = new Date();
  start.setMonth(start.getMonth() - 6);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setMonth(end.getMonth() + 12);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const buildCalendarEventPool = ({
  calendarStore,
  planningStore,
  rangeStart,
  rangeEnd,
  filters,
}) => {
  const planningEvents = allVorhabenToCalendarEvents(planningStore?.vorhaben || []);
  const subscriptionEvents = [];
  for (const sub of calendarStore?.subscriptions || []) {
    subscriptionEvents.push(
      ...subscriptionToCalendarEvents(sub, calendarStore.subscriptionCache?.[sub.id])
    );
  }
  const localEvents = localToCalendarEvents(calendarStore?.localEvents || [], planningStore);

  let stundenplanEvents = [];
  if (filters?.showStundenplan !== false && calendarStore?.stundenplan?.enabled) {
    const raw = stundenplanToCalendarEvents(
      calendarStore.stundenplan,
      rangeStart,
      rangeEnd
    );
    stundenplanEvents = raw.map((ev) => {
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
  }

  const merged = [...subscriptionEvents, ...localEvents, ...planningEvents];
  const filtered = filterCalendarEvents(merged, filters, { applySearch: false });
  return [...stundenplanEvents, ...filtered];
};

export const searchCalendarEvents = (events, query, limit = 24) => {
  const q = (query || "").trim().toLowerCase();
  if (!q) {
    return [];
  }
  return events.filter((ev) => matchesSearch(ev, q)).slice(0, limit);
};

export const formatEventWhen = (event) => {
  const start = event.start ? new Date(event.start) : null;
  if (!start || Number.isNaN(start.getTime())) {
    return "";
  }
  const date = start.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  if (event.allDay) {
    return `${date} · ganztägig`;
  }
  const time = start.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = event.end ? new Date(event.end) : null;
  const endTime =
    end && !Number.isNaN(end.getTime())
      ? end.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
      : null;
  return endTime ? `${date} · ${time}–${endTime}` : `${date} · ${time}`;
};
