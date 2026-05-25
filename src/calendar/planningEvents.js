import { getWeekdayDatesForIsoWeek } from "../planning/calendarUtils";
import { VORHABEN_TEMPLATES, WEEKDAYS } from "../planning/planningDefaults";
import { getIsoWeek } from "../planning/planningStore";
import { resolvePlanningEventColors } from "../planning/fachColors";
import {
  accentForCard,
  calendarEventClassNames,
  withBauhausEventStyle,
} from "./calendarEventStyles";

const templateLabel = (id) =>
  VORHABEN_TEMPLATES.find((t) => t.id === id)?.label || "";

const WEEKDAY_IDS = ["mo", "di", "mi", "do", "fr"];

export const weekdayIdFromDate = (date) => {
  const d = date.getDay();
  const map = ["so", "mo", "di", "mi", "do", "fr", "sa"];
  const id = map[d];
  return WEEKDAY_IDS.includes(id) ? id : null;
};

const atMinutes = (baseDate, minutesFromMidnight) => {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  d.setHours(h, m, 0, 0);
  return d;
};

/** Alle Karten eines Vorhabens → FullCalendar-Events (nur Mo–Fr). */
export const vorhabenToCalendarEvents = (vorhaben) => {
  if (!vorhaben?.wochen) {
    return [];
  }
  const events = [];
  let unscheduledSlot = 0;

  for (const week of vorhaben.wochen) {
    const dates = getWeekdayDatesForIsoWeek(week.kw, week.year);
    for (const wd of WEEKDAYS) {
      const day = week.days?.[wd.id];
      if (!day?.cards?.length) {
        continue;
      }
      const dateInfo = dates[wd.id];
      if (!dateInfo?.date) {
        continue;
      }
      for (let i = 0; i < day.cards.length; i += 1) {
        const card = day.cards[i];
        const hasTime = card.startMin != null && Number.isFinite(card.startMin);
        const slot = unscheduledSlot;
        if (!hasTime) {
          unscheduledSlot += 1;
        }
        const startMin = hasTime ? card.startMin : 8 * 60 + (slot % 8) * 15;
        const duration = card.durationMin || 45;
        const start = atMinutes(dateInfo.date, startMin);
        const end = new Date(start.getTime() + duration * 60 * 1000);
        const colors = resolvePlanningEventColors(vorhaben, card.type);
        const accent =
          colors.accent || accentForCard(card.type, vorhaben.id, vorhaben.fach);
        events.push(
          withBauhausEventStyle({
            id: `plan-${vorhaben.id}-${card.id}`,
            title: card.label || "Eintrag",
            start: start.toISOString(),
            end: end.toISOString(),
            classNames: calendarEventClassNames("planning", card.type),
            editable: true,
            extendedProps: {
              source: "planning",
              eventAccent: accent,
              eventBg: colors.bg,
              vorhabenId: vorhaben.id,
              vorhabenTitle: vorhaben.title,
              templateId: vorhaben.templateId,
              templateLabel: templateLabel(vorhaben.templateId),
              fach: vorhaben.fach || "",
              klasse: vorhaben.klasse || "",
              weekId: week.id,
              weekday: wd.id,
              cardId: card.id,
              cardType: card.type,
              notes: day.notiz || "",
              lektionId: card.lektionId || null,
              ritualId: card.ritualId || null,
            },
          })
        );
      }
    }
  }
  return events;
};

export const allVorhabenToCalendarEvents = (vorhabenList) => {
  const events = [];
  for (const v of vorhabenList || []) {
    events.push(...vorhabenToCalendarEvents(v));
  }
  return events;
};

export const subscriptionToCalendarEvents = (subscription, cached) => {
  if (!subscription.enabled || !cached?.events) {
    return [];
  }
  return cached.events.map((ev) =>
    withBauhausEventStyle({
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay,
      classNames: [...calendarEventClassNames("subscription"), "cal-event--readonly"],
      editable: false,
      extendedProps: {
        source: "subscription",
        subscriptionId: subscription.id,
        eventAccent: subscription.color || "#1040c0",
      },
    })
  );
};

export const localToCalendarEvents = (localEvents) =>
  (localEvents || []).map((ev) => {
    const plain = !ev.vorhabenId && !ev.color;
    return withBauhausEventStyle({
      id: `local-${ev.id}`,
      title: ev.title,
      start: ev.start,
      end: ev.end || ev.start,
      allDay: ev.allDay,
      classNames: calendarEventClassNames("local"),
      editable: true,
      extendedProps: {
        source: "local",
        localEventId: ev.id,
        vorhabenId: ev.vorhabenId,
        notes: ev.notes || "",
        plain,
        eventAccent: ev.color || undefined,
      },
    });
  });

export const applyEventDropToVorhaben = (vorhaben, dropInfo) => {
  const props = dropInfo.event.extendedProps || {};
  if (props.source !== "planning") {
    return vorhaben;
  }
  const start = dropInfo.event.start;
  if (!start) {
    return vorhaben;
  }
  const newWeekday = weekdayIdFromDate(start);
  if (!newWeekday) {
    dropInfo.revert();
    return vorhaben;
  }
  const { kw, year } = getIsoWeek(start);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const duration =
    dropInfo.event.end && dropInfo.event.start
      ? Math.round(
          (dropInfo.event.end.getTime() - dropInfo.event.start.getTime()) / 60000
        )
      : null;

  let next = { ...vorhaben };
  let targetWeek = next.wochen.find((w) => w.kw === kw && w.year === year);
  if (!targetWeek) {
    const emptyWeek = {
      id: `w-${Date.now()}`,
      kw,
      year,
      focus: "",
      days: Object.fromEntries(WEEKDAYS.map((d) => [d.id, { cards: [], notiz: "" }])),
      sonderTage: [],
    };
    next = { ...next, wochen: [...next.wochen, emptyWeek] };
    targetWeek = emptyWeek;
  }

  const sourceWeek = next.wochen.find((w) => w.id === props.weekId);
  if (!sourceWeek) {
    return vorhaben;
  }
  const fromDay = sourceWeek.days[props.weekday] || { cards: [], notiz: "" };
  const card = fromDay.cards.find((c) => c.id === props.cardId);
  if (!card) {
    return vorhaben;
  }

  const patch = {
    ...card,
    startMin,
    ...(duration ? { durationMin: duration } : {}),
  };

  const wochen = next.wochen.map((w) => {
    if (w.id === props.weekId && w.id !== targetWeek.id) {
      const day = w.days[props.weekday] || { cards: [], notiz: "" };
      return {
        ...w,
        days: {
          ...w.days,
          [props.weekday]: {
            ...day,
            cards: day.cards.filter((c) => c.id !== props.cardId),
          },
        },
      };
    }
    if (w.id === targetWeek.id) {
      const days = { ...w.days };
      if (w.id === props.weekId) {
        const day = days[props.weekday] || { cards: [], notiz: "" };
        days[props.weekday] = {
          ...day,
          cards: day.cards.filter((c) => c.id !== props.cardId),
        };
      }
      const toDay = days[newWeekday] || { cards: [], notiz: "" };
      days[newWeekday] = { ...toDay, cards: [...toDay.cards, patch] };
      return { ...w, days };
    }
    return w;
  });

  return { ...next, wochen, updatedAt: Date.now() };
};
