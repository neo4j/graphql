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

import type { Driver } from "neo4j-driver";
import type { Neo4jGraphQL } from "../classes";
import type { AuthContext } from "../types/deprecated/auth/auth-context";
import {
    CypherConnectComponentsPlanner,
    CypherExpressionEngine,
    CypherInterpretedPipesFallback,
    CypherOperatorEngine,
    CypherPlanner,
    CypherReplanning,
    CypherRuntime,
    CypherUpdateStrategy,
} from "../types";
import execute from "./execute";
import { trimmer } from ".";
import { ContextBuilder } from "../../tests/utils/builders/context-builder";
import { Executor } from "../classes/Executor";

describe("execute", () => {
    test("should execute return records.toObject", async () => {
        await Promise.all(
            ["READ", "WRITE"].map(async (access) => {
                const defaultAccessMode = access as "READ" | "WRITE";

                const cypher = `
                    CREATE (u:User {title: $title})
                    RETURN u { .title } as u
                `;

                const title = "some title";
                const params = { title };
                const records = [{ toObject: () => ({ title }) }];
                const database = "neo4j";
                const bookmarks = ["test"];

                // @ts-ignore
                const driver: Driver = {
                    // @ts-ignore
                    session: (options) => {
                        expect(options).toMatchObject({ defaultAccessMode, database, bookmarks });

                        const tx = {
                            run: (paramCypher, paramParams) => {
                                expect(paramCypher).toEqual(cypher);
                                expect(paramParams).toEqual(params);

                                return { records, summary: { counters: { updates: () => ({ test: 1 }) } } };
                            },
                            commit: () => true,
                        };

                        return {
                            beginTransaction: () => tx,
                            readTransaction: (fn) => {
                                // @ts-ignore
                                return fn(tx);
                            },
                            writeTransaction: (fn) => {
                                // @ts-ignore
                                return fn(tx);
                            },
                            lastBookmark: () => "bookmark",
                            close: () => true,
                        };
                    },
                    // @ts-ignore
                    _config: {},
                };

                // @ts-ignore
                const neoSchema: Neo4jGraphQL = {
                    // @ts-ignore
                    options: {},
                };

                const executeResult = await execute({
                    cypher,
                    params,
                    defaultAccessMode,
                    context: new ContextBuilder({
                        neoSchema,
                        executor: new Executor({
                            executionContext: driver,
                            auth: {} as AuthContext,
                            database,
                            bookmarks,
                        }),
                        info: undefined,
                    }).instance(),
                });

                expect(executeResult.records).toEqual([{ title }]);
            })
        );
    });

    describe("should set query options", () => {
        test("no query options if object is empty", async () => {
            const defaultAccessMode = "READ";

            const cypher = trimmer(`
                CREATE (u:User {title: $title})
                RETURN u { .title } as u
            `);

            const title = "some title";
            const params = { title };
            const records = [{ toObject: () => ({ title }) }];
            const database = "neo4j";
            const bookmarks = ["test"];

            // @ts-ignore
            const driver: Driver = {
                // @ts-ignore
                session: (options) => {
                    expect(options).toMatchObject({ defaultAccessMode, database, bookmarks });

                    const tx = {
                        run: (paramCypher: string, paramParams) => {
                            expect(trimmer(paramCypher)).toEqual(cypher);
                            expect(paramParams).toEqual(params);

                            return { records, summary: { counters: { updates: () => ({ test: 1 }) } } };
                        },
                        commit: () => true,
                    };

                    return {
                        beginTransaction: () => tx,
                        readTransaction: (fn) => {
                            // @ts-ignore
                            return fn(tx);
                        },
                        writeTransaction: (fn) => {
                            // @ts-ignore
                            return fn(tx);
                        },
                        lastBookmark: () => "bookmark",
                        close: () => true,
                    };
                },
                // @ts-ignore
                _config: {},
            };

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                // @ts-ignore
                options: {},
            };

            const executeResult = await execute({
                cypher,
                params,
                defaultAccessMode,
                context: new ContextBuilder({
                    neoSchema,
                    executor: new Executor({
                        executionContext: driver,
                        auth: {} as AuthContext,
                        database,
                        bookmarks,
                        queryOptions: {},
                    }),
                    info: undefined,
                }).instance(),
            });

            expect(executeResult.records).toEqual([{ title }]);
        });

        test("one of each query option", async () => {
            const defaultAccessMode = "READ";

            const inputCypher = trimmer(`
            CREATE (u:User {title: $title})
            RETURN u { .title } as u
        `);

            const expectedCypher = trimmer(`
            CYPHER runtime=interpreted planner=cost connectComponentsPlanner=greedy updateStrategy=default expressionEngine=compiled operatorEngine=compiled interpretedPipesFallback=all replan=default
            CREATE (u:User {title: $title})
            RETURN u { .title } as u
        `);

            const title = "some title";
            const params = { title };
            const records = [{ toObject: () => ({ title }) }];
            const database = "neo4j";
            const bookmarks = ["test"];

            // @ts-ignore
            const driver: Driver = {
                // @ts-ignore
                session: (options) => {
                    expect(options).toMatchObject({ defaultAccessMode, database, bookmarks });

                    const tx = {
                        run: (paramCypher: string, paramParams) => {
                            expect(trimmer(paramCypher)).toEqual(expectedCypher);
                            expect(paramParams).toEqual(params);

                            return { records, summary: { counters: { updates: () => ({ test: 1 }) } } };
                        },
                        commit: () => true,
                    };

                    return {
                        beginTransaction: () => tx,
                        readTransaction: (fn) => {
                            // @ts-ignore
                            return fn(tx);
                        },
                        writeTransaction: (fn) => {
                            // @ts-ignore
                            return fn(tx);
                        },
                        lastBookmark: () => "bookmark",
                        close: () => true,
                    };
                },
                // @ts-ignore
                _config: {},
            };

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                // @ts-ignore
                options: {},
            };

            const executeResult = await execute({
                cypher: inputCypher,
                params,
                defaultAccessMode,
                context: new ContextBuilder({
                    neoSchema,
                    executor: new Executor({
                        executionContext: driver,
                        auth: {} as AuthContext,
                        database,
                        bookmarks,
                        queryOptions: {
                            runtime: CypherRuntime.INTERPRETED,
                            planner: CypherPlanner.COST,
                            connectComponentsPlanner: CypherConnectComponentsPlanner.GREEDY,
                            updateStrategy: CypherUpdateStrategy.DEFAULT,
                            expressionEngine: CypherExpressionEngine.COMPILED,
                            operatorEngine: CypherOperatorEngine.COMPILED,
                            interpretedPipesFallback: CypherInterpretedPipesFallback.ALL,
                            replan: CypherReplanning.DEFAULT,
                        },
                    }),
                    info: undefined,
                }).instance(),
            });

            expect(executeResult.records).toEqual([{ title }]);
        });
    });
});
