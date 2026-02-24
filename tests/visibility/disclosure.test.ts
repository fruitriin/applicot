import { describe, expect, test } from 'bun:test';
import {
  STAGE_ORDER,
  DisclosureTransitionError,
  isValidTransition,
  nextStage,
  canActorKnow,
  advanceDisclosure,
  createDisclosureState,
} from '../../src/core/visibility/disclosure.js';
import type { DisclosureState } from '../../src/core/visibility/types.js';

// helpers

function makeState(
  stage: DisclosureState['currentStage'],
  knownBy: string[] = ['EDT', 'CHR-alice'],
): DisclosureState {
  return {
    secretId: 'test-secret',
    currentStage: stage,
    knownBy,
    history: [],
  };
}

// STAGE_ORDER

describe('STAGE_ORDER', () => {
  test('contains all 5 stages in correct order', () => {
    expect(STAGE_ORDER).toEqual([
      'secret',
      'rumor',
      'suspicion',
      'confirmed',
      'public',
    ]);
  });
});

// isValidTransition

describe('isValidTransition', () => {
  test('advancing one step is valid', () => {
    expect(isValidTransition('secret', 'rumor')).toBe(true);
    expect(isValidTransition('rumor', 'suspicion')).toBe(true);
    expect(isValidTransition('suspicion', 'confirmed')).toBe(true);
    expect(isValidTransition('confirmed', 'public')).toBe(true);
  });

  test('skipping steps is valid', () => {
    expect(isValidTransition('secret', 'suspicion')).toBe(true);
    expect(isValidTransition('secret', 'public')).toBe(true);
    expect(isValidTransition('rumor', 'confirmed')).toBe(true);
  });

  test('same stage is invalid', () => {
    expect(isValidTransition('secret', 'secret')).toBe(false);
    expect(isValidTransition('public', 'public')).toBe(false);
  });

  test('regressing is invalid', () => {
    expect(isValidTransition('rumor', 'secret')).toBe(false);
    expect(isValidTransition('public', 'confirmed')).toBe(false);
    expect(isValidTransition('confirmed', 'rumor')).toBe(false);
  });
});

// nextStage

describe('nextStage', () => {
  test('returns next stage for each step', () => {
    expect(nextStage('secret')).toBe('rumor');
    expect(nextStage('rumor')).toBe('suspicion');
    expect(nextStage('suspicion')).toBe('confirmed');
    expect(nextStage('confirmed')).toBe('public');
  });

  test('returns null at public (terminal)', () => {
    expect(nextStage('public')).toBeNull();
  });
});

// canActorKnow

describe('canActorKnow', () => {
  test('EDT can always know regardless of stage', () => {
    for (const stage of STAGE_ORDER) {
      expect(canActorKnow('EDT', makeState(stage, []))).toBe(true);
    }
  });

  test('actors in knownBy can always know', () => {
    const state = makeState('secret', ['CHR-alice']);
    expect(canActorKnow('CHR-alice', state)).toBe(true);
    expect(canActorKnow('CHR-bob', state)).toBe(false);
  });

  test('secret stage: only knownBy actors (excluding EDT) can know', () => {
    const state = makeState('secret', ['CHR-alice']);
    expect(canActorKnow('CHR-bob', state)).toBe(false);
    expect(canActorKnow('ORG-guild', state)).toBe(false);
    expect(canActorKnow('NAT-kingdom', state)).toBe(false);
    expect(canActorKnow('AUT', state)).toBe(false);
  });

  test('rumor stage: only knownBy actors can know (ORG/NAT still blocked)', () => {
    const state = makeState('rumor', ['CHR-alice', 'CHR-bob']);
    expect(canActorKnow('CHR-carol', state)).toBe(false);
    expect(canActorKnow('ORG-guild', state)).toBe(false);
    expect(canActorKnow('NAT-kingdom', state)).toBe(false);
  });

  test('suspicion stage: ORG-* actors can know even if not in knownBy', () => {
    const state = makeState('suspicion', ['CHR-alice']);
    expect(canActorKnow('ORG-guild', state)).toBe(true);
    expect(canActorKnow('ORG-church', state)).toBe(true);
    expect(canActorKnow('CHR-bob', state)).toBe(false);
    expect(canActorKnow('NAT-kingdom', state)).toBe(false);
  });

  test('confirmed stage: ORG-* and NAT-* actors can know', () => {
    const state = makeState('confirmed', ['CHR-alice']);
    expect(canActorKnow('ORG-guild', state)).toBe(true);
    expect(canActorKnow('NAT-kingdom', state)).toBe(true);
    expect(canActorKnow('NAT-empire', state)).toBe(true);
    expect(canActorKnow('CHR-bob', state)).toBe(false);
    expect(canActorKnow('AUT', state)).toBe(false);
  });

  test('public stage: all actors can know', () => {
    const state = makeState('public', []);
    expect(canActorKnow('CHR-alice', state)).toBe(true);
    expect(canActorKnow('CHR-bob', state)).toBe(true);
    expect(canActorKnow('ORG-guild', state)).toBe(true);
    expect(canActorKnow('NAT-kingdom', state)).toBe(true);
    expect(canActorKnow('AUT', state)).toBe(true);
    expect(canActorKnow('RDR-ANA', state)).toBe(true);
  });
});

