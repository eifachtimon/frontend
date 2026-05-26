import {
  planungEntwurfPath,
  vorhabenLevelPath,
  vorhabenOverviewSectionPath,
} from "../config/appUrls";
import { VORHABEN_TEMPLATES, WEEKDAYS } from "../planning/planningDefaults";
import { getVorhabenById } from "../planning/planningStore";
import {
  calendarEventClassNames,
  withBauhausEventStyle,
} from "./calendarEventStyles";
import { resolvePlanningEventColors, normalizeFachKey } from "../planning/fachColors";
import { weekdayIdFromDate } from "./planningEvents";

const DRAFT_PREVIEW_ID = "__cal-draft-preview__";

export const DRAFT_PREVIEW_EVENT_ID = DRAFT_PREVIEW_ID;

const LEKTION_DRAG_PREVIEW_ID = "__lek-drag-preview__";

export const LEKTION_DRAG_PREVIEW_EVENT_ID = LEKTION_DRAG_PREVIEW_ID;

export const DRAFT_PREVIEW_DEFAULT_TITLE = "Neuer Termin";

const templateLabel = (id) =>
  VORHABEN_TEMPLATES.find((t) => t.id === id)?.label || id || "—";

export const buildEmptyForm = (partial = {}) => ({
  mode: partial.mode || "create",
  source: partial.source || "planning",
  title: partial.title || "",
  start: partial.start || new Date().toISOString(),
  end: partial.end || new Date(Date.now() + 45 * 60000).toISOString(),
  allDay: Boolean(partial.allDay),
  vorhabenId: partial.vorhabenId || "",
  cardType: partial.cardType || "notiz",
  durationMin: partial.durationMin ?? 45,
  notes: partial.notes || "",
  weekId: partial.weekId || null,
  weekday: partial.weekday || null,
  cardId: partial.cardId || null,
  lektionId: partial.lektionId || null,
  ritualId: partial.ritualId || null,
  localEventId: partial.localEventId || null,
  subscriptionId: partial.subscriptionId || null,
  readonly: Boolean(partial.readonly),
  draftFach: partial.draftFach || "",
});

export const withVorhabenAssignment = (form, vorhabenId, planningStore, vorhabenOptions = []) => {
  if (!vorhabenId) {
    return {
      ...form,
      vorhabenId: "",
      source: form.cardId ? "planning" : "local",
      vorhabenTitle: "",
    };
  }
  const fromList = vorhabenOptions.find((v) => v.id === vorhabenId);
  const vorhaben = fromList || getVorhabenById(planningStore, vorhabenId);
  return {
    ...form,
    vorhabenId,
    source: "planning",
    vorhabenTitle: vorhaben?.title || "",
    draftFach: vorhaben?.fach || form.draftFach || "",
    fach: vorhaben?.fach || "",
  };
};

const durationMinFromRange = (start, end, allDay) => {
  if (allDay || !start || !end) {
    return 45;
  }
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) {
    return 45;
  }
  return Math.max(5, Math.round(ms / 60000));
};

export const formFromFcEvent = (fcEvent, planningStore, calStore) => {
  const props = fcEvent.extendedProps || {};
  const src = props.source || "local";
  const start = fcEvent.start;
  const end = fcEvent.end || start;
  const base = {
    mode: "edit",
    source: src,
    title: fcEvent.title || "",
    start: start?.toISOString?.() || start,
    end: end?.toISOString?.() || end,
    allDay: fcEvent.allDay,
    readonly: src === "subscription",
    subscriptionId: props.subscriptionId || null,
    localEventId: props.localEventId || null,
  };

  if (src === "planning") {
    const v = getVorhabenById(planningStore, props.vorhabenId);
    const week = v?.wochen?.find((w) => w.id === props.weekId);
    const day = week?.days?.[props.weekday];
    const card = day?.cards?.find((c) => c.id === props.cardId);
    const lek = props.lektionId
      ? v?.lektionen?.find((l) => l.id === props.lektionId)
      : null;
    const fach = v?.fach || props.fach || "";
    return {
      ...base,
      vorhabenId: props.vorhabenId,
      initialVorhabenId: props.vorhabenId,
      weekId: props.weekId,
      weekday: props.weekday,
      cardId: props.cardId,
      cardType: card?.type || props.cardType || "notiz",
      durationMin: card?.durationMin ?? durationMinFromRange(base.start, base.end, base.allDay),
      notes: day?.notiz || lek?.notizen || "",
      lektionId: card?.lektionId || null,
      ritualId: card?.ritualId || null,
      vorhabenTitle: v?.title,
      templateLabel: templateLabel(v?.templateId),
      fach,
      draftFach: fach,
      klasse: v?.klasse,
      lektionTitle: lek?.title,
      weekFocus: week?.focus,
      links: buildPlanningLinks(v, props, lek),
    };
  }

  if (src === "local") {
    const localEv = calStore?.localEvents?.find((e) => e.id === props.localEventId);
    const vid = localEv?.vorhabenId || props.vorhabenId || "";
    const v = vid ? getVorhabenById(planningStore, vid) : null;
    const fach = v?.fach || localEv?.fach || props.fach || "";
    return {
      ...base,
      vorhabenId: vid,
      notes: localEv?.notes || props.notes || "",
      cardType: "notiz",
      durationMin: durationMinFromRange(base.start, base.end, base.allDay),
      vorhabenTitle: v?.title,
      fach,
      draftFach: fach,
      links: vid
        ? [
            { to: vorhabenLevelPath(vid, "grob"), label: "Thema öffnen" },
            { to: vorhabenOverviewSectionPath(vid, "woche"), label: "Woche im Thema" },
          ]
        : [],
    };
  }

  return {
    ...base,
    links: [],
  };
};

