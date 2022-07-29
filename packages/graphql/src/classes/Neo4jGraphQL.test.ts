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

import Neo4jGraphQL, { Neo4jDatabaseInfo } from "./Neo4jGraphQL";

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
    });
});

describe("Neo4jDatabaseInfo", () => {
    test("should construct", () => {
        expect(new Neo4jDatabaseInfo("4.2.1", "enterprise")).toBeInstanceOf(Neo4jDatabaseInfo);
    });

    test("should raise if constructed with an invalid version", () => {
        expect(() => {
            return new Neo4jDatabaseInfo("this_seems_not_valid", "enterprise");
        }).toThrow();
    });

    test("should be possible to initialise it with Neo4jVersion as version", () => {
        const neo4jDatabaseInfo = new Neo4jDatabaseInfo({ major: 4, minor: 5}, "enterprise")
        expect(neo4jDatabaseInfo.version).toStrictEqual({major: 4, minor: 5});
        expect(neo4jDatabaseInfo.edition).toBe("enterprise");
    });
});
