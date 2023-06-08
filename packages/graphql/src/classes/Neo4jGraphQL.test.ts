/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
        describe("neo4jValidateGraphQLDocument", () => {
            test("should return validation error when invalid type definitions provided", () => {
                const neoSchema = new Neo4jGraphQL({ typeDefs: "type User { name: Strin }" });

                const { validationErrors, isValid } = neoSchema.neo4jValidateGraphQLDocument();

                expect(validationErrors).toHaveLength(1);
                expect(validationErrors).toContain('Unknown type "Strin". Did you mean "String"?');
                expect(isValid).toBeFalse();
            });
            test("should return several validation errors when invalid type definitions provided", () => {
                const neoSchema = new Neo4jGraphQL({ typeDefs: "type User { name: Strin @autogenera }" });

                const { validationErrors, isValid } = neoSchema.neo4jValidateGraphQLDocument();

                expect(validationErrors).toHaveLength(2);
                expect(validationErrors).toContain('Unknown type "Strin". Did you mean "String"?');
                expect(validationErrors).toContain('Unknown directive "@autogenera".');
                expect(isValid).toBeFalse();
            });
            test("should not return validation error when valid type definitions provided", () => {
                const neoSchema = new Neo4jGraphQL({ typeDefs: "type User { name: String }" });

                const { validationErrors, isValid } = neoSchema.neo4jValidateGraphQLDocument();

                expect(validationErrors).toHaveLength(0);
                expect(isValid).toBeTrue();
            });
        });

        describe("getExecutableSchema", () => {
            test("error should contain path", async () => {
                let schema: GraphQLSchema | undefined = undefined;
                const error = await getErrorAsync(async () => {
                    schema = await new Neo4jGraphQL({
                        typeDefs:
                            'type User @authorization(filter: [{ where: { banana: { id: "$jwt.sub" } } }]) {id: ID}',
                    }).getExecutableSchema();
                });
                expect(error).not.toBeInstanceOf(NoErrorThrownError);
                expect(error).toHaveProperty("path", ["User", "@authorization", "filter", 0, "where"]);
                expect(schema).toBeUndefined();
            });
        });
    });
});
