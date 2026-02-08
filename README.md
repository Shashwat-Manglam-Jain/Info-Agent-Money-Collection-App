# Info Agent Money Collection (Expo / React Native)

Mobile app used by credit cooperative societies to support **Daily / Weekly / Monthly** collections through field agents.

## Run
- `npm install`
- `npm run android` (or `npm start`)

## Demo Login (seeded)
- Society Code: `DEMO`
- Agent Code: `AG001`
- PIN: `1234`

## Data Flow (Proposed System)
1. Society computer exports master data (Society / Agents / Accounts) to JSON.
2. Agent imports that JSON in the app (**Sync → Import Master Data**).
3. Agent records collections in real time (Quick Collect → Account → Save Collection).
4. Agent exports pending entries (**Sync → Export Pending**) and shares the JSON back to the society system for posting.

## Folder structure
- `src/screens/auth` – splash / login / register
- `src/screens/collections` – collect + account detail + reports
- `src/screens/accounts` – account list
- `src/screens/sync` – import/export + account opening requests
- `src/db` – SQLite schema + repo
- `src/sync` – import/export payload logic
- `src/components` – reusable UI
- `src/theme` – colors/spacing
- `sample-data/` – example JSON for import

