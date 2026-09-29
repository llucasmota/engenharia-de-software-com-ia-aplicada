import { createOrder } from "./order-client.mjs";

try {
  console.log(JSON.stringify(await createOrder(), null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
