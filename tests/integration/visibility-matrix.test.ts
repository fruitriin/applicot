/**
 * Integration test: Phase 2 visibility matrix
 *
 * Validates that all visibility layers work together correctly:
 *   Level 1 — Absolute barriers (no override possible)
 *   Level 2 — Principal barriers (EdtOverride-relaxable)
 *   Level 3 — Recommended barriers (NovelConfig-switchable)
 *   Conditional — NAT/ORG layer access
 *   Disclosure — 5-stage canActorKnow
 *   Recall — RecallViolationError integration
 */

import { describe, expect, test } from 'bun:test';
import { createVisibilityEngine } from '../../src/core/visibility/engine.js';
import {
  canActorKnow,
  createDisclosureState,
  advanceDisclosure,
} from '../../src/core/visibility/disclosure.js';
import {
  validateRecallSource,
  RecallViolationError,
} from '../../src/core/store/recall-store.js';
import type { AccessContext } from '../../src/core/visibility/types.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function ctx(actorId: string, dataId: string, extra?: Partial<AccessContext>): AccessContext {
  return { actorId, dataId, ...extra };
}

const engine = createVisibilityEngine();
const engineL3off = createVisibilityEngine({ enableLevel3Barriers: false });

function allowed(actorId: string, dataId: string, extra?: Partial<AccessContext>): boolean {
  return engine.canAccess(ctx(actorId, dataId, extra)).allowed;
}

function allowedL3off(actorId: string, dataId: string, extra?: Partial<AccessContext>): boolean {
  return engineL3off.canAccess(ctx(actorId, dataId, extra)).allowed;
}

// ── Level 1: Absolute barriers ────────────────────────────────────────────────

describe('Level 1 — Absolute barriers', () => {
  // CHR cannot see other CHR's private handout
  test("CHR-alice BLOCKED from HO-PRV-bob (other character's private handout)", () => {
    expect(allowed('CHR-alice', 'HO-PRV-bob')).toBe(false);
  });

  test('CHR-alice ALLOWED own HO-PRV-alice', () => {
    expect(allowed('CHR-alice', 'HO-PRV-alice')).toBe(true);
  });

  // AUT cannot see any private handout
  test('AUT BLOCKED from HO-PRV-alice', () => {
    expect(allowed('AUT', 'HO-PRV-alice')).toBe(false);
  });

  // CHR and AUT cannot see GM handout
  test('AUT BLOCKED from HO-GM', () => {
    expect(allowed('AUT', 'HO-GM')).toBe(false);
  });

  test('CHR-alice BLOCKED from HO-GM', () => {
    expect(allowed('CHR-alice', 'HO-GM')).toBe(false);
  });

  // RDR cannot see any handout (including public)
  test('RDR-ANA BLOCKED from HO-PUB-world (readers see no handouts)', () => {
    expect(allowed('RDR-ANA', 'HO-PUB-world')).toBe(false);
  });

  // Creative actors cannot see evaluation data
  test('CHR-alice BLOCKED from EVL-quadrant (creative actor)', () => {
    expect(allowed('CHR-alice', 'EVL-quadrant')).toBe(false);
  });

  test('AUT BLOCKED from EVL-quadrant (creative actor)', () => {
    expect(allowed('AUT', 'EVL-quadrant')).toBe(false);
  });

  test('ENV BLOCKED from EVL-quadrant (creative actor)', () => {
    expect(allowed('ENV', 'EVL-quadrant')).toBe(false);
  });

  // RDR cannot see other RDR's evaluation
  test('RDR-ANA BLOCKED from RDR-EMO evaluation (not own)', () => {
    expect(allowed('RDR-ANA', 'RDR-EMO')).toBe(false);
  });

  test('RDR-ANA ALLOWED own RDR-ANA evaluation', () => {
    expect(allowed('RDR-ANA', 'RDR-ANA')).toBe(true);
  });

  // EDT is not blocked by Level 1 (no L1 rules target EDT)
  test('EDT ALLOWED HO-GM', () => {
    expect(allowed('EDT', 'HO-GM')).toBe(true);
  });

  test('EDT ALLOWED HO-PRV-alice', () => {
    expect(allowed('EDT', 'HO-PRV-alice')).toBe(true);
  });
});

