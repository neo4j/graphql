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

import * as Cypher from "../CypherBuilder";

describe("CypherBuilder Call Examples", () => {
    test("Wraps a match in call", () => {
        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const matchQuery = new Cypher.Match(movieNode)
            .where(movieNode, { released: new Cypher.Param(1999) })
            .return(movieNode.property("title"));

        const callQuery = new Cypher.Call(matchQuery).return(movieNode.property("title"));
        const queryResult = callQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:\`Movie\`)
                WHERE this0.released = $param0
                RETURN this0.title
            }
            RETURN this0.title"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": 1999,
            }
        `);
    });

    test("Wraps a match in call with an inner with", () => {
        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });
        const titleParam = new Cypher.Param("The Matrix");

        const titleVar = new Cypher.Variable(); // arbitrarily named variable
        // An initial with outside of call, just to define the param and assign to a variable
        const initialWith = new Cypher.With([titleParam, titleVar]);

        const innerMatch = new Cypher.Match(movieNode)
            .where(movieNode, { title: titleVar })
            .return(movieNode.property("title"));

        const callQuery = new Cypher.Call(innerMatch)
            .innerWith(titleVar) // Note that this with is an import with, different to top level WITH
            .return(movieNode.property("title"));

        const queryResult = Cypher.concat(initialWith, callQuery).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "WITH $param0 AS var0
            CALL {
                WITH var0
                MATCH (this1:\`Movie\`)
                WHERE this1.title = var0
                RETURN this1.title
            }
            RETURN this1.title"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "The Matrix",
            }
        `);
    });
});
