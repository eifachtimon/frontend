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

export const parseLp21Parts = (code) => {
  const raw = code != null ? String(code).trim() : "";
  if (!raw) {
    return [];
  }
  return raw.split(".").map((p) => p.trim()).filter(Boolean);
};

/** Erste zwei LP21-Segmente (z. B. MU.6 aus MU.6.A.1.1a) = Kompetenzbereich-Code. */
export const kbCodeFromCompetencyCode = (code) => {
  const parts = parseLp21Parts(code);
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[1]}`;
  }
  return parts[0] || "";
};

/** Erste drei Segmente (Handlungs-/Themenaspekt), z. B. MU.6.A aus MU.6.A.1.1a */
export const aspectCodeFromCompetencyCode = (code) => {
  const parts = parseLp21Parts(code);
  if (parts.length >= 3) {
    return parts.slice(0, 3).join(".");
  }
  return "";
};

/**
 * Ketten-/Kompetenz-Zeile: letzte reine Buchstabeneinheit (z. B. „.a“) entfernen,
 * sonst höchstens vier Segmente (z. B. MU.6.A.1 aus MU.6.A.1.1a).
 */
export const clusterHeadingPrefixFromCode = (code) => {
  const parts = parseLp21Parts(code);
  if (parts.length === 0) {
    return "";
  }
  const last = parts[parts.length - 1];
  if (parts.length >= 2 && last.length === 1 && /^[a-z]$/i.test(last)) {
    return parts.slice(0, -1).join(".");
  }
  if (parts.length >= 4) {
    return parts.slice(0, 4).join(".");
  }
  return parts.join(".");
};

/**
 * Mehrwort-LP21-Präfixe (wie backend/server.py _KNOWN_MULTIWORD_KB_PREFIXES),
 * damit nicht nach dem ersten Wort zerschnitten wird.
 */
export const KNOWN_MULTIWORD_TB_PREFIXES = [
  "Grössen, Funktionen, Daten und Zufall",
  "Zahl und Variable",
  "Form und Raum",
  "Ethik, Religionen, Gemeinschaft",
  "Räume, Zeiten, Gesellschaften",
  "Wirtschaft, Arbeit, Haushalt",
  "Natur und Technik",
  "Mechanische und elektrische Phänomene untersuchen",
  "Fortpflanzung und Entwicklung analysieren",
  "Körperfunktionen verstehen",
  "Wesen und Bedeutung von Naturwissenschaften und Technik verstehen",
  "Medien und Informatik",
  "Textiles und Technisches Gestalten",
  "Bildnerisches Gestalten",
  "Bewegung und Sport",
  "Berufliche Orientierung",
  "Praxis des musikalischen Wissens",
];

/** Kompetenzbereich-Label vs. Rest (NFC, mehrwort-sicher). */
export const splitThemenbereichOnFirstWord = (thema) => {
  const raw = thema != null ? String(thema).replace(/\s+/g, " ").trim() : "";
  if (!raw) {
    return { first: "", rest: "" };
  }
  let t;
  try {
    t = raw.normalize("NFC");
  } catch {
    t = raw;
  }
  for (const prefix of KNOWN_MULTIWORD_TB_PREFIXES) {
    let pfx = prefix;
    try {
      pfx = prefix.normalize("NFC");
    } catch {
      // ignore
    }
    if (t === pfx) {
      return { first: t, rest: "" };
    }
    if (t.startsWith(`${pfx} `)) {
      return { first: pfx, rest: t.slice(pfx.length + 1).trim() };
    }
  }
  const idx = t.indexOf(" ");
  if (idx === -1) {
    return { first: t, rest: "" };
  }
  return { first: t.slice(0, idx), rest: t.slice(idx + 1).trim() };
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
