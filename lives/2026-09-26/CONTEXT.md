# Order Processing Workshop

This context describes the order-processing domain used to teach the Temporal Process Manager pattern.

## Ordering

**Order**:
 A customer's request to obtain one or more products, paid for and delivered through the process manager. It records the customer, requested SKU and quantity, total amount, and lifecycle state. Payment card data belongs to payment authorization rather than to the Order.
_Avoid_: Purchase, transaction

**Customer**:
 The person or organization whose standing is validated before an order is fulfilled.
_Avoid_: Client, buyer, account

**Order state**:
 The single lifecycle phase of an order, moving from receipt through validation and fulfillment to completion or failure.
_Avoid_: Order status when referring only to a single phase

## Fulfillment

**Inventory reservation**:
 The successful allocation of the requested quantity of a product for an order.
_Avoid_: Stock check, inventory validation

**Payment authorization**:
 The approval of a customer's card before fulfillment proceeds.
_Avoid_: Customer standing, charge

**Shipment**:
 The accepted request to deliver an order.
_Avoid_: Delivery, dispatch

**Invoice**:
 The billing record created as one of the parallel fulfillment outcomes of an order.
_Avoid_: Bill, payment request

## Orchestration

**Process Manager**:
 The coordinator responsible for advancing an order through inventory reservation, payment authorization, shipment, and invoicing.
_Avoid_: Service bus, order service

**Workflow**:
 The durable execution that represents one order's process-manager instance.
_Avoid_: Job, controller

**Activity**:
 An external operation invoked by a Workflow, such as calling Inventory, Billing, or Shipping.
_Avoid_: Step, handler

**Compensation**:
 A future corrective operation that reverses a completed business action, such as releasing an inventory reservation.
_Avoid_: Rollback

_Avoid_: Sleep, timeout
