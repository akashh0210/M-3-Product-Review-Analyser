import { subWeeks, isAfter, parseISO } from 'date-fns';
import { Review } from '../utils/file.js';

/**
 * Filters reviews to the configured date window and sorts by date
 */
export function filterRecentReviews(reviews: Review[], windowWeeks: number): Review[] {
  const cutoff = subWeeks(new Date(), windowWeeks);
  
  const filtered = reviews.filter(r => {
    try {
      return isAfter(parseISO(r.date), cutoff);
    } catch (err) {
      console.warn(`⚠️ Skipping review with invalid date: ${r.date}`);
      return false;
    }
  });

  const sorted = filtered.sort((a, b) => b.date.localeCompare(a.date));
  
  console.log(`📅 Reviews in window: ${sorted.length} / ${reviews.length} (${windowWeeks} weeks)`);
  
  return sorted;
}