const buildPlanningLinks = (vorhaben, props, lektion) => {
  if (!vorhaben) {
    return [];
  }
  const links = [
    { to: vorhabenLevelPath(vorhaben.id, "grob"), label: "Grobplanung" },
    { to: vorhabenOverviewSectionPath(vorhaben.id, "woche"), label: "Woche im Thema" },
    { to: vorhabenLevelPath(vorhaben.id, "lektion"), label: "Lektionen" },
  ];
  if (lektion) {
    links.push({
      to: planungEntwurfPath({
        vorhabenId: vorhaben.id,
        text: lektion.title,
        uid: lektion.competencies?.[0]?.uid,
        code: lektion.competencies?.[0]?.code,
        fach: lektion.competencies?.[0]?.fach,
      }),
      label: "Stundenentwurf",
    });
  }
  return links;
};

/** Live-Vorschau im Raster während „Neuer Termin“ (neutral bis Thema gewählt). */
export const formToDraftPreviewEvent = (form, planningStore) => {
  if (!form || form.mode !== "create" || !form.start) {
    return null;
  }
  const vorhabenId = form.vorhabenId || "";
  const vorhaben = vorhabenId ? getVorhabenById(planningStore, vorhabenId) : null;
  const fach =
    vorhaben?.fach ||
    form.draftFach ||
    (form.mode !== "create" ? form.fach : "") ||
    "";
  const hasFachColor = Boolean(fach && normalizeFachKey(fach) !== "default");
  const source = vorhabenId ? "planning" : "local";
  const cardType = form.cardType || "notiz";
  const title = form.title?.length ? form.title : DRAFT_PREVIEW_DEFAULT_TITLE;
  const end =
    form.end ||
    new Date(new Date(form.start).getTime() + (form.durationMin || 45) * 60000).toISOString();

  const base = {
    id: DRAFT_PREVIEW_ID,
    title,
    start: form.start,
    end,
    allDay: Boolean(form.allDay),
    editable: false,
    display: "block",
    classNames: [
      ...calendarEventClassNames(source, cardType),
      "cal-event--draft-preview",
    ],
    extendedProps: {
      source,
      cardType,
      vorhabenId,
      fach,
      isDraftPreview: true,
      plain: !hasFachColor,
    },
  };

  return withBauhausEventStyle(base);
};

/** Vorschau im Wochenkalender beim Ziehen einer Lektion aus der Themen-Übersicht. */
export const lektionDragPreviewToEvent = (preview, planningStore) => {
  if (!preview?.slot || !preview?.lektionId || !preview?.vorhabenId) {
    return null;
  }
  const vorhaben = getVorhabenById(planningStore, preview.vorhabenId);
  const lek = vorhaben?.lektionen?.find((l) => l.id === preview.lektionId);
  if (!vorhaben || !lek) {
    return null;
  }

  const { start } = preview.slot;
  const durationMin = lek.durationMin || 45;
  const end = new Date(start.getTime() + durationMin * 60000);
  const colors = resolvePlanningEventColors(vorhaben, "lektion");

  return withBauhausEventStyle({
    id: LEKTION_DRAG_PREVIEW_ID,
    title: lek.title,
    start,
    end,
    editable: false,
    display: "block",
    classNames: [
      ...calendarEventClassNames("planning", "lektion"),
      "cal-event--drag-preview",
      "cal-event--lek-drag-preview",
    ],
    extendedProps: {
      source: "planning",
      cardType: "lektion",
      vorhabenId: vorhaben.id,
      lektionId: lek.id,
      fach: vorhaben.fach,
      isLektionDragPreview: true,
      eventAccent: colors.accent,
      eventBg: colors.bg,
      plain: false,
    },
  });
};

export const formFromSelection = (selectInfo) => {
  const start = selectInfo.start;
  const end = selectInfo.end || new Date(start.getTime() + 45 * 60000);
  const weekday = weekdayIdFromDate(start);
  return buildEmptyForm({
    mode: "create",
    source: "local",
    title: "",
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: selectInfo.allDay,
    vorhabenId: "",
    weekday,
    durationMin: selectInfo.allDay
      ? 0
      : Math.max(15, Math.round((end - start) / 60000)),
  });
};
