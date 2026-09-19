ZAR30 — EXECUTION MASTER PROMPT
تو اکنون وارد مرحله EXECUTION پروژه «زرسی» شده‌ای.
در Workspace پروژه یک فایل اصلی به نام:
`MEGAPLAN.md`
وجود دارد.
این فایل Source of Truth اصلی پروژه است.
وظیفه تو این است که MegaPlan را به یک محصول واقعی، Production-Ready و قابل استفاده تبدیل کنی.
دستور اصلی
از این لحظه:
دیگر Planning مجدد انجام نده.
MegaPlan را دوباره نویسی نکن.
بدون دلیل معماری را تغییر نده.
مستقیماً وارد Execution شو.
تمام تصمیمات اصلی محصول، Architecture، Featureها، Database، API، Security، UX و Roadmap باید بر اساس `MEGAPLAN.md` اجرا شوند.
هر جا MegaPlan مبهم، متناقض یا ناقص بود:
ابتدا مسئله را در Context پروژه بررسی کن.
از تصمیمات قبلی پروژه استفاده کن.
ساده‌ترین و امن‌ترین تصمیم سازگار با Architecture را انتخاب کن.
تصمیم را در Documentation ثبت کن.
MegaPlan را در بخش Change Log به‌روزرسانی کن.
سپس اجرای پروژه را ادامه بده.
برای مشکلاتی که قابل حل هستند، پروژه را متوقف نکن و منتظر سؤال از من نباش.
فقط برای تصمیماتی که واقعاً روی Business Model، Legal Compliance، Financial Logic یا Architecture اصلی اثر غیرقابل برگشت دارند موضوع را با برچسب:
`DECISION REQUIRED`
ثبت کن.

1. قبل از شروع Execution
   ابتدا Workspace را بررسی کن.
   موارد زیر را شناسایی کن:

- فایل‌های موجود
- Source Code
- package.json
- lockfile
- environment files
- Database
- Prisma
- migrations
- API
- frontend
- backend
- components
- tests
- documentation
- Git repository
- existing deployment configuration
  سپس مشخص کن:
  `PROJECT_STATE`
  یکی از این حالت‌ها:
- EMPTY
- PARTIAL
- EXISTING APPLICATION
- BROKEN APPLICATION
- MIGRATION REQUIRED
  اگر پروژه از قبل وجود دارد، بدون بررسی آن را از صفر بازنویسی نکن.

2. خواندن MegaPlan
   قبل از اولین تغییر کد:
   کل `MEGAPLAN.md` را بخوان.
   سپس:

- Phaseها
- Taskها
- Dependencyها
- Architecture
- Tech Stack
- Database
- API
- Security
- UI/UX
- Mobile/PWA
- Testing
- Deployment
  را استخراج و در Execution State پروژه ثبت کن.
  یک فایل ایجاد/به‌روزرسانی کن:
  `docs/EXECUTION_STATUS.md`
  این فایل باید وضعیت اجرای پروژه را نگه دارد.

3. Execution State
   برای هر Phase وضعیت مشخص داشته باش:

- NOT_STARTED
- IN_PROGRESS
- BLOCKED
- TESTING
- QA
- DONE
  برای هر Task:
- TODO
- IN_PROGRESS
- DONE
- BLOCKED
- SKIPPED
  هیچ Taskی را فقط به دلیل اینکه کد آن نوشته شده `DONE` نکن.
  یک Task زمانی DONE است که:
- Implementation کامل باشد.
- Tests مناسب نوشته شده باشند.
- Testها Pass شده باشند.
- Error Handling وجود داشته باشد.
- Security بررسی شده باشد.
- Responsive behavior بررسی شده باشد.
- Documentation در صورت نیاز تکمیل شده باشد.
- Acceptance Criteria پاس شده باشد.

4. قانون اجرای Phaseها
   پروژه را Phase-by-Phase اجرا کن.
   ترتیب:
   `Phase N`
   → Analyze dependencies
   → Implement
   → Test
   → Fix
   → Security Check
   → Integration Check
   → Acceptance Criteria
   → Documentation
   → Update Checklist
   → Mark DONE
   → Commit
   → سپس Phase بعدی
   هیچ‌وقت چند Phase اصلی را بدون تکمیل Quality Gate به‌صورت بی‌نظم اجرا نکن.
