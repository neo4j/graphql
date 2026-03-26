/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLError } from "graphql";
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/873", () => {
    test("Fails on name conflict in schema generation", async () => {
        const typeDefs = /* GraphQL */ `
            type Tech @node @plural(value: "Techs") {
                name: String
            }

            type AnotherTech @node @plural(value: "Techs") {
                name: String
            }

            type Techs @node {
                value: String
            }
        `;

        await expect(async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
            await neoSchema.getSchema();
        }).rejects.toIncludeSameMembers([
            new GraphQLError(`Ambiguous plural "techs" in "AnotherTech"`),
            new GraphQLError(`Ambiguous plural "techs" in "Techs"`),
        ]);
    });
});
