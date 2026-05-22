export const SONDER_TAG_TYPES = [
  { id: "ausflug", label: "Ausflug" },
  { id: "pruefung", label: "Prüfung / Test" },
  { id: "elterninfo", label: "Elterninfo / Abend" },
  { id: "teamtag", label: "Teamtag / Konferenz" },
  { id: "ersatz", label: "Ersatz / Vertretung" },
  { id: "ferien", label: "Ferien / Brückentag" },
  { id: "sonstiges", label: "Sonstiges" },
];

export const WEEKDAYS = [
  { id: "mo", label: "Mo" },
  { id: "di", label: "Di" },
  { id: "mi", label: "Mi" },
  { id: "do", label: "Do" },
  { id: "fr", label: "Fr" },
];

export const VORHABEN_TEMPLATES = [
  {
    id: "thema",
    label: "Thema",
    grob: {
      ziele: "Lernziele zum Thema festhalten …",
      phasen: [
        { title: "Einstieg & Motivation", notes: "" },
        { title: "Erarbeitung", notes: "" },
        { title: "Anwendung & Vertiefung", notes: "" },
        { title: "Reflexion & Transfer", notes: "" },
      ],
    },
  },
  {
    id: "projekt",
    label: "Projekt",
    grob: {
      ziele: "Projektziel und Produkt …",
      phasen: [
        { title: "Kick-off & Planung", notes: "" },
        { title: "Recherche / Erarbeitung", notes: "" },
        { title: "Umsetzung", notes: "" },
        { title: "Präsentation & Rückblick", notes: "" },
      ],
    },
  },
  {
    id: "kompetenzbereich",
    label: "Kompetenzbereich",
    grob: {
      ziele: "Kompetenzen, die in diesem Block abgedeckt werden …",
      phasen: [
        { title: "Standortbestimmung", notes: "" },
        { title: "Aufbau", notes: "" },
        { title: "Sicherung", notes: "" },
      ],
    },
  },
];

export const DEFAULT_RITUALS = [
  { id: "rit-einstieg", name: "Einstieg / Aktivierung", durationMin: 10, category: "einstieg" },
  { id: "rit-stationen", name: "Stationenlernen", durationMin: 25, category: "arbeit" },
  { id: "rit-plenum", name: "Plenum / Input", durationMin: 15, category: "arbeit" },
  { id: "rit-reflexion", name: "Reflexion", durationMin: 10, category: "abschluss" },
  { id: "rit-lernstand", name: "Lernstand erfassen", durationMin: 8, category: "abschluss" },
  { id: "rit-mitnahme", name: "Mitnahme / Hausaufgabe", durationMin: 5, category: "abschluss" },
];

export const DURATION_OPTIONS = [
  { value: 45, label: "45 Min" },
  { value: 90, label: "90 Min" },
  { value: 120, label: "120 Min" },
];
