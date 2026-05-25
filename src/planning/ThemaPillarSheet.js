import React from "react";
import { Link } from "react-router-dom";
import CompetencyPicker from "../components/CompetencyPicker";
import AppOverlay from "../ui/AppOverlay";
import {
  APP_ROUTES,
  vorhabenLevelPath,
  vorhabenLektionPath,
} from "../config/appUrls";
import WocheErinnerungen from "./WocheErinnerungen";
import { lektionHasZiel } from "./themaOverviewUtils";

const PILLAR_TITLES = {
  "kompetenzen-ziele": "Kompetenzen & Ziele",
  "material-todos": "Todos & Material",
  material: "Material",
  todo: "Todos",
};

const SheetField = ({ id, label, value, onChange, rows = 3, placeholder }) => (
  <div className="app-overlay-field">
    <label htmlFor={id}>{label}</label>
    <textarea
      id={id}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const ThemaPillarSheet = ({ open, pillarId, vorhaben, onChange, onClose }) => {
  if (!pillarId) {
    return null;
  }

  const title = PILLAR_TITLES[pillarId] || "Details";

  const updateGrob = (patch) => {
    onChange({
      ...vorhaben,
      grob: { ...vorhaben.grob, ...patch },
    });
  };

  const updateZweiWochen = (patch) => {
    onChange({
      ...vorhaben,
      zweiWochen: { ...vorhaben.zweiWochen, ...patch },
    });
  };

  const updateLektion = (lektionId, patch) => {
    onChange({
      ...vorhaben,
      lektionen: vorhaben.lektionen.map((l) =>
        l.id === lektionId ? { ...l, ...patch } : l
      ),
    });
  };

  const renderBody = () => {
    switch (pillarId) {
      case "kompetenzen-ziele": {
        const themaCompCount = vorhaben.competencies?.length || 0;
        return (
          <>
            <p className="thema-sheet-lead">
              Kompetenzen und Lernziele gehören zusammen. Die Ziele am Thema orientieren sich an
              den gewählten Kompetenzen — später werden sie noch enger daraus abgeleitet.
            </p>
            <section className="thema-sheet-section thema-sheet-section--card">
              <div className="thema-sheet-section-head">
                <h3 className="thema-sheet-section-title">Kompetenzen am Thema</h3>
                <span className="thema-sheet-count" aria-live="polite">
                  {themaCompCount}
                </span>
              </div>
              <p className="thema-sheet-hint thema-sheet-hint--inline">
                Aus{" "}
                <Link to={APP_ROUTES.search} onClick={onClose}>
                  Suche
                </Link>{" "}
                oder Merkliste (Sidebar).
              </p>
              <CompetencyPicker
                variant="thema"
                selected={vorhaben.competencies || []}
                onChange={(competencies) => onChange({ ...vorhaben, competencies })}
                maxSelected={12}
              />
            </section>
            <section className="thema-sheet-section thema-sheet-section--card">
              <h3 className="thema-sheet-section-title">Lernziele am Thema</h3>
              <SheetField
                id="pillar-thema-ziele"
                label="Was sollen die Lernenden können?"
                value={vorhaben.grob?.ziele || ""}
                onChange={(v) => updateGrob({ ziele: v })}
                rows={4}
                placeholder="Aus den Kompetenzen ableiten — Ende des Themas …"
              />
              <p className="thema-sheet-hint">
                <Link to={vorhabenLevelPath(vorhaben.id, "grob")} onClick={onClose}>
                  Phasen &amp; Voraussetzungen (Grobplanung) →
                </Link>
              </p>
            </section>
            <section className="thema-sheet-section thema-sheet-section--card">
              <h3 className="thema-sheet-section-title">Kompetenzen & Ziele pro Lektion</h3>
              <p className="thema-sheet-hint thema-sheet-hint--inline">
                Schwerpunkte und Ziele je Stunde in der Lektionsplanung.
              </p>
              {(vorhaben.lektionen || []).length === 0 ? (
                <p className="planning-empty">Zuerst eine Lektion anlegen.</p>
              ) : (
                <ul className="thema-sheet-lek-comp-list">
                  {vorhaben.lektionen.map((lek) => {
                    const n = lek.competencies?.length || 0;
                    return (
                      <li key={lek.id}>
                        <Link
                          to={vorhabenLektionPath(vorhaben.id, lek.id)}
                          className="thema-sheet-lek-comp-row"
                          onClick={onClose}
                        >
                          <span className="thema-sheet-lek-comp-title">{lek.title}</span>
                          <span
                            className={`thema-sheet-lek-comp-badge${n > 0 ? " thema-sheet-lek-comp-badge--on" : ""}`}
                          >
                            {n > 0 ? `${n} Komp.` : "Planen →"}
                            {lektionHasZiel(lek) ? " · Ziel ✓" : ""}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        );
      }

      case "material-todos":
      case "material":
      case "todo":
        return (
          <>
            <section className="thema-sheet-section thema-sheet-section--card">
              <h3 className="thema-sheet-section-title">Todos</h3>
              <WocheErinnerungen vorhaben={vorhaben} onChange={onChange} />
            </section>
            <section className="thema-sheet-section thema-sheet-section--card">
              <h3 className="thema-sheet-section-title">Material — Thema / Zeitraum</h3>
              <SheetField
                id="pillar-zwei-mat"
                label="Übergreifend"
                value={vorhaben.zweiWochen?.material || ""}
                onChange={(v) => updateZweiWochen({ material: v })}
                rows={3}
                placeholder="Material, Medien, Arbeitsblätter …"
              />
            </section>
            <section className="thema-sheet-section thema-sheet-section--card">
              <h3 className="thema-sheet-section-title">Material pro Lektion</h3>
              {(vorhaben.lektionen || []).length === 0 ? (
                <p className="planning-empty">Noch keine Lektionen.</p>
              ) : (
                <ul className="thema-sheet-lek-list">
                  {vorhaben.lektionen.map((lek) => (
                    <li key={lek.id}>
                      <label htmlFor={`pillar-m-${lek.id}`} className="thema-sheet-lek-label">
                        {lek.title}
                      </label>
                      <textarea
                        id={`pillar-m-${lek.id}`}
                        rows={2}
                        value={lek.material || ""}
                        onChange={(e) => updateLektion(lek.id, { material: e.target.value })}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <AppOverlay
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      className="thema-pillar-sheet"
    >
      {renderBody()}
    </AppOverlay>
  );
};

export default ThemaPillarSheet;
