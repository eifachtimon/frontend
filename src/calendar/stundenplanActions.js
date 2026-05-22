import {
  removeStundenplanSlot,
  upsertStundenplanSlot,
} from "./calendarStore";
import { slotFromFcEvent } from "./stundenplanEvents";

const newSlotId = () => `stp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const buildSlotFromSelection = (selectInfo, partial = {}) => {
  const times = slotFromFcEvent({
    start: selectInfo.start,
    end: selectInfo.end,
  });
  return {
    id: newSlotId(),
    weekday: times.weekday || "mo",
    startMin: times.startMin,
    endMin: times.endMin,
    durationMin: times.durationMin,
    label: "",
    lektionId: null,
    vorhabenId: partial.vorhabenId || null,
  };
};

export const applyStundenplanEventDrop = (calStore, dropInfo, onCalStoreChange) => {
  const props = dropInfo.event.extendedProps || {};
  if (props.source !== "stundenplan" || !props.slotId) {
    return;
  }
  const times = slotFromFcEvent(dropInfo.event);
  const existing = calStore.stundenplan.slots.find((s) => s.id === props.slotId);
  if (!existing) {
    dropInfo.revert();
    return;
  }
  onCalStoreChange(
    upsertStundenplanSlot(calStore, {
      ...existing,
      weekday: times.weekday || existing.weekday,
      startMin: times.startMin,
      endMin: times.endMin,
      durationMin: times.durationMin,
    })
  );
};

export const saveStundenplanSlot = (calStore, slot, onCalStoreChange) => {
  const withId = slot.id || newSlotId();
  onCalStoreChange(upsertStundenplanSlot(calStore, { ...slot, id: withId }));
};

export const deleteStundenplanSlotById = (calStore, slotId, onCalStoreChange) => {
  onCalStoreChange(removeStundenplanSlot(calStore, slotId));
};
