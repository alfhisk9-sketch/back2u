import { describe, it, expect } from 'vitest';
import {
  calculateCategoryScore,
  calculateKeywordScore,
  calculateLocationScore,
  calculateDateScore,
  calculateColorScore,
  evaluateMatch,
  findPotentialMatches,
  tokenizeText
} from './matching';
import type { Item } from '../types';

describe('Intelligent Matching Engine', () => {
  const baseLostItem: Item = {
    id: 'lost-1',
    campus_id: 'campus-stanford',
    user_id: 'user-alice',
    report_type: 'lost',
    title: 'Blue Hydro Flask water bottle',
    category: 'water_bottles',
    description: 'Lost my 32oz navy blue Hydro Flask with a National Parks sticker on it.',
    location_name: 'Green Library 2nd Floor',
    date_lost_found: '2026-10-20',
    color: 'blue',
    status: 'open',
    created_at: '2026-10-20T10:00:00Z',
  };

  const baseFoundItem: Item = {
    id: 'found-1',
    campus_id: 'campus-stanford',
    user_id: 'user-bob',
    report_type: 'found',
    title: 'Found Hydro Flask bottle',
    category: 'water_bottles',
    description: 'Found a blue metallic water bottle with outdoors stickers on the study desk.',
    location_name: 'Green Library 2nd Floor',
    date_lost_found: '2026-10-21',
    color: 'blue',
    status: 'open',
    created_at: '2026-10-21T09:00:00Z',
  };

  it('tokenizes text correctly removing stopwords', () => {
    const tokens = tokenizeText('Lost my blue Hydro Flask water bottle at the library');
    expect(tokens).toContain('blue');
    expect(tokens).toContain('hydro');
    expect(tokens).toContain('flask');
    expect(tokens).toContain('water');
    expect(tokens).toContain('bottle');
    expect(tokens).toContain('library');
    expect(tokens).not.toContain('at');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('my');
  });

  it('evaluates category similarity', () => {
    expect(calculateCategoryScore('water_bottles', 'water_bottles')).toBe(30);
    expect(calculateCategoryScore('wallets_purses', 'identity_cards')).toBe(15);
    expect(calculateCategoryScore('water_bottles', 'electronics')).toBe(0);
  });

  it('evaluates keyword and description similarity', () => {
    const { score, matchedKeywords } = calculateKeywordScore(
      { title: 'Blue Hydro Flask', description: 'Left near library' },
      { title: 'Found Hydro Flask bottle', description: 'Library study desk' }
    );
    expect(score).toBeGreaterThanOrEqual(10);
    expect(matchedKeywords).toContain('hydro');
    expect(matchedKeywords).toContain('flask');
  });

  it('evaluates location similarity', () => {
    expect(calculateLocationScore('Green Library 2nd Floor', 'Green Library 2nd Floor')).toBe(20);
    expect(calculateLocationScore('Green Library 2nd Floor', 'Green Library')).toBeGreaterThanOrEqual(10);
    expect(calculateLocationScore('Student Dining Hall', 'Engineering Quad')).toBe(0);
  });

  it('evaluates date proximity score', () => {
    expect(calculateDateScore('2026-10-20', '2026-10-20')).toBe(15);
    expect(calculateDateScore('2026-10-20', '2026-10-21')).toBe(12);
    expect(calculateDateScore('2026-10-20', '2026-10-24')).toBe(9);
    expect(calculateDateScore('2026-10-01', '2026-10-25')).toBe(0);
  });

  it('evaluates color similarity and affinities', () => {
    expect(calculateColorScore('blue', 'blue')).toBe(10);
    expect(calculateColorScore('blue', 'navy')).toBe(7);
    expect(calculateColorScore('black', 'charcoal')).toBe(7);
    expect(calculateColorScore('blue', 'red')).toBe(0);
  });

  it('evaluates full match between corresponding lost and found items', () => {
    const result = evaluateMatch(baseLostItem, baseFoundItem);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.totalScore).toBeGreaterThanOrEqual(75);
    expect(result.categoryScore).toBe(30);
    expect(result.locationScore).toBe(20);
    expect(result.colorScore).toBe(10);
    expect(result.explanation).toContain('Identical item category');
  });

  it('blocks match if items are on different campuses (Campus Boundary Enforcement)', () => {
    const crossCampusFound = { ...baseFoundItem, campus_id: 'campus-mit' };
    const result = evaluateMatch(baseLostItem, crossCampusFound);
    expect(result).toBeNull();
  });

  it('blocks match if both items have the same report type (lost vs lost)', () => {
    const anotherLost = { ...baseFoundItem, report_type: 'lost' as const };
    const result = evaluateMatch(baseLostItem, anotherLost);
    expect(result).toBeNull();
  });

  it('excludes resolved or closed items', () => {
    const resolvedItem = { ...baseFoundItem, status: 'resolved' as const };
    const result = evaluateMatch(baseLostItem, resolvedItem);
    expect(result).toBeNull();
  });

  it('finds and ranks potential matches from an item pool', () => {
    const unrelatedItem: Item = {
      id: 'found-2',
      campus_id: 'campus-stanford',
      user_id: 'user-carol',
      report_type: 'found',
      title: 'Found graphing calculator',
      category: 'electronics',
      description: 'TI-84 calculator found in math auditorium.',
      location_name: 'Building 380 Math Hall',
      date_lost_found: '2026-10-15',
      color: 'black',
      status: 'open',
      created_at: '2026-10-15T12:00:00Z',
    };

    const matches = findPotentialMatches(baseLostItem, [baseFoundItem, unrelatedItem]);
    expect(matches.length).toBe(1);
    expect(matches[0].item.id).toBe('found-1');
  });
});
