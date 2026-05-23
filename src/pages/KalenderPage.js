import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CalendarView from "../calendar/CalendarView";
import CalendarSubscriptionsPanel from "../calendar/CalendarSubscriptionsPanel";
import CalendarAppleSync from "../calendar/CalendarAppleSync";
import CalendarEventModal from "../calendar/CalendarEventModal";
import CalendarFilterBar from "../calendar/CalendarFilterBar";
import StundenplanSlotModal from "../calendar/StundenplanSlotModal";
import {
  buildSlotFromSelection,
  deleteStundenplanSlotById,
  saveStundenplanSlot,
} from "../calendar/stundenplanActions";
import { buildDefaultSchoolSlots } from "../calendar/stundenplanEvents";
import { replaceStundenplanSlots, setStundenplanEnabled } from "../calendar/calendarStore";
import { fetchIcsSubscription } from "../calendar/calendarApi";
import { deleteEventFromForm, saveEventFromForm } from "../calendar/calendarActions";
import { syncAllToAppleFeed } from "../calendar/calendarExport";
import {
  buildEmptyForm,
  formFromFcEvent,
  formFromSelection,
} from "../calendar/calendarEventResolve";
import { loadCalFilters, saveCalFilters } from "../calendar/calendarFilters";
import {
  loadCalendarStore,
  saveCalendarStore,
  setSubscriptionCache,
} from "../calendar/calendarStore";
import { useCalendarKeyboard } from "../calendar/useCalendarKeyboard";
import {
  useEditShortcutsTick,
  useRegisterEditShortcuts,
} from "../hooks/EditShortcutsProvider";
import usePlanningStore from "../planning/usePlanningStore";
import PlanningViewHeader from "../planning/PlanningViewHeader";
import {
  loadCalendarChromeExpanded,
  saveCalendarChromeExpanded,
} from "../calendar/calendarUiPrefs";
import "../planning/planning.css";
import "../calendar/calendar.css";

