/**
 * Apple-ähnlich: 1. Klick = Termin auswählen (hervorgehoben), 2. Klick = Bearbeiten öffnen.
 * @returns {{ openEditor: boolean, selectOnly: boolean }}
 */
export const resolveCalendarEventClick = ({
  eventId,
  selectedEventId,
  modalOpen,
}) => {
  if (selectedEventId === eventId) {
    if (modalOpen) {
      return { openEditor: false, selectOnly: false };
    }
    return { openEditor: true, selectOnly: false };
  }
  return { openEditor: false, selectOnly: true };
};
