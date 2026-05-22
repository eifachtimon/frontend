import React from "react";
import CompetencyPicker from "../../components/CompetencyPicker";

const GrobplanungPanel = ({ vorhaben, onChange }) => {
  const { grob } = vorhaben;

  const updateGrob = (patch) => {
    onChange({ ...vorhaben, grob: { ...grob, ...patch } });
  };

  const handlePhaseChange = (phaseId, field, value) => {
    updateGrob({
      phasen: grob.phasen.map((p) =>
        p.id === phaseId ? { ...p, [field]: value } : p
      ),
    });
  };

  const handleAddPhase = () => {
    updateGrob({
      phasen: [
        ...grob.phasen,
        {
          id: `ph-${Date.now()}`,
          title: "Neue Phase",
          notes: "",
          order: grob.phasen.length,
        },
      ],
    });
  };

  const handleRemovePhase = (phaseId) => {
    updateGrob({ phasen: grob.phasen.filter((p) => p.id !== phaseId) });
  };

  return (
    <div className="planning-panel planning-panel--grob">
      <div className="planning-panel-main">
        <div className="planning-field">
          <label htmlFor="grob-voraussetzungen">Klären — Voraussetzungen &amp; Bedingungen</label>
          <textarea
            id="grob-voraussetzungen"
            rows={2}
            value={grob.voraussetzungen || ""}
            onChange={(e) => updateGrob({ voraussetzungen: e.target.value })}
            placeholder="Was bringen die Lernenden mit? Was ist die Ausgangslage?"
          />
        </div>
        <div className="planning-field">
          <label htmlFor="grob-ziele">Entscheiden — Lernziele &amp; Kompetenzen</label>
          <textarea
            id="grob-ziele"
            rows={3}
            value={grob.ziele || ""}
            onChange={(e) => updateGrob({ ziele: e.target.value })}
          />
        </div>
        <div className="planning-field">
          <label htmlFor="grob-schwerpunkte">Schwerpunkte</label>
          <textarea
            id="grob-schwerpunkte"
            rows={2}
            value={grob.schwerpunkte || ""}
            onChange={(e) => updateGrob({ schwerpunkte: e.target.value })}
          />
        </div>
        <fieldset className="planning-phasen">
          <legend>Phasen</legend>
          <ul className="planning-phase-list">
            {grob.phasen.map((phase, index) => (
              <li key={phase.id} className="planning-phase-item">
                <span className="planning-phase-num" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="planning-phase-fields">
                  <input
                    type="text"
                    value={phase.title}
                    onChange={(e) =>
                      handlePhaseChange(phase.id, "title", e.target.value)
                    }
                    aria-label={`Phase ${index + 1} Titel`}
                  />
                  <textarea
                    rows={2}
                    value={phase.notes || ""}
                    onChange={(e) =>
                      handlePhaseChange(phase.id, "notes", e.target.value)
                    }
                    placeholder="Notizen zur Phase …"
                    aria-label={`Phase ${index + 1} Notizen`}
                  />
                </div>
                <button
                  type="button"
                  className="planning-icon-btn"
                  onClick={() => handleRemovePhase(phase.id)}
                  aria-label={`Phase ${phase.title} entfernen`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="planning-btn planning-btn--ghost" onClick={handleAddPhase}>
            + Phase
          </button>
        </fieldset>
        <div className="planning-field">
          <label htmlFor="grob-sicherung">Sichern — Ergebnissicherung (Planung)</label>
          <textarea
            id="grob-sicherung"
            rows={2}
            value={grob.sicherung || ""}
            onChange={(e) => updateGrob({ sicherung: e.target.value })}
            placeholder="Formative/summative Sicherung, Lernspuren, Kriterien …"
          />
        </div>
        <div className="planning-field">
          <label htmlFor="grob-notizen">Weitere Notizen</label>
          <textarea
            id="grob-notizen"
            rows={3}
            value={grob.notizen || ""}
            onChange={(e) => updateGrob({ notizen: e.target.value })}
          />
        </div>
        <fieldset className="planning-fieldset-competencies">
          <legend>Kompetenzen (Vorhaben)</legend>
          <CompetencyPicker
            selected={vorhaben.competencies || []}
            onChange={(competencies) => onChange({ ...vorhaben, competencies })}
            maxSelected={12}
          />
        </fieldset>
      </div>
    </div>
  );
};

export default GrobplanungPanel;
