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

import * as CypherBuilder from "../CypherBuilder";

describe("Predicate functions", () => {
    describe("exists", () => {
        test("exists on relationships", () => {
            const movieNode = new CypherBuilder.Node({
                labels: ["Movie"],
            });
            const actorNode = new CypherBuilder.Node({
                labels: ["Actor"],
            });

            const relationship = new CypherBuilder.Relationship({
                source: movieNode,
                target: actorNode,
                type: "ACTED_IN",
            });

            const matchPattern = new CypherBuilder.MatchPattern(relationship, {
                source: { labels: false },
                target: { variable: false },
                relationship: { variable: false },
            });

            const matchQuery = new CypherBuilder.Match(movieNode)
                .where(CypherBuilder.exists(matchPattern))
                .return(movieNode);

            const queryResult = matchQuery.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`
                "MATCH (this0:\`Movie\`)
                WHERE exists((this0)-[:\`ACTED_IN\`]->(:\`Actor\`))
                RETURN this0"
            `);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });
    });
    describe("any", () => {
        it("Complex any statement with list comprehension returning a node", () => {
            const movieNode = new CypherBuilder.Node({
                labels: ["Movie"],
            });
            const genreNode = new CypherBuilder.Node({
                labels: ["Genre"],
            });

            const relationship = new CypherBuilder.Relationship({
                source: movieNode,
                target: genreNode,
                type: "HAS_GENRE",
            });

            const matchPattern = new CypherBuilder.MatchPattern(relationship, {
                source: { labels: false },
                target: { variable: false },
                relationship: { variable: false },
            });
            const matchPattern2 = new CypherBuilder.MatchPattern(relationship, {
                source: { labels: false },
            });

            const matchQuery = new CypherBuilder.Match(movieNode)
                .where(CypherBuilder.exists(matchPattern))
                .where(CypherBuilder.any(matchPattern2, movieNode))
                .return(movieNode);

            const queryResult = matchQuery.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`
                "MATCH (this0:\`Movie\`)
                WHERE (exists((this0)-[:\`HAS_GENRE\`]->(:\`Genre\`))
                AND ANY(this0 IN [(this0)-[this1:\`HAS_GENRE\`]->(this2:\`Genre\`) | this0]
                            ))
                RETURN this0"
            `);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        it("Complex any statement with list comprehension returning an object", () => {
            const movieNode = new CypherBuilder.Node({
                labels: ["Movie"],
            });
            const genreNode = new CypherBuilder.Node({
                labels: ["Genre"],
            });

            const relationship = new CypherBuilder.Relationship({
                source: movieNode,
                target: genreNode,
                type: "HAS_GENRE",
            });

            const matchPattern = new CypherBuilder.MatchPattern(relationship, {
                source: { labels: false },
                target: { variable: false },
                relationship: { variable: false },
            });
            const matchPattern2 = new CypherBuilder.MatchPattern(relationship, {
                source: { labels: false },
            });

            const projectionVariable = new CypherBuilder.Variable({
                node: movieNode,
                relationship,
            });

            const matchQuery = new CypherBuilder.Match(movieNode)
                .where(CypherBuilder.exists(matchPattern))
                .where(CypherBuilder.any(matchPattern2, projectionVariable))
                .return(movieNode);

            const queryResult = matchQuery.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`
                "MATCH (this0:\`Movie\`)
                WHERE (exists((this0)-[:\`HAS_GENRE\`]->(:\`Genre\`))
                AND ANY(var3 IN [(this0)-[this1:\`HAS_GENRE\`]->(this2:\`Genre\`) | { node: this0, relationship: this1 }]
                            ))
                RETURN this0"
            `);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });
    });
});
