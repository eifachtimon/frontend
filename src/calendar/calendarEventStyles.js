import {
  getFachAccentColor,
  normalizeFachKey,
  resolvePlanningEventColors,
} from "../planning/fachColors";

/** Fallback wenn kein Fach gesetzt */
export const VORHABEN_ACCENT_COLORS = [
  "#1040c0",
  "#d02020",
  "#f0c020",
  "#121212",
  "#0d3699",
  "#c01818",
];

export const vorhabenAccentColor = (vorhabenId) => {
  let h = 0;
  for (let i = 0; i < (vorhabenId || "").length; i += 1) {
    h = (h + vorhabenId.charCodeAt(i)) % VORHABEN_ACCENT_COLORS.length;
  }
  return VORHABEN_ACCENT_COLORS[h];
};

export const accentForCard = (cardType, vorhabenId, fach = "") => {
  if (fach && normalizeFachKey(fach) !== "default") {
    return getFachAccentColor(fach, vorhabenId);
  }
  if (cardType === "ritual") {
    return "#1040c0";
  }
  if (cardType === "notiz") {
    return "#666666";
  }
  return vorhabenAccentColor(vorhabenId);
};

export const calendarEventClassNames = (source, cardType) => {
  const classes = ["cal-event"];
  if (source) {
    classes.push(`cal-event--${source}`);
  }
  if (cardType) {
    classes.push(`cal-event--${cardType}`);
  }
  return classes;
};

/** FullCalendar-Event ohne Vollflächenfarbe — Styling per CSS + --cal-event-accent */
export const accentForExternalKind = (kind, vorhabenId, fach = "") => {
  if (fach && normalizeFachKey(fach) !== "default") {
    return getFachAccentColor(fach, vorhabenId);
  }
  if (kind === "ritual") {
    return "#1040c0";
  }
  if (kind === "lektion") {
    return vorhabenAccentColor(vorhabenId);
  }
  if (kind === "stundenplan-lektion") {
    return "#1040c0";
  }
  return "#f0c020";
};

/** FullCalendar Draggable — Vorschau beim Ablegen auf dem Raster */
export const externalDragEventData = (eventEl, draftVorhabenId, draftFach = "") => {
  const kind = eventEl.dataset.kind || "generic";
  const title = eventEl.dataset.title || "Termin";
  const minutes = Number(eventEl.dataset.duration) || (kind === "ritual" ? 15 : 45);
  const eventAccent = accentForExternalKind(kind, draftVorhabenId, draftFach);

  const extendedProps = {
    eventAccent,
    vorhabenId: draftVorhabenId,
  };

  let cardType = "notiz";
  if (kind === "ritual") {
    cardType = "ritual";
    extendedProps.source = "external-ritual";
    extendedProps.ritualId = eventEl.dataset.ritualId;
  } else if (kind === "lektion") {
    cardType = "lektion";
    extendedProps.source = "external-lektion";
    extendedProps.lektionId = eventEl.dataset.lektionId;
  } else if (kind === "stundenplan-lektion") {
    cardType = "lektion";
    extendedProps.source = "external-stundenplan-lektion";
    extendedProps.lektionId = eventEl.dataset.lektionId;
    extendedProps.vorhabenId = eventEl.dataset.vorhabenId || draftVorhabenId;
  } else {
    extendedProps.source = "external-generic";
  }

  return {
    title,
    duration: { minutes },
    backgroundColor: "transparent",
    borderColor: "transparent",
    textColor: "#121212",
    classNames: [
      "cal-event",
      "cal-event--drag-preview",
      ...calendarEventClassNames("external", cardType),
    ],
    extendedProps: {
      ...extendedProps,
      cardType,
    },
  };
};

export const withBauhausEventStyle = (event) => {
  const source = event.extendedProps?.source;
  const cardType = event.extendedProps?.cardType;
  const fach = event.extendedProps?.fach || "";
  const vorhabenId = event.extendedProps?.vorhabenId || "";
  const resolved = resolvePlanningEventColors({ fach, id: vorhabenId }, cardType);
  const accent =
    event.extendedProps?.eventAccent ||
    resolved.accent ||
    (source === "local" ? "#f0c020" : source === "subscription" ? "#1040c0" : "#1040c0");
  const eventBg = event.extendedProps?.eventBg ?? resolved.bg;

  return {
    ...event,
    classNames: [
      ...calendarEventClassNames(source, cardType),
      ...(eventBg ? ["cal-event--fach"] : []),
      ...(resolved.toneClass ? resolved.toneClass.split(" ").filter(Boolean) : []),
      ...(event.classNames || []),
    ],
    backgroundColor: "transparent",
    borderColor: "transparent",
    textColor: "#121212",
    extendedProps: {
      ...event.extendedProps,
      eventAccent: accent,
      eventBg,
    },
  };
};
