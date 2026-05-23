import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { searchCompetencies } from "../api/lehrplanApi";
import {
  DEFAULT_FOLDER_ID,
  loadBookmarkStore,
} from "../competencyBookmarks";
import { truncateCompetencyLabel } from "../recentCompetencyHistory";
import { APP_ROUTES } from "../config/appUrls";
import { competencyEntryFromSearchResult } from "../utils/competencyUid";

const MAX_SELECTED = 5;

/**
 * @typedef {{ uid: string, label: string, code?: string, fach?: string, text?: string }} CompetencyPick
 */

const normalizePick = (entry) => {
  if (!entry || !entry.uid) {
    return null;
  }
  const uid = String(entry.uid).trim();
  if (!uid) {
    return null;
  }
  const label = truncateCompetencyLabel(
    entry.label || entry.text || entry.code || uid,
    200
  );
  return {
    uid,
    label,
    code: entry.code ? String(entry.code).trim() : undefined,
    fach: entry.fach ? String(entry.fach).trim() : undefined,
    text: entry.text ? String(entry.text).trim() : undefined,
  };
};

const CompetencyPicker = ({ selected = [], onChange, maxSelected = MAX_SELECTED }) => {
  const [pickerTab, setPickerTab] = useState("merkliste");
  const [bookmarkStore, setBookmarkStore] = useState(() => loadBookmarkStore());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(() => ({}));

  const selectedUids = useMemo(
    () => new Set(selected.map((s) => s.uid)),
    [selected]
  );

  const refreshBookmarks = useCallback(() => {
    setBookmarkStore(loadBookmarkStore());
  }, []);

  useEffect(() => {
    const onStorage = (event) => {
      if (
        event.key === "lp21-competency-bookmarks-v2" ||
        event.key === "lp21-competency-bookmarks-v1"
      ) {
        refreshBookmarks();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshBookmarks]);

  const foldersOrdered = useMemo(() => {
    if (!bookmarkStore?.folders) {
      return [];
    }
    return [
      ...bookmarkStore.folders.filter((f) => f.id === DEFAULT_FOLDER_ID),
      ...bookmarkStore.folders.filter((f) => f.id !== DEFAULT_FOLDER_ID),
    ];
  }, [bookmarkStore]);

  const bookmarkTotal = useMemo(
    () =>
      foldersOrdered.reduce(
        (sum, f) => sum + (Array.isArray(f.items) ? f.items.length : 0),
        0
      ),
    [foldersOrdered]
  );

  const handleAdd = (raw) => {
    const pick = normalizePick(raw);
    if (!pick || selectedUids.has(pick.uid)) {
      return;
    }
    if (selected.length >= maxSelected) {
      return;
    }
    onChange([...selected, pick]);
  };

  const handleRemove = (uid) => {
    onChange(selected.filter((s) => s.uid !== uid));
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    const { results, error } = await searchCompetencies(q, { nResults: 8 });
    setSearchLoading(false);
    setSearchError(error);
    setSearchResults(results);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const isFolderOpen = (folderId, itemCount) => {
    if (expandedFolders[folderId] !== undefined) {
      return expandedFolders[folderId];
    }
    return itemCount > 0;
  };

  return (
    <div className="competency-picker">
      <div className="competency-picker-selected" aria-live="polite">
        <p className="competency-picker-selected-label">
          Ausgewählt ({selected.length}/{maxSelected})
        </p>
        {selected.length === 0 ? (
          <p className="competency-picker-hint">
            Wähle Kompetenzen aus der Merkliste oder per Suche.
          </p>
        ) : (
          <ul className="competency-picker-chips">
            {selected.map((item) => (
              <li key={item.uid} className="competency-picker-chip">
                <span className="competency-picker-chip-text" title={item.label}>
                  {item.code ? (
                    <span className="competency-picker-chip-code">{item.code}</span>
                  ) : null}
                  <span className="competency-picker-chip-label">{item.label}</span>
                </span>
                <button
                  type="button"
                  className="competency-picker-chip-remove"
                  onClick={() => handleRemove(item.uid)}
                  aria-label={`${item.label} entfernen`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="competency-picker-tabs" role="tablist" aria-label="Kompetenzen hinzufügen">
        <button
          type="button"
          role="tab"
          className={`competency-picker-tab ${pickerTab === "merkliste" ? "is-active" : ""}`}
          aria-selected={pickerTab === "merkliste"}
          onClick={() => setPickerTab("merkliste")}
        >
          Merkliste
          {bookmarkTotal > 0 ? (
            <span className="competency-picker-tab-count"> ({bookmarkTotal})</span>
          ) : null}
        </button>
        <button
          type="button"
          role="tab"
          className={`competency-picker-tab ${pickerTab === "suche" ? "is-active" : ""}`}
          aria-selected={pickerTab === "suche"}
          onClick={() => setPickerTab("suche")}
        >
          Suchen
        </button>
      </div>

      {pickerTab === "merkliste" ? (
        <div
          className="competency-picker-panel"
          role="tabpanel"
          aria-label="Gemerkte Kompetenzen"
        >
          {bookmarkTotal === 0 ? (
            <p className="competency-picker-empty">
              Noch nichts gemerkt. In der{" "}
              <Link to={APP_ROUTES.search}>Suche</Link> — merken oder «Ins Thema», dann
              hier auswählen.
            </p>
          ) : (
            <ul className="competency-picker-folder-list">
              {foldersOrdered.map((folder) => {
                const items = folder.items || [];
                const open = isFolderOpen(folder.id, items.length);
                return (
                  <li key={folder.id} className="competency-picker-folder">
                    <button
                      type="button"
                      className="competency-picker-folder-toggle"
                      onClick={() => toggleFolder(folder.id)}
                      aria-expanded={open}
                    >
                      <span className="competency-picker-folder-chevron" aria-hidden="true">
                        {open ? "▾" : "▸"}
                      </span>
                      <span className="competency-picker-folder-name">{folder.name}</span>
                      <span className="competency-picker-folder-count">{items.length}</span>
                    </button>
                    {open && items.length > 0 ? (
                      <ul className="competency-picker-items">
                        {items.map((entry) => {
                          const isAdded = selectedUids.has(entry.uid);
                          const atMax = selected.length >= maxSelected && !isAdded;
                          return (
                            <li key={entry.uid}>
                              <div className="competency-picker-item">
                                <div className="competency-picker-item-body">
                                  <span className="competency-picker-item-label">
                                    {entry.label}
                                  </span>
                                  {[entry.code, entry.fach].filter(Boolean).length > 0 ? (
                                    <span className="competency-picker-item-meta">
                                      {[entry.code, entry.fach].filter(Boolean).join(" · ")}
                                    </span>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  className="competency-picker-add-btn"
                                  disabled={isAdded || atMax}
                                  onClick={() => handleAdd(entry)}
                                  aria-label={
                                    isAdded
                                      ? `${entry.label} bereits ausgewählt`
                                      : `${entry.label} hinzufügen`
                                  }
                                >
                                  {isAdded ? "✓" : "+"}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            className="competency-picker-refresh"
            onClick={refreshBookmarks}
          >
            Merkliste aktualisieren
          </button>
        </div>
      ) : (
        <div className="competency-picker-panel" role="tabpanel" aria-label="Kompetenzen suchen">
          <div className="competency-picker-search-bar">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Stichwort oder Kompetenzcode …"
              aria-label="Kompetenz suchen"
            />
            <button
              type="button"
              className="competency-picker-search-btn"
              onClick={handleSearch}
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? "…" : "Suchen"}
            </button>
          </div>
          {searchError ? (
            <p className="competency-picker-error" role="alert">
              {searchError}
            </p>
          ) : null}
          {searchResults.length > 0 ? (
            <ul className="competency-picker-items competency-picker-items--search">
              {searchResults.map((result) => {
                const entry = competencyEntryFromSearchResult(result);
                if (!entry) {
                  return null;
                }
                const isAdded = selectedUids.has(entry.uid);
                const atMax = selected.length >= maxSelected && !isAdded;
                return (
                  <li key={result.id || entry.uid}>
                    <div className="competency-picker-item">
                      <div className="competency-picker-item-body">
                        <span className="competency-picker-item-label">{entry.label}</span>
                        {[entry.code, entry.fach].filter(Boolean).length > 0 ? (
                          <span className="competency-picker-item-meta">
                            {[entry.code, entry.fach].filter(Boolean).join(" · ")}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="competency-picker-add-btn"
                        disabled={isAdded || atMax}
                        onClick={() => handleAdd(entry)}
                        aria-label={
                          isAdded
                            ? `${entry.label} bereits ausgewählt`
                            : `${entry.label} hinzufügen`
                        }
                      >
                        {isAdded ? "✓" : "+"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            !searchLoading &&
            searchQuery.trim() &&
            !searchError && (
              <p className="competency-picker-empty">Keine Treffer.</p>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default CompetencyPicker;
