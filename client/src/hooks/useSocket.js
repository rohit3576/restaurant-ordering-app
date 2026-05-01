import { useEffect } from "react";
import { socket } from "../services/socket";

export function useSocket(event, handler) {
  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [event, handler]);
}
