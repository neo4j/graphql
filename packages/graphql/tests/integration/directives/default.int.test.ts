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

import { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import neo4j from "../neo4j";

describe("@default directive", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("with primitive fields", () => {
        test("on non-primitive field should throw an error", () => {
            const typeDefs = `
                type User {
                    name: String!
                    location: Point! @default(value: "default")
                }
            `;

            expect(
                () =>
                    new Neo4jGraphQL({
                        typeDefs,
                    })
            ).toThrow("@default directive can only be used on primitive type fields");
        });

        test("with an argument with a type which doesn't match the field should throw an error", () => {
            const typeDefs = `
                type User {
                    name: String! @default(value: 2)
                }
            `;

            expect(
                () =>
                    new Neo4jGraphQL({
                        typeDefs,
                    })
            ).toThrow("Default value for User.name does not have matching type String");
        });

        test("on a DateTime with an invalid value should throw an error", () => {
            const typeDefs = `
                type User {
                    verifiedAt: DateTime! @default(value: "Not a date")
                }
            `;

            expect(
                () =>
                    new Neo4jGraphQL({
                        typeDefs,
                    })
            ).toThrow("Default value for User.verifiedAt is not a valid DateTime");
        });

        test("on primitive field should not throw an error", () => {
            const typeDefs = `
                type User {
                    name: String!
                    location: String! @default(value: "somewhere")
                }
            `;

            expect(
                () =>
                    new Neo4jGraphQL({
                        typeDefs,
                    })
            ).not.toThrow();
        });
    });

    describe("with enum fields", () => {
        test("on enum field with incorrect value should throw an error", () => {
            const typeDefs = `
                type User {
                    name: String!
                    location: Location! @default(value: DIFFERENT)
                }

                enum Location {
                    HERE
                    THERE
                    EVERYWHERE
                }
            `;

            expect(
                () =>
                    new Neo4jGraphQL({
                        typeDefs,
                    })
            ).toThrow("Enum \"Location\" cannot represent value: \"DIFFERENT\"");
        });

        test("on enum field with incorrect type should throw an error", () => {
            const typeDefs = `
                type User {
                    name: String!
                    location: Location! @default(value: 2)
                }

                enum Location {
                    HERE
                    THERE
                    EVERYWHERE
                }
            `;

            expect(
                () =>
                    new Neo4jGraphQL({
                        typeDefs,
                    })
            ).toThrow("@default value on enum fields must be an enum value");
        });

        test("on enum field should not throw an error", () => {
            const typeDefs = `
                type User {
                    name: String!
                    location: Location! @default(value: HERE)
                }

                enum Location {
                    HERE
                    THERE
                    EVERYWHERE
                }
            `;

            expect(
                () =>
                    new Neo4jGraphQL({
                        typeDefs,
                    })
            ).not.toThrow();
        });
    });
});
