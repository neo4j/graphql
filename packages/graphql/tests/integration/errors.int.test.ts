/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLError } from "graphql";
import { graphql } from "graphql";
import { Neo4jGraphQL } from "../../src/classes";
import { UniqueType } from "../utils/graphql-types";

describe("Errors", () => {
    test("An error should be thrown if no driver is supplied", async () => {
        const Movie = new UniqueType("Movie");

        const typeDefs = `
            type ${Movie} @node {
              id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            query {
                ${Movie.plural} {
                    id
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
        });

        expect(gqlResult.errors).toHaveLength(1);
        expect((gqlResult.errors as GraphQLError[])[0]?.message).toBe(
            "A Neo4j driver instance must either be passed to Neo4jGraphQL on construction, or a driver, session or transaction passed as context.executionContext in each request."
        );
    });
});
