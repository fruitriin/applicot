import { describe, expect, it } from 'bun:test';
import {
  buildActivationList,
  canTransition,
  DORMANT_RULES,
  shouldActivateNat,
  STANDBY_RULES,
} from '../../src/orchestrator/activation.js';
import type { ScenePrompt } from '../../src/orchestrator/types.js';

describe('canTransition', () => {
  it('dormant → active is allowed (EDT activation)', () => {
    expect(canTransition('dormant', 'active')).toBe(true);
  });

  it('dormant → standby is allowed (EDT sets monitoring mode)', () => {
    expect(canTransition('dormant', 'standby')).toBe(true);
  });

  it('active → dormant is allowed (scene end deactivation)', () => {
    expect(canTransition('active', 'dormant')).toBe(true);
  });

  it('active → standby is allowed (EDT sets monitoring mode)', () => {
    expect(canTransition('active', 'standby')).toBe(true);
  });

  it('standby → active is allowed (trigger fired)', () => {
    expect(canTransition('standby', 'active')).toBe(true);
  });

  it('standby → dormant is allowed (trigger cancelled)', () => {
    expect(canTransition('standby', 'dormant')).toBe(true);
  });

  it('same-state transitions are not allowed', () => {
    expect(canTransition('active', 'active')).toBe(false);
    expect(canTransition('dormant', 'dormant')).toBe(false);
    expect(canTransition('standby', 'standby')).toBe(false);
  });
});

describe('buildActivationList', () => {
  const makePrompt = (activatedActors: string[]): ScenePrompt => ({
    actorId: 'EDT',
    content: '',
    metadata: {},
    directorNote: 'test',
    activatedActors: activatedActors as any,
    dramaticTension: 'low',
  } as any);

  it('splits actors into correct categories', () => {
    const prompt = makePrompt([
      'CHR-alice',
      'CHR-bob',
      'ORG-merchant_guild',
      'NAT-england',
      'NAT-france',
      'ENV',
    ]);
    const list = buildActivationList(prompt);
    expect(list.characters).toEqual(['CHR-alice', 'CHR-bob']);
    expect(list.organizations).toEqual(['ORG-merchant_guild']);
    expect(list.nations).toEqual(['NAT-england', 'NAT-france']);
    expect(list.env).toBe(true);
  });

  it('env is false when not in activatedActors', () => {
    const prompt = makePrompt(['CHR-alice']);
    const list = buildActivationList(prompt);
    expect(list.env).toBe(false);
  });

  it('returns empty arrays when no relevant actors', () => {
    const prompt = makePrompt(['ENV']);
    const list = buildActivationList(prompt);
    expect(list.characters).toEqual([]);
    expect(list.organizations).toEqual([]);
    expect(list.nations).toEqual([]);
  });
});

describe('shouldActivateNat', () => {
  it('activates every scene in wartime', () => {
    const config = { natId: 'england', isWartime: true, lastActivatedScene: 3 };
    expect(shouldActivateNat(config, 4)).toBe(true);
    expect(shouldActivateNat(config, 3)).toBe(false);
  });

  it('activates every 2 scenes in peacetime', () => {
    const config = { natId: 'england', isWartime: false, lastActivatedScene: 3 };
    expect(shouldActivateNat(config, 4)).toBe(false);
    expect(shouldActivateNat(config, 5)).toBe(true);
    expect(shouldActivateNat(config, 6)).toBe(true);
  });

  it('wartime activates immediately after each scene', () => {
    const config = { natId: 'france', isWartime: true, lastActivatedScene: 10 };
    expect(shouldActivateNat(config, 11)).toBe(true);
    expect(shouldActivateNat(config, 10)).toBe(false);
  });
});

describe('DORMANT_RULES', () => {
  it('dormant actors do not receive data', () => {
    expect(DORMANT_RULES.receivesData).toBe(false);
  });

  it('dormant actor state is frozen', () => {
    expect(DORMANT_RULES.stateUpdated).toBe(false);
  });

  it('long-term threshold is 5 scenes', () => {
    expect(DORMANT_RULES.longTermThreshold).toBe(5);
  });
});

describe('STANDBY_RULES', () => {
  it('standby actors receive only trigger info', () => {
    expect(STANDBY_RULES.receivesData).toBe('trigger-only');
  });

  it('standby actors generate no output', () => {
    expect(STANDBY_RULES.generatesOutput).toBe(false);
  });
});
