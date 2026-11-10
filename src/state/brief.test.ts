import { describe, expect, it } from 'vitest';
import { formatWindow, parseLink, parseUsd, parseWindow } from './brief';

describe('brief field parsing', () => {
  it('formats and round-trips the posting window', () => {
    const text = formatWindow('2026-12-01', '2026-12-14');
    expect(text).toBe('Dec 1 – Dec 14, 2026');
    expect(parseWindow(text)).toEqual({ start: '2026-12-01', end: '2026-12-14' });
  });

  it('reads windows across a year and with plain hyphens', () => {
    expect(parseWindow('Dec 28 - Jan 4, 2027')).toEqual({ start: '2026-12-28', end: '2027-01-04' });
    expect(parseWindow('December 1 to December 14, 2026')).toEqual({ start: '2026-12-01', end: '2026-12-14' });
    expect(formatWindow('2026-12-28', '2027-01-04')).toBe('Dec 28, 2026 – Jan 4, 2027');
  });

  it('rejects impossible or backwards windows', () => {
    expect(parseWindow('Feb 30 – Mar 2, 2026')).toBeNull();
    expect(parseWindow('Dec 14 – Dec 1, 2026')).toBeNull();
    expect(parseWindow('soon')).toBeNull();
  });

  it('parses dollar amounts', () => {
    expect(parseUsd('$32,000')).toBe(32000);
    expect(parseUsd('$65 per purchase')).toBe(65);
    expect(parseUsd('4.50')).toBe(4.5);
    expect(parseUsd('$0')).toBeNull();
    expect(parseUsd('')).toBeNull();
  });

  it('does not pull a number out of unrelated text', () => {
    expect(parseUsd('fernway.example.com/serum-v2')).toBeNull();
    expect(parseUsd('about 30k')).toBeNull();
    expect(parseUsd('$32,00')).toBeNull();
    expect(parseUsd('$32000.50')).toBe(32000.5);
  });

  it('normalizes product links and rejects ones carrying a code', () => {
    expect(parseLink('fernway.example.com/serum')).toBe('https://fernway.example.com/serum');
    expect(parseLink('https://fernway.example.com/serum/')).toBe('https://fernway.example.com/serum');
    expect(parseLink('fernway.example.com/serum?code=NURSE20')).toBeNull();
    expect(parseLink('not a link')).toBeNull();
  });
});
