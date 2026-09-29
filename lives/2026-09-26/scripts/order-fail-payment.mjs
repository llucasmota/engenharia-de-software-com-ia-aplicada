import { createOrder } from "./order-client.mjs";

try {
  console.log(
    JSON.stringify(
      await createOrder({
        sku: "sku-5",
        cardNumber: "0000000000000000",
      }),
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
