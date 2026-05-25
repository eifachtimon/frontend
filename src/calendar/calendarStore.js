import { recordUndoSnapshot } from "../undo/undoHistory";

export const CALENDAR_STORAGE_KEY = "lp21-calendar-v1";

const newId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const DEFAULT_SUBSCRIPTION_PRESETS = [
  {
    id: "preset-schule-bs",
    name: "Schulkalender Basel-Stadt",
    url: "https://www.bs.ch/schulen/schulkalender/schulkalender.ics",
    hint: "Offizielle URL ggf. auf bs.ch prüfen und eintragen.",
  },
];

const defaultStundenplan = () => ({
  enabled: true,
  slots: [],
});

const emptyStore = () => ({
  version: 2,
  subscriptions: [],
  subscriptionCache: {},
  localEvents: [],
  exportToken: null,
  lastAppleSync: null,
  stundenplan: defaultStundenplan(),
  settings: {
    defaultView: "timeGridWeek",
    slotMinTime: "07:00:00",
    slotMaxTime: "18:00:00",
  },
});

export const loadCalendarStore = () => {
  try {
    const raw = window.localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (!raw) {
      return emptyStore();
    }
    const parsed = JSON.parse(raw);
    return {
      ...emptyStore(),
      ...parsed,
      subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
      subscriptionCache: parsed.subscriptionCache || {},
      localEvents: Array.isArray(parsed.localEvents) ? parsed.localEvents : [],
      stundenplan: parsed.stundenplan
        ? {
            ...defaultStundenplan(),
            ...parsed.stundenplan,
            slots: Array.isArray(parsed.stundenplan.slots) ? parsed.stundenplan.slots : [],
          }
        : defaultStundenplan(),
    };
  } catch {
    return emptyStore();
  }
};

export const saveCalendarStore = (store) => {
  recordUndoSnapshot();
  window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("lp21-calendar-updated"));
  return store;
};

export const addSubscription = (store, partial = {}) => {
  const sub = {
    id: newId("sub"),
    name: partial.name || "Kalender",
    url: (partial.url || "").trim(),
    color: partial.color || "#6b9fd4",
    enabled: partial.enabled !== false,
    createdAt: Date.now(),
  };
  return saveCalendarStore({
    ...store,
    subscriptions: [...store.subscriptions, sub],
  });
};

export const updateSubscription = (store, id, patch) => {
  const subscriptions = store.subscriptions.map((s) =>
    s.id === id ? { ...s, ...patch } : s
  );
  return saveCalendarStore({ ...store, subscriptions });
};

export const removeSubscription = (store, id) => {
  const { [id]: _removed, ...subscriptionCache } = store.subscriptionCache || {};
  return saveCalendarStore({
    ...store,
    subscriptions: store.subscriptions.filter((s) => s.id !== id),
    subscriptionCache,
  });
};

export const setSubscriptionCache = (store, id, payload) => {
  return saveCalendarStore({
    ...store,
    subscriptionCache: {
      ...store.subscriptionCache,
      [id]: payload,
    },
  });
};

export const addLocalEvent = (store, partial = {}) => {
  const ev = {
    id: newId("ev"),
    title: partial.title || "Termin",
    start: partial.start,
    end: partial.end || partial.start,
    allDay: Boolean(partial.allDay),
    notes: partial.notes || "",
    vorhabenId: partial.vorhabenId || null,
  };
  if (partial.color != null && partial.color !== "") {
    ev.color = partial.color;
  }
  return saveCalendarStore({
    ...store,
    localEvents: [...store.localEvents, ev],
  });
};

export const updateLocalEvent = (store, id, patch) => {
  const localEvents = store.localEvents.map((e) =>
    e.id === id ? { ...e, ...patch } : e
  );
  return saveCalendarStore({ ...store, localEvents });
};

export const removeLocalEvent = (store, id) => {
  return saveCalendarStore({
    ...store,
    localEvents: store.localEvents.filter((e) => e.id !== id),
  });
};

export const setStundenplanEnabled = (store, enabled) =>
  saveCalendarStore({
    ...store,
    stundenplan: { ...store.stundenplan, enabled },
  });

export const upsertStundenplanSlot = (store, slot) => {
  const slots = store.stundenplan?.slots || [];
  const idx = slots.findIndex((s) => s.id === slot.id);
  const next = idx >= 0 ? slots.map((s, i) => (i === idx ? { ...s, ...slot } : s)) : [...slots, slot];
  return saveCalendarStore({
    ...store,
    stundenplan: { ...store.stundenplan, slots: next },
  });
};

export const removeStundenplanSlot = (store, slotId) =>
  saveCalendarStore({
    ...store,
    stundenplan: {
      ...store.stundenplan,
      slots: (store.stundenplan?.slots || []).filter((s) => s.id !== slotId),
    },
  });

export const replaceStundenplanSlots = (store, slots) =>
  saveCalendarStore({
    ...store,
    stundenplan: { ...store.stundenplan, slots },
  });