5. Parallel Execution
   در داخل هر Phase، Taskهایی که Dependency ندارند را در صورت امکان Parallel انجام بده.
   اما:

- Database Foundation
- Authentication Foundation
- Ledger
- Financial Core
- Security Core
- API Contract
  را بدون بررسی Dependency به‌صورت موازی تغییر نده.
  اولویت همیشه:
  `Correctness > Security > Data Integrity > Maintainability > Performance > Speed`
  است.

6. Architecture Rules
   Architecture موجود در MegaPlan را حفظ کن.
   هیچ Framework یا Technology جدیدی صرفاً به خاطر اینکه جدیدتر است اضافه نکن.
   قبل از اضافه کردن Dependency جدید:
   بررسی کن:

- آیا واقعاً لازم است؟
- آیا قابلیت موجود پروژه آن را پوشش نمی‌دهد؟
- آیا Bundle Size را افزایش می‌دهد؟
- آیا Security Risk دارد؟
- آیا Maintenance Cost دارد؟
- آیا روی Web/PWA/Mobile تأثیر می‌گذارد؟
- آیا با Stack موجود سازگار است؟
  اگر Dependency جدید ضروری بود:
  در:
  `docs/ARCHITECTURE_DECISIONS.md`
  ثبت کن:
- Problem
- Solution
- Why
- Alternatives
- Trade-offs

7. Project Structure
   ساختار پروژه باید:

- Modular
- Domain-Driven
- Maintainable
- Scalable
- Testable
  باشد.
  Featureهای اصلی را تا حد امکان از یکدیگر جدا نگه دار.
  Business Logic را مستقیماً داخل UI Componentها قرار نده.
  برای بخش‌های مالی، Business Logic باید در Service/Domain Layer قابل استفاده مجدد باشد.

8. Web + PWA + Mobile
   زرسی باید از ابتدا با این اصل ساخته شود:
   `One Backend + Shared Business Logic + Responsive Web + PWA`
   طراحی باید به گونه‌ای باشد که بعداً Android و iOS بتوانند از همان API و منطق کسب‌وکار استفاده کنند.
   Responsive بودن کافی نیست.
   Mobile UX باید واقعاً بررسی شود.
   تمام Screenهای مهم را برای:

- Desktop
- Tablet
- Mobile
  در نظر بگیر.

9. UI / UX EXECUTION
   طراحی UI باید بر اساس Design System پروژه باشد.
   Style کلی:

- Premium
- Luxury
- Financial
- Modern
- Trustworthy
- Clean
  رنگ‌های اصلی:
- Navy
- Gold
- Cream
  ولی فقط از این رنگ‌ها به‌صورت محدود و حرفه‌ای استفاده کن.
  از شلوغی غیرضروری جلوگیری کن.
  تمام صفحات باید Stateهای زیر را داشته باشند:
- Loading
- Empty
- Success
- Error
- Disabled
- Offline در صورت نیاز
- Permission Restricted

10. Landing Page
    Landing Page باید واقعاً Production-Grade باشد.
    شامل مواردی مانند:

- Hero
- Live Gold Price
- CTA
- Benefits
- How It Works
- Trust
- Security
- Features
- Installment
- Investment
- Referral
- FAQ
- Footer
- Legal Links
  باشد.
  Landing Page باید:
- Responsive
- SEO Friendly
- Fast
- Accessible
  باشد.

11. Authentication
    Authentication را از ابتدا اصولی پیاده کن.
    موارد:

- Login
- Register
- OTP
- Session
- Refresh
- Logout
- Device Session
- Rate Limit
- Failed Login Protection
- Password Security
- Account Recovery
  را طبق MegaPlan اجرا کن.
  Authentication را به شکل قابل توسعه برای Mobile نیز طراحی کن.

12. KYC
    KYC را با State Machine مشخص پیاده کن.
    حداقل Statusهای منطقی مانند:

- NOT_STARTED
- IN_PROGRESS
- SUBMITTED
- UNDER_REVIEW
- APPROVED
- REJECTED
- NEEDS_RESUBMISSION
  را طبق MegaPlan اجرا کن.
  هر تغییر Status باید قابل Audit باشد.

13. Financial Core
    این بخش از کل پروژه حیاتی است.
    هیچ‌گاه موجودی کاربر را با یک عدد ساده و بدون Ledger قابل اتکا مدیریت نکن.
    ساختار مالی باید از:

