import { encode, decode } from 'gpt-tokenizer';

export function countTokens(text: string): number {
  return encode(text).length;
}

export function getFirstNTokens(text: string, n: number): string {
  const tokens = encode(text);
  if (tokens.length <= n) return text;
  const truncatedTokens = tokens.slice(0, n);
  return decode(truncatedTokens);
}

export function getLastNTokens(text: string, n: number): string {
  const tokens = encode(text);
  if (tokens.length <= n) return text;
  const truncatedTokens = tokens.slice(-n);
  return decode(truncatedTokens);
}

export function estimateTokens(text: string): number {
  // Quick estimation without full tokenization
  // Average English word is ~1.3 tokens, but for multilingual ~1.5 is safer
  const words = text.split(/\s+/).length;
  return Math.ceil(words * 1.5);
}
