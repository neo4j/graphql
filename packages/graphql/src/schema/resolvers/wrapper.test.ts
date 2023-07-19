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

import * as semver from "semver";
import type { GraphQLResolveInfo, GraphQLSchema } from "graphql";
import type { Session, Driver } from "neo4j-driver";
import { Neo4jDatabaseInfo } from "../../classes/Neo4jDatabaseInfo";
import type { Context } from "../../types";
import { wrapSubscription } from "./wrapper";

describe("wrapper test", () => {
    let fakeSession: Session;
    let fakeDriver: Driver;
    const executeRead = jest.fn();
    let wrapResolverArgs: Parameters<typeof wrapResolver>[0];
    let wrapResolver;

    beforeEach(async () => {
        const module = await import("./wrapper");
        wrapResolver = module.wrapResolver;
        jest.resetModules();
        executeRead.mockReset();
        // @ts-ignore
        fakeSession = {
            executeRead: executeRead as any,
            // @ts-ignore
            run: () => ({
                // @ts-ignore
                records: [],
            }),
            lastBookmarks: () => [],
            // @ts-ignore
            close: () => undefined,
        };
        // @ts-ignore
        fakeDriver = {
            // @ts-ignore
            session: () => {
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
            features: {},
        };
    });

    test("should return a function", () => {
        const resolverDecorator = wrapResolver(wrapResolverArgs);
        expect(resolverDecorator).toBeInstanceOf(Function);
    });

    test("should initialise neo4jDatabaseInfo, by using dbms.components, if it's not initialised (no version in the Context)", async () => {
        const resolverDecorator = wrapResolver(wrapResolverArgs);
        const resolvedResult = "Resolved value";
        executeRead.mockReturnValueOnce({
            records: [["4.4.0", "enterprise"]],
        });
        const resolver = jest.fn((_root, _args, context: Context) => {
            expect(context).toBeDefined();
            expect(context.neo4jDatabaseInfo).toBeDefined();
            expect(context.neo4jDatabaseInfo?.edition).toBe("enterprise");
            expect(context.neo4jDatabaseInfo?.version).toEqual(semver.coerce("4.4.0"));
            return resolvedResult;
        });
        const wrappedResolver = resolverDecorator(resolver);
        const res = await wrappedResolver({}, {}, {} as Context, {} as GraphQLResolveInfo);
        expect(res).toBe(resolvedResult);
        expect(executeRead).toHaveBeenCalledTimes(1);
        expect(resolver).toHaveBeenCalledTimes(1);
    });

    test("should NOT initialise neo4jDatabaseInfo if version is present in the Context", async () => {
        const resolverDecorator = wrapResolver(wrapResolverArgs);
        const resolvedResult = "Resolved value";
        executeRead.mockReturnValueOnce({
            records: [["4.5.0", "enterprise"]],
        });
        const contextVersion = new Neo4jDatabaseInfo("1.1.0", "enterprise");
        const resolver = jest.fn((_root, _args, context: Context) => {
            expect(context).toBeDefined();
            expect(context.neo4jDatabaseInfo).toBeDefined();
            expect(context.neo4jDatabaseInfo).toStrictEqual(contextVersion);
            return resolvedResult;
        });
        const wrappedResolver = resolverDecorator(resolver);
        const res = await wrappedResolver(
            {},
            {},
            { neo4jDatabaseInfo: contextVersion } as Context,
            {} as GraphQLResolveInfo
        );
        expect(res).toBe(resolvedResult);
        expect(executeRead).toHaveBeenCalledTimes(0);
        expect(resolver).toHaveBeenCalledTimes(1);
    });

    test("should not invoke dbms.components if neo4jDatabaseInfo is already initialised", async () => {
        const resolverDecorator = wrapResolver(wrapResolverArgs);
        const resolvedResult = "Resolved value";
        const resolver = (_root, _args, context: Context) => {
            expect(context).toBeDefined();
            expect(context.neo4jDatabaseInfo).toBeDefined();
            expect(context.neo4jDatabaseInfo).toEqual(new Neo4jDatabaseInfo("4.3.0", "enterprise"));
            return resolvedResult;
        };

        executeRead.mockReturnValueOnce({
            records: [["4.3.0", "enterprise"]],
        });
        const wrappedResolver = resolverDecorator(resolver);
        const firstRes = await wrappedResolver({}, {}, {} as Context, {} as GraphQLResolveInfo);
        expect(firstRes).toBe(resolvedResult);
        expect(executeRead).toHaveBeenCalledTimes(1);
        executeRead.mockReturnValueOnce({
            records: [["4.4.0", "enterprise"]],
        });
        const secondRes = await wrappedResolver({}, {}, {} as Context, {} as GraphQLResolveInfo);
        expect(secondRes).toBe(resolvedResult);
        expect(executeRead).toHaveBeenCalledTimes(1);
    });
});

describe("subscription wrapper test", () => {
    test("should check JWT in subscription context", async () => {
        const args = {
            features: {
                subscriptions: "any",
            },
            plugins: {
                auth: {
                    isGlobalAuthenticationEnabled: true,
                },
            },
        } as unknown as Parameters<typeof wrapSubscription>[0];

        const resolverDecorator = wrapSubscription(args);
        const resolvedResult = "Resolved value";
        const resolver = (_root, _args, context: Context) => {
            expect(context).toBeDefined();
            expect(context.jwt).toEqual({ sub: "test" });
            return resolvedResult;
        };

        const wrappedResolver = resolverDecorator(resolver);
        const context = { jwt: { sub: "test" } } as Context;
        const res = await wrappedResolver({}, {}, context, {} as GraphQLResolveInfo);
        expect(res).toBe(resolvedResult);
    });
});
