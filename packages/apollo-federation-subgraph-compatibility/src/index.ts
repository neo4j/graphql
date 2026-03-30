/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import * as neo4j from "neo4j-driver";

import { resolvers } from "./resolvers";
import { startServer } from "./server";
import { typeDefs } from "./type-defs";

const {
    NEO4J_URI = "neo4j://localhost:7687/neo4j",
    NEO4J_USERNAME = "neo4j",
    NEO4J_PASSWORD = "password",
} = process.env;

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));

startServer({ typeDefs, resolvers, driver })
    .then((url) => {
        console.log(`🚀  Server ready at: ${url}`);
    })
    .catch((reason) => console.error(reason));
