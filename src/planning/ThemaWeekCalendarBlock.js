import React, { useCallback, useEffect, useMemo, useState } from "react";
import CalendarView from "../calendar/CalendarView";
import CalendarEventModal from "../calendar/CalendarEventModal";
import { loadCalFilters } from "../calendar/calendarFilters";
import { loadCalendarStore, saveCalendarStore } from "../calendar/calendarStore";
import useCalendarTerminModal from "../calendar/useCalendarTerminModal";
import {
  useEditShortcutsTick,
  useRegisterEditShortcuts,
} from "../hooks/EditShortcutsProvider";
import usePlanningStore from "./usePlanningStore";
import "../calendar/calendar.css";

const ThemaWeekCalendarBlock = ({
  vorhaben,
  rituals,
  onChange,
  lektionDragPreview = null,
  compactHeader = false,
}) => {
  const { store } = usePlanningStore();
  const undoTick = useEditShortcutsTick();
  const [calStore, setCalStore] = useState(loadCalendarStore);
  const persistCal = useCallback((next) => setCalStore(saveCalendarStore(next)), []);

  const [filters] = useState(() => ({
    ...loadCalFilters(),
    vorhabenIds: vorhaben ? [vorhaben.id] : [],
  }));

  const {
    modalOpen,
    eventForm,
    eventAnchor,
    selectedEventId,
    setEventForm,
    closeModal,
    handleEventClick,
    handleDateClick,
    handleDateSelect,
    handleSaveEvent,
    handleDeleteEvent,
    canDeleteEvent,
    handleCreateVorhaben,
  } = useCalendarTerminModal({
    planningStore: store,
    calStore,
    onPlanningStoreChange: onChange,
    onCalStoreChange: persistCal,
    draftVorhabenId: vorhaben?.id,
  });

  useEffect(() => {
    setCalStore(loadCalendarStore());
  }, [undoTick]);

  useEffect(() => {
    const onCalUpdate = () => setCalStore(loadCalendarStore());
    window.addEventListener("lp21-calendar-updated", onCalUpdate);
    return () => window.removeEventListener("lp21-calendar-updated", onCalUpdate);
  }, []);

  const scopedFilters = useMemo(
    () => ({
      ...filters,
      vorhabenIds: vorhaben ? [vorhaben.id] : [],
      showPlanning: true,
    }),
    [filters, vorhaben?.id]
  );

  useRegisterEditShortcuts({
    onDelete: () => handleDeleteEvent({ fromKeyboard: true }),
    canDelete: modalOpen && canDeleteEvent,
  });

  return (
    <section
      id="thema-section-woche"
      className="thema-unified-section thema-unified-section--woche thema-dashboard__woche"
      aria-labelledby="thema-woche-title"
    >
      {!compactHeader ? (
        <h2 id="thema-woche-title" className="thema-overview-section-title">
          Kalenderwoche
        </h2>
      ) : (
        <h2 id="thema-woche-title" className="planning-sr-only">
          Kalenderwoche
        </h2>
      )}

      <div className="thema-woche-cal-wrap">
        <CalendarView
          calendarStore={calStore}
          onCalendarStoreChange={persistCal}
          planningStore={store}
          saveVorhaben={onChange}
          filters={scopedFilters}
          draftVorhabenId={vorhaben?.id}
          lektionDragPreview={lektionDragPreview}
          rituals={rituals}
          showExternalEvents={false}
          showDragStrip={false}
          muteTodayHighlight
          onEventClick={handleEventClick}
          onDateSelect={handleDateSelect}
          onDateClick={handleDateClick}
          focusedFcEventId={selectedEventId}
          initialView="timeGridWeek"
          spacious
          height="100%"
        />
      </div>
      <p className="planning-kbd-hint thema-unified-kbd thema-unified-kbd--desktop">
        <kbd>⌘Z</kbd> Rückgängig · <kbd>Entf</kbd> Termin löschen
      </p>

      <CalendarEventModal
        open={modalOpen}
        form={eventForm}
        anchor={eventAnchor}
        onChange={setEventForm}
        onClose={closeModal}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onCreateVorhaben={handleCreateVorhaben}
        vorhabenOptions={store.vorhaben}
        lektionOptions={vorhaben?.lektionen || []}
      />
    </section>
  );
};

export default ThemaWeekCalendarBlock;
