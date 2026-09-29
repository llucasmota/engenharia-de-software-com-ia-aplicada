import { Injectable } from "@nestjs/common";
import type { OrderEntity, OrderStateSnapshot } from "./order.entity.ts";

@Injectable()
export class OrderRepository {
  private readonly records = new Map<string, OrderEntity>();

  save(order: Omit<OrderEntity, "createdAt">): void {
    this.records.set(order.orderId, { ...order, createdAt: new Date() });
  }

  saveState(snapshot: OrderStateSnapshot): void {
    const record = this.records.get(snapshot.orderId);
    if (!record) throw new Error(`Order ${snapshot.orderId} is not registered`);
    this.records.set(snapshot.orderId, { ...record, state: snapshot.state });
  }

  remove(orderId: string): void {
    this.records.delete(orderId);
  }

  find(orderId: string): OrderEntity | undefined {
    return this.records.get(orderId);
  }
}
