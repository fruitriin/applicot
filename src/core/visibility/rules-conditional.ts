import { actorTypeFromId, entityIdFromActorId } from "../types/index.js";
import type { AccessAffiliation, AccessContext, AccessResult } from "./types.js";

export function canAccessCharacterState(
  requestorId: string,
  targetCharacterId: string,
  field: 'observable' | 'internal',
): boolean {
  if (requestorId === targetCharacterId) return true;
  if (field === 'observable') return true;
  const requestorType = actorTypeFromId(requestorId);
  return requestorType === 'EDT';
}

export function canAccessOrgState(
  requestorId: string,
  orgId: string,
  layer: 'public' | 'internal' | 'secret',
  affiliation?: AccessAffiliation,
): boolean {
  const requestorType = actorTypeFromId(requestorId);
  if (requestorType === 'EDT') return true;
  if (requestorType === 'NAT') {
    if (affiliation?.entityId === orgId) return true;
    return layer === 'public';
  }
  if (!affiliation || affiliation.entityId !== orgId) {
    return layer === 'public';
  }
  switch (affiliation.accessLevel) {
    case 'secret':
      return true;
    case 'internal':
      return layer !== 'secret';
    case 'public':
      return layer === 'public';
    default:
      return layer === 'public';
  }
}

export function canAccessNatState(
  requestorId: string,
  natId: string,
  layer: 'public' | 'restricted' | 'secret',
  espionageCapability?: number,
): boolean {
  const requestorType = actorTypeFromId(requestorId);
  if (requestorType === 'EDT') return true;
  if (layer === 'public') return true;
  if (layer === 'restricted') {
    const requestorEntity = entityIdFromActorId(requestorId);
    if (requestorEntity === natId) return true;
    return (espionageCapability ?? 0) >= 50;
  }
  return false;
}

export function canAccessEnvState(
  requestorId: string,
  envDataType: 'observable' | 'non-observable',
  isPresent: boolean,
  observationCapability?: number,
): boolean {
  const requestorType = actorTypeFromId(requestorId);
  if (requestorType === 'ENV' || requestorType === 'EDT') {
    return true;
  }
  if (envDataType === 'observable') {
    return isPresent;
  }
  if (requestorType === 'NAT') {
    return (observationCapability ?? 0) >= 30;
  }
  return false;
}

export function checkEdtOverride(context: AccessContext, dataId: string): boolean {
  const override = context.edtOverride;
  if (!override) return false;
  if (override.grantedTo && override.grantedTo !== context.actorId) return false;
  return override.scope.some(
    (scopeId) => scopeId === dataId || dataId.startsWith(scopeId + '-'),
  );
}

export function applyConditionalAccess(context: AccessContext): AccessResult | null {
  const { actorId, dataId, actorAffiliations, espionageCapability } = context;

  if (dataId.startsWith('ST-NAT-')) {
    const rest = dataId.slice('ST-NAT-'.length);
    const lastDash = rest.lastIndexOf('-');
    if (lastDash > 0) {
      const natId = rest.slice(0, lastDash);
      const layer = rest.slice(lastDash + 1);
      if (['public', 'restricted', 'secret'].includes(layer)) {
        if (checkEdtOverride(context, dataId)) {
          return { allowed: true, reason: 'EDT override: access to ' + dataId + ' granted' };
        }
        const allowed = canAccessNatState(
          actorId,
          natId,
          layer as 'public' | 'restricted' | 'secret',
          espionageCapability,
        );
        if (!allowed) {
          return {
            allowed: false,
            reason: 'Level 2: ' + actorId + ' cannot access nation ' + natId + ' ' + layer + ' layer',
          };
        }
        return { allowed: true, reason: 'Level 2: ' + actorId + ' has access to nation ' + natId + ' ' + layer + ' layer' };
      }
    }
  }

  if (dataId.startsWith('ST-ORG-')) {
    const orgId = dataId.slice('ST-ORG-'.length);
    if (checkEdtOverride(context, dataId)) {
      return { allowed: true, reason: 'EDT override: access to ' + dataId + ' granted' };
    }
    const affiliation = actorAffiliations?.find((a) => a.entityId === orgId);
    const allowed = canAccessOrgState(actorId, orgId, 'public', affiliation);
    if (!allowed) {
      return {
        allowed: false,
        reason: 'Level 2: ' + actorId + ' cannot access org ' + orgId + ' state',
      };
    }
    return { allowed: true, reason: 'Level 2: ' + actorId + ' has access to org ' + orgId + ' state' };
  }

  return null;
}
