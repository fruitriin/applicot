import type { SessionContext } from "../context.js";
import { setActor } from "../context.js";
import { ActorAlreadySetError } from "../errors.js";

export const SET_ACTOR_TOOL = {
  name: "set_actor",
  description:
    "Set the current actor for this session. Must be called first before any other tool. " +
    "Once set, the actor cannot be changed. All subsequent operations are scoped to this actor's visibility.",
  inputSchema: {
    type: "object" as const,
    properties: {
      actorId: {
        type: "string",
        description:
          'Actor ID. Examples: "EDT", "CHR-alice", "AUT", "ENV", "NAT-kingdom_a", "ORG-guild_a", "RDR-ANA"',
      },
    },
    required: ["actorId"],
  },
};

export function handleSetActor(
  ctx: SessionContext,
  args: Record<string, unknown>,
): { content: Array<{ type: "text"; text: string }>; isError?: boolean } {
  const actorId = args.actorId as string;

  try {
    setActor(ctx, actorId);
    return {
      content: [
        {
          type: "text",
          text: `Actor set to "${actorId}". All subsequent operations are scoped to this actor.`,
        },
      ],
    };
  } catch (e) {
    if (e instanceof ActorAlreadySetError) {
      return {
        content: [{ type: "text", text: e.message }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: `Invalid actor ID: ${actorId}` }],
      isError: true,
    };
  }
}
