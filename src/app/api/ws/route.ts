import { addClient } from "@/lib/ws";

export const runtime = "edge";

// Provided by the Edge runtime (undici); declare for TypeScript
declare const WebSocketPair: any;

export async function GET(req: Request) {
  if (req.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket", { status: 400 });
  }
  const pair = new (WebSocketPair as any)();
  const client = pair[0] as WebSocket;
  const server = pair[1] as WebSocket;
  (server as any).accept();
  addClient(server);
  (server as any).addEventListener("message", (ev: MessageEvent) => {
    try {
      const msg = JSON.parse(String(ev.data || "{}"));
      if (msg?.type === "ping") {
    (server as any).send(JSON.stringify({ event: "pong", ts: Date.now() }));
      }
    } catch {}
  });
  return new Response(null, { status: 101, webSocket: client } as any);
}
