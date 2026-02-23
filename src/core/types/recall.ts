import { z } from "zod";

export const RecallLayerEnum = z.enum([
  "recent",   // 1-2 scenes ago, accurate
  "midterm",  // 5-10 scenes ago, summarized
  "longterm", // 10+ scenes ago, keywords + emotion tags only
  "pinned",   // Manually pinned by EDT, always retained
]);
export type RecallLayer = z.infer<typeof RecallLayerEnum>;

export const RecallEntrySchema = z.object({
  id: z.string(),
  layer: RecallLayerEnum,
  sceneId: z.string(),
  content: z.string(),
  emotionTags: z.array(z.string()),
  keywords: z.array(z.string()),
  importance: z.number().min(0).max(100),
  createdAt: z.string(),
  /** Strong emotions preserve detail in long-term memory */
  emotionalIntensity: z.number().min(0).max(100),
});
export type RecallEntry = z.infer<typeof RecallEntrySchema>;

export const RecallMemorySchema = z.object({
  actorId: z.string(),
  entries: z.array(RecallEntrySchema),
});
export type RecallMemory = z.infer<typeof RecallMemorySchema>;
