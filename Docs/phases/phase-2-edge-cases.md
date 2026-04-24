# Phase 2 — Edge Cases

## Overview
Phase 2 edge cases cover data quality issues in raw reviews, date parsing problems, PII patterns that are hard to detect, and CSV formatting challenges.

---

## Edge Case Matrix

### EC2.1 — Normalization Edge Cases

| # | Scenario | Input | Expected Behavior | Severity |
|---|----------|-------|--------------------|----------|
| 1 | Review text is empty string | `text: ""` | Skip this review entirely | 🟡 Medium |
| 2 | Review text is only whitespace | `text: "   \n\t  "` | Skip this review | 🟡 Medium |
| 3 | Review text is very short | `text: "ok"` | Keep it (valid feedback) | 🟢 Low |
| 4 | Review text is extremely long (>10,000 chars) | User rant | Keep it, will be handled later | 🟢 Low |
| 5 | Rating is 0 | Invalid score | Clamp to 1 | 🟡 Medium |
| 6 | Rating is 6 or higher | Invalid score | Clamp to 5 | 🟡 Medium |
| 7 | Rating is decimal (3.5) | Scraper quirk | Round to nearest integer | 🟡 Medium |
| 8 | Date is `null` or `undefined` | Missing date | Skip review, log warning | 🟡 Medium |
| 9 | Date is epoch timestamp | `1711929600000` | Parse as timestamp, format as YYYY-MM-DD | 🟡 Medium |
| 10 | Date is in non-ISO format | `"Mar 15, 2026"` | Parse with date-fns, format as YYYY-MM-DD | 🟡 Medium |
| 11 | Title contains newlines | `"Great\napp"` | Replace newlines with spaces | 🟢 Low |
| 12 | Text contains CSV-breaking chars | `"Love it","but crashes"` | Handled by csv-stringify escaping | 🟢 Low |
| 13 | Version is `"varies with device"` | Play Store quirk | Keep as-is | 🟢 Low |
| 14 | Duplicate reviews | Same text, same date | Keep both (dedup not in scope v1) | 🟢 Low |

### EC2.2 — Date Filtering Edge Cases

| # | Scenario | Input | Expected Behavior | Severity |
|---|----------|-------|--------------------|----------|
| 1 | All reviews older than window | Reviews from 1 year ago | Return empty array, log warning | 🔴 Critical |
| 2 | Review on exact cutoff date | Date equals `subWeeks(now, 12)` | Include (≥ cutoff) | 🟡 Medium |
| 3 | Review dated tomorrow | Date in the future | Include (after cutoff) | 🟢 Low |
| 4 | Review with invalid date string | `date: "not-a-date"` | Skip or use fallback date; log warning | 🟡 Medium |
| 5 | `windowWeeks` is very large (520 = 10 years) | Covers all reviews | All reviews pass filter | 🟢 Low |
| 6 | `windowWeeks` is 1 | Very narrow window | Most reviews filtered out; may have very few | 🟡 Medium |
| 7 | Timezone differences | UTC vs IST dates | Use UTC consistently for comparison | 🟡 Medium |
| 8 | Midnight boundary | Review at 00:00:00 on cutoff | Include (≥ cutoff) | 🟢 Low |

### EC2.3 — PII Scrubbing Edge Cases

