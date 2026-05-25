import React from "react";
import { Link } from "react-router-dom";
import CompetencyPicker from "../components/CompetencyPicker";
import {
  planungEntwurfPath,
  vorhabenLevelPath,
  vorhabenOverviewSectionPath,
} from "../config/appUrls";
import { DURATION_OPTIONS } from "./planningDefaults";
import {
  formatLektionSchedule,
  isLektionScheduled,
  lektionBlocksSumMin,
  lektionHasTimeMismatch,
} from "./themaOverviewUtils";

const LektionPlanEditor = ({ lektion, vorhaben, rituals, onChange, onDelete }) => {
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
  const scheduled = isLektionScheduled(lektion, vorhaben);
  const scheduleLabel = formatLektionSchedule(lektion, vorhaben);

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

  const entwurfTo = planungEntwurfPath({
    uid: lektion.competencies?.[0]?.uid,
    code: lektion.competencies?.[0]?.code,
    fach: lektion.competencies?.[0]?.fach || vorhaben.fach,
    text: lektion.competencies?.[0]?.label,
    vorhabenId: vorhaben.id,
  });

  return (
    <div className="lektion-plan-editor">
      <div className="lektion-plan-editor-col lektion-plan-editor-col--plan">
        <div className="lektion-plan-field-row">
          <div className="lektion-plan-field lektion-plan-field--grow">
            <label htmlFor="lek-plan-title">Titel</label>
            <input
              id="lek-plan-title"
              type="text"
              value={lektion.title}
              onChange={(e) => updateLektion({ title: e.target.value })}
            />
          </div>
          <div className="lektion-plan-field">
            <label htmlFor="lek-plan-dur">Dauer</label>
            <select
              id="lek-plan-dur"
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

        <div className="lektion-plan-field">
          <label htmlFor="lek-plan-phase">Phase im Thema</label>
          <select
            id="lek-plan-phase"
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

        {scheduled ? (
          <p className="lektion-plan-schedule" role="status">
            <span className="lektion-plan-schedule-dot" aria-hidden="true">
              ●
            </span>
            {scheduleLabel || "Im Wochenplan terminiert"}
          </p>
        ) : (
          <p className="lektion-plan-schedule lektion-plan-schedule--open" role="status">
            Noch nicht im Wochenplan —{" "}
            <Link to={vorhabenOverviewSectionPath(vorhaben.id, "woche")}>
              Woche im Thema öffnen
            </Link>
          </p>
        )}

        <div className="lektion-plan-field">
          <label htmlFor="lek-plan-ziele">Lernziele dieser Lektion</label>
          <textarea
            id="lek-plan-ziele"
            rows={3}
            value={lektion.ziele || ""}
            onChange={(e) => updateLektion({ ziele: e.target.value })}
            placeholder="Was sollen die Lernenden in dieser Stunde erreichen?"
          />
        </div>

        <section className="lektion-plan-section" aria-labelledby="lek-plan-komp-title">
          <div className="lektion-plan-section-head">
            <h2 id="lek-plan-komp-title" className="lektion-plan-section-title">
              Kompetenzen
            </h2>
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
            variant="lektion"
            selected={lektion.competencies || []}
            onChange={(competencies) => updateLektion({ competencies })}
            maxSelected={8}
          />
        </section>

        <div className="lektion-plan-field">
          <label htmlFor="lek-plan-material">Material</label>
          <textarea
            id="lek-plan-material"
            rows={3}
            value={lektion.material || ""}
            onChange={(e) => updateLektion({ material: e.target.value })}
            placeholder="Arbeitsblätter, Medien, Vorbereitung …"
          />
        </div>

        <div className="lektion-plan-field">
          <label htmlFor="lek-plan-notizen">Notizen</label>
          <textarea
            id="lek-plan-notizen"
            rows={2}
            value={lektion.notizen || ""}
            onChange={(e) => updateLektion({ notizen: e.target.value })}
          />
        </div>
      </div>

      <div className="lektion-plan-editor-col lektion-plan-editor-col--ablauf">
        <section className="lektion-plan-section" aria-labelledby="lek-plan-ablauf-title">
          <h2 id="lek-plan-ablauf-title" className="lektion-plan-section-title">
            Ablauf
          </h2>
          <ul className="lektion-ablauf lektion-ablauf--plan">
            {(lektion.ablaufBlocks || []).length === 0 ? (
              <li className="lektion-ablauf-empty">Rituale unten hinzufügen oder Blöcke manuell planen.</li>
            ) : (
              (lektion.ablaufBlocks || []).map((b) => (
                <li key={b.id} className="lektion-ablauf-item--plan">
                  <span className="lektion-ablauf-label">{b.label}</span>
                  <span className="lektion-block-dur">{b.durationMin}′</span>
                  <button
                    type="button"
                    className="planning-icon-btn"
                    onClick={() => removeBlock(b.id)}
                    aria-label={`${b.label} entfernen`}
                  >
                    ×
                  </button>
                </li>
              ))
            )}
          </ul>
          <p className={`lektion-time-sum${mismatch ? " lektion-time-sum--warn" : ""}`}>
            {sumMin} / {lektion.durationMin} Min
            {mismatch ? " — Summe passt nicht zur Dauer" : ""}
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

        <div className="lektion-plan-field">
          <label htmlFor="lek-plan-sich">Sichern — Ergebnissicherung</label>
          <textarea
            id="lek-plan-sich"
            rows={2}
            value={lektion.sicherung || ""}
            onChange={(e) => updateLektion({ sicherung: e.target.value })}
            placeholder="Wie werden Lernergebnisse erfasst?"
          />
        </div>

        <div className="lektion-plan-field">
          <label htmlFor="lek-plan-durch">Durchführen — Rückblick</label>
          <textarea
            id="lek-plan-durch"
            rows={2}
            value={lektion.durchfuehren || ""}
            onChange={(e) => updateLektion({ durchfuehren: e.target.value })}
            placeholder="Nach der Lektion: Was ist aufgefallen?"
          />
        </div>

        <Link to={entwurfTo} className="planning-btn planning-btn--primary lektion-plan-entwurf">
          Stundenentwurf öffnen →
        </Link>
      </div>

      <footer className="lektion-plan-footer">
        <button
          type="button"
          className="planning-btn planning-btn--ghost"
          onClick={() => {
            if (window.confirm(`«${lektion.title}» wirklich löschen?`)) {
              onDelete(lektion.id);
            }
          }}
        >
          Lektion löschen
        </button>
      </footer>
    </div>
  );
};

export default LektionPlanEditor;
