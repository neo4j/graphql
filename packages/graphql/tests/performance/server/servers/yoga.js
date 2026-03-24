/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

"use strict";

import neo4j from "neo4j-driver";
// eslint-disable-next-line import/no-unresolved
import { Neo4jGraphQL } from "@neo4j/graphql";
import { createYoga } from "graphql-yoga";
import { createServer } from "http";
import { getLargeSchema } from "../typedefs.js";

async function main() {
    const { NEO_USER = "neo4j", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

    const driver = neo4j.driver(NEO_URL, neo4j.auth.basic(NEO_USER, NEO_PASSWORD), {
        maxConnectionPoolSize: 100,
    });
    const neoSchema = new Neo4jGraphQL({
        typeDefs: getLargeSchema(1),
        driver,
    });
    const schema = await neoSchema.getSchema();

    await neoSchema.assertIndexesAndConstraints({ options: { create: true } });

    const yoga = createYoga({
        schema,
    });

    const server = createServer(yoga);

    server.listen(4000, () => {
        console.info("Server is running on http://localhost:4000/graphql");
    });
}

main().catch((err) => {
    console.error(err);
});