- Immutable Transactions
- Ledger
- Balance Calculation
- Idempotency
- Concurrency Control
- Transaction Atomicity
- Auditability
  پشتیبانی کند.
  هر عملیات مالی باید Traceable باشد.
  مثلاً:
  Deposit
  → Transaction
  → Ledger
  → Balance
  → Notification
  → Audit
  باید Flow مشخص داشته باشد.

14. Gold Trading Engine
    برای:

- Buy
- Sell
- Quote
- Price
- Fee
- Spread
- Order
- Execution
- Settlement
  Architecture مشخص ایجاد کن.
  قیمت‌ها و محاسبات مالی را Hardcode نکن.
  Pricing باید قابل مدیریت و کنترل باشد.

15. Precision
    در محاسبات مالی:
    از Floating Point برای منطق حساس مالی استفاده نکن.
    مقدارهای مالی باید با Decimal / Fixed Precision / Integer Minor Units یا روش مناسب دیگری مدیریت شوند.
    Precision قواعد:

- Gold Weight
- Gold Price
- Rial Amount
- Fee
- Profit
- Installment
- Commission
  باید واضح باشند.

16. Idempotency
    تمام APIهای حساس مانند:

- Deposit
- Withdrawal
- Buy
- Sell
- Payment
- Installment Payment
  باید در برابر Duplicate Request محافظت شوند.
  در صورت Retry:
  نباید یک عملیات مالی دو بار ثبت شود.

17. Concurrency
    Race Conditionها را جدی بگیر.
    خصوصاً در:

- Balance
- Gold Inventory
- Orders
- Withdrawal
- Reservation
- Payment
- Installment
  از روش‌های مناسب Database Transaction / Lock / Atomic Update استفاده کن.

18. Admin Panel
    Admin Panel را یک محصول مستقل در نظر بگیر.
    Admin نباید صرفاً چند صفحه CRUD داشته باشد.
    باید:

- Permission
- Role
- Audit
- Search
- Filter
- Bulk Actions
- Reports
- Security
  داشته باشد.
  هر Action حساس Admin باید Audit شود.
  مثلاً:
- تغییر قیمت
- تغییر Fee
- Approve KYC
- تغییر Balance
- Approve Withdrawal
- تغییر Investment Plan
- تغییر Installment Plan

19. RBAC
    Role-Based Access Control را از ابتدا دقیق پیاده کن.
    Permissionها را به صورت granular طراحی کن.
    مثلاً:
    `users.read`
    `users.update`
    `kyc.review`
    `withdrawals.approve`
    `pricing.update`
    `ledger.read`
    `reports.read`
    و غیره.
    Super Admin نباید تنها راه کنترل دسترسی باشد.
20. Security Execution
    Security را به پایان پروژه موکول نکن.
    در تمام مراحل بررسی کن:

- Authentication
- Authorization
- Input Validation
- Rate Limiting
- Secure Cookies
- CSRF
- XSS
- SQL Injection
- SSRF
- File Upload
- Secrets
- Session Security
- API Security
- Admin Security
  هر Vulnerability مهم را قبل از ادامه Phase برطرف کن.

21. Secrets
    هیچ‌وقت:

- API Key
- Token
- Password
- Secret
- Private Credential
  را داخل Source Code قرار نده.
  از Environment Variables و Secret Management مناسب استفاده کن.
  فایل‌های Secret نباید وارد Git شوند.

22. Database
    هر Database Change باید:

- Migration
- Validation
- Compatibility Review
  داشته باشد.
  Migration مخرب را بدون Strategy مناسب انجام نده.
  برای Production Migration:
- Backup
- Migration
- Verification
- Rollback Strategy
  را در نظر بگیر.

23. Prisma
    اگر Prisma در MegaPlan انتخاب شده:
    Database Schema را منظم و Modular نگه دار.
    قبل از هر Migration:

- بررسی Relationها
- Indexها
- Constraintها
- Query Performance
  را انجام بده.
  از ایجاد Queryهای سنگین بدون Index جلوگیری کن.

24. API
    APIها باید:

- Consistent
- Versionable
- Validated
- Documented
- Secure
  باشند.
  Response Formatها را استاندارد نگه دار.
  Error Responseها نیز Structure مشخص داشته باشند.

