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
import type { DocumentNode } from "graphql";
import { CypherRuntime, Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher query options", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL | undefined;
    let env: NodeJS.ProcessEnv;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                ratings: [Float!]!
            }
        `;
    });

    beforeEach(() => {
        env = process.env;
    });

    afterEach(() => {
        process.env = env;
        neoSchema = undefined;
    });

    test("can be set in environment variables", async () => {
        process.env.CYPHER_RUNTIME = "interpreted";

        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
        const { Neo4jGraphQL: Neo4jGraphQLWithEnvironment } = require("../../../src");

        const query = gql`
            {
                movies {
                    title
                }
            }
        `;

        neoSchema = new Neo4jGraphQLWithEnvironment({
            typeDefs,
            config: { queryOptions: { runtime: CypherRuntime.INTERPRETED } },
        });

        const result = await translateQuery(neoSchema!, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER runtime=interpreted
            MATCH (this:\`Movie\`)
            RETURN this { .title } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("set in constructor are overridden by environment variables", async () => {
        process.env.CYPHER_RUNTIME = "interpreted";

        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
        const { Neo4jGraphQL: Neo4jGraphQLWithEnvironment } = require("../../../src");

        const query = gql`
            {
                movies {
                    title
                }
            }
        `;

        neoSchema = new Neo4jGraphQLWithEnvironment({
            typeDefs,
            config: { queryOptions: { runtime: CypherRuntime.SLOTTED } },
        });

        const result = await translateQuery(neoSchema!, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER runtime=slotted
            MATCH (this:\`Movie\`)
            RETURN this { .title } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("set in context override all other definitions", async () => {
        process.env.CYPHER_RUNTIME = "interpreted";

        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
        const { Neo4jGraphQL: Neo4jGraphQLWithEnvironment } = require("../../../src");

        const query = gql`
            {
                movies {
                    title
                }
            }
        `;

        process.env.CYPHER_RUNTIME = "interpreted";

        neoSchema = new Neo4jGraphQLWithEnvironment({
            typeDefs,
            config: { queryOptions: { runtime: CypherRuntime.SLOTTED } },
        });

        const result = await translateQuery(neoSchema!, query, {
            contextValue: { queryOptions: { runtime: CypherRuntime.PIPELINED } },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER runtime=pipelined
            MATCH (this:\`Movie\`)
            RETURN this { .title } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("can be set in the constructor", async () => {
        const query = gql`
            {
                movies {
                    title
                }
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { queryOptions: { runtime: CypherRuntime.INTERPRETED } },
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER runtime=interpreted
            MATCH (this:\`Movie\`)
            RETURN this { .title } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("can be overridden by context variables", async () => {
        const query = gql`
            {
                movies {
                    title
                }
            }
        `;

        process.env.CYPHER_RUNTIME = "interpreted";

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { queryOptions: { runtime: CypherRuntime.SLOTTED } },
        });

        const result = await translateQuery(neoSchema, query, {
            contextValue: { queryOptions: { runtime: CypherRuntime.PIPELINED } },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER runtime=pipelined
            MATCH (this:\`Movie\`)
            RETURN this { .title } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
