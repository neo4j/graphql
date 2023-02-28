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

import * as Cypher from "../Cypher";

describe("CypherBuilder UNWIND", () => {
    test("UNWIND Movies", () => {
        const matrix = new Cypher.Map({ title: new Cypher.Literal("Matrix") });
        const matrix2 = new Cypher.Map({ title: new Cypher.Literal("Matrix 2") });
        const moviesList = new Cypher.List([matrix, matrix2]);
        const unwindQuery = new Cypher.Unwind([moviesList, "batch"]);
        const queryResult = unwindQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(
            `"UNWIND [ { title: \\"Matrix\\" }, { title: \\"Matrix 2\\" } ] AS batch"`,
        );
        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });
});