25. Error Handling
    هیچ‌وقت Errorها را:

- Silent
- Generic
- Unlogged
  رها نکن.
  هر Error مهم باید:
- قابل تشخیص
- قابل Log
- قابل Trace
- قابل Debug
  باشد.
  اما اطلاعات حساس را به Client نده.

26. Logging
    Logging باید Structured باشد.
    برای Eventهای حساس:

- User ID
- Request ID
- Correlation ID
- Timestamp
- Action
- Result
  در صورت مناسب بودن ثبت شود.
  اطلاعات حساس مثل Password یا Secret را Log نکن.

27. Notifications
    Notification Engine را مستقل و قابل توسعه بساز.
    کانال‌ها:

- In-App
- Push
- SMS
- Email
  باید تا حد امکان از یک Notification Abstraction مشترک استفاده کنند.
  Notificationها باید:
- Retryable
- Trackable
- Template-based
  باشند.

28. Referral
    Referral Attribution باید قابل اعتماد باشد.
    در برابر:

- Self Referral
- Abuse
- Duplicate Accounts
- Fraud
  محافظت کن.
  Commissionها باید Ledger / Transaction Trace داشته باشند.

29. Installment
    Installment Engine را طوری بساز که:

- Plan
- Contract
- Schedule
- Payment
- Late
- Reminder
- Settlement
  قابل مدیریت باشند.
  محاسبات مالی باید تست بسیار دقیق داشته باشند.

30. Investment
    Investment Module باید:

- Plan
- Subscription
- Position
- Profit
- Settlement
- Maturity
  را طبق MegaPlan مدیریت کند.
  هیچ ادعای مالی یا بازدهی را بدون منطق و داده پشتیبان نمایش نده.

31. Testing Rule
    هر Feature مهم:
    هم‌زمان با پیاده‌سازی Test شود.
    منتظر پایان پروژه نمان.
    حداقل در صورت نیاز:

- Unit
- Integration
- E2E
  را ایجاد کن.

32. Test Pyramid
    تمرکز اصلی:
    Unit Tests
    سپس:
    Integration Tests
    و سپس:
    E2E Tests
    باشد.
    Testهای E2E را برای مسیرهای حیاتی بنویس.
33. Financial Test Suite
    یک مجموعه تست اختصاصی برای امور مالی ایجاد کن.
    حداقل سناریوها:

- Buy
- Sell
- Deposit
- Withdrawal
- Fee
- Profit
- Referral
- Installment
- Balance Update
- Duplicate Request
- Concurrent Requests
- Rollback
- Failed Payment
- Partial Failure

34. Security Testing
    قبل از Done کردن بخش‌های حساس، تست کن:

- Unauthorized access
- Horizontal privilege escalation
- Vertical privilege escalation
- Rate limit
- Session abuse
- Invalid tokens
- Malformed input
- Duplicate requests
- IDOR
- Injection vectors

35. Responsive Testing
    تمام صفحات مهم را حداقل در:

- Desktop
- Tablet
- Mobile
  بررسی کن.
  Layout نباید فقط در Browser Desktop خوب باشد.

36. PWA
    PWA باید واقعاً Production-Grade باشد.
    بررسی کن:

- Manifest
- Icons
- Service Worker
- Installability
- Cache Strategy
- Offline Fallback
- Update Strategy
- Push Notifications
- Safe Area
- Mobile UX

37. Performance
    برای هر بخش مهم بررسی کن:

- Rendering
- Bundle
- API latency
- DB queries
- Image size
- Caching
  و از Performance Regression جلوگیری کن.

38. SEO
    Landing و صفحات Public باید:

- Metadata
- Canonical
- Sitemap
- Robots
- Structured Data
- OG
  داشته باشند.

39. Accessibility
    در UI موارد زیر را رعایت کن:

- Keyboard Navigation
- Focus States
- Semantic HTML
- Labels
- Contrast
- Error Messages
- Screen Reader Basics

40. Git Strategy
    هر Phase اصلی باید Commitهای منطقی داشته باشد.
    Commit Messageها واضح باشند.
    مثلاً:
    `feat(auth): implement otp authentication`
    `feat(wallet): add immutable ledger`
    `fix(trading): prevent duplicate order execution`
    `test(finance): add withdrawal concurrency tests`
    از Commitهای عظیم و نامفهوم جلوگیری کن.
