import { z } from "zod";
import { ActorIdSchema, type ActorType } from "./ids.js";

// ── Actor Operating State ──

export const ActorOperatingStateEnum = z.enum([
  "active",   // Currently participating in this scene/phase
  "dormant",  // Exists but not relevant to current scene
  "standby",  // Monitoring for activation triggers
]);
export type ActorOperatingState = z.infer<typeof ActorOperatingStateEnum>;

// ── Actor Definition ──

export const ActorDefinitionSchema = z.object({
  id: ActorIdSchema,
  type: z.enum(["EDT", "CHR", "AUT", "ENV", "NAT", "ORG", "RDR"]),
  name: z.string(),
  state: ActorOperatingStateEnum,
  /** Recommended LLM model for this actor */
  preferredModel: z.enum(["opus", "sonnet", "haiku"]).default("sonnet"),
});
export type ActorDefinition = z.infer<typeof ActorDefinitionSchema>;

// ── LLM model recommendations by actor type ──

export const ACTOR_MODEL_DEFAULTS: Record<ActorType, "opus" | "sonnet" | "haiku"> = {
  EDT: "opus",
  CHR: "sonnet",
  AUT: "sonnet",
  ENV: "sonnet",
  NAT: "sonnet",
  ORG: "sonnet",
  RDR: "haiku",
};
