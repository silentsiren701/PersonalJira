import { revalidatePath } from "next/cache";
import { createMcpRequestHandler } from "@/lib/agent/mcp";
import { createAgentStore } from "@/lib/agent/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handle = createMcpRequestHandler(createAgentStore(), (boardKey) => revalidatePath(`/b/${boardKey}`));

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
