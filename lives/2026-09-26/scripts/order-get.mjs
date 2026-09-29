import { getOrder } from "./order-client.mjs";

const orderId = process.argv[2] ?? process.env.ORDER_ID;
if (!orderId) {
  console.error("Uso: pnpm run order:get -- <orderId>");
  process.exit(2);
}

try {
  console.log(JSON.stringify(await getOrder(orderId), null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
