import React, { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../config/appUrls";
import { VORHABEN_TEMPLATES } from "./planningDefaults";

const NeuesVorhabenModal = ({ open, onClose, onCreate }) => {
  const titleId = useId();
  const [templateId, setTemplateId] = useState("thema");
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    document.body.classList.add("cal-modal-open");
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("cal-modal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setTemplateId("thema");
      setNewTitle("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = () => {
    onCreate({ templateId, title: newTitle.trim() });
  };

  return (
    <div className="cal-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="cal-modal unterricht-vorhaben-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cal-modal-header">
          <h2 id={titleId} className="cal-modal-title">
            Neues Thema
          </h2>
          <button
            type="button"
            className="cal-modal-close"
            onClick={onClose}
            aria-label="Schliessen"
          >
            ×
          </button>
        </header>

        <div className="cal-modal-form unterricht-vorhaben-modal-body">
          <div className="template-chip-row" role="group" aria-label="Vorlage wählen">
            {VORHABEN_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`template-chip ${templateId === t.id ? "template-chip--active" : ""}`}
                onClick={() => setTemplateId(t.id)}
                aria-pressed={templateId === t.id}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="planning-create-row">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Titel (z. B. Bruchteile im Alltag)"
              aria-label="Titel des Themas"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <button
              type="button"
              className="planning-btn planning-btn--primary"
              onClick={handleSubmit}
            >
              Anlegen
            </button>
          </div>
          <p className="unterricht-create-hint">
            Kompetenzen findest du in der{" "}
            <Link to={APP_ROUTES.search} onClick={onClose}>
              Suche
            </Link>{" "}
            — merken oder «Ins Thema».
          </p>
        </div>
      </div>
    </div>
  );
};

export default NeuesVorhabenModal;
