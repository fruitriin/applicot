/**
 * Recall store — write-time access validation for actor memories.
 *
 * When an actor forms a memory from a data source, this module validates
 * that the actor had legitimate access to that source. This prevents
 * information barrier violations from being "baked into" recall memories.
 *
 * Phase 2, Section 5.
 */

import type { ActorId } from "../types/index.js";
import type { RecallEntry } from "../types/recall.js";
import type { VisibilityEngine } from "../visibility/engine.js";
import type { AccessContext } from "../visibility/types.js";

/**
 * A data source that contributed to a memory.
 * Tracks which DataIds an actor read before forming a recall entry.
 */
export interface MemorySource {
  /** DataId of the data that contributed to this memory */
  dataId: string;
  /** Human-readable description of what was read */
  description?: string;
}

/**
 * Thrown when an actor attempts to form a memory from data
 * they were not permitted to access.
 */
export class RecallViolationError extends Error {
  readonly actorId: string;
  readonly dataId: string;

  constructor(actorId: string, dataId: string, reason?: string) {
    super(
      `${actorId} cannot form memory from ${dataId}: information barrier violation` +
        (reason ? ` (${reason})` : ""),
    );
    this.name = "RecallViolationError";
    this.actorId = actorId;
    this.dataId = dataId;
  }
}

/**
 * Validate that an actor has access to a memory source.
 * Throws RecallViolationError if access is denied.
 */
export function validateRecallSource(
  actorId: ActorId,
  source: MemorySource,
  visibility: VisibilityEngine,
  contextExtra?: Omit<AccessContext, "actorId" | "dataId">,
): void {
  const context: AccessContext = {
    actorId,
    dataId: source.dataId,
    ...contextExtra,
  };
  const result = visibility.canAccess(context);
  if (!result.allowed) {
    throw new RecallViolationError(actorId, source.dataId, result.reason);
  }
}

/**
 * Validate all sources and return the recall entry if all pass.
 * Use this before writing a recall entry to the file system.
 */
export function validateAndPrepareRecall(
  actorId: ActorId,
  entry: RecallEntry,
  sources: MemorySource[],
  visibility: VisibilityEngine,
  contextExtra?: Omit<AccessContext, "actorId" | "dataId">,
): RecallEntry {
  for (const source of sources) {
    validateRecallSource(actorId, source, visibility, contextExtra);
  }
  return entry;
}

/**
 * Write a recall entry for an actor, validating all memory sources first.
 * The actual persistence is done via the provided writer function,
 * allowing the caller to use their preferred store implementation.
 *
 * @param actorId - The actor forming this memory
 * @param entry - The recall entry to write
 * @param sources - Data sources that contributed to this memory
 * @param visibility - Visibility engine to validate access
 * @param writer - Function to persist the validated entry
 * @param contextExtra - Additional context for access checks (affiliations, overrides, etc.)
 */
export async function writeRecall(
  actorId: ActorId,
  entry: RecallEntry,
  sources: MemorySource[],
  visibility: VisibilityEngine,
  writer: (actorId: ActorId, entry: RecallEntry) => Promise<void>,
  contextExtra?: Omit<AccessContext, "actorId" | "dataId">,
): Promise<void> {
  const validated = validateAndPrepareRecall(actorId, entry, sources, visibility, contextExtra);
  await writer(actorId, validated);
}
