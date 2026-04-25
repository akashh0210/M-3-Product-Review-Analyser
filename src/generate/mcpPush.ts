import { PipelineConfig } from '../config/products.js';
import { appendToGoogleDoc, sendGmail } from '../utils/mcp.js';

/**
 * Orchestrates the optional Stage 6 push to external systems via MCP
 */
export async function mcpPush(
  config: PipelineConfig,
  weeklyNote: string,
  emailDraft: string,
  dateRange: { from: string; to: string }
): Promise<void> {
  const mcpEnabled = config.mcpServerUrl && (config.googleDocId || config.enableGmailSend);
  if (!mcpEnabled) {
    console.log('\n⏩ Hosted MCP push skipped (MCP_SERVER_URL not configured)');
    return;
  }

  const serverUrl = config.mcpServerUrl!;
  console.log('\n🔌 Stage 6: Hosted MCP Push');

  // 1. Google Docs
  if (config.googleDocId) {
    try {
      console.log(`📑 Appending to Google Doc: ${config.googleDocId}...`);
      const result = await appendToGoogleDoc(
        serverUrl,
        config.googleDocId,
        weeklyNote
      );
      if (result.success) {
        console.log(`✅ Appended ${result.insertedTextLength} characters to Google Doc`);
      } else {
        console.warn(`⚠️ Google Docs push failed`);
      }
    } catch (err: any) {
      console.error(`❌ Google Docs push error: ${err.message}`);
    }
  }

  // 2. Gmail
  if (config.enableGmailSend) {
    try {
      const subject = `Weekly App Review Pulse — ${config.productName} (${dateRange.from} to ${dateRange.to})`;
      console.log(`📧 Sending email to: ${config.gmailRecipients.join(', ')}...`);
      const result = await sendGmail(
        serverUrl,
        config.gmailRecipients,
        subject,
        emailDraft
      );
      if (result.success) {
        console.log(`✅ Email sent successfully (ID: ${result.messageId})`);
      } else {
        console.warn(`⚠️ Gmail send failed`);
      }
    } catch (err: any) {
      console.error(`❌ Gmail send error: ${err.message}`);
    }
  }
}
