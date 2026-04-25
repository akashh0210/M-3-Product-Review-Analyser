import dotenv from 'dotenv';

dotenv.config();

export interface PipelineConfig {
  productName: string;
  appStoreId: string;
  playStorePackage: string;
  reviewWindowWeeks: number;
  maxThemes: number;
  groqApiKey: string;

  // Optional MCP Integration
  googleDocId?: string;
  enableGmailSend: boolean;
  gmailRecipients: string[];
  mcpServerUrl?: string;
}

export function getConfig(): PipelineConfig {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY is required in .env file');
  }

  const enableGmailSend = process.env.ENABLE_GMAIL_SEND === 'true';
  const gmailRecipients = process.env.GMAIL_RECIPIENTS 
    ? process.env.GMAIL_RECIPIENTS.split(',').map(r => r.trim()).filter(Boolean)
    : [];

  if (enableGmailSend && gmailRecipients.length === 0) {
    throw new Error('GMAIL_RECIPIENTS is required when ENABLE_GMAIL_SEND is true');
  }

  return {
    productName: process.env.PRODUCT_NAME || 'Groww',
    appStoreId: process.env.APP_STORE_ID || '1404871703',
    playStorePackage: process.env.PLAY_STORE_PACKAGE || 'com.nextbillion.groww',
    reviewWindowWeeks: parseInt(process.env.REVIEW_WINDOW_WEEKS || '12', 10),
    maxThemes: parseInt(process.env.MAX_THEMES || '5', 10),
    groqApiKey,

    // Optional MCP Integration
    googleDocId: process.env.GOOGLE_DOC_ID || undefined,
    enableGmailSend,
    gmailRecipients,
    mcpServerUrl: process.env.MCP_SERVER_URL || undefined,
  };
}
