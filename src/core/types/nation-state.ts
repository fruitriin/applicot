import { z } from "zod";

/** Public layer: visible to all actors */
export const NationPublicLayerSchema = z.object({
  name: z.string(),
  territory: z.string(),
  officialPolicy: z.array(z.string()),
  publicDeclarations: z.array(z.string()),
});
export type NationPublicLayer = z.infer<typeof NationPublicLayerSchema>;

/** Restricted layer: visible to own citizens + espionage */
export const NationRestrictedLayerSchema = z.object({
  militaryDeployment: z.string(),
  economicDetails: z.record(z.string(), z.number()),
  ongoingNegotiations: z.array(z.string()),
});
export type NationRestrictedLayer = z.infer<typeof NationRestrictedLayerSchema>;

/** Secret layer: visible only to EDT and HMN */
export const NationSecretLayerSchema = z.object({
  secretTreaties: z.array(z.string()),
  royalSecrets: z.array(z.string()),
  trueStrategicIntent: z.string(),
});
export type NationSecretLayer = z.infer<typeof NationSecretLayerSchema>;

/** Full nation state with 3 layers stored in separate files */
export const NationStateSchema = z.object({
  id: z.string(),
  public: NationPublicLayerSchema,
  restricted: NationRestrictedLayerSchema,
  secret: NationSecretLayerSchema,
});
export type NationState = z.infer<typeof NationStateSchema>;
