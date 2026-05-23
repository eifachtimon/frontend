const KEY = "lp21-cal-chrome-expanded";

/** Standard: mehr Platz fürs Raster (Filter-Leiste eingeklappt). */
export const loadCalendarChromeExpanded = () => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw === null) {
      return false;
    }
    return raw === "1";
  } catch {
    return false;
  }
};

export const saveCalendarChromeExpanded = (expanded) => {
  try {
    sessionStorage.setItem(KEY, expanded ? "1" : "0");
  } catch {
    // ignore
  }
};
