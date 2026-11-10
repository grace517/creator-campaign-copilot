import { describe, expect, it } from 'vitest';
import { brief, cachedStarters, roster } from '../data';
import {
  captionChecks,
  checkBannedExact,
  checkClaims,
  checkDisclosure,
  checkKeyword,
  checkLength,
  checkLink,
  creatorLink,
  exactChecks,
} from './checks';

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
    it('names the wrong link so the UI can highlight it, or says there is none', () => {
      expect(checkLink('#ad 20% off at https://fernway-deals.example.net/serum.', nurse, brief)).toMatchObject({
        passed: false,
        phrase: 'https://fernway-deals.example.net/serum',
      });
      expect(checkLink('#ad 20% off!', nurse, brief).reason).toMatch(/^No link/);
    });
  });
});

describe('exact checks: edge cases from docs/TESTING.md', () => {
  it('disclosure: #ad mid-sentence counts; #adorable does not', () => {
    expect(checkDisclosure('Loving this #ad serum', brief).passed).toBe(true);
    expect(checkDisclosure('So #adorable', brief).passed).toBe(false);
    expect(checkDisclosure('so good #adlife', brief).passed).toBe(false);
  });

  it('length: exactly at the limit passes, one over fails, emoji count as one character', () => {
    expect(checkLength('x'.repeat(500), brief).passed).toBe(true);
    expect(checkLength('x'.repeat(501), brief)).toMatchObject({ passed: false, reason: '501 characters; the limit is 500. Cut 1.' });
    expect(checkLength('🫶'.repeat(500), brief).passed).toBe(true);
  });

  it('keyword: the creator code as a whole word, any case', () => {
    expect(checkKeyword('#ad Comment NURSE20 and I will DM you', nurse).passed).toBe(true);
    expect(checkKeyword('#ad comment nurse20!', nurse).passed).toBe(true);
    expect(checkKeyword('#ad Comment NURSE200', nurse).passed).toBe(false);
    expect(checkKeyword('#ad Comment SERUM', nurse).passed).toBe(false);
  });

  it('banned claims: exact phrase in any case or spacing, and returns the phrase', () => {
    expect(checkBannedExact('It CURES   acne', brief)).toMatchObject({ passed: false, phrase: 'CURES   acne' });
    expect(checkBannedExact('Clinically Proven formula', brief).passed).toBe(false);
    expect(checkBannedExact('My breakouts cleared up', brief).passed).toBe(true); // paraphrase: the model's job
    expect(checkBannedExact('it secures acne-prone skin', brief).passed).toBe(true); // not a whole-word match
  });

  it('runs every exact check on a DM and caption together', () => {
    const failed = exactChecks(
      { dm: 'This cures acne: https://fernway.example.com/serum', captionCta: 'Comment SERUM', code: 'NURSE20' },
      brief,
    )
      .filter((c) => !c.passed)
      .map((c) => c.name);
    expect(failed).toEqual(['disclosure', 'link', 'banned_claim', 'disclosure', 'keyword']);
    expect(captionChecks('#ad Comment NURSE20', 'NURSE20', brief).every((c) => c.passed)).toBe(true);
  });
});
