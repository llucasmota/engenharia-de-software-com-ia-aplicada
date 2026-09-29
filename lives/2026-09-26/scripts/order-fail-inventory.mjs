import { createOrder } from "./order-client.mjs";

try {
  console.log(
    JSON.stringify(
      await createOrder({
        sku: "sku-1",
        cardNumber: "1111111111111111",
      }),
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
