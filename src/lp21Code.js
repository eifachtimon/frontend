/**
 * LP21-Kompetenzcodes (Struktur vgl. „Abkürzungen und Codes“, Lehrplan 21).
 * Kurzbezeichnungen der Fachbereiche / Module für Tooltips und Anzeige.
 */

export const LP21_TOKEN_LABEL = {
  D: "Deutsch",
  FS1E: "Englisch (1. Fremdsprache)",
  FS2F: "Französisch (2. Fremdsprache)",
  FS3I: "Italienisch (3. Fremdsprache)",
  LAT: "Latein",
  MA: "Mathematik",
  NMG: "Natur, Mensch, Gesellschaft",
  NT: "Natur und Technik",
  WAH: "Wirtschaft, Arbeit, Haushalt",
  RZG: "Räume, Zeiten, Gesellschaften",
  ERG: "Ethik, Religionen, Gemeinschaft",
  BG: "Bildnerisches Gestalten",
  TTG: "Textiles und Technisches Gestalten",
  MU: "Musik",
  BS: "Bewegung und Sport",
  MI: "Medien und Informatik",
  BO: "Berufliche Orientierung",
  EZ: "Entwicklungsorientierte Zugänge (1. Zyklus)",
  BNE: "Bildung für nachhaltige Entwicklung",
};

const expandToken = (token) => {
  if (!token) {
    return "";
  }
  const upper = String(token).trim();
  return LP21_TOKEN_LABEL[upper] || upper;
};

/**
 * Lesbare Kurzbeschreibung der Code-Segmente für title / aria (kein §).
 */
export const describeLp21Code = (code) => {
  if (!code || typeof code !== "string") {
    return "";
  }
  const parts = code.split(".").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    return "";
  }

  const head = expandToken(parts[0]);
  const rest = [];

  if (parts.length >= 5) {
    rest.push(`Kompetenzbereich ${parts[1]}`);
    rest.push(`Handlungs-/Themenaspekt ${parts[2]}`);
    rest.push(`Kompetenz ${parts[3]}`);
    rest.push(`Kompetenzstufe ${parts[4]}`);
    return [`Fachbereich: ${head}`, ...rest].join(" · ");
  }

  if (parts.length === 4) {
    const last = parts[3];
    const merged = last.match(/^(\d+)([a-z])$/i);
    if (merged) {
      rest.push(`Kompetenzbereich ${parts[1]}`);
      rest.push(`Zwischenebene ${parts[2]}`);
      rest.push(`Kompetenz ${merged[1]} · Kompetenzstufe ${merged[2].toLowerCase()}`);
      return [`Fachbereich: ${head}`, ...rest].join(" · ");
    }
    if (last.length === 1 && /^[a-z]$/i.test(last)) {
      rest.push(`Kompetenzbereich ${parts[1]}`);
      rest.push(`Kompetenz ${parts[2]}`);
      rest.push(`Kompetenzstufe ${last.toLowerCase()}`);
      return [`Fachbereich: ${head}`, ...rest].join(" · ");
    }
  }

  if (parts.length === 3) {
    const last = parts[2];
    if (last.length === 1 && /^[a-z]$/i.test(last)) {
      return [
        `Fachbereich: ${head}`,
        `Kompetenzbereich ${parts[1]}`,
        `Kompetenzstufe ${last.toLowerCase()}`,
      ].join(" · ");
    }
  }

  return [`Code: ${head}`, ...parts.slice(1)].join(" · ");
};

/**
 * Alle Stufen-Codes einer Kette (Kompetenzstufen a, b, c …).
 */
export const formatLp21StageCodes = (codes) => {
  if (!Array.isArray(codes) || codes.length === 0) {
    return "";
  }
  const sorted = [...codes].sort();
  return sorted.join(" · ");
};
