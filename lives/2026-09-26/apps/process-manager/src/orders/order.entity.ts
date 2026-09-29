export enum OrderState {
  RECEIVED = "RECEIVED",
  VALIDATING = "VALIDATING",
  FULFILLING = "FULFILLING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export type OrderEntity = {
  orderId: string;
  workflowId: string;
  customerId?: string;
  sku: string;
  quantity: number;
  amount?: number;
  createdAt: Date;
  state: OrderState;
};

export type OrderStateSnapshot = Pick<OrderEntity, "orderId" | "state">;
