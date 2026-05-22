import React from "react";
import RitualPalette from "../RitualPalette";

const ZweiWochenPanel = ({ vorhaben, rituals, onChange }) => {
  const z = vorhaben.zweiWochen;

  const update = (patch) => {
    onChange({ ...vorhaben, zweiWochen: { ...z, ...patch } });
  };

  const handleMilestone = (id, field, value) => {
    update({
      meilensteine: z.meilensteine.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    });
  };

  const handleAddMilestone = () => {
    update({
      meilensteine: [
        ...z.meilensteine,
        { id: `m-${Date.now()}`, text: "", done: false },
      ],
    });
  };

  const appendRitualNote = (rit) => {
    const line = `• ${rit.name} (${rit.durationMin} Min)`;
    const notizen = z.notizen ? `${z.notizen}\n${line}` : line;
    update({ notizen });
  };

  return (
    <div className="planning-panel planning-panel--split">
      <div className="planning-panel-main">
        <div className="planning-field">
          <label htmlFor="z2-label">Bezeichnung</label>
          <input
            id="z2-label"
            type="text"
            value={z.label || ""}
            onChange={(e) => update({ label: e.target.value })}
          />
        </div>
        <fieldset className="planning-milestones">
          <legend>Meilensteine</legend>
          <ul>
            {z.meilensteine.map((m) => (
              <li key={m.id} className="planning-milestone-row">
                <input
                  type="checkbox"
                  checked={Boolean(m.done)}
                  onChange={(e) => handleMilestone(m.id, "done", e.target.checked)}
                  aria-label="Erledigt"
                />
                <input
                  type="text"
                  value={m.text}
                  onChange={(e) => handleMilestone(m.id, "text", e.target.value)}
                  placeholder="Meilenstein …"
                />
              </li>
            ))}
          </ul>
          <button type="button" className="planning-btn planning-btn--ghost" onClick={handleAddMilestone}>
            + Meilenstein
          </button>
        </fieldset>
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
        <div className="planning-field">
          <label htmlFor="z2-notizen">Notizen &amp; Rituale</label>
          <textarea
            id="z2-notizen"
            rows={4}
            value={z.notizen || ""}
            onChange={(e) => update({ notizen: e.target.value })}
          />
        </div>
      </div>
      <RitualPalette rituals={rituals} onPick={appendRitualNote} label="Rituale einfügen" />
    </div>
  );
};

export default ZweiWochenPanel;