// ── Level 2: Principal barriers (EdtOverride-relaxable) ───────────────────────

describe('Level 2 — Principal barriers', () => {
  test('CHR-alice BLOCKED from ST-CHR-bob (other character state)', () => {
    expect(allowed('CHR-alice', 'ST-CHR-bob')).toBe(false);
  });

  test('CHR-alice ALLOWED own ST-CHR-alice', () => {
    expect(allowed('CHR-alice', 'ST-CHR-alice')).toBe(true);
  });

  test('CHR-alice ALLOWED ST-CHR-bob with EdtOverride for that DataId', () => {
    const result = engine.canAccess(ctx('CHR-alice', 'ST-CHR-bob', {
      edtOverride: {
        reason: 'telepathy ability',
        scope: ['ST-CHR-bob'],
        grantedTo: 'CHR-alice',
        expiresAfterScene: 5,
      },
    }));
    expect(result.allowed).toBe(true);
  });

  test('EdtOverride for wrong actor does NOT relax Level 2', () => {
    const result = engine.canAccess(ctx('CHR-alice', 'ST-CHR-bob', {
      edtOverride: {
        reason: 'telepathy',
        scope: ['ST-CHR-bob'],
        grantedTo: 'CHR-carol', // granted to carol, not alice
        expiresAfterScene: 5,
      },
    }));
    expect(result.allowed).toBe(false);
  });

  test('EdtOverride out of scope does NOT relax Level 2', () => {
    const result = engine.canAccess(ctx('CHR-alice', 'ST-CHR-bob', {
      edtOverride: {
        reason: 'vision',
        scope: ['ST-CHR-carol'], // wrong target
        grantedTo: 'CHR-alice',
        expiresAfterScene: 5,
      },
    }));
    expect(result.allowed).toBe(false);
  });
});

// ── Level 3: Recommended barriers (NovelConfig-switchable) ───────────────────

describe('Level 3 — Recommended barriers', () => {
  test('AUT BLOCKED from ST-CHR-alice by default (L3 enabled)', () => {
    expect(allowed('AUT', 'ST-CHR-alice')).toBe(false);
  });

  test('AUT ALLOWED ST-CHR-alice when L3 disabled', () => {
    expect(allowedL3off('AUT', 'ST-CHR-alice')).toBe(true);
  });

  test('AUT BLOCKED from ST-NAT-kingdom-public by default (L3)', () => {
    expect(allowed('AUT', 'ST-NAT-kingdom-public')).toBe(false);
  });

  test('AUT ALLOWED ST-NAT-kingdom-public when L3 disabled', () => {
    expect(allowedL3off('AUT', 'ST-NAT-kingdom-public')).toBe(true);
  });

  test('AUT BLOCKED from ST-ORG-guild by default (L3)', () => {
    expect(allowed('AUT', 'ST-ORG-guild')).toBe(false);
  });

  test('AUT ALLOWED ST-ORG-guild when L3 disabled', () => {
    expect(allowedL3off('AUT', 'ST-ORG-guild')).toBe(true);
  });

  // CHR is NOT affected by Level 3 (only AUT is restricted)
  test('CHR-alice NOT affected by L3 (can access ST-ORG-guild)', () => {
    expect(allowed('CHR-alice', 'ST-ORG-guild')).toBe(true);
  });
});

// ── Conditional: NAT layer access ────────────────────────────────────────────

