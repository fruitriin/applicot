import { z } from "zod";

export const AffiliationSchema = z.object({
  entityId: z.string(),
  role: z.string(),
  accessLevel: z.enum(["public", "internal", "secret"]),
});
export type Affiliation = z.infer<typeof AffiliationSchema>;

export const CharacterStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  alive: z.boolean(),
  location: z.string(),
  /** Externally observable attributes */
  observable: z.object({
    appearance: z.string(),
    publicTitle: z.string(),
    visibleCondition: z.string(),
  }),
  /** Internal state (visible only to self and EDT) */
  internal: z.object({
    stress: z.number().min(0).max(100),
    loyalty: z.record(z.string(), z.number()),
    desires: z.record(z.string(), z.number()),
    secretMotivation: z.string().optional(),
  }),
  /** Organization/nation affiliations */
  affiliations: z.array(AffiliationSchema),
});
export type CharacterState = z.infer<typeof CharacterStateSchema>;
