import { z } from "zod";

/** Barrier strictness levels */
export const BarrierLevelEnum = z.enum(["1", "2", "3"]);
export type BarrierLevel = z.infer<typeof BarrierLevelEnum>;

/**
 * Condition for when a barrier applies:
 * - "always": barrier always applies
 * - "not_own": barrier applies when accessing other entities' data (not own)
 * - "unread": barrier applies for unread content
 */
export const BarrierConditionEnum = z.enum(["always", "not_own", "unread"]);
export type BarrierCondition = z.infer<typeof BarrierConditionEnum>;

/**
 * A barrier rule definition.
 * Actor and data patterns use wildcards:
 * - "CHR-*" matches any character actor
 * - "HO-PRV-*" matches any private handout
 * - "creative_actors" is a group alias for ENV, NAT-*, ORG-*, CHR-*, AUT
 */
export interface BarrierRule {
  actor: string;
  data: string;
  condition: BarrierCondition;
  level: BarrierLevel;
  description?: string;
}

/** Affiliation info for conditional access checks */
export interface AccessAffiliation {
  entityId: string;
  role: string;
  accessLevel: "public" | "internal" | "secret";
}

/** Context for access decisions */
export interface AccessContext {
  /** The requesting actor's ID */
  actorId: string;
  /** The data being accessed */
  dataId: string;
  /** Actor's affiliations (for role-based access) */
  actorAffiliations?: AccessAffiliation[];
  /** Espionage capability (for NAT inter-access) */
  espionageCapability?: number;
  /** EDT override for temporary barrier relaxation */
  edtOverride?: {
    reason: string;
    scope: string;
    expiresAfterScene: number;
  };
}

/** Result of a visibility check */
export interface AccessResult {
  allowed: boolean;
  /** Which rule denied access, if any */
  deniedBy?: BarrierRule;
  /** Reason for the decision */
  reason: string;
}
