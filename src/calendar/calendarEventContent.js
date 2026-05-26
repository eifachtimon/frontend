import { DRAFT_PREVIEW_DEFAULT_TITLE, DRAFT_PREVIEW_EVENT_ID } from "./calendarEventResolve";

const pad2 = (n) => String(n).padStart(2, "0");

/** FC-EventApi kann beim Select-Mirror kurz ohne `_def` sein → Getter wirft sonst. */
export const safeEventAllDay = (event) => {
  if (!event) {
    return false;
  }
  try {
    return Boolean(event.allDay);
  } catch {
    return false;
  }
};

const safeEventTitle = (event) => {
  if (!event) {
    return "";
  }
  try {
    return String(event.title ?? "");
  } catch {
    return "";
  }
};

const safeEventExtendedProps = (event) => {
  if (!event) {
    return {};
  }
  try {
    return event.extendedProps || {};
  } catch {
    return {};
  }
};

const safeEventTimes = (event) => {
  if (!event) {
    return { start: null, end: null };
  }
  try {
    return { start: event.start ?? null, end: event.end ?? null };
  } catch {
    return { start: null, end: null };
  }
};

export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** @param {Date | null | undefined} start @param {Date | null | undefined} end */
export const eventDurationMinutes = (start, end) => {
  if (!start || !end) {
    return 0;
  }
  const ms = end.getTime() - start.getTime();
  if (ms <= 0) {
    return 0;
  }
  return Math.round(ms / 60000);
};

/** Bei ≤10 Min. wenig Höhe → Uhrzeit rechts neben dem Titel. */
export const compactUsesInlineTime = (minutes) => minutes > 0 && minutes <= 10;

/** @returns {"nano" | "micro" | "short" | null} */
export const eventCompactTier = (minutes, { allDay = false } = {}) => {
  if (allDay || minutes <= 0) {
    return null;
  }
  if (minutes <= 7) {
    return "nano";
  }
  if (minutes <= 14) {
    return "micro";
  }
  if (minutes <= 28) {
    return "short";
  }
  return null;
};