describe('Conditional — NAT layer access', () => {
  test('CHR-alice ALLOWED ST-NAT-kingdom-public (public = all)', () => {
    expect(allowed('CHR-alice', 'ST-NAT-kingdom-public')).toBe(true);
  });

  test('CHR-alice BLOCKED from ST-NAT-kingdom-restricted', () => {
    expect(allowed('CHR-alice', 'ST-NAT-kingdom-restricted')).toBe(false);
  });

  test('CHR-alice BLOCKED from ST-NAT-kingdom-secret', () => {
    expect(allowed('CHR-alice', 'ST-NAT-kingdom-secret')).toBe(false);
  });

  test('NAT-kingdom ALLOWED own ST-NAT-kingdom-restricted', () => {
    expect(allowed('NAT-kingdom', 'ST-NAT-kingdom-restricted')).toBe(true);
  });

  test('NAT-kingdom BLOCKED from ST-NAT-empire-restricted (different nation)', () => {
    expect(allowed('NAT-kingdom', 'ST-NAT-empire-restricted')).toBe(false);
  });

  test('NAT-kingdom with espionage>=50 ALLOWED ST-NAT-empire-restricted', () => {
    const result = engine.canAccess(ctx('NAT-kingdom', 'ST-NAT-empire-restricted', {
      espionageCapability: 60,
    }));
    expect(result.allowed).toBe(true);
  });

  test('NAT-kingdom with espionage<50 BLOCKED from ST-NAT-empire-restricted', () => {
    const result = engine.canAccess(ctx('NAT-kingdom', 'ST-NAT-empire-restricted', {
      espionageCapability: 30,
    }));
    expect(result.allowed).toBe(false);
  });

  test('NAT-kingdom BLOCKED from ST-NAT-empire-secret even with espionage', () => {
    const result = engine.canAccess(ctx('NAT-kingdom', 'ST-NAT-empire-secret', {
      espionageCapability: 100,
    }));
    expect(result.allowed).toBe(false);
  });

  test('EDT ALLOWED ST-NAT-kingdom-secret', () => {
    expect(allowed('EDT', 'ST-NAT-kingdom-secret')).toBe(true);
  });
});

// ── Conditional: ORG state access ────────────────────────────────────────────

describe('Conditional — ORG state access', () => {
  test('CHR-alice (no affiliation) ALLOWED ST-ORG-guild (public access)', () => {
    expect(allowed('CHR-alice', 'ST-ORG-guild')).toBe(true);
  });

  test('NAT-kingdom ALLOWED ST-ORG-guild (nation can see org public data)', () => {
    expect(allowed('NAT-kingdom', 'ST-ORG-guild')).toBe(true);
  });

  test('EDT ALLOWED ST-ORG-guild', () => {
    expect(allowed('EDT', 'ST-ORG-guild')).toBe(true);
  });
});

// ── Disclosure: canActorKnow integration ──────────────────────────────────────

