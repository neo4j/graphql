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

import * as CypherBuilder from "./CypherBuilder";

describe("CypherBuilder", () => {

    describe("Batch UNWIND Create", () => {
        test("batch create", () => {
            const movies = [
                new CypherBuilder.Map({ title: new CypherBuilder.Literal("Matrix") }),
                new CypherBuilder.Map({ title: new CypherBuilder.Literal("Matrix 2") }),
                new CypherBuilder.Map({ title: new CypherBuilder.Literal("Matrix 3") }),
            ];
            const unwindedMovie = new CypherBuilder.Variable();
            const unwindQuery = new CypherBuilder.Unwind([new CypherBuilder.List(movies), unwindedMovie]);
            const movieNode = new CypherBuilder.Node({
                labels: ["Movie"],
            });

            const createQuery = new CypherBuilder.Create(movieNode)
                .set([movieNode.property("title"), unwindedMovie.property("title")])
                .return(movieNode);

            const simpleBatchCreateQuery = CypherBuilder.concat(unwindQuery, createQuery);
            const queryResult = simpleBatchCreateQuery.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`
                "UNWIND [ { title: \\"Matrix\\" }, { title: \\"Matrix 2\\" }, { title: \\"Matrix 3\\" } ] AS var0
                CREATE (this1:\`Movie\`)
                SET
                    this1.title = var0.title
                RETURN this1"
            `);
            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("nested batch create", () => {
            const movies = [
                new CypherBuilder.Map({
                    title: new CypherBuilder.Literal("Matrix"),
                    actors: new CypherBuilder.List([
                        new CypherBuilder.Map({ name: new CypherBuilder.Literal("Keanu") }),
                    ]),
                }),
                new CypherBuilder.Map({ title: new CypherBuilder.Literal("Matrix 2") }),
                new CypherBuilder.Map({ title: new CypherBuilder.Literal("Matrix 3") }),
            ];
            const unwindedMovie = new CypherBuilder.Variable();
            const unwindQuery = new CypherBuilder.Unwind([new CypherBuilder.List(movies), unwindedMovie]);
            const movieNode = new CypherBuilder.Node({
                labels: ["Movie"],
            });
            const personNode = new CypherBuilder.Node({
                labels: ["Person"],
            });
            const createMovieStatements = new CypherBuilder.Create(movieNode).set([
                movieNode.property("title"),
                unwindedMovie.property("title"),
            ]);

            const subQueryWith = new CypherBuilder.With("*");
            const innerWith = new CypherBuilder.With(unwindedMovie, movieNode);
            const unwindedActor = new CypherBuilder.Variable();
            const innerUnwind = new CypherBuilder.Unwind([unwindedMovie.property("actors"), unwindedActor]);
            const createActorStatements = new CypherBuilder.Create(personNode).set([
                personNode.property("name"),
                unwindedActor.property("name"),
            ]);
            const actedIn = new CypherBuilder.Relationship({ source: personNode, target: movieNode, type: "ACTED_IN" });
            const createactedInRelationship = new CypherBuilder.Merge(actedIn).return(
                CypherBuilder.collect(personNode)
            );
            const subQueryQuery = CypherBuilder.concat(
                innerWith,
                innerUnwind,
                createActorStatements,
                createactedInRelationship
            );
            const subQueryCreate = new CypherBuilder.Call(subQueryQuery);

            const actorProj = new CypherBuilder.Node({
                labels: ["Person"],
            });
            const actorsInMovie = new CypherBuilder.Match(
                new CypherBuilder.Relationship({
                    source: actorProj,
                    target: movieNode,
                    type: "ACTED_IN",
                })
            );
            const subQueryVar = new CypherBuilder.Variable();
            const simpleBatchCreateQuery = CypherBuilder.concat(
                unwindQuery,
                createMovieStatements,
                subQueryWith,
                subQueryCreate,
                new CypherBuilder.With(movieNode),
                new CypherBuilder.Call(
                    CypherBuilder.concat(
                        new CypherBuilder.With(movieNode),
                        actorsInMovie,
                        new CypherBuilder.With([
                            new CypherBuilder.MapProjection(actorProj, [".name"]),
                            subQueryVar,
                        ]).return([CypherBuilder.collect(subQueryVar), subQueryVar])
                    )
                ),
                new CypherBuilder.Return(
                    CypherBuilder.collect(
                        new CypherBuilder.MapProjection(movieNode, [".title"], { actors: subQueryVar })
                    )
                )
            );
            const queryResult = simpleBatchCreateQuery.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`
                "UNWIND [ { title: \\"Matrix\\", actors: [ { name: \\"Keanu\\" } ] }, { title: \\"Matrix 2\\" }, { title: \\"Matrix 3\\" } ] AS var0
                CREATE (this1:\`Movie\`)
                SET
                    this1.title = var0.title
                WITH *
                CALL {
                    WITH var0, this1
                    UNWIND var0.actors AS var2
                    CREATE (this3:\`Person\`)
                    SET
                        this3.name = var2.name
                    MERGE (this3)-[this4:ACTED_IN]->(this1)
                    RETURN collect(this3)
                }
                WITH this1
                CALL {
                    WITH this1
                    MATCH (this6:\`Person\`)-[this5:ACTED_IN]->(this1:\`Movie\`)
                    WITH this6 { .name } AS var7
                    RETURN collect(var7) AS var7
                }
                RETURN collect(this1 { .title, actors: var7 })"
            `);
            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });
    });
});
