import { Injectable } from "@nestjs/common";
import { Activity } from "nestjs-temporal-core";

@Injectable()
@Activity({ name: "order-activities" })
export class OrderActivities {}
