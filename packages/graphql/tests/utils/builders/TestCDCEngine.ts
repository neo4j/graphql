/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQLSubscriptionsCDCEngine } from "../../../src";
import { DriverBuilder } from "./driver-builder";

export class TestCDCEngine extends Neo4jGraphQLSubscriptionsCDCEngine {
    constructor() {
        const driverBuilder = new DriverBuilder();
        super({
            driver: driverBuilder.instance(),
        });
    }

    public async init(): Promise<void> {
        // Disable polling
    }
}
