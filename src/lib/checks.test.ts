import { describe, expect, it } from 'vitest';
import { brief, cachedStarters, roster } from '../data';
import { checkClaims, checkDisclosure, checkLink, creatorLink } from './checks';

const nurse = { code: 'NURSE20' };
const good = `#ad The serum I recommend. 20% off: ${brief.link}?code=NURSE20`;

describe('starter preview checks', () => {
  it('every cached starter passes all three against the sample brief', () => {
    for (const s of cachedStarters.starters) {
      const creator = roster.find((c) => c.handle === s.handle)!;
      expect(checkDisclosure(s.dm, brief).passed, s.handle).toBe(true);
      expect(checkClaims(s.dm, s.claims_used, brief).passed, s.handle).toBe(true);
      expect(checkLink(s.dm, creator, brief).passed, s.handle).toBe(true);
    }
  });

  it('builds the DM link as link + ?code= + code', () => {
    expect(creatorLink(brief, 'NURSE20')).toBe('https://fernway.example.com/serum?code=NURSE20');
  });

  describe('disclosure', () => {
    it('accepts #ad in any case, #sponsored, and "paid partnership"', () => {
      expect(checkDisclosure('#Ad hi', brief).passed).toBe(true);
      expect(checkDisclosure('hi #sponsored', brief).passed).toBe(true);
      expect(checkDisclosure('Paid partnership with Fernway', brief).passed).toBe(true);
    });
    it('fails with a reason when missing', () => {
      const c = checkDisclosure('The serum I love', brief);
      expect(c.passed).toBe(false);
      expect(c.reason).toMatch(/#ad/);
    });
  });

  describe('claims', () => {
    it('fails on an exact banned phrase, case-insensitive', () => {
      const c = checkClaims('#ad It Cures Acne fast', [], brief);
      expect(c).toMatchObject({ passed: false, reason: 'Uses a banned claim: "cures acne".' });
    });
    it('fails when a claim used is not on the approved list', () => {
      expect(checkClaims(good, ['vegan'], brief).passed).toBe(false);
    });
    it('passes approved claims', () => {
      expect(checkClaims(good, ['fragrance-free', 'Dermatologist-tested'], brief).passed).toBe(true);
    });
  });

  describe('link', () => {
    it('passes the creator link, including at the end of a sentence', () => {
      expect(checkLink(good, nurse, brief).passed).toBe(true);
      expect(checkLink(`${good}.`, nurse, brief).passed).toBe(true);
    });
    it('fails with no code, another creator\'s code, an extra parameter, or a longer code', () => {
      expect(checkLink(`#ad ${brief.link}`, nurse, brief).passed).toBe(false);
      expect(checkLink(`#ad ${brief.link}?code=SAM20`, nurse, brief).passed).toBe(false);
      expect(checkLink(`#ad ${brief.link}?code=NURSE20&utm=x`, nurse, brief).passed).toBe(false);
      expect(checkLink(`#ad ${brief.link}?code=NURSE200`, nurse, brief).passed).toBe(false);
    });
    it('fails once the brief link changes', () => {
      expect(checkLink(good, nurse, { ...brief, link: 'https://fernway.example.com/serum-v2' }).passed).toBe(false);
    });
  });
});
