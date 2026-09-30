# Finance Billing Core

## Use each month

1. Open **การเงิน → สร้างบิลรายเดือน**.
2. Select a monthly fee item, the academic year, the month, and an optional due date.
3. Select **เตรียมรายชื่อ / ยกจากเดือนก่อน**. The first month uses active student assignments; later months copy the previous month's active roster.
4. Add or remove students in the monthly roster, then select **ตรวจสอบบิลรอบนี้**.
5. Select the rows to bill and confirm. Existing bills are shown separately and are never created again.

## Data rules

- A monthly bill is unique by student, fee plan, and billing period.
- The roster is a monthly snapshot. Editing a new month does not edit an earlier month.
- A generated bill stores the fee name, amount, and discount used at the time of billing.
- A payment can only be applied to fees belonging to the selected student and cannot exceed the remaining balance.
- Repeating the same payment or bulk-billing request uses an idempotency key so it does not create duplicate records.
- Cancelling a payment now marks it void and restores the fee balance; it does not delete the receipt history.

## Migration

Run `backend/scripts/migration_v13_billing_core.sql` once before using the new billing page. It is safe to re-run. The local development database was backed up before this migration and the backup directory is ignored by Git.

## Limits of this delivery

- User identity is still supplied by the existing UI; formal server-side role enforcement and approval workflows remain a later step.
- Credit balances, refunds, and a dedicated payment-register report are not included yet.
- Price versions are preserved through bill snapshots. A dedicated price-history editor has not been added yet.
