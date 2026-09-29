declare module "json-server/lib/app.js" {
  export function createApp(
    db: { data: Record<string, unknown>; write: () => Promise<void> },
    options?: Record<string, unknown>,
  ): { attach: (request: unknown, response: unknown) => void };
}
