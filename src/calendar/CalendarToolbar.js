import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { getFachCssVars, getFachToneClassName } from "../planning/fachColors";
import {
  countActiveCalendarFilters,
  countActiveStundenplanOptions,
  templateOptions,
} from "./calendarFilters";
import {
  buildCalendarEventPool,
  calendarSearchRange,
  formatEventWhen,
  searchCalendarEvents,
} from "./calendarEventPool";

const CalendarToolbar = forwardRef(
  (
    {
      filters,
      onChange,
      vorhabenList,
      planningStore,
      calendarStore,
      onNewEvent,
      onInitStundenplan,
      onNavigateToEvent,
    },
    ref
  ) => {
    const [filterOpen, setFilterOpen] = useState(false);
    const [stundenplanOpen, setStundenplanOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef(null);
    const toolbarRef = useRef(null);
    const templates = templateOptions();
    const filterCount = countActiveCalendarFilters(filters);
    const stundenplanCount = countActiveStundenplanOptions(filters);

    const eventPool = useMemo(() => {
      const { start, end } = calendarSearchRange();
      return buildCalendarEventPool({
        calendarStore,
        planningStore,
        rangeStart: start,
        rangeEnd: end,
        filters,
      });
    }, [calendarStore, planningStore, filters]);

    const searchResults = useMemo(
      () => searchCalendarEvents(eventPool, searchQuery),
      [eventPool, searchQuery]
    );

    const closeAllPanels = useCallback(() => {
      setFilterOpen(false);
      setStundenplanOpen(false);
      setSearchOpen(false);
    }, []);

    useImperativeHandle(ref, () => ({
      openSearch: () => {
        setSearchOpen(true);
        setFilterOpen(false);
        setStundenplanOpen(false);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      },
      closePanels: closeAllPanels,
    }));

    useEffect(() => {
      if (!searchOpen && !filterOpen && !stundenplanOpen) {
        return undefined;
      }
      const onDocClick = (e) => {
        if (!toolbarRef.current?.contains(e.target)) {
          closeAllPanels();
        }
      };
      const onKey = (e) => {
        if (e.key === "Escape") {
          closeAllPanels();
        }
      };
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDocClick);
        document.removeEventListener("keydown", onKey);
      };
    }, [searchOpen, filterOpen, stundenplanOpen, closeAllPanels]);

    const toggleVorhaben = (id) => {
      const set = new Set(filters.vorhabenIds || []);
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      onChange({ ...filters, vorhabenIds: Array.from(set) });
    };

    const toggleTemplate = (id) => {
      const set = new Set(filters.templateIds || []);
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      onChange({ ...filters, templateIds: Array.from(set) });
    };

    const handleSearchResultClick = (event) => {
      onNavigateToEvent?.(event);
      closeAllPanels();
      setSearchQuery("");
    };

    const handleToggleFilter = () => {
      setFilterOpen((o) => !o);
      setStundenplanOpen(false);
      setSearchOpen(false);
    };

    const handleToggleStundenplan = () => {
      setStundenplanOpen((o) => !o);
      setFilterOpen(false);
      setSearchOpen(false);
    };

    const handleToggleSearch = () => {
      setSearchOpen((o) => !o);
      setFilterOpen(false);
      setStundenplanOpen(false);
      if (!searchOpen) {
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    };

    return (
      <div className="cal-toolbar" ref={toolbarRef}>
        <div className="cal-toolbar-actions">
          <button
            type="button"
            className={`cal-toolbar-btn${filterOpen ? " cal-toolbar-btn--active" : ""}`}
            onClick={handleToggleFilter}
            aria-expanded={filterOpen}
            aria-controls="cal-filter-panel"
          >
            Filter
            {filterCount > 0 ? (
              <span className="cal-toolbar-badge">{filterCount}</span>
            ) : null}
          </button>

          <button
            type="button"
            className={`cal-toolbar-btn${stundenplanOpen ? " cal-toolbar-btn--active" : ""}`}
            onClick={handleToggleStundenplan}
            aria-expanded={stundenplanOpen}
            aria-controls="cal-stundenplan-panel"
          >
            Stundenplan
            {stundenplanCount > 0 ? (
              <span className="cal-toolbar-badge">{stundenplanCount}</span>
            ) : null}
          </button>

          <button
            type="button"
            className={`cal-toolbar-btn${searchOpen ? " cal-toolbar-btn--active" : ""}`}
            onClick={handleToggleSearch}
            aria-expanded={searchOpen}
            aria-controls="cal-search-panel"
            title="Suchen (/)"
          >
            Suchen
          </button>

          <button
            type="button"
            className="cal-toolbar-btn cal-toolbar-btn--primary"
            onClick={onNewEvent}
            title="Neuer Termin (N)"
          >
            + Termin
          </button>
        </div>

        {filterOpen ? (
          <div
            id="cal-filter-panel"
            className="cal-toolbar-panel"
            role="region"
            aria-label="Kalenderfilter"
          >
            <p className="cal-toolbar-panel-hint">
              Themen und Vorlagen einschränken — der Kalender bleibt sichtbar.
            </p>
            <div className="cal-toolbar-panel-section">
              <span className="cal-toolbar-panel-label">Themen</span>
              <div className="cal-toolbar-chips">
                <button
                  type="button"
                  className={`cal-toolbar-chip${
                    !filters.vorhabenIds?.length ? " cal-toolbar-chip--active" : ""
                  }`}
                  onClick={() => onChange({ ...filters, vorhabenIds: [] })}
                >
                  Alle
                </button>
                {vorhabenList.map((v) => {
                  const toneClass = getFachToneClassName(v.fach);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      className={`cal-toolbar-chip${toneClass ? ` ${toneClass}` : ""}${
                        filters.vorhabenIds?.includes(v.id)
                          ? " cal-toolbar-chip--active"
                          : ""
                      }`}
                      style={toneClass ? getFachCssVars(v.fach, v.id) : undefined}
                      onClick={() => toggleVorhaben(v.id)}
                    >
                      {v.title}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="cal-toolbar-panel-section">
              <span className="cal-toolbar-panel-label">Vorlage</span>
              <div className="cal-toolbar-chips">
                <button
                  type="button"
                  className={`cal-toolbar-chip${
                    !filters.templateIds?.length ? " cal-toolbar-chip--active" : ""
                  }`}
                  onClick={() => onChange({ ...filters, templateIds: [] })}
                >
                  Alle
                </button>
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`cal-toolbar-chip${
                      filters.templateIds?.includes(t.id)
                        ? " cal-toolbar-chip--active"
                        : ""
                    }`}
                    onClick={() => toggleTemplate(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {stundenplanOpen ? (
          <div
            id="cal-stundenplan-panel"
            className="cal-toolbar-panel cal-toolbar-panel--stundenplan"
            role="region"
            aria-label="Stundenplan"
          >
            <p className="cal-toolbar-panel-hint">
              Wochenraster und Lektionsplätze — getrennt von den Themenfiltern.
            </p>
            <div className="cal-toolbar-chips">
              <button
                type="button"
                className={`cal-toolbar-chip${
                  filters.showStundenplan !== false ? " cal-toolbar-chip--active" : ""
                }`}
                onClick={() =>
                  onChange({
                    ...filters,
                    showStundenplan: filters.showStundenplan === false,
                  })
                }
              >
                Raster anzeigen
              </button>
              <button
                type="button"
                className={`cal-toolbar-chip${
                  filters.stundenplanEditMode ? " cal-toolbar-chip--active" : ""
                }`}
                onClick={() =>
                  onChange({
                    ...filters,
                    stundenplanEditMode: !filters.stundenplanEditMode,
                  })
                }
                title="Zeitraum wählen = neuer Lektionsplatz"
              >
                Plätze bearbeiten
              </button>
              {onInitStundenplan ? (
                <button
                  type="button"
                  className="cal-toolbar-chip"
                  onClick={() => {
                    onInitStundenplan();
                    setStundenplanOpen(false);
                  }}
                >
                  Raster laden
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {searchOpen ? (
          <div
            id="cal-search-panel"
            className="cal-toolbar-panel cal-toolbar-panel--search"
            role="dialog"
            aria-label="Kalender durchsuchen"
          >
            <div className="cal-toolbar-search-wrap">
              <input
                ref={searchInputRef}
                type="search"
                className="cal-toolbar-search-input"
                placeholder="Titel, Fach, Thema …"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Kalender durchsuchen"
              />
              <span className="cal-toolbar-kbd" aria-hidden="true">
                /
              </span>
            </div>
            {searchQuery.trim().length < 2 ? (
              <p className="cal-toolbar-panel-hint">
                Mindestens 2 Zeichen — Treffer erscheinen hier, der Kalender bleibt
                unverändert.
              </p>
            ) : searchResults.length === 0 ? (
              <p className="cal-toolbar-panel-empty">Keine Termine gefunden.</p>
            ) : (
              <ul className="cal-toolbar-search-results" role="listbox">
                {searchResults.map((ev) => (
                  <li key={ev.id}>
                    <button
                      type="button"
                      className="cal-toolbar-search-hit"
                      role="option"
                      onClick={() => handleSearchResultClick(ev)}
                    >
                      <span className="cal-toolbar-search-hit-title">
                        {ev.title || "Ohne Titel"}
                      </span>
                      <span className="cal-toolbar-search-hit-meta">
                        {formatEventWhen(ev)}
                        {ev.extendedProps?.vorhabenTitle
                          ? ` · ${ev.extendedProps.vorhabenTitle}`
                          : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    );
  }
);

CalendarToolbar.displayName = "CalendarToolbar";

export default CalendarToolbar;