// advanceDisclosure

describe('advanceDisclosure', () => {
  test('advances stage and appends event to history', () => {
    const state = createDisclosureState('secret-1', ['EDT', 'CHR-alice']);
    const next = advanceDisclosure(state, 'rumor', 'CHR-alice told CHR-bob');
    expect(next.currentStage).toBe('rumor');
    expect(next.history).toHaveLength(1);
    expect(next.history[0]?.fromStage).toBe('secret');
    expect(next.history[0]?.toStage).toBe('rumor');
    expect(next.history[0]?.trigger).toBe('CHR-alice told CHR-bob');
  });

  test('merges newKnownBy into knownBy (deduplication)', () => {
    const state = createDisclosureState('secret-1', ['EDT', 'CHR-alice']);
    const next = advanceDisclosure(state, 'rumor', 'CHR-alice told CHR-bob', [
      'CHR-alice',
      'CHR-bob',
    ]);
    expect(next.knownBy).toContain('EDT');
    expect(next.knownBy).toContain('CHR-alice');
    expect(next.knownBy).toContain('CHR-bob');
    // No duplicates
    expect(next.knownBy.filter((a) => a === 'CHR-alice')).toHaveLength(1);
  });

  test('learnedBy is set in event when newKnownBy provided', () => {
    const state = createDisclosureState('secret-1', ['EDT']);
    const next = advanceDisclosure(state, 'rumor', 'some trigger', ['CHR-bob']);
    expect(next.history[0]?.learnedBy).toEqual(['CHR-bob']);
  });

  test('learnedBy is absent when newKnownBy is empty or not provided', () => {
    const state = createDisclosureState('secret-1', ['EDT']);
    const next = advanceDisclosure(state, 'rumor', 'trigger');
    expect(next.history[0]?.learnedBy).toBeUndefined();

    const next2 = advanceDisclosure(state, 'rumor', 'trigger', []);
    expect(next2.history[0]?.learnedBy).toBeUndefined();
  });

  test('does not mutate original state', () => {
    const state = createDisclosureState('secret-1', ['EDT', 'CHR-alice']);
    const next = advanceDisclosure(state, 'rumor', 'trigger', ['CHR-bob']);
    expect(state.currentStage).toBe('secret');
    expect(state.knownBy).not.toContain('CHR-bob');
    expect(state.history).toHaveLength(0);
    expect(next).not.toBe(state);
  });

  test('throws DisclosureTransitionError on invalid transition', () => {
    const state = makeState('rumor');
    expect(() =>
      advanceDisclosure(state, 'secret', 'trying to regress')
    ).toThrow(DisclosureTransitionError);
    expect(() =>
      advanceDisclosure(state, 'rumor', 'same stage')
    ).toThrow(DisclosureTransitionError);
  });

  test('can skip stages (secret to confirmed)', () => {
    const state = createDisclosureState('secret-1', ['EDT']);
    const next = advanceDisclosure(state, 'confirmed', 'major revelation');
    expect(next.currentStage).toBe('confirmed');
    expect(next.history[0]?.fromStage).toBe('secret');
    expect(next.history[0]?.toStage).toBe('confirmed');
  });

  test('history accumulates across multiple advances', () => {
    let state = createDisclosureState('secret-1', ['EDT']);
    state = advanceDisclosure(state, 'rumor', 'first leak');
    state = advanceDisclosure(state, 'suspicion', 'investigation begins');
    state = advanceDisclosure(state, 'public', 'revealed in court');
    expect(state.history).toHaveLength(3);
    expect(state.history[0]?.toStage).toBe('rumor');
    expect(state.history[1]?.toStage).toBe('suspicion');
    expect(state.history[2]?.toStage).toBe('public');
  });
});

// createDisclosureState

describe('createDisclosureState', () => {
  test("creates state at 'secret' stage", () => {
    const state = createDisclosureState('my-secret', ['EDT', 'CHR-alice']);
    expect(state.secretId).toBe('my-secret');
    expect(state.currentStage).toBe('secret');
    expect(state.knownBy).toEqual(['EDT', 'CHR-alice']);
    expect(state.history).toHaveLength(0);
  });

  test('does not share reference with input array', () => {
    const input = ['EDT'];
    const state = createDisclosureState('secret-1', input);
    input.push('CHR-intruder');
    expect(state.knownBy).not.toContain('CHR-intruder');
  });
});
