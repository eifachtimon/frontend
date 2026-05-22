import React, { useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../config/appUrls";

const ONBOARDING_KEY = "lp21-onboarding-dismissed-v1";

const STEPS = [
  {
    title: "1. Recherchieren",
    body: "In der Suche Kompetenzen finden, merken oder direkt einem Vorhaben zuordnen.",
    to: APP_ROUTES.search,
    cta: "Zur Suche",
  },
  {
    title: "2. Vorhaben anlegen",
    body: "Ein Unterrichtsstrang mit vier Ebenen: Grob → 2 Wochen → Woche → Lektion.",
    to: APP_ROUTES.planung,
    cta: "Vorhaben anlegen",
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

  return (
    <section className="planning-onboarding" aria-labelledby="planning-onboarding-title">
      <div className="planning-onboarding-head">
        <h2 id="planning-onboarding-title">So arbeitest du in drei Schritten</h2>
        <button
          type="button"
          className="planning-onboarding-dismiss"
          onClick={handleDismiss}
          aria-label="Hinweis ausblenden"
        >
          Ausblenden
        </button>
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
