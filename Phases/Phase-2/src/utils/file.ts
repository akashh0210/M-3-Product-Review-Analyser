import fs from 'fs/promises';
import path from 'path';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

export interface Review {
  source: 'app_store' | 'play_store';
  rating: number;
  title: string;
  text: string;
  date: string;
  version: string;
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if ((err as any).code !== 'EEXIST') throw err;
  }
}

/**
 * Write an array of Review objects to a CSV file
 */
export async function writeReviewsCSV(reviews: Review[], filePath: string): Promise<void> {
  const csvContent = stringify(reviews, {
    header: true,
    columns: ['source', 'rating', 'title', 'text', 'date', 'version'],
  });
  await fs.writeFile(filePath, csvContent);
}

/**
 * Write a string to a markdown file
 */
export async function writeMarkdown(content: string, filePath: string): Promise<void> {
  await fs.writeFile(filePath, content);
}

/**
 * Read a CSV file and return parsed rows
 */
export async function readCSV(filePath: string): Promise<Record<string, string>[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
  });
}
