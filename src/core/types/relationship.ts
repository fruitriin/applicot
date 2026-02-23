import { z } from "zod";

export const RelationshipTypeEnum = z.enum([
  "alliance",
  "rivalry",
  "family",
  "romance",
  "mentorship",
  "enmity",
  "trade",
  "vassalage",
  "friendship",
  "distrust",
]);
export type RelationshipType = z.infer<typeof RelationshipTypeEnum>;

export const RelationshipEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: RelationshipTypeEnum,
  weight: z.number().min(-100).max(100),
  /** Whether this relationship is publicly known */
  public: z.boolean(),
  description: z.string().optional(),
});
export type RelationshipEdge = z.infer<typeof RelationshipEdgeSchema>;

export const RelationshipGraphSchema = z.object({
  edges: z.array(RelationshipEdgeSchema),
});
export type RelationshipGraph = z.infer<typeof RelationshipGraphSchema>;
