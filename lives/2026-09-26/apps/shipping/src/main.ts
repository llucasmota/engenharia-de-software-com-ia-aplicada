import { createMockServer, readJsonBody, respond } from "@temporal-workshop/mock-http";
import type { ShipmentRequest, ShipmentResponse } from "@temporal-workshop/contracts";

const attemptsByOrder = new Map<string, number>();
const db = { data: { shipments: [] }, write: async () => undefined };

createMockServer({
  database: db,
  port: 3003,
  async route(request, response) {
    if (request.method !== "POST" || request.url !== "/shipping/shipments") return false;

    let body: Partial<ShipmentRequest>;
    try {
      body = await readJsonBody<Partial<ShipmentRequest>>(request);
    } catch {
      respond(response, 422, { error: "INVALID_JSON", message: "Request body must be JSON" });
      return true;
    }
    if (!body.orderId) {
      respond(response, 422, { error: "INVALID_SHIPMENT", message: "orderId is required" });
      return true;
    }

    const attempt = (attemptsByOrder.get(body.orderId) ?? 0) + 1;
    attemptsByOrder.set(body.orderId, attempt);
    if (attempt <= 3) {
      respond(response, 503, { error: "SHIPPING_UNAVAILABLE", message: "Shipping provider is temporarily unavailable", orderId: body.orderId });
      return true;
    }
    respond(response, 201, {
      orderId: body.orderId,
      shipmentId: `shipment-${body.orderId}`,
      status: "ACCEPTED",
    } satisfies ShipmentResponse);
    return true;
  },
});
