import React, { useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../config/appUrls";

const ONBOARDING_KEY = "lp21-onboarding-dismissed-v1";

const STEPS = [
  {
    title: "1. Recherchieren",
    body: "In der Suche Kompetenzen finden, merken oder direkt einem Thema zuordnen.",
    to: APP_ROUTES.search,
    cta: "Zur Suche",
  },
  {
    title: "2. Thema anlegen",
    body: "Ein Unterrichtsstrang in vier Schritten: Überblick → Zwischenziele → Woche → Lektion.",
    to: APP_ROUTES.home,
    cta: "Thema anlegen",
  },
  {
    title: "3. Woche planen",
    body: "Karten auf Mo–Fr legen — in der Wochenansicht oder im Kalender mit Drag & Drop.",
    to: APP_ROUTES.kalender,
    cta: "Zur Woche",
  },
];

const loadDismissed = () => {
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch (_e) {
    return false;
  }
};

const PlanningOnboarding = () => {
  const [dismissed, setDismissed] = useState(loadDismissed);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, "1");
    } catch (_e) {
      // ignore
    }
    setDismissed(true);
  };

  if (!expanded) {
    return (
      <section className="planning-onboarding planning-onboarding--compact" aria-label="Einstieg">
        <p className="planning-onboarding-teaser">
          Neu hier? <strong>3 Schritte</strong> von der Suche bis zur Woche.
        </p>
        <div className="planning-onboarding-compact-actions">
          <button
            type="button"
            className="planning-btn planning-btn--ghost planning-onboarding-expand"
            onClick={() => setExpanded(true)}
            aria-expanded={false}
          >
            Anzeigen
          </button>
          <button
            type="button"
            className="planning-onboarding-dismiss"
            onClick={handleDismiss}
            aria-label="Einstieg dauerhaft ausblenden"
          >
            Ausblenden
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="planning-onboarding" aria-labelledby="planning-onboarding-title">
      <div className="planning-onboarding-head">
        <h2 id="planning-onboarding-title">So arbeitest du in drei Schritten</h2>
        <div className="planning-onboarding-head-actions">
          <button
            type="button"
            className="planning-onboarding-dismiss"
            onClick={() => setExpanded(false)}
            aria-label="Einklappen"
          >
            Einklappen
          </button>
          <button
            type="button"
            className="planning-onboarding-dismiss"
            onClick={handleDismiss}
            aria-label="Hinweis ausblenden"
          >
            Ausblenden
          </button>
        </div>
      </div>
      <ol className="planning-onboarding-steps">
        {STEPS.map((step) => (
          <li key={step.title} className="planning-onboarding-step">
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            <Link to={step.to} className="planning-onboarding-cta">
              {step.cta}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default PlanningOnboarding;
