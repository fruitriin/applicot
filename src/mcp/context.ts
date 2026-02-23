import type { ActorId } from "../core/types/index.js";
import { ActorIdSchema, actorTypeFromId, entityIdFromActorId } from "../core/types/ids.js";
import type { StoreAccess } from "../core/store/store.js";
import { createStore } from "../core/store/store.js";
import type { VisibilityEngine } from "../core/visibility/engine.js";
import { createVisibilityEngine } from "../core/visibility/engine.js";
import { ActorNotSetError, ActorAlreadySetError } from "./errors.js";

export interface SessionContext {
  actorId: ActorId | null;
  novelRoot: string;
  store: StoreAccess;
  visibilityEngine: VisibilityEngine;
}

export function createSessionContext(novelRoot: string): SessionContext {
  return {
    actorId: null,
    novelRoot,
    store: createStore({ novelRoot }),
    visibilityEngine: createVisibilityEngine(),
  };
}

/** Set the actor for this session. Throws if already set. */
export function setActor(ctx: SessionContext, actorId: string): void {
  if (ctx.actorId !== null) {
    throw new ActorAlreadySetError(ctx.actorId);
  }
  const parsed = ActorIdSchema.parse(actorId);
  ctx.actorId = parsed;
}

/** Get the current actor, throwing if not set. */
export function requireActor(ctx: SessionContext): ActorId {
  if (ctx.actorId === null) {
    throw new ActorNotSetError();
  }
  return ctx.actorId;
}

/**
 * Check if an actor can write to a given data ID.
 *
 * Write permissions (Phase 1):
 * - EDT: all data
 * - CHR-{id}: own recall (RCL-CHR-{id}-*)
 * - AUT: scene output (OUT-SCN-*)
 * - ENV: environment state (ST-ENV)
 * - NAT-{id}: own nation state (ST-NAT-{id}-*)
 * - ORG-{id}: own org state (ST-ORG-{id})
 * - RDR-{p}: evaluation data (EVL-*)
 */
export function canWrite(actorId: ActorId, dataId: string): boolean {
  const actorType = actorTypeFromId(actorId);

  // EDT can write everything
  if (actorType === "EDT") return true;

  const entityId = entityIdFromActorId(actorId);

  switch (actorType) {
    case "CHR":
      // CHR can write own recall
      return dataId.startsWith(`RCL-CHR-${entityId}-`);
    case "AUT":
      // AUT can write scene output
      return dataId.startsWith("OUT-SCN-");
    case "ENV":
      return dataId === "ST-ENV";
    case "NAT":
      return dataId.startsWith(`ST-NAT-${entityId}-`) || dataId === `ST-NAT-${entityId}`;
    case "ORG":
      return dataId === `ST-ORG-${entityId}`;
    case "RDR":
      return dataId.startsWith("EVL-");
    default:
      return false;
  }
}
