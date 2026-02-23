import { z } from "zod";

export const ForeshadowingStatusEnum = z.enum([
  "planted",
  "growing",
  "harvested",
  "abandoned",
]);
export type ForeshadowingStatus = z.infer<typeof ForeshadowingStatusEnum>;

export const ForeshadowingEntrySchema = z.object({
  id: z.string(),
  description: z.string(),
  status: ForeshadowingStatusEnum,
  plantedInScene: z.string(),
  targetScene: z.string().optional(),
  harvestedInScene: z.string().optional(),
  relatedCharacters: z.array(z.string()),
  notes: z.string().optional(),
});
export type ForeshadowingEntry = z.infer<typeof ForeshadowingEntrySchema>;
