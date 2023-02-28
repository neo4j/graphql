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

import camelCase from "camelcase";
import type {
    ObjectTypeDefinitionNode,
    NamedTypeNode,
    ListTypeNode,
    NonNullTypeNode,
    InputObjectTypeDefinitionNode,
} from "graphql";
import { pluralize } from "graphql-compose";
import { gql } from "apollo-server";
import makeAugmentedSchema from "./make-augmented-schema";
import { Node } from "../classes";
import * as constants from "../constants";

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

        const neoSchema = makeAugmentedSchema(typeDefs);
        const document = neoSchema.typeDefs;
        const queryObject = document.definitions.find(
            (x) => x.kind === "ObjectTypeDefinition" && x.name.value === "Query"
        ) as ObjectTypeDefinitionNode;

        ["Actor", "Movie"].forEach((type) => {
            const node = neoSchema.nodes.find((x) => x.name === type);
            expect(node).toBeInstanceOf(Node);
            const nodeObject = document.definitions.find(
                (x) => x.kind === "ObjectTypeDefinition" && x.name.value === type
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
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === `${type}Options`
            );
            expect(options).toBeTruthy();

            // Where
            const where = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === `${type}Where`
            );
            expect(where).toBeTruthy();

            // SORT
            const sort = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === `${type}Sort`
            );
            expect(sort).toBeTruthy();
        });
    });

    test("should throw cannot auto-generate a non ID field", () => {
        const typeDefs = gql`
            type Movie {
                name: String! @id
            }
        `;

        expect(() => makeAugmentedSchema(typeDefs)).toThrow("cannot auto-generate a non ID field");
    });

    test("should throw cannot auto-generate an array", () => {
        const typeDefs = gql`
            type Movie {
                name: [ID] @id
            }
        `;

        expect(() => makeAugmentedSchema(typeDefs)).toThrow("cannot auto-generate an array");
    });

    test("should throw cannot timestamp on array of DateTime", () => {
        const typeDefs = gql`
            type Movie {
                name: [DateTime] @timestamp(operations: [CREATE])
            }
        `;

        expect(() => makeAugmentedSchema(typeDefs)).toThrow("cannot auto-generate an array");
    });

    test("should throw cannot have auth directive on a relationship", () => {
        const typeDefs = gql`
            type Movie {
                movie: Movie! @relationship(type: "NODE", direction: OUT) @auth(rules: [{ operations: [CREATE] }])
            }
        `;

        expect(() => makeAugmentedSchema(typeDefs)).toThrow("cannot have auth directive on a relationship");
    });

    describe("REGEX", () => {
        test("should remove the MATCHES filter by default", () => {
            const typeDefs = gql`
                type Movie {
                    name: String
                }
            `;

            const neoSchema = makeAugmentedSchema(typeDefs);

            const document = neoSchema.typeDefs;

            const nodeWhereInput = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === "MovieWhere"
            ) as InputObjectTypeDefinitionNode;

            const matchesField = nodeWhereInput.fields?.find((x) => x.name.value.endsWith("_MATCHES"));

            expect(matchesField).toBeUndefined();
        });

        test("should add the MATCHES filter when NEO4J_GRAPHQL_ENABLE_REGEX is set", () => {
            const typeDefs = gql`
                type User {
                    name: String
                }
            `;

            const neoSchema = makeAugmentedSchema(typeDefs, {
                enableRegex: true,
                validateResolvers: true,
            });

            const document = neoSchema.typeDefs;

            const nodeWhereInput = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === "UserWhere"
            ) as InputObjectTypeDefinitionNode;

            const matchesField = nodeWhereInput.fields?.find((x) => x.name.value.endsWith("_MATCHES"));

            expect(matchesField).toBeDefined();
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

            const neoSchema = makeAugmentedSchema(typeDefs);

            const document = neoSchema.typeDefs;

            // make sure the schema constructs
            expect(document.kind).toBe("Document");
        });
    });

    test("should throw error if @auth is used on relationship properties interface", () => {
        const typeDefs = gql`
            type Movie {
                actors: Actor! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Actor {
                name: String
            }

            interface ActedIn @auth(rules: [{ operations: [CREATE], roles: ["admin"] }]) {
                screenTime: Int
            }
        `;

        expect(() => makeAugmentedSchema(typeDefs)).toThrow(
            "Cannot have @auth directive on relationship properties interface"
        );
    });

    test("should throw error if @auth is used on relationship property", () => {
        const typeDefs = gql`
            type Movie {
                actors: Actor! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Actor {
                name: String
            }

            interface ActedIn {
                screenTime: Int @auth(rules: [{ operations: [CREATE], roles: ["admin"] }])
            }
        `;

        expect(() => makeAugmentedSchema(typeDefs)).toThrow("Cannot have @auth directive on relationship property");
    });

    test("should throw error if @relationship is used on relationship property", () => {
        const typeDefs = gql`
            type Movie {
                actors: Actor! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Actor {
                name: String
            }

            interface ActedIn {
                actors: Actor! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        expect(() => makeAugmentedSchema(typeDefs)).toThrow(
            "Cannot have @relationship directive on relationship property"
        );
    });

    test("should throw error if @cypher is used on relationship property", () => {
        const typeDefs = gql`
            type Movie {
                actors: Actor! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Actor {
                name: String
            }

            interface ActedIn {
                id: ID @cypher(statement: "RETURN id(this) as id", columnName: "id")
                roles: [String]
            }
        `;

        expect(() => makeAugmentedSchema(typeDefs)).toThrow("Cannot have @cypher directive on relationship property");
    });

    describe("Reserved Names", () => {
        describe("Interface", () => {
            describe("Fields", () => {
                test("should throw when using 'node' as a relationship property", () => {
                    const typeDefs = gql`
                        type Movie {
                            id: ID
                            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                        }

                        interface ActedIn {
                            node: ID
                        }

                        type Actor {
                            name: String
                        }
                    `;

                    expect(() => makeAugmentedSchema(typeDefs)).toThrow(
                        (constants.RESERVED_INTERFACE_FIELDS.find((x) => x[0] === "node") as string[])[1]
                    );
                });

                test("should throw when using 'cursor' as a relationship property", () => {
                    const typeDefs = gql`
                        type Movie {
                            id: ID
                            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                        }

                        interface ActedIn {
                            cursor: ID
                        }

                        type Actor {
                            name: String
                        }
                    `;

                    expect(() => makeAugmentedSchema(typeDefs)).toThrow(
                        (constants.RESERVED_INTERFACE_FIELDS.find((x) => x[0] === "cursor") as string[])[1]
                    );
                });
            });
        });
    });

    describe("@unique", () => {
        test("should throw error if @unique is used on relationship property", () => {
            const typeDefs = gql`
                type Movie {
                    actors: Actor! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                }

                type Actor {
                    name: String
                }

                interface ActedIn {
                    id: ID @unique
                    roles: [String]
                }
            `;

            expect(() => makeAugmentedSchema(typeDefs)).toThrow(
                "@unique directive cannot be used on interface type fields: ActedIn.id"
            );
        });

        test("should throw error if @unique is used on interface field", () => {
            const typeDefs = gql`
                interface Production {
                    id: ID! @unique
                    title: String!
                }

                type Movie implements Production {
                    id: ID!
                    title: String!
                }
            `;

            expect(() => makeAugmentedSchema(typeDefs)).toThrow(
                "@unique directive cannot be used on interface type fields: Production.id"
            );
        });
    });

    describe("Directive combinations", () => {
        test("@unique can't be used with @relationship", () => {
            const typeDefs = gql`
                type Movie {
                    id: ID
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT) @unique
                }

                type Actor {
                    name: String
                }
            `;

            expect(() => makeAugmentedSchema(typeDefs)).toThrow(
                "Directive @unique cannot be used in combination with @relationship"
            );
        });
    });

    describe("@private", () => {
        test("should throw error if @private would leave no fields in interface", () => {
            const typeDefs = gql`
                interface UserInterface {
                    private: String @private
                }

                type User implements UserInterface {
                    id: ID
                    password: String @private
                    private: String
                }
            `;

            expect(() => makeAugmentedSchema(typeDefs)).toThrow(
                "Objects and Interfaces must have one or more fields: UserInterface"
            );
        });

        test("should throw error if @private would leave no fields in object", () => {
            const typeDefs = gql`
                type User {
                    password: String @private
                }
            `;

            expect(() => makeAugmentedSchema(typeDefs)).toThrow(
                "Objects and Interfaces must have one or more fields: User"
            );
        });
    });
    describe("global nodes", () => {
        test("should throw error if more than one @id directive field has the global argument set to true", () => {
            const typeDefs = gql`
                type User {
                    email: ID! @id(global: true)
                    name: ID! @id(global: true)
                }
            `;
            expect(() => makeAugmentedSchema(typeDefs)).toThrow(
                "Only one field may be decorated with an '@id' directive with the global argument set to `true`"
            );
        });
        test("should throw if an @id directive has the global argument set to true, but the unique argument set to false", () => {
            const typeDefs = gql`
                type User {
                    email: ID! @id(global: true, unique: false)
                }
            `;
            expect(() => makeAugmentedSchema(typeDefs)).toThrow(
                `Fields decorated with the "@id" directive must be unique in the database. Please remove it, or consider making the field unique`
            );
        });
        test("should throw if a type already contains an id field", () => {
            const typeDefs = gql`
                type User {
                    id: ID!
                    email: ID! @id(global: true)
                }
            `;

            expect(() => makeAugmentedSchema(typeDefs)).toThrow(
                `Type User already has a field "id." Either remove it, or if you need access to this property, consider using the "@alias" directive to access it via another field`
            );
        });
        test("should not throw if a type already contains an id field but the field is aliased", () => {
            const typeDefs = gql`
                type User {
                    dbId: ID! @id(global: true) @alias(property: "id")
                }
            `;
            expect(() => makeAugmentedSchema(typeDefs)).not.toThrow();
        });
    });
});
