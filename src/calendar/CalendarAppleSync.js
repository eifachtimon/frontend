import React, { useCallback, useState } from "react";
import {
  collectExportEvents,
  downloadIcsFile,
  feedUrlsForToken,
  getOrCreateExportToken,
  syncAllToAppleFeed,
} from "./calendarExport";

const CalendarAppleSync = ({ calStore, onStoreChange, planningStore }) => {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState(calStore.lastAppleSync || null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const token = calStore.exportToken || "—";

  const { webcalUrl, httpsUrl } = calStore.exportToken
    ? feedUrlsForToken(calStore.exportToken)
    : { webcalUrl: "", httpsUrl: "" };

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError("");
    try {
      getOrCreateExportToken(calStore, onStoreChange);
      const result = await syncAllToAppleFeed(calStore, onStoreChange, planningStore);
      const next = {
        ...calStore,
        exportToken: result.token,
        lastAppleSync: {
          syncedAt: result.syncedAt,
          eventCount: result.eventCount,
        },
      };
      onStoreChange(next);
      setStatus(next.lastAppleSync);
    } catch (err) {
      setError(err.message || "Synchronisation fehlgeschlagen");
    } finally {
      setSyncing(false);
    }
  }, [calStore, onStoreChange, planningStore]);

  const handleDownload = async () => {
    setError("");
    try {
      const events = collectExportEvents(planningStore, calStore);
      await downloadIcsFile(events);
    } catch (err) {
      setError(err.message || "Download fehlgeschlagen");
    }
  };

  const handleCopyWebcal = async () => {
    try {
      await navigator.clipboard.writeText(webcalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Link konnte nicht kopiert werden.");
    }
  };

  return (
    <section className="cal-apple-sync" aria-labelledby="cal-apple-title">
      <h3 id="cal-apple-title" className="cal-drawer-section-title">
        Apple Kalender
      </h3>
      <p className="cal-apple-lead">
        Planungstermine als Abo in der Kalender-App (iPhone, iPad, Mac). Apple aktualisiert
        etwa alle 15 Minuten.
      </p>
      <ol className="cal-apple-steps">
        <li>
          <button
            type="button"
            className="planning-btn planning-btn--primary"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? "Synchronisiert …" : "Jetzt synchronisieren"}
          </button>
        </li>
        <li>Kalender-App → Kalender hinzufügen → Abonnement hinzufügen</li>
        <li>URL einfügen (webcal) und speichern</li>
      </ol>
      {status ? (
        <p className="cal-apple-status">
          Zuletzt: {status.eventCount} Termine (
          {new Date(status.syncedAt).toLocaleString("de-CH")})
        </p>
      ) : null}
      {error ? <p className="cal-apple-error">{error}</p> : null}
      <div className="cal-apple-url-row">
        <input
          type="text"
          readOnly
          value={webcalUrl}
          aria-label="Abo-URL für Apple Kalender"
          className="cal-apple-url-input"
        />
        <button
          type="button"
          className="planning-btn planning-btn--secondary"
          onClick={handleCopyWebcal}
        >
          {copied ? "Kopiert" : "Kopieren"}
        </button>
      </div>
      <p className="cal-apple-hint">
        Lokal nur mit erreichbarer Server-URL (z. B. Deploy oder Tunnel). Alternativ:{" "}
        <button type="button" className="cal-apple-link-btn" onClick={handleDownload}>
          .ics-Datei laden
        </button>{" "}
        und in Apple Kalender importieren.
      </p>
      <p className="cal-apple-hint cal-apple-hint--muted">
        HTTPS-Feed: <span className="cal-apple-url-muted">{httpsUrl}</span>
      </p>
    </section>
  );
};

export default CalendarAppleSync;
