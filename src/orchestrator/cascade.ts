/**
 * Cascade — Emergency Activation Cascade
 *
 * Propagates actor activation across layers with depth limit:
 *   ENV → NAT-* → ORG-* → CHR-* (max 3 stages)
 *
 * planning_doc.md Section 4.6
 */

import type { ActorId } from '../core/types/ids.js';
import type { ActivationList } from './activation.js';

// ── Types ──

export type CascadeSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CascadeTrigger {
  sourceActorId: ActorId;
  eventDescription: string;
  severity: CascadeSeverity;
}

export type AssessImpactFn = (
  actorId: ActorId,
  trigger: CascadeTrigger,
) => Promise<ActorId[]>;

// ── Cascade Layer ──

export function cascadeLayerOf(actorId: ActorId | string): number {
  if (actorId === 'ENV') return 0;
  if (String(actorId).startsWith('NAT-')) return 1;
  if (String(actorId).startsWith('ORG-')) return 2;
  if (String(actorId).startsWith('CHR-')) return 3;
  return -1;
}

// ── Build ActivationList from Set ──

export function buildActivationListFromSet(ids: Set<ActorId>): ActivationList {
  const arr = [...ids];
  return {
    characters: arr.filter((id) => String(id).startsWith('CHR-')) as ActorId[],
    organizations: arr.filter((id) => String(id).startsWith('ORG-')) as ActorId[],
    nations: arr.filter((id) => String(id).startsWith('NAT-')) as ActorId[],
    env: arr.some((id) => id === 'ENV'),
  };
}

// ── Execute Cascade ──

export async function executeCascade(
  trigger: CascadeTrigger,
  assessImpact: AssessImpactFn,
  maxDepth: number = 3,
): Promise<ActivationList> {
  const activated = new Set<ActorId>([trigger.sourceActorId]);
  let queue: ActorId[] = [trigger.sourceActorId];

  for (let depth = 0; depth < maxDepth && queue.length > 0; depth++) {
    const nextQueue: ActorId[] = [];
    for (const actorId of queue) {
      const impacted = await assessImpact(actorId, trigger);
      for (const id of impacted) {
        if (!activated.has(id)) {
          activated.add(id);
          nextQueue.push(id);
        }
      }
    }
    queue = nextQueue;
  }

  return buildActivationListFromSet(activated);
}
