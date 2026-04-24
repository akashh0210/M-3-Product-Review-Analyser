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
  const mcpEnabled = config.googleDocId || config.enableGmailSend;
  if (!mcpEnabled) {
    console.log('\n⏩ MCP push skipped (not configured)');
    return;
  }

  console.log('\n🔌 Stage 6: MCP Push');

  // 1. Google Docs
  if (config.googleDocId) {
    try {
      console.log(`📑 Appending to Google Doc: ${config.googleDocId}...`);
      const result = await appendToGoogleDoc(
        config.googleDocId,
        weeklyNote,
        config.googleCredentialsPath,
        config.googleTokenPath
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
        config.gmailRecipients,
        subject,
        emailDraft,
        config.googleCredentialsPath,
        config.googleTokenPath
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
