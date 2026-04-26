/**
 * Formats the weekly note as a professional stakeholder email
 */
export function generateEmailDraft(
  weeklyNote: string,
  product: string,
  dateRange: { from: string; to: string },
  author: string
): string {
  return `# Email Draft

**To:** Product Team, Growth Team, Support Team, Leadership
**From:** ${author}
**Subject:** Weekly App Review Pulse — ${product} (${dateRange.from} to ${dateRange.to})

---

Hi team,

Please find below this week's app review pulse for **${product}**, summarizing user feedback from the App Store and Google Play.

${weeklyNote}

**[🖨️ Access the raw documents folder for printing](./output/)**

---

If any of these themes need deeper investigation or if you'd like to discuss priorities, let's connect this week.

Best regards,
${author}

---

*This pulse was generated using the App Review Insights Analyser. Data sourced from public App Store and Google Play reviews.*
`;
}
