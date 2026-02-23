import { z } from "zod";

// ── Actor Identifiers ──

/** Actor type prefixes */
export const ActorTypeEnum = z.enum([
  "EDT",
  "CHR",
  "AUT",
  "ENV",
  "NAT",
  "ORG",
  "RDR",
]);
export type ActorType = z.infer<typeof ActorTypeEnum>;

/** Reader persona subtypes */
export const ReaderPersonaEnum = z.enum(["ANA", "EMO", "CRT", "NAV"]);
export type ReaderPersona = z.infer<typeof ReaderPersonaEnum>;

/**
 * ActorId format:
 * - "EDT" (singleton)
 * - "AUT" (singleton)
 * - "ENV" (singleton)
 * - "CHR-{id}" e.g. "CHR-alice"
 * - "NAT-{id}" e.g. "NAT-kingdom_a"
 * - "ORG-{id}" e.g. "ORG-guild_a"
 * - "RDR-{persona}" e.g. "RDR-ANA"
 */
export const ActorIdSchema = z
  .string()
  .regex(
    /^(EDT|AUT|ENV|CHR-[a-z0-9_]+|NAT-[a-z0-9_]+|ORG-[a-z0-9_]+|RDR-(ANA|EMO|CRT|NAV))$/,
  );
export type ActorId = z.infer<typeof ActorIdSchema>;

// ── Data Identifiers ──

/**
 * DataId identifies a piece of data in the system.
 * Format: "{DataType}-{qualifier}"
 *
 * Examples:
 * - "HO-PUB" (public handout)
 * - "HO-PRV-alice" (private handout for chr-alice)
 * - "HO-GM" (GM handout)
 * - "ST-CHR-alice" (character state)
 * - "ST-ORG-guild_a" (organization state)
 * - "ST-NAT-kingdom_a-public" (nation state, public layer)
 * - "ST-ENV" (environment state)
 * - "ST-REL" (relationships)
 * - "TRK-FSH" (foreshadowing)
 * - "TRK-TEN" (tension curve)
 * - "TRK-TML" (timeline)
 * - "TRK-CSQ" (consequences)
 * - "TRK-ARC-alice" (character arc)
 * - "OUT-SCN-{cycle}-{scene}" (scene output)
 * - "EVL-{type}" (evaluation)
 * - "EVL-RPT" (evaluation report)
 * - "RCL-{actor_id}-{layer}" (recall memory)
 * - "META-CFG" (config)
 * - "META-LOG" (session log)
 */
export const DataTypeEnum = z.enum([
  "HO-PUB",
  "HO-PRV",
  "HO-GM",
  "ST-CHR",
  "ST-ORG",
  "ST-NAT",
  "ST-ENV",
  "ST-REL",
  "TRK-FSH",
  "TRK-TEN",
  "TRK-TML",
  "TRK-CSQ",
  "TRK-ARC",
  "OUT-SCN",
  "EVL",
  "EVL-RPT",
  "RCL",
  "META-CFG",
  "META-LOG",
]);
export type DataType = z.infer<typeof DataTypeEnum>;

export const DataIdSchema = z.string().min(1);
export type DataId = z.infer<typeof DataIdSchema>;

// ── Entity Identifiers ──

/** Character ID without the CHR- prefix, e.g. "alice" */
export const CharacterIdSchema = z.string().regex(/^[a-z0-9_]+$/);
export type CharacterId = z.infer<typeof CharacterIdSchema>;

/** Organization ID without the ORG- prefix */
export const OrganizationIdSchema = z.string().regex(/^[a-z0-9_]+$/);
export type OrganizationId = z.infer<typeof OrganizationIdSchema>;

/** Nation ID without the NAT- prefix */
export const NationIdSchema = z.string().regex(/^[a-z0-9_]+$/);
export type NationId = z.infer<typeof NationIdSchema>;

// ── Helpers ──

/** Extract entity ID from ActorId, e.g. "CHR-alice" → "alice" */
export function entityIdFromActorId(actorId: ActorId): string {
  const parts = actorId.split("-");
  return parts.slice(1).join("-");
}

/** Extract actor type from ActorId, e.g. "CHR-alice" → "CHR" */
export function actorTypeFromId(actorId: ActorId): ActorType {
  const prefix = actorId.split("-")[0];
  return ActorTypeEnum.parse(prefix);
}

/** Extract DataType prefix from DataId */
export function dataTypeFromId(dataId: DataId): DataType {
  // Try longest match first
  for (const dt of DataTypeEnum.options) {
    if (dataId === dt || dataId.startsWith(dt + "-")) {
      return dt;
    }
  }
  throw new Error(`Unknown data type in DataId: ${dataId}`);
}
