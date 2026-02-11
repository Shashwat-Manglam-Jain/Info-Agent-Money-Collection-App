# Info Agent Money Collection (Expo / React Native)

Mobile app for credit cooperative societies to manage **Daily / Weekly / Monthly** collections with field agents. Admin provides the daily master file (TXT/Excel). Agents import, collect amounts, and export results back to the society.

## Table of Contents
1. Overview
2. Features
3. Requirements
4. Install & Run
5. Core Workflow
6. Registration (Device)
7. Import (TXT / Excel)
8. Account Types (Lots)
9. Collect Money
10. Export & Clear
11. History & Reports
12. Theme & UI
13. Data Storage
14. File Naming & Locations
15. Validation Rules
16. Security Notes
17. Testing
18. Project Structure
19. Troubleshooting
20. FAQs

## 1. Overview
- Used by agents to collect money from clients.
- Society/admin sends **one file per agent** per day.
- Agents can handle **multiple account types** (Daily/Monthly/Loan) in the same day.

## 2. Features
- TXT and Excel import.
- Auto login after import (PIN fixed to `0000`).
- Multiple account types per agent (handled as separate lots).
- Export per lot (Excel by default, TXT optional).
- Export history with in-app viewer.
- Fast search by last digits of account number.
- Edit last saved collection for corrections.
- Light/Dark theme based on device settings.

## 3. Requirements
- Node.js 18+ recommended.
- Expo Go or native build setup.

## 4. Install & Run
```bash
npm install
npm start
```

## 5. Core Workflow
1. Agent registers device with Society Name and Agent Name.
2. Agent imports the daily TXT/Excel report shared by admin.
3. App auto logs in and loads accounts.
4. Agent collects amounts and saves entries.
5. Agent exports pending entries (per lot) and shares the file back.
6. Exported account type data clears locally so next day import is clean.

## 6. Registration (Device)
Location: **Login screen**
- Enter **Society Name** and **Agent Name** exactly as in admin file.
- Registration is stored locally and used to validate imported files.

## 7. Import (TXT / Excel)
Location: **Sync → Import Daily Data** or Login screen.

Rules:
- The file must match the registered Society Name + Agent Name.
- Can import multiple lots using **+** (Add Account Type) without wiping existing lots.
- Replace mode clears old data first.

### 7.1 TXT Format (example)
```
PRIYADARSHANI MAHILA CREDIT SOCIETY, karanja                 Date :- 19-01-2026
Agent Wise Client Account Report
Account Head:DAILY PIGMY ACCOUNT  007 Agent Name:Mr.GOURAV ... 00100005
----------------------------------------------------------------------
Ac No     Name                                       Balance
----------------------------------------------------------------------
00700034  TUKARAM BHABUTRAO GAVALI                    100.00
```

### 7.2 Excel Format (example)
Excel must include these columns (case-insensitive):
- `Ac No`
- `Name`
- `Amount` or `Balance`

## 8. Account Types (Lots)
Each account type is treated as a **lot** based on:
- `account_head_code` (preferred) OR `account_type`
- `frequency` (DAILY / WEEKLY / MONTHLY)

In the app:
- **Collect** screen shows active lot and lets you switch.
- **Accounts** screen always filters by active lot.
- Export is generated **per lot**, one file each.

## 9. Collect Money
1. Go to **Collect**.
2. Enter last digits of account number.
3. Open a client and enter received amount.
4. Save the entry. Toast confirms success.
5. Use **Edit** from toast to correct mistakes.

## 10. Export & Clear
Location: **Sync → Export & Clear Data**

Behavior:
- Export creates separate files per lot.
- After export, only those exported lots are cleared.
- Other lots remain intact.

Formats:
- Excel (`.xlsx`) default
- Text (`.txt`) optional

## 11. History & Reports
Location: **Reports**

- Calendar highlights dates with export files.
- Tap a file to view full details inside the app.
- Files are stored locally and can be shared again anytime.

## 12. Theme & UI
- Automatic light/dark theme based on device settings.
- Status bar adapts to theme.
- Skeleton loaders + custom popups for a smoother UX.

## 13. Data Storage
All data stored locally in SQLite:
- Societies
- Agents
- Accounts
- Collections
- Export history
- App meta (registration + active lot)

## 14. File Naming & Locations
Exports are saved to:
- `Document/exports` (inside app sandbox)

File name format:
```
IAMC_<societyCode>_<agentCode>_<lotCode>_<YYYYMMDD>_<HHMMSS>Z.xlsx
```

## 15. Validation Rules
- Society Name and Agent Name must match registered values.
- Matching is case-insensitive and ignores common titles (Mr/Mrs/etc).
- Import fails if mismatched.

## 16. Security Notes
- PIN is fixed to `0000` for imported agents (simplified flow).
- No external network calls; everything is local file + SQLite.

## 17. Testing
```bash
npm run typecheck
npm test
```

## 18. Project Structure
- `src/screens/auth` – login and splash
- `src/screens/collections` – collect, account detail, reports
- `src/screens/accounts` – client list
- `src/screens/sync` – import/export
- `src/db` – SQLite schema + repository
- `src/sync` – import/export parsing logic
- `src/components` – shared UI components
- `src/theme` – theme system
- `sample-data` – example import files

## 19. Troubleshooting
- **Wrong file error**: Registration names must match (case-insensitive).
- **Import stuck**: Use **Refresh Session** on Import screen.
- **History empty**: Ensure export files exist in `Document/exports`.
- **Dark mode not switching**: Rebuild app after changing `app.json`.

## 20. FAQs
**Q: Can one agent handle Daily + Monthly in the same day?**
Yes. Import daily file first, then use **+** to add another account type.

**Q: Does export clear all data?**
No. It clears only the exported account type (lot). Other lots remain.

**Q: Can I edit a wrong collection?**
Yes. Use the **Edit** option after saving.

---

This README reflects the current app flow and data rules.
