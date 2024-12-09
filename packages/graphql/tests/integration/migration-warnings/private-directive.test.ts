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

import { Neo4jGraphQL } from "../../../src/classes";

describe("deprecated @unique warnings", () => {
    let warn: jest.SpyInstance;

    beforeEach(() => {
        warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        warn.mockReset();
    });

    test("warning on unique usage", async () => {
        const typeDefs = /* GraphQL */ `
            type User @node {
                id: ID! @private
                firstName: String!
            }

            type Movie @node {
                id: ID! @private
                title: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs: typeDefs,
            validate: true,
        });
        await neoSchema.getSchema();
        expect(warn).toHaveBeenCalledWith("Future library versions will not support @private directive.");
    });
});
