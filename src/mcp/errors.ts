export class ActorNotSetError extends Error {
  constructor() {
    super("Actor not set. Call set_actor first.");
    this.name = "ActorNotSetError";
  }
}

export class ActorAlreadySetError extends Error {
  constructor(actorId: string) {
    super(`Actor already set to "${actorId}". Cannot change actor within a session.`);
    this.name = "ActorAlreadySetError";
  }
}

export class AccessDeniedError extends Error {
  constructor(actorId: string, dataId: string, reason: string) {
    super(`Access denied: "${actorId}" cannot access "${dataId}". ${reason}`);
    this.name = "AccessDeniedError";
  }
}

export class WriteDeniedError extends Error {
  constructor(actorId: string, dataId: string) {
    super(`Write denied: "${actorId}" cannot write to "${dataId}".`);
    this.name = "WriteDeniedError";
  }
}

export class DataNotFoundError extends Error {
  constructor(dataId: string) {
    super(`Data not found: "${dataId}".`);
    this.name = "DataNotFoundError";
  }
}
