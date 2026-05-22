import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createVorhaben,
  loadPlanningStore,
  upsertVorhaben,
} from "../planning/planningStore";
import { addCompetencyToVorhaben, competencyAlreadyInVorhaben } from "../planning/planningCompetencies";
import { vorhabenLevelPath } from "../config/appUrls";

const AddToVorhabenControl = ({ entry, className = "", onAdded }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [store, setStore] = useState(() => loadPlanningStore());

  const refresh = useCallback(() => {
    setStore(loadPlanningStore());
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("lp21-planning-updated", onUpdate);
    return () => window.removeEventListener("lp21-planning-updated", onUpdate);
  }, [open, refresh]);

  if (!entry?.uid) {
    return null;
  }

  const handleAdd = (vorhabenId) => {
    const current = loadPlanningStore();
    const v = current.vorhaben.find((x) => x.id === vorhabenId);
    if (!v) {
      return;
    }
    const next = addCompetencyToVorhaben(v, entry);
    upsertVorhaben(current, next);
    setOpen(false);
    onAdded?.(next);
  };

  const handleCreateAndAdd = () => {
    const current = loadPlanningStore();
    const v = createVorhaben({
      title: entry.code || entry.label?.slice(0, 48) || "Neues Vorhaben",
      fach: entry.fach || "",
      zyklus: entry.zyklus || "",
      competencies: [],
    });
    const withComp = addCompetencyToVorhaben(v, entry);
    const saved = upsertVorhaben(current, withComp);
    setOpen(false);
    onAdded?.(saved);
    navigate(vorhabenLevelPath(saved.id, "grob"));
  };

  const alreadyIn = (vorhabenId) => {
    const v = store.vorhaben.find((x) => x.id === vorhabenId);
    return competencyAlreadyInVorhaben(v, entry.uid);
  };

  return (
    <>
      <button
        type="button"
        className={`add-to-vorhaben-btn ${className}`.trim()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        onKeyDown={(e) => e.stopPropagation()}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Kompetenz einem Vorhaben zuordnen"
      >
        <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-7 3h2v6h-6v2h6v6h-2v-6h-6v-2h6V6z"
          />
        </svg>
        <span className="add-to-vorhaben-btn-label">Vorhaben</span>
      </button>

      {open ? (
        <div
          className="add-to-vorhaben-overlay"
          role="presentation"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        >
          <div
            className="add-to-vorhaben-modal"
            role="dialog"
            aria-labelledby="add-to-vorhaben-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="add-to-vorhaben-modal-header">
              <h2 id="add-to-vorhaben-title">Ins Vorhaben</h2>
              <button
                type="button"
                className="add-to-vorhaben-close"
                onClick={() => setOpen(false)}
                aria-label="Schliessen"
              >
                ×
              </button>
            </header>
            <p className="add-to-vorhaben-entry-preview" title={entry.label}>
              {entry.code ? (
                <span className="add-to-vorhaben-code">{entry.code}</span>
              ) : null}
              <span>{entry.label}</span>
            </p>

            {store.vorhaben.length === 0 ? (
              <p className="add-to-vorhaben-empty">
                Noch kein Vorhaben — lege eines an und übernimm die Kompetenz direkt.
              </p>
            ) : (
              <ul className="add-to-vorhaben-list">
                {store.vorhaben.map((v) => {
                  const inList = alreadyIn(v.id);
                  return (
                    <li key={v.id}>
                      <button
                        type="button"
                        className="add-to-vorhaben-pick"
                        disabled={inList}
                        onClick={() => handleAdd(v.id)}
                      >
                        <span className="add-to-vorhaben-pick-title">{v.title}</span>
                        <span className="add-to-vorhaben-pick-meta">
                          {inList
                            ? "Bereits enthalten"
                            : `${v.competencies?.length || 0} Kompetenzen`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              className="planning-btn planning-btn--primary add-to-vorhaben-create"
              onClick={handleCreateAndAdd}
            >
              + Neues Vorhaben mit dieser Kompetenz
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AddToVorhabenControl;
