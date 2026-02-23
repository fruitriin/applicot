import { z } from "zod";

export const TimelineVisibilityEnum = z.enum([
  "public",     // Known to all actors
  "restricted", // Known only to involved parties
  "hidden",     // Known only to EDT and HMN
]);
export type TimelineVisibility = z.infer<typeof TimelineVisibilityEnum>;

export const TimelineEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  description: z.string(),
  visibility: TimelineVisibilityEnum,
  involvedActors: z.array(z.string()),
  sceneId: z.string().optional(),
  tags: z.array(z.string()),
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
