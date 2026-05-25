import React, { useEffect, useMemo, useRef, useState } from "react";
import { getFachCssVars, getFachToneClassName, normalizeFachKey } from "../planning/fachColors";
import {
  buildFachPickerOptions,
  fachNameForKey,
} from "./themePickerFach";

const ThemePickerCompact = ({
  vorhabenOptions = [],
  selectedId = "",
  onSelect,
  onClear,
  onCreateVorhaben,
  themeInputId,
  listId,
}) => {
  const fachOptions = useMemo(
    () => buildFachPickerOptions(vorhabenOptions),
    [vorhabenOptions]
  );

  const [selectedFachKey, setSelectedFachKey] = useState("");
  const [themeQuery, setThemeQuery] = useState("");
  const themeInputRef = useRef(null);

  useEffect(() => {
    if (selectedFachKey) {
      themeInputRef.current?.focus();
    }
  }, [selectedFachKey]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const current = vorhabenOptions.find((v) => v.id === selectedId);
    if (!current) {
      return;
    }
    const key = normalizeFachKey(current.fach);
    if (key !== "default") {
      setSelectedFachKey(key);
    }
    setThemeQuery(current.title || "");
  }, [selectedId, vorhabenOptions]);

  const themesForFach = useMemo(() => {
    if (!selectedFachKey) {
      return [];
    }
    return vorhabenOptions.filter(
      (v) => normalizeFachKey(v.fach) === selectedFachKey
    );
  }, [vorhabenOptions, selectedFachKey]);

  const filteredThemes = useMemo(() => {
    const q = themeQuery.trim().toLowerCase();
    const base = q
      ? themesForFach.filter((v) => v.title.toLowerCase().includes(q))
      : themesForFach;
    return base.slice(0, 5);
  }, [themesForFach, themeQuery]);

  const trimmedQuery = themeQuery.trim();
  const exactMatch = themesForFach.some(
    (v) => v.title.trim().toLowerCase() === trimmedQuery.toLowerCase()
  );
  const canCreate =
    Boolean(selectedFachKey && trimmedQuery && !exactMatch && onCreateVorhaben);

  const handleSelectFach = (key) => {
    setSelectedFachKey(key);
    setThemeQuery("");
    if (selectedId) {
      onClear?.();
    }
  };

  const handleClearAll = () => {
    setSelectedFachKey("");
    setThemeQuery("");
    onClear?.();
  };

  const handleCreateTheme = () => {
    if (!canCreate) {
      return;
    }
    const fach = fachNameForKey(selectedFachKey, fachOptions);
    const created = onCreateVorhaben({
      title: trimmedQuery,
      fach,
      templateId: "thema",
    });
    if (created?.id) {
      onSelect?.(created.id);
      setThemeQuery(created.title || trimmedQuery);
    }
  };

  const handleThemeKeyDown = (e) => {
    if (e.key === "Enter" && canCreate) {
      e.preventDefault();
      handleCreateTheme();
    }
  };

  return (
    <div className="cal-event-theme-picker">
      <div className="cal-event-theme-step">
        <div className="cal-event-theme-step-head">
          <span className="cal-event-theme-step-label">Fach</span>
          <button
            type="button"
            className="cal-event-theme-skip"
            onClick={handleClearAll}
          >
            Nur Kalender
          </button>
        </div>
        <div className="cal-event-theme-fach-row" role="group" aria-label="Fach wählen">
          {fachOptions.map((opt) => {
            const toneClass = getFachToneClassName(opt.fach);
            const isActive = selectedFachKey === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={isActive}
                className={`cal-event-theme-fach-chip${toneClass ? ` ${toneClass}` : ""}${
                  isActive ? " cal-event-theme-fach-chip--active" : ""
                }`}
                style={toneClass ? getFachCssVars(opt.fach) : undefined}
                onClick={() => handleSelectFach(opt.key)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {selectedFachKey ? (
        <div className="cal-event-theme-step">
          <label className="cal-event-theme-step-label" htmlFor={themeInputId}>
            Thema
          </label>
          <input
            ref={themeInputRef}
            id={themeInputId}
            type="text"
            className="cal-event-theme-input"
            placeholder="Thema eingeben oder wählen …"
            value={themeQuery}
            onChange={(e) => setThemeQuery(e.target.value)}
            onKeyDown={handleThemeKeyDown}
            aria-controls={listId}
            autoComplete="off"
          />
          <div id={listId} className="cal-event-theme-list" role="listbox" aria-label="Themen">
            {filteredThemes.map((v) => {
              const toneClass = getFachToneClassName(v.fach);
              const isSelected = selectedId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`cal-event-theme-chip${toneClass ? ` ${toneClass}` : ""}${
                    isSelected ? " cal-event-theme-chip--selected" : ""
                  }`}
                  style={toneClass ? getFachCssVars(v.fach, v.id) : undefined}
                  onClick={() => {
                    setThemeQuery(v.title);
                    onSelect?.(v.id);
                  }}
                >
                  <span className="cal-event-theme-chip-label">{v.title}</span>
                </button>
              );
            })}
            {canCreate ? (
              <button
                type="button"
                className="cal-event-theme-chip cal-event-theme-chip--create"
                onClick={handleCreateTheme}
              >
                <span className="cal-event-theme-chip-label">
                  + „{trimmedQuery}“ anlegen
                </span>
              </button>
            ) : null}
            {trimmedQuery && filteredThemes.length === 0 && !canCreate ? (
              <p className="cal-event-theme-empty">Kein Treffer</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ThemePickerCompact;
