import React from "react";
import { Link } from "react-router-dom";
import CompetencyPicker from "../components/CompetencyPicker";
import AppOverlay from "../ui/AppOverlay";
import { vorhabenLevelPath } from "../config/appUrls";
import { DURATION_OPTIONS } from "./planningDefaults";
import { lektionBlocksSumMin, lektionHasTimeMismatch } from "./themaOverviewUtils";

const LektionDetailSheet = ({
  open,
  lektion,
  vorhaben,
  rituals,
  onChange,
  onClose,
  onDelete,
}) => {
  if (!lektion) {
    return null;
  }

  const updateLektion = (patch) => {
    onChange({
      ...vorhaben,
      lektionen: vorhaben.lektionen.map((l) =>
        l.id === lektion.id ? { ...l, ...patch } : l
      ),
    });
  };

  const phases = vorhaben.grob?.phasen || [];
  const sumMin = lektionBlocksSumMin(lektion);
  const mismatch = lektionHasTimeMismatch(lektion);

  const addBlock = (rit) => {
    updateLektion({
      ablaufBlocks: [
        ...(lektion.ablaufBlocks || []),
        {
          id: `b-${Date.now()}`,
          label: rit.name,
          durationMin: rit.durationMin,
          ritualId: rit.id,
          notes: "",
        },
      ],
    });
  };

  const removeBlock = (blockId) => {
    updateLektion({
      ablaufBlocks: (lektion.ablaufBlocks || []).filter((b) => b.id !== blockId),
    });
  };

  const handleInheritCompetencies = () => {
    const thema = vorhaben.competencies || [];
    const merged = [...(lektion.competencies || [])];
    for (const c of thema) {
      if (!merged.some((m) => m.uid === c.uid)) {
        merged.push(c);
      }
    }
    updateLektion({ competencies: merged });
  };

  const footer = (
    <>
      <button
        type="button"
        className="planning-btn planning-btn--ghost"
        onClick={() => {
          if (window.confirm(`«${lektion.title}» wirklich löschen?`)) {
            onDelete(lektion.id);
            onClose();
          }
        }}
      >
        Löschen
      </button>
      <div className="app-overlay-footer-actions">
        <Link
          to={vorhabenLevelPath(vorhaben.id, "woche")}
          className="planning-btn planning-btn--ghost"
          onClick={onClose}
        >
          In Woche terminieren
        </Link>
        <button type="button" className="planning-btn planning-btn--primary" onClick={onClose}>
          Fertig
        </button>
      </div>
    </>
  );

  return (
    <AppOverlay
      open={open}
      onClose={onClose}
      title={lektion.title || "Lektion"}
      size="lg"
      className="thema-lektion-sheet"
      footer={footer}
    >
      <div className="app-overlay-field">
        <label htmlFor="lek-title">Titel</label>
        <input
          id="lek-title"
          type="text"
          value={lektion.title}
          onChange={(e) => updateLektion({ title: e.target.value })}
        />
      </div>

      <div className="app-overlay-row">
        <div className="app-overlay-field">
          <label htmlFor="lek-phase">Phase</label>
          <select
            id="lek-phase"
            value={lektion.phaseId || ""}
            onChange={(e) => updateLektion({ phaseId: e.target.value || null })}
          >
            <option value="">— nicht zugeordnet —</option>
            {phases.map((ph) => (
              <option key={ph.id} value={ph.id}>
                {ph.title}
              </option>
            ))}
          </select>
        </div>
        <div className="app-overlay-field">
          <label htmlFor="lek-dur">Dauer</label>
          <select
            id="lek-dur"
            value={lektion.durationMin}
            onChange={(e) => updateLektion({ durationMin: Number(e.target.value) })}
          >
            {DURATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="app-overlay-field">
        <label htmlFor="lek-ziele">Lernziele dieser Lektion</label>
        <textarea
          id="lek-ziele"
          rows={2}
          value={lektion.ziele || ""}
          onChange={(e) => updateLektion({ ziele: e.target.value })}
          placeholder="Was sollen die Lernenden in dieser Stunde erreichen?"
        />
      </div>

      <section className="thema-sheet-section">
        <div className="thema-sheet-section-head">
          <h3 className="thema-sheet-section-title">Kompetenzen</h3>
          {(vorhaben.competencies || []).length > 0 ? (
            <button
              type="button"
              className="planning-btn planning-btn--ghost planning-btn--small"
              onClick={handleInheritCompetencies}
            >
              Vom Thema übernehmen
            </button>
          ) : null}
        </div>
        <CompetencyPicker
          selected={lektion.competencies || []}
          onChange={(competencies) => updateLektion({ competencies })}
          maxSelected={8}
        />
      </section>

      <section className="thema-sheet-section">
        <h3 className="thema-sheet-section-title">Ablauf (Minuten)</h3>
        <ul className="lektion-ablauf">
          {(lektion.ablaufBlocks || []).map((b) => (
            <li key={b.id}>
              <span>{b.label}</span>
              <span className="lektion-block-dur">{b.durationMin}′</span>
              <button
                type="button"
                className="planning-icon-btn planning-btn--small"
                onClick={() => removeBlock(b.id)}
                aria-label="Block entfernen"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <p className={`lektion-time-sum${mismatch ? " lektion-time-sum--warn" : ""}`}>
          {sumMin} / {lektion.durationMin} Min
          {mismatch ? " — Summe passt nicht" : ""}
        </p>
        <div className="lektion-ritual-quick">
          {(rituals || []).map((rit) => (
            <button
              key={rit.id}
              type="button"
              className="woche-ritual-quick"
              onClick={() => addBlock(rit)}
            >
              + {rit.name}
            </button>
          ))}
        </div>
      </section>

      <div className="app-overlay-field">
        <label htmlFor="lek-material">Material</label>
        <textarea
          id="lek-material"
          rows={2}
          value={lektion.material || ""}
          onChange={(e) => updateLektion({ material: e.target.value })}
        />
      </div>
    </AppOverlay>
  );
};

export default LektionDetailSheet;
