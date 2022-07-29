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
import type { GraphQLResolveInfo, GraphQLSchema } from "graphql";
import type { Session, Driver } from "neo4j-driver";
import { VersionMismatchError } from "../../classes";
import type { Context } from "../../types";
import { wrapResolver } from "./wrapper";

describe("wrapper test", () => {
    let fakeSession: Session;
    let fakeDriver: Driver;
    const major = 4;
    const minor = 5;
    const edition = "enterprise";
    const readTransaction = jest.fn(() => ({
        // @ts-ignore
        records: [[`${major}.${minor}.5`, edition]],
    })) as any;

    let wrapResolverArgs: Parameters<typeof wrapResolver>[0];

    beforeEach(() => {
        // @ts-ignore
        fakeSession = {
            readTransaction,
            // @ts-ignore
            run: () => ({
                // @ts-ignore
                records: [],
            }),
            lastBookmark: () => [],
            // @ts-ignore
            close: () => undefined,
        };
        // @ts-ignore
        fakeDriver = {
            // @ts-ignore
            session: (config) => {
                return fakeSession;
            },
            // @ts-ignore
            verifyConnectivity: () => undefined,
        };
        wrapResolverArgs = {
            driver: fakeDriver,
            config: {},
            nodes: [],
            relationships: [],
            schema: {} as GraphQLSchema,
            plugins: {},
        };
        readTransaction.mockClear();
    });

    test("should return a function", () => {
        const resolverDecorator = wrapResolver(wrapResolverArgs);
        expect(resolverDecorator).toBeInstanceOf(Function);
    });

    test("should initialise neo4jDatabaseInfo, by using dbms.components, when is not already initialised", async () => {
        const resolverDecorator = wrapResolver(wrapResolverArgs);
        const resolvedResult = "Resolved value";
        const resolver = jest.fn((root, args, context: Context, info) => {
            expect(context).toBeDefined();
            expect(context.neo4jDatabaseInfo).toBeDefined();
            expect(context.neo4jDatabaseInfo?.edition).toBe(edition);
            expect(context.neo4jDatabaseInfo?.version).toStrictEqual({ major, minor });
            return resolvedResult;
        });
        const decoratedResolver = resolverDecorator(resolver);
        const res = await decoratedResolver({}, {}, {} as Context, {} as GraphQLResolveInfo);
        expect(res).toBe(resolvedResult);
        expect(readTransaction).toHaveBeenCalledTimes(1);
        expect(resolver).toHaveBeenCalledTimes(1);
    });

    test("should not invoke dbms.components if neo4jDatabaseInfo is already initialised", async () => {
        const resolverDecorator = wrapResolver(wrapResolverArgs);
        const resolver = (root, args, context: Context, info) => {};
        const decoratedResolver = resolverDecorator(resolver);
        await decoratedResolver({}, {}, {} as Context, {} as GraphQLResolveInfo);
        expect(readTransaction).toHaveBeenCalledTimes(0);
        await decoratedResolver({}, {}, {} as Context, {} as GraphQLResolveInfo);
        expect(readTransaction).toHaveBeenCalledTimes(0);
    });

    test("should retry 1 time, with the newer version from the server, if a VersionMismatchError is raised", async () => {
        expect.assertions(5);
        const resolverDecorator = wrapResolver(wrapResolverArgs);
        const resolvedResult = "Resolved value";
        const resolver = jest.fn((root, args, context: Context, info) => {
            const { neo4jDatabaseInfo } = context;
            if (neo4jDatabaseInfo?.version.major === major) {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(neo4jDatabaseInfo?.version).toStrictEqual({ major, minor });
                throw new VersionMismatchError(5, 0);
            }
            expect(neo4jDatabaseInfo?.version).toStrictEqual({ major: 5, minor: 0 });
            return resolvedResult;
        });
        const decoratedResolver = resolverDecorator(resolver);
        const res = await decoratedResolver({}, {}, {} as Context, {} as GraphQLResolveInfo);
        expect(res).toBe(resolvedResult);
        expect(readTransaction).toHaveBeenCalledTimes(0);
        expect(resolver).toHaveBeenCalledTimes(2);
    });

});
