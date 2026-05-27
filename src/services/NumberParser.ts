import { VoiceCommand } from '../types';

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

// "double two" -> 22, "double five" -> 55  (Indian English shorthand)
const DOUBLE_MAP: Record<string, number> = {
  zero: 0, one: 11, two: 22, three: 33, four: 44, five: 55,
  six: 66, seven: 77, eight: 88, nine: 99,
};

function parseWordNumber(words: string[]): number | null {
  let i = 0;
  let total = 0;
  let current = 0;

  while (i < words.length) {
    const w = words[i];
    if (w === 'hundred') {
      current = current === 0 ? 100 : current * 100;
      i++;
    } else if (w === 'double' && i + 1 < words.length) {
      const next = words[i + 1];
      if (DOUBLE_MAP[next] !== undefined) {
        current += DOUBLE_MAP[next];
        i += 2;
      } else {
        return null;
      }
    } else if (UNITS[w] !== undefined) {
      current += UNITS[w];
      i++;
    } else if (TENS[w] !== undefined) {
      current += TENS[w];
      i++;
    } else {
      return null;
    }
  }

  total += current;
  return total > 0 || words.includes('zero') ? total : null;
}

function parseToken(token: string): number | null | 'ABSENT' {
  const t = token.trim().toLowerCase().replace(/-/g, ' ');
  if (!t) {
    return undefined as unknown as null;
  }
  if (t === 'absent' || t === 'ab') {
    return 'ABSENT';
  }
  // Pure integer
  const asInt = parseInt(t, 10);
  if (!isNaN(asInt) && String(asInt) === t) {
    return asInt;
  }
  // Word-based number
  const words = t.split(/\s+/).filter(Boolean);
  return parseWordNumber(words);
}

export function parseVoiceInput(raw: string): VoiceCommand {
  const normalized = raw.trim().toLowerCase();

  // Correction / clear commands
  if (/^(correction|correct|clear row|clear|undo|mistake|retry)/.test(normalized)) {
    return { type: 'CORRECT' };
  }

  // Done / finish commands
  if (/^(done|finish|end session|stop|complete)/.test(normalized)) {
    return { type: 'DONE' };
  }

  // Roll number: "roll 1", "roll number 1", "roll one"
  const rollMatch = normalized.match(/^roll\s+(?:number\s+)?(\w+)/);
  if (rollMatch) {
    const rolPart = rollMatch[1];
    const asInt = parseInt(rolPart, 10);
    if (!isNaN(asInt)) {
      return { type: 'ROLL', rollNumber: asInt };
    }
    const wordNum = parseWordNumber(rolPart.split(/\s+/));
    if (wordNum !== null) {
      return { type: 'ROLL', rollNumber: wordNum };
    }
  }

  // Parse as a sequence of marks (comma or space delimited)
  // First try comma-split, then space-split with multi-word number grouping
  const commaParts = normalized.split(/,\s*/);
  const values: (number | null)[] = [];
  let parseOk = true;

  for (const part of commaParts) {
    const result = parseToken(part);
    if (result === 'ABSENT') {
      values.push(null);
    } else if (result === null || result === undefined) {
      parseOk = false;
      break;
    } else {
      values.push(result);
    }
  }

  if (parseOk && values.length > 0) {
    return { type: 'MARKS', values };
  }

  return { type: 'UNKNOWN', raw };
}
