import type { Item, MatchBreakdown } from '../types';

// Common English stopwords to ignore in keyword extraction
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'my', 'i', 'lost', 'found', 'someone', 'please', 'left',
  'near', 'inside', 'around', 'about', 'here', 'there', 'item', 'belonging'
]);

// Helper to tokenize and normalize text into meaningful keyword tokens
export function tokenizeText(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOPWORDS.has(token));
}

// Category relatedness mapping for partial category matches
const RELATED_CATEGORIES: Record<string, string[]> = {
  wallets_purses: ['accessories', 'identity_cards'],
  identity_cards: ['wallets_purses'],
  electronics: ['accessories'],
  accessories: ['electronics', 'wallets_purses', 'clothing'],
  bags_backpacks: ['accessories'],
};

/**
 * Computes category similarity (0 to 30 points)
 */
export function calculateCategoryScore(catA: string, catB: string): number {
  if (!catA || !catB) return 0;
  if (catA === catB) return 30;
  if (RELATED_CATEGORIES[catA]?.includes(catB) || RELATED_CATEGORIES[catB]?.includes(catA)) {
    return 15;
  }
  return 0;
}

/**
 * Computes token similarity on title and description (0 to 25 points)
 */
export function calculateKeywordScore(
  itemA: Pick<Item, 'title' | 'description'>,
  itemB: Pick<Item, 'title' | 'description'>
): { score: number; matchedKeywords: string[] } {
  // Title words get higher weight (2x)
  const titleTokensA = tokenizeText(itemA.title);
  const titleTokensB = tokenizeText(itemB.title);
  const descTokensA = tokenizeText(itemA.description);
  const descTokensB = tokenizeText(itemB.description);

  const setA = new Set([...titleTokensA, ...descTokensA]);
  const setB = new Set([...titleTokensB, ...descTokensB]);

  if (setA.size === 0 || setB.size === 0) {
    return { score: 0, matchedKeywords: [] };
  }

  const matchedKeywords: string[] = [];
  for (const token of setA) {
    if (setB.has(token)) {
      matchedKeywords.push(token);
    }
  }

  // Jaccard similarity index
  const unionSize = new Set([...setA, ...setB]).size;
  const jaccard = unionSize > 0 ? matchedKeywords.length / unionSize : 0;

  // Title match bonus
  const titleOverlap = titleTokensA.filter(t => titleTokensB.includes(t)).length;
  const titleBonus = titleOverlap > 0 ? 0.3 : 0;

  const rawScore = Math.min(1, (jaccard * 1.5) + titleBonus);
  const score = Math.round(rawScore * 25 * 10) / 10;

  return {
    score: Math.min(25, score),
    matchedKeywords
  };
}

/**
 * Computes location similarity (0 to 20 points)
 */
export function calculateLocationScore(locA: string, locB: string): number {
  if (!locA || !locB) return 0;
  const cleanA = locA.toLowerCase().trim();
  const cleanB = locB.toLowerCase().trim();

  // Exact match
  if (cleanA === cleanB) return 20;

  // Check substring containment (e.g., "Library 2nd Floor" vs "Main Campus Library")
  const tokensA = tokenizeText(cleanA);
  const tokensB = tokenizeText(cleanB);
  const common = tokensA.filter(t => tokensB.includes(t));

  if (common.length >= 2) return 16;
  if (common.length === 1) return 10;

  return 0;
}

/**
 * Computes date proximity decay score (0 to 15 points)
 * If found date is before lost date by more than 1 day, score is penalized.
 */
