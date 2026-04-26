import fs from 'fs/promises';
import { readCSV } from './utils/file.js';

async function validate() {
  console.log('🧪 Project Validation Suite\n');
  let exitCode = 0;

  const checks = [
    { name: 'File existence (reviews.csv)', fn: checkReviewsCSV },
    { name: 'File existence (weekly-note.md)', fn: checkWeeklyNoteFile },
    { name: 'File existence (email-draft.md)', fn: checkEmailDraftFile },
    { name: 'Word count (≤ 250 words)', fn: checkWordCount },
    { name: 'Theme count (Top 3)', fn: checkThemeCount },
    { name: 'Quote grounding', fn: checkQuoteGrounding },
    { name: 'PII Absence', fn: checkPIIAbsence },
    { name: 'CSV Integrity', fn: checkCSVIntegrity },
    { name: 'MCP config (informational)', fn: checkMCPConfig }
  ];

  for (const check of checks) {
    try {
      const result = await check.fn();
      if (result) {
        console.log(`✅ ${check.name} passed`);
      } else {
        console.error(`❌ ${check.name} failed`);
        exitCode = 1;
      }
    } catch (err: any) {
      console.error(`❌ ${check.name} error: ${err.message}`);
      exitCode = 1;
    }
  }

  console.log(`\n🏁 Validation finished. Status: ${exitCode === 0 ? 'PASS' : 'FAIL'}`);
  process.exit(exitCode);
}

async function checkReviewsCSV() {
  const stats = await fs.stat('output/reviews.csv');
  return stats.size > 0;
}

async function checkWeeklyNoteFile() {
  const stats = await fs.stat('output/weekly-note.md');
  return stats.size > 0;
}

async function checkEmailDraftFile() {
  const stats = await fs.stat('output/email-draft.md');
  return stats.size > 0;
}

async function checkWordCount() {
  const content = await fs.readFile('output/weekly-note.md', 'utf-8');
  const words = content.split(/\s+/).filter(w => w.length > 0).length;
  if (words > 250) {
    console.error(`   Words: ${words} (limit: 250)`);
    return false;
  }
  return true;
}

async function checkThemeCount() {
  const content = await fs.readFile('output/weekly-note.md', 'utf-8');
  // Look for "## Top Themes" and count items in the list below it
  const match = content.match(/## Top Themes\r?\n([\s\S]*?)\r?\n##/);
  if (!match) return false;
  const listItems = match[1].split(/\r?\n/).filter(l => l.trim().match(/^\d+\./));
  return listItems.length === 3;
}

async function checkQuoteGrounding() {
  const note = await fs.readFile('output/weekly-note.md', 'utf-8');
  const reviews = await readCSV('output/reviews.csv');
  
  // Extract blockquotes
  const quotes = note.match(/^> "(.*?)"/gm);
  if (!quotes) return false;

  for (const q of quotes) {
    const text = q.replace(/^> "/, '').replace(/" — ★\d+$/, '').replace(/"$/, '').trim();
    const isFound = reviews.some(r => r.text.includes(text));
    if (!isFound) {
      console.error(`   Quote not found in CSV: "${text.substring(0, 50)}..."`);
      return false;
    }
  }
  return true;
}

async function checkPIIAbsence() {
  const files = ['output/weekly-note.md', 'output/email-draft.md', 'output/reviews.csv'];
  const piiPatterns = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email
    /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g,          // Phone
  ];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    for (const pattern of piiPatterns) {
      if (pattern.test(content)) {
        // Redact matches that might be "[REDACTED]" tags themselves
        const matches = content.match(pattern);
        if (matches && !matches.every(m => m === '[REDACTED]')) {
          console.error(`   PII found in ${file}`);
          return false;
        }
      }
    }
  }
  return true;
}

async function checkCSVIntegrity() {
  const rows = await readCSV('output/reviews.csv');
  return rows.length > 0 && !!rows[0].source && !!rows[0].text;
}

async function checkMCPConfig(): Promise<boolean> {
  const googleDocId = process.env.GOOGLE_DOC_ID;
  const enableGmail = process.env.ENABLE_GMAIL_SEND === 'true';

  if (!googleDocId && !enableGmail) {
    console.log('   ℹ️ MCP not configured — skipping MCP checks');
    return true; // informational, never fails
  }

  // If MCP is configured, check for credentials file
  try {
    await fs.stat('credentials.json');
    console.log('   ✅ MCP configured and credentials.json found');
  } catch {
    console.warn('   ⚠️ MCP configured but credentials.json missing — auth will be required');
  }

  if (enableGmail) {
    const recipients = process.env.GMAIL_RECIPIENTS;
    if (!recipients || recipients.trim().length === 0) {
      console.error('   ❌ ENABLE_GMAIL_SEND=true but GMAIL_RECIPIENTS is empty');
      return false;
    }
    console.log('   ✅ Gmail recipients configured');
  }

  return true;
}

validate();
