import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { google } from 'googleapis';
import fs from 'fs/promises';
import { OAuth2Client } from 'google-auth-library';

/**
 * Authenticate with Google OAuth 2.0
 */
export async function getGoogleAuthClient(
  credentialsPath: string,
  tokenPath: string
): Promise<OAuth2Client> {
  const content = await fs.readFile(credentialsPath, 'utf-8');
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = await fs.readFile(tokenPath, 'utf-8');
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    // If no token, we need to auth (this requires manual intervention)
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/gmail.send'],
    });
    console.log('❌ No cached Google token found.');
    console.log('👉 Authorize this app by visiting this url:', authUrl);
    console.log('👉 After authorizing, create a file named "token.json" with the code or wait for the refresh token.');
    throw new Error('Google authentication required. See console for instructions.');
  }
}

/**
 * Append the weekly note markdown content to a Google Doc
 */
export async function appendToGoogleDoc(
  docId: string,
  content: string,
  credentialsPath: string,
  tokenPath: string
): Promise<{ success: boolean; insertedTextLength: number }> {
  try {
    // 1. Try MCP first (Hypothetical connection logic for Phase 0)
    console.log('🔌 Attempting MCP connection...');
    // In a real implementation, we would connect to an MCP server here.
    // For now, we fall back to googleapis as per instructions.
    
    console.log('🔌 Using googleapis fallback');
    const auth = await getGoogleAuthClient(credentialsPath, tokenPath);
    const docs = google.docs({ version: 'v1', auth });

    const dateStr = new Date().toISOString().split('T')[0];
    const header = `\n\n---\n# Weekly Pulse — ${dateStr}\n\n`;
    const fullText = header + content;

    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              endOfSegmentLocation: {},
              text: fullText,
            },
          },
        ],
      },
    });

    return { success: true, insertedTextLength: fullText.length };
  } catch (err: any) {
    console.error(`❌ Google Docs push failed: ${err.message}`);
    return { success: false, insertedTextLength: 0 };
  }
}

/**
 * Send an email via Gmail API
 */
export async function sendGmail(
  to: string[],
  subject: string,
  body: string,
  credentialsPath: string,
  tokenPath: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    console.log('🔌 Using googleapis fallback for Gmail');
    const auth = await getGoogleAuthClient(credentialsPath, tokenPath);
    const gmail = google.gmail({ version: 'v1', auth });

    // Basic RFC 2822 email format
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: me`,
      `To: ${to.join(', ')}`,
      `Content-Type: text/html; charset=utf-8`,
      `MIME-Version: 1.0`,
      `Subject: ${utf8Subject}`,
      '',
      body.replace(/\n/g, '<br>'), // Simple MD to HTML
    ];
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return { success: true, messageId: res.data.id || 'unknown' };
  } catch (err: any) {
    console.error(`❌ Gmail send failed: ${err.message}`);
    return { success: false };
  }
}
