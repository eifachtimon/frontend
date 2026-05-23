import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CalendarView from "../../calendar/CalendarView";
import CalendarEventModal from "../../calendar/CalendarEventModal";
import { deleteEventFromForm, saveEventFromForm } from "../../calendar/calendarActions";
import { formFromFcEvent, formFromSelection } from "../../calendar/calendarEventResolve";
import { loadCalFilters } from "../../calendar/calendarFilters";
import { loadCalendarStore, saveCalendarStore } from "../../calendar/calendarStore";
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
  const { store: planningStore } = usePlanningStore();
  const undoTick = useEditShortcutsTick();
  const [calStore, setCalStore] = useState(loadCalendarStore);
  const persistCal = (next) => setCalStore(saveCalendarStore(next));
  const [filters] = useState(() => ({
    ...loadCalFilters(),
    vorhabenIds: vorhaben ? [vorhaben.id] : [],
  }));
  const [modalOpen, setModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState(null);

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

  const closeModal = () => {
    setModalOpen(false);
    setEventForm(null);
  };

  const canDeleteEvent =
    Boolean(eventForm) &&
    !eventForm?.readonly &&
    eventForm?.mode === "edit" &&
    (eventForm?.cardId || eventForm?.localEventId);

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
        onPlanningStoreChange: onChange,
        onCalStoreChange: persistCal,
      });
      closeModal();
    },
    [eventForm, canDeleteEvent, planningStore, calStore, onChange]
  );

  useRegisterEditShortcuts({
    onDelete: () => handleDeleteEvent({ fromKeyboard: true }),
    canDelete: modalOpen && canDeleteEvent,
  });

  return (
    <ThemaPanelShell levelId="woche" fach={vorhaben.fach} vorhabenId={vorhaben.id}>
      <div className="planning-panel planning-panel--woche">
        <section className="thema-woche-block" aria-labelledby="woche-erinnerungen-block">
          <h3 id="woche-erinnerungen-block" className="thema-woche-block-title">
            Erinnerungen &amp; To-dos
          </h3>
          <WocheErinnerungen vorhaben={vorhaben} onChange={onChange} />
        </section>

        <section className="thema-woche-block" aria-labelledby="woche-cal-block">
          <h3 id="woche-cal-block" className="thema-woche-block-title">
            Wochenplan
          </h3>
          <p className="planning-hint woche-cal-hint">
            Nur dieses Thema — alle Themen im{" "}
            <Link to={APP_ROUTES.kalender}>Kalender</Link>.{" "}
            <span className="planning-kbd-hint">
              <kbd>⌘Z</kbd> Rückgängig · <kbd>Entf</kbd> Löschen (Termin)
            </span>
          </p>
          <div className="thema-woche-cal-wrap">
            <CalendarView
              calendarStore={calStore}
              onCalendarStoreChange={persistCal}
              planningStore={planningStore}
              saveVorhaben={onChange}
              filters={scopedFilters}
              draftVorhabenId={vorhaben?.id}
              rituals={rituals}
              showExternalEvents
              onEventClick={(info) => {
                setEventForm(formFromFcEvent(info.event, planningStore, calStore));
                setModalOpen(true);
              }}
              onDateSelect={(sel) => {
                setEventForm(formFromSelection(sel, vorhaben?.id));
                setModalOpen(true);
                sel.view.calendar.unselect();
              }}
              initialView="timeGridWeek"
              spacious
              height="min(64vh, 720px)"
              compactExternal
            />
          </div>
        </section>

        <CalendarEventModal
          open={modalOpen}
          form={eventForm}
          onChange={setEventForm}
          onClose={closeModal}
          onSave={() => {
            if (!eventForm?.title?.trim()) {
              return;
            }
            saveEventFromForm({
              form: { ...eventForm, title: eventForm.title.trim() },
              planningStore,
              calStore,
              onPlanningStoreChange: onChange,
              onCalStoreChange: persistCal,
            });
            closeModal();
          }}
          onDelete={() => handleDeleteEvent()}
          vorhabenOptions={planningStore.vorhaben}
          lektionOptions={vorhaben?.lektionen || []}
        />
      </div>
    </ThemaPanelShell>
  );
};

export default WochePanel;
