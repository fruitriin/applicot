import { z } from "zod";

export const EnvironmentStateSchema = z.object({
  weather: z.object({
    current: z.string(),
    forecast: z.string().optional(),
  }),
  season: z.string(),
  timeOfDay: z.string(),
  geography: z.object({
    terrain: z.string(),
    notableFeatures: z.array(z.string()),
  }),
  ecology: z.object({
    flora: z.array(z.string()),
    fauna: z.array(z.string()),
    anomalies: z.array(z.string()),
  }),
  magicSystem: z
    .object({
      ambientLevel: z.number().min(0).max(100),
      activeEffects: z.array(z.string()),
      restrictions: z.array(z.string()),
    })
    .optional(),
  /** Long-term changes not directly perceivable */
  deepPatterns: z.object({
    climateTrend: z.string().optional(),
    tectonicActivity: z.string().optional(),
    ecosystemShift: z.string().optional(),
  }),
});
export type EnvironmentState = z.infer<typeof EnvironmentStateSchema>;
