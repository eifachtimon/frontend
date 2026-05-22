import { apiUrl, API_ROOT } from "../api/lehrplanApi";
import { loadPlanningStore } from "../planning/planningStore";
import { localToCalendarEvents, vorhabenToCalendarEvents } from "./planningEvents";

/** Öffentliche Basis-URL für webcal-Abo (Deploy-URL oder API). */
export const getCalendarFeedBaseUrl = () => {
  const explicit = process.env.REACT_APP_PUBLIC_CALENDAR_URL;
  if (explicit != null && String(explicit).trim() !== "") {
    return String(explicit).trim().replace(/\/$/, "");
  }
  if (API_ROOT) {
    return API_ROOT.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://127.0.0.1:5001";
};

export const getOrCreateExportToken = (calStore, onStoreChange) => {
  if (calStore.exportToken) {
    return calStore.exportToken;
  }
  const token = `lp21-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  onStoreChange({ ...calStore, exportToken: token });
  return token;
};

export const feedUrlsForToken = (token) => {
  const base = getCalendarFeedBaseUrl();
  const httpsUrl = `${base}/api/calendar/feed/${encodeURIComponent(token)}.ics`;
  const webcalUrl = httpsUrl.replace(/^https:/i, "webcal:").replace(/^http:/i, "webcal:");
  return { httpsUrl, webcalUrl };
};

/** Planung aller Vorhaben + lokale Termine → FullCalendar-Format. */
export const collectExportEvents = (planningStore, calStore) => {
  const list = [];
  for (const v of planningStore?.vorhaben || []) {
    list.push(...vorhabenToCalendarEvents(v));
  }
  list.push(...localToCalendarEvents(calStore?.localEvents || []));
  return list;
};

export const fcEventsToPublishPayload = (fcEvents) =>
  fcEvents.map((ev) => ({
    uid: ev.id,
    title: ev.title,
    summary: ev.title,
    start: ev.start,
    end: ev.end || ev.start,
    allDay: Boolean(ev.allDay),
    description:
      ev.extendedProps?.source === "planning"
        ? `Planung (${ev.extendedProps?.cardType || "Eintrag"})`
        : "",
  }));

export const publishCalendarFeed = async (token, events) => {
  const response = await fetch(apiUrl("/api/calendar/publish"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, events: fcEventsToPublishPayload(events) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Sync fehlgeschlagen (${response.status})`);
  }
  return data;
};

export const downloadIcsFile = (events, filename = "lehrplan-planung.ics") => {
  const payload = fcEventsToPublishPayload(events);
  return fetch(apiUrl("/api/calendar/export"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: payload }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Export fehlgeschlagen");
      }
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
};

export const syncAllToAppleFeed = async (calStore, onStoreChange, planningStore) => {
  let store = calStore;
  const token = getOrCreateExportToken(store, (next) => {
    store = next;
    onStoreChange(next);
  });
  const events = collectExportEvents(planningStore || loadPlanningStore(), store);
  await publishCalendarFeed(token, events);
  const urls = feedUrlsForToken(token);
  return {
    token,
    eventCount: events.length,
    ...urls,
    syncedAt: new Date().toISOString(),
  };
};
