import React, { useEffect, useMemo, useRef, useState } from "react";
import { getFachCssVars, getFachToneClassName, normalizeFachKey } from "../planning/fachColors";
import {
  buildFachPickerOptions,
  fachNameForKey,
} from "./themePickerFach";

const ThemePickerCompact = ({
  vorhabenOptions = [],
  selectedId = "",
  draftFach = "",
  onSelect,
  onClear,
  onFachChange,
  onCreateVorhaben,
  themeInputId,
  listId,
}) => {
  const fachOptions = useMemo(
    () => buildFachPickerOptions(vorhabenOptions),
    [vorhabenOptions]
  );

  const [themeQuery, setThemeQuery] = useState("");
  const themeInputRef = useRef(null);

  const activeFachKey = useMemo(() => {
    if (selectedId) {
      const current = vorhabenOptions.find((v) => v.id === selectedId);
      if (current?.fach) {
        const key = normalizeFachKey(current.fach);
        if (key !== "default") {
          return key;
        }
      }
    }
    if (draftFach) {
      const key = normalizeFachKey(draftFach);
      if (key !== "default") {
        return key;
      }
    }
    return "";
  }, [selectedId, draftFach, vorhabenOptions]);

  useEffect(() => {
    if (activeFachKey) {
      themeInputRef.current?.focus();
    }
  }, [activeFachKey]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const current = vorhabenOptions.find((v) => v.id === selectedId);
    if (!current) {
      return;
    }
    setThemeQuery(current.title || "");
  }, [selectedId, vorhabenOptions]);

  const themesForFach = useMemo(() => {
    if (!activeFachKey) {
      return [];
    }
    return vorhabenOptions.filter(
      (v) => normalizeFachKey(v.fach) === activeFachKey
    );
  }, [vorhabenOptions, activeFachKey]);

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
    Boolean(activeFachKey && trimmedQuery && !exactMatch && onCreateVorhaben);

  const handleSelectFach = (key) => {
    if (activeFachKey === key) {
      setThemeQuery("");
      onFachChange?.("");
      return;
    }
    setThemeQuery("");
    onFachChange?.(fachNameForKey(key, fachOptions));
    if (selectedId) {
      onClear?.();
    }
  };

  const handleCreateTheme = () => {
    if (!canCreate) {
      return;
    }
    const fach = fachNameForKey(activeFachKey, fachOptions);
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
        <span className="cal-event-theme-step-label">Fach</span>
        <div className="cal-event-theme-fach-row" role="group" aria-label="Fach wählen">
          {fachOptions.map((opt) => {
            const toneClass = getFachToneClassName(opt.fach);
            const isActive = activeFachKey === opt.key;
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

      {activeFachKey ? (
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