const KalenderPage = () => {
  const { store: planningStore, saveVorhaben } = usePlanningStore();
  const [calStore, setCalStore] = useState(loadCalendarStore);
  const [filters, setFilters] = useState(loadCalFilters);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState(null);
  const [stpModalOpen, setStpModalOpen] = useState(false);
  const [stpSlot, setStpSlot] = useState(null);
  const calendarRef = useRef(null);
  const searchRef = useRef(null);
  const lastSelectionRef = useRef(null);
  const [selectionTick, setSelectionTick] = useState(0);
  const [chromeExpanded, setChromeExpanded] = useState(loadCalendarChromeExpanded);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const undoTick = useEditShortcutsTick();
  const maxSpace = !chromeExpanded;

  const draftVorhabenId =
    planningStore.lastActiveVorhabenId || planningStore.vorhaben[0]?.id || "";

  const draftVorhaben = planningStore.vorhaben.find((v) => v.id === draftVorhabenId);

  const persistCal = useCallback((next) => {
    setCalStore(saveCalendarStore(next));
  }, []);

  const persistFilters = useCallback((next) => {
    setFilters(saveCalFilters(next));
  }, []);

  const refreshSubscriptions = useCallback(async () => {
    const enabled = calStore.subscriptions.filter((s) => s.enabled && s.url);
    if (enabled.length === 0) {
      return;
    }
    setRefreshing(true);
    let next = { ...calStore };
    for (const sub of enabled) {
      const result = await fetchIcsSubscription(sub.url, sub.id);
      next = setSubscriptionCache(next, sub.id, result);
    }
    setCalStore(saveCalendarStore(next));
    setRefreshing(false);
  }, [calStore]);

  useEffect(() => {
    const enabled = calStore.subscriptions.filter(
      (s) => s.enabled && s.url && !calStore.subscriptionCache?.[s.id]
    );
    if (enabled.length > 0) {
      refreshSubscriptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!calStore.exportToken && !planningStore.vorhaben?.length) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      syncAllToAppleFeed(calStore, persistCal, planningStore).catch(() => {});
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [planningStore, calStore, persistCal]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEventForm(null);
  }, []);

  const closeStpModal = useCallback(() => {
    setStpModalOpen(false);
    setStpSlot(null);
  }, []);

  useEffect(() => {
    if (!calStore.stundenplan?.enabled) {
      persistCal(setStundenplanEnabled(calStore, true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCalStore(loadCalendarStore());
  }, [undoTick]);

  useEffect(() => {
    const onCalUpdate = () => setCalStore(loadCalendarStore());
    window.addEventListener("lp21-calendar-updated", onCalUpdate);
    return () => window.removeEventListener("lp21-calendar-updated", onCalUpdate);
  }, []);

  const openStundenplanSlot = useCallback(
    (slotId) => {
      const slot = calStore.stundenplan?.slots?.find((s) => s.id === slotId);
      if (slot) {
        setStpSlot({ ...slot });
        setStpModalOpen(true);
      }
    },
    [calStore.stundenplan?.slots]
  );

  const handleStundenplanSlotClick = useCallback(
    (info) => {
      lastSelectionRef.current = { kind: "stundenplan", event: info.event };
      setSelectionTick((t) => t + 1);
      const slotId = info.event.extendedProps?.slotId;
      if (slotId) {
        openStundenplanSlot(slotId);
      }
    },
    [openStundenplanSlot]
  );

  const handleInitStundenplan = useCallback(() => {
    if (
      calStore.stundenplan?.slots?.length > 0 &&
      !window.confirm("Bestehendes Raster ersetzen?")
    ) {
      return;
    }
    persistCal(
      replaceStundenplanSlots(calStore, buildDefaultSchoolSlots())
    );
  }, [calStore, persistCal]);

  const openCreate = useCallback(
    (start = new Date(), end = new Date(Date.now() + 45 * 60000)) => {
      setEventForm(
        buildEmptyForm({
          mode: "create",
          source: draftVorhabenId ? "planning" : "local",
          vorhabenId: draftVorhabenId,
          start: start.toISOString(),
          end: end.toISOString(),
        })
      );
      setModalOpen(true);
    },
    [draftVorhabenId]
  );

  const handleDateSelect = useCallback(
    (selectInfo) => {
      if (filters.stundenplanEditMode) {
        setStpSlot(
          buildSlotFromSelection(selectInfo, { vorhabenId: draftVorhabenId })
        );
        setStpModalOpen(true);
        selectInfo.view.calendar.unselect();
        return;
      }
      setEventForm(formFromSelection(selectInfo, draftVorhabenId));
      setModalOpen(true);
      selectInfo.view.calendar.unselect();
    },
    [draftVorhabenId, filters.stundenplanEditMode]
  );

  const handleEventClick = useCallback(
    (info) => {
      if (info.event.extendedProps?.source === "stundenplan") {
        return;
      }
      lastSelectionRef.current = { kind: "event", event: info.event };
      setSelectionTick((t) => t + 1);
      info.jsEvent.preventDefault();
      setEventForm(formFromFcEvent(info.event, planningStore, calStore));
      setModalOpen(true);
    },
    [planningStore, calStore]
  );

  const handleSaveStundenplanSlot = useCallback(() => {
    if (!stpSlot) {
      return;
    }
    saveStundenplanSlot(calStore, stpSlot, persistCal);
    closeStpModal();
  }, [stpSlot, calStore, persistCal, closeStpModal]);

  const handleDeleteStundenplanSlot = useCallback(
    (opts = {}) => {
      const slotId = stpSlot?.id || lastSelectionRef.current?.event?.extendedProps?.slotId;
      if (!slotId) {
        return;
      }
      if (!opts.fromKeyboard && !window.confirm("Lektionsplatz löschen?")) {
        return;
      }
      deleteStundenplanSlotById(calStore, slotId, persistCal);
      lastSelectionRef.current = null;
      closeStpModal();
    },
    [stpSlot, calStore, persistCal, closeStpModal]
  );

  const handleSaveEvent = useCallback(() => {
    if (!eventForm?.title?.trim()) {
      return;
    }
    saveEventFromForm({
      form: { ...eventForm, title: eventForm.title.trim() },
      planningStore,
      calStore,
      onPlanningStoreChange: saveVorhaben,
      onCalStoreChange: persistCal,
    });
    closeModal();
  }, [eventForm, planningStore, calStore, saveVorhaben, persistCal, closeModal]);

  const handleDeleteEvent = useCallback(
    (opts = {}) => {
      let form = eventForm;
      if (!form && lastSelectionRef.current?.kind === "event") {
        form = formFromFcEvent(
          lastSelectionRef.current.event,
          planningStore,
          calStore
        );
      }
      if (!form || form.readonly) {
        return;
      }
      const canRemove =
        form.mode === "edit" && (form.cardId || form.localEventId);
      if (!canRemove) {
        return;
      }
      if (!opts.fromKeyboard && !window.confirm("Termin wirklich löschen?")) {
        return;
      }
      deleteEventFromForm({
        form,
        planningStore,
        calStore,
        onPlanningStoreChange: saveVorhaben,
        onCalStoreChange: persistCal,
      });
      lastSelectionRef.current = null;
      closeModal();
    },
    [eventForm, planningStore, calStore, saveVorhaben, persistCal, closeModal]
  );

  const canDeleteEvent =
    Boolean(eventForm) &&
    !eventForm?.readonly &&
    eventForm?.mode === "edit" &&
    (eventForm?.cardId || eventForm?.localEventId);

  const canDeleteSelection = useMemo(() => {
    if (lastSelectionRef.current?.kind !== "event" || modalOpen) {
      return false;
    }
    const f = formFromFcEvent(
      lastSelectionRef.current.event,
      planningStore,
      calStore
    );
    return (
      !f.readonly && f.mode === "edit" && (f.cardId || f.localEventId)
    );
    // selectionTick: Auswahl am Kalender neu bewerten
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, planningStore, calStore, selectionTick]);

  const handleGlobalDelete = useCallback(() => {
    if (stpModalOpen) {
      handleDeleteStundenplanSlot({ fromKeyboard: true });
      return;
    }
    if (modalOpen && canDeleteEvent) {
      handleDeleteEvent({ fromKeyboard: true });
      return;
    }
    if (lastSelectionRef.current?.kind === "stundenplan") {
      handleDeleteStundenplanSlot({ fromKeyboard: true });
      return;
    }
    if (canDeleteSelection) {
      handleDeleteEvent({ fromKeyboard: true });
    }
  }, [
    stpModalOpen,
    modalOpen,
    canDeleteEvent,
    canDeleteSelection,
    handleDeleteStundenplanSlot,
    handleDeleteEvent,
  ]);

  useRegisterEditShortcuts({
    onDelete: handleGlobalDelete,
    canDelete:
      (stpModalOpen && Boolean(stpSlot?.id)) ||
      (modalOpen && canDeleteEvent) ||
      canDeleteSelection ||
      (!modalOpen &&
        !stpModalOpen &&
        lastSelectionRef.current?.kind === "stundenplan"),
  });

  useCalendarKeyboard({
    calendarApiRef: { current: () => calendarRef.current?.getApi?.() },
    onSearchFocus: () => searchRef.current?.focus(),
    onNewEvent: () => openCreate(),
    onCloseOverlays: () => {
      closeModal();
      closeStpModal();
      setDrawerOpen(false);
      setHelpOpen(false);
    },
    onToggleHelp: () => setHelpOpen((h) => !h),
  });

  const lektionOptions = draftVorhaben?.lektionen || [];

  const headerLead = draftVorhaben
    ? `«${draftVorhaben.title}» — Termine & Stundenplan`
    : "Termine und Stundenplan";

  const handleToggleChrome = useCallback(() => {
    setChromeExpanded((open) => {
      const next = !open;
      saveCalendarChromeExpanded(next);
      if (!next) {
        setFiltersExpanded(false);
        setDrawerOpen(false);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (maxSpace && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [maxSpace, drawerOpen]);

  return (
    <div className="app-shell planning-hub planning-surface planning-view--time">
      <main
        className={`planning-hub-main planning-hub-main--time layout ${
          maxSpace ? "planning-hub-main--calendar-max" : ""
        }`}
      >
        <PlanningViewHeader
          title="Kalender"
          lead={maxSpace ? null : headerLead}
          compact={maxSpace}
          actions={
            <>
              <button
                type="button"
                className={`planning-btn planning-btn--ghost ${maxSpace ? "planning-btn--primary" : ""}`}
                onClick={handleToggleChrome}
                aria-pressed={maxSpace}
                title={maxSpace ? "Filter und Ziehen-Leiste einblenden" : "Mehr Platz für das Raster"}
              >
                {maxSpace ? "Leisten ein" : "Mehr Platz"}
              </button>
              <button
                type="button"
                className="planning-btn planning-btn--ghost"
                onClick={() => setHelpOpen((h) => !h)}
                aria-expanded={helpOpen}
                aria-controls="cal-shortcuts-panel"
              >
                Tasten ?
              </button>
              <button
                type="button"
                className={`planning-btn planning-btn--ghost cal-toolbar-btn ${drawerOpen ? "cal-toolbar-btn--active" : ""}`}
                onClick={() => setDrawerOpen((o) => !o)}
                aria-expanded={drawerOpen}
              >
                Abos
              </button>
            </>
          }
        />

        <CalendarFilterBar
          filters={filters}
          onChange={persistFilters}
          vorhabenList={planningStore.vorhaben}
          onNewEvent={() => openCreate()}
          onInitStundenplan={handleInitStundenplan}
          searchInputRef={searchRef}
          compact={maxSpace}
          filtersExpanded={filtersExpanded}
          onToggleFiltersExpanded={() => setFiltersExpanded((e) => !e)}
        />

        {helpOpen ? (
          <div
            id="cal-shortcuts-panel"
            className="cal-shortcuts-panel"
            role="region"
            aria-label="Tastenkürzel"
          >
            <div className="cal-shortcuts-grid">
              <span><kbd>/</kbd> Suche</span>
              <span><kbd>N</kbd> Neuer Termin</span>
              <span><kbd>T</kbd> Heute</span>
              <span><kbd>M</kbd> Monat</span>
              <span><kbd>W</kbd> Woche</span>
              <span><kbd>D</kbd> Tag</span>
              <span><kbd>L</kbd> Liste</span>
              <span><kbd>⌥←</kbd> <kbd>⌥→</kbd> Blättern</span>
              <span><kbd>Esc</kbd> Schliessen</span>
              <span><kbd>⌘↵</kbd> Speichern (Modal)</span>
              <span><kbd>Entf</kbd> Löschen</span>
              <span><kbd>⌘Z</kbd> Rückgängig</span>
              <span><kbd>⌘⇧Z</kbd> Wiederholen</span>
            </div>
          </div>
        ) : null}

        <div className="planning-view-panel planning-view-panel--calendar">
          <div className="cal-page-body">
            <div className="cal-page-calendar">
              <CalendarView
              ref={calendarRef}
              spacious
              showDragStrip={chromeExpanded}
              planningStore={planningStore}
              saveVorhaben={saveVorhaben}
              calendarStore={calStore}
              onCalendarStoreChange={persistCal}
              filters={filters}
              draftVorhabenId={draftVorhabenId}
              rituals={planningStore.rituals}
              showExternalEvents={Boolean(draftVorhaben)}
              onEventClick={handleEventClick}
              onDateSelect={handleDateSelect}
              onStundenplanSlotClick={handleStundenplanSlotClick}
              height="100%"
              compactExternal
              />
            </div>

            <aside
            className={`cal-side-drawer ${drawerOpen ? "cal-side-drawer--open" : ""}`}
            aria-hidden={!drawerOpen}
          >
            <button
              type="button"
              className="cal-drawer-close"
              onClick={() => setDrawerOpen(false)}
              aria-label="Panel schliessen"
            >
              ×
            </button>
            <CalendarAppleSync
              calStore={calStore}
              onStoreChange={persistCal}
              planningStore={planningStore}
            />
            <CalendarSubscriptionsPanel
              store={calStore}
              onStoreChange={persistCal}
              onRefreshAll={refreshSubscriptions}
              refreshing={refreshing}
            />
          </aside>
          {drawerOpen ? (
            <button
              type="button"
              className="cal-drawer-backdrop"
              aria-label="Panel schliessen"
              onClick={() => setDrawerOpen(false)}
            />
          ) : null}
          </div>
        </div>
      </main>

      <CalendarEventModal
        open={modalOpen}
        form={eventForm}
        onChange={setEventForm}
        onClose={closeModal}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        vorhabenOptions={planningStore.vorhaben}
        lektionOptions={lektionOptions}
      />

      <StundenplanSlotModal
        open={stpModalOpen}
        slot={stpSlot}
        onChange={setStpSlot}
        onClose={closeStpModal}
        onSave={handleSaveStundenplanSlot}
        onDelete={handleDeleteStundenplanSlot}
        planningStore={planningStore}
        saveVorhaben={saveVorhaben}
        draftVorhabenId={draftVorhabenId}
      />
    </div>
  );
};

export default KalenderPage;
