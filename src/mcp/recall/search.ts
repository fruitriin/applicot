import type { RecallEntry } from "../../core/types/recall.js";

export interface RecallSearchOptions {
  query?: string;
  tags?: string[];
  emotion?: string;
  minImportance?: number;
}

/**
 * Filter recall entries by search criteria.
 * Linear search over entries — suitable for Phase 1 scale.
 */
export function searchEntries(
  entries: RecallEntry[],
  options: RecallSearchOptions,
): RecallEntry[] {
  let results = entries;

  if (options.query) {
    const q = options.query.toLowerCase();
    results = results.filter(
      (e) =>
        e.content.toLowerCase().includes(q) ||
        e.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }

  if (options.tags && options.tags.length > 0) {
    results = results.filter((e) =>
      options.tags!.every((t) => e.emotionTags.includes(t)),
    );
  }

  if (options.emotion) {
    results = results.filter((e) =>
      e.emotionTags.includes(options.emotion!),
    );
  }

  if (options.minImportance !== undefined) {
    results = results.filter((e) => e.importance >= options.minImportance!);
  }

  // Sort by importance descending
  results.sort((a, b) => b.importance - a.importance);

  return results;
}
