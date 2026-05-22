import React, { useState } from "react";
import {
  addSubscription,
  DEFAULT_SUBSCRIPTION_PRESETS,
  removeSubscription,
  updateSubscription,
} from "./calendarStore";
import { fetchIcsSubscription } from "./calendarApi";

const CalendarSubscriptionsPanel = ({
  store,
  onStoreChange,
  onRefreshAll,
  refreshing,
}) => {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Bitte eine iCal-URL eingeben (https://… oder webcal://…).");
      return;
    }
    onStoreChange(
      addSubscription(store, {
        name: name.trim() || "Abonnement",
        url: trimmedUrl,
      })
    );
    setUrl("");
    setName("");
    setError("");
  };

  const handlePreset = (preset) => {
    setName(preset.name);
    setUrl(preset.url);
    setError(preset.hint || "");
  };

  const handleToggle = (id, enabled) => {
    onStoreChange(updateSubscription(store, id, { enabled }));
  };

  const handleRemove = (id) => {
    if (window.confirm("Abonnement entfernen?")) {
      onStoreChange(removeSubscription(store, id));
    }
  };

  const handleRefreshOne = async (sub) => {
    const result = await fetchIcsSubscription(sub.url, sub.id);
    onStoreChange({
      ...store,
      subscriptionCache: {
        ...store.subscriptionCache,
        [sub.id]: result,
      },
    });
  };

  return (
    <section className="cal-subscriptions" aria-labelledby="cal-subscriptions-title">
      <h2 id="cal-subscriptions-title" className="cal-subscriptions-title">
        Kalender-Abos
      </h2>
      <p className="cal-subscriptions-lead">
        Schulkalender und andere iCal-Feeds (wie in Google/Apple Kalender). Daten werden über
        das Backend geladen — kein CORS-Problem im Browser.
      </p>

      <div className="cal-subscriptions-presets">
        {DEFAULT_SUBSCRIPTION_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="planning-btn planning-btn--ghost cal-preset-btn"
            onClick={() => handlePreset(p)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="cal-subscriptions-form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (z. B. Schule BS)"
          aria-label="Name des Abos"
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/kalender.ics oder webcal://…"
          aria-label="iCal-URL"
        />
        <button type="button" className="planning-btn planning-btn--primary" onClick={handleAdd}>
          Abo hinzufügen
        </button>
      </div>
      {error ? <p className="cal-subscriptions-error">{error}</p> : null}

      <div className="cal-subscriptions-actions">
        <button
          type="button"
          className="planning-btn planning-btn--secondary"
          onClick={onRefreshAll}
          disabled={refreshing}
        >
          {refreshing ? "Lädt …" : "Alle Abos aktualisieren"}
        </button>
      </div>

      <ul className="cal-subscriptions-list">
        {store.subscriptions.length === 0 ? (
          <li className="cal-subscriptions-empty">Noch keine Abos — URL oben eintragen.</li>
        ) : (
          store.subscriptions.map((sub) => {
            const cache = store.subscriptionCache?.[sub.id];
            const count = cache?.events?.length ?? 0;
            return (
              <li key={sub.id} className="cal-subscription-item">
                <label className="cal-subscription-toggle">
                  <input
                    type="checkbox"
                    checked={sub.enabled}
                    onChange={(e) => handleToggle(sub.id, e.target.checked)}
                  />
                  <span
                    className="cal-subscription-swatch"
                    style={{ background: sub.color }}
                    aria-hidden="true"
                  />
                  <span className="cal-subscription-name">{sub.name}</span>
                </label>
                <span className="cal-subscription-meta">
                  {cache?.ok === false ? (
                    <span className="cal-subscription-err" title={cache.error}>
                      Fehler
                    </span>
                  ) : (
                    <span>{count} Termine</span>
                  )}
                </span>
                <div className="cal-subscription-btns">
                  <button
                    type="button"
                    className="planning-btn planning-btn--ghost"
                    onClick={() => handleRefreshOne(sub)}
                  >
                    ↻
                  </button>
                  <button
                    type="button"
                    className="planning-btn planning-btn--ghost"
                    onClick={() => handleRemove(sub.id)}
                    aria-label={`${sub.name} entfernen`}
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
};

export default CalendarSubscriptionsPanel;
