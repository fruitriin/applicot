/**
 * Actor Activation — 3-State Model
 *
 * States:
 *   active  — Currently participating in this scene (full data + output)
 *   dormant — Exists but irrelevant (no API calls, no data, state frozen)
 *   standby — Monitoring for triggers (minimal access: trigger info only, no output)
 */

import type { ActorId } from '../core/types/ids.js';
import type { ActorOperatingState } from '../core/types/actor.js';
import type { ScenePrompt } from './types.js';

// ── Activation List ──

export interface ActivationList {
  characters: ActorId[];
  organizations: ActorId[];
  nations: ActorId[];
  env: boolean;
}

// ── Standby Context ──

export interface StandbyContext {
  actorId: ActorId;
  /** Trigger condition in natural language: '戦争開始', '外交交渉' etc. */
  triggerCondition: string;
}

// ── State Transition Rules ──

/**
 * Validates whether a state transition is allowed.
 *
 * Allowed transitions:
 *   dormant → active    (explicit EDT activation)
 *   dormant → standby   (EDT sets to monitoring mode)
 *   active  → dormant   (scene end or EDT deactivation)
 *   active  → standby   (EDT sets to monitoring mode)
 *   standby → active    (trigger fired)
 *   standby → dormant   (trigger cancelled or timeout)
 */
export function canTransition(
  from: ActorOperatingState,
  to: ActorOperatingState,
): boolean {
  if (from === to) return false;
  if (from === 'dormant' && to === 'active') return true;
  if (from === 'dormant' && to === 'standby') return true;
  if (from === 'active' && to === 'dormant') return true;
  if (from === 'active' && to === 'standby') return true;
  if (from === 'standby' && to === 'active') return true;
  if (from === 'standby' && to === 'dormant') return true;
  return false;
}

// ── Dormant Actor Constraints ──

/**
 * Rules enforced for dormant actors.
 *
 * Rule 1: Dormant actors do not receive information
 * Rule 2: Dormant actor state is frozen (no updates)
 * Rule 3: Other actors may reference dormant actors only within recall range
 * Rule 4: Long-term dormant (5+ scenes) → EDT generates recovery summary on return
 * Rule 5: Nation/org dormancy = 'time delay' (no active major decisions)
 */
export const DORMANT_RULES = {
  receivesData: false as const,
  stateUpdated: false as const,
  referencedBy: 'recall-only' as const,
  longTermThreshold: 5, // scenes before EDT generates recovery summary
} as const;

// ── Standby Actor Constraints ──

/**
 * Standby actors have minimal participation:
 * - Can only access trigger information (not full scene data)
 * - Generate no output
 * - State is not updated
 */
export const STANDBY_RULES = {
  receivesData: 'trigger-only' as const,
  generatesOutput: false as const,
  stateUpdated: false as const,
} as const;

// ── Build Activation List ──

/**
 * Extracts an ActivationList from a ScenePrompt.
 * Only actors explicitly listed in activatedActors participate in the scene.
 */
export function buildActivationList(prompt: ScenePrompt): ActivationList {
  const { activatedActors } = prompt;
  return {
    characters: activatedActors.filter((id) => id.startsWith('CHR-')) as ActorId[],
    organizations: activatedActors.filter((id) => id.startsWith('ORG-')) as ActorId[],
    nations: activatedActors.filter((id) => id.startsWith('NAT-')) as ActorId[],
    env: activatedActors.includes('ENV'),
  };
}

// ── Wartime NAT Activation Frequency ──

/**
 * In wartime, NAT actors update more frequently:
 *   Normal:  every 2 scenes
 *   Wartime: every scene
 */
export interface NatActivationConfig {
  natId: string;
  isWartime: boolean;
  lastActivatedScene: number;
}

export function shouldActivateNat(
  config: NatActivationConfig,
  currentScene: number,
): boolean {
  const interval = config.isWartime ? 1 : 2;
  return currentScene - config.lastActivatedScene >= interval;
}
