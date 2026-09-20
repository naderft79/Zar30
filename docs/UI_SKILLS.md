# UI Skills — Source of Truth (Permanent)

> مرجع دائمی و اجباری UI/UX Engineering برای پروژه زرسی — ADR-018

## Upstream & Pin

```text
UPSTREAM:  ibelick/ui-skills — https://github.com/ibelick/ui-skills
PIN:       aaddae727e243b4f7a7095a8b165a1534deba2ef
SYNCED:    2026-09-20
LICENSE:   MIT
LOCAL:     .agent/ui-skills/   (snapshot — بدون .git، داخل همین Repository)
```

## Active Skills (snapshot Pin‌شده)

| Skill                       | کاربرد                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| `ui-skills-root`            | Routing layer — انتخاب کوچک‌ترین skill مفید                                  |
| `baseline-ui`               | Cleanup سریع: spacing، hierarchy، typography، layout                         |
| `improve-ui`                | Audit surface در برابر design system + plan برای اجرا (read-only روی source) |
| `fixing-accessibility`      | ARIA، keyboard، focus، contrast، form errors — WCAG                          |
| `fixing-metadata`           | title، description، canonical، OG، Twitter، JSON-LD، robots                  |
| `fixing-motion-performance` | layout thrashing، compositor props، scroll-linked motion                     |
| `create-design-md`          | استخراج DESIGN.md از repository موجود                                        |

هر skill: `.agent/ui-skills/skills/<slug>/SKILL.md`

## نحوه استفاده (Workflow اجباری برای UI Task)

```text
Read AGENTS.md
↓
Read ZAR30 Design System (globals.css + /design-system)
↓
Identify UI Task type
↓
Select relevant Skill از snapshot محلی
↓
Load minimal useful skill context
↓
Implement
↓
Render → Visual QA → Responsive QA → Accessibility QA
↓
Test → Done
```

### Skill Selection Rule

- **پیش‌فرض: ۱ skill** — کوچک‌ترین context مفید
- ۲ skill فقط وقتی Task دو جنبه مشخص دارد
- ۳ skill فقط برای review/redesign وسیع
- **هرگز بیشتر از ۳** — Load کورکورانه ممنوع

### CLI (در صورت نیاز به upstream تازه)

```bash
npx ui-skills start
npx ui-skills categories
npx ui-skills list --category <category>
npx ui-skills get <slug>
```

## Design Hierarchy (اولویت — غیرقابل نقض)

```text
ZAR30 Product Decisions
        ↓
ZAR30 Design Language (Permanent — Navy + Gold + Cream)
        ↓
ZAR30 Design Tokens (src/app/globals.css)
        ↓
ZAR30 Components (src/components/)
        ↓
UI Skills Knowledge Layer (.agent/ui-skills/)
        ↓
Feature UI
```

**UI Skills هیچ‌وقت Design Language زرسی را Override نمی‌کند.** در تضاد، قانون پروژه اولویت دارد و Override در همین فایل مستند می‌شود.

## Project-specific Overrides

| قانون Skill            | Override زرسی                                             |
| ---------------------- | --------------------------------------------------------- |
| light/white background | Navy-first — `.dark` پیش‌فرض روی `<html>`                 |
| generic accent         | Gold فقط برای CTA/active/focus/متریک مهم — کنترل‌شده      |
| default shadows/radius | Tokenهای `globals.css` — hardcode ممنوع                   |
| هر IA پیشنهادی         | Navigation Contract دائمی ۵‌آیتمی (ADR-015) تغییر نمی‌کند |

## قواعد دائمی UI زرسی

- Navy = dominant؛ Gold = luxury accent؛ Cream = supporting فقط — هرگز cream/white-first
- هیچ UI از حافظه/سلیقه — ابتدا Design System + skill مرتبط + کامپوننت‌های موجود
- Token-based اجباری: colors/radius/shadows/spacing/typography/motion/z-index
- کامپوننت جدید = reusable + accessible + responsive + theme-aware + token-based
- Motion: premium/subtle/smooth — neon، bounce اغراق‌آمیز، glow شدید ممنوع
- Accessibility: keyboard، focus، contrast، semantic HTML، reduced-motion
- Responsive QA حداقل: 360/390/414/768/1024/1366/1440/1920
- Mobile ≠ دسکتاپ کوچک‌شده — touch targets، safe-area، bottom nav، sheet موبایل
- Visual QA واقعی: build → render → screenshot → mobile check → fix
- **Upstream را تغییر نده** — overrideها فقط اینجا یا `src/design-system/`
- **آلودگی source با کامنت ممنوع** — referenceها فقط در docs/AGENTS/MEGAPLAN

## Update Strategy (Upstream Sync)

```text
Check upstream (git ls-remote / release)
↓
Review changes در مقابل snapshot Pin‌شده
↓
Update .agent/ui-skills/ + PIN جدید در این فایل
↓
Review skillهای متاثر + overrideها
↓
UI regression (build + e2e + visual)
↓
Update docs
```

هرگز upstream را خودکار و بدون بررسی روی Design System اعمال نکن.

## UI Review Gate (قبل از DONE)

- [ ] Navy dominant؟ Gold luxury accent؟ Cream controlled؟ Premium و brand-consistent؟
- [ ] Hierarchy واضح؟ CTA مشخص؟ Spacing درست؟ Responsive؟
- [ ] Reusable؟ Token-based؟ Accessible؟ Performance OK؟
- [ ] Render شده و دیده شده؟ تست؟ موبایل چک؟ صفحات موجود نشکسته؟
