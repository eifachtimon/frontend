import React, { useState } from "react";
import { parsePlanningReport, applySuggestion } from "./planningOrganizer";

const ReportOrganizer = ({ vorhaben, onApply, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [appliedMsg, setAppliedMsg] = useState("");

  const handleParse = () => {
    const sug = parsePlanningReport(text);
    setSuggestions(sug);
    setSelected(new Set(sug.map((s) => s.id)));
    setOpen(true);
  };

  const handleToggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApply = () => {
    let v = { ...vorhaben };
    for (const sug of suggestions) {
      if (selected.has(sug.id)) {
        v = applySuggestion(v, sug);
      }
    }
    onApply(v);
    setText("");
    setSuggestions([]);
    setSelected(new Set());
    setAppliedMsg(`${selected.size} Vorschläge übernommen.`);
    window.setTimeout(() => setAppliedMsg(""), 3000);
  };

  return (
    <section className="report-organizer-wrap">
      <button
        type="button"
        className="report-organizer-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="report-organizer-panel"
      >
        <span className="report-organizer-toggle-title">Bericht → Struktur</span>
        <span className="report-organizer-toggle-hint">
          Freitext eingeben, Vorschläge prüfen
        </span>
        <span className="report-organizer-chevron" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {appliedMsg ? (
        <p className="report-organizer-applied" role="status">
          {appliedMsg}
        </p>
      ) : null}
      {open ? (
        <div id="report-organizer-panel" className="report-organizer">
          <textarea
            className="report-organizer-input"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="z. B. Nächste Woche Elternabend Mittwoch, Bruchteile abschliessen, Freitag Ausflug …"
            aria-label="Freier Bericht"
          />
          <div className="report-organizer-actions">
            <button
              type="button"
              className="planning-btn planning-btn--secondary"
              onClick={handleParse}
              disabled={!text.trim()}
            >
              Vorschläge erzeugen
            </button>
            {suggestions.length > 0 ? (
              <button
                type="button"
                className="planning-btn planning-btn--primary"
                onClick={handleApply}
                disabled={selected.size === 0}
              >
                Übernehmen ({selected.size})
              </button>
            ) : null}
          </div>
          {suggestions.length > 0 ? (
            <ul className="report-suggestion-list">
              {suggestions.map((sug) => (
                <li key={sug.id}>
                  <label className="report-suggestion-item">
                    <input
                      type="checkbox"
                      checked={selected.has(sug.id)}
                      onChange={() => handleToggle(sug.id)}
                    />
                    <span>
                      <strong>{sug.title}</strong>
                      <span className="report-suggestion-detail">{sug.detail}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="report-organizer-mini-hint">
              Tipp: Wochentage und Begriffe wie «Elternabend», «Ausflug», «Material» werden
              erkannt.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
};

export default ReportOrganizer;