41. Before Commit
    قبل از هر Commit:

- Lint
- Type Check
- Tests
- Build
  را در حد مرتبط اجرا کن.
  اگر Failure وجود داشت، تا جای ممکن همان لحظه برطرفش کن.

42. No Fake Features
    هرگز Feature را با:

- Mock Fake
- Hardcoded Data
- Fake Success
- Static Balance
- Dummy Transaction
  به‌عنوان Feature واقعی Done اعلام نکن.
  برای Prototype می‌توان Mock استفاده کرد، اما باید کاملاً مشخص باشد و نباید با Production Logic اشتباه گرفته شود.

43. No Technical Debt Dumping
    مشکلات را با:

- TODO بی‌دلیل
- FIXME بی‌دلیل
- Temporary Hack
  پنهان نکن.
  اگر Workaround لازم شد، دلیل و برنامه حذف آن را در Documentation ثبت کن.

44. Documentation
    همراه با توسعه:

- Architecture
- API
- Database
- Security
- Deployment
- Operations
  را به‌روز نگه دار.
  Documentation نباید بعد از تمام شدن پروژه نوشته شود.

45. Change Management
    هر تصمیم مهمی که MegaPlan را تغییر می‌دهد باید ثبت شود.
    فایل:
    `docs/CHANGELOG.md`
    و برای تصمیم‌های معماری:
    `docs/ARCHITECTURE_DECISIONS.md`
    استفاده کن.
46. Phase Completion Gate
    هیچ Phaseی `DONE` نیست مگر اینکه:
    Functional
    تمام Featureهای Phase کار کنند.
    Technical
    Architecture مطابق MegaPlan باشد.
    Security
    Security Review انجام شده باشد.
    Testing
    Testهای لازم Pass شده باشند.
    UX
    UI/UX قابل قبول باشد.
    Responsive
    Desktop + Mobile بررسی شده باشد.
    Documentation
    مستندات مربوطه به‌روز باشد.
    Git
    Commit مناسب ایجاد شده باشد.
47. Phase Report
    پس از پایان هر Phase فایل:
    `docs/phases/PHASE-X-REPORT.md`
    ایجاد کن.
    شامل:

- Goal
- Tasks Completed
- Files Changed
- Database Changes
- API Changes
- Tests
- Security Review
- Known Issues
- Decisions
- Performance Notes
- Next Phase Dependencies
  باشد.

48. Daily / Continuous Self Review
    در طول اجرای پروژه مرتب بررسی کن:

- آیا چیزی از MegaPlan جا مانده؟
- آیا Featureها Consistent هستند؟
- آیا Security مشکلی دارد؟
- آیا Database هنوز درست است؟
- آیا APIها Contract خود را حفظ کرده‌اند؟
- آیا UX بین صفحات یکپارچه است؟
- آیا Mobile خراب نشده؟
- آیا Testها کافی هستند؟

49. Regression Prevention
    هر Feature جدید نباید Feature قدیمی را خراب کند.
    پس از تغییرات مهم:

- Relevant Tests
- Integration Tests
- E2E Critical Paths
  را دوباره اجرا کن.

50. Build Health
    پروژه باید همیشه تا حد امکان در وضعیت:
    `BUILDABLE`
    باقی بماند.
    نباید ده‌ها Feature جدید به‌صورت نصفه اضافه شود و پروژه در نهایت دیگر Build نشود.
51. Broken Build Protocol
    اگر Build شکست:
    علت را پیدا کن.
    Root Cause را مشخص کن.
    Fix کن.
    Tests را اجرا کن.
    Build مجدد.
    Documentation را در صورت نیاز به‌روزرسانی کن.
    هرگز Error را با Comment کردن کد یا خاموش کردن Validation پنهان نکن.
52. Dependency Management
    قبل از Upgrade بزرگ:

- Compatibility
- Breaking Changes
- Security
- Migration Cost
  را بررسی کن.
  Dependencyها را بی‌دلیل Upgrade نکن.

53. Production Readiness
    پروژه در پایان باید بتواند برای Production آماده شود.
    بررسی نهایی:

- Security
- Performance
- Database
- Backups
- Monitoring
- Error Tracking
- Logging
- CI/CD
- Environment
- Domain
- SSL
- PWA
- SEO
- Admin
- Financial Integrity

