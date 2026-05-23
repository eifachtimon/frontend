import React from "react";
import PlanningSection from "../PlanningSection";
import ThemaPanelShell from "../ThemaPanelShell";

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
    <ThemaPanelShell levelId="grob" fach={vorhaben.fach} vorhabenId={vorhaben.id}>
      <div className="planning-panel planning-panel--grob">
        <PlanningSection title="Ausgangslage">
          <div className="planning-field">
            <label htmlFor="grob-voraussetzungen">Voraussetzungen der Lernenden</label>
            <textarea
              id="grob-voraussetzungen"
              rows={2}
              value={grob.voraussetzungen || ""}
              onChange={(e) => updateGrob({ voraussetzungen: e.target.value })}
              placeholder="Was bringen die Lernenden mit? Was ist die Ausgangslage?"
            />
          </div>
        </PlanningSection>

        <PlanningSection title="Ziele & Schwerpunkte">
          <div className="planning-field">
            <label htmlFor="grob-ziele">Lernziele</label>
            <textarea
              id="grob-ziele"
              rows={3}
              value={grob.ziele || ""}
              onChange={(e) => updateGrob({ ziele: e.target.value })}
              placeholder="Was sollen die Lernenden am Ende können?"
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
        </PlanningSection>

        <PlanningSection title="Phasen">
          <fieldset className="planning-phasen">
            <legend className="planning-sr-only">Phasen</legend>
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
            <button
              type="button"
              className="planning-btn planning-btn--ghost"
              onClick={handleAddPhase}
            >
              + Phase
            </button>
          </fieldset>
        </PlanningSection>

        <PlanningSection title="Sichern & Notizen">
          <div className="planning-field">
            <label htmlFor="grob-sicherung">Ergebnissicherung (Planung)</label>
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
        </PlanningSection>
      </div>
    </ThemaPanelShell>
  );
};

export default GrobplanungPanel;
