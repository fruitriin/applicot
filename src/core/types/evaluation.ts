import { z } from "zod";

/** Four-quadrant classification for reader evaluation */
export const QuadrantTypeEnum = z.enum([
  "good_surprise",  // Predicted wrong, pleasantly
  "bad_surprise",   // Predicted wrong, unpleasantly
  "good_comfort",   // Predicted right, satisfyingly
  "bad_comfort",    // Predicted right, boringly
]);
export type QuadrantType = z.infer<typeof QuadrantTypeEnum>;

export const EvaluationEntrySchema = z.object({
  readerId: z.string(),
  sceneId: z.string(),
  quadrant: QuadrantTypeEnum,
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});
export type EvaluationEntry = z.infer<typeof EvaluationEntrySchema>;

export const EvaluationQuadrantSchema = z.object({
  sceneId: z.string(),
  entries: z.array(EvaluationEntrySchema),
  aggregated: z.object({
    goodSurprise: z.number(),
    badSurprise: z.number(),
    goodComfort: z.number(),
    badComfort: z.number(),
  }),
});
export type EvaluationQuadrant = z.infer<typeof EvaluationQuadrantSchema>;