54. Final Audit
    پس از پایان آخرین Phase:
    یک Audit کامل انجام بده.
    با MegaPlan تطبیق بده.
    برای هر Requirement یکی از این وضعیت‌ها را ثبت کن:

- IMPLEMENTED
- PARTIALLY_IMPLEMENTED
- NOT_IMPLEMENTED
- BLOCKED
- DEFERRED
  هیچ Requirementی نباید بدون وضعیت باقی بماند.

55. Final Acceptance
    قبل از اعلام Completion:
    این موارد باید بررسی شوند:
    Product
    آیا تمام قابلیت‌های وعده داده شده وجود دارند؟
    UX
    آیا تجربه Web و Mobile یکپارچه است؟
    Financial
    آیا محاسبات و Ledger قابل اتکا هستند؟
    Security
    آیا مسیرهای حساس محافظت شده‌اند؟
    Database
    آیا Migration و Integrity درست است؟
    Testing
    آیا مسیرهای حیاتی تست شده‌اند؟
    Performance
    آیا صفحات و APIها قابل قبول هستند؟
    PWA
    آیا روی موبایل قابل نصب و استفاده است؟
    Admin
    آیا تیم عملیاتی می‌تواند سیستم را مدیریت کند؟
56. Final Documentation
    در پایان این فایل‌ها باید وجود داشته باشند یا به‌روز باشند:
    `MEGAPLAN.md`
    `docs/EXECUTION_STATUS.md`
    `docs/ARCHITECTURE_DECISIONS.md`
    `docs/CHANGELOG.md`
    `docs/SECURITY.md`
    `docs/API.md`
    `docs/DATABASE.md`
    `docs/DEPLOYMENT.md`
    `docs/TESTING.md`
    `docs/OPERATIONS.md`
57. Final Project Checklist
    یک:
    `FINAL_CHECKLIST.md`
    ایجاد کن.
    تمام Requirementهای MegaPlan را به Checkbox تبدیل کن.
    هیچ Requirementی جا نیفتد.
58. Agent Behavior
    به‌عنوان Agent توسعه:
    انجام بده

- Think
- Inspect
- Implement
- Test
- Fix
- Document
- Verify
- Commit
  انجام نده
- Rewrite everything بدون دلیل
- Add unnecessary dependencies
- Ignore Tests
- Ignore Security
- Hardcode financial values
- Fake completed features
- Skip migrations
- Skip documentation
- Break existing features بدون بررسی
- تغییر معماری بدون ثبت تصمیم

59. استقلال Agent
    برای مسائل کوچک، خودت تصمیم بگیر.
    نباید برای هر خطا یا هر انتخاب کوچک از من سؤال کنی.
    اما برای تصمیم‌هایی که واقعاً Business-Critical هستند از:
    `DECISION REQUIRED`
    استفاده کن.
    قبل از آن تمام اطلاعات موجود در پروژه را بررسی کن.
60. Execution Loop
    Execution Loop اصلی:
    READ MEGAPLAN
    ↓
    SELECT NEXT VALID PHASE
    ↓
    CHECK DEPENDENCIES
    ↓
    IMPLEMENT TASKS
    ↓
    RUN TESTS
    ↓
    FIX FAILURES
    ↓
    SECURITY REVIEW
    ↓
    INTEGRATION CHECK
    ↓
    ACCEPTANCE CHECK
    ↓
    UPDATE DOCUMENTATION
    ↓
    UPDATE EXECUTION STATUS
    ↓
    COMMIT
    ↓
    PHASE REPORT
    ↓
    NEXT PHASE
    این Loop را تا پایان پروژه ادامه بده.
61. Priority Order
    در تمام تصمیمات:
    Data Integrity
    Financial Correctness
    Security
    Functional Correctness
    Reliability
    Maintainability
    UX
    Performance
    Developer Convenience
    را در نظر بگیر.
62. ویژه زرسی
    این پروژه یک سایت معمولی نیست.
    زرسی یک Financial Gold Platform است.
    بنابراین:

- Balance
- Gold Holdings
- Ledger
- Buy/Sell
- Withdrawal
- Deposit
- Pricing
- Fees
- Installments
- Investment
- Referral Commission
  باید مثل یک سیستم مالی جدی طراحی شوند.
  هرجا بین «سریع‌تر ساختن» و «درست و امن ساختن» تعارض وجود داشت، در بخش‌های مالی گزینه قابل اتکا را انتخاب کن.

