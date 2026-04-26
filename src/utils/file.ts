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

export interface ThemeGroup {
  label: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'mixed';
  summary: string;
  reviewIndices: number[];
}

export interface WeeklyPulse {
  product: string;
  dateRange: { from: string; to: string };
  totalReviews: number;
  avgRating: number;
  themes: ThemeGroup[];
  topThemes: ThemeGroup[];
  quotes: Array<{
    text: string;
    theme: string;
    rating: number;
  }>;
  actions: Array<{
    title: string;
    description: string;
    theme: string;
  }>;
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

/**
 * Check if a file exists and is newer than maxAgeHours
 */
export async function isCacheValid(filePath: string, maxAgeHours: number): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    const now = new Date();
    const modified = new Date(stats.mtime);
    const ageHours = (now.getTime() - modified.getTime()) / (1000 * 60 * 60);
    return ageHours <= maxAgeHours;
  } catch (err) {
    // If file doesn't exist, cache is invalid
    return false;
  }
}

/**
 * Read a text file as a string
 */
export async function readFileString(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}
