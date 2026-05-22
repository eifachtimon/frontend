import React from "react";
import { templateOptions } from "./calendarFilters";

const CalendarFilterBar = ({
  filters,
  onChange,
  vorhabenList,
  onNewEvent,
  onInitStundenplan,
  searchInputRef,
}) => {
  const templates = templateOptions();

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

  return (
    <div className="cal-filter-bar" role="search">
      <div className="cal-filter-search-wrap">
        <span className="cal-filter-search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={searchInputRef}
          type="search"
          className="cal-filter-search"
          placeholder="Suchen (Titel, Vorhaben, Fach …)"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          aria-label="Kalender durchsuchen"
        />
        <span className="cal-kbd-badge" title="Tastenkürzel">
          /
        </span>
      </div>

      <div className="cal-filter-chips" aria-label="Vorhaben filtern">
        <button
          type="button"
          className={`cal-filter-chip ${!filters.vorhabenIds?.length ? "cal-filter-chip--active" : ""}`}
          onClick={() => onChange({ ...filters, vorhabenIds: [] })}
        >
          Alle Vorhaben
        </button>
        {vorhabenList.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`cal-filter-chip ${
              filters.vorhabenIds?.includes(v.id) ? "cal-filter-chip--active" : ""
            }`}
            onClick={() => toggleVorhaben(v.id)}
          >
            {v.title}
          </button>
        ))}
      </div>

      <div className="cal-filter-chips cal-filter-chips--themes" aria-label="Thema filtern">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`cal-filter-chip cal-filter-chip--theme ${
              filters.templateIds?.includes(t.id) ? "cal-filter-chip--active" : ""
            }`}
            onClick={() => toggleTemplate(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="cal-filter-chips cal-filter-chips--stundenplan" aria-label="Stundenplan">
        <button
          type="button"
          className={`cal-filter-chip ${filters.showStundenplan !== false ? "cal-filter-chip--active" : ""}`}
          onClick={() =>
            onChange({
              ...filters,
              showStundenplan: filters.showStundenplan === false,
            })
          }
        >
          Stundenplan
        </button>
        <button
          type="button"
          className={`cal-filter-chip ${filters.stundenplanEditMode ? "cal-filter-chip--active" : ""}`}
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
            className="cal-filter-chip cal-filter-chip--theme"
            onClick={onInitStundenplan}
          >
            Raster laden
          </button>
        ) : null}
      </div>

      <div className="cal-filter-actions">
        <button
          type="button"
          className="planning-btn planning-btn--primary cal-filter-new"
          onClick={onNewEvent}
        >
          + Termin
          <span className="cal-kbd-hint">N</span>
        </button>
      </div>
    </div>
  );
};

export default CalendarFilterBar;
