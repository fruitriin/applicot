import { z } from "zod";

export const FactionSchema = z.object({
  id: z.string(),
  name: z.string(),
  influence: z.number().min(0).max(100),
  goals: z.array(z.string()),
  members: z.array(z.string()),
});
export type Faction = z.infer<typeof FactionSchema>;

export const OrganizationStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  nationId: z.string().optional(),
  /** Public information */
  public: z.object({
    description: z.string(),
    publicGoals: z.array(z.string()),
    knownMembers: z.array(z.string()),
  }),
  /** Internal information (members only) */
  internal: z.object({
    resources: z.record(z.string(), z.number()),
    internalPolicies: z.array(z.string()),
    factions: z.array(FactionSchema),
  }),
  /** Secret information (leader/EDT only) */
  secret: z.object({
    hiddenAgenda: z.string().optional(),
    secretAlliances: z.array(z.string()),
    secretResources: z.record(z.string(), z.number()),
  }),
});
export type OrganizationState = z.infer<typeof OrganizationStateSchema>;
