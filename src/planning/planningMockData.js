import { getTodayWeekdayId } from "./planningLevels";
import {
  createVorhaben,
  createTagesTodoItem,
  getIsoWeek,
  getTodayIsoDate,
  loadPlanningStore,
  savePlanningStore,
} from "./planningStore";

export const MOCK_PLANNING_APPLIED_KEY = "lp21-mock-planning-v1";

const mockComp = (uid, code, label, fach, themenbereich = "") => ({
  uid,
  code,
  label,
  fach,
  zyklus: "2",
  themenbereich,
});

const withWeekCards = (vorhaben, { kw, year, cardsByDay, sonderTage = [], focus = "" }) => {
  const week =
    vorhaben.wochen.find((w) => w.kw === kw && w.year === year) || vorhaben.wochen[0];
  const nextWeek = {
    ...week,
    kw,
    year,
    focus,
    sonderTage,
    days: { ...week.days },
  };
  for (const [wd, cards] of Object.entries(cardsByDay)) {
    const day = nextWeek.days[wd] || { cards: [], notiz: "" };
    nextWeek.days[wd] = {
      ...day,
      cards: [...(day.cards || []), ...cards],
      notiz: day.notiz || "",
    };
  }
  const otherWeeks = vorhaben.wochen.filter((w) => w.id !== week.id);
  return {
    ...vorhaben,
    wochen: [nextWeek, ...otherWeeks],
  };
};