const formatClock = (date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

export const formatEventTimeRange = (start, end, { allDay = false } = {}) => {
  if (allDay || !start) {
    return "";
  }
  if (!end || end.getTime() <= start.getTime()) {
    return formatClock(start);
  }
  return `${formatClock(start)}–${formatClock(end)}`;
};

/** @param {"nano" | "micro" | "short"} tier */
const formatTimeLabel = (start, end, tier, inline) => {
  if (!start) {
    return "";
  }
  if (!end || end.getTime() <= start.getTime()) {
    return formatClock(start);
  }
  if (inline) {
    return `${formatClock(start)}–${formatClock(end)}`;
  }
  if (tier === "nano") {
    return formatClock(start);
  }
  return `${formatClock(start)}–${formatClock(end)}`;
};

const compactFontRem = (tier, minutes) => {
  if (tier === "nano") {
    return minutes <= 5 ? 0.48 : 0.52;
  }
  if (tier === "micro") {
    return minutes <= 10 ? 0.54 : 0.58;
  }
  return 0.6;
};

const compactBlockHtml = (tier, title, timeLabel, minutes) => {
  const fontRem = compactFontRem(tier, minutes);
  const inline = compactUsesInlineTime(minutes);
  const inlineClass = inline ? " cal-event-compact--inline" : "";
  const tip = timeLabel ? `${title} (${timeLabel})` : title;
  const tipAttr = tip ? ` title="${escapeHtml(tip)}" aria-label="${escapeHtml(tip)}"` : "";
  return `<div class="cal-event-compact cal-event-compact--${tier}${inlineClass}" style="font-size:${fontRem}rem"${tipAttr}><span class="cal-event-compact-title">${escapeHtml(title)}</span><span class="cal-event-compact-time">${escapeHtml(timeLabel)}</span></div>`;
};

const stackBlockHtml = (title, timeLabel) => {
  const tip = timeLabel ? `${title} (${timeLabel})` : title;
  const tipAttr = tip ? ` title="${escapeHtml(tip)}" aria-label="${escapeHtml(tip)}"` : "";
  const timeHtml = timeLabel
    ? `<div class="fc-event-time">${escapeHtml(timeLabel)}</div>`
    : "";
  return `<div class="cal-event-stack"${tipAttr}><div class="fc-event-title">${escapeHtml(title)}</div>${timeHtml}</div>`;
};

/** FullCalendar Select-Mirror beim Anlegen (nicht Event-Drag). */
export const isNewAppointmentSelectMirrorArg = (arg) => {
  const event = arg?.event;
  if (!event) {
    return false;
  }
  const props = safeEventExtendedProps(event);
  if (props.isDraftPreview) {
    return false;
  }
  const isMirror =
    Boolean(arg.isMirror) ||
    event.classNames?.includes?.("fc-event-mirror") ||
    arg.el?.classList?.contains?.("fc-event-mirror");
  if (!isMirror) {
    return false;
  }
  const eventId = String(event.id || "");
  if (/^(local-|plan-)/.test(eventId)) {
    return false;
  }
  if (eventId === DRAFT_PREVIEW_EVENT_ID) {
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
  const classNames = event.classNames || [];
  if (
    classNames.includes("cal-event--drag-preview") ||
    classNames.includes("cal-event--active-drag")
  ) {
    return false;
  }
  return true;
};

export const resolveEventDisplayTitle = (event, arg) => {
  const raw = safeEventTitle(event).trim();
  if (raw) {
    return raw;
  }
  const props = safeEventExtendedProps(event);
  if (props.isDraftPreview || event.id === DRAFT_PREVIEW_EVENT_ID) {
    return DRAFT_PREVIEW_DEFAULT_TITLE;
  }
  if (isNewAppointmentSelectMirrorArg(arg)) {
    return DRAFT_PREVIEW_DEFAULT_TITLE;
  }
  return "";
};

const COMPACT_LAYOUT_CLASSES = [
  "cal-event--compact",
  "cal-event--nano",
  "cal-event--micro",
  "cal-event--short",
  "cal-event--inline-time",
];

/** @returns {string[]} */
export const compactClassNamesForMinutes = (mins) => {
  const tier = eventCompactTier(mins);
  if (!tier) {
    return [];
  }
  const classes = ["cal-event--compact"];
  if (tier === "nano") {
    classes.push("cal-event--nano");
  } else if (tier === "micro") {
    classes.push("cal-event--micro");
  } else if (tier === "short") {
    classes.push("cal-event--short");
  }
  if (compactUsesInlineTime(mins)) {
    classes.push("cal-event--inline-time");
  }
  return classes;
};

/**
 * Gleiche HTML-Struktur wie renderTimeGridEventContent (Vorschau = finaler Termin).
 * @returns {{ html: string, compactClasses: string[] }}
 */
export const buildTimeGridEventContentHtml = ({
  title,
  start,
  end,
  allDay = false,
}) => {
  const displayTitle = String(title ?? "").trim() || DRAFT_PREVIEW_DEFAULT_TITLE;
  if (allDay || !start) {
    return { html: stackBlockHtml(displayTitle, ""), compactClasses: [] };
  }
  const endResolved = end || start;
  const mins = eventDurationMinutes(start, endResolved);
  const tier = eventCompactTier(mins, { allDay });
  if (tier) {
    const inline = compactUsesInlineTime(mins);
    const timeLabel = formatTimeLabel(start, endResolved, tier, inline);
    return {
      html: compactBlockHtml(tier, displayTitle, timeLabel, mins),
      compactClasses: compactClassNamesForMinutes(mins),
    };
  }
  const timeLabel = formatEventTimeRange(start, endResolved, { allDay });
  return {
    html: stackBlockHtml(displayTitle, timeLabel),
    compactClasses: [],
  };
};

/**
 * Erzwingt die finale Termin-UI im DOM (FC rendert eventContent bei setProp('title') oft nicht neu).
 * @returns {boolean}
 */
export const repaintTimeGridEventEl = (el, { title, start, end, allDay = false }) => {
  if (!el) {
    return false;
  }
  const main = el.querySelector(".fc-event-main");
  if (!main) {
    return false;
  }
  const { html, compactClasses } = buildTimeGridEventContentHtml({
    title,
    start,
    end,
    allDay,
  });
  main.innerHTML = html;
  COMPACT_LAYOUT_CLASSES.forEach((cls) => el.classList.remove(cls));
  compactClasses.forEach((cls) => el.classList.add(cls));
  return true;
};

/** @deprecated — nutzt repaintTimeGridEventEl */
export const syncEventLabelsDom = (el, opts) => repaintTimeGridEventEl(el, opts);

/** Select-Mirror beim Ziehen eines neuen Termins (nicht Event-Drag / Draft). */
export const isNewAppointmentSelectMirrorEl = (el) => {
  if (!el?.classList?.contains("fc-event-mirror")) {
    return false;
  }
  if (
    el.classList.contains("cal-event--draft-preview") ||
    el.classList.contains("cal-event--drag-preview") ||
    el.classList.contains("cal-event--lek-drag-preview") ||
    el.classList.contains("cal-event--active-drag") ||
    el.classList.contains("cal-stundenplan-slot")
  ) {
    return false;
  }
  if (el.classList.contains("cal-event--fach") || el.querySelector("[class*='fach-tone']")) {
    return false;
  }
  const eventId = String(el.getAttribute("data-event-id") || "");
  if (/^(local-|plan-)/.test(eventId)) {
    return false;
  }
  return true;
};

/** @returns {boolean} */
export const paintNewAppointmentSelectMirrorEl = (el, paintOpts) => {
  if (!isNewAppointmentSelectMirrorEl(el)) {
    return false;
  }
  return repaintTimeGridEventEl(el, paintOpts);
};

/**
 * Einheitliche Darstellung für Zeitgrid-Termine (Vorschau = finaler Termin).
 * @param {import("@fullcalendar/core").EventContentArg} arg
 */
export const renderTimeGridEventContent = (arg) => {
  const { event, view } = arg;
  if (!event || !view?.type?.startsWith("timeGrid")) {
    return true;
  }
  const allDay = safeEventAllDay(event);
  if (allDay) {
    return true;
  }

  const { start, end: endRaw } = safeEventTimes(event);
  const end = endRaw || start;
  const title = resolveEventDisplayTitle(event, arg);
  const { html } = buildTimeGridEventContentHtml({
    title,
    start,
    end,
    allDay,
  });
  return { html };
};

/** @param {import("@fullcalendar/core").EventContentArg} arg */
export const eventCompactClassNames = (arg) => {
  if (arg.view?.type?.startsWith("timeGrid") && arg.event && !safeEventAllDay(arg.event)) {
    const { start, end } = safeEventTimes(arg.event);
    return compactClassNamesForMinutes(eventDurationMinutes(start, end));
  }
  return [];
};
