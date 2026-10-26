// Bengali words for the keyword half of the assistant's search. Postgres's 'simple' text search
// splits Bengali into words correctly but knows no Bengali grammar, so "আলুর" would not find "আলু".
// Both the stored text and the query go through the same light suffix stripping here.

// Longest first, so "গুলোর" goes before "র". য় is written as য + nukta after NFC.
const SUFFIXES = ['গুলোর', 'গুলো', 'গুলি', 'দের', 'টির', 'টার', 'য়ের', 'ের', 'টা', 'টি', 'তে', 'কে', 'য়', 'র'].map((s) =>
  s.normalize('NFC'),
)
// A shorter stem is more often a different word ("সার" is fertiliser, not "সা" + র).
const MIN_STEM = 3

export function stemBn(word: string): string {
  const w = word.normalize('NFC')
  for (const suffix of SUFFIXES) {
    if (w.endsWith(suffix) && w.length - suffix.length >= MIN_STEM) return w.slice(0, -suffix.length)
  }
  return w
}

// Letters, Bengali signs and digits form words; everything else (spaces, ।, commas) splits them.
export function wordsOf(text: string): string[] {
  return text
    .normalize('NFC')
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((w) => w.length > 1)
}

// The text Postgres indexes and the words a query looks for: stems, de-duplicated, in order.
export const stemmedText = (text: string): string => [...new Set(wordsOf(text).map(stemBn))].join(' ')
