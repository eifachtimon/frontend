const WEEKDAY_IDS = ["mo", "di", "mi", "do", "fr"];

/** Slot aus FullCalendar-Raster (Zeigerposition). */
export const slotFromCalendarPointer = (calendarRoot, clientX, clientY) => {
  if (!calendarRoot) {
    return null;
  }
  const hit = document.elementFromPoint(clientX, clientY);
  if (!hit || !calendarRoot.contains(hit)) {
    return null;
  }

  const col = hit.closest("[data-date]");
  if (!col) {
    return null;
  }

  const dateStr = col.getAttribute("data-date");
  if (!dateStr) {
    return null;
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const slot = hit.closest("[data-time]");
  let hours = 8;
  let minutes = 0;
  if (slot) {
    const timeStr = slot.getAttribute("data-time") || "08:00:00";
    const parts = timeStr.split(":").map(Number);
    hours = parts[0] ?? 8;
    minutes = parts[1] ?? 0;
  }

  const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const weekday = ["so", "mo", "di", "mi", "do", "fr", "sa"][start.getDay()];
  if (!WEEKDAY_IDS.includes(weekday)) {
    return null;
  }

  const startMin = hours * 60 + minutes;
  return { start, weekday, startMin };
};
