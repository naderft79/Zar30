# ZAR30 Admin Operations Center

## Architecture

```text
/admin/* UI
  → /api/v1/admin/*
  → requireAuth (JWT + active session)
  → requireAdmin (active AdminUser)
  → granular permission
  → domain/admin service
  → Prisma / PostgreSQL
  → strict audit for privileged mutations
```

Admin authentication reuses the existing user authentication and session rotation. There is no second password system. `AdminUser` adds role, custom grants/revokes, and active state. The user panel remains under `/dashboard/*`; its five-item navigation contract is unchanged.

## RBAC

Central sources:

- Permission catalog and role defaults: `src/lib/auth/rbac.ts`
- Server guards: `src/lib/auth/guard.ts`
- Navigation presentation gate: `src/config/admin-navigation.ts`

Custom permissions accept `{ grant: Permission[], revoke: Permission[] }`; legacy arrays are treated as grants. `SUPER_ADMIN` cannot be reduced by revoke. UI visibility never replaces API authorization.

Roles: `SUPER_ADMIN`, `FINANCE`, `SUPPORT`, `KYC`, `RISK`, `CONTENT`, `OPERATIONS`, `ANALYST`, `READ_ONLY`.

## Route and Module Map

| Module            | Page                                | API                               | Mode                             |
| ----------------- | ----------------------------------- | --------------------------------- | -------------------------------- |
| Dashboard         | `/admin/dashboard`                  | `/api/v1/admin/dashboard`         | Real DB metrics                  |
| Users             | `/admin/users`, `/admin/users/[id]` | `/api/v1/admin/users/*`           | Read + audited status control    |
| KYC               | `/admin/kyc`, `/admin/kyc/[id]`     | `/api/v1/admin/kyc/*`             | Queue/claim/review               |
| Accounts          | `/admin/accounts/*`                 | `/api/v1/admin/accounts/*`        | Read-only ledger explorer        |
| Wallets           | `/admin/wallets/*`                  | `/api/v1/admin/wallets/*`         | Read-only                        |
| Gold              | `/admin/gold`                       | `/api/v1/admin/gold`              | Exact holdings                   |
| Orders            | `/admin/orders/*`                   | `/api/v1/admin/orders/*`          | Read-only chain                  |
| Transactions      | `/admin/transactions/*`             | `/api/v1/admin/transactions/*`    | Transaction→journal→ledger→audit |
| Deposits          | `/admin/deposits`                   | `/api/v1/admin/deposits`          | `Transaction(type=DEPOSIT)`      |
| Withdrawals       | `/admin/withdrawals/*`              | `/api/v1/admin/withdrawals/*`     | Read-only, IBAN masked           |
| Pricing           | `/admin/pricing`                    | `/api/v1/admin/pricing`           | History/read-only                |
| Installments      | `/admin/installments`               | `/api/v1/admin/installments`      | Contracts/read-only              |
| Investments       | `/admin/investments`                | `/api/v1/admin/investments`       | Positions/read-only              |
| Referrals         | `/admin/referrals`                  | `/api/v1/admin/referrals`         | Referral chain/read-only         |
| Support           | `/admin/support`                    | `/api/v1/admin/support`           | Queue/read-only                  |
| Notifications     | `/admin/notifications`              | `/api/v1/admin/notifications`     | Delivery oversight               |
| Security Sessions | `/admin/security/sessions`          | `/api/v1/admin/security/sessions` | Read-only, no token hashes       |
| Audit Logs        | `/admin/audit-logs`                 | `/api/v1/admin/audit-logs`        | Append-only/read-only            |
| Team              | `/admin/team`                       | `/api/v1/admin/team`              | Membership/read-only             |
| Content           | `/admin/content`                    | `/api/v1/admin/content`           | CMS oversight/read-only          |
| Feature Flags     | `/admin/feature-flags`              | `/api/v1/admin/feature-flags`     | Read-only                        |

The navigation has 30 centrally configured destinations. Routes not listed above are architecture targets and remain unavailable until their authoritative domain/service exists.

## Financial Safety

- PostgreSQL and the double-entry ledger remain authoritative.
- Redis is not queried as financial truth.
- BigInt/Decimal values are serialized as strings and rendered with `formatExactAmount`; no float conversion.
- The admin panel does not expose balance correction, reversal, withdrawal approval, deposit confirmation, order execution, or price update shortcuts.
- Those actions remain blocked until their domain engines provide DB transactions, locking, durable idempotency, balanced journal entries, reason, confirmation, and strict audit.

## Audit Model

Privileged records include actor, actor role, action, entity, target user, request ID, IP, user-agent, reason, before, and after. Sensitive mutations write audit in the same PostgreSQL transaction. KYC document views are fail-closed and audited before bytes are returned.

## Privacy

- Password hashes, token hashes, OTPs, encryption values, storage keys, and raw KYC bank values are never returned.
- Withdrawal IBAN is masked.
- KYC documents use authenticated routes and `private, no-store`.
- Detail payload sections are permission-scoped.

## Time Policy

Database timestamps are UTC. Admin date-only filters (`YYYY-MM-DD`) represent the complete UTC day (`00:00:00.000Z` through `23:59:59.999Z`) and are labeled accordingly. UI timestamps use the viewer locale.

## UI Rules

- Separate responsive `AdminShell`; no user-panel navigation changes.
- Navy canvas, restrained gold authority accent, controlled cream contrast.
- Desktop fixed sidebar; tablet/mobile accessible drawer.
- Tables are server-paginated and transform to cards on mobile.
- Search uses Ctrl/Cmd+K and permission-aware server queries.
- Motion is transform/opacity based and reduced-motion compatible.

## Known Gaps

- Risk/Fraud rule engine and review records
- Financial execution engines and privileged approval workflows
- Support conversation/reply workflow and internal notes
- Notification provider/worker controls
- CMS revision/publish workflow
- Reports/export jobs
- System health/jobs/queues page
- API keys/webhooks lifecycle
- Role/team mutation UI and step-up authentication

These are not mocked. Their navigation architecture and permissions exist, but operational completion requires the relevant authoritative backend.
