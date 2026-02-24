import type { BarrierRule } from "./types.js";

/**
 * Level 1: Absolute barriers (hardcoded, cannot be overridden).
 * From planning_doc.md section 6.1.
 */
export const ABSOLUTE_BARRIERS: BarrierRule[] = [
  // CHR-A cannot see CHR-B's private handout
  {
    actor: "CHR-*",
    data: "HO-PRV-*",
    condition: "not_own",
    level: "1",
    description: "Character cannot see other characters' private handouts",
  },
  // CHR-* cannot see GM handout
  {
    actor: "CHR-*",
    data: "HO-GM",
    condition: "always",
    level: "1",
    description: "Characters cannot see GM handout",
  },
  // AUT cannot see any private handout
  {
    actor: "AUT",
    data: "HO-PRV-*",
    condition: "always",
    level: "1",
    description: "Author cannot see private handouts (writes without bias)",
  },
  // AUT cannot see GM handout
  {
    actor: "AUT",
    data: "HO-GM",
    condition: "always",
    level: "1",
    description: "Author cannot see GM handout (no knowledge of endings)",
  },
  // RDR-* cannot see any handout
  {
    actor: "RDR-*",
    data: "HO-*",
    condition: "always",
    level: "1",
    description: "Readers cannot see any handouts",
  },
  // RDR-* cannot see unread scene chunks
  {
    actor: "RDR-*",
    data: "OUT-SCN",
    condition: "unread",
    level: "1",
    description: "Readers must read scenes sequentially",
  },
  // Creative actors cannot see evaluation data
  {
    actor: "creative_actors",
    data: "EVL-*",
    condition: "always",
    level: "1",
    description: "Creative actors cannot see reader evaluations",
  },
  // RDR-A cannot see RDR-B's evaluation
  {
    actor: "RDR-*",
    data: "RDR-*",
    condition: "not_own",
    level: "1",
    description: "Each reader persona's evaluation is independent",
  },
];


/**
 * Level 2: Principal barriers (can be relaxed by EdtOverride).
 * These enforce information boundaries that may have in-story exceptions
 * (e.g., telepathy, shared visions, EDT-sanctioned info transfer).
 */
export const LEVEL_2_BARRIERS: BarrierRule[] = [
  // CHR-A cannot directly access CHR-B's full state
  // (observable field filtering is handled by the prompt builder)
  {
    actor: 'CHR-*',
    data: 'ST-CHR-*',
    condition: 'not_own',
    level: '2',
    description: "Characters cannot directly access other characters\u0027 state (EdtOverride can relax for telepathy etc.)",
  },
];

/**
 * Level 3: Recommended barriers (configurable via NovelConfig).
 * These represent best practices for narrative integrity but may be
 * legitimately disabled for certain story structures.
 */
export const LEVEL_3_BARRIERS: BarrierRule[] = [
  // AUT should not directly access character state (preserves unbiased writing)
  {
    actor: 'AUT',
    data: 'ST-CHR-*',
    condition: 'always',
    level: '3',
    description: 'Author should not directly access character state (preserves unbiased writing; disable for omniscient narrator style)',
  },
  // AUT should not directly access nation state
  {
    actor: 'AUT',
    data: 'ST-NAT-*',
    condition: 'always',
    level: '3',
    description: 'Author should not directly access nation state (disable for political thriller style)',
  },
  // AUT should not directly access organization state
  {
    actor: 'AUT',
    data: 'ST-ORG-*',
    condition: 'always',
    level: '3',
    description: 'Author should not directly access organization state',
  },
];

/** Group alias: creative actors that should not see evaluations */
export const CREATIVE_ACTOR_TYPES = ["ENV", "NAT", "ORG", "CHR", "AUT"] as const;
