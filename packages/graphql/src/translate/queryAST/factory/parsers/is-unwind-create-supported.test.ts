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

import { ContextBuilder } from "../../../../../tests/utils/builders/context-builder";
import { SchemaModelBuilder } from "../../../../../tests/utils/builders/schema-model-builder";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import {
    UNSUPPORTED_REASON_ABSTRACT_TYPES,
    UNSUPPORTED_REASON_CONNECT,
    UNSUPPORTED_REASON_CONNECT_OR_CREATE,
    UNSUPPORTED_REASON_POPULATED_BY,
    isUnwindCreateSupported,
} from "./is-unwind-create-supported";

describe("isUnwindCreateSupported", () => {
    const simpleTypeDefs = /* GraphQL */ `
        type Movie {
            title: String!
            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
        }

        type Actor {
            name: String!
            movies: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    `;

    test("valid typeDefs, empty input", () => {
        const schemaModel = new SchemaModelBuilder(simpleTypeDefs).instance();
        const context = new ContextBuilder().instance();
        const MovieAdapter = schemaModel.getConcreteEntityAdapter("Movie");
        const { isSupported, reason } = isUnwindCreateSupported(MovieAdapter as ConcreteEntityAdapter, [], context);
        expect(isSupported).toBeTruthy();
        expect(reason).toBe("");
    });

    test("valid typeDefs, simple input", () => {
        const schemaModel = new SchemaModelBuilder(simpleTypeDefs).instance();
        const context = new ContextBuilder().instance();
        const MovieAdapter = schemaModel.getConcreteEntityAdapter("Movie");
        const { isSupported, reason } = isUnwindCreateSupported(
            MovieAdapter as ConcreteEntityAdapter,
            [{ title: "The Matrix" }, { title: "The Matrix Reloaded" }],
            context
        );
        expect(isSupported).toBeTruthy();
        expect(reason).toBe("");
    });

    test("valid typeDefs, nested input", () => {
        const schemaModel = new SchemaModelBuilder(simpleTypeDefs).instance();
        const context = new ContextBuilder().instance();
        const MovieAdapter = schemaModel.getConcreteEntityAdapter("Movie");
        const input = [
            { title: "The Matrix", actors: { create: [{ node: { name: "actor 1" } }] } },
            { title: "The Matrix 2", actors: { create: [{ node: { name: "actor 2" } }] } },
        ];
        const { isSupported, reason } = isUnwindCreateSupported(MovieAdapter as ConcreteEntityAdapter, input, context);
        expect(isSupported).toBeTruthy();
        expect(reason).toBe("");
    });

    test("valid typeDefs, not supported input (connect)", () => {
        const schemaModel = new SchemaModelBuilder(simpleTypeDefs).instance();
        const context = new ContextBuilder().instance();
        const MovieAdapter = schemaModel.getConcreteEntityAdapter("Movie");
        const input = [
            { title: "The Matrix", actors: { create: [{ node: { name: "actor 1" } }] } },
            { title: "The Matrix 2", actors: { connect: [{ where: { node: { name: "actor 2" } } }] } },
        ];
        const { isSupported, reason } = isUnwindCreateSupported(MovieAdapter as ConcreteEntityAdapter, input, context);
        expect(isSupported).toBeFalsy();
        expect(reason).toBe(UNSUPPORTED_REASON_CONNECT);
    });

    test("valid typeDefs, not supported input (connectOrCreate)", () => {
        const schemaModel = new SchemaModelBuilder(simpleTypeDefs).instance();
        const context = new ContextBuilder().instance();
        const MovieAdapter = schemaModel.getConcreteEntityAdapter("Movie");
        const input = [
            { title: "The Matrix", actors: { create: [{ node: { name: "actor 1" } }] } },
            {
                title: "The Matrix 2",
                actors: {
                    connectOrCreate: [
                        { where: { node: { id: "actor-2-id" } }, onCreate: { node: { name: "actor 2" } } },
                    ],
                },
            },
        ];
        const { isSupported, reason } = isUnwindCreateSupported(MovieAdapter as ConcreteEntityAdapter, input, context);
        expect(isSupported).toBeFalsy();
        expect(reason).toBe(UNSUPPORTED_REASON_CONNECT_OR_CREATE);
    });

    test("valid typeDefs, not supported nested input (connect)", () => {
        const schemaModel = new SchemaModelBuilder(simpleTypeDefs).instance();
        const context = new ContextBuilder().instance();
        const MovieAdapter = schemaModel.getConcreteEntityAdapter("Movie");
        const input = [
            {
                title: "The Matrix",
                actors: { create: [{ node: { name: "actor 1" } }] },
            },
            {
                title: "The Matrix 2",
                actors: {
                    create: [
                        {
                            node: {
                                name: "actor 2",
                                movies: {
                                    create: {
                                        node: {
                                            title: "The Matrix",
                                            actors: {
                                                connect: [{ where: { node: { name: "actor 3" } } }],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        ];
        const { isSupported, reason } = isUnwindCreateSupported(MovieAdapter as ConcreteEntityAdapter, input, context);
        expect(isSupported).toBeFalsy();
        expect(reason).toBe(UNSUPPORTED_REASON_CONNECT);
    });

    test("populatedBy not supported", () => {
        const populatedByTD = /* GraphQL */ `
            type Movie {
                title: String! @populatedBy(callback: "setTitle", operations: [CREATE])
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;
        const schemaModel = new SchemaModelBuilder(populatedByTD).instance();
        const context = new ContextBuilder().instance();
        const MovieAdapter = schemaModel.getConcreteEntityAdapter("Movie");
        const input = [
            { actors: { create: [{ node: { name: "actor 1" } }] } },
            { actors: { create: [{ node: { name: "actor 2" } }] } },
        ];
        const { isSupported, reason } = isUnwindCreateSupported(MovieAdapter as ConcreteEntityAdapter, input, context);
        expect(isSupported).toBeFalsy();
        expect(reason).toBe(UNSUPPORTED_REASON_POPULATED_BY);
    });

    test("populatedBy defined but not for create operations", () => {
        const populatedByTD = /* GraphQL */ `
            type Movie {
                title: String! @populatedBy(callback: "setTitle", operations: [UPDATE])
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;
        const schemaModel = new SchemaModelBuilder(populatedByTD).instance();
        const context = new ContextBuilder().instance();
        const MovieAdapter = schemaModel.getConcreteEntityAdapter("Movie");
        const input = [
            { actors: { create: [{ node: { name: "actor 1" } }] } },
            { actors: { create: [{ node: { name: "actor 2" } }] } },
        ];
        const { isSupported, reason } = isUnwindCreateSupported(MovieAdapter as ConcreteEntityAdapter, input, context);
        expect(isSupported).toBeTruthy();
        expect(reason).toBe("");
    });

    test("populatedBy not supported (nested)", () => {
        const populatedByTD = /* GraphQL */ `
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Actor {
                id: ID!
                name: String! @populatedBy(callback: "setName", operations: [CREATE])
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;
        const schemaModel = new SchemaModelBuilder(populatedByTD).instance();
        const context = new ContextBuilder().instance();
        const MovieAdapter = schemaModel.getConcreteEntityAdapter("Movie");
        const input = [
            { actors: { create: [{ node: { id: "actor 1" } }] } },
            { actors: { create: [{ node: { id: "actor 2" } }] } },
        ];
        const { isSupported, reason } = isUnwindCreateSupported(MovieAdapter as ConcreteEntityAdapter, input, context);
        expect(isSupported).toBeFalsy();
        expect(reason).toBe(UNSUPPORTED_REASON_POPULATED_BY);
    });

    test("populatedBy defined but not for create operations (nested)", () => {
        const populatedByTD = /* GraphQL */ `
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Actor {
                id: ID!
                name: String! @populatedBy(callback: "setName", operations: [UPDATE])
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;
        const schemaModel = new SchemaModelBuilder(populatedByTD).instance();
        const context = new ContextBuilder().instance();
        const MovieAdapter = schemaModel.getConcreteEntityAdapter("Movie");
        const input = [
            { actors: { create: [{ node: { id: "actor 1" } }] } },
            { actors: { create: [{ node: { id: "actor 2" } }] } },
        ];
        const { isSupported, reason } = isUnwindCreateSupported(MovieAdapter as ConcreteEntityAdapter, input, context);
        expect(isSupported).toBeTruthy();
        expect(reason).toBe("");
    });

    test("abstract types not supported", () => {
        const abstractTypesTD = /* GraphQL */ `
            interface Entity {
                id: ID!
            }

            type Movie implements Entity {
                id: ID!
                title: String!
                actors: [Entity!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Actor implements Entity {
                id: ID!
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;
        const schemaModel = new SchemaModelBuilder(abstractTypesTD).instance();
        const context = new ContextBuilder().instance();
        const MovieAdapter = schemaModel.getConcreteEntityAdapter("Movie");
        const input = [
            {
                id: "Movie1",
                title: "The Matrix",
                actors: {
                    create: [{ node: { Actor: { id: "Actor1", name: "actor 1" } } }],
                },
            },
        ];
        const { isSupported, reason } = isUnwindCreateSupported(MovieAdapter as ConcreteEntityAdapter, input, context);
        expect(isSupported).toBeFalsy();
        expect(reason).toBe(UNSUPPORTED_REASON_ABSTRACT_TYPES);
    });
});
