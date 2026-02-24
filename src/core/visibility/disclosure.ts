import type { DisclosureStage, DisclosureEvent, DisclosureState } from './types.js';

/** Ordered progression of disclosure stages (earliest to latest) */
export const STAGE_ORDER: DisclosureStage[] = [
  'secret',
  'rumor',
  'suspicion',
  'confirmed',
  'public',
];

/**
 * Error thrown when an invalid stage transition is attempted.
 * Transitions can only advance (not regress) through the STAGE_ORDER.
 */
export class DisclosureTransitionError extends Error {
  readonly fromStage: DisclosureStage;
  readonly toStage: DisclosureStage;

  constructor(fromStage: DisclosureStage, toStage: DisclosureStage, reason?: string) {
    super(
      reason ??
        `Invalid disclosure transition: ${fromStage} to ${toStage} (can only advance)`
    );
    this.name = 'DisclosureTransitionError';
    this.fromStage = fromStage;
    this.toStage = toStage;
  }
}

/**
 * Check if a stage transition is valid.
 * Transitions must advance (toStage must come after fromStage in STAGE_ORDER).
 * Transitioning to the same stage or regressing is invalid.
 */
export function isValidTransition(
  from: DisclosureStage,
  to: DisclosureStage,
): boolean {
  const fromIdx = STAGE_ORDER.indexOf(from);
  const toIdx = STAGE_ORDER.indexOf(to);
  return toIdx > fromIdx;
}

/**
 * Return the next stage after current, or null if already at 'public'.
 */
export function nextStage(current: DisclosureStage): DisclosureStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1] ?? null;
}

/**
 * Determine if an actor can know about a secret based on the current disclosure state.
 *
 * Stage-based access expansion:
 * - 'secret':    Only actors explicitly in knownBy (plus EDT)
 * - 'rumor':     Only actors in knownBy (rumor recipients are added to knownBy when advancing)
 * - 'suspicion': knownBy + any ORG-* actor (organizations begin investigating)
 * - 'confirmed': knownBy + any ORG-* + any NAT-* actor (nations take notice)
 * - 'public':    All actors
 */
export function canActorKnow(actorId: string, state: DisclosureState): boolean {
  // EDT is always omniscient
  if (actorId === 'EDT') return true;

  // Explicitly known actors can always access
  if (state.knownBy.includes(actorId)) return true;

  const stage = state.currentStage;

  switch (stage) {
    case 'secret':
    case 'rumor':
      // Only explicitly knownBy (already handled above)
      return false;

    case 'suspicion':
      // ORG-* actors gain access at suspicion level
      return actorId.startsWith('ORG-');

    case 'confirmed':
      // ORG-* and NAT-* actors gain access at confirmed level
      return actorId.startsWith('ORG-') || actorId.startsWith('NAT-');

    case 'public':
      return true;

    default:
      return false;
  }
}

/**
 * Advance a disclosure state to a new stage.
 *
 * @param state - Current disclosure state
 * @param toStage - Target stage (must be later than current stage)
 * @param trigger - Description of what triggered this advance (e.g., 'CHR-alice found the letter')
 * @param newKnownBy - Additional actors who learn about the secret at this stage
 * @returns New DisclosureState (original is not mutated)
 * @throws DisclosureTransitionError if the transition is invalid
 */
export function advanceDisclosure(
  state: DisclosureState,
  toStage: DisclosureStage,
  trigger: string,
  newKnownBy?: string[],
): DisclosureState {
  if (!isValidTransition(state.currentStage, toStage)) {
    throw new DisclosureTransitionError(state.currentStage, toStage);
  }

  const event: DisclosureEvent = {
    fromStage: state.currentStage,
    toStage,
    trigger,
    timestamp: new Date().toISOString(),
    ...(newKnownBy && newKnownBy.length > 0 ? { learnedBy: newKnownBy } : {}),
  };

  // Merge new knownBy actors (deduplicate)
  const mergedKnownBy = newKnownBy
    ? [...new Set([...state.knownBy, ...newKnownBy])]
    : [...state.knownBy];

  return {
    secretId: state.secretId,
    currentStage: toStage,
    knownBy: mergedKnownBy,
    history: [...state.history, event],
  };
}

/**
 * Create an initial disclosure state for a new secret.
 *
 * @param secretId - Unique identifier for the secret (e.g., 'chr-alice-true-identity')
 * @param initialKnownBy - Actors who know from the start (typically EDT + the character)
 * @returns New DisclosureState at 'secret' stage
 */
export function createDisclosureState(
  secretId: string,
  initialKnownBy: string[],
): DisclosureState {
  return {
    secretId,
    currentStage: 'secret',
    knownBy: [...initialKnownBy],
    history: [],
  };
}