export function calculateDateScore(lostDateStr: string, foundDateStr: string): number {
  if (!lostDateStr || !foundDateStr) return 5;

  const lostDate = new Date(lostDateStr);
  const foundDate = new Date(foundDateStr);

  const diffMs = Math.abs(foundDate.getTime() - lostDate.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 15;
  if (diffDays <= 2) return 12;
  if (diffDays <= 5) return 9;
  if (diffDays <= 10) return 5;
  if (diffDays <= 20) return 2;
  return 0;
}

/**
 * Computes color similarity (0 to 10 points)
 */
export function calculateColorScore(colorA?: string, colorB?: string): number {
  if (!colorA || !colorB) return 4; // Neutral baseline when color unspecified

  const cA = colorA.toLowerCase().trim();
  const cB = colorB.toLowerCase().trim();

  if (cA === cB) return 10;

  // Color affinities (e.g., dark blue vs navy, grey vs silver)
  const affinities: Record<string, string[]> = {
    black: ['dark grey', 'grey', 'charcoal'],
    blue: ['navy', 'dark blue', 'sky blue', 'teal'],
    silver: ['grey', 'white', 'metallic'],
    brown: ['tan', 'beige'],
    gold: ['yellow', 'metallic']
  };

  if (affinities[cA]?.includes(cB) || affinities[cB]?.includes(cA)) {
    return 7;
  }

  return 0;
}

/**
 * Main matching function evaluating two items
 */
export function evaluateMatch(lostItem: Item, foundItem: Item): MatchBreakdown | null {
  // Rule 1: Opposite report types only
  if (lostItem.report_type === foundItem.report_type) {
    return null;
  }

  // Ensure lostItem is truly 'lost' and foundItem is 'found'
  const lost = lostItem.report_type === 'lost' ? lostItem : foundItem;
  const found = foundItem.report_type === 'found' ? foundItem : lostItem;

  // Rule 2: Strict campus boundary
  if (lost.campus_id !== found.campus_id) {
    return null;
  }

  // Rule 3: Exclude closed or resolved items
  if (
    lost.status === 'resolved' || lost.status === 'closed' ||
    found.status === 'resolved' || found.status === 'closed'
  ) {
    return null;
  }

  const categoryScore = calculateCategoryScore(lost.category, found.category);
  const { score: descriptionScore, matchedKeywords } = calculateKeywordScore(lost, found);
  const locationScore = calculateLocationScore(lost.location_name, found.location_name);
  const dateScore = calculateDateScore(lost.date_lost_found, found.date_lost_found);
  const colorScore = calculateColorScore(lost.color, found.color);

  const rawTotal = categoryScore + descriptionScore + locationScore + dateScore + colorScore;
  const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal * 10) / 10));

  // Generate clear human-understandable explanation
  const reasons: string[] = [];
  if (categoryScore === 30) {
    reasons.push('Identical item category');
  } else if (categoryScore > 0) {
    reasons.push('Closely related category');
  }

  if (matchedKeywords.length > 0) {
    reasons.push(`Matched keywords (${matchedKeywords.slice(0, 3).join(', ')})`);
  }

  if (locationScore >= 16) {
    reasons.push('Same reported building or location');
  } else if (locationScore > 0) {
    reasons.push('Nearby campus location');
  }

  if (dateScore >= 12) {
    reasons.push('Reported within 48 hours of each other');
  }

  if (colorScore === 10) {
    reasons.push(`Matching color (${lost.color})`);
  }

  const explanation = reasons.length > 0
    ? reasons.join(' • ')
    : 'General attribute alignment on campus';

  return {
    categoryScore,
    descriptionScore,
    locationScore,
    dateScore,
    colorScore,
    totalScore,
    matchedKeywords,
    explanation
  };
}

/**
 * Find top candidate matches for an item against a pool of potential items
 */
export function findPotentialMatches(
  targetItem: Item,
  itemPool: Item[],
  minScoreThreshold = 40
): Array<{ item: Item; breakdown: MatchBreakdown }> {
  const matches: Array<{ item: Item; breakdown: MatchBreakdown }> = [];

  for (const candidate of itemPool) {
    if (candidate.id === targetItem.id) continue;
    const breakdown = evaluateMatch(targetItem, candidate);
    if (breakdown && breakdown.totalScore >= minScoreThreshold) {
      matches.push({ item: candidate, breakdown });
    }
  }

  // Sort candidates by totalScore descending
  return matches.sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);
}
