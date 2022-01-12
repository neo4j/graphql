/* eslint-disable @typescript-eslint/no-unused-vars */
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

import { gql } from "apollo-server";
import { GraphQLSchema } from "graphql";
import { Neo4jGraphQL } from "../../../src";

describe("schema/rfs/003", () => {
    const msg = "Cannot represent null for the relationship Source.targets, try using NonNull operator '!'";
    describe("ObjectType", () => {
        test("should not throw when using valid relationship", () => {
            const typeDefs = gql`
                type Source {
                    targets: [Target!]! @relationship(type: "HAS_TARGET", direction: OUT)
                    target1: Target! @relationship(type: "HAS_TARGET", direction: OUT)
                    target2: Target @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Target {
                    id: ID @id
                }
            `;

            expect(new Neo4jGraphQL({ typeDefs })?.schema).toBeInstanceOf(GraphQLSchema);
        });

        test("If there are no relationships, then should always be empty array and not null", () => {
            const typeDefs = gql`
                type Source {
                    targets: [Target!] @relationship(type: "HAS_TARGET", direction: OUT) # If there are no relationships, then should always be empty array and not null
                }

                type Target {
                    id: ID @id
                }
            `;

            expect(() => {
                const neoSchema = new Neo4jGraphQL({ typeDefs });
            }).toThrow(msg);
        });

        test("This suggests a relationship with no target node", () => {
            const typeDefs = gql`
                type Source {
                    targets: [Target]! @relationship(type: "HAS_TARGET", direction: OUT) # This suggests a relationship with no target node
                }

                type Target {
                    id: ID @id
                }
            `;

            expect(() => {
                const neoSchema = new Neo4jGraphQL({ typeDefs });
            }).toThrow(msg);
        });

        test("This is a combination of both of the above problems", () => {
            const typeDefs = gql`
                type Source {
                    targets: [Target] @relationship(type: "HAS_TARGET", direction: OUT) # This is a combination of both of the above problems
                }

                type Target {
                    id: ID @id
                }
            `;

            expect(() => {
                const neoSchema = new Neo4jGraphQL({ typeDefs });
            }).toThrow(msg);
        });
    });

    describe("InterfaceType", () => {
        test("should not throw when using valid relationship", () => {
            const typeDefs = gql`
                interface SourceInterface {
                    targets: [Target!]! @relationship(type: "HAS_TARGET", direction: OUT)
                    target1: Target! @relationship(type: "HAS_TARGET", direction: OUT)
                    target2: Target @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Source implements SourceInterface {
                    id: ID @id
                    targets: [Target!]!
                    target1: Target!
                    target2: Target
                }

                type Target {
                    id: ID @id
                }
            `;

            expect(new Neo4jGraphQL({ typeDefs })?.schema).toBeInstanceOf(GraphQLSchema);
        });

        test("If there are no relationships, then should always be empty array and not null", () => {
            const typeDefs = gql`
                interface SourceInterface {
                    targets: [Target!] @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Source implements SourceInterface {
                    id: ID @id
                    targets: [Target!]
                }

                type Target {
                    id: ID @id
                }
            `;

            expect(() => {
                const neoSchema = new Neo4jGraphQL({ typeDefs });
            }).toThrow(msg);
        });

        test("This suggests a relationship with no target node", () => {
            const typeDefs = gql`
                interface SourceInterface {
                    targets: [Target]! @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Source implements SourceInterface {
                    id: ID @id
                    targets: [Target]!
                }

                type Target {
                    id: ID @id
                }
            `;

            expect(() => {
                const neoSchema = new Neo4jGraphQL({ typeDefs });
            }).toThrow(msg);
        });

        test("This is a combination of both of the above problems", () => {
            const typeDefs = gql`
                interface SourceInterface {
                    targets: [Target] @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Source implements SourceInterface {
                    id: ID @id
                    targets: [Target]
                }

                type Target {
                    id: ID @id
                }
            `;

            expect(() => {
                const neoSchema = new Neo4jGraphQL({ typeDefs });
            }).toThrow(msg);
        });
    });
});
/* eslint-enable @typescript-eslint/no-unused-vars */
