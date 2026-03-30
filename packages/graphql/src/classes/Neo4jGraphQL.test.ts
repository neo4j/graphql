/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLSchema } from "graphql";
import { getErrorAsync, NoErrorThrownError } from "../../tests/utils/get-error";
import Neo4jGraphQL from "./Neo4jGraphQL";

describe("Neo4jGraphQL", () => {
    test("should construct", () => {
        // @ts-ignore
        expect(new Neo4jGraphQL({ typeDefs: "type User {id: ID}" })).toBeInstanceOf(Neo4jGraphQL);
    });

    describe("methods", () => {
        describe("checkNeo4jCompat", () => {
            test("should throw neo4j-driver Driver missing", async () => {
                const neoSchema = new Neo4jGraphQL({ typeDefs: "type User {id: ID}" });

                await expect(neoSchema.checkNeo4jCompat()).rejects.toThrow(`neo4j-driver Driver missing`);
            });
        });

        describe("getExecutableSchema", () => {
            test("error should contain path", async () => {
                let schema: GraphQLSchema | undefined = undefined;
                const typeDefs = /* GraphQL */ `
                    type User @node @authorization(filter: [{ where: { banana: { id: "$jwt.sub" } } }]) {
                        id: ID
                    }
                `;
                const errors: Error[] = await getErrorAsync(async () => {
                    schema = await new Neo4jGraphQL({
                        typeDefs,
                    }).getExecutableSchema();
                });
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty("path", ["User", "@authorization", "filter", 0, "where"]);
                expect(schema).toBeUndefined();
            });
        });
    });
});
