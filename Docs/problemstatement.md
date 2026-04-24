# App Review Insights Analyser

## Problem Statement

Product, Growth, Support, and Leadership teams often struggle to consistently learn from public app reviews because feedback is spread across the App Store and Google Play, arrives in high volume, and is difficult to manually scan every week. As a result, recurring bugs, feature gaps, support pain points, and experience issues can be missed or recognized too late to influence product and support decisions effectively.

This project aims to build a lightweight, repeatable AI-powered workflow that converts recent public App Store and Google Play reviews for one selected product into a concise one-page weekly pulse. The system will import reviews from the last 8–12 weeks, capture core fields such as rating, title, review text, and date, group feedback into a maximum of 5 meaningful themes, and generate a stakeholder-friendly weekly note containing the top 3 themes, 3 grounded user quotes, and 3 action ideas.

The workflow will also draft an email containing this weekly note so that the insights are ready to share in a familiar stakeholder format. To keep the output useful and credible, the note must remain scannable, stay within 250 words, avoid personally identifiable information, and ensure that selected quotes come from actual review text rather than invented summaries.

The solution should be easy to re-run for a new week or product with minimal manual effort. Internally, the workflow may be structured in modular stages such as review import, feedback grouping, insight generation, and output drafting so that the prototype is easier to maintain, explain, and extend in future iterations.

## Who This Helps

- **Product / Growth Teams:** Understand what to fix, improve, or prioritize next based on recurring user feedback
- **Support Teams:** Identify repeated complaints, friction points, and quality issues being voiced by users
- **Leadership:** Get a quick weekly health snapshot based on real customer voice rather than ad hoc summaries

## Scope

### In Scope
- Public App Store and Google Play reviews only
- One selected product in the first version
- Reviews from the last 8–12 weeks
- Review fields including rating, title, text, and date
- Grouping feedback into 5 themes maximum
- Weekly one-page note with top 3 themes, 3 user quotes, and 3 action ideas
- Draft email containing the weekly note
- Reviews CSV, latest weekly note, and README as submission artifacts

### Out of Scope
- Reviews from private dashboards, internal databases, or logged-in systems
- Social media, Reddit, X/Twitter, support tickets, or non-store feedback sources
- Real-time analytics dashboards or broad BI reporting
- Production-grade email delivery and enterprise workflow orchestration in version 1

## Key Constraints

- Use only public review exports; do not scrape behind logins
- Keep the number of themes to 5 or fewer
- Keep the weekly note scannable and 250 words or less
- Do not include usernames, emails, IDs, or other PII in any artifact
- Quotes must be grounded in real review text selected from the imported review set

## Success Criteria

The project will be considered successful if it can:
- Import and normalize recent App Store and Google Play reviews for one chosen product
- Group review feedback into clear themes with a maximum of 5 categories
- Produce a one-page weekly note highlighting the top 3 themes, 3 real quotes, and 3 action ideas
- Draft a stakeholder-ready email based on the weekly note
- Generate submission-ready artifacts including the weekly note, reviews CSV, and README with rerun steps and theme legend
- Be rerun for a future week or product with minimal code changes and without rebuilding the workflow from scratch

## Deliverables

- Working prototype link or demo video of up to 3 minutes
- Latest one-page weekly note in PDF, DOC, or MD format
- Email draft as screenshot or text
- Reviews CSV used for analysis, with redaction if needed
- README covering rerun steps and theme legend