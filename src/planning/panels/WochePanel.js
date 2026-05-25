import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CalendarView from "../../calendar/CalendarView";
import CalendarEventModal from "../../calendar/CalendarEventModal";
import { loadCalFilters } from "../../calendar/calendarFilters";
import { loadCalendarStore, saveCalendarStore } from "../../calendar/calendarStore";
import useCalendarTerminModal from "../../calendar/useCalendarTerminModal";
import {
  useEditShortcutsTick,
  useRegisterEditShortcuts,
} from "../../hooks/EditShortcutsProvider";
import { APP_ROUTES } from "../../config/appUrls";
import "../../calendar/calendar.css";
import ThemaPanelShell from "../ThemaPanelShell";
import WocheErinnerungen from "../WocheErinnerungen";
import usePlanningStore from "../usePlanningStore";

const WochePanel = ({ vorhaben, rituals, onChange }) => {
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
    setEventForm,
    closeModal,
    handleEventClick,
    handleDateSelect,
    handleSaveEvent,
    handleDeleteEvent,
    canDeleteEvent,
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

  const openReminderCount = (vorhaben.erinnerungen || []).filter((e) => !e.done).length;

  useRegisterEditShortcuts({
    onDelete: () => handleDeleteEvent({ fromKeyboard: true }),
    canDelete: modalOpen && canDeleteEvent,
  });

  return (
    <ThemaPanelShell
      levelId="woche"
      fach={vorhaben.fach}
      vorhabenId={vorhaben.id}
      variant="compact"
    >
      <div className="planning-panel planning-panel--woche">
        <section
          className="thema-woche-block thema-woche-block--primary"
          aria-labelledby="woche-cal-block"
        >
          <h3 id="woche-cal-block" className="thema-woche-block-title">
            Kalenderwoche
          </h3>
          <p className="planning-hint woche-cal-hint">
            Lektion aus der Ziehen-Leiste auf einen Slot ziehen — oder leeren Slot anklicken.
            Alle Themen im{" "}
            <Link to={APP_ROUTES.kalender}>globalen Kalender</Link>.{" "}
            <span className="planning-kbd-hint">
              <kbd>⌘Z</kbd> Rückgängig · <kbd>Entf</kbd> Löschen
            </span>
          </p>
          <div className="thema-woche-cal-wrap">
            <CalendarView
              calendarStore={calStore}
              onCalendarStoreChange={persistCal}
              planningStore={store}
              saveVorhaben={onChange}
              filters={scopedFilters}
              draftVorhabenId={vorhaben?.id}
              rituals={rituals}
              showExternalEvents
              muteTodayHighlight
              onEventClick={handleEventClick}
              onDateSelect={handleDateSelect}
              initialView="timeGridWeek"
              spacious
              height="min(58vh, 680px)"
              compactExternal
              showDragStrip
            />
          </div>
        </section>

        <details className="thema-woche-erinnerungen-details">
          <summary className="thema-woche-erinnerungen-summary">
            Todos
            {openReminderCount > 0 ? (
              <span className="thema-woche-erinnerungen-badge">{openReminderCount}</span>
            ) : null}
          </summary>
          <div className="thema-woche-erinnerungen-body">
            <WocheErinnerungen vorhaben={vorhaben} onChange={onChange} />
          </div>
        </details>

        <CalendarEventModal
          open={modalOpen}
          form={eventForm}
          anchor={eventAnchor}
          onChange={setEventForm}
          onClose={closeModal}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          vorhabenOptions={store.vorhaben}
          lektionOptions={vorhaben?.lektionen || []}
        />
      </div>
    </ThemaPanelShell>
  );
};

export default WochePanel;
