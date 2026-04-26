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

Dear Team,

Please find below this week's App Review Pulse for **${product}**, summarizing user feedback from the App Store and Google Play for the period ${dateRange.from} - ${dateRange.to}.

${weeklyNote}

**Next Steps:** Please review and flag any themes requiring deeper analysis. Happy to discuss prioritization this week.

Best regards,
${author}

---

*This pulse was generated using the App Review Insights Analyser. Data sourced from public App Store and Google Play reviews.*
`;
}
