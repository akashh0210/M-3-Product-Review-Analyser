/**
 * MCP Utility - Connects to the hosted FastAPI MCP Bridge
 */

import { withRetry } from './retry.js';

/**
 * Check if the MCP server is healthy
 */
export async function checkMcpHealth(serverUrl: string, hfToken?: string): Promise<boolean> {
  try {
    return await withRetry(async () => {
      const headers: Record<string, string> = {};
      if (hfToken) {
        headers['Authorization'] = `Bearer ${hfToken}`;
      }
      const response = await fetch(serverUrl, { method: 'GET', headers });
      return response.ok;
    }, {
      retries: 2,
      baseDelay: 5000,
      onRetry: (err, attempt) => {
        console.log(`   📡 Waiting for Hosted MCP to wake up (Attempt ${attempt})...`);
      }
    });
  } catch (err) {
    return false;
  }
}

/**
 * Append the weekly note markdown content to a Google Doc via Hosted MCP Server
 */
export async function appendToGoogleDoc(
  serverUrl: string,
  docId: string,
  content: string,
  hfToken?: string
): Promise<{ success: boolean; insertedTextLength: number }> {
  try {
    console.log(`🔌 Calling Hosted MCP: POST /append_to_doc...`);
    
    return await withRetry(async () => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (hfToken) {
        headers['Authorization'] = `Bearer ${hfToken}`;
      }

      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/append_to_doc`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          doc_id: docId,
          content: content
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Unknown error');
      }

      const result = await response.json();
      return { success: true, insertedTextLength: content.length };
    }, {
      retries: 2,
      baseDelay: 8000,
      onRetry: (err, attempt) => {
        console.warn(`   ⚠️ MCP Docs push failed (Attempt ${attempt}). Retrying...`);
      }
    });
  } catch (err: any) {
    console.error(`❌ Hosted MCP Docs push failed: ${err.message}`);
    return { success: false, insertedTextLength: 0 };
  }
}

/**
 * Send an email via Hosted MCP Server
 */
export async function sendGmail(
  serverUrl: string,
  to: string[],
  subject: string,
  body: string,
  hfToken?: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    console.log(`🔌 Calling Hosted MCP: POST /create_email_draft...`);
    
    return await withRetry(async () => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (hfToken) {
        headers['Authorization'] = `Bearer ${hfToken}`;
      }

      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/create_email_draft`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: to.join(', '),
          subject: subject,
          body: body
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Unknown error');
      }

      const result = await response.json();
      return { success: true, messageId: result.message_id || 'draft-created' };
    }, {
      retries: 2,
      baseDelay: 8000,
      onRetry: (err, attempt) => {
        console.warn(`   ⚠️ MCP Gmail send failed (Attempt ${attempt}). Retrying...`);
      }
    });
  } catch (err: any) {
    console.error(`❌ Hosted MCP Gmail send failed: ${err.message}`);
    return { success: false };
  }
}
