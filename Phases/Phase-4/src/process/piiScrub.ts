import { Review } from '../utils/file.js';

export interface ScrubResult {
  reviews: Review[];
  redactionCount: number;
}

const PII_PATTERNS = [
  { name: 'Phone (IN)', regex: /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g },
  { name: 'Phone (Intl)', regex: /(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g },
  { name: 'Self-ID', regex: /(?:my name is|i am|i'm)\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/gi },
  { name: 'Account ref', regex: /(?:account|user|id|ref)[\s:#]*[A-Z0-9]{6,}/gi },
  { name: 'UPI ID', regex: /[a-zA-Z0-9.]+@(?:paytm|ybl|okhdfcbank|okicici|okaxis|apl|upi|ibl|axl|sbi)\b/gi },
  { name: 'Email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
];

/**
 * Detects and redacts PII from reviews
 */
export function scrubPII(reviews: Review[]): ScrubResult {
  let redactionCount = 0;

  const scrubbedReviews = reviews.map(review => {
    let scrubbedText = review.text;
    let scrubbedTitle = review.title;

    PII_PATTERNS.forEach(pattern => {
      const textMatches = scrubbedText.match(pattern.regex);
      if (textMatches) {
        redactionCount += textMatches.length;
        scrubbedText = scrubbedText.replace(pattern.regex, '[REDACTED]');
      }

      const titleMatches = scrubbedTitle.match(pattern.regex);
      if (titleMatches) {
        redactionCount += titleMatches.length;
        scrubbedTitle = scrubbedTitle.replace(pattern.regex, '[REDACTED]');
      }
    });

    return {
      ...review,
      text: scrubbedText,
      title: scrubbedTitle,
    };
  });

  console.log(`🛡️ PII scrub: ${redactionCount} redactions across ${reviews.length} reviews`);

  return {
    reviews: scrubbedReviews,
    redactionCount,
  };
}
