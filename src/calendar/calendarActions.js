import {
  addDayCard,
  getIsoWeek,
  getOrCreateWeek,
  getVorhabenById,
  linkLektionToWeekDay,
  removeDayCard,
  updateDayCard,
} from "../planning/planningStore";
import { normalizeFachKey } from "../planning/fachColors";
import {
  addLocalEvent,
  removeLocalEvent,
  updateLocalEvent,
} from "./calendarStore";
import { slotFromCalendarPointer } from "./calendarDropFromPointer";
import { applyEventDropToVorhaben, weekdayIdFromDate } from "./planningEvents";

const parseFormTimes = (form) => {
  const start = new Date(form.start);
  const end = new Date(form.end);
  return { start, end };
};

const readPlanningCard = (vorhaben, weekId, weekday, cardId) => {
  const week = vorhaben?.wochen?.find((w) => w.id === weekId);
  const day = week?.days?.[weekday];
  return day?.cards?.find((c) => c.id === cardId) || null;
};

/** Planungskarte in anderes Thema verschieben (gleiche KW / Wochentag). */
const movePlanningCardToVorhaben = ({
  planningStore,
  form,
  start,
  durationMin,
  startMin,
}) => {
  const fromId = form.initialVorhabenId || form.vorhabenId;
  const toId = form.vorhabenId;
  if (!fromId || !toId || fromId === toId) {
    return null;
  }

  let fromV = getVorhabenById(planningStore, fromId);
  const card = readPlanningCard(fromV, form.weekId, form.weekday, form.cardId);
  if (!fromV || !card) {
    return null;
  }

  fromV = removeDayCard(fromV, form.weekId, form.weekday, form.cardId);

  let toV = getVorhabenById(planningStore, toId);
  if (!toV) {
    return null;
  }

  const { kw, year } = getIsoWeek(start);
  const { vorhaben: toV0, week } = getOrCreateWeek(toV, kw, year);
  toV = addDayCard(toV0, week.id, form.weekday, {
    type: form.cardType || card.type,
    label: form.title,
    durationMin,
    startMin,
    ritualId: form.ritualId ?? card.ritualId,
    lektionId: form.lektionId ?? card.lektionId,
  });

  return { fromV, toV };
};

const localEventPatchFromForm = (form) => {
  const fach =
    form.draftFach && normalizeFachKey(form.draftFach) !== "default"
      ? form.draftFach
      : "";
  return {
    title: form.title,
    start: form.start,
    end: form.end,
    allDay: form.allDay,
    notes: form.notes,
    vorhabenId: form.vorhabenId || null,
    fach: form.vorhabenId ? "" : fach,
  };
};

