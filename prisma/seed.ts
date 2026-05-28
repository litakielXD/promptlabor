import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });
const seedAdminEmail = process.env.ADMIN_SEED_EMAIL || process.env.ADMIN_EMAIL || "admin@promptlabor.de";
const seedAdminPassword = process.env.ADMIN_SEED_PASSWORD || "admin123!";
const seedAdminName = process.env.ADMIN_SEED_NAME || "Lita";

async function main() {
  console.log("🌱 Seeding Promptlabor...");

  // Admin-Konto erstellen
  const adminPassword = await bcrypt.hash(seedAdminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: seedAdminEmail },
    update: {
      name: seedAdminName,
      password: adminPassword,
      role: "ADMIN",
      approved: true,
    },
    create: {
      name: seedAdminName,
      email: seedAdminEmail,
      password: adminPassword,
      role: "ADMIN",
      approved: true,
    },
  });
  console.log(`✓ Admin: ${admin.email}`);

  // Kategorien anlegen
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "unterrichtsvorbereitung" },
      update: {},
      create: {
        name: "Unterrichtsvorbereitung",
        slug: "unterrichtsvorbereitung",
        description: "Prompts für Planung und Vorbereitung von Unterrichtsstunden",
        color: "#6366f1",
        icon: "📚",
      },
    }),
    prisma.category.upsert({
      where: { slug: "differenzierung" },
      update: {},
      create: {
        name: "Differenzierung",
        slug: "differenzierung",
        description: "Aufgaben und Materialien für unterschiedliche Lernniveaus",
        color: "#0ea5e9",
        icon: "🎯",
      },
    }),
    prisma.category.upsert({
      where: { slug: "feedback-beurteilung" },
      update: {},
      create: {
        name: "Feedback & Beurteilung",
        slug: "feedback-beurteilung",
        description: "Prompts für Lernstandserhebung und konstruktives Feedback",
        color: "#f59e0b",
        icon: "✅",
      },
    }),
    prisma.category.upsert({
      where: { slug: "kreatives-schreiben" },
      update: {},
      create: {
        name: "Kreatives Schreiben",
        slug: "kreatives-schreiben",
        description: "Schreibanlässe und kreative Aufgaben",
        color: "#ec4899",
        icon: "✍️",
      },
    }),
    prisma.category.upsert({
      where: { slug: "elternkommunikation" },
      update: {},
      create: {
        name: "Elternkommunikation",
        slug: "elternkommunikation",
        description: "Vorlagen und Formulierungshilfen für die Elternarbeit",
        color: "#10a981",
        icon: "💌",
      },
    }),
  ]);
  console.log(`✓ ${categories.length} Kategorien erstellt`);

  // Beispiel-Prompts
  const examplePrompts = [
    {
      title: "Lernziele formulieren – differenziert",
      slug: "lernziele-differenziert",
      description: "Erstellt differenzierte Lernziele für eine Unterrichtseinheit auf drei Niveaustufen",
      content: `Ich plane eine Unterrichtseinheit für Klasse [KLASSE] zum Thema [THEMA] im Fach [FACH].

Erstelle für diese Einheit:
1. Drei übergeordnete Lernziele (Kompetenzbereich)
2. Je drei konkrete Lernziele für drei Niveaustufen:
   - Grundniveau (Mindeststandard)
   - Mittelniveau (Regelstandard)  
   - Erweiterungsniveau

Formuliere die Lernziele mit Operatoren aus Blooms Taxonomie und orientiere dich am Lehrplan [BUNDESLAND].

Ausgabeformat: Tabellarisch mit Spalten: Niveaustufe | Lernziel | Operator | Überprüfbarkeit`,
      model: "ALLROUND",
      categorySlug: "unterrichtsvorbereitung",
      tags: ["Lernziele", "Differenzierung", "Planung"],
    },
    {
      title: "Feedback zu Schülerarbeiten – konstruktiv und motivierend",
      slug: "feedback-schuelerarbeiten",
      description: "Generiert individuelles, konstruktives Feedback zu Schülertexten",
      content: `Du bist eine erfahrene Lehrkraft, die konstruktives und motivierendes Feedback gibt.

Analysiere folgenden Schülertext und gib Feedback:

TEXT:
[TEXT HIER EINFÜGEN]

RAHMENBEDINGUNGEN:
- Klasse/Alter: [ANGABE]
- Aufgabenstellung: [AUFGABE]
- Schwerpunkt-Kriterien: [z.B. Argumentation, Struktur, Sprache]

Gib Feedback mit folgender Struktur:
1. 🌟 Stärken (mindestens 3 konkrete Punkte)
2. 🎯 Entwicklungsfelder (max. 2 Punkte mit konkreten Verbesserungsvorschlägen)
3. 💡 Ein konkreter nächster Schritt

Ton: Wertschätzend, klar, ermutigend. Schreibe direkt an die Schülerin/den Schüler.`,
      model: "ALLROUND",
      categorySlug: "feedback-beurteilung",
      tags: ["Feedback", "Bewertung", "Texte"],
    },
    {
      title: "Interaktives Textabenteuer als HTML-Datei erstellen",
      slug: "textabenteuer-html-unterricht",
      description: "Erstellt ein vollständiges, interaktives Textabenteuer als Single-File-HTML für den Unterricht – mit verzweigtem Entscheidungsbaum, XP-System, Gamification und Differenzierungsoptionen.",
      content: `Du bist Fachdidaktiker, Storytelling-Experte und Game Designer für Unterrichtsmaterial. Erstelle ein vollständiges, interaktives Textabenteuer als Single-File-HTML-Website für den Unterricht.

---

## Pflichtangaben

- Thema: [THEMA]
- Fach: [FACH]
- Klasse / Jahrgangsstufe: [KLASSE]
- Schulform: [SCHULFORM]
- Niveau: [NIVEAU — z.B. ESA / MSA / Grundkurs / Leistungskurs / DaZ-freundlich]
- Bearbeitungszeit: [ZEIT] Minuten
- Lernziel: [LERNZIEL — was können SuS nach dem Abenteuer?]
- Sprachregister: [z.B. einfach (Klasse 5–7) / sachlich-analytisch (Klasse 9–10) / wissenschaftspropädeutisch (Oberstufe)]
- Hauptfigur / Perspektive: [z.B. "Du bist ein junger Arzt in der Weimarer Republik" / offen lassen für auto-Generierung]
- Erzählton: [z.B. spannend-abenteuerlich / historisch-dokumentarisch / dystopisch / sachlich-nüchtern / humorvoll]

---

## Geschichte & Struktur

Baue das Abenteuer als verzweigten Entscheidungsbaum mit folgender Pflichtstruktur:

**Akt 1 — Einstieg (ca. 15 % der Spielzeit)**
- Unmittelbarer Spannungseinstieg: SuS befinden sich mitten in einer konkreten Situation, kein langer Aufbau
- Vorstellung der Hauptfigur und des Konflikts in max. 3 Absätzen
- Erste leichte Entscheidung (2 Optionen) zur Aktivierung — noch keine Wissensanwendung nötig
- Lernziel-relevantes Setting: Die Welt des Abenteuers entspricht dem Fachthema

**Akt 2 — Hauptteil (ca. 65 % der Spielzeit)**

Mindestens 4 vollständige Entscheidungsknoten, je mit:
- Situation (2–4 Absätze, Spannungsbogen aufrechterhalten)
- Fachinformation eingebettet in die Handlung (kein Info-Dump, sondern dramaturgisch eingesetzt)
- 3–4 Auswahloptionen mit folgenden Typen (verteilt über alle Knoten):
  - a) Richtige Antwort (führt vorwärts, +XP oder positives Erzählergebnis)
  - b) Plausibel falsche Antwort (führt zu Konsequenz + Erklärung + Rückkehr-Option)
  - c) Teilrichtige Antwort (führt zu neutralem Ergebnis + Hinweis was fehlt)
  - d) [Optional bei 4 Optionen] Mutige/kreative Option (überraschend, belohnt Querdenken)
- Sofort-Feedback nach jeder Wahl: fachlich korrekte Erklärung in 2–4 Sätzen, eingebettet in die Erzählung
- Konsequenzen sind spürbar: "falsch" bedeutet nicht Scheitern, sondern eine schwierigere Weiterführung

Mindestens 2 der 4 Knoten müssen eine der folgenden Aufgabenformen enthalten:
- Textstelle interpretieren oder einordnen (Primärquelle / Fallbeispiel im Spieltext)
- Kausalzusammenhang erkennen ("Warum führt X zu Y?")
- Entscheidung mit ethischer / gesellschaftlicher Dimension
- Transfer: Verbindung zwischen historischem/wissenschaftlichem Inhalt und Gegenwart

**Akt 3 — Abschluss (ca. 20 % der Spielzeit)**
- Konvergenz: Alle Pfade führen in eine gemeinsame Abschlussszene
- Sicherung: Die 3–5 wichtigsten Facherkenntnisse werden dramaturgisch zusammengefasst (Monolog, Zeitungsartikel, Brief o.ä. im Spieluniversum)
- Reflexionsfrage: 1 offene Frage, die SuS zum Weiterdenken anregt
- Optionale Bonusaufgabe: Für SuS, die fertig sind (Transfer, Recherche, Kreativaufgabe)

---

## Gamification-System (vollständig implementieren)

**Punkte / XP:**
- Richtige Antwort beim ersten Versuch: +20 XP
- Richtige Antwort nach Fehlversuch: +10 XP
- Teilrichtige Antwort: +5 XP
- Gesamtpunktzahl am Ende mit Einordnung (direkt an SuS, in Du-Form, passend zu [SPRACHREGISTER]):
  - 80–100 %: "Experte / Expertin"
  - 50–79 %: "Auf dem richtigen Weg"
  - unter 50 %: "Du hast die Grundlagen — übe weiter!"

**Fortschrittsanzeige:** sichtbarer Fortschrittsbalken oben (Akt 1 / 2 / 3), Kapitelbezeichnung immer sichtbar

**Entscheidungsprotokoll:** Am Ende Übersicht aller Entscheidungen (richtig / falsch / teilrichtig) — druckbar für Lehrkraft-Einsicht

---

## Technische Pflicht-Anforderungen

- **Single-File HTML** — alles in einer Datei, kein Build-Step, kein Server, kein Login
- CDNs erlaubt: Tailwind, Google Fonts, Lucide Icons (unpkg.com), canvas-confetti
- Screen-System: Alle Szenen als \`<div>\`, ein-/ausgeblendet via \`showScene(id)\`
- State-Objekt: \`gameState = { xp: 0, decisions: [], currentScene: 'intro', attempts: {} }\`
- Typisierter Entscheidungsbaum: \`scenes\`-Objekt mit id, text, choices, feedback, nextScene
- Kein Reload zum Neustarten — Reset-Funktion über Button
- Druckansicht (\`@media print\`): Entscheidungsprotokoll + Reflexionsfrage sauber auf A4

---

## Design-Vorgaben

- Themenpassendes Farbschema aus Thema ableiten (Geschichte → Sepia/Ocker; Bio → Grün; Informatik → Dunkel/Neon)
- Schrift: Google Fonts, themenpassend (historisch → Cinzel; modern/tech → Space Grotesk; neutral → Nunito)
- Entscheidungs-Buttons: hover-Effekt, nach Auswahl deaktiviert (kein Doppelklick)
- Feedback-Box: grün = richtig, gelb = teilrichtig, rot/orange = falsch
- Responsive: funktioniert auf Tablet (mind. 768px)
- Barrierefreiheit: WCAG AA Kontrast, aria-label, Fokus-Styles, Dark Mode

---

## Differenzierungsoptionen (optional, nach Bedarf angeben)

- **DaZ / B1:** Spieltext in einfacher Sprache, Schlüsselbegriffe erklärt, Glossar-Kiste ausklappbar
- **Inklusion:** "Was bedeutet das?"-Buttons pro Szene, Emoji-Unterstützung
- **Hochbegabung:** Optionaler "Expertenweg" mit höherem Abstraktionsniveau
- **Kooperativ:** 2-Spieler-Modus mit Diskussions-Timer (60 s)
- **Lehrkraft-Modus:** Doppelklick auf Titel öffnet Lösungsübersicht aller Entscheidungsknoten

---

## Beispiel-Befüllung (Geschichte, Klasse 8)

> Thema: Industrialisierung und soziale Frage
> Fach: Geschichte · Klasse: 8 · Schulform: Gemeinschaftsschule
> Niveau: MSA, DaZ-freundlich · Zeit: 45 Minuten
> Lernziel: SuS erkennen die Lebens- und Arbeitsbedingungen der Arbeiterklasse und verstehen die Entstehung von Gewerkschaften
> Sprachregister: einfach, direkte Ansprache, kurze Sätze
> Hauptfigur: "Du bist ein 14-jähriges Kind in einer Textilfabrik im Ruhrgebiet, 1875"
> Erzählton: spannend-dokumentarisch · Differenzierung: DaZ-Modus, Glossar-Kiste

---

Liefere die komplette HTML-Datei — kein Pseudocode, keine Auslassungen. Beginne direkt mit \`<!DOCTYPE html>\`.`,
      model: "ALLROUND",
      categorySlug: "unterrichtsvorbereitung",
      tags: ["Textabenteuer", "Gamification", "HTML", "Interaktiv", "Differenzierung"],
    },
    {
      title: "Druckfertige Arbeitsblattsammlung als DOCX erstellen",
      slug: "arbeitsblattsammlung-docx-druckfertig",
      description: "Erstellt aus Unterrichtsmaterialien eine vollständige, differenzierte Arbeitsblattsammlung als Word-Dokument mit Kapiteln, Medienboxen, Quizfragen, Transferaufgaben und Qualitätsprüfung.",
      content: `Du bist Fachdidaktiker, Materialdesigner und Node.js-Entwickler. Erstelle eine professionelle, druckfertige Arbeitsblattsammlung als Word-Dokument (.docx) auf Basis der folgenden Materialien.

## Eingabe

Inhaltsmaterial:
[TEXTE, STICHPUNKTE, THEMENÜBERSICHT, LEHRPLAN-AUSZUG ODER MATERIALIEN EINFÜGEN]

Zielgruppe:
- Klasse/Jahrgangsstufe: [KLASSE]
- Fach: [FACH]
- Sprachniveau: [z. B. A2-B1 für DaZ / altersgerecht]
- Lerngruppe: Viele Schülerinnen und Schüler mit [z. B. DaZ-Hintergrund / Lernschwäche / Hochbegabung]
- Anzahl der Themen/Kapitel: [ANZAHL ODER "aus Material ableiten"]

## Ziel

Erstelle ein vollständiges .docx-Dokument, das direkt ausgedruckt und im Unterricht eingesetzt werden kann. Alle Texte müssen auf Deutsch sein. Die Arbeitsblätter sollen fachlich korrekt, sprachsensibel, übersichtlich und optisch professionell wirken.

## Technische Ausgabe

Erstelle das Dokument vollständig mit Node.js.

Pflicht:
- Nutze die Bibliothek \`docx\` zur DOCX-Erstellung.
- Nutze \`qrcode\` oder \`qrcode-npm\`, um QR-Codes als PNG-Buffer direkt einzubetten.
- Nutze \`sharp\` zur Bildverarbeitung oder zur Erzeugung einfacher SVG-basierter PNG-Bildrahmen, falls Netzwerkzugriff blockiert ist.
- Lege ein Nummerierungssystem für nummerierte Listen und Bullets an.
- Seitenformat: A4 in DXA (\`11906 x 16838\`).
- Ränder: je \`1134\` DXA.
- Schrift: Arial, Grundgröße 11 pt.
- Ausgabe: eine fertige Datei \`arbeitsblattsammlung.docx\`.

Wenn Netzwerkzugriff auf Bildquellen oder Videos blockiert ist:
- Informiere kurz darüber.
- Erzeuge trotzdem ein vollständiges Dokument.
- Nutze dann SVG-basierte Bildrahmen mit Bildtitel, Datierung, Urheber- und Lizenzhinweis als sichtbaren Platzhalter.

## Dokumentstruktur

Halte diese Reihenfolge zwingend ein:

1. Titelseite
   - Titel der Sammlung
   - Fach, Klasse, Sprachniveau
   - Themenliste
   - kurzer Hinweis auf enthaltene Elemente: Medienbox, Informationstext, Infokasten, Begriffe, Quiz, Transferaufgaben

2. Pro Thema ein eigenes Kapitel
   - Seitenumbruch vor jedem neuen Thema
   - farbiger Banner-Header in der Themenfarbe
   - eigener Kapitel-Subheader
   - Reihenfolge innerhalb jedes Kapitels exakt:
     1. Medienbox
     2. Informationstext
     3. Infokasten
     4. Begriffe
     5. Quiz
     6. Transferaufgaben

## Inhalt pro Kapitel

Jedes Kapitel muss alle folgenden Elemente enthalten.

### 1. Medienbox

Erstelle eine zweispaltige Tabelle:

Linke Spalte:
- ein thematisch passendes Bild, direkt sichtbar, kein leerer Platzhalter
- bevorzugt Public Domain oder CC-lizenzierte Bilder von Wikimedia Commons
- historische oder faktische Bilder: Fotos, Gemälde oder zeitgenössische Abbildungen, kein Clipart
- Bildgröße im Dokument: ca. 260 x 152 px, Breite etwa 55 % der Seitenbreite
- darunter eine Bildunterschrift mit:
  - Bildtitel
  - Datierung
  - Urheber
  - Lizenz, z. B. Public Domain oder CC-Lizenz
  - Quelle, z. B. Wikimedia Commons

Rechte Spalte:
- QR-Code zu einem passenden deutschsprachigen Erklärvideo auf YouTube
- bevorzugte Kanäle: musstewissen Geschichte, sofatutor, Duden Learnattack, Terra X, MrWissen2go
- Videolänge idealerweise 3-12 Minuten
- QR-Code: 110 x 110 px, schwarz auf weiß, direkt eingebettet, 1 px Rand
- darunter Videotitel und der Hinweis: "QR-Code scannen"

### 2. Informationstext

Schreibe 3 Absätze.

Pflicht:
- Sprachniveau: [A2-B1 oder oben angegebene Zielgruppe]
- kurze Sätze, maximal 20 Wörter
- aktive Konstruktionen
- kein unnötiges Fachkauderwelsch
- Fremdwörter beim ersten Vorkommen erklären
- keine Abkürzungen ohne Erklärung
- Kernaussagen fett markieren
- positiver, altersgerechter und inklusiver Ton

### 3. Infokasten

Erstelle genau einen farbigen Infokasten.

Pflicht:
- Label, z. B. "Wichtig!", "Zitat:", "Wusstest du?"
- ein Kernsatz oder eine wichtige Zahl
- Farbe thematisch passend:
  - Warnung: Orange oder Gelb
  - Erfolg/Lösung: Grün
  - Zitat/Quelle: Blaugrün
  - Merksatz: Themenfarbe oder heller Akzent

### 4. Begriffe

Erstelle 7 Schlüsselbegriffe.

Pflicht:
- als 3-spaltiges Raster
- blaue Schrift \`#2E75B6\`
- hellblauer Hintergrund \`#EFF5FB\`
- kurze, verständliche Begriffe
- bei Bedarf mit sehr kurzer Erklärung in Klammern

### 5. Quiz

Erstelle mindestens 7 Multiple-Choice-Fragen.

Pflicht:
- je Frage 4 Optionen A-D
- vor jeder Option ein Antwortkästchen als \`O\`
- Fragetext in Dunkelblau \`#1F4E79\`
- Fragen in absteigender Schwierigkeit:
  - zuerst Fakten
  - dann Zusammenhänge
  - am Ende Urteile, Bewertungen oder begründete Entscheidungen
- keine Lösung direkt im Schülerblatt anzeigen

### 6. Transferaufgaben

Erstelle genau 2 Transferaufgaben.

Pflicht:
- beide in einem lila Rahmen
- Rahmenfarbe \`#6A0DAD\`
- heller lila Hintergrund
- jede Aufgabe mit Titel
- darunter ein kursiver Schreibimpuls
- je Aufgabe genau 7 Schreibzeilen
- Schreibzeilen als graue Unterstriche mit ca. 5 mm Abstand
- Aufgaben fordern Textproduktion, Meinungsbildung oder Gegenwartsvergleich

## Design-Vorgaben

Setze diese Vorgaben konsequent um:

- Format: A4
- einspaltiges Grundlayout
- Schrift: Arial
- Grundgröße: 11 pt
- Seitenränder: 2 cm
- jedes Thema erhält eine eigene Hauptfarbe als Hex-Code
- Themenfarbe für Banner, Überschriften, Kapitel-Subheader und Akzente nutzen
- Transferaufgaben immer lila \`#6A0DAD\`
- Begriffe immer hellblau \`#EFF5FB\` mit Schrift \`#2E75B6\`
- Quizfragen immer Dunkelblau \`#1F4E79\`
- ausreichend Weißraum
- druckfreundliche Farben, keine zu dunklen Vollflächen mit kleiner Schrift

## Qualitätskontrolle vor Ausgabe

Prüfe vor dem Speichern des Dokuments:

- Sind alle Themen/Kapitel vorhanden?
- Enthält jedes Kapitel eine Medienbox?
- Sind Bild und QR-Code in jeder Medienbox sichtbar?
- Gibt es zu jedem Bild Urheber, Datierung, Lizenz und Quelle?
- Hat jedes Kapitel genau 3 Absätze Informationstext?
- Hat jedes Kapitel genau einen Infokasten?
- Hat jedes Kapitel genau 7 Schlüsselbegriffe?
- Hat jedes Kapitel mindestens 7 Quizfragen?
- Hat jedes Kapitel genau 2 Transferaufgaben?
- Hat jede Transferaufgabe genau 7 Schreibzeilen?
- Ist das Sprachniveau konsistent?
- Ist die Reihenfolge Medienbox -> Informationstext -> Infokasten -> Begriffe -> Quiz -> Transferaufgaben eingehalten?
- Wurde die DOCX-Datei erfolgreich erzeugt und validiert?

## Ausgabe

Erstelle jetzt das vollständige Dokument.

Gib am Ende knapp aus:
- Dateiname
- Anzahl der Kapitel
- verwendete Bildquellen oder Hinweis auf Platzhalter
- verwendete Video-Links
- Ergebnis der Qualitätskontrolle

Beginne mit dem Node.js-Code und führe ihn aus, falls du in einer Umgebung mit Dateizugriff arbeitest. Keine bloße Skizze, keine Auslassungen.`,
      model: "ALLROUND",
      categorySlug: "unterrichtsvorbereitung",
      tags: ["Arbeitsblatt", "DOCX", "Materialerstellung", "Differenzierung", "Medien", "Quiz"],
    },
    {
      title: "Klärungs-Metaprompt vor der eigentlichen Antwort",
      slug: "klaerungs-metaprompt-annahmen-infos-denkfehler",
      description: "Hilft dabei, vor einer Antwort unausgesprochene Annahmen, fehlende Informationen und typische Denkfehler sichtbar zu machen, damit die anschließende Beratung konkreter und nützlicher wird.",
      content: `Beantworte meine eigentliche Frage noch nicht.

Deine erste Aufgabe ist, die Frage besser zu verstehen und meine Ausgangslage zu schärfen. Arbeite so, dass deine Rückmeldung für mich praktisch nützlich ist und sich auf eine konkrete Situation bezieht, nicht auf eine abstrakte Person.

## Meine Frage

[FRAGE EINFÜGEN]

## Kontext, falls vorhanden

[OPTIONAL: KONTEXT, ZIEL, ENTWURF, PROBLEM, MATERIAL ODER BISHERIGE IDEE EINFÜGEN]

## Vorgehen

Antworte zuerst nur mit den folgenden vier Teilen.

### 1. Unausgesprochene Annahmen

Nenne die Annahmen, die ich vermutlich treffe, aber nicht ausdrücklich genannt habe.

Formuliere sie konkret, zum Beispiel:
- "Du gehst wahrscheinlich davon aus, dass ..."
- "In deiner Frage steckt die Annahme, dass ..."
- "Unklar ist noch, ob ..."

### 2. Informationen, die deine Antwort wesentlich ändern würden

Nenne die Informationen, die du bräuchtest, um später wirklich passend zu antworten.

Beschränke dich auf Informationen, die deine spätere Antwort deutlich verändern würden. Keine unnötige Checkliste.

### 3. Häufigster Fehler bei dieser Art Frage

Nenne den häufigsten Fehler, den Menschen machen, wenn sie dir diese Art von Frage stellen.

Erkläre kurz, warum dieser Fehler zu ungenauen oder wenig hilfreichen Antworten führt.

### 4. Eine entscheidende Rückfrage

Stelle mir genau eine Frage.

Diese Frage soll die wichtigste Unklarheit klären und deine spätere Antwort deutlich verbessern.

Die Frage soll:
- konkret sein
- auf meine Situation zielen
- leicht beantwortbar sein
- nicht mehrere Fragen auf einmal enthalten

## Danach

Warte auf meine Antwort.

Erst nachdem ich geantwortet habe, gibst du das eigentliche Ergebnis.

## Stil

- Direkt und hilfreich
- Keine lange Theorie
- Keine endgültige Lösung vor meiner Antwort
- Keine Liste mit zehn Rückfragen
- Keine allgemeinen Ratschläge

## Beispiel für eine mögliche Eingabe

Meine Frage:
Wie kann ich diesen Lernpfad optimieren?

Kontext:
[Link, Beschreibung oder HTML/Lernpfad-Entwurf einfügen]`,
      model: "ALLROUND",
      categorySlug: "unterrichtsvorbereitung",
      tags: ["Metaprompt", "Klärung", "Beratung", "Annahmen", "Reflexion", "Optimierung"],
    },
    {
      title: "Deutschkorrektur Klasse 9 als druckfertiges PDF",
      slug: "deutschkorrektur-klasse-9-pdf-feedback",
      description: "Bewertet Schülertexte in Deutsch Klasse 9 kriterienorientiert nach ESA/MSA, erstellt konkretes Feedback und liefert ein druckfertiges HTML-PDF-Layout.",
      content: `## Rolle

Du bist eine erfahrene Deutschlehrkraft für die Sekundarstufe I und Expertin für die Korrektur von Leistungsnachweisen in Klasse 9. Du arbeitest kriterienorientiert, wertschätzend und fachlich präzise. Du machst keine witzigen Bemerkungen. Du erwähnst deine Herkunft nicht.

Dein Ziel ist eine Bewertung, die dem Schüler oder der Schülerin konkret zeigt:
- wo der Text gerade steht
- was bereits gelingt
- welcher nächste Entwicklungsschritt sinnvoll ist

## Wissensbasis und Standards

Arbeite auf Basis der Fachanforderungen Deutsch Sekundarstufe I für Schleswig-Holstein sowie der geltenden Rahmenvorgaben.

Berücksichtige die Anforderungsbereiche:
- AFB I: Reproduktion
- AFB II: Reorganisation und Transfer
- AFB III: Reflexion und Wertung

Unterscheide klar zwischen:
- ESA: Erster allgemeinbildender Schulabschluss
- MSA: Mittlerer Schulabschluss

## Pflichtangaben vor jeder Korrektur

Bevor du bewertest, prüfe, ob alle Angaben vorhanden sind.

Pflicht:
- Niveau: ESA oder MSA
- Sprachstand: Regelklasse / DaZ / B1
- Aufgabenstellung: Welche Aufgabe wurde bearbeitet?
- Textsorte: z. B. Erörterung, Analyse, Stellungnahme, Leserbrief, Charakterisierung
- Schülername: [NAME]
- Schülertext: vollständiger Text, als Foto-Upload oder abgetippt

Wenn eine Pflichtangabe fehlt:
- Bewerte noch nicht.
- Frage gezielt nur nach den fehlenden Angaben.
- Beginne erst mit der Korrektur, wenn alle Pflichtangaben vorhanden sind.

## Eingaben

Niveau:
[ESA / MSA]

Sprachstand:
[Regelklasse / DaZ / B1]

Aufgabenstellung:
[AUFGABENSTELLUNG EINFÜGEN]

Textsorte:
[TEXTSORTE EINFÜGEN]

Schülername:
[NAME EINFÜGEN]

Schülertext:
[VOLLSTÄNDIGEN TEXT EINFÜGEN ODER FOTO HOCHLADEN]

## Bewertungskriterien und Gewichtung

### 1. Inhaltliche Leistung: 50 %

Bewerte:
- Erfassung der Aufgabenstellung
- Textverständnis
- Argumentation
- Gedankenentwicklung
- Belege aus dem Text

ESA:
- Ist die Kernaussage erfasst?
- Wurde die Aufgabe sinnvoll bearbeitet?

MSA:
- Wird differenziert argumentiert?
- Wird reflektiert und bewertet?
- Werden Gedanken nachvollziehbar entfaltet?

### 2. Sprachliche Leistung: 30 %

Bewerte:
- Ausdrucksvermögen
- Satzbau
- Wortschatz
- Textkohärenz
- Stil

Bei DaZ/B1:
- Kommunikative Klarheit hat Vorrang vor sprachlicher Eleganz.
- Bewerte verständlich, fair und entwicklungsorientiert.

### 3. Sprachrichtigkeit: 20 %

Bewerte:
- Orthografie
- Grammatik
- Interpunktion

Bei DaZ/B1:
- Kommentiere systematische Fehler differenziert.
- Beispiele: Artikel, Kasusendungen, Verbformen, Satzstellung.
- Werte nicht pauschal ab.

## Kompetenzstandards für den Schüler

Formuliere nach der Punkteübersicht eine kompetenzorientierte Rückmeldung in einfacher, ermutigender Sprache.

Nutze genau dieses Schema:

**Was du schon gut kannst (Mindeststandard):**
[Konkret benennen, was gelungen ist. 1-2 Sätze.]

**Was du als nächstes üben solltest (Regelstandard):**
[Ein gezielter, umsetzbarer Hinweis.]

**Was dich zum Experten macht (Expertenstandard):**
[Ein anspruchsvoller Entwicklungsschritt.]

Regeln:
- immer direkt an den Schüler oder die Schülerin schreiben
- Du-Form
- kurze Sätze
- keine unnötigen Fachbegriffe
- maximal 5 Sätze insgesamt

## Ausgabeziel

Erstelle das komplette Feedback als druckfertiges, ansprechend gestaltetes PDF-Layout.

Wichtig:
- Gib kein bloßes Fließtext-Feedback im Chat aus.
- Erstelle ein vollständiges HTML-Dokument mit eingebettetem CSS.
- Das HTML soll im Browser über "Datei -> Drucken -> Als PDF speichern" als PDF gespeichert werden können.
- Gib das HTML als Artifact oder vollständige HTML-Datei aus.

## PDF-Layout-Vorgaben

Seitenformat:
- DIN A4
- Ränder: 2 cm
- Fließtext: Georgia oder serif
- Labels und Tabellen: Arial oder sans-serif

### Kopfzeile

Farbiger Balken:
- Hintergrundfarbe: \`#1d4ed8\`
- Schriftfarbe: weiß

Inhalt:
- links: "Deutschkorrektur Klasse 9" + Textsorte
- rechts: Schuljahr / Datum, automatisch via JavaScript
- darunter: Name des Schülers / der Schülerin
- daneben oder darunter: Notenvorschlag als große, hervorgehobene Ziffer

### Abschnitt 1: Punkteübersicht

Tabelle:
- Header-Hintergrund: \`#1d4ed8\`
- Header-Schrift: weiß
- Zebrastreifen: hellgrau / weiß
- Gesamtzeile fett

Spalten:
- Bereich
- Gewichtung
- Erreichte Punkte
- Bewertung

Tabelle:

| Bereich | Gewichtung | Erreichte Punkte | Bewertung |
|---|---:|---:|---|
| Inhaltliche Leistung | 50 % | [X / max] | [kurzes Urteil] |
| Sprachliche Leistung | 30 % | [X / max] | [kurzes Urteil] |
| Sprachrichtigkeit | 20 % | [X / max] | [kurzes Urteil] |
| Gesamt | 100 % | [X / max] | [Gesamturteil] |

### Abschnitt 2: Sternchen und Wunsch

Zwei nebeneinanderliegende Cards mit Flexbox.

Linke Card:
- Icon: ⭐
- grüner linker Rahmen: \`#16a34a\`
- Inhalt: zwei konkrete Sternchen, also textbezogenes Lob

Rechte Card:
- Icon: 💡
- blauer linker Rahmen: \`#1d4ed8\`
- Inhalt:
  - ein Wunsch
  - wichtigster nächster Schritt
  - KI-Trainingstipp als wörtlicher Muster-Prompt, den der Schüler direkt kopieren kann

### Abschnitt 3: Kompetenzstandards

Drei horizontale Blöcke:

Mindeststandard:
- hellgrüner Hintergrund: \`#dcfce7\`
- grüner linker Rand
- fettes Label
- Schülertext in normaler Schrift, Du-Form

Regelstandard:
- hellblauer Hintergrund: \`#dbeafe\`
- blauer linker Rand
- fettes Label
- Schülertext in normaler Schrift, Du-Form

Expertenstandard:
- hellorangener Hintergrund: \`#ffedd5\`
- oranger linker Rand
- fettes Label
- Schülertext in normaler Schrift, Du-Form

### Abschnitt 4: Originaltext

Layout:
- grauer Hintergrund: \`#f3f4f6\`
- Monospace-Schrift
- leicht eingerückt
- vollständiger Originaltext

Darunter fester Hinweis mit klickbarem Link:

"Überarbeite deinen Text jetzt selbst: Öffne https://languagetool.org/de, kopiere deinen Text hinein und schau dir jeden markierten Fehler einzeln an. Versuche zu verstehen, warum es ein Fehler ist — nicht nur, was richtig wäre."

### Fußzeile

- grauer Trennstrich
- kleiner Text:
"Erstellt mit KI-Unterstützung — fachliche Verantwortung liegt bei der Lehrkraft."

### Print-CSS

Nutze \`@media print\`.

Pflicht:
- Header darf nicht abgeschnitten werden.
- Seitenumbruch vor dem Originaltext-Abschnitt.
- Hintergrundfarben beim Drucken erzwingen:
  - \`-webkit-print-color-adjust: exact;\`
  - \`print-color-adjust: exact;\`

## Inhaltliche Abschnitte im PDF

Halte diese Reihenfolge exakt ein:

1. Tabellarische Punkteübersicht
2. ⭐ Zwei Sternchen, also konkretes Lob
3. 💡 Ein Wunsch, also wichtigster nächster Schritt mit KI-Trainingstipp
4. Kompetenzstandard-Rückmeldung
5. Notenvorschlag
6. Originaltext mit Korrekturhinweis

## Notenvorschlag

Gib eine Note als Ziffer von 1 bis 6.

Optional:
- Plus oder Minus, z. B. 2- oder 4+

Darstellung:
- groß
- hervorgehoben
- kurze Begründung in 1-2 Sätzen

## Tonalität

Schreibe authentisch, motivierend, klar und konstruktiv.

Wirke wie ein Mentor, nicht wie ein Korrekturautomat.

Regeln:
- kein übertriebenes Lob
- kein Defizit-Fokus
- keine witzigen Bemerkungen
- keine Bloßstellung
- konkrete Beobachtungen statt Floskeln
- klare nächste Schritte

Der Schüler soll nach dem Lesen denken:
"Okay, ich weiß jetzt, was ich tun kann."

## Ausgabe

Wenn alle Pflichtangaben vorhanden sind:
- Erstelle direkt das vollständige HTML-Dokument.
- Beginne mit \`<!DOCTYPE html>\`.
- Keine Vorbemerkung.
- Keine zusätzliche Erklärung außerhalb des HTML.

Wenn Pflichtangaben fehlen:
- Frage nur nach den fehlenden Angaben.
- Erstelle noch kein HTML.`,
      model: "ALLROUND",
      categorySlug: "feedback-beurteilung",
      tags: ["Deutsch", "Korrektur", "Klasse 9", "PDF", "Feedback", "ESA", "MSA"],
    },
    {
      title: "NotebookLM-Metaprompt für Mathe-Aufgabenkarten",
      slug: "notebooklm-metaprompt-mathe-aufgabenkarten",
      description: "Erstellt aus Matheaufgaben einen konkreten NotebookLM-Prompt für eine farbenfrohe Präsentation mit genau einer Aufgabenfolie pro Aufgabe.",
      content: `Du bist Promptdesigner für NotebookLM und Spezialist für visuelle Lernmaterialien im Mathematikunterricht.

## Ziel

Erstelle aus den in NotebookLM hinterlegten Quellen einen konkreten Präsentationsprompt. Dieser Prompt soll NotebookLM anweisen, eine Präsentation mit Mathe-Aufgabenkarten zu erstellen.

Die Quellen enthalten bereits die Aufgabenstellungen. Deine Aufgabe ist nicht, die Aufgaben zu lösen. Deine Aufgabe ist, einen präzisen Prompt für die Präsentationserstellung zu formulieren.

## Workflow

1. Die Matheaufgaben wurden vorher mit einem beliebigen KI-Modell erstellt.
2. Diese Aufgaben wurden als Quelle in NotebookLM eingefügt.
3. Nutze die Quellen, um die Anzahl der Aufgaben und die Alltagssituationen zu erkennen.
4. Erstelle daraus einen fertigen NotebookLM-Prompt für die Präsentation.
5. Der fertige Prompt soll direkt in NotebookLM nutzbar sein.

## Eingaben

Anzahl der Aufgaben/Folien:
[X oder "aus den Quellen ableiten"]

Klassenstufe:
[KLASSE]

Thema:
[z. B. Prozentrechnung, lineare Funktionen, Flächen, Terme, Brüche]

Gewünschter Stil:
farbenfroh, motivierend, energetisch, jugendgerecht, App-Oberfläche oder Game-Screen

## Aufgabe

Formuliere einen konkreten Prompt für NotebookLM, der folgende Vorgaben exakt enthält.

## Matheaufgabenkarten-Basis

Erstelle eine Präsentation mit genau [X] Folien. Erstelle genau eine Folie pro Aufgabe.

Keine Titelfolie. Keine Abschlussfolie. Nur die Aufgabenfolien.

## Design

Das Design ist farbenfroh, motivierend, energetisch und jugendgerecht.

Die Folien sollen wirken wie:
- eine moderne App-Oberfläche
- ein Game-Screen
- ein Lernspiel

Sie sollen nicht wirken wie:
- ein klassisches Schulbuch
- ein Arbeitsblatt
- eine nüchterne Tafelanschrift

Nutze kräftige Akzentfarben, moderne Schriften und eine klare Struktur. Jede Folie erhält eine andere Farbakzentfarbe. Das Design soll Lust auf die Aufgabe machen.

## Layout jeder Folie

Jede Folie folgt exakt diesem Aufbau:

Links, ca. 55 Prozent der Folie:
- Aufgabentext
- Folientitel als farbiger Akzent oben
- Aufgabenstellung vollständig und unverändert
- Schülerbehauptung als visuell hervorgehobene Sprechblase oder Zitatbox

Rechts, ca. 45 Prozent der Folie:
- kontextuelle Illustration zur Alltagssituation
- lebendig
- farbenfroh
- passend zum Thema
- kein Rechenweg
- keine Lösung

## Illustrationen

Ergänze im finalen NotebookLM-Prompt für jede Aufgabe eine eigene Folienvorgabe.

Nutze dieses Format:

Folie [interne Nummer nur für die Promptstruktur, nicht auf der Folie anzeigen]
- Titel: [kurzer, motivierender Folientitel ohne Aufgabennummer]
- Illustration: [exakte Beschreibung der Alltagsszene, passend zur Aufgabe]
- Sprechblase: [Schülerbehauptung aus der Aufgabe exakt oder sinngemäß, neutral formuliert]

Wichtig:
- Die interne Foliennummer dient nur der Organisation im Prompt.
- Auf der Folie selbst darf keine Aufgabennummer erscheinen.
- Die Illustration zeigt die Situation, nicht die Lösung.
- Gesuchte Größen oder offene Entscheidungen werden nur als Fragezeichen dargestellt.

## Absolute Verbote für alle Folien

Diese Verbote müssen im finalen NotebookLM-Prompt vollständig enthalten sein:

- Keine Aufgabennummern im Folientitel oder auf der Folie.
- Keine Klammerzusätze im Titel.
- Keine methodischen Hinweise im Titel.
- Keine Rechenwege.
- Keine Formeln, die nicht bereits in der Aufgabenstellung stehen.
- Keine Zwischenergebnisse.
- Keine Lösungen.
- Keine Antworten.
- Keine Hinweise auf richtig oder falsch.
- Keine Hinweise wie "Tipp:" oder "Denk daran:".
- Keine berechneten Werte, die in der Aufgabe gesucht werden.
- Keine unnötigen Beschriftungen außerhalb der Aufgabenstellung.
- Die Schülerbehauptungen erscheinen immer als neutrale Sprechblase.
- Schülerbehauptungen werden nie farblich als richtig oder falsch markiert.

## Inhaltliche Genauigkeit

Alle Zahlen, Angaben und Einheiten aus der Aufgabenstellung müssen korrekt und vollständig auf der Folie erscheinen.

Die Aufgabenstellung darf nicht gekürzt, umformuliert oder vereinfacht werden.

Gesuchte Größen und offene Entscheidungen werden ausschließlich als Fragezeichen dargestellt.

Wenn eine Aufgabe eine Schülerbehauptung enthält, muss diese als neutrale Sprechblase oder Zitatbox erscheinen.

## Ausgabeformat

Gib nur den fertigen NotebookLM-Prompt aus.

Der Prompt muss so formuliert sein, dass er direkt in NotebookLM eingefügt werden kann.

Keine Erklärung des Workflows. Keine Kommentare. Keine Analyse. Nur der endgültige Präsentationsprompt.`,
      model: "NOTEBOOKLM",
      categorySlug: "unterrichtsvorbereitung",
      tags: ["NotebookLM", "Mathe", "Präsentation", "Aufgabenkarten", "Metaprompt", "Design"],
    },
    {
      title: "Interaktiver Lernpfad als HTML-Datei",
      slug: "manga-lernpfad-html-gamification",
      description: "Erstellt einen vollständigen Single-File-HTML-Lernpfad mit Kapiteln, Quiz, XP-System, Sounds, Konfetti und Freischaltlogik.",
      content: `Du bist Fachdidaktiker, UX-Designer und Frontend-Entwickler. Erstelle einen vollständigen, interaktiven HTML-Lernpfad als Single-File im Gamification-Stil. Die Datei muss direkt im Browser spielbar sein, ohne Server, ohne Build-Step und ohne Login.

## Thema und Inhalt

Thema / Fach:
[THEMA / FACH EINTRAGEN]

Kapitel:
[Kapitel 1: Titel | Kapitel 2: Titel | Kapitel 3: Titel | ...]

Zielgruppe:
- Klasse: [JAHRGANGSSTUFE]
- Sprachniveau: [z. B. A2-B1 für DaZ]

Maskottchen:
- Name: [z. B. Koko / Leo / Maya]
- Charakter: [z. B. neugierig, mutig, verspielt]
- Stil-Modifikation: [z. B. Chibi/Manga, Roboter, Tierfigur, Superheldin, Forscherfigur]

## Pflicht-Screens

Baue genau diese Screens in dieser Reihenfolge. Alle Screens sind \`<section>\`-Elemente. Nur der aktive Screen ist sichtbar, alle anderen sind \`hidden\`.

### 1. Start-Screen

Pflicht:
- animiertes, bouncendes Maskottchen
- Begrüßungstext im Ich-Stil des Maskottchens
- Namenseingabe-Feld, maximal 15 Zeichen
- großer Start-Button

### 2. Karten-Screen: Lernpfad-Übersicht

Pflicht:
- Sprechblase des Maskottchens mit Tipp
- Grid mit allen Kapiteln als Stationskarten
- Kapitel 1 ist sofort spielbar
- alle weiteren Kapitel sind gesperrt
- gesperrte Kapitel zeigen ein Schloss-Icon
- jede Karte zeigt:
  - Kapitel-Badge
  - passendes Lucide-Icon
  - Titel
  - Kurzbeschreibung, maximal 5 Wörter
  - Status-Badge
  - XP-Belohnung

### 3. Kapitel-Screen: Lern- und Quizansicht

Pflicht:
- Zurück-zur-Karte-Button oben links
- Zwei-Spalten-Layout: links 8 Spalten, rechts 4 Spalten
- links Inhaltsbereich mit Tab-Switcher: Lernen / Quiz
- rechts Maskottchen-Box und Wortschatz-Kiste

### 4. End-Screen

Pflicht:
- Sieges-Animation mit Konfetti
- Zeitreise-Urkunde oder thematisch passende Urkunde
- Spielername
- XP-Gesamt
- erreichtes Level
- Nochmal-Button

## Lerninhalt pro Kapitel

Jedes Kapitel muss vollständig im \`gameDatabase\`-Objekt enthalten sein.

Pflicht pro Kapitel:

- \`learnText\` als HTML-String
- mindestens 3 Absätze Fließtext
- Sprachniveau A2-B1 oder passend zur Eingabe
- kurze Sätze, maximal 20 Wörter
- Schlüsselbegriffe fett markieren
- mindestens 1 visuelles Inhaltselement direkt im Text:
  - Infobox mit Farbe, Icon und Label
  - oder Feature-Grid mit Icon und Kurztext, 2-4 Spalten
  - oder Zeitstrahl
  - oder vergleichende Tabelle
- farbige Abschnitt-Header, z. B. Indigo, Rose, Pink, Emerald
- Wortschatz-Kiste mit 4-6 Begriffen
- jede Erklärung maximal 2 Sätze
- Wortschatz-Begriffe per Klick aufklappbar
- \`kokoNormal\`: motivierender Einleitungstext, 1 Satz, Ich-Perspektive
- \`kokoHappy\`: Glückwunschtext nach Abschluss, 1 Satz, Ich-Perspektive

## Quiz pro Kapitel

Pflicht:
- genau 3 Fragen pro Kapitel
- alle 3 Fragen müssen richtig beantwortet werden, um das nächste Kapitel freizuschalten
- je Frage genau 3 Antwortoptionen
- genau 1 richtige Antwort
- 2 plausibel falsche Antworten, keine absurden Distraktoren
- Schwierigkeitsverteilung:
  - Frage 1: Faktenwissen
  - Frage 2: Zusammenhang
  - Frage 3: Urteil oder Übertragung

Sofortfeedback:
- Richtig: grün, Haken-Symbol, Ton, +50 XP
- Falsch: rot, Kreuz-Symbol, Fehlerton, Retry nach 1,5 Sekunden
- keine Strafe bei falscher Antwort
- keine dauerhafte Sperrung

Kapitelabschluss:
- +100 XP Bonus nach allen 3 richtigen Antworten
- Konfetti
- Koko-Happy-Text
- Alert mit Freischalt-Info zum nächsten Kapitel

## Gamification-System

Implementiere alles vollständig:

- XP-System: +50 XP pro richtiger Antwort
- +100 XP pro abgeschlossenem Kapitel
- Level-Up alle 300 XP
- Level-Up-Modal:
  - Overlay
  - Glückwunsch
  - aktuelles Level
  - Schließen-Button
- Header-Bar:
  - sticky
  - Maskottchen-Avatar links
  - Spielername-Badge
  - XP-Anzeige mit Level-Badge
  - Karte-öffnen-Button, erscheint nach Start
- Freischaltlogik:
  - Kapitel N+1 wird erst nach Abschluss von Kapitel N freigeschaltet
  - gesperrte Karten: grau, \`opacity-60\`, \`cursor-not-allowed\`, Schloss-Icon
- Konfetti:
  - Kapitelabschluss: 100 Partikel, spread 70
  - Spielende: 150 Partikel, spread 80

## Sound-Engine

Nutze ausschließlich die Web Audio API. Keine externen Audiodateien.

Pflichtsounds:
- \`correct\`: Triangle C5 -> E5 -> G5, Dauer 0,4 s
- \`wrong\`: Sawtooth A3 fallend, Dauer 0,3 s
- \`level\`: Sine-Skala G4 -> C6, Dauer 0,6 s

## Gamification-Designsystem

Setze diese Stilregeln konsequent um:

- Karten und Panels: \`border: 3px solid #1e293b\`
- Schatten: \`box-shadow: 4px 4px 0px 0px #1e293b\`
- Hover: \`translate(-2px, -2px)\` und Schatten 6px
- Active: \`translate(2px, 2px)\` und Schatten 2px
- Abrundung:
  - Cards: \`rounded-2xl\`
  - Panels: \`rounded-3xl\`
  - Avatare: \`rounded-full\`
- Sprechblasen-Schweif:
  - CSS \`::after\`-Pseudoelement unten links
  - \`border-width: 10px 10px 0\`

## Design-Vorgaben

Pflicht:
- Fonts per Google Fonts:
  - Fredoka für Überschriften, h1-h4 und \`.font-playful\`
  - Nunito für Body
- Tailwind via CDN für Utility-Klassen
- Lucide Icons via \`unpkg.com/lucide@latest\`
- \`lucide.createIcons()\` nach jedem dynamischen DOM-Update aufrufen
- canvas-confetti via \`cdn.jsdelivr.net/npm/canvas-confetti@1.6.0\`
- Hintergrund hell: \`#FFF9F2\`
- Dark Mode: \`dark:bg-slate-900\`, \`dark:text-slate-100\` und passende Dark-Klassen überall
- Primärfarbe Maskottchen/Akzent: Pink, z. B. \`pink-400\`
- weitere Themenfarben: Amber, Indigo, Emerald, Rose

Maskottchen:
- SVG im Chibi-Stil
- Stil-Modifikation aus der Eingabe sichtbar umsetzen, z. B. Chibi/Manga, Roboter, Tierfigur, Superheldin oder Forscherfigur
- Haarfarbe Pink \`#FF8DA1\`
- Haut \`#FFE0BD\`
- Augen \`#334155\`
- Wangen elliptisch rosa
- Lächeln als \`path\`
- mindestens 3 Größen:
  - Header-Mini
  - Startscreen-Full-Body
  - Companion-Medium

## Technische Pflicht-Anforderungen

Single-File HTML:
- alles in einer Datei
- keine externe CSS-Datei
- kein Build-Step
- kein Server
- kein Login
- kein localStorage nötig, reiner In-Memory-State reicht

CDN-Einbindungen:
- \`https://cdn.tailwindcss.com\`
- \`https://unpkg.com/lucide@latest\`
- \`https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js\`
- Google Fonts

Screen-System:
- alle Screens als \`<section>\`
- Funktion \`showScreen(id)\` verwaltet Sichtbarkeit

State-Objekt:
\`\`\`js
userState = {
  name: "",
  xp: 0,
  level: 1,
  unlockedChapters: [1],
  quizAnswers: {}
}
\`\`\`

\`gameDatabase\`:
- numerische Keys: \`1\`, \`2\`, \`3\` ...
- je Kapitel:
  - \`id\`
  - \`title\`
  - \`badge\`
  - \`icon\`
  - \`summary\`
  - \`themeColor\`
  - \`learnText\`
  - \`glossary\`
  - \`quiz\`
  - \`kokoNormal\`
  - \`kokoHappy\`

Tab-Switcher:
- Funktion \`switchTab('learn' | 'quiz')\`
- Lernpanel und Quizpanel umschalten
- Styling des aktiven Tabs aktualisieren

Quiz-Render:
- Fragen dynamisch per JavaScript aus \`gameDatabase\` rendern
- keine hartcodierten Quizfragen im HTML

Freischaltung:
- \`checkChapterVictory(chapterId)\` nach jeder richtigen Antwort aufrufen
- \`updateMapUI()\` synchronisiert Karten-Optik mit \`userState.unlockedChapters\`

Restart:
- vollständiges Reset aller State-Werte
- DOM vollständig aktualisieren
- zurück zum Start-Screen

## Qualitätskontrolle vor Ausgabe

Prüfe vor der finalen Ausgabe:

- Sind alle Kapitel aus der Eingabe im \`gameDatabase\` enthalten?
- Hat jedes Kapitel \`learnText\`, \`glossary\`, \`quiz\`, \`kokoNormal\`, \`kokoHappy\`?
- Hat jedes Kapitel genau 3 Quizfragen?
- Hat jede Frage genau 3 Optionen und genau eine richtige Lösung?
- Ist Kapitel 1 offen und sind alle weiteren Kapitel zunächst gesperrt?
- Funktioniert die Freischaltlogik?
- Funktionieren Sounds ohne externe Audiodateien?
- Funktioniert Konfetti bei Kapitelabschluss und Ende?
- Ist der Dark Mode vollständig?
- Wird \`lucide.createIcons()\` nach dynamischen DOM-Updates aufgerufen?
- Ist die Datei direkt im Browser ohne Server öffnbar?
- Gibt es keine CORS-abhängigen lokalen Ressourcen?

## Ausgabe

Liefere die komplette HTML-Datei. Kein Pseudocode. Keine Auslassungen. Beginne direkt mit:

\`\`\`html
<!DOCTYPE html>
\`\`\``,
      model: "ALLROUND",
      categorySlug: "unterrichtsvorbereitung",
      tags: ["HTML", "Lernpfad", "Gamification", "Maskottchen", "Quiz", "DaZ"],
    },
    {
      title: "Kahoot-Quiz aus Text als Excel-Datei erstellen",
      slug: "kahoot-quiz-aus-text-xlsx",
      description: "Erstellt aus einem Text ein Kahoot-kompatibles Multiple-Choice-Quiz als Excel-Datei mit vier Antwortmöglichkeiten, Zeitlimit und markierter richtiger Antwort.",
      content: `Du bist eine erfahrene Lehrkraft und erstellst aus einem Transkript, Sachtext, literarischen Textauszug oder einer Buchseite ein Multiple-Choice-Quiz für Kahoot.

## Eingabe

Textgrundlage:
[TEXT, TRANSKRIPT ODER BUCHSEITE EINFÜGEN]

Zielgruppe:
- Klasse: [z. B. 7]
- Schulform: [z. B. Gymnasium]
- Fach/Thema: [optional einfügen]
- Anzahl der Fragen: [z. B. 10]

## Aufgabe

Erstelle daraus ein Kahoot-kompatibles Quiz als Excel-Datei (.xlsx).

## Inhaltliche Vorgaben

- Erstelle genau [ANZAHL] Fragen.
- Jede Frage hat genau vier Antwortmöglichkeiten.
- Genau eine Antwort ist korrekt.
- Keine Mehrfachauswahl.
- Zeitlimit pro Frage: 20 Sekunden.
- Sprache: altersgerecht für [KLASSE] an [SCHULFORM].
- Fragen sollen zentrale Inhalte des Textes prüfen.
- Nutze eine Mischung aus:
  - einfachen Verständnisfragen
  - Fragen zu Zusammenhängen
  - wenigen Transfer- oder Deutungsfragen
- Vermeide Fangfragen, doppelte Verneinungen und unnötig komplizierte Formulierungen.
- Die falschen Antworten sollen plausibel, aber eindeutig falsch sein.
- Jede Frage muss allein verständlich sein.

## Excel-Struktur

Erstelle eine Tabelle mit exakt diesen Spaltennamen:

Question, Answer 1, Answer 2, Answer 3, Answer 4, Time limit (sec), Correct answer(s)

Pflichtformat:
- \`Question\`: Fragetext
- \`Answer 1\` bis \`Answer 4\`: vier Antwortmöglichkeiten
- \`Time limit (sec)\`: immer \`20\`
- \`Correct answer(s)\`: Zahl von \`1\` bis \`4\`, passend zur richtigen Antwort

Beispiel für \`Correct answer(s)\`:
- Wenn \`Answer 2\` richtig ist, steht dort \`2\`.

## Technische Ausgabe

Erstelle am Ende nur die fertige Excel-Datei \`.xlsx\` zum Download.

Wenn du in einer Umgebung mit Dateizugriff arbeitest:
- Nutze eine geeignete Excel-Bibliothek, z. B. \`xlsx\` oder \`exceljs\`.
- Speichere die Datei als \`kahoot_quiz.xlsx\`.
- Validiere vor der Ausgabe:
  - exakt [ANZAHL] Datenzeilen
  - exakt 7 Spalten
  - jede Frage hat vier Antworten
  - \`Time limit (sec)\` ist überall 20
  - \`Correct answer(s)\` enthält nur 1, 2, 3 oder 4
  - keine leeren Zellen

Gib keine zusätzlichen Erklärtexte aus. Die finale Ausgabe ist nur die Datei.`,
      model: "ALLROUND",
      categorySlug: "unterrichtsvorbereitung",
      tags: ["Kahoot", "Quiz", "Excel", "XLSX", "Textverständnis", "Import"],
    },
    {
      title: "Fokussiertes Schreibfeedback nach Hattie",
      slug: "schreibfeedback-hattie-feedup-feedback-feedforward",
      description: "Erstellt für Schülertexte in Deutsch ein kurzes, motivierendes Feedback nach Feed-up, Feedback und Feedforward mit nur einem zentralen Entwicklungsschwerpunkt.",
      content: `Du bist eine erfahrene Deutschlehrkraft für die Sekundarstufe I (Klassen 5 bis 10) und ein Schreibcoach. Du arbeitest mit evidenzbasierten Feedback-Methoden, insbesondere mit dem Feed-up/Feedback/Feedforward-Modell nach John Hattie.

Dein Ziel: Erstelle zu einer Textproduktion ein gezieltes, motivierendes Feedback. Konzentriere dich auf den nächsten wichtigen Entwicklungsschritt. Überfordere die Schülerin oder den Schüler nicht mit Korrekturen zu allen Kriterien gleichzeitig.

## Eingaben

Erwartungshorizont / Bewertungskriterien:
[KRITERIEN EINFÜGEN ODER GROB ZUSAMMENFASSEN]

Klassenstufe:
[5 / 6 / 7 / 8 / 9 / 10]

Textsorte:
[z. B. spannendes Erzählen, Bericht, Beschreibung, Inhaltsangabe, Erörterung]

Notizen der Lehrkraft und bisherige Entwicklung:
[1-3 SÄTZE EINFÜGEN, z. B. "Mia hat tolle Ideen, aber ihr fehlt der rote Faden. Sie springt in den Zeiten. Sie ist frustriert, wenn zu viel auf einmal kritisiert wird."]

Text der Schülerin / des Schülers:
[TEXT EINFÜGEN - oder weglassen, wenn nur anhand von Notizen gearbeitet wird]

## Zuerst still analysieren

Bearbeite diese Analyse nur intern. Nimm sie nicht direkt in die Ausgabe auf.

1. Analysiere die Eingaben.
2. Identifiziere genau einen wichtigsten Entwicklungsschwerpunkt.
   Beispiele: Struktur, Textsortenmerkmale, roter Faden, Argumentationslogik, Spannungsaufbau, Sachlichkeit.
3. Wähle maximal zwei untergeordnete Aspekte, die im Moment nur kurz erwähnt werden.
   Beispiele: Ausdruck, Zeitform, Zeichensetzung, Rechtschreibung.
4. Entscheide bewusst, welche Kriterien vorerst ignoriert werden, um kognitive Überlastung zu vermeiden.
   Häufig sind das Grammatik oder Rechtschreibung, wenn der Text zunächst strukturelle Hilfe braucht.
5. Definiere einen Kompetenzanker:
   Wie sieht "kompetent" für diesen Hauptschwerpunkt in dieser Klassenstufe und bei dieser Textsorte konkret aus?
6. Prüfe, ob ein Sonderfall vorliegt:
   Wenn die Schülerin oder der Schüler den Erwartungshorizont bereits sicher erfüllt, formuliere eine anspruchsvollere Level-Up-Herausforderung.

## Ausgabeformat

Verwende genau diese Struktur.

### TEIL 1: Strategie-Notiz für die Lehrkraft

Klassenstufe & Textsorte:
[X] | [X]

Primäres Lernziel:
[1-2 Sätze zum pädagogischen Fokus. Benenne den einen Entwicklungsschwerpunkt klar.]

Zurückgestellte Kriterien (Fokus-Schutz):
[Was wird bewusst gerade nicht oder nur am Rand bewertet? Begründe kurz, warum.]

Kompetenzanker:
[1-2 Sätze: Was wird für diese Altersgruppe und diese Textsorte konkret erwartet?]

### TEIL 2: Direktes Schülerfeedback

Schreibe altersgerecht, motivierend und in der DU-Form. Nutze das Hattie-Modell.

Feed-up (Unser Ziel):
[Übersetze den Kompetenzanker in einen schülerverständlichen Satz. Mache transparent, was bei dieser Textsorte und Klassenstufe erwartet wird. Beispiel: "Unser Ziel beim Erörtern ist es, dass du deine Meinung klar zeigst und mit passenden Gründen stützt."]

Feedback (Wo stehst du gerade?):
[Beginne mit 1-2 Sätzen zu echten Stärken. Erkläre danach wertschätzend, wo der Text bezogen auf das Hauptziel noch Lücken hat. Konzentriere dich nur auf das primäre Lernziel.]

Feedforward (Dein nächster Schritt):
[Gib einen konkreten, machbaren Tipp, eine Strategie oder eine kleine Übung für den nächsten Text. Der Schritt soll direkt umsetzbar sein.]

Kurzer Check für das nächste Mal:
[Maximal ein Satz zu den untergeordneten Aspekten, z. B. Zeichensetzung oder Zeitform. Nicht vertiefen.]

## Stilregeln

- Schreibe klar, warm und ermutigend.
- Vermeide pauschale Lobfloskeln.
- Nenne konkrete Beobachtungen aus Text oder Lehrkraftnotizen.
- Kritisiere nicht alles gleichzeitig.
- Bleibe beim primären Lernziel.
- Formuliere Feedforward so, dass die Schülerin oder der Schüler sofort weiß, was beim nächsten Text zu tun ist.
- Verwende keine Noten, Punkte oder Prozentwerte, außer sie werden ausdrücklich verlangt.
- Wenn der Schülertext fehlt, arbeite transparent mit den Lehrkraftnotizen und formuliere vorsichtig: "Nach den Notizen wirkt es so, als ..."

## Sonderfall: sehr starke Texte

Wenn die Eingaben zeigen, dass der Erwartungshorizont bereits sicher erfüllt ist:

- Benenne kurz, dass das Grundziel erreicht ist.
- Setze ein neues anspruchsvolles Ziel.
- Formuliere das Schülerfeedback als Level-Up-Herausforderung.
- Beispiele für Level-Up-Ziele:
  - stilistische Finesse
  - Leserlenkung
  - stärkere Argumentationsverknüpfung
  - bewusst eingesetzte sprachliche Mittel
  - präzisere Übergänge`,
      model: "ALLROUND",
      categorySlug: "feedback-beurteilung",
      tags: ["Feedback", "Deutsch", "Schreiben", "Hattie", "Feedforward", "Sek I"],
    },
    {
      title: "Elternbrief verfassen – Klassen- oder Schulveranstaltung",
      slug: "elternbrief-veranstaltung",
      description: "Erstellt einen professionellen Elternbrief für schulische Veranstaltungen",
      content: `Schreibe einen Elternbrief für folgende Veranstaltung:

Veranstaltung: [NAME DER VERANSTALTUNG]
Datum/Uhrzeit: [ANGABE]
Ort: [ORT]
Klasse: [KLASSE]
Schule: [SCHULNAME]
Besonderheiten/Infos: [ZUSÄTZLICHE INFORMATIONEN]
Rückmeldung bis: [DATUM] (falls nötig: [JA/NEIN])

Der Brief soll:
- Freundlich und einladend sein
- Alle wichtigen Infos klar strukturieren
- Eine Rückmeldung-/Anmeldeabschnitt enthalten (falls nötig)
- Rechtlich korrekte Formulierungen verwenden
- In einfacher, verständlicher Sprache geschrieben sein`,
      model: "ALLROUND",
      categorySlug: "elternkommunikation",
      tags: ["Eltern", "Kommunikation", "Brief"],
    },
  ];

  for (const promptData of examplePrompts) {
    const { categorySlug, tags, ...data } = promptData;
    const category = categories.find((c) => c.slug === categorySlug);
    if (!category) continue;

    await prisma.prompt.upsert({
      where: { slug: data.slug },
      update: {
        ...data,
        tags: JSON.stringify(tags),
        published: true,
        authorId: admin.id,
        categoryId: category.id,
      },
      create: {
        ...data,
        tags: JSON.stringify(tags),
        published: true,
        authorId: admin.id,
        categoryId: category.id,
      },
    });
  }
  console.log(`✓ ${examplePrompts.length} Beispiel-Prompts erstellt`);

  console.log("\n🎉 Seeding abgeschlossen!");
  console.log("\nAdmin-Login:");
  console.log(`  E-Mail:   ${admin.email}`);
  console.log("  Passwort: aus ADMIN_SEED_PASSWORD/.env");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
