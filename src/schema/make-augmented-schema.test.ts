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

import { mergeTypeDefs } from "@graphql-tools/merge";
import camelCase from "camelcase";
import {
    Kind,
    type InputObjectTypeDefinitionNode,
    type ListTypeNode,
    type NamedTypeNode,
    type NonNullTypeNode,
    type ObjectTypeDefinitionNode,
} from "graphql";
import { pluralize } from "graphql-compose";
import { gql } from "graphql-tag";
import { Node } from "../classes";
import { generateModel } from "../schema-model/generate-model";
import makeAugmentedSchema from "./make-augmented-schema";

describe("makeAugmentedSchema", () => {
    test("should be a function", () => {
        expect(makeAugmentedSchema).toBeInstanceOf(Function);
    });

    test("should return the correct schema", () => {
        const typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const schemaModel = generateModel(mergeTypeDefs(typeDefs));
        const neoSchema = makeAugmentedSchema({ document: typeDefs, schemaModel });
        const document = neoSchema.typeDefs;
        const queryObject = document.definitions.find(
            (x) => x.kind === Kind.OBJECT_TYPE_DEFINITION && x.name.value === "Query"
        ) as ObjectTypeDefinitionNode;

        ["Actor", "Movie"].forEach((type) => {
            const node = neoSchema.nodes.find((x) => x.name === type);
            expect(node).toBeInstanceOf(Node);
            const nodeObject = document.definitions.find(
                (x) => x.kind === Kind.OBJECT_TYPE_DEFINITION && x.name.value === type
            );
            expect(nodeObject).toBeTruthy();

            // Find
            const nodeFindQuery = queryObject.fields?.find((x) => x.name.value === pluralize(camelCase(type)));
            const nodeFindQueryType = (
                ((nodeFindQuery?.type as NonNullTypeNode).type as ListTypeNode).type as NonNullTypeNode
            ).type as NamedTypeNode;
            expect(nodeFindQueryType.name.value).toEqual(type);

            // Options
            const options = document.definitions.find(
                (x) => x.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && x.name.value === `${type}Options`
            );
            expect(options).toBeTruthy();

            // Where
            const where = document.definitions.find(
                (x) => x.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && x.name.value === `${type}Where`
            );
            expect(where).toBeTruthy();

            // SORT
            const sort = document.definitions.find(
                (x) => x.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && x.name.value === `${type}Sort`
            );
            expect(sort).toBeTruthy();
        });
    });

    describe("REGEX", () => {
        test("should remove the MATCHES filter by default", () => {
            const typeDefs = gql`
                type Movie {
                    name: String
                }
            `;

            const schemaModel = generateModel(mergeTypeDefs(typeDefs));
            const neoSchema = makeAugmentedSchema({ document: typeDefs, schemaModel });

            const document = neoSchema.typeDefs;

            const nodeWhereInput = document.definitions.find(
                (x) => x.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && x.name.value === "MovieWhere"
            ) as InputObjectTypeDefinitionNode;

            const matchesField = nodeWhereInput.fields?.find((x) => x.name.value.endsWith("_MATCHES"));

            expect(matchesField).toBeUndefined();
        });

        test("should add the name_MATCHES filter when Features.Filters.String.MATCHES is set", () => {
            const typeDefs = gql`
                type User {
                    name: String
                }
            `;

            const schemaModel = generateModel(mergeTypeDefs(typeDefs));
            const neoSchema = makeAugmentedSchema({
                document: typeDefs,
                features: {
                    filters: {
                        String: {
                            MATCHES: true,
                        },
                    },
                },
                schemaModel,
            });

            const document = neoSchema.typeDefs;

            const nodeWhereInput = document.definitions.find(
                (x) => x.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && x.name.value === "UserWhere"
            ) as InputObjectTypeDefinitionNode;

            const matchesField = nodeWhereInput.fields?.find((x) => x.name.value.endsWith("name_MATCHES"));

            expect(matchesField).toBeDefined();
        });

        test("should add the id_MATCHES filter when Features.Filters.ID.MATCHES is set", () => {
            const typeDefs = gql`
                type User {
                    id: ID
                    name: String
                }
            `;

            const schemaModel = generateModel(mergeTypeDefs(typeDefs));
            const neoSchema = makeAugmentedSchema({
                document: typeDefs,
                features: {
                    filters: {
                        ID: {
                            MATCHES: true,
                        },
                    },
                },
                schemaModel,
            });

            const document = neoSchema.typeDefs;

            const nodeWhereInput = document.definitions.find(
                (x) => x.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && x.name.value === "UserWhere"
            ) as InputObjectTypeDefinitionNode;

            const matchesField = nodeWhereInput.fields?.find((x) => x.name.value.endsWith("id_MATCHES"));

            expect(matchesField).toBeDefined();
        });

        test("should not add the id_MATCHES filter when Features.Filters.String.MATCHES is set but Features.Filters.ID.MATCHES is not set", () => {
            const typeDefs = gql`
                type User {
                    id: ID
                    name: String
                }
            `;

            const schemaModel = generateModel(mergeTypeDefs(typeDefs));
            const neoSchema = makeAugmentedSchema({
                document: typeDefs,
                features: {
                    filters: {
                        String: {
                            MATCHES: true,
                        },
                        ID: {
                            MATCHES: false,
                        },
                    },
                },
                schemaModel,
            });

            const document = neoSchema.typeDefs;

            const nodeWhereInput = document.definitions.find(
                (x) => x.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && x.name.value === "UserWhere"
            ) as InputObjectTypeDefinitionNode;

            const nameMatchesField = nodeWhereInput.fields?.find((x) => x.name.value.endsWith("name_MATCHES"));

            expect(nameMatchesField).toBeDefined();

            const idMatchesField = nodeWhereInput.fields?.find((x) => x.name.value.endsWith("id_MATCHES"));

            expect(idMatchesField).toBeUndefined();
        });

        test("should not add the name_MATCHES filter when Features.Filters.ID.MATCHES is set but Features.Filters.Name.MATCHES is not set", () => {
            const typeDefs = gql`
                type User {
                    id: ID
                    name: String
                }
            `;

            const schemaModel = generateModel(mergeTypeDefs(typeDefs));
            const neoSchema = makeAugmentedSchema({
                document: typeDefs,
                features: {
                    filters: {
                        String: {
                            MATCHES: false,
                        },
                        ID: {
                            MATCHES: true,
                        },
                    },
                },
                schemaModel,
            });

            const document = neoSchema.typeDefs;

            const nodeWhereInput = document.definitions.find(
                (x) => x.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && x.name.value === "UserWhere"
            ) as InputObjectTypeDefinitionNode;

            const nameMatchesField = nodeWhereInput.fields?.find((x) => x.name.value.endsWith("name_MATCHES"));

            expect(nameMatchesField).toBeUndefined();

            const idMatchesField = nodeWhereInput.fields?.find((x) => x.name.value.endsWith("id_MATCHES"));

            expect(idMatchesField).toBeDefined();
        });
    });

    describe("issues", () => {
        test("158", () => {
            // https://github.com/neo4j/graphql/issues/158

            const typeDefs = gql`
                type Movie {
                    createdAt: DateTime
                }

                type Query {
                    movies: [Movie!]! @cypher(statement: "RETURN 5 as a", columnName: "a")
                }
            `;

            const schemaModel = generateModel(mergeTypeDefs(typeDefs));
            const neoSchema = makeAugmentedSchema({ document: typeDefs, schemaModel });

            const document = neoSchema.typeDefs;

            // make sure the schema constructs
            expect(document.kind).toBe("Document");
        });

        test("3270 - should not throw if directive has arguments of input type", () => {
            const typeDefs = gql`
                directive @testDirective(action_mapping: [ActionMapping]) on OBJECT | FIELD_DEFINITION | QUERY
                input ActionMapping {
                    action: [String!]
                }
                type TestType {
                    someField: String
                }
            `;

            const schemaModel = generateModel(mergeTypeDefs(typeDefs));
            expect(() => makeAugmentedSchema({ document: typeDefs, schemaModel })).not.toThrow(
                'Error: Type with name "ActionMapping" does not exists'
            );
        });
    });
});
