# Hardening And Release Checklist

## Status

Database migrations 012-015 were explicitly applied to production on 2026-11-09,
after user approval and local verification. Application releases deploy from
GitHub main. Database migrations are separate operations, not part of the Vercel build.

Read-only inspection confirmed unconditional PUBLIC policies and broad anonymous
grants in the linked production project's public schema. The repair is now applied:
no unscoped PUBLIC write policies or anonymous grants on private tables remain;
all public-schema tables have RLS enabled. Quota, limiter, alert and job RPCs deny
anonymous execution. No customer records were inspected. Access history and
existing records have not been investigated for prior tampering.

## Applied Migration Record

The production project is shared. Its existing timestamped migration history was
not rewritten, and 001-011 were not replayed. The exact forward files applied
through the linked Supabase Management API are recorded here by SHA-256:

| File | SHA-256 |
| --- | --- |
| 012_onchain_snapshots.sql | `48ecdd201cd5f30d8b04c8c15d27e5dc297b36d2d1967fa8bf6d315843de5f97` |
| 013_security_and_atomic_ai_quotas.sql | `c5a76cd6342e975efb0f8639aa8af24e8d864819c48d812627d8390fe63ee669` |
| 014_alert_delivery.sql | `2ea324b58c61de88546a669c04166a71f2505063b53a8ee238df2745123561be` |
| 015_ai_job_leases.sql | `ccabd82651ab0860c57a6d12b9226fe0ae253b9db84408e108df6b22df01849e` |

Supabase reported a completed physical backup dated 2026-11-09 06:58 UTC; PITR
was not enabled. Private local schema/policy snapshots were retained outside git.
The Culture schema's definitions/grants/policy fingerprint matched before and
after (`e565bbe3824fc4a9962488850ac6c3f9`). PostgREST schema reload was requested.
The operator allowlist remains empty, intentionally denying private operator tools.

## Local Verification

Use Node 24 and `npm ci`. The targeted minimatch override upgrades the ESLint
parser's transitive dependency to remediate GHSA-g3hv-75wg-m249; it is not an audit
suppression. Keep it reviewed when updating typescript-eslint.

```bash
npm run check
# initdb, pg_ctl and psql must be on PATH; tests create disposable socket-only DBs.
npm run test:database
npx playwright install chromium
npm run test:browser
```

Browser fixtures never call AI, send notifications, or write production data.
The database tests use freshly initialized local clusters, not Supabase URLs.
`npm test` skips opt-in full-migration tests; `test:database` must also pass.
GitHub runs the same checks. Repository branch protection and Vercel deployment
gating still need to be enabled in their respective dashboards; adding a workflow
does not by itself prevent an early production deploy on push.

## Production Rollout

1. Confirm a restorable database backup/PITR and retain a schema/policy snapshot.
   Review existing API keys, agent verification and scores, financial snapshots,
   and access logs for integrity. A policy repair does not undo past exposure.
2. Coordinate a brief maintenance window for auth-dependent writes, AI and alerts.
   Migration 013 deliberately revokes client writes to quotas, reputation and
   delivery state. Do not leave the old application running against new grants
   longer than the coordinated rollout requires.
3. Verify the linked project and public-schema metadata again. This database is
   shared with the Culture site's separate schema and has a different timestamped
   migration history. Do NOT blindly `supabase db push` or replay 001-011 against
   it. Do not change the Culture schema or rewrite shared migration history.
4. The inspected public schema has 001-011 objects but no `onchain_snapshots`,
   `network_applications`, `subscribers`, or `api_keys.tier`. After confirming this
   still holds, apply the reviewed forward files in order: 012 (missing table),
   013 (authorization/quotas/schema), 014 (alert outbox), 015 (daily AI leases).
   Track application of these files explicitly using the agreed shared-database
   migration procedure. Existing-data preflights can abort safely and require an
   operator decision, notably more than ten active agents per owner.
5. Validate deployed grants, owner isolation and service-only RPC access using
   dedicated test identities, without exposing real customer records. Confirm the
   PostgREST schema cache sees the new RPCs before allowing traffic.
6. Confirm production-only server settings: Supabase service credentials,
   `CRON_SECRET`, intended `OPERATOR_USER_IDS`, canonical `NEXT_PUBLIC_APP_URL`,
   and optional node/AI/email settings. The durable production limiter cannot be
   disabled by choosing the local memory backend. No operator is allowed by default.
7. Commit the verified code and deploy from GitHub main, not a local CLI upload.
   Check API authentication, quota denial, operator-only tools, signup/profile,
   progress/bookmarks, alert queuing, job lease status, and both themes on mobile.
8. Watch job failures, missing-data coverage, quota RPC errors, alert retry age,
   and provider deadlines. Check branch protection before resuming frequent pushes.

## Deliberate Behavior Changes

- Missing quota/limiter/lease storage returns unavailable rather than allowing
  unbounded requests or duplicate AI spend.
- Financial inputs must be recent, complete enough, and semantically eligible.
  Some formerly populated widgets may correctly show unavailable until validated
  observations are ingested. Historical snapshots/briefs are not automatically repaired.
- Free-text predictions are no longer graded against the price when cron happens
  to run. They are held for independent operator evidence and expire without an
  awarded correctness result. Full target-time automated evaluation remains future work.
- Push cannot be selected in the frontend until a complete browser enrollment
  flow exists. Existing subscriptions are checked against supported provider hosts
  on both registration and delivery. Delivery is at-least-once after ambiguous
  network failures; email uses deterministic Resend idempotency keys.
- The UTXO script produces a validated read-only candidate, not automatic database
  publication. It requires dump provenance and explicit historical price coverage.
  See `scripts/onchain-indexer/README.md` for the intentionally stricter contract.
- Jost/Space Mono are self-hosted at build time. The build needs font-download
  access; visitors no longer depend on Google Fonts requests to view page text.

## Remaining Operational Limits

- No live OAuth, paid AI, LND or notification delivery was exercised by the automated
  suite. Validate those with controlled accounts and budgets during rollout.
- Full signal calibration and source licensing/units require independent market-data
  review. Mathematical regression tests do not validate every vendor contract.
- On-chain age/price metrics remain estimates where block times are interpolated;
  a manifest cannot prove the CSV's completeness or chainstate authenticity.
- Source deadlines are per request, not a universal whole-job deadline. Alert
  retries and job leases are durable, but external side effects cannot be guaranteed
  exactly once after a crash.
- Basic browser security headers are enforced; the CSP is a baseline, not a fully
  restrictive script/connect allowlist. A strict nonce policy needs a separate
  compatibility pass for charts, inline theme setup and external services.
- TypeScript does not yet use a freshly generated, parameterized database type map
  everywhere. Fresh-schema integration tests cover the critical route contracts.