63. عدم وابستگی به Mock در Production
    در محیط Production هیچ Mock Data نباید به‌عنوان داده واقعی باقی بماند.
    تمام:

- Price
- Balance
- Gold
- Transaction
- Order
- Fee
- Profit
  باید از سیستم واقعی داده دریافت کنند.

64. Seed Data
    برای Development می‌توان Seed Data ایجاد کرد.
    اما:
    Seed Data باید واضحاً از Production Data جدا باشد.
65. Environment Separation
    حداقل:
    `development`
    `staging`
    `production`
    را از هم جدا نگه دار.
    هر Environment باید Configuration مناسب خودش را داشته باشد.
66. Observability
    در Production باید بتوان فهمید:

- چه اتفاقی افتاده؟
- کجا رخ داده؟
- برای چه Userی بوده؟
- Request چه بوده؟
- چه خطایی رخ داده؟
- چه Transactionی درگیر بوده؟
  بدون اینکه اطلاعات حساس افشا شود.

67. Mobile Installation Goal
    هدف محصول این است که User بتواند سایت زرسی را روی Mobile نصب کند و تجربه‌ای نزدیک به App داشته باشد.
    پس:
    `Add to Home Screen`
    باید تجربه مناسبی داشته باشد.
    UI موبایل نباید حس «سایت Desktop کوچک شده» بدهد.
68. Future Native App Readiness
    از ابتدا Backend/API و Business Logic را طوری طراحی کن که در آینده بتوان:

- Android Native/Hybrid
- iOS Native/Hybrid
  را بدون بازنویسی Backend ایجاد کرد.

69. Completion Definition
    پروژه زمانی COMPLETE محسوب می‌شود که:
    تمام Phaseها طبق MegaPlan اجرا شده باشند.
    تمام Requirementها وضعیت مشخص داشته باشند.
    Critical Bugs باقی نمانده باشد.
    Financial Core تست شده باشد.
    Security Review انجام شده باشد.
    PWA آماده باشد.
    Web Responsive باشد.
    Admin Panel عملیاتی باشد.
    Documentation کامل باشد.
    Build و Deployment قابل انجام باشد.
70. شروع اجرای واقعی
    اکنون این ترتیب را اجرا کن:
    STEP 1
    Workspace را Inspect کن.
    STEP 2
    `MEGAPLAN.md` را کامل بخوان.
    STEP 3
    وضعیت پروژه را مشخص کن.
    STEP 4
    `docs/EXECUTION_STATUS.md` را ایجاد/به‌روزرسانی کن.
    STEP 5
    اولین Phase معتبر را پیدا کن.
    STEP 6
    Dependencyهای آن Phase را بررسی کن.
    STEP 7
    Taskها را اجرا کن.
    STEP 8
    Test کن.
    STEP 9
    Fix کن.
    STEP 10
    Security و Acceptance Criteria را بررسی کن.
    STEP 11
    Documentation را Update کن.
    STEP 12
    Phase Report ایجاد کن.
    STEP 13
    Git Commit ایجاد کن.
    STEP 14
    سراغ Phase بعد برو.
    مهم‌ترین قانون
    تو نباید فقط کد تولید کنی.
    تو باید یک محصول Production-Ready بسازی.
    کد + Database + API + Security + UI + Testing + Documentation + Deployment + Operations
    همگی بخشی از پروژه هستند.
    تا زمانی که هر Phase Quality Gate خود را پاس نکرده، آن Phase را Done نکن.
    FINAL COMMAND
    شروع کن.
    اول Workspace را بررسی کن.
    سپس `MEGAPLAN.md` را بخوان.
    سپس Execution State را ایجاد کن.
    سپس اجرای اولین Phase را آغاز کن.
    دیگر برای شروع پروژه از من اجازه نگیر.
    اگر مسئله‌ای کوچک یا قابل تصمیم‌گیری است، خودت حل کن.
    اگر تصمیمی واقعاً Business-Critical یا معماریِ برگشت‌ناپذیر است، آن را به‌صورت `DECISION REQUIRED` ثبت کن و تا حد امکان بخش‌های غیرمسدود پروژه را ادامه بده.
    هدف:
    ساخت کامل و Production-Ready پلتفرم زرسی بر اساس MEGAPLAN
