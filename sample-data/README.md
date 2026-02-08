# Sample JSON files

## `master-data.v1.json`
Import this format in the app via **Sync → Import Master Data** (or from the Login screen).

This file represents the **primary data** that the Society computer system provides to the agent mobile:
- Society details
- Agent details (with PIN for authentication)
- Client accounts (Account No, Name, Installment, Balance, Last Txn, etc.)

## Notes
- Amount fields can be provided as `installmentRupees` / `balanceRupees` (numbers).
- Codes should be consistent with your Society system (`society.code`, `agents[].code`).

