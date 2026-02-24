import { actorTypeFromId, entityIdFromActorId } from "../types/index.js";
import type { AccessContext, AccessResult, BarrierRule } from "./types.js";
import { ABSOLUTE_BARRIERS, CREATIVE_ACTOR_TYPES, LEVEL_2_BARRIERS, LEVEL_3_BARRIERS } from "./rules.js";
import type { NovelConfig } from "./novel-config.js";
import { applyConditionalAccess, checkEdtOverride } from "./rules-conditional.js";

export interface VisibilityEngine {
  /** Check if an actor can access a piece of data */
  canAccess(context: AccessContext): AccessResult;
}

/**
 * Create a visibility engine with Level 1 (absolute) barriers.
 * Level 2 and 3 barriers will be added in Phase 2.
 */
export function createVisibilityEngine(config?: NovelConfig): VisibilityEngine {
  return {
    canAccess(context: AccessContext): AccessResult {
      const { actorId, dataId } = context;

      for (const rule of ABSOLUTE_BARRIERS) {
        if (matchesRule(rule, actorId, dataId)) {
          return {
            allowed: false,
            deniedBy: rule,
            reason: rule.description ?? `Blocked by Level ${rule.level} barrier`,
          };
        }
      }

      // Level 2: Principal barriers (EdtOverride can relax)
      for (const rule of LEVEL_2_BARRIERS) {
        if (matchesRule(rule, actorId, dataId)) {
          if (checkEdtOverride(context, dataId)) {
            return {
              allowed: true,
              reason: "EDT override: Level 2 barrier relaxed for " + dataId,
            };
          }
          return {
            allowed: false,
            deniedBy: rule,
            reason: rule.description ?? "Blocked by Level 2 barrier",
          };
        }
      }

      // Level 3: Recommended barriers (config-switchable)
      if (config?.enableLevel3Barriers !== false) {
        for (const rule of LEVEL_3_BARRIERS) {
          if (matchesRule(rule, actorId, dataId)) {
            return {
              allowed: false,
              deniedBy: rule,
              reason: rule.description ?? "Blocked by Level 3 barrier (disable via NovelConfig)",
            };
          }
        }
      }

      // Conditional access (NAT layers, ORG layers)
      const conditionalResult = applyConditionalAccess(context);
      if (conditionalResult !== null) {
        return conditionalResult;
      }

      return {
        allowed: true,
        reason: "No barrier rule matched; access granted",
      };
    },
  };
}

/** Check if a barrier rule matches the given actor and data */
function matchesRule(rule: BarrierRule, actorId: string, dataId: string): boolean {
  if (!matchesActorPattern(rule.actor, actorId)) return false;
  if (!matchesDataPattern(rule.data, dataId)) return false;
  return checkCondition(rule.condition, actorId, dataId);
}

function matchesActorPattern(pattern: string, actorId: string): boolean {
  // Group alias
  if (pattern === "creative_actors") {
    try {
      const actorType = actorTypeFromId(actorId);
      return (CREATIVE_ACTOR_TYPES as readonly string[]).includes(actorType);
    } catch {
      return false;
    }
  }

  // Wildcard: "CHR-*" matches "CHR-alice", "CHR-bob", etc.
  if (pattern.endsWith("-*")) {
    const prefix = pattern.slice(0, -1); // "CHR-"
    return actorId.startsWith(prefix);
  }

  // Also match type-only: "CHR-*" matches "CHR-anything"
  if (pattern.includes("*")) {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return regex.test(actorId);
  }

  // Exact match
  return pattern === actorId;
}

function matchesDataPattern(pattern: string, dataId: string): boolean {
  // Wildcard: "HO-PRV-*" matches "HO-PRV-alice"
  if (pattern.endsWith("-*")) {
    const prefix = pattern.slice(0, -1); // "HO-PRV-"
    return dataId.startsWith(prefix);
  }

  // "HO-*" matches "HO-PUB", "HO-PRV-x", "HO-GM"
  if (pattern.includes("*")) {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return regex.test(dataId);
  }

  // Exact match or prefix match for composite IDs
  // e.g. "HO-GM" matches "HO-GM" and "HO-GM-scenario"
  if (dataId === pattern || dataId.startsWith(pattern + "-")) {
    return true;
  }

  return false;
}

function checkCondition(
  condition: string,
  actorId: string,
  dataId: string,
): boolean {
  switch (condition) {
    case "always":
      return true;

    case "not_own": {
      // Extract entity ID from both actor and data to check ownership
      const actorEntity = entityIdFromActorId(actorId);
      // For data like "HO-PRV-alice", extract "alice"
      // For data like "RDR-ANA", extract "ANA" (or full after prefix)
      const actorType = actorTypeFromId(actorId);

      if (dataId.startsWith("HO-PRV-")) {
        const dataEntity = dataId.slice("HO-PRV-".length);
        return actorEntity !== dataEntity;
      }

      if (dataId.startsWith("ST-CHR-")) {
        const dataEntity = dataId.slice("ST-CHR-".length);
        return actorEntity !== dataEntity;
      }

      if (dataId.startsWith("ST-ORG-")) {
        const dataEntity = dataId.slice("ST-ORG-".length);
        return actorEntity !== dataEntity;
      }

      if (dataId.startsWith("RDR-")) {
        // RDR-ANA checking RDR-EMO → not_own = true
        const dataEntity = dataId.slice("RDR-".length);
        if (actorType === "RDR") {
          return actorEntity !== dataEntity;
        }
        return true;
      }

      // Default: treat as not own
      return true;
    }

    case "unread":
      // Phase 0: always treat as blocked for simplicity.
      // Proper unread tracking will be added in later phases.
      return true;

    default:
      return false;
  }
}
