import type { Language } from "./translations";

const DEVANAGARI_CHAR_REGEX = /[\u0900-\u097F]/;
const ASCII_LETTER_REGEX = /[a-z]/i;

const VOWEL_PATTERNS: Array<{
  pattern: string;
  standalone: string;
  matra: string;
}> = [
  { pattern: "aa", standalone: "आ", matra: "ा" },
  { pattern: "ii", standalone: "ई", matra: "ी" },
  { pattern: "ee", standalone: "ई", matra: "ी" },
  { pattern: "uu", standalone: "ऊ", matra: "ू" },
  { pattern: "oo", standalone: "ऊ", matra: "ू" },
  { pattern: "ai", standalone: "ऐ", matra: "ै" },
  { pattern: "au", standalone: "औ", matra: "ौ" },
  { pattern: "a", standalone: "अ", matra: "" },
  { pattern: "i", standalone: "इ", matra: "ि" },
  { pattern: "u", standalone: "उ", matra: "ु" },
  { pattern: "e", standalone: "ए", matra: "े" },
  { pattern: "o", standalone: "ओ", matra: "ो" },
];

const CONSONANT_PATTERNS: Array<{ pattern: string; devanagari: string }> = [
  { pattern: "ksh", devanagari: "क्ष" },
  { pattern: "gny", devanagari: "ज्ञ" },
  { pattern: "chh", devanagari: "छ" },
  { pattern: "sh", devanagari: "श" },
  { pattern: "kh", devanagari: "ख" },
  { pattern: "gh", devanagari: "घ" },
  { pattern: "ch", devanagari: "च" },
  { pattern: "jh", devanagari: "झ" },
  { pattern: "th", devanagari: "थ" },
  { pattern: "dh", devanagari: "ध" },
  { pattern: "ph", devanagari: "फ" },
  { pattern: "bh", devanagari: "भ" },
  { pattern: "gn", devanagari: "ज्ञ" },
  { pattern: "ny", devanagari: "ञ" },
  { pattern: "ng", devanagari: "ङ" },
  { pattern: "q", devanagari: "क" },
  { pattern: "w", devanagari: "व" },
  { pattern: "x", devanagari: "क्स" },
  { pattern: "z", devanagari: "ज" },
  { pattern: "k", devanagari: "क" },
  { pattern: "g", devanagari: "ग" },
  { pattern: "c", devanagari: "क" },
  { pattern: "j", devanagari: "ज" },
  { pattern: "t", devanagari: "त" },
  { pattern: "d", devanagari: "द" },
  { pattern: "n", devanagari: "न" },
  { pattern: "p", devanagari: "प" },
  { pattern: "b", devanagari: "ब" },
  { pattern: "m", devanagari: "म" },
  { pattern: "y", devanagari: "य" },
  { pattern: "r", devanagari: "र" },
  { pattern: "l", devanagari: "ल" },
  { pattern: "v", devanagari: "व" },
  { pattern: "s", devanagari: "स" },
  { pattern: "h", devanagari: "ह" },
  { pattern: "f", devanagari: "फ" },
];

const transliterationCache = new Map<string, string>();
const TRANSLITERATION_CACHE_LIMIT = 20000;

function matchPattern<T extends { pattern: string }>(
  text: string,
  startIndex: number,
  patterns: readonly T[]
): T | null {
  for (const item of patterns) {
    if (text.startsWith(item.pattern, startIndex)) return item;
  }
  return null;
}

function hasConsonantAt(text: string, index: number): boolean {
  return !!matchPattern(text, index, CONSONANT_PATTERNS);
}

function transliterateLatinWord(word: string): string {
  const source = word.toLowerCase();
  let output = "";
  let index = 0;

  while (index < source.length) {
    const consonant = matchPattern(source, index, CONSONANT_PATTERNS);
    if (consonant) {
      output += consonant.devanagari;
      index += consonant.pattern.length;

      const vowel = matchPattern(source, index, VOWEL_PATTERNS);
      if (vowel) {
        output += vowel.matra;
        index += vowel.pattern.length;
      } else if (index < source.length && hasConsonantAt(source, index)) {
        output += "्";
      }
      continue;
    }

    const vowel = matchPattern(source, index, VOWEL_PATTERNS);
    if (vowel) {
      output += vowel.standalone;
      index += vowel.pattern.length;
      continue;
    }

    output += source[index];
    index += 1;
  }

  return output;
}

function transliterateLatinToDevanagari(value: string): string {
  return value.replace(/[A-Za-z]+/g, (word) => transliterateLatinWord(word));
}

export function localizeClientName(name: string, language: Language): string {
  if (language === "en") return name;
  if (!name || !ASCII_LETTER_REGEX.test(name)) return name;
  if (DEVANAGARI_CHAR_REGEX.test(name)) return name;

  const cacheKey = `${language}|${name}`;
  const cached = transliterationCache.get(cacheKey);
  if (cached) return cached;

  const translated = transliterateLatinToDevanagari(name);
  if (transliterationCache.size >= TRANSLITERATION_CACHE_LIMIT) {
    transliterationCache.clear();
  }
  transliterationCache.set(cacheKey, translated);
  return translated;
}
