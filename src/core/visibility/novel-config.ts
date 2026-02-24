/**
 * Novel-level configuration for the visibility engine.
 * Loaded from meta/config.json or passed programmatically.
 */

export interface NovelConfig {
  /**
   * Enable Level 3 (recommended) barriers.
   * Level 3 barriers can be disabled for unconventional story styles.
   * Default: true
   */
  enableLevel3Barriers?: boolean;
}

export function defaultNovelConfig(): NovelConfig {
  return { enableLevel3Barriers: true };
}
