export type OrderRequest = {
  customerId?: string;
  sku: string;
  quantity: number;
  cardNumber?: string;
  amount?: number;
};

export type OrderInput = OrderRequest & {
  orderId: string;
};

export type InventoryReservationRequest = {
  orderId: string;
  sku: string;
  quantity: number;
};

export type InventoryReservationResponse = InventoryReservationRequest & {
  reservationId: string;
  status: "RESERVED";
};

export type PaymentAuthorizationRequest = {
  orderId: string;
  cardNumber: string;
};

export type PaymentAuthorizationResponse = {
  orderId: string;
  authorizationId: string;
  status: "AUTHORIZED";
};

export type InvoiceRequest = {
  orderId: string;
  amount: number;
};

export type InvoiceResponse = InvoiceRequest & {
  invoiceId: string;
  status: "ISSUED";
};

export type ShipmentRequest = {
  orderId: string;
};

export type ShipmentResponse = ShipmentRequest & {
  shipmentId: string;
  status: "ACCEPTED";
};
