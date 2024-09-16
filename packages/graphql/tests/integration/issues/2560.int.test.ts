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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2560", () => {
    const testHelper = new TestHelper();

    let User: UniqueType;
    let Person: UniqueType;

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should accept resolvers which are an array of objects - one resolver object", async () => {
        User = testHelper.createUniqueType("User");

        const typeDefs = `
            type ${User} {
                firstName: String!
                lastName: String!
                fullName: String! @customResolver(requires: "firstName lastName")
            }
        `;

        // Pass resolvers as an array of objects instead of just an object
        const resolvers = [
            {
                [User.name]: {
                    fullName(source) {
                        return `${source.firstName} ${source.lastName}`;
                    },
                },
            },
        ];

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const mutation = `
            mutation {
                ${User.operations.create}(input: [{ firstName: "Tom", lastName: "Hanks" }]) {
                    ${User.plural} {
                        firstName
                        lastName
                        fullName
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(mutation);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [User.operations.create]: {
                [User.plural]: [
                    {
                        firstName: "Tom",
                        lastName: "Hanks",
                        fullName: "Tom Hanks",
                    },
                ],
            },
        });
    });

    test("should accept resolvers which are an array of objects - two resolver objects", async () => {
        User = testHelper.createUniqueType("User");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = `
            type ${User} {
                firstName: String!
                lastName: String!
                fullName: String! @customResolver(requires: "firstName lastName")
            }

            type ${Person} {
                firstName: String!
                secondName: String! @customResolver(requires: "firstName")
            }
        `;

        // Pass resolvers as an array of objects instead of just an object
        const resolvers = [
            {
                [User.name]: {
                    fullName(source) {
                        return `${source.firstName} ${source.lastName}`;
                    },
                },
            },
            {
                [Person.name]: {
                    secondName(source) {
                        return `${source.firstName.toUpperCase()}`;
                    },
                },
            },
        ];

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const mutation = `
            mutation {
                ${Person.operations.create}(input: [{ firstName: "Tom", }]) {
                    ${Person.plural} {
                        firstName
                        secondName
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(mutation);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Person.operations.create]: {
                [Person.plural]: [
                    {
                        firstName: "Tom",
                        secondName: "TOM",
                    },
                ],
            },
        });
    });
});
