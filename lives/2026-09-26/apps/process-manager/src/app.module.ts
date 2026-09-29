import { Module } from "@nestjs/common";
import { HttpClientsModule } from "@temporal-workshop/http-client";
import { fileURLToPath } from "node:url";
import { TemporalModule } from "nestjs-temporal-core";
import { OrdersController } from "./orders/orders.controller.ts";
import { OrderRepository } from "./orders/orders.repository.ts";
import { OrdersService } from "./orders/orders.service.ts";
import { OrderActivities } from "./temporal/order.activities.ts";
import {
  temporalAddress,
  temporalNamespace,
  temporalTaskQueue,
} from "./temporal/temporal.runtime.ts";

@Module({
  imports: [
    HttpClientsModule,
    TemporalModule.register({
      connection: { address: temporalAddress(), namespace: temporalNamespace },
      taskQueue: temporalTaskQueue,
      worker: {
        workflowsPath: fileURLToPath(new URL("./temporal/order.workflow.js", import.meta.url)),
        activityClasses: [OrderActivities],
      },
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRepository, OrderActivities],
})
export class AppModule {}
