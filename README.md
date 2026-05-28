# 🧪 Promptlabor

Eine kuratierte Prompt-Bibliothek für Bildung und Unterrichtsentwicklung.

## Schnellstart (lokal)

```bash
npm run dev
```

→ Öffne [http://localhost:3000](http://localhost:3000)

## Admin-Login

Der Admin-Account wird beim Seed aus `.env` erzeugt:

```bash
ADMIN_SEED_EMAIL="..."
ADMIN_SEED_PASSWORD="..."
ADMIN_SEED_NAME="..."
```

Registrierungsbenachrichtigungen gehen an `ADMIN_EMAIL`.

## Verfügbare Befehle

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Lokaler Entwicklungsserver |
| `npm run build` | Produktionsbuild mit Webpack |
| `npm run start` | Produktionsserver nach Build |
| `npm run seed` | Testdaten einspielen |
| `npm run db:migrate` | Datenbankschema-Änderungen anwenden |
| `npm run db:studio` | Prisma Studio (DB-Browser) |

## E-Mail-Benachrichtigungen lokal testen

Starte [Mailpit](https://mailpit.axllent.org/) um E-Mails lokal abzufangen:

```bash
# Mit Homebrew
brew install mailpit
mailpit
```

Mailpit läuft dann auf:
- **SMTP:** `localhost:1025` (konfiguriert in `.env`)
- **Web-UI:** [http://localhost:8025](http://localhost:8025)

## Deployment auf mondschule.de

Promptlabor läuft als Next.js-Prozess hinter nginx unter:

- `https://mondschule.de/promptlabor/`

Einmalig auf dem Server:

```bash
cd /var/www/mondschule.de/public_html/promptlabor
cp .env.example .env
nano .env
npm ci --omit=dev
sudo cp promptlabor.service /etc/systemd/system/promptlabor.service
sudo systemctl daemon-reload
sudo systemctl enable --now promptlabor
```

In `.env` für Produktion setzen:

```bash
DATABASE_URL="file:./dev.db"
AUTH_SECRET="..."
NEXTAUTH_URL="https://mondschule.de/promptlabor"
NEXT_PUBLIC_BASE_PATH="/promptlabor"
ADMIN_EMAIL="..."
SMTP_HOST="..."
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_FROM="Promptlabor <noreply@mondschule.de>"
```

Nginx:

- Inhalt aus `nginx-promptlabor.conf.example` in den passenden `server {}`-Block von `mondschule.de` übernehmen.
- Danach `sudo nginx -t` und `sudo systemctl reload nginx`.

Deploy vom lokalen Rechner:

```bash
./deploy-path.sh
ssh lita@mondschule.de 'cd /var/www/mondschule.de/public_html/promptlabor && npm ci --omit=dev && sudo systemctl restart promptlabor'
```

`dev.db`, `.env` und `public/uploads/` werden beim Deploy nicht überschrieben.

## Projektstruktur

```
src/
  app/
    page.tsx              → Startseite
    prompts/              → Prompt-Übersicht & Detail
    kategorien/           → Kategorien-Übersicht & Detail
    login/                → Anmeldung
    registrieren/         → Registrierung
    mein-konto/           → Benachrichtigungseinstellungen
    admin/                → Admin-Dashboard & Prompt-Formular
    api/                  → REST API-Routen
  components/             → Wiederverwendbare Komponenten
  lib/                    → Prisma, Mail, Utils
prisma/
  schema.prisma           → Datenbankschema
  seed.ts                 → Testdaten
```

## KI-Modell-Badges

| Modell | Farbe | Symbol |
|---|---|---|
| ChatGPT | Grün | ✦ |
| Claude | Orange | ◆ |
| Gemini | Blau | ✸ |
| NotebookLM | Violett | ☰ |
