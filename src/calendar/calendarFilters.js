import { VORHABEN_TEMPLATES } from "../planning/planningDefaults";

export const DEFAULT_CAL_FILTERS = {
  search: "",
  vorhabenIds: [],
  templateIds: [],
  showSubscriptions: true,
  showLocal: true,
  showPlanning: true,
  showStundenplan: true,
  stundenplanEditMode: false,
};

export const loadCalFilters = () => {
  try {
    const raw = sessionStorage.getItem("lp21-cal-filters");
    if (!raw) {
      return { ...DEFAULT_CAL_FILTERS };
    }
    return { ...DEFAULT_CAL_FILTERS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CAL_FILTERS };
  }
};

export const saveCalFilters = (filters) => {
  sessionStorage.setItem("lp21-cal-filters", JSON.stringify(filters));
  return filters;
};

export const matchesSearch = (event, q) => {
  if (!q) {
    return true;
  }
  const hay = [
    event.title,
    event.extendedProps?.vorhabenTitle,
    event.extendedProps?.fach,
    event.extendedProps?.templateLabel,
    event.extendedProps?.notes,
    event.extendedProps?.cardType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
};

export const countActiveCalendarFilters = (filters) => {
  let n = 0;
  if (filters.vorhabenIds?.length) {
    n += 1;
  }
  if (filters.templateIds?.length) {
    n += 1;
  }
  return n;
};

export const countActiveStundenplanOptions = (filters) => {
  let n = 0;
  if (filters.showStundenplan === false) {
    n += 1;
  }
  if (filters.stundenplanEditMode) {
    n += 1;
  }
  return n;
};

export const filterCalendarEvents = (events, filters, options = {}) => {
  const { applySearch = true } = options;
  const q = applySearch ? (filters.search || "").trim().toLowerCase() : "";
  const vorhabenSet =
    filters.vorhabenIds?.length > 0 ? new Set(filters.vorhabenIds) : null;
  const templateSet =
    filters.templateIds?.length > 0 ? new Set(filters.templateIds) : null;

  return events.filter((ev) => {
    const src = ev.extendedProps?.source;
    if (src === "subscription" && !filters.showSubscriptions) {
      return false;
    }
    if (src === "local" && !filters.showLocal) {
      return false;
    }
    if (src === "planning" && !filters.showPlanning) {
      return false;
    }
    if (applySearch && q && !matchesSearch(ev, q)) {
      return false;
    }
    if (src === "planning") {
      if (vorhabenSet && !vorhabenSet.has(ev.extendedProps?.vorhabenId)) {
        return false;
      }
      if (templateSet && !templateSet.has(ev.extendedProps?.templateId)) {
        return false;
      }
    }
    if (src === "local" && vorhabenSet && ev.extendedProps?.vorhabenId) {
      if (!vorhabenSet.has(ev.extendedProps.vorhabenId)) {
        return false;
      }
    }
    return true;
  });
};

export const templateOptions = () =>
  VORHABEN_TEMPLATES.map((t) => ({ id: t.id, label: t.label }));
