import { useCallback, useState } from "react";
import { deleteEventFromForm, saveEventFromForm } from "./calendarActions";
import {
  anchorFromEventClick,
  anchorFromSelectInfo,
} from "./calendarEventAnchor";
import { buildEmptyForm, formFromFcEvent, formFromSelection } from "./calendarEventResolve";

/**
 * Gemeinsame Termin-Modal-Logik für Kalender, Home und Wochenplan.
 */
const useCalendarTerminModal = ({
  planningStore,
  calStore,
  onPlanningStoreChange,
  onCalStoreChange,
  draftVorhabenId = "",
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState(null);
  const [eventAnchor, setEventAnchor] = useState(null);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEventForm(null);
    setEventAnchor(null);
  }, []);

  const openCreate = useCallback(
    (start = new Date(), end = new Date(Date.now() + 45 * 60000)) => {
      setEventAnchor(null);
      setEventForm(
        buildEmptyForm({
          mode: "create",
          source: "local",
          vorhabenId: "",
          start: start.toISOString(),
          end: end.toISOString(),
        })
      );
      setModalOpen(true);
    },
    []
  );

  const handleEventClick = useCallback(
    (info) => {
      if (info.event.extendedProps?.source === "stundenplan") {
        return;
      }
      info.jsEvent?.preventDefault?.();
      setEventAnchor(anchorFromEventClick(info));
      setEventForm(formFromFcEvent(info.event, planningStore, calStore));
      setModalOpen(true);
    },
    [planningStore, calStore]
  );

  const handleDateSelect = useCallback(
    (selectInfo) => {
      const anchor = anchorFromSelectInfo(selectInfo);
      setEventAnchor(anchor);
      setEventForm(formFromSelection(selectInfo));
      setModalOpen(true);
    },
    []
  );

  const canDeleteEvent =
    Boolean(eventForm) &&
    !eventForm?.readonly &&
    eventForm?.mode === "edit" &&
    (eventForm?.cardId || eventForm?.localEventId);

  const handleSaveEvent = useCallback(() => {
    if (!eventForm?.title?.trim()) {
      return;
    }
    saveEventFromForm({
      form: { ...eventForm, title: eventForm.title.trim() },
      planningStore,
      calStore,
      onPlanningStoreChange,
      onCalStoreChange,
    });
    closeModal();
  }, [
    eventForm,
    planningStore,
    calStore,
    onPlanningStoreChange,
    onCalStoreChange,
    closeModal,
  ]);

  const handleDeleteEvent = useCallback(
    (opts = {}) => {
      if (!eventForm || !canDeleteEvent) {
        return;
      }
      if (!opts.fromKeyboard && !window.confirm("Termin wirklich löschen?")) {
        return;
      }
      deleteEventFromForm({
        form: eventForm,
        planningStore,
        calStore,
        onPlanningStoreChange,
        onCalStoreChange,
      });
      closeModal();
    },
    [
      eventForm,
      canDeleteEvent,
      planningStore,
      calStore,
      onPlanningStoreChange,
      onCalStoreChange,
      closeModal,
    ]
  );

  return {
    modalOpen,
    eventForm,
    eventAnchor,
    setEventForm,
    closeModal,
    openCreate,
    handleEventClick,
    handleDateSelect,
    handleSaveEvent,
    handleDeleteEvent,
    canDeleteEvent,
  };
};

export default useCalendarTerminModal;
