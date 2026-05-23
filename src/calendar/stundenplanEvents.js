import { WEEKDAYS } from "../planning/planningDefaults";
import { calendarEventClassNames, withBauhausEventStyle } from "./calendarEventStyles";
import { weekdayIdFromDate } from "./planningEvents";

const atMinutes = (baseDate, minutesFromMidnight) => {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  d.setHours(h, m, 0, 0);
  return d;
};

/** Wöchentliches Raster → FullCalendar-Events im sichtbaren Bereich. */
export const stundenplanToCalendarEvents = (stundenplan, rangeStart, rangeEnd) => {
  if (!stundenplan?.enabled || !Array.isArray(stundenplan.slots)) {
    return [];
  }
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);
  start.setHours(0, 0, 0, 0);
  const events = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const wd = weekdayIdFromDate(new Date(d));
    if (!wd) {
      continue;
    }
    const day = new Date(d);
    for (const slot of stundenplan.slots) {
      if (slot.weekday !== wd) {
        continue;
      }
      const startMin = slot.startMin ?? 8 * 60;
      const endMin = slot.endMin ?? startMin + (slot.durationMin || 45);
      const evStart = atMinutes(day, startMin);
      const evEnd = atMinutes(day, endMin);
      const dayKey = day.toISOString().slice(0, 10);
      events.push(
        withBauhausEventStyle({
          id: `stp-${slot.id}-${dayKey}`,
          title: slot.label || "Lektionsplatz",
          start: evStart.toISOString(),
          end: evEnd.toISOString(),
          display: "auto",
          classNames: [
            ...calendarEventClassNames("stundenplan"),
            "cal-stundenplan-slot",
            slot.lektionId ? "cal-stundenplan-slot--filled" : "",
          ].filter(Boolean),
          editable: true,
          startEditable: true,
          durationEditable: true,
          overlap: true,
          extendedProps: {
            source: "stundenplan",
            eventAccent: slot.lektionId ? "#1040c0" : "#f0c020",
            slotId: slot.id,
            lektionId: slot.lektionId || null,
            vorhabenId: slot.vorhabenId || null,
            slotLabel: slot.label,
          },
        })
      );
    }
  }
  return events;
};

export const slotFromFcEvent = (event) => {
  const start = event.start;
  const end = event.end || start;
  const weekday = weekdayIdFromDate(start);
  return {
    weekday,
    startMin: start.getHours() * 60 + start.getMinutes(),
    endMin: end.getHours() * 60 + end.getMinutes(),
    durationMin: Math.round((end - start) / 60000),
  };
};

export const allLektionenFromPlanning = (planningStore) => {
  const list = [];
  for (const v of planningStore?.vorhaben || []) {
    for (const lek of v.lektionen || []) {
      list.push({
        ...lek,
        vorhabenId: v.id,
        vorhabenTitle: v.title,
      });
    }
  }
  return list;
};

export const buildDefaultSchoolSlots = () => {
  const slots = [];
  const blocks = [
    { start: 8 * 60, end: 8 * 60 + 45 },
    { start: 9 * 60, end: 9 * 60 + 45 },
    { start: 10 * 60 + 15, end: 11 * 60 },
    { start: 11 * 60 + 30, end: 12 * 60 + 15 },
    { start: 13 * 60 + 15, end: 14 * 60 },
    { start: 14 * 60 + 15, end: 15 * 60 },
  ];
  let i = 0;
  for (const wd of WEEKDAYS) {
    for (const b of blocks) {
      slots.push({
        id: `stp-default-${i++}`,
        weekday: wd.id,
        startMin: b.start,
        endMin: b.end,
        durationMin: b.end - b.start,
        label: "",
        lektionId: null,
        vorhabenId: null,
      });
    }
  }
  return slots;
};

export const findStundenplanSlotAt = (stundenplan, weekday, startMin) => {
  if (!stundenplan?.slots?.length || !weekday) {
    return null;
  }
  return (
    stundenplan.slots.find((s) => {
      if (s.weekday !== weekday) {
        return false;
      }
      const from = s.startMin ?? 0;
      const to = s.endMin ?? from + 45;
      return startMin >= from && startMin < to;
    }) || null
  );
};
