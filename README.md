# Info Agent Money Collection

Expo + React Native mobile app for cooperative society field collections.
It imports agent master files (TXT/Excel), lets agents collect amounts, exports pending collections per account type (lot), and keeps local export history.

## 1. Tech Stack
- React Native + Expo
- TypeScript
- SQLite (`expo-sqlite`) for app data
- SecureStore (`expo-secure-store`) for session
- File handling: `expo-file-system`, `expo-document-picker`, `expo-sharing`
- Testing: Vitest

## 2. Quick Start
```bash
npm install
npm start
```

Useful scripts:
```bash
npm run typecheck
npm test
```

## 3. Core Functionality

### 3.1 Authentication and Profiles
- Sign-in by `Society Code + Agent Code + PIN`.
- Import flow creates/updates society and agent records automatically.
- Imported agents get default PIN `0000` (`DEFAULT_AGENT_PIN`).
- Session persists across app restarts using SecureStore.
- Multi-profile switching is supported from the in-app society switcher.

### 3.2 Master Data Import (TXT and Excel)
- Import screen accepts `.txt`, `.xls`, `.xlsx`.
- Two import modes:
- `replace` mode: replaces lots from the incoming file for that society/agent.
- `add` mode: adds a new lot without removing existing lots.
- Add mode blocks duplicate lot imports (same lot key already loaded).
- Successful import auto-signs in with default PIN and sets active lot to the imported lot.

### 3.3 Lot-Based Account Model
- Accounts are grouped by lot key:
- `<account_head_code>_<account_type>_<frequency>` when head code exists.
- `<account_type>_<frequency>` when head code is missing.
- Active lot filter is saved per society and reused on next launch.
- Collect and Accounts screens respect the active lot filter.

### 3.4 Collection Workflow
- Quick search by last digits of account number.
- Open account detail and save collection for today.
- Same account/day updates existing record instead of duplicating.
- Optional remarks supported per collection.
- Shows projected balance while entering amount:
- Loan account: balance decreases.
- Non-loan account: balance increases.
- One-tap edit available after save.

### 3.5 Accounts and Daily Progress
- Accounts screen:
- Search by client name or account number.
- Filter by `All`, `Collected`, `Remaining` for current day.
- Collect screen daily summary:
- Collected count, remaining count, total amount.
- Progress bar and today’s entries.

### 3.6 Export and Clearing
- Exports only `PENDING` collections.
- Export files are generated per lot (separate file for each account type lot).
- Supported export formats:
- Excel (`.xlsx`) default
- Text (`.txt`) optional
- File naming format:
- `IAMC_<societyCode>_<agentCode>_<lotCode>_<YYYYMMDD>_<HHMMSS>Z.<ext>`
- After export, matching collections are marked `EXPORTED` and export rows are logged.
- Sync screen then clears local account + collection data only for exported lots.
- If exactly one file is exported and share is available, share sheet opens automatically.

### 3.7 Reports and History
- Calendar-based history filter by date.
- Reads history from both:
- `exports` DB records
- files present in app document `exports` directory
- Export details viewer parses `.xlsx`, `.xls`, `.txt`, and `.json` export files.
- Can share any selected export file again from Reports screen.

### 3.8 Theme and UI
- Light/dark theme via custom theme provider.
- Tab navigation: `Collect`, `Accounts`, `Reports`, `Sync`.
- Reusable UI components: cards, popups, skeleton loaders, section headers, lot selector.

## 4. Import Format Support

### 4.1 TXT Parser (`parseAgentReportText`)
- Reads society line and report date (`DD-MM-YYYY`).
- Parses `Account Head` and `Agent Name` (same line or separate line).
- Parses account rows with account number, name, balance.
- Handles comma-separated numeric amounts (`5,100.00`).
- Normalizes:
- Frequency: `DAILY/WEEKLY/MONTHLY`
- Account type: `PIGMY/LOAN/SAVINGS`

### 4.2 Excel Parser (`parseAgentReportExcel`)
- Auto-selects first non-`Abstract` sheet.
- Detects society, date, agent, account head metadata.
- Detects header row with `Ac No`.
- Reads amount from installment/collection/fallback columns.
- Reads balance when available.
- Handles mixed spacing and flexible labels (`Agent Name`, `Date`, etc.).

## 5. Data Storage
- Local SQLite database: `info-agent-money-collection.db`
- Main tables:
- `societies`
- `agents`
- `accounts`
- `collections`
- `exports`
- `app_meta`
- Session key stored in SecureStore: `iamc_session_v1`
- Active lot and registration metadata stored in `app_meta`.

## 6. Validation and Safety Rules
- Import upsert is isolated by:
- society
- agent
- account number
- lot key
- Replace imports delete only matching society/agent lots from incoming report.
- Export validation blocks inconsistent data:
- same account number + same lot with different client names
- same account number mapped to different client names across lots
- Clear-by-lot logic supports both head-code and no-head-code lots without cross-lot deletion.

## 7. Test Coverage (Current Suite)
- `tests/parseAgentReport.test.ts`
- TXT parsing, long names, comma amounts, separate agent line, missing head code.
- `tests/parseAgentReportExcel.test.ts`
- Excel parsing of metadata and rows.
- `tests/importParsedReport.test.ts`
- Upsert scoping and replace-mode lot clearing behavior.
- `tests/importIsolationScenarios.test.ts`
- Isolation across lots and societies; update-in-place within same lot.
- `tests/exportValidation.test.ts`
- Export conflict detection rules.
- `tests/exportPending.test.ts`
- Per-lot export generation, naming, mark-exported calls, share behavior.
- `tests/clearClientDataByLots.test.ts`
- Lot-scoped delete behavior and no-op on empty lot list.

All tests currently pass with `npm test`.

## 8. Project Structure
- `src/appState` - app/session state provider
- `src/db` - SQLite setup, migrations, repository
- `src/sync` - import/export parsers and workflows
- `src/screens` - app screens by feature area
- `src/components` - reusable UI components
- `src/theme` - theme provider and tokens
- `src/utils` - shared helpers (money, dates, lots, errors)
- `tests` - Vitest unit tests

## 9. Known Notes
- Import works without mandatory pre-registration; registration metadata is optional in current flow.
- Register screen UI exists, but PIN set/update flow is not wired to repository update yet.
- No network API calls are used; operations are local DB + local files.