| # | Scenario | Input | Expected Behavior | Severity |
|---|----------|-------|--------------------|----------|
| 1 | Email with subdomain | `user@mail.google.com` | Redacted | 🟡 Medium |
| 2 | Email with plus addressing | `user+tag@gmail.com` | Redacted | 🟡 Medium |
| 3 | Not an email — looks like one | `version@5.2` | Should NOT be redacted (not a valid TLD) | 🟡 Medium |
| 4 | Phone without country code | `9876543210` | Redacted (Indian mobile pattern) | 🟡 Medium |
| 5 | Phone with dashes | `987-654-3210` | Redacted | 🟡 Medium |
| 6 | Not a phone — order ID | `12345678` | Should NOT be redacted (only 8 digits) | 🟡 Medium |
| 7 | "I am happy" (not a name) | `I am happy with this app` | NOT redacted — "happy" is lowercase | 🟡 Medium |
| 8 | "I am Rahul" | `I am Rahul and I love this app` | `I am [REDACTED] and I love this app` | 🟡 Medium |
| 9 | Name in Hindi transliteration | `Mera naam Rahul hai` | Not caught by English regex — acceptable in v1 | 🟢 Low |
| 10 | UPI ID vs email overlap | `user@ybl` | Redacted (matches UPI pattern) | 🟡 Medium |
| 11 | URL in review | `https://groww.in/support` | NOT redacted (it's a URL, not PII) | 🟡 Medium |
| 12 | Multiple PII types in one review | `contact rahul@gmail.com or call +91 98765 43210` | Both redacted | 🔴 Critical |
| 13 | PII in title only | Title: `"Rahul's review from account #AB1234"` | Both PII patterns redacted in title | 🟡 Medium |
| 14 | No PII in review | `"Great app, love the mutual fund feature"` | Text unchanged | 🟢 Low |
| 15 | Emoji-heavy review | `"😡 worst app ever 😡 call 9876543210"` | Phone redacted, emojis preserved | 🟢 Low |
| 16 | Review is entirely PII | `"My name is Rahul Kumar, email rahul@gmail.com, phone 9876543210"` | Mostly `[REDACTED]` — still kept as a review | 🟡 Medium |

### EC2.4 — CSV Output Edge Cases

| # | Scenario | Input | Expected Behavior | Severity |
|---|----------|-------|--------------------|----------|
| 1 | Zero reviews after filtering | All reviews too old | Write CSV with header only, log warning | 🟡 Medium |
| 2 | Text contains commas | `"good app, but crashes, a lot"` | Properly quoted in CSV | 🟡 Medium |
| 3 | Text contains double quotes | `She said "great app"` | Escaped as `""` in CSV | 🟡 Medium |
| 4 | Text contains newlines | Multi-line review | Quoted in CSV, newlines preserved | 🟡 Medium |
| 5 | Text contains CSV injection | `=CMD(...)` | Should be escaped (prefix with `'`) or ignored | 🟡 Medium |
| 6 | Very large CSV (>10,000 rows) | High-volume app | File writes successfully, no memory issues | 🟢 Low |
| 7 | Special characters in text | `<script>alert('xss')</script>` | Kept as-is — not a web context | 🟢 Low |

---

## Test Data Set

Use this test data to validate Phase 2 comprehensively:

```typescript
const testReviews = [
  // Normal review
  { score: 4, title: "Great app", text: "Love the investment options", updated: "2026-04-01", version: "5.2" },
  // Empty text — should be skipped
  { score: 3, title: "Hmm", text: "", updated: "2026-04-02", version: "5.2" },
  // Old review — should be filtered
  { score: 5, title: "Nice", text: "Works well", updated: "2025-01-01", version: "4.0" },
  // PII in text
  { score: 1, title: "Bad", text: "Contact me at rahul@gmail.com for help", updated: "2026-03-15", version: "5.1" },
  // PII phone
  { score: 2, title: "Help", text: "Call me at +91 98765 43210", updated: "2026-03-20", version: "5.1" },
  // Self-identification
  { score: 1, title: "Angry", text: "I am Rahul Kumar and this app stole my money", updated: "2026-03-25", version: "5.2" },
  // CSV-tricky text
  { score: 3, title: 'She said "ok"', text: 'Good, but "crashes" sometimes, yeah', updated: "2026-04-10", version: "5.2" },
];
```

**Expected results:**
- 5 reviews in output (empty text and old review excluded)
- 3 PII redactions
- CSV has 5 data rows + 1 header
- Quotes and commas properly escaped
