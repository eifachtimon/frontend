import { planungEntwurfPath, vorhabenLevelPath } from "../config/appUrls";
import { VORHABEN_TEMPLATES, WEEKDAYS } from "../planning/planningDefaults";
import { getVorhabenById } from "../planning/planningStore";
import { weekdayIdFromDate } from "./planningEvents";

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
});

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
    return {
      ...base,
      vorhabenId: props.vorhabenId,
      weekId: props.weekId,
      weekday: props.weekday,
      cardId: props.cardId,
      cardType: card?.type || props.cardType || "notiz",
      durationMin: card?.durationMin ?? 45,
      notes: day?.notiz || lek?.notizen || "",
      lektionId: card?.lektionId || null,
      ritualId: card?.ritualId || null,
      vorhabenTitle: v?.title,
      templateLabel: templateLabel(v?.templateId),
      fach: v?.fach,
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
    return {
      ...base,
      vorhabenId: vid,
      notes: localEv?.notes || props.notes || "",
      cardType: "notiz",
      vorhabenTitle: v?.title,
      links: vid
        ? [
            { to: vorhabenLevelPath(vid, "grob"), label: "Vorhaben öffnen" },
            { to: vorhabenLevelPath(vid, "woche"), label: "Wochenplan" },
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
    { to: vorhabenLevelPath(vorhaben.id, "woche"), label: "Wochenplan" },
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

export const formFromSelection = (selectInfo, defaultVorhabenId) => {
  const start = selectInfo.start;
  const end = selectInfo.end || new Date(start.getTime() + 45 * 60000);
  const weekday = weekdayIdFromDate(start);
  return buildEmptyForm({
    mode: "create",
    source: defaultVorhabenId ? "planning" : "local",
    title: "",
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: selectInfo.allDay,
    vorhabenId: defaultVorhabenId || "",
    weekday,
    durationMin: selectInfo.allDay
      ? 0
      : Math.max(15, Math.round((end - start) / 60000)),
  });
};
