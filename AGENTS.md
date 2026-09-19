# ZARNAMA — AGENTS.md

## Project Identity

Project Name: **Zarnama / زر‌نما**

Project Type:

- Gold Trading Platform
- Digital Gold Platform
- Gold Investment Platform
- Installment Gold Platform
- Financial Technology Platform
- Responsive Web Application
- Progressive Web App (PWA)
- Mobile-ready Application Architecture

Primary Product Goal:

Build a secure, scalable, production-grade platform for buying, selling, holding, investing in, and managing gold assets.

The platform must support:

- Web
- Desktop
- Tablet
- Mobile
- PWA
- Future Android application
- Future iOS application

---

# 1. SOURCE OF TRUTH

The repository contains several categories of project information.

The following hierarchy MUST be respected:

```text
Business Requirements
        ↓
MEGAPLAN.md
        ↓
AGENTS.md
        ↓
Architecture Decision Records
        ↓
Implementation
        ↓
Tests
        ↓
Documentation
```

### Primary files

`MEGAPLAN.md`

The product roadmap, architecture plan, requirements, phases, dependencies, and acceptance criteria live here.

`AGENTS.md`

Permanent engineering rules and operating principles live here.

`docs/ARCHITECTURE_DECISIONS.md`

Major architecture decisions and deviations are recorded here.

`docs/EXECUTION_STATUS.md`

Current execution state lives here.

`docs/CHANGELOG.md`

Important project changes live here.

### Critical Rule

Do not contradict `MEGAPLAN.md` without documenting the reason.

Do not silently change architecture.

Do not silently remove requirements.

Do not mark incomplete work as complete.

---

# 2. AGENT ROLE

The AI Agent is not merely a code generator.

The Agent operates simultaneously as:

- Senior Software Engineer
- Software Architect
- Backend Engineer
- Frontend Engineer
- Database Engineer
- Security Engineer
- QA Engineer
- DevOps Engineer
- Performance Engineer
- Product Engineer

The Agent must think in terms of:

```text
Product
Architecture
Security
Data Integrity
User Experience
Testing
Operations
Maintainability
Scalability
```

The goal is not:

"Generate code quickly."

The goal is:

"Build a reliable production system."

---

# 3. CORE ENGINEERING PRINCIPLES

Always prioritize:

```text
1. Data Integrity
2. Financial Correctness
3. Security
4. Functional Correctness
5. Reliability
6. Maintainability
7. Testability
8. UX
9. Performance
10. Development Speed
```

Speed must never override financial correctness or security.

---

# 4. DO NOT REINVENT THE PLAN

Before implementing a new feature:

1. Search `MEGAPLAN.md`.
2. Search existing source code.
3. Search existing documentation.
4. Search existing tests.
5. Search Architecture Decision Records.
6. Reuse existing abstractions when appropriate.

Do not create a second competing implementation of an existing feature.

Do not duplicate:

- Services
- API clients
- Validation
- Business logic
- Authentication
- Notification logic
- Financial logic

without a clear architectural reason.

---

# 5. NEVER ASSUME UNKNOWN REQUIREMENTS

If something is unknown:

Do not invent business rules and present them as confirmed requirements.

Instead classify the decision as:

```text
ASSUMPTION
```

or:

```text
DECISION REQUIRED
```

If the issue is technically non-critical, choose the safest reasonable implementation and document the assumption.

If it changes:

- Money
- Legal behavior
- Financial calculations
- User entitlement
- Security architecture
- Core database structure

treat it as a significant decision.

---

# 6. PROJECT EXECUTION MODEL

All development follows:

```text
Inspect
↓
Understand
↓
Plan Task
↓
Implement
↓
Test
↓
Review
↓
Fix
↓
Document
↓
Commit
↓
Update Status
```

Never skip directly from:

```text
Plan → Done
```

---

# 7. PHASE MANAGEMENT

Every project Phase must have:

- Goal
- Dependencies
- Tasks
- Implementation
- Tests
- Security Review
- Acceptance Criteria
- Documentation
- Phase Report

A Phase can only be marked:

`DONE`

after all required completion gates pass.

---

# 8. TASK MANAGEMENT

Every task must have a clear result.

Bad:

```text
Implement wallet.
```

Good:

```text
Implement immutable gold ledger with transactional balance updates,
idempotency protection, concurrency protection, audit logging,
and unit/integration tests.
```

Every important task should answer:

- What?
- Why?
- Where?
- Dependency?
- Expected output?
- How is it tested?
- How is completion verified?

---

# 9. NO FAKE COMPLETION

Never claim a feature is implemented when it is:

- Mocked
- Hardcoded
- Placeholder-only
- UI-only
- Static
- Simulated
- Returning fake success
- Returning fabricated financial data

A mock can exist for development.

However it MUST be explicitly marked as:

```text
MOCK
```

and must never be mistaken for production functionality.

---

# 10. FINANCIAL SYSTEM RULES

Zarnama is a financial platform.

Financial correctness is a first-class engineering requirement.

Financial features include:

- Gold balances
- Rial balances
- Deposits
- Withdrawals
- Purchases
- Sales
- Fees
- Spreads
- Investments
- Installments
- Referral commissions
- Settlements
- Profit calculations

These must be handled as financial operations, not ordinary CRUD operations.

---

# 11. MONEY REPRESENTATION

Never use binary floating-point arithmetic for critical financial calculations.

Do not use:

```text
float
double
JavaScript Number
```

as the authoritative representation for sensitive monetary calculations.

Use an appropriate exact representation such as:

- Decimal
- Fixed precision
- Integer minor units
- Database numeric/decimal types

according to the project's selected architecture.

The representation must be consistent throughout:

- Database
- Backend
- Services
- API
- Tests

### Double-Entry Ledger (Zarnama Architecture)

Zarnama uses a Double-Entry Ledger, not a simple signed ledger.

Every financial mutation must produce a balanced JournalEntry:

```text
sum of debits = sum of credits
```

Concepts:

- Transaction (business event)
- JournalEntry (atomic, balanced set of LedgerEntry)
- LedgerAccount (account: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
- LedgerEntry (immutable debit/credit on a LedgerAccount)
- Asset (RIAL, GOLD, extensible to SILVER, crypto, ...)
- Balance (redundant sum of LedgerEntry per account)
- Reference (link to Order, Deposit, Withdrawal, ...)
- Reversal (compensating JournalEntry, not UPDATE)

### Source of Truth for Financial Integrity

PostgreSQL is the primary and final source of truth for financial integrity.

Primary mechanism:

```text
Database Transaction + Row Lock (SELECT FOR UPDATE) + appropriate Isolation
```

Redis may be used only for distributed coordination in multi-instance scenarios.

Redis must never be the final authority for financial integrity.

### Idempotency (Durable)

Idempotency state must be durable and recoverable.

It must not depend solely on Redis.

Use a durable `IdempotencyRecord` table as the final source.

Redis may be used for acceleration / short-lived coordination only.

---

# 12. GOLD WEIGHT PRECISION

Gold weight must have explicitly defined precision.

The system must clearly define:

- Minimum tradeable quantity
- Decimal precision
- Rounding rules
- Display precision
- Calculation precision

Never round intermediate financial calculations unless explicitly required.

Round at defined business boundaries only.

---

# 13. LEDGER PRINCIPLE

Financial state must be auditable.

A balance should never depend solely on:

```text
users.balance
```

without a reliable underlying transaction/ledger model where applicable.

Financial mutations must produce traceable records.

Whenever possible:

```text
Business Operation
        ↓
Financial Transaction
        ↓
Ledger Entry
        ↓
Balance Effect
        ↓
Audit Event
```

---

# 14. IMMUTABILITY

Historical financial transactions should be treated as immutable.

Do not silently edit historical financial records.

If a correction is required:

prefer an explicit compensating/reversal transaction rather than rewriting history.

Example:

```text
Original Transaction
        +
Correction Transaction
```

rather than:

```text
Edit Original Transaction
```

---

# 15. IDEMPOTENCY

Financial APIs must be resistant to duplicate requests.

This applies especially to:

- Deposit
- Withdrawal
- Buy
- Sell
- Payment
- Installment Payment
- Investment Subscription
- Referral Commission
- Settlement

Retries must not create duplicate financial effects.

### Durable Idempotency (Zarnama Architecture)

Idempotency state must be durable and recoverable.

It must not depend solely on Redis.

Use a durable `IdempotencyRecord` table as the final source of truth.

Redis may be used for acceleration / short-lived coordination only.

Flow:

```text
Request with Idempotency-Key
    ↓
Check Redis (acceleration) → if hit, return cached response
    ↓
Check IdempotencyRecord (DB, durable) → if exists, return stored response
    ↓
Insert IdempotencyRecord (status=processing)
    ↓
Execute financial operation
    ↓
Update IdempotencyRecord (status=completed, response stored)
    ↓
Cache response in Redis (short TTL)
```

---

# 16. CONCURRENCY

Assume users may:

- Double-click
- Retry requests
- Open multiple tabs
- Have unstable internet
- Submit simultaneous requests
- Use multiple devices

Financial operations must be safe under concurrency.

Pay special attention to:

- Balance
- Gold inventory
- Orders
- Withdrawals
- Reservations
- Payments
- Installment payments

### Primary Mechanism (Zarnama Architecture)

PostgreSQL is the primary and final source of truth for financial integrity.

Primary mechanism:

```text
Database Transaction + Row Lock (SELECT FOR UPDATE) + appropriate Isolation
```

Redis may be used only for distributed coordination in multi-instance scenarios.

Redis must never be the final authority for financial integrity.

---

# 17. DATABASE TRANSACTIONS

Use database transactions whenever multiple related writes must succeed or fail together.

Do not leave partially completed financial operations.

Bad:

```text
Update balance
→ API fails
→ transaction record missing
```

Good:

```text
Database transaction
    ↓
Financial operation
    ↓
Ledger
    ↓
Balance effect
    ↓
Audit
```

---

# 18. GOLD INVENTORY

If the system maintains operational gold inventory, the architecture must clearly distinguish between:

- User Gold Holdings
- Operational Inventory
- Available Inventory
- Reserved Inventory
- Pending Inventory
- Settled Inventory

Do not assume these are interchangeable.

---

# 19. PRICING ENGINE

Gold pricing must not be hardcoded in UI code.

Pricing logic belongs in a dedicated domain/service layer.

Pricing may involve:

- Market price
- Buy price
- Sell price
- Spread
- Fees
- Discounts
- Promotional pricing
- Limits
- Market status

All relevant rules must be centralized.

---

# 20. PRICE DATA

Never fabricate live prices.

If a live price provider is unavailable:

show a clear unavailable state.

Do not display made-up prices to users.

---

# 21. FEES

Fees must be:

- Configurable
- Auditable
- Testable
- Versionable when needed

Never scatter fee calculations throughout random UI components.

Centralize them in business logic.

---

# 22. AUTHENTICATION

Authentication must be centralized and reusable.

Support architecture for:

- Registration
- OTP
- Login
- Logout
- Session management
- Refresh
- Password recovery
- Device management
- Suspicious login detection

Authentication logic must not be duplicated across pages.

---

# 23. AUTHORIZATION

Authentication answers:

"Who are you?"

Authorization answers:

"What are you allowed to do?"

Never confuse the two.

Every sensitive endpoint must enforce server-side authorization.

Never rely only on frontend hiding.

---

# 24. RBAC

Use granular role/permission control.

Examples:

```text
users.read
users.update
kyc.read
kyc.review
orders.read
orders.execute
withdrawals.read
withdrawals.approve
pricing.read
pricing.update
ledger.read
reports.read
```

The exact permission model must follow the project architecture.

---

# 25. ADMIN SECURITY

Admin operations are high risk.

Sensitive actions should include:

- Authorization
- Audit logging
- Actor identity
- Timestamp
- Target resource
- Before/after state when appropriate
- Reason where appropriate

Examples:

- Price changes
- Fee changes
- Balance corrections
- Withdrawal approval
- KYC approval
- Investment configuration
- Installment configuration

---

# 26. OTP

OTP handling must include:

- Expiration
- Attempt limits
- Rate limiting
- Abuse protection
- Replay protection
- Secure storage/verification

Never store OTPs in plaintext when avoidable.

---

# 27. SESSION SECURITY

Sessions must be:

- Secure
- Expirable
- Revocable
- Device-aware where appropriate

Users should be able to manage active sessions when supported by the product plan.

---

# 28. SECRETS

Never commit:

- Passwords
- API keys
- Tokens
- Private keys
- Encryption secrets
- Database passwords
- Third-party credentials

to Git.

Use environment variables and approved secret management mechanisms.

If a secret is accidentally committed:

treat it as compromised.

---

# 29. INPUT VALIDATION

Validate all external input.

This includes:

- Forms
- API payloads
- URL parameters
- Query parameters
- File uploads
- Webhooks
- Third-party responses

Never trust the client.

---

# 30. SERVER-SIDE VALIDATION

Critical business rules must be validated server-side.

The frontend can improve UX.

The backend enforces truth.

---

# 31. API SECURITY

Every sensitive API must consider:

- Authentication
- Authorization
- Validation
- Rate limiting
- Idempotency
- Logging
- Error handling
- Abuse protection

---

# 32. ERROR MESSAGES

Do not expose sensitive internals to users.

Never send:

- Stack traces
- Database credentials
- SQL queries
- Internal secrets
- Private infrastructure details

to production clients.

---

# 33. ERROR HANDLING

Errors must be:

- Predictable
- Structured
- Logged appropriately
- Traceable

Use consistent error response formats.

---

# 34. LOGGING

Logs must be structured where practical.

Important events should contain appropriate context such as:

- Request ID
- Correlation ID
- User ID
- Resource ID
- Timestamp
- Action
- Result

Never log:

- Password
- OTP
- Private key
- Access token
- Full payment credentials
- Sensitive personal data unnecessarily

---

# 35. AUDIT LOGGING

Audit logs are required for important administrative and financial actions.

Audit records should be append-oriented and tamper-resistant according to the architecture.

---

# 36. KYC

KYC is sensitive.

KYC data must receive appropriate:

- Access control
- Encryption where required
- Audit logging
- Retention handling
- Secure storage
- Secure transport

Only authorized roles should access sensitive KYC information.

---

# 37. PERSONAL DATA

Only collect data that is actually required.

Avoid unnecessary storage of sensitive information.

Do not expose personal data through:

- Public URLs
- Client logs
- Analytics
- Debugging output
- Error messages

---

# 38. FILE UPLOADS

Treat uploaded files as untrusted.

Validate:

- MIME
- Size
- Extension
- Content
- Storage path

Do not execute uploaded files.

KYC/document uploads should use isolated and controlled storage.

---

# 39. SQL / DATABASE SECURITY

Never construct unsafe dynamic SQL.

Use the database abstraction safely.

Validate:

- IDs
- Filters
- Sorting
- Pagination
- Search

---

# 40. XSS

Escape untrusted content.

Special attention:

- User-generated content
- Blog
- Support tickets
- Admin-entered content
- Rich text

Never render arbitrary HTML without controlled sanitization.

---

# 41. CSRF

Use appropriate CSRF protections based on the selected authentication architecture.

---

# 42. RATE LIMITING

Implement rate limiting for sensitive operations such as:

- OTP requests
- Login
- Password recovery
- Withdrawals
- Trading
- API access
- Ticket spam
- Referral abuse

---

# 43. FRAUD AND ABUSE

Design architecture to detect or prevent:

- Self referral
- Multi-account abuse
- Repeated failed login
- Suspicious withdrawals
- Duplicate transactions
- Automation abuse
- Promotional abuse

Do not assume the frontend can prevent fraud.

---

# 44. DATABASE DESIGN

Database entities must represent the domain clearly.

Avoid giant tables that mix unrelated domains.

Prefer clear domain boundaries.

---

# 45. INDEXING

Add indexes based on actual query patterns.

Important areas:

- User lookup
- Transaction history
- Orders
- Ledger
- Notifications
- Tickets
- KYC status
- Referral
- Installments

Do not blindly index every field.

---

# 46. MIGRATIONS

Every schema change must have a proper migration.

Never manually edit production schema as a shortcut.

Before significant migration:

- Backup strategy
- Compatibility check
- Migration test
- Rollback consideration

---

# 47. API DESIGN

API contracts should be:

- Consistent
- Predictable
- Documented
- Versionable

Avoid random endpoint naming.

---

# 48. BUSINESS LOGIC LOCATION

Business rules must live in appropriate domain/service layers.

Do not bury critical logic inside:

- React components
- Pages
- Controllers
- Database triggers without justification

UI should orchestrate presentation.

Domain services should enforce business logic.

---

# 49. FRONTEND PRINCIPLES

Frontend should:

- Be componentized
- Avoid duplicated business logic
- Handle loading states
- Handle errors
- Handle empty states
- Support responsive layouts
- Be accessible

---

# 50. UI CONSISTENCY

Reuse the Design System.

Do not create five different styles for:

- Buttons
- Inputs
- Cards
- Modals
- Tables
- Alerts

without justification.

---

# 51. RESPONSIVE DESIGN

Every significant feature must work across:

- Desktop
- Tablet
- Mobile

Mobile is not merely a shrunken desktop.

---

# 52. PWA

PWA functionality should include, as applicable:

- Manifest
- Icons
- Service Worker
- Installability
- Cache strategy
- Offline fallback
- Update handling
- Push notifications

Do not use offline caching for sensitive financial state in a way that could display misleading balances.

### Financial Offline Operations (Zarnama Architecture)

No financial operation may be queued for offline execution.

The following must NOT be queued in IndexedDB or any offline store for later execution:

- Buy
- Sell
- Deposit
- Withdrawal
- Payment
- Installment Payment
- Investment Subscription
- Transfer
- Settlement

These operations must be online and server-authoritative.

Offline is allowed only for non-financial, safe-to-cache content:

- UI shell
- Non-sensitive cached content
- Draft (non-financial)
- Static content
- Preferences

Financial state must never be displayed as truth using offline data.

If offline, display a clear "connection required" state instead of a cached balance.

---

# 52.1 WEB + MOBILE TARGET ARCHITECTURE (Zarnama)

Zarnama uses a shared codebase with two build targets.

```text
Shared Codebase (src/)
      │
      ├── Web Target
      │    └── Next.js SSR / Web (production build)
      │
      └── Mobile Target
           └── Capacitor
               ├── Android
               └── iOS (V2)
```

Both targets must use the same backend API and shared business logic.

Do not assume:

```text
Next.js SSR Production Build = direct Capacitor App
```

### Authentication (Two Strategies, Same Domain)

Web:

```text
Secure HTTP-only session/cookie strategy
```

Mobile:

```text
Mobile-compatible token/session strategy with Secure Storage appropriate to Platform
```

Both must connect to a single shared authentication domain.

---

# 52.2 RATE LIMITS (Zarnama Architecture)

Rate limits must be configurable.

Do not hardcode values like:

```text
100/min
5/hour OTP
```

as business truth.

Rate limits must be stored in a configurable store (e.g., `RateLimitConfig` table) and adjustable by admin without code changes.

---

# 53. MOBILE SECURITY

The architecture must be future-ready for:

- Secure device sessions
- Biometric authentication
- Push authentication
- Deep links
- App-like navigation

without exposing secrets.

---

# 54. ACCESSIBILITY

Important interfaces should support:

- Semantic HTML
- Keyboard navigation
- Focus states
- Labels
- Accessible errors
- Adequate contrast
- Screen reader compatibility where practical

---

# 55. PERFORMANCE

Avoid unnecessary:

- Re-renders
- API requests
- Database queries
- Large bundles
- Large images
- Client-side data duplication

Performance optimization must not compromise correctness.

---

# 56. CACHING

Cache only data that is safe to cache.

Never blindly cache sensitive or rapidly changing financial state.

Clearly distinguish:

```text
Static Data
Semi-static Data
Dynamic Data
Financial State
```

---

# 57. FINANCIAL DATA CACHING

Do not allow stale cached data to appear as authoritative account balance.

For example:

A stale cache must never silently become:

"Your current gold balance is X."

Authoritative financial state must come from the correct source of truth.

---

# 58. TESTING

Tests are part of implementation.

At minimum use appropriate combinations of:

- Unit Tests
- Integration Tests
- E2E Tests
- Security Tests
- Regression Tests

---

# 59. FINANCIAL TESTING

Financial calculations require strong test coverage.

Test:

- Buy
- Sell
- Fees
- Spread
- Deposits
- Withdrawals
- Balance
- Ledger
- Referral
- Installments
- Investment
- Rounding
- Precision
- Concurrency
- Duplicate requests
- Failure recovery

---

# 60. EDGE CASES

Do not test only happy paths.

Test:

- Zero
- Negative input
- Maximum values
- Minimum values
- Decimal precision
- Insufficient balance
- Concurrent requests
- Duplicate requests
- Expired session
- Expired OTP
- Missing data
- Invalid data
- Network interruption
- Third-party failure

---

# 61. TEST DATA

Test data must be clearly isolated.

Never use production financial data for ordinary local development.

Never commit real user data into the repository.

---

# 62. E2E CRITICAL FLOWS

Critical flows should have E2E coverage when practical:

```text
Register
→ OTP
→ KYC
→ Account
→ Deposit
→ Buy Gold
→ View Balance
→ Sell Gold
→ Withdrawal
```

Also:

```text
Login
→ Dashboard
→ Ticket
→ Notification
```

and:

```text
Referral
→ Invite
→ Qualified Action
→ Commission
```

subject to the actual MegaPlan.

---

# 63. BUILD HEALTH

The main branch should remain buildable whenever reasonably possible.

Do not accumulate large amounts of broken work.

---

# 64. LINT AND TYPE SAFETY

Type safety should be enforced where the selected stack supports it.

Do not silence compiler errors with:

- unnecessary `any`
- ignore comments
- disabled lint rules

unless there is a documented reason.

---

# 65. NO COWBOY FIXES

Do not fix bugs by randomly changing unrelated code.

Find the root cause.

Prefer:

```text
Root Cause
→ Correct Fix
→ Test
```

over:

```text
Random Change
→ Hope
```

---

# 66. DEPENDENCIES

Every new dependency must provide clear value.

Before adding:

- Check existing alternatives
- Check project compatibility
- Consider maintenance
- Consider security
- Consider bundle impact

Avoid dependency bloat.

---

# 67. ARCHITECTURE DECISIONS

Major decisions must be documented.

Examples:

- Framework choice
- Database architecture
- Authentication strategy
- Ledger design
- Queue architecture
- Payment architecture
- PWA architecture
- Mobile strategy

Record them in:

`docs/ARCHITECTURE_DECISIONS.md`

---

# 68. ARCHITECTURE CHANGES

If implementation reveals that MegaPlan's architecture is flawed:

Do not silently rewrite it.

Document:

- Existing decision
- Problem discovered
- Evidence
- Proposed change
- Alternatives
- Impact
- Migration strategy

Then update relevant documentation.

---

# 69. REFACTORING

Refactor when:

- Duplication is harmful
- Complexity is excessive
- Security requires it
- Performance requires it
- Maintainability requires it

Do not refactor for style alone in the middle of unrelated feature work.

---

# 70. TECHNICAL DEBT

Do not hide technical debt.

If debt is intentionally accepted:

record:

- What
- Why
- Impact
- Suggested fix
- Priority

---

# 71. DOCUMENTATION

Documentation must evolve with the code.

Important changes should update relevant documentation during implementation, not months later.

---

# 72. GIT

Use meaningful commits.

Examples:

```text
feat(auth): implement otp login
feat(ledger): add immutable gold ledger
feat(trading): implement buy order flow
feat(pwa): add installable manifest
fix(wallet): prevent duplicate withdrawal
test(finance): add ledger concurrency tests
refactor(pricing): centralize price calculation
docs(architecture): document ledger strategy
```

---

# 73. COMMIT QUALITY

Avoid commits such as:

```text
stuff
changes
fix
update
final
new
test
```

Commit messages should explain intent.

---

# 74. BRANCHING

Follow the repository's established Git workflow.

Do not create unnecessary branches if the Agent environment uses a direct branch workflow.

Never rewrite history unless explicitly required.

---

# 75. NO DESTRUCTIVE COMMANDS WITHOUT REASON

Avoid destructive operations such as:

- deleting databases
- force resetting branches
- dropping important data
- overwriting production configuration

unless explicitly required and safely controlled.

---

# 76. ENVIRONMENT MANAGEMENT

Keep:

```text
development
staging
production
```

configuration conceptually separated.

Never assume development credentials can be used in production.

---

# 77. DEPLOYMENT

Deployment must be repeatable.

Prefer:

```text
Code
→ Build
→ Test
→ Deploy
```

rather than undocumented manual procedures.

---

# 78. OBSERVABILITY

Production systems need visibility into:

- Errors
- Performance
- API health
- Database health
- Background jobs
- Notifications
- Financial operations

---

# 79. BACKGROUND JOBS

When asynchronous processing is required:

use a reliable queue/job architecture.

Examples:

- Notifications
- Emails
- SMS
- Reports
- Reconciliation
- Scheduled installment reminders
- Analytics processing

Do not use fragile `setTimeout`-style application logic as a substitute for reliable jobs.

---

# 80. WEBHOOKS

Treat all incoming webhooks as untrusted.

Verify:

- Signature
- Source
- Event ID
- Timestamp where applicable

Implement idempotent processing.

---

# 81. THIRD-PARTY SERVICES

Third-party systems can fail.

Always consider:

- Timeout
- Retry
- Backoff
- Failure handling
- Idempotency
- Monitoring

Never assume external APIs are always available.

---

# 82. PAYMENT INTEGRATION

Payment flow must account for:

- Pending
- Success
- Failure
- Callback
- Duplicate callback
- Timeout
- Reconciliation

Never treat a client-side success screen as proof of payment.

---

# 83. RECONCILIATION

Financial systems should support reconciliation between:

- Internal ledger
- Payment provider
- Operational inventory
- Other external systems

Any mismatch should be detectable.

---

# 84. ADMIN OVERRIDES

Admin correction functionality must be heavily controlled.

Do not provide unrestricted:

```text
edit balance
```

functionality.

Prefer controlled correction workflows with audit trails.

---

# 85. USER EXPERIENCE

Financial actions should communicate clearly:

- What will happen
- Amount
- Gold quantity
- Fees
- Price
- Final result
- Status

Avoid ambiguous confirmations.

---

# 86. TRANSACTION CONFIRMATION

Before critical actions, show a review step where appropriate.

For example:

```text
Gold quantity
Gold price
Fee
Total
Destination
Final confirmation
```

---

# 87. MOBILE UX

On mobile:

- Important actions should be reachable
- Touch targets should be usable
- Tables should adapt
- Charts should remain readable
- Navigation should be simple
- Critical confirmations should be clear

---

# 88. DESIGN LANGUAGE

Zarnama visual identity:

Primary palette:

- Navy
- Gold
- Cream

Design direction:

- Premium
- Elegant
- Modern
- Financial
- High Trust
- Clean
- Sophisticated

Avoid unnecessary visual noise.

---

# 89. NO COPIED BRANDING

Do not directly copy:

- Competitor logos
- Proprietary illustrations
- Exact layouts
- Text
- Branding
- Assets
- Protected content

Benchmark competitors for product behavior and UX patterns only.

---

# 90. SEO

Public pages should consider:

- Metadata
- Canonical
- Sitemap
- Robots
- Structured Data
- Open Graph
- Internal links
- Performance

Do not expose private account pages to search engines.

---

# 91. ANALYTICS

Analytics must respect privacy and security.

Never send sensitive financial information unnecessarily to analytics services.

Avoid sending:

- Exact balances
- OTP
- Password
- Full identity data
- Private transaction data

unless explicitly required and properly designed.

---

# 92. FEATURE FLAGS

Feature flags can be used where appropriate.

They should not become permanent undocumented complexity.

Every important flag should have:

- Purpose
- Owner/context
- Default behavior
- Removal plan

---

# 93. LOCALIZATION

Persian/Farsi UI must be considered carefully.

Pay attention to:

- RTL
- Persian typography
- Number formatting
- Currency formatting
- Date formatting
- Mobile RTL interactions
- Mixed Latin/Persian text

The system should not accidentally break because of RTL layouts.

---

# 94. INTERNATIONALIZATION READINESS

Even if the first release is Persian-first, avoid architecture that makes future localization impossible.

UI text should not be scattered unnecessarily through business logic.

---

# 95. DATE AND TIME

Never rely blindly on local machine time for critical business logic.

Use a consistent server-side time strategy.

Store timestamps consistently.

Display dates according to user locale.

---

# 96. TIME-SENSITIVE FINANCIAL OPERATIONS

Price and order validity must be explicit.

Do not assume a quote remains valid forever.

Where applicable define:

- Quote timestamp
- Expiration
- Execution status
- Settlement status

---

# 97. SECURITY FIRST IN FINANCIAL FLOWS

For every critical financial flow, ask:

```text
Can this be duplicated?
Can this be replayed?
Can this be forged?
Can this race?
Can this be reversed?
Can this be audited?
Can this fail halfway?
```

If any answer is unclear, investigate before marking the feature complete.

---

# 98. WHEN A REQUIREMENT IS MISSING

Use the following decision tree:

```text
Is it cosmetic?
    ↓ YES
Choose sensible default.

Is it technical but reversible?
    ↓ YES
Choose sensible implementation and document.

Does it change business behavior?
    ↓ YES
Mark DECISION REQUIRED.

Does it affect financial correctness/security?
    ↓ YES
Stop the affected decision and document clearly.
Continue unrelated work when safe.
```

---

# 99. AGENT COMMUNICATION

Progress reports should be concise and factual.

After meaningful work, report:

```text
Current Phase
Completed Tasks
Tests
Issues
Decisions
Next Step
```

Do not exaggerate progress.

---

# 100. WHEN SOMETHING FAILS

Never hide failures.

Use:

```text
FAILURE
Root Cause
Impact
Fix
Validation
```

Then update project status.

---

# 101. BLOCKED TASKS

If blocked:

mark:

`BLOCKED`

and document:

- Blocker
- Why
- What depends on it
- What can continue independently

Do not pretend it is complete.

---

# 102. PARTIAL IMPLEMENTATION

If a task is partially complete:

use:

`PARTIALLY_IMPLEMENTED`

not:

`DONE`

---

# 103. ACCEPTANCE CRITERIA

Every major feature must be validated against its Acceptance Criteria from `MEGAPLAN.md`.

Passing tests alone is not enough if acceptance requirements are unmet.

---

# 104. REGRESSION RULE

Every significant feature must be evaluated against existing functionality.

Do not fix one feature by breaking another.

---

# 105. CLEANUP

Remove:

- Dead code
- Debug statements
- Temporary files
- Unused imports
- Unused dependencies
- Fake data accidentally left behind

before completing relevant work.

---

# 106. SECURITY CLEANUP

Before production:

search the repository for:

- secrets
- API keys
- tokens
- debug credentials
- test credentials
- accidental personal data

---

# 107. FINAL PROJECT AUDIT

At the end of the project compare the implementation against:

`MEGAPLAN.md`

Generate a complete matrix:

```text
Requirement
Status
Implementation
Tests
Documentation
Notes
```

No requirement should remain unclassified.

---

# 108. PRODUCTION READINESS CHECK

Before production readiness:

verify:

- Build
- Database
- Migrations
- Environment variables
- Security
- Authentication
- Authorization
- Ledger
- Pricing
- Financial flows
- Notifications
- Admin
- PWA
- Responsive UI
- Error handling
- Logging
- Monitoring
- Backups
- Recovery
- Testing
- Documentation

---

# 109. FINAL RULE

The Agent must never optimize for the appearance of progress.

Optimize for real progress.

A feature that looks finished but is financially unsafe, untested, insecure, or architecturally broken is NOT complete.

---

# 110. THE GOLDEN RULE

For every change ask:

```text
Is it correct?
Is it secure?
Is it testable?
Is it maintainable?
Is it documented?
Does it respect the architecture?
Does it preserve financial integrity?
Does it work on mobile?
Could it break an existing feature?
```

If the answer is not satisfactory:

do not mark the task complete.

---

# 111. EXECUTION COMMAND

When execution begins:

```text
READ:
- AGENTS.md
- MEGAPLAN.md
- docs/EXECUTION_STATUS.md

INSPECT:
- Repository
- Existing Architecture
- Existing Tests

EXECUTE:
- First valid Phase

VERIFY:
- Tests
- Security
- Acceptance Criteria

DOCUMENT:
- Decisions
- Changes
- Phase Report

COMMIT:
- Clean logical commit

UPDATE:
- Execution Status

CONTINUE:
- Next valid Phase
```

---

# 112. FINAL AUTHORITY

In case of conflict:

### Security issue

Security takes priority.

### Financial integrity issue

Financial correctness takes priority.

### Existing architecture conflict

Follow documented architecture unless a change is justified.

### Ambiguous requirement

Document the ambiguity.

### Cosmetic decision

Choose a consistent solution.

### MegaPlan contradiction

Do not silently override it.

---

# 113. PROJECT SUCCESS DEFINITION

Zarnama is successful only when it becomes a:

- Secure
- Reliable
- Auditable
- Scalable
- Maintainable
- Responsive
- Mobile-ready
- PWA-capable
- Production-grade

financial platform.

Not merely a website.

Not merely a demo.

Not merely a collection of pages.

It must be a coherent software product.

---

# END OF AGENTS.md

# AGENTS.md — راهنمای Agent توسعه پروژه زرنما

> این فایل قوانین و دستورالعمل‌های کلی برای هر Agent که روی پروژه «زرنما» کار می‌کند را تعریف می‌کند.

---

## قوانین کلی

### زبان و متن

- **فارسی صحبت کن**: تمام تعاملات با کاربر به زبان فارسی باشد.
- **کامنت‌ها فارسی**: تمام کامنت‌های داخل کد به زبان فارسی نوشته شوند.
- **لاگ‌ها انگلیسی**: تمام پیام‌های لاگ (console.log، logger.info و ...) به زبان انگلیسی باشند.
- **از بهم چسبوندن کلمات فارسی خودداری کن**: مثلاً «شبکه‌سازی» را جدا بنویس «شبکه سازی». «می‌توانم» را درست بنویس نه «می‌تواتم».

### نسخه‌های دسکتاپ و موبایل

- **هر تغییری که ایجاد می‌کنی هم برای نسخه دسکتاپ و هم برای نسخه گوشی انجام بده**.
- تغییرات باید در دو نسخه هماهنگ باشند.
- طراحی responsive و PWA از ابتدا لحاظ شود.

### پنل ادمین

- **بخش ادمین فقط نسخه فارسی می‌خواهد**.
- تغییرات یا ویژگی‌هایی که در بخش ادمین اعمال می‌شود نیازمند نسخه انگلیسی اصلاً نیست و فقط فارسی عالی است.

### جابجایی و ایجاد فایل‌ها

- جابجایی، ایجاد یا تغییرات همگی باید در دو نسخه دسکتاپ و گوشی هماهنگ باشند.

### نحوه پیشبرد کار

- **کارهارو مرحله به مرحله پیش ببر**.
- **حتما برای تمامی کارها todo list ایجاد کن**.
- بعد از اتمام کار توضیح خیلی زیاد نده و فقط توضیحات مهم برای اجرای درست و یا کاری اگر نیازه خودم انجام بدم رو بهم بگو.

### دسترسی و امنیت

- **هیچ مشکلی در تغییر دیتا و دیتابیس و اسکیما و موارد امنیتی تو نداری**.
- فقط منظورم اینه کدنویسی امنی انجام بده که بعدا دچار حمله نشیم.
- وگرنه قدرت اختیار تام داری توی همه چیز.

---

## مرجع اصلی پروژه

فایل اصلی معماری و اجرای پروژه: **`MEGAPLAN.md`**

پرامپت اجرای پروژه: **`EXECUTION-MASTER-PROMPT.md`**

هر Agent قبل از شروع کار باید هر دو فایل را به طور کامل بخواند.

---

## استک تکنولوژی (قطعی)

| بخش        | تکنولوژی                                                              |
| ---------- | --------------------------------------------------------------------- |
| فرانت      | Next.js 15 (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui |
| موبایل     | PWA کامل + Capacitor (Android native-ready, iOS PWA)                  |
| بک‌اند     | Next.js Route Handlers (تک پروژه)                                     |
| ORM/DB     | PostgreSQL + Prisma                                                   |
| کش/صف      | Redis (ioredis) + BullMQ                                              |
| Real-time  | Socket.io                                                             |
| احراز هویت | JWT (access + refresh) httpOnly cookie + OTP + 2FA                    |
| زبان/RTL   | فارسی RTL                                                             |
| رنگ        | Navy `#1a2a4f`، Gold `#c9a227`، Cream `#f5ecd7`                       |

---

## Definition of Done

هر Feature زمانی Done است که:

- [ ] کدنویسی شده و review شده
- [ ] Unit + integration test نوشته و pass
- [ ] E2E برای جریان کلیدی pass
- [ ] Responsive در ۳ breakpoint تست شده
- [ ] Loading state + skeleton پیاده شده
- [ ] Error state + retry پیاده شده
- [ ] Empty state طراحی شده
- [ ] Accessibility (WCAG AA) رعایت شده
- [ ] Security review شده
- [ ] Audit log برای عملیات حساس
- [ ] Documentation به‌روز شده
- [ ] Lighthouse score > ۹۰
- [ ] لاگ‌گذاری مناسب
- [ ] Acceptance Criteria همه pass
- [ ] در staging تست شده

---

## ساختار پوشه‌ها

```
zarnama/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (landing)/        # لندینگ پیج
│   │   ├── (auth)/           # ورود/ثبت‌نام/OTP
│   │   ├── (dashboard)/      # پنل کاربری
│   │   ├── (admin)/          # پنل ادمین
│   │   └── api/v1/           # API routes
│   ├── components/           # کامپوننت‌ها
│   ├── lib/                  # services, utils, validators
│   ├── hooks/
│   ├── stores/               # zustand
│   └── types/
├── prisma/
├── public/
├── capacitor/
├── tests/
├── docs/
└── MEGAPLAN.md
```

---

## قوانین Git

- پیام commit به فارسی
- قبل از commit حتماً `git status` را بررسی کن
- هرگز بدون اجازه push نکن
- هرگز فایل‌های `.env` را commit نکن
- از Co-Authored-By Devin در commit استفاده کن

---

## PERMANENT USER NAVIGATION

Navigation اصلی User Panel یک **قرارداد دائمی محصول** است — دقیقاً ۵ مقصد با این ترتیب ثابت:

1. خانه → `/dashboard`
2. معاملات → `/dashboard/trade`
3. دارایی → `/dashboard/assets`
4. قسطی → `/dashboard/installments`
5. پروفایل → `/dashboard/profile`

قوانین:

- Desktop (sidebar) و Mobile (bottom nav) یک Information Architecture مشترک دارند.
- Source of Truth واحد: `src/config/navigation.ts` — hardcode navigation در کامپوننت‌ها ممنوع.
- اعلان‌ها، پشتیبانی، جستجو و هشدارهای امنیتی nav item جدید نمی‌شوند — از Header، Profile یا Contextual Actions در دسترس‌اند.
- صفحات فرعی (امنیت، نشست‌ها، معرفی، پشتیبانی) زیر `/dashboard/profile/*` هستند.
- تغییر این قرارداد فقط با ADR رسمی جدید مجاز است — مرجع: `docs/ARCHITECTURE_DECISIONS.md` (ADR-015).
- تست E2E «Navigation Contract» در `tests/e2e/panel.spec.ts` از تغییر ناخواسته جلوگیری می‌کند.

## PERMANENT ZARNAMA DESIGN LANGUAGE

> امضای بصری زرنما: **«Luxury Private Banking for Gold»**
> قانون دائمی برای همه Agentها، همه Phaseها، همه UIها (User Panel، Admin، Landing، PWA، Android/iOS آینده). مرجع: `docs/ARCHITECTURE_DECISIONS.md` (ADR-016) — tokens: `src/app/globals.css` — preview: `/design-system`

### ۱. اولویت رنگ (ترتیب ثابت)

1. **Navy → Primary/Dominant** — Canvas اصلی همه UI (`navy-950…100`)
2. **Gold → Luxury Accent/Action** — CTA، nav فعال، متریک‌های مهم، قیمت طلا، focus
3. **Cream → Supporting Accent** — فقط text روی navy، highlight، warmth — رنگ اصلی UI نیست
4. **Neutral → Text/Border/Secondary**

### ۲. Dark/Navy-First

- حالت اصلی و Premium برند **dark/navy** است (`:root` = navy، `<html class="dark">`)
- Light Mode فقط opt-in با کلاس `.light` و همچنان navy-primary (نه cream-first)
- لایه‌های navy: app background → sidebar → card → elevated → modal → input — عمق واقعی، نه `#000`

### ۳. قواعد استفاده

- **Gold:** فقط CTA، active nav، متریک مهم، قیمت، border خاص، micro-interaction، focus — کنترل‌شده؛ glow ظریف فقط برای hover/CTA/active؛ Gold gradient فقط CTA/Hero/highlight مهم
- **Cream:** text روی navy، highlight، subtle accent — هرگز background پیش‌فرض
- **Cards:** navy surface + subtle border + gold accent محدود + controlled shadow — نه سفید، نه بیش از حد گرد، نه SaaS-like
- **Buttons:** Primary = Gold روی Navy · Secondary = Navy/transparent + gold border · Danger = red کنترل‌شده · Success = financial green
- **Sidebar/Bottom Nav:** navy background + gold active + cream/neutral inactive — حس Private Banking، نه Admin Template
- **Charts:** primary=gold، secondary=cream/neutral، positive=green، negative=red، grid=نوی کم‌کنتراست
- **Financial Numbers:** dominant — cream/gold/bright-neutral با tabular-nums
- **Loading/Empty/Error:** navy-first — skeleton navy + gold highlight ظریف؛ error با controlled red نه قرمز سراسری
- **Glassmorphism:** فقط navy-glass + gold border در صورت نیاز واقعی — نه زبان اصلی

### ۴. Anti-Patterns (ممنوع)

white-first UI · cream-first UI · rainbow dashboard · neon crypto styling · excessive glassmorphism/gold/gradient/glow · generic Bootstrap/SaaS dashboard · کپی UI رقبا · style تصادفی در کامپوننت

### ۵. قانون اجرا

- همه تصمیم‌ها **token-based** از `globals.css` — hardcode رنگ/radius/shadow در کامپوننت ممنوع
- تغییر بنیادی در رنگ/typography/animation/navigation فقط با ADR رسمی
- هر Feature جدید قبل از Done: آیا navy غالب است؟ gold فقط accent؟ cream فقط supporting؟ شبیه template نیست؟ mobile/desktop یک زبان؟
- اگر بین «UI روشن کرمی» و «UI عمیق navy با gold/cream» مردد بودی → **گزینه navy صحیح است**
