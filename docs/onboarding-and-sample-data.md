# Onboarding and sample data

## First-run flow

On first sign-in (no completion/dismissal recorded in `user_settings`), both
clients show a three-step flow:

1. Welcome + a shortcut to **load sample data** to look around.
2. Add your first customer.
3. Record payments, send statements, and collect via UPI QR.

- **Finish** persists `onboardingCompletedAt`; **Skip** (or closing the
  dialog) persists `onboardingDismissedAt`. Either prevents the flow from
  reappearing — there is no nagging.
- Web: `apps/web/components/onboarding/OnboardingFlow.tsx` mounted on the
  dashboard. Mobile: `apps/app/components/OnboardingDialog.tsx` mounted on the
  home tab.
- The flags are plain `PUT /settings` fields, so the flow can be reset by
  clearing both flags server-side if ever needed.

## Sample data

`POST /sample-data` seeds a handful of realistic customers and transactions
flagged `is_sample = true`; `DELETE /sample-data` removes exactly the flagged
rows. Behavior:

- Sample rows **render everywhere** normal rows do — lists, totals, dashboard
  analytics, collection — so the numbers the user sees always match the
  entries they see. They are labelled ("Sample" badge on web and mobile).
- **Exports never include them**: the CSV endpoints, the JSON account archive,
  and every download path filter `is_sample` rows (SQL predicate plus an
  in-memory `isExportable` guard; covered by `apps/api/src/test/exports.test.ts`).
- Removal restores totals to real values and leaves real customers,
  transactions, and audit rows untouched.
- Seeding is one confirmed action and idempotent in effect (only flagged rows
  are ever removed).

## Reproducing the documented steps

1. Sign in with a fresh account → the onboarding dialog appears.
2. Choose *Load sample data* → customers and entries appear with Sample
   badges; dashboard analytics populate.
3. Settings → export a CSV → confirm the file contains no sample rows.
4. Choose *Skip* on another fresh account → the dialog never reappears.
5. Settings (web) or Profile (mobile) → *Remove sample data* → sample rows
   disappear and totals return to real values.
