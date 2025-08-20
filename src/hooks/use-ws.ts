"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useWS() {
  const ref = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = (process.env.NEXT_PUBLIC_WS_URL || base.replace(/^http/, "ws")) + "/api/ws";
    try {
      const ws = new WebSocket(url);
      ref.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
    } catch {}
    return () => { ref.current?.close(); };
  }, []);

  useEffect(() => {
    const ws = ref.current;
    if (!ws) return;
    const onMessage = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(String(ev.data || "{}"));
        window.dispatchEvent(new CustomEvent("app:ws", { detail: msg }));
      } catch {}
    };
    ws.addEventListener("message", onMessage);
    return () => ws.removeEventListener("message", onMessage);
  }, [connected]);

  const send = useCallback((data: any) => {
    try {
      ref.current?.send(JSON.stringify(data));
    } catch {}
  }, []);

  return { connected, send };
}
