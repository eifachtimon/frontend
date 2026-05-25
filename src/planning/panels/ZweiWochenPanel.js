import React from "react";
import PlanningSection from "../PlanningSection";
import RitualPalette from "../RitualPalette";
import ThemaPanelShell from "../ThemaPanelShell";

const ZweiWochenPanel = ({ vorhaben, rituals, onChange }) => {
  const z = vorhaben.zweiWochen;

  const update = (patch) => {
    onChange({ ...vorhaben, zweiWochen: { ...z, ...patch } });
  };

  const appendRitualNote = (rit) => {
    const line = `• ${rit.name} (${rit.durationMin} Min)`;
    const notizen = z.notizen ? `${z.notizen}\n${line}` : line;
    update({ notizen });
  };

  return (
    <ThemaPanelShell levelId="zwei-wochen" fach={vorhaben.fach} vorhabenId={vorhaben.id}>
      <div className="planning-panel planning-panel--split">
        <div className="planning-panel-main">
          <PlanningSection title="Zeitraum">
            <div className="planning-field">
              <label htmlFor="z2-label">Bezeichnung (z. B. «2. Fortschrittsblock»)</label>
              <input
                id="z2-label"
                type="text"
                value={z.label || ""}
                onChange={(e) => update({ label: e.target.value })}
              />
            </div>
          </PlanningSection>

          <PlanningSection title="Material & Beobachtung">
            <div className="planning-field">
              <label htmlFor="z2-material">Material</label>
              <textarea
                id="z2-material"
                rows={2}
                value={z.material || ""}
                onChange={(e) => update({ material: e.target.value })}
              />
            </div>
            <div className="planning-field">
              <label htmlFor="z2-beob">Beobachtung</label>
              <textarea
                id="z2-beob"
                rows={2}
                value={z.beobachtung || ""}
                onChange={(e) => update({ beobachtung: e.target.value })}
              />
            </div>
          </PlanningSection>

          <PlanningSection title="Notizen">
            <div className="planning-field">
              <label htmlFor="z2-notizen">Notizen &amp; Rituale</label>
              <textarea
                id="z2-notizen"
                rows={4}
                value={z.notizen || ""}
                onChange={(e) => update({ notizen: e.target.value })}
              />
            </div>
          </PlanningSection>
        </div>
        <RitualPalette rituals={rituals} onPick={appendRitualNote} label="Rituale einfügen" />
      </div>
    </ThemaPanelShell>
  );
};

export default ZweiWochenPanel;
