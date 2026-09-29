import { createMockServer, readJsonBody, respond } from "@temporal-workshop/mock-http";
import type {
  InvoiceRequest,
  InvoiceResponse,
  PaymentAuthorizationRequest,
  PaymentAuthorizationResponse,
} from "@temporal-workshop/contracts";

type RequestBody = Partial<PaymentAuthorizationRequest & InvoiceRequest>;

const db = {
  data: {
    cards: [
      { id: "card-0", number: "0000000000000000", status: "DECLINED" },
      { id: "card-1", number: "1111111111111111", status: "APPROVED" },
    ],
    invoices: [],
  },
  write: async () => undefined,
};

createMockServer({
  database: db,
  port: 3002,
  async route(request, response) {
    const isAuthorization = request.method === "POST" && request.url === "/billing/authorizations";
    const isInvoice = request.method === "POST" && request.url === "/billing/invoices";
    if (!isAuthorization && !isInvoice) return false;

    let body: RequestBody;
    try {
      body = await readJsonBody<RequestBody>(request);
    } catch {
      respond(response, 422, { error: "INVALID_JSON", message: "Request body must be JSON" });
      return true;
    }

    if (isAuthorization) {
      if (!body.orderId || !body.cardNumber) {
        respond(response, 422, { error: "INVALID_PAYMENT_AUTHORIZATION", message: "orderId and cardNumber are required" });
        return true;
      }
      if (/^0+$/.test(body.cardNumber)) {
        respond(response, 402, { error: "PAYMENT_DECLINED", message: "The card was declined", orderId: body.orderId });
        return true;
      }
      if (!/^1+$/.test(body.cardNumber)) {
        respond(response, 422, { error: "UNKNOWN_CARD", message: "Only the workshop cards are registered" });
        return true;
      }
      respond(response, 201, {
        orderId: body.orderId,
        authorizationId: `authorization-${body.orderId}`,
        status: "AUTHORIZED",
      } satisfies PaymentAuthorizationResponse);
      return true;
    }

    if (!body.orderId || typeof body.amount !== "number" || body.amount <= 0) {
      respond(response, 422, { error: "INVALID_INVOICE", message: "orderId and a positive numeric amount are required" });
      return true;
    }
    respond(response, 201, {
      orderId: body.orderId,
      invoiceId: `invoice-${body.orderId}`,
      amount: body.amount,
      status: "ISSUED",
    } satisfies InvoiceResponse);
    return true;
  },
});
