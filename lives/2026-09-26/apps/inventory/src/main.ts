import { createMockServer, readJsonBody, respond } from "@temporal-workshop/mock-http";
import type {
  InventoryReservationRequest,
  InventoryReservationResponse,
} from "@temporal-workshop/contracts";

const db = {
  data: {
    products: [
      { id: "sku-1", name: "Macbook M1 Pro" },
      { id: "sku-5", name: "Macbook M5 Pro" },
    ],
  },
  write: async () => undefined,
};

createMockServer({
  database: db,
  port: 3001,
  async route(request, response) {
    if (request.method !== "POST" || request.url !== "/inventory/reservations") return false;

    let body: Partial<InventoryReservationRequest>;
    try {
      body = await readJsonBody<Partial<InventoryReservationRequest>>(request);
    } catch {
      respond(response, 422, { error: "INVALID_JSON", message: "Request body must be JSON" });
      return true;
    }

    if (!body.orderId || !body.sku || typeof body.quantity !== "number" || !Number.isInteger(body.quantity) || body.quantity < 1) {
      respond(response, 422, { error: "INVALID_RESERVATION", message: "orderId, sku and a positive integer quantity are required" });
      return true;
    }
    if (body.sku === "sku-1") {
      respond(response, 422, { error: "INSUFFICIENT_INVENTORY", message: "Requested quantity is unavailable", sku: body.sku, requestedQuantity: body.quantity });
      return true;
    }
    if (body.sku !== "sku-5") {
      respond(response, 404, { error: "PRODUCT_NOT_FOUND", message: `Unknown product ${body.sku}` });
      return true;
    }
    respond(response, 201, {
      orderId: body.orderId,
      reservationId: `reservation-${body.orderId}`,
      sku: body.sku,
      quantity: body.quantity,
      status: "RESERVED",
    } satisfies InventoryReservationResponse);
    return true;
  },
});
