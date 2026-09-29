import { createConnection } from "node:net";

export const temporalNamespace = process.env.TEMPORAL_NAMESPACE ?? "default";
export const temporalTaskQueue = "order-processing";

export function temporalAddress(): string {
  return process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233";
}

export function waitForTemporal(): Promise<void> {
  const [host, port] = temporalAddress().split(":");
  return new Promise((resolve) => {
    const socket = createConnection({ host, port: Number(port) });
    socket.once("connect", () => {
      socket.end();
      resolve();
    });
    socket.once("error", () => {
      socket.destroy();
      setTimeout(() => void waitForTemporal().then(resolve), 1000);
    });
  });
}
