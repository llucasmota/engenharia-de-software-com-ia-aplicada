const baseUrl = process.env.PROCESS_MANAGER_URL ?? "http://localhost:3000";

export async function createOrder(overrides = {}) {
  const response = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId: process.env.CUSTOMER_ID ?? "customer-1",
      sku: process.env.SKU ?? "sku-5",
      quantity: Number(process.env.QUANTITY ?? 1),
      cardNumber: process.env.CARD_NUMBER ?? "1111111111111111",
      amount: Number(process.env.AMOUNT ?? 1999.9),
      ...overrides,
    }),
  });

  return readResponse(response);
}

export async function getOrder(orderId) {
  const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`);
  return readResponse(response);
}

async function readResponse(response) {
  const body = await response.text();
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    data = body;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}