describe('Disclosure — canActorKnow across stages', () => {
  const baseState = createDisclosureState('chr-alice-identity', ['EDT', 'CHR-alice']);

  describe('secret stage', () => {
    test('EDT can always know', () => {
      expect(canActorKnow('EDT', baseState)).toBe(true);
    });

    test('CHR-alice (in knownBy) can know', () => {
      expect(canActorKnow('CHR-alice', baseState)).toBe(true);
    });

    test('CHR-bob (not in knownBy) cannot know', () => {
      expect(canActorKnow('CHR-bob', baseState)).toBe(false);
    });

    test('ORG-guild cannot know at secret stage', () => {
      expect(canActorKnow('ORG-guild', baseState)).toBe(false);
    });

    test('NAT-kingdom cannot know at secret stage', () => {
      expect(canActorKnow('NAT-kingdom', baseState)).toBe(false);
    });
  });

  describe('rumor stage', () => {
    const rumorState = advanceDisclosure(baseState, 'rumor', 'alice dropped hints', ['CHR-bob']);

    test('CHR-bob (added via newKnownBy) can know at rumor', () => {
      expect(canActorKnow('CHR-bob', rumorState)).toBe(true);
    });

    test('CHR-carol (not in knownBy) cannot know at rumor', () => {
      expect(canActorKnow('CHR-carol', rumorState)).toBe(false);
    });

    test('ORG-guild cannot know at rumor stage', () => {
      expect(canActorKnow('ORG-guild', rumorState)).toBe(false);
    });
  });

  describe('suspicion stage', () => {
    const suspicionState = advanceDisclosure(baseState, 'suspicion', 'investigators begin');

    test('ORG-guild CAN know at suspicion stage', () => {
      expect(canActorKnow('ORG-guild', suspicionState)).toBe(true);
    });

    test('ORG-church CAN know at suspicion stage', () => {
      expect(canActorKnow('ORG-church', suspicionState)).toBe(true);
    });

    test('NAT-kingdom cannot know at suspicion stage', () => {
      expect(canActorKnow('NAT-kingdom', suspicionState)).toBe(false);
    });

    test('CHR-bob (not in knownBy) cannot know at suspicion', () => {
      expect(canActorKnow('CHR-bob', suspicionState)).toBe(false);
    });
  });

  describe('confirmed stage', () => {
    const confirmedState = advanceDisclosure(baseState, 'confirmed', 'evidence confirmed');

    test('ORG-guild CAN know at confirmed stage', () => {
      expect(canActorKnow('ORG-guild', confirmedState)).toBe(true);
    });

    test('NAT-kingdom CAN know at confirmed stage', () => {
      expect(canActorKnow('NAT-kingdom', confirmedState)).toBe(true);
    });

    test('NAT-empire CAN know at confirmed stage', () => {
      expect(canActorKnow('NAT-empire', confirmedState)).toBe(true);
    });

    test('CHR-bob (not in knownBy) cannot know at confirmed', () => {
      expect(canActorKnow('CHR-bob', confirmedState)).toBe(false);
    });

    test('AUT cannot know at confirmed (not in knownBy)', () => {
      expect(canActorKnow('AUT', confirmedState)).toBe(false);
    });
  });

  describe('public stage', () => {
    const publicState = advanceDisclosure(baseState, 'public', 'revealed in court');

    test('ALL actors can know at public stage', () => {
      for (const actor of ['CHR-alice', 'CHR-bob', 'AUT', 'ORG-guild', 'NAT-kingdom', 'RDR-ANA']) {
        expect(canActorKnow(actor, publicState)).toBe(true);
      }
    });
  });
});

// ── Recall store: RecallViolationError integration ────────────────────────────

describe('Recall store — visibility integration', () => {
  test('CHR-alice can form memory from accessible HO-PUB-world', () => {
    expect(() =>
      validateRecallSource('CHR-alice', { dataId: 'HO-PUB-world' }, engine),
    ).not.toThrow();
  });

  test('CHR-alice BLOCKED from forming memory sourced from HO-PRV-bob', () => {
    expect(() =>
      validateRecallSource('CHR-alice', { dataId: 'HO-PRV-bob' }, engine),
    ).toThrow(RecallViolationError);
  });

  test('CHR-alice CAN form memory from own HO-PRV-alice', () => {
    expect(() =>
      validateRecallSource('CHR-alice', { dataId: 'HO-PRV-alice' }, engine),
    ).not.toThrow();
  });

  test('AUT BLOCKED from memory sourced from HO-PRV-alice (L1)', () => {
    expect(() =>
      validateRecallSource('AUT', { dataId: 'HO-PRV-alice' }, engine),
    ).toThrow(RecallViolationError);
  });

  test('CHR-alice BLOCKED from memory sourced from ST-CHR-bob (L2)', () => {
    expect(() =>
      validateRecallSource('CHR-alice', { dataId: 'ST-CHR-bob' }, engine),
    ).toThrow(RecallViolationError);
  });

  test('RecallViolationError has correct actorId and dataId', () => {
    try {
      validateRecallSource('CHR-alice', { dataId: 'HO-PRV-bob' }, engine);
      expect(true).toBe(false); // should not reach here
    } catch (err) {
      expect(err).toBeInstanceOf(RecallViolationError);
      if (err instanceof RecallViolationError) {
        expect(err.actorId).toBe('CHR-alice');
        expect(err.dataId).toBe('HO-PRV-bob');
      }
    }
  });
});
