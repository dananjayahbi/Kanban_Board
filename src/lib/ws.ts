type Client = { socket: WebSocket };

declare global {
  // eslint-disable-next-line no-var
  var __WS_CLIENTS__: Set<Client> | undefined;
}

const clients: Set<Client> = (global.__WS_CLIENTS__ ||= new Set());

export function publish(event: string, payload: any) {
  const data = JSON.stringify({ event, payload, ts: Date.now() });
  for (const c of clients) {
    try {
      c.socket.send(data);
    } catch {}
  }
}

export function addClient(socket: WebSocket) {
  const client = { socket } as Client;
  clients.add(client);
  socket.addEventListener("close", () => clients.delete(client));
}

export function getClientCount() {
  return clients.size;
}