/** Demo-Themen mit allen Planungsebenen befüllt. */
export const buildMockPlanningStore = () => {
  const base = loadPlanningStore();
  const { kw, year } = getIsoWeek();
  const todayWd = getTodayWeekdayId() || "mi";
  const isoDate = getTodayIsoDate();

  let brueche = createVorhaben({
    templateId: "thema",
    title: "Brüche im Alltag",
    fach: "Mathematik",
    zyklus: "2",
    klasse: "5b",
  });
  brueche.id = "mock-v-brueche";
  brueche.lastVisitedLevel = "uebersicht";
  brueche.competencies = [
    mockComp(
      "mock-mu-1",
      "MU.2.A.1.1a",
      "Grössere natürliche Zahlen lesen, schreiben und ordnen",
      "Mathematik",
      "Zahl und Variable"
    ),
    mockComp(
      "mock-mu-2",
      "MU.2.A.3.2b",
      "Brüche als Anteile von Grössen deuten",
      "Mathematik",
      "Zahl und Variable"
    ),
    mockComp(
      "mock-mu-3",
      "MU.2.D.1.1c",
      "Einfache Bruchteile in Alltagssituationen erkennen",
      "Mathematik",
      "Grössen und Messen"
    ),
  ];
  brueche.grob = {
    ...brueche.grob,
    voraussetzungen:
      "Zyklus 2: Teilung und Anteile sind bekannt. Einige Lernende verwechseln noch Zähler und Nenner.",
    ziele:
      "Lernende können Bruchteile in Alltagssituationen deuten, vergleichen und in einfachen Kontexten anwenden.",
    schwerpunkte: "Bruchstreifen, Vergleichen, Transfer in Rezepte und Sport.",
    sicherung: "Lernzielkontrolle Freitag (Kurztest), Lernjournal-Eintrag, mündliche Reflexion.",
    notizen: "Kooperation mit DaZ: Fachbegriffe vorab im Wortspeicher.",
    phasen: brueche.grob.phasen.map((p, i) => ({
      ...p,
      notes:
        i === 0
          ? "Plenum: Pizza-Frage, Handausdruck."
          : i === 1
            ? "Partnerarbeit mit Materialkärtchen."
            : i === 2
              ? "Stationen: Rezepte, Sport, Bauen."
              : "Exit-Ticket: Was war schwierig?",
    })),
  };
  brueche.zweiWochen = {
    label: "Block 3 · Brüche",
    meilensteine: [
      { id: "mock-ms-1", text: "Materialkärtchen kopieren & sortieren", done: true },
      { id: "mock-ms-2", text: "Stationenplan für Mi/Do fertig", done: false },
      { id: "mock-ms-3", text: "Lernzielkontrolle vorbereiten", done: false },
    ],
    material: "Bruchstreifen, Arbeitsblätter Stationen, Taschenrechner (optional)",
    beobachtung: "Wer verwechselt Zähler/Nenner? Wer kann Vergleiche begründen?",
    notizen:
      "• Einstieg / Aktivierung (10 Min)\n• Stationenlernen (25 Min)\n• Lernstand erfassen (8 Min)",
  };

  const lek1Id = "mock-l-brueche-1";
  const lek2Id = "mock-l-brueche-2";
  const ph0 = brueche.grob.phasen[0]?.id;
  const ph2 = brueche.grob.phasen[2]?.id;
  brueche.lektionen = [
    {
      id: lek1Id,
      title: "Einstieg: Anteile sichtbar machen",
      phaseId: ph0 || null,
      ziele: "Bruchteile als Anteile erkennen und benennen.",
      durationMin: 45,
      competencies: [brueche.competencies[0]],
      ablaufBlocks: [
        { id: "mock-b1", label: "Einstieg / Aktivierung", durationMin: 10, ritualId: "rit-einstieg", notes: "" },
        { id: "mock-b2", label: "Plenum / Input", durationMin: 15, ritualId: "rit-plenum", notes: "" },
        { id: "mock-b3", label: "Reflexion", durationMin: 10, ritualId: "rit-reflexion", notes: "" },
      ],
      material: "Bruchstreifen-Satz, Flipchart",
      sicherung: "Daumen-Skala + 2 Sätze im Lernjournal",
      durchfuehren: "",
      notizen: "Lernende mit DaZ früh einbinden.",
      weekId: null,
      weekday: "mo",
    },
    {
      id: lek2Id,
      title: "Stationen: Brüche anwenden",
      phaseId: ph2 || null,
      ziele: "Brüche in Alltagssituationen anwenden.",
      durationMin: 45,
      competencies: [brueche.competencies[1]],
      ablaufBlocks: [
        { id: "mock-b4", label: "Stationenlernen", durationMin: 25, ritualId: "rit-stationen", notes: "" },
        { id: "mock-b5", label: "Lernstand erfassen", durationMin: 8, ritualId: "rit-lernstand", notes: "" },
        { id: "mock-b6", label: "Mitnahme / Hausaufgabe", durationMin: 5, ritualId: "rit-mitnahme", notes: "" },
      ],
      material: "3 Stationen, Timer, Hilfekarten",
      sicherung: "Checkliste pro Station",
      durchfuehren: "Gruppe B brauchte mehr Zeit an Station 2.",
      notizen: "",
      weekId: null,
      weekday: "mi",
    },
  ];

  brueche.erinnerungen = [
    {
      id: "mock-e-1",
      text: "Bruchstreifen-Satz aus Lehrmittelraum holen",
      done: false,
      dueDate: isoDate,
      kw,
      weekday: todayWd,
    },
    {
      id: "mock-e-2",
      text: "Kopien für Lernzielkontrolle (Freitag)",
      done: false,
      dueDate: null,
      kw,
      weekday: "fr",
    },
    {
      id: "mock-e-3",
      text: "Elterninfo Elternabend verschickt",
      done: true,
      dueDate: null,
      kw,
      weekday: null,
    },
    {
      id: "mock-e-4",
      text: "Sitzordnung für Stationen vorbereiten",
      done: false,
      dueDate: null,
      kw: null,
      weekday: null,
    },
  ];

  brueche = withWeekCards(brueche, {
    kw,
    year,
    focus: "Bruchteile vergleichen und in Alltagssituationen deuten",
    sonderTage: [{ id: "mock-st-1", weekday: "do", type: "elterninfo", label: "Elternabend 19:30" }],
    cardsByDay: {
      mo: [
        {
          id: "mock-c-mo",
          type: "lektion",
          label: "Einstieg: Anteile sichtbar",
          durationMin: 45,
          lektionId: lek1Id,
          startMin: 8 * 60 + 15,
        },
      ],
      di: [
        {
          id: "mock-c-di",
          type: "arbeit",
          label: "Übungsblatt Vergleichen",
          durationMin: 45,
          startMin: 10 * 60,
        },
      ],
      mi: [
        {
          id: "mock-c-mi",
          type: "lektion",
          label: "Stationen Brüche",
          durationMin: 45,
          lektionId: lek2Id,
          startMin: 8 * 60 + 30,
        },
      ],
      do: [
        {
          id: "mock-c-do",
          type: "notiz",
          label: "Vertiefung / Differenzierung",
          durationMin: 40,
          startMin: 9 * 60,
        },
      ],
      fr: [
        {
          id: "mock-c-fr",
          type: "pruefung",
          label: "Lernzielkontrolle Brüche",
          durationMin: 45,
          startMin: 8 * 60,
        },
      ],
    },
  });
  brueche.updatedAt = Date.now() - 3600000;

  let sach = createVorhaben({
    templateId: "thema",
    title: "Sachgeschichten schreiben",
    fach: "Deutsch",
    zyklus: "2",
    klasse: "5b",
  });
  sach.id = "mock-v-deutsch";
  sach.lastVisitedLevel = "zwei-wochen";
  sach.competencies = [
    mockComp(
      "mock-de-1",
      "D.2.A.1.3a",
      "Texte gliedern und Absätze sinnvoll bilden",
      "Deutsch",
      "Schreiben"
    ),
    mockComp("mock-de-2", "D.2.B.2.1b", "Sachgeschichten planen und verfassen", "Deutsch", "Schreiben"),
  ];
  sach.grob.ziele =
    "Lernende verfassen eine kurze Sachgeschichte mit klarer Struktur (Einleitung – Hauptteil – Schluss).";
  sach.grob.schwerpunkte = "Recherche, Planung, Peer-Feedback";
  sach.zweiWochen.meilensteine = [
    { id: "mock-de-ms-1", text: "Themenliste mit Klasse erarbeiten", done: true },
    { id: "mock-de-ms-2", text: "Feedback-Raster für Partnerarbeit", done: false },
  ];
  sach.zweiWochen.material = "Chromebooks, Merkblatt Textgliederung";
  sach.lektionen = [
    {
      id: "mock-l-de-1",
      title: "Planung: Struktur der Sachgeschichte",
      durationMin: 45,
      competencies: [sach.competencies[0]],
      ablaufBlocks: [
        { id: "mock-db1", label: "Einstieg / Aktivierung", durationMin: 10, ritualId: "rit-einstieg", notes: "" },
        { id: "mock-db2", label: "Plenum / Input", durationMin: 20, ritualId: "rit-plenum", notes: "" },
      ],
      material: "",
      sicherung: "",
      durchfuehren: "",
      notizen: "",
      weekId: null,
      weekday: null,
    },
  ];
  sach.erinnerungen = [
    {
      id: "mock-de-e1",
      text: "Chromebooks laden & testen",
      done: false,
      kw,
      weekday: "di",
      dueDate: null,
    },
  ];
  sach = withWeekCards(sach, {
    kw,
    year,
    cardsByDay: {
      di: [
        {
          id: "mock-de-c1",
          type: "lektion",
          label: "Planung Sachgeschichte",
          durationMin: 45,
          lektionId: "mock-l-de-1",
          startMin: 9 * 60 + 15,
        },
      ],
    },
  });
  sach.updatedAt = Date.now() - 86400000 * 2;

  let natur = createVorhaben({
    templateId: "projekt",
    title: "Wasser im Kreislauf",
    fach: "Natur, Mensch, Gesellschaft",
    zyklus: "2",
    klasse: "5b",
  });
  natur.id = "mock-v-nmg";
  natur.lastVisitedLevel = "grob";
  natur.competencies = [
    mockComp(
      "mock-nm-1",
      "NMG.2.A.2.1a",
      "Einfache Zusammenhänge im Wasserkreislauf beschreiben",
      "NMG",
      "Natur und Landschaft"
    ),
  ];
  natur.grob.voraussetzungen = "Thema «Wetter» wurde im Herbst behandelt.";
  natur.grob.ziele = "Lernende erklären den Wasserkreislauf mit Fachbegriffen und Modell.";
  natur.lektionen = [];
  natur.erinnerungen = [];
  natur.updatedAt = Date.now() - 86400000 * 5;

  const tagesNotizen = {
    ...base.tagesNotizen,
    [isoDate]: {
      todos: [
        createTagesTodoItem("Kopien Bruchstreifen"),
        { ...createTagesTodoItem("Elternmail Elternabend"), done: true },
        createTagesTodoItem("Konferenz-Protokoll lesen"),
      ],
      notizen:
        "Nach der 3. Stunde: zwei Lernende für Nachübung einplanen. Nächste Woche Ausflug mit Klasse 5a abstimmen.",
    },
  };

  return {
    ...base,
    vorhaben: [brueche, sach, natur],
    lastActiveVorhabenId: brueche.id,
    tagesNotizen,
  };
};

/**
 * @param {{ replace?: boolean }} options
 * replace=true: ersetzt alle Themen; false: hängt Demo-Themen an (ohne ID-Kollision).
 */
export const applyMockPlanningStore = (options = {}) => {
  const { replace = true } = options;
  const mock = buildMockPlanningStore();
  const current = loadPlanningStore();

  let next;
  if (replace) {
    next = mock;
  } else {
    const existingIds = new Set(current.vorhaben.map((v) => v.id));
    const extra = mock.vorhaben.filter((v) => !existingIds.has(v.id));
    next = {
      ...current,
      vorhaben: [...current.vorhaben, ...extra],
      lastActiveVorhabenId: mock.lastActiveVorhabenId,
      tagesNotizen: { ...current.tagesNotizen, ...mock.tagesNotizen },
    };
  }

  savePlanningStore(next);
  try {
    window.localStorage.setItem(MOCK_PLANNING_APPLIED_KEY, String(Date.now()));
  } catch (_e) {
    // ignore
  }
  return next;
};