export const saveEventFromForm = ({
  form,
  planningStore,
  calStore,
  onPlanningStoreChange,
  onCalStoreChange,
}) => {
  const { start, end } = parseFormTimes(form);
  const durationMin = form.allDay
    ? null
    : Math.max(5, Math.round((end.getTime() - start.getTime()) / 60000));
  const startMin = form.allDay ? null : start.getHours() * 60 + start.getMinutes();
  const weekday = weekdayIdFromDate(start) || form.weekday || "mo";

  const planningVorhaben =
    form.vorhabenId && form.source !== "subscription"
      ? getVorhabenById(planningStore, form.vorhabenId)
      : null;

  if (!planningVorhaben) {
    const patch = localEventPatchFromForm({
      ...form,
      start: start.toISOString(),
      end: end.toISOString(),
    });
    if (form.localEventId) {
      onCalStoreChange(updateLocalEvent(calStore, form.localEventId, patch));
    } else {
      onCalStoreChange(
        addLocalEvent(calStore, {
          ...patch,
          start: patch.start,
          end: patch.end,
        })
      );
    }
    return;
  }

  const moved = movePlanningCardToVorhaben({
    planningStore,
    form,
    start,
    durationMin,
    startMin,
  });
  if (moved) {
    onPlanningStoreChange(moved.fromV);
    onPlanningStoreChange(moved.toV);
    if (form.localEventId) {
      onCalStoreChange(removeLocalEvent(calStore, form.localEventId));
    }
    return;
  }

  if (form.localEventId && form.vorhabenId) {
    onCalStoreChange(removeLocalEvent(calStore, form.localEventId));
  }

  let vorhaben = planningVorhaben;
  const { kw, year } = getIsoWeek(start);
  const { vorhaben: v0, week } = getOrCreateWeek(vorhaben, kw, year);
  let v = v0;

  if (form.cardId && form.mode === "edit") {
    v = updateDayCard(v, week.id, weekday, form.cardId, {
      label: form.title,
      type: form.cardType,
      durationMin,
      startMin,
    });
    if (form.notes !== undefined) {
      v = {
        ...v,
        wochen: v.wochen.map((w) => {
          if (w.id !== week.id) {
            return w;
          }
          const day = w.days[weekday] || { cards: [], notiz: "" };
          return {
            ...w,
            days: { ...w.days, [weekday]: { ...day, notiz: form.notes } },
          };
        }),
      };
    }
  } else if (form.cardType === "lektion" && form.lektionId) {
    v = linkLektionToWeekDay(v, week.id, weekday, form.lektionId, startMin);
    const lek = v.lektionen.find((l) => l.id === form.lektionId);
    if (lek && form.title && lek.title !== form.title) {
      v = {
        ...v,
        lektionen: v.lektionen.map((l) =>
          l.id === form.lektionId
            ? { ...l, title: form.title, durationMin: durationMin || l.durationMin }
            : l
        ),
      };
    }
  } else {
    v = addDayCard(v, week.id, weekday, {
      type: form.cardType,
      label: form.title,
      durationMin,
      startMin,
      ritualId: form.ritualId,
      lektionId: form.lektionId,
    });
    const w = v.wochen.find((wr) => wr.id === week.id);
    if (w && form.notes) {
      const days = { ...w.days };
      days[weekday] = { ...(days[weekday] || { cards: [] }), notiz: form.notes };
      v = {
        ...v,
        wochen: v.wochen.map((wr) => (wr.id === week.id ? { ...wr, days } : wr)),
      };
    }
  }

  onPlanningStoreChange(v);
};

export const deleteEventFromForm = ({
  form,
  planningStore,
  calStore,
  onPlanningStoreChange,
  onCalStoreChange,
}) => {
  if (form.source === "local" && form.localEventId) {
    onCalStoreChange(removeLocalEvent(calStore, form.localEventId));
    return;
  }
  if (form.source === "planning" && form.cardId) {
    const vid = form.initialVorhabenId || form.vorhabenId;
    const v = getVorhabenById(planningStore, vid);
    if (!v) {
      return;
    }
    onPlanningStoreChange(
      removeDayCard(v, form.weekId, form.weekday, form.cardId)
    );
  }
};

/** Lektion aus Themen-Übersicht per HTML5-Drop auf Kalender-Raster terminieren. */
export const dropLektionOnCalendarAtPointer = ({
  planningStore,
  draftVorhabenId,
  lektionId,
  clientX,
  clientY,
  calendarRoot,
  saveVorhaben,
  stickyDate = null,
}) => {
  if (!saveVorhaben || !draftVorhabenId || !lektionId || !calendarRoot) {
    return false;
  }
  const slot = slotFromCalendarPointer(calendarRoot, clientX, clientY, { stickyDate });
  if (!slot) {
    return false;
  }
  let vorhaben = getVorhabenById(planningStore, draftVorhabenId);
  if (!vorhaben) {
    return false;
  }
  const lek = vorhaben.lektionen?.find((l) => l.id === lektionId);
  if (!lek) {
    return false;
  }
  const { kw, year } = getIsoWeek(slot.start);
  const { vorhaben: v, week } = getOrCreateWeek(vorhaben, kw, year);
  saveVorhaben(
    linkLektionToWeekDay({ ...v }, week.id, slot.weekday, lektionId, slot.startMin)
  );
  return true;
};

export const applyEventDropToPlanningStore = (planningStore, dropInfo, saveVorhaben) => {
  const props = dropInfo.event.extendedProps || {};
  if (props.source !== "planning") {
    return;
  }
  const v = getVorhabenById(planningStore, props.vorhabenId);
  if (!v) {
    dropInfo.revert();
    return;
  }
  const updated = applyEventDropToVorhaben(v, dropInfo);
  saveVorhaben(updated);
};
