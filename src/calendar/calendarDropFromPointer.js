const WEEKDAY_IDS = ["mo", "di", "mi", "do", "fr"];
const SLOT_MINUTES = 15;

const parseTimeAttr = (timeStr) => {
  const parts = (timeStr || "08:00:00").split(":").map(Number);
  return {
    hours: parts[0] ?? 8,
    minutes: parts[1] ?? 0,
  };
};

/** Stabiler Schlüssel — Vorschau nur bei echtem Slot-Wechsel aktualisieren. */
export const calendarSlotKey = (slot) => {
  if (!slot?.start) {
    return "";
  }
  const d = slot.start;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}-${slot.startMin ?? 0}`;
};

const dayColumns = (calendarRoot) =>
  [...calendarRoot.querySelectorAll(".fc-timegrid-col.fc-day[data-date]")];

const columnAtPointer = (calendarRoot, clientX, stickyDate) => {
  const cols = dayColumns(calendarRoot);
  if (!cols.length) {
    return null;
  }

  if (stickyDate) {
    const sticky = cols.find((col) => col.getAttribute("data-date") === stickyDate);
    if (sticky) {
      const rect = sticky.getBoundingClientRect();
      const pad = Math.min(16, rect.width * 0.12);
      if (clientX >= rect.left - pad && clientX <= rect.right + pad) {
        return sticky;
      }
    }
  }

  for (const col of cols) {
    const rect = col.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right) {
      return col;
    }
  }

  let nearest = cols[0];
  let nearestDist = Infinity;
  for (const col of cols) {
    const rect = col.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dist = Math.abs(clientX - center);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = col;
    }
  }
  return nearest;
};

const slotRows = (calendarRoot) =>
  [...calendarRoot.querySelectorAll(".fc-timegrid-slots tr")].filter((row) =>
    row.querySelector(".fc-timegrid-slot-lane")
  );

const timeAtPointer = (calendarRoot, clientY) => {
  const rows = slotRows(calendarRoot);
  if (!rows.length) {
    return { hours: 8, minutes: 0 };
  }

  for (const row of rows) {
    const rect = row.getBoundingClientRect();
    if (clientY >= rect.top && clientY < rect.bottom) {
      const label = row.querySelector("[data-time]");
      if (label) {
        return parseTimeAttr(label.getAttribute("data-time"));
      }
    }
  }

  const firstRect = rows[0].getBoundingClientRect();
  if (clientY < firstRect.top) {
    const label = rows[0].querySelector("[data-time]");
    if (label) {
      return parseTimeAttr(label.getAttribute("data-time"));
    }
  }

  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const rect = rows[i].getBoundingClientRect();
    if (clientY >= rect.top) {
      const label = rows[i].querySelector("[data-time]");
      if (label) {
        return parseTimeAttr(label.getAttribute("data-time"));
      }
    }
  }

  return { hours: 8, minutes: 0 };
};

/** Slot aus FullCalendar-Raster (nur Geometrie, ohne elementFromPoint). */
export const slotFromCalendarPointer = (calendarRoot, clientX, clientY, options = {}) => {
  if (!calendarRoot) {
    return null;
  }

  const rootRect = calendarRoot.getBoundingClientRect();
  if (
    clientX < rootRect.left ||
    clientX > rootRect.right ||
    clientY < rootRect.top ||
    clientY > rootRect.bottom
  ) {
    return null;
  }

  const col = columnAtPointer(calendarRoot, clientX, options.stickyDate);
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

  const { hours, minutes } = timeAtPointer(calendarRoot, clientY);
  const startMin = hours * 60 + minutes;
  const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const weekday = ["so", "mo", "di", "mi", "do", "fr", "sa"][start.getDay()];
  if (!WEEKDAY_IDS.includes(weekday)) {
    return null;
  }

  return { start, weekday, startMin, slotMinutes: SLOT_MINUTES };
};
